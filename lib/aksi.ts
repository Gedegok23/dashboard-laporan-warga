"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { kolam, tahapDari } from "./db";
import { BUCKET, adaSimpanan, unggahGambar } from "./simpanan";
import type { StatusTindak } from "./tipe";

/**
 * Server Action punya endpoint sendiri yang bisa dipanggil dari rute mana pun,
 * termasuk `/portal` yang sengaja dibiarkan publik. Proxy saja tidak cukup:
 * tiap aksi harus memeriksa kredensialnya sendiri.
 */
async function pastikanPetugas() {
  const user = process.env.MEJA_ADMIN_USER;
  const pass = process.env.MEJA_ADMIN_PASS;
  if (!user || !pass) throw new Error("meja petugas belum dibuka di server ini");
  const h = (await headers()).get("authorization");
  if (!h?.startsWith("Basic ")) throw new Error("perlu masuk sebagai petugas instansi");
  let isi: string;
  try {
    isi = atob(h.slice(6));
  } catch {
    throw new Error("perlu masuk sebagai petugas instansi");
  }
  const i = isi.indexOf(":");
  if (i < 0 || !bandingAman(isi.slice(0, i), user) || !bandingAman(isi.slice(i + 1), pass)) {
    throw new Error("perlu masuk sebagai petugas instansi");
  }
}

function bandingAman(a: string, b: string) {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i += 1) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

/** Penanda tindakan dashboard dipetakan ke kolom `status` milik agent. */
const STATUS_DB: Record<StatusTindak, string> = {
  belum: "Diteruskan",
  proses: "Ditindaklanjuti",
  selesai: "Selesai",
};

const PETUGAS = "Petugas instansi";

type Klien = import("pg").PoolClient;

async function transaksi<T>(kerja: (c: Klien) => Promise<T>): Promise<T | null> {
  await pastikanPetugas();
  const p = kolam();
  if (!p) return null;
  const c = await p.connect();
  try {
    await c.query("BEGIN");
    const hasil = await kerja(c);
    await c.query("COMMIT");
    return hasil;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("[aksi] gagal:", e);
    throw e;
  } finally {
    c.release();
  }
}

const idDari = async (c: Klien, tiket: string) => {
  const r = await c.query<{
    id: number;
    status: string;
    instansi_id: number | null;
    klaster_id: number | null;
    duplikat: boolean | null;
  }>(
    "SELECT id, status, instansi_id, klaster_id, duplikat FROM laporan WHERE kode_lacak = $1",
    [tiket],
  );
  return r.rows[0] ?? null;
};

/**
 * Laporan yang kena satu aksi. Laporan mirip hanya ikut bila petugas
 * menyalakan sakelar seklaster, dan hanya yang sudah lolos verifikasi.
 */
async function sasaran(c: Klien, tiket: string, seKlaster: boolean) {
  const utama = await idDari(c, tiket);
  if (!utama) return [];
  if (!seKlaster || utama.klaster_id === null) return [utama.id];
  const r = await c.query<{ id: number }>(
    `SELECT id FROM laporan
      WHERE klaster_id = $1 AND coalesce(duplikat,false) = false AND status <> 'Menunggu'`,
    [utama.klaster_id],
  );
  return [...new Set([utama.id, ...r.rows.map((x) => x.id)])];
}

const catat = (c: Klien, id: number, baru: string, catatan: string) =>
  c.query(
    "INSERT INTO status_log (laporan_id, status_baru, actor, catatan) VALUES ($1,$2,$3,$4)",
    [id, baru, PETUGAS, catatan],
  );

const segarkan = () => {
  revalidatePath("/");
  revalidatePath("/portal", "layout");
};

export async function tugaskanAksi(tiket: string, petugasKode: string | null, seKlaster: boolean) {
  await transaksi(async (c) => {
    const ids = await sasaran(c, tiket, seKlaster);
    const p = petugasKode
      ? (await c.query<{ id: number; nama: string; regu: string }>(
          "SELECT id, nama, regu FROM petugas_lapangan WHERE kode = $1",
          [petugasKode],
        )).rows[0]
      : null;
    for (const id of ids) {
      await c.query(
        `INSERT INTO penanganan (laporan_id, petugas_id) VALUES ($1,$2)
         ON CONFLICT (laporan_id) DO UPDATE SET petugas_id = $2, updated_at = now()`,
        [id, p?.id ?? null],
      );
      await catat(
        c,
        id,
        "Ditugaskan",
        p ? `${p.nama} dari ${p.regu} dikirim ke lokasi` : "Penugasan lapangan dicabut",
      );
    }
  });
  segarkan();
}

export async function jadwalAksi(tiket: string, nilai: string, seKlaster: boolean) {
  const j = nilai.trim() || null;
  await transaksi(async (c) => {
    for (const id of await sasaran(c, tiket, seKlaster)) {
      await c.query(
        `INSERT INTO penanganan (laporan_id, jadwal) VALUES ($1,$2)
         ON CONFLICT (laporan_id) DO UPDATE SET jadwal = $2, updated_at = now()`,
        [id, j],
      );
      await catat(c, id, "Jadwal lapangan", j ? `Regu dijadwalkan ${j}` : "Jadwal dikosongkan");
    }
  });
  segarkan();
}

export async function catatanAksi(tiket: string, teks: string) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l) return;
    await c.query(
      `INSERT INTO penanganan (laporan_id, catatan) VALUES ($1,$2)
       ON CONFLICT (laporan_id) DO UPDATE SET catatan = $2, updated_at = now()`,
      [l.id, teks],
    );
  });
  // Mengetik catatan tidak menyegarkan halaman: isinya sudah ada di layar.
}

/**
 * Catat bukti lapangan. Berkasnya benar-benar diunggah ke penyimpanan objek;
 * yang masuk database hanya kunci dan metadatanya.
 */
export async function buktiTambahAksi(tiket: string, berkas?: FormData) {
  await pastikanPetugas();
  const p = kolam();
  if (!p) return;

  const isi = berkas?.get("berkas");
  const adaBerkas = isi instanceof File && isi.size > 0;
  if (!adaBerkas && adaSimpanan()) {
    throw new Error("pilih berkas foto dari lapangan lebih dulu");
  }

  const c = await p.connect();
  try {
    await c.query("BEGIN");
    const l = await idDari(c, tiket);
    if (!l) return;
    const pet = (await c.query<{ nama: string }>(
      "SELECT pt.nama FROM penanganan pn JOIN petugas_lapangan pt ON pt.id = pn.petugas_id WHERE pn.laporan_id = $1",
      [l.id],
    )).rows[0];
    if (!pet) throw new Error("bukti hanya bisa dicatat atas nama petugas yang ditugaskan");

    let berkasId: number | null = null;
    let nama: string;
    if (adaBerkas) {
      const hasil = await unggahGambar(
        BUCKET.bukti,
        l.id,
        new Uint8Array(await (isi as File).arrayBuffer()),
        (isi as File).name,
      );
      if (!hasil.ok) throw new Error(hasil.alasan);
      berkasId = hasil.berkasId;
      nama = (isi as File).name;
    } else {
      // Tanpa penyimpanan objek, bukti hanya tercatat sebagai keterangan.
      const d = new Date();
      const cap = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
      nama = `IMG-${cap}-lapangan.jpg`;
    }

    await c.query(
      "INSERT INTO bukti (laporan_id, nama, ukuran, oleh, berkas_id) VALUES ($1,$2,$3,$4,$5)",
      [l.id, nama, adaBerkas ? `${Math.round((isi as File).size / 1024)} KB` : "-", pet.nama, berkasId],
    );
    await catat(c, l.id, "Bukti dokumentasi", `Bukti lapangan diunggah ${pet.nama}`);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
  segarkan();
}

export async function buktiHapusAksi(tiket: string, nama: string) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l) return;
    await c.query("DELETE FROM bukti WHERE laporan_id = $1 AND nama = $2", [l.id, nama]);
    await catat(c, l.id, "Bukti dicabut", `${nama} dikeluarkan dari berkas`);
  });
  segarkan();
}

/**
 * Ubah penanda tindakan. Menutup laporan wajib punya bukti: itulah yang
 * disimpan RDB sebagai tanda pekerjaan lapangan benar-benar selesai.
 */
export async function tindakAksi(tiket: string, nilai: StatusTindak, seKlaster: boolean) {
  await transaksi(async (c) => {
    const utama = await idDari(c, tiket);
    if (!utama || utama.duplikat || utama.status === "Menunggu") return;
    if (nilai === "selesai") {
      const n = (await c.query<{ n: string }>("SELECT count(*) n FROM bukti WHERE laporan_id = $1", [utama.id])).rows[0].n;
      if (Number(n) === 0) throw new Error("laporan tidak bisa ditutup tanpa bukti dokumentasi");
    }
    const baru = STATUS_DB[nilai];
    for (const id of await sasaran(c, tiket, seKlaster)) {
      const lama = (await c.query<{ status: string }>("SELECT status FROM laporan WHERE id = $1", [id])).rows[0].status;
      if (tahapDari(lama) === tahapDari(baru)) continue;
      await c.query(
        `UPDATE laporan SET status = $2::varchar,
                resolved_at = CASE WHEN $2::varchar = 'Selesai' THEN now() ELSE NULL::timestamp END
          WHERE id = $1`,
        [id, baru],
      );
      await catat(c, id, baru, `Status diubah dari ${lama} menjadi ${baru}`);
      await tulisKabar(c, id, nilai);
    }
  });
  segarkan();
}

/** Kabar status disusun dari berkas penanganan, bukan diketik admin. */
async function tulisKabar(c: Klien, id: number, nilai: StatusTindak) {
  const r = (await c.query<{ instansi: string | null; regu: string | null; jadwal: string | null; bukti: string }>(
    `SELECT i.nama AS instansi, pt.regu, p.jadwal,
            (SELECT count(*) FROM bukti b WHERE b.laporan_id = l.id) AS bukti
       FROM laporan l
       LEFT JOIN instansi i ON i.id = l.instansi_id
       LEFT JOIN penanganan p ON p.laporan_id = l.id
       LEFT JOIN petugas_lapangan pt ON pt.id = p.petugas_id
      WHERE l.id = $1`,
    [id],
  )).rows[0];
  const instansi = r?.instansi ?? "instansi terkait";
  const oleh = r?.regu ? `${r.regu} dari ${instansi}` : instansi;
  const teks =
    nilai === "proses"
      ? `Laporan Anda sedang ditangani ${oleh}.${r?.jadwal ? ` Jadwal turun lapangan ${r.jadwal}.` : ""} Kami kabari lagi begitu pekerjaannya selesai.`
      : nilai === "selesai"
        ? `Laporan Anda sudah selesai ditangani ${oleh}, dengan ${r?.bukti ?? 0} bukti dokumentasi dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru.`
        : `Laporan Anda kembali ke antrean ${instansi} dan sedang menunggu penjadwalan regu.`;
  await c.query("INSERT INTO kabar (laporan_id, status, teks) VALUES ($1,$2,$3)", [id, STATUS_DB[nilai], teks]);
}

export async function kirimUmpanAksi(tiket: string, teks: string, seKlaster: boolean) {
  const isi = teks.trim();
  if (!isi) return;
  await transaksi(async (c) => {
    const utama = await idDari(c, tiket);
    if (!utama) return;
    const ids =
      seKlaster && utama.klaster_id !== null
        ? (await c.query<{ id: number }>("SELECT id FROM laporan WHERE klaster_id = $1", [utama.klaster_id])).rows.map((x) => x.id)
        : [utama.id];
    const oleh = `Admin ${(await c.query<{ nama: string }>("SELECT i.nama FROM laporan l LEFT JOIN instansi i ON i.id = l.instansi_id WHERE l.id = $1", [utama.id])).rows[0]?.nama ?? "instansi"}`;
    for (const id of ids) {
      await c.query("INSERT INTO umpan (laporan_id, teks, oleh, penerima) VALUES ($1,$2,$3,$4)", [id, isi, oleh, ids.length]);
      await catat(c, id, "Umpan balik", `Balasan instansi terbit di portal untuk ${ids.length} pelapor`);
    }
  });
  segarkan();
}

/* ---------- jalur triase ---------- */

/** Urutan status yang dilalui laporan di meja petugas. */
const URUT = ["Menunggu", "Diteruskan", "Ditindaklanjuti", "Selesai"];

export async function lanjutAksi(tiket: string) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    // Laporan duplikat tidak dikerjakan sebagai tiket sendiri.
    if (!l || l.duplikat) return;
    const ke = URUT[tahapDari(l.status) + 1];
    if (!ke) return;
    if (ke === "Selesai") {
      const n = (await c.query<{ n: string }>("SELECT count(*) n FROM bukti WHERE laporan_id = $1", [l.id])).rows[0].n;
      if (Number(n) === 0) throw new Error("laporan tidak bisa ditutup tanpa bukti dokumentasi");
    }
    await c.query(
      `UPDATE laporan SET status = $2::varchar,
              resolved_at = CASE WHEN $2::varchar = 'Selesai' THEN now() ELSE NULL::timestamp END
        WHERE id = $1`,
      [l.id, ke],
    );
    await catat(c, l.id, ke, `Status dinaikkan dari ${l.status} menjadi ${ke}`);
    if (ke === "Ditindaklanjuti") await tulisKabar(c, l.id, "proses");
    if (ke === "Selesai") await tulisKabar(c, l.id, "selesai");
  });
  segarkan();
}

export async function mundurAksi(tiket: string) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l || l.duplikat) return;
    const ke = URUT[tahapDari(l.status) - 1];
    if (!ke) return;
    await c.query("UPDATE laporan SET status = $2, resolved_at = NULL WHERE id = $1", [l.id, ke]);
    await catat(c, l.id, ke, `Status dikembalikan dari ${l.status} menjadi ${ke}`);
  });
  segarkan();
}

export async function duplikatAksi(tiket: string, hapus: boolean) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l) return;
    await c.query("UPDATE laporan SET duplikat = $2 WHERE id = $1", [l.id, !hapus]);
    await catat(
      c,
      l.id,
      hapus ? "Tanda duplikat dicabut" : "Ditandai duplikat",
      hapus ? "Laporan kembali ke antrean aktif" : "Laporan dinilai sama dengan laporan lain",
    );
  });
  segarkan();
}

export async function instansiAksi(tiket: string, nama: string) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l) return;
    const i = (await c.query<{ id: number }>("SELECT id FROM instansi WHERE nama = $1", [nama])).rows[0];
    if (!i || i.id === l.instansi_id) return;
    // Trigger `laporan_jenis_otomatis` ikut menyesuaikan jenis masalahnya.
    await c.query("UPDATE laporan SET instansi_id = $2 WHERE id = $1", [l.id, i.id]);
    await catat(c, l.id, "Instansi dialihkan", `Penanggung jawab menjadi ${nama}`);
  });
  segarkan();
}
