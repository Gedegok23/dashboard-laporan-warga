"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { kolam, tahapDari } from "./db";
import { BUCKET, adaSimpanan, unggahGambar } from "./simpanan";
import { NAMA_COOKIE, bacaSesi } from "./sesi";
import { bagianWib } from "./waktu";
import { HARI_BERLAKU, sidik, tokenBaru } from "./tautan";
import type { StatusTindak } from "./tipe";

/**
 * Server Action punya endpoint sendiri yang bisa dipanggil dari rute mana pun,
 * termasuk `/portal` dan `/masuk` yang sengaja dibiarkan publik. Proxy saja
 * tidak cukup: tiap aksi harus memeriksa kredensialnya sendiri.
 *
 * Sumber kebenarannya sekarang cookie sesi, sama seperti proxy, supaya hanya
 * ada satu cara masuk yang perlu dijaga benar.
 */
async function pastikanPetugas() {
  if (!process.env.MEJA_ADMIN_USER || !process.env.MEJA_ADMIN_PASS) {
    throw new Error("meja petugas belum dibuka di server ini");
  }
  const akun = await bacaSesi((await cookies()).get(NAMA_COOKIE)?.value);
  if (!akun) throw new Error("perlu masuk sebagai petugas instansi");
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
    // Menugaskan regu yang sudah memegang laporan ini bukan perubahan. Tanpa
    // pemeriksaan di sini, satu klik ulang menambah baris jejak audit kosong.
    // Server tidak boleh bergantung pada klien untuk menyaringnya.
    const sudah = (await c.query<{ petugas_id: number | null }>(
      "SELECT petugas_id FROM penanganan WHERE laporan_id = $1",
      [ids[0]],
    )).rows[0];
    if ((sudah?.petugas_id ?? null) === (p?.id ?? null)) return;
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
    const ids = await sasaran(c, tiket, seKlaster);
    if (!ids.length) return;
    const sudah = (await c.query<{ jadwal: string | null }>(
      "SELECT jadwal FROM penanganan WHERE laporan_id = $1",
      [ids[0]],
    )).rows[0];
    if ((sudah?.jadwal ?? null) === j) return;
    for (const id of ids) {
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
      // Nama berkas dibaca manusia, jadi jamnya WIB seperti yang tampil di layar.
      const b = bagianWib(new Date());
      const dd = (n: number) => String(n).padStart(2, "0");
      const cap = `${b.tahun}${dd(b.bulan)}${dd(b.tanggal)}-${dd(b.jam)}${dd(b.menit)}`;
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

/** Nomor WA disimpan seragam (62xxx) supaya bisa langsung dipakai mengirim tautan. */
function rapikanWa(mentah: FormDataEntryValue | null) {
  const angka = String(mentah ?? "").replace(/[^0-9+]/g, "").replace(/^\+/, "");
  if (!angka) return null;
  const nomor = angka.startsWith("0") ? `62${angka.slice(1)}` : angka;
  return /^62[0-9]{8,13}$/.test(nomor) ? nomor : null;
}

function teks(muatan: FormData, kunci: string, maks: number) {
  return String(muatan.get(kunci) ?? "").trim().slice(0, maks);
}

/**
 * Tambah atau ubah satu regu lapangan.
 *
 * Satu fungsi untuk keduanya: bedanya cuma ada tidaknya `id`. Kode regu
 * dipakai penugasan sebagai kunci, jadi bentuknya dibatasi dan keunikannya
 * dijaga database, bukan hanya oleh formulir.
 */
export async function petugasSimpanAksi(muatan: FormData) {
  const id = Number(muatan.get("id") ?? 0);
  const kode = teks(muatan, "kode", 20).toUpperCase();
  const nama = teks(muatan, "nama", 150);
  const regu = teks(muatan, "regu", 150);
  const instansi = Number(muatan.get("instansi_id") ?? 0) || null;
  const wa = rapikanWa(muatan.get("wa"));
  const aktif = muatan.get("aktif") !== null;

  if (!/^[A-Z0-9-]{3,20}$/.test(kode)) throw new Error("kode regu hanya huruf, angka, dan tanda hubung");
  if (!nama) throw new Error("nama petugas wajib diisi");
  if (!regu) throw new Error("nama regu wajib diisi");
  if (muatan.get("wa") && !wa) throw new Error("nomor WA tidak dikenali, contoh 0812xxxxxxx");

  await transaksi(async (c) => {
    if (id) {
      await c.query(
        "UPDATE petugas_lapangan SET kode=$2, nama=$3, regu=$4, instansi_id=$5, wa=$6, aktif=$7 WHERE id=$1",
        [id, kode, nama, regu, instansi, wa, aktif],
      );
    } else {
      await c.query(
        "INSERT INTO petugas_lapangan (kode, nama, regu, instansi_id, wa, aktif) VALUES ($1,$2,$3,$4,$5,$6)",
        [kode, nama, regu, instansi, wa, aktif],
      );
    }
  });
  segarkan();
  revalidatePath("/petugas");
}

/**
 * Keluarkan regu dari daftar.
 *
 * Regu yang pernah memegang laporan tidak dihapus, hanya dinonaktifkan:
 * menghapusnya akan memutus jejak siapa yang mengerjakan laporan lama, dan
 * bukti dokumentasi ikut kehilangan pemiliknya.
 */
export async function petugasHapusAksi(muatan: FormData) {
  const id = Number(muatan.get("id") ?? 0);
  if (!id) return;
  await transaksi(async (c) => {
    const dipakai = Number(
      (await c.query<{ n: string }>("SELECT count(*) n FROM penanganan WHERE petugas_id = $1", [id]))
        .rows[0].n,
    );
    if (dipakai > 0) {
      await c.query("UPDATE petugas_lapangan SET aktif = false WHERE id = $1", [id]);
      return;
    }
    await c.query("DELETE FROM petugas_lapangan WHERE id = $1", [id]);
  });
  segarkan();
  revalidatePath("/petugas");
}

/**
 * Terbitkan tautan unggah untuk petugas yang sedang ditugaskan.
 *
 * Yang dikembalikan ke admin adalah tokennya apa adanya, sekali ini saja;
 * database hanya menyimpan hash-nya, jadi tautan yang hilang tidak bisa
 * dipulihkan, hanya bisa diterbitkan ulang.
 *
 * Tautan lama laporan yang sama dicabut lebih dulu: satu laporan cukup punya
 * satu tautan hidup, supaya yang beredar di WhatsApp tidak menumpuk.
 */
export async function tautanLapanganAksi(tiket: string): Promise<string | null> {
  const token = await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l) return null;
    const pet = (await c.query<{ petugas_id: number | null }>(
      "SELECT petugas_id FROM penanganan WHERE laporan_id = $1",
      [l.id],
    )).rows[0];
    if (!pet?.petugas_id) throw new Error("tugaskan petugas lapangan lebih dulu");

    await c.query("UPDATE tautan_lapangan SET dicabut = true WHERE laporan_id = $1 AND dicabut = false", [l.id]);
    const baru = tokenBaru();
    await c.query(
      `INSERT INTO tautan_lapangan (laporan_id, petugas_id, token_hash, kadaluarsa, dibuat_oleh)
       VALUES ($1, $2, $3, now() + ($4 || ' days')::interval, $5)`,
      [l.id, pet.petugas_id, sidik(baru), String(HARI_BERLAKU), PETUGAS],
    );
    await catat(c, l.id, "Tautan lapangan", "Tautan unggah bukti diterbitkan untuk regu lapangan");
    return baru;
  });
  if (!token) return null;

  const h = await headers();
  const inang = h.get("x-forwarded-host") ?? h.get("host");
  const skema = h.get("x-forwarded-proto") ?? "http";
  return `${skema}://${inang}/lapangan/${token}`;
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
    // Laporan yang sudah dinyatakan selesai tidak bisa dimundurkan. Warga sudah
    // dikabari "selesai" dan bukti dokumentasinya sudah tercatat; memundurkan
    // status akan membuat kabar berikutnya bertentangan dengan yang sudah
    // diterima pelapor. Kalau masalahnya muncul lagi, itu laporan baru.
    if (utama.status === "Selesai" && nilai !== "selesai") {
      throw new Error("laporan yang sudah selesai tidak bisa dikembalikan; buat laporan baru bila masalahnya muncul lagi");
    }
    if (nilai === "selesai") {
      const n = (await c.query<{ n: string }>("SELECT count(*) n FROM bukti WHERE laporan_id = $1", [utama.id])).rows[0].n;
      if (Number(n) === 0) throw new Error("laporan tidak bisa ditutup tanpa bukti dokumentasi");
    }
    const baru = STATUS_DB[nilai];
    for (const id of await sasaran(c, tiket, seKlaster)) {
      const lama = (await c.query<{ status: string }>("SELECT status FROM laporan WHERE id = $1", [id])).rows[0].status;
      if (tahapDari(lama) === tahapDari(baru)) continue;
      // Aksi seklaster tidak boleh diam-diam memundurkan laporan yang sudah tuntas.
      if (lama === "Selesai") continue;
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

/**
 * Kabar status disusun dari berkas penanganan, bukan diketik admin.
 *
 * Pelapor bisa punya lebih dari satu laporan berjalan, jadi kabar selalu
 * menyebut nomor dan masalahnya. Tanpa itu, pesan "laporan Anda sedang
 * ditangani" tidak memberi tahu laporan yang mana.
 */
async function tulisKabar(c: Klien, id: number, nilai: StatusTindak) {
  const r = (await c.query<{
    kode_lacak: string;
    judul: string;
    lokasi: string | null;
    instansi: string | null;
    regu: string | null;
    jadwal: string | null;
    bukti: string;
  }>(
    `SELECT l.kode_lacak, l.judul, l.lokasi,
            i.nama AS instansi, pt.regu, p.jadwal,
            (SELECT count(*) FROM bukti b WHERE b.laporan_id = l.id) AS bukti
       FROM laporan l
       LEFT JOIN instansi i ON i.id = l.instansi_id
       LEFT JOIN penanganan p ON p.laporan_id = l.id
       LEFT JOIN petugas_lapangan pt ON pt.id = p.petugas_id
      WHERE l.id = $1`,
    [id],
  )).rows[0];
  if (!r) return;

  const instansi = r.instansi ?? "instansi terkait";
  const oleh = r.regu ? `${r.regu} dari ${instansi}` : instansi;
  // Judul sudah ringkas; lokasi ditambahkan supaya pelapor langsung mengenalinya.
  const tentang = r.lokasi ? `${r.judul}, di ${r.lokasi}` : r.judul;
  const kepala = `Laporan ${r.kode_lacak} (${tentang}).`;

  const teks =
    nilai === "proses"
      ? `${kepala} Sedang ditangani ${oleh}.${r.jadwal ? ` Jadwal turun lapangan ${r.jadwal}.` : ""} Kami kabari lagi begitu pekerjaannya selesai.`
      : nilai === "selesai"
        ? `${kepala} Sudah selesai ditangani ${oleh}, dengan ${r.bukti ?? 0} bukti dokumentasi dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru.`
        : `${kepala} Kembali ke antrean ${instansi} dan sedang menunggu penjadwalan regu.`;

  // Kabar "selesai" membawa satu foto bukti: itu yang paling meyakinkan warga
  // bahwa pekerjaannya benar-benar dikerjakan. Yang dipilih foto terbaru yang
  // memang tersimpan di penyimpanan objek; bukti tanpa berkas dilewati.
  const foto =
    nilai === "selesai"
      ? (await c.query<{ berkas_id: number }>(
          `SELECT berkas_id FROM bukti
            WHERE laporan_id = $1 AND berkas_id IS NOT NULL
            ORDER BY diunggah_at DESC LIMIT 1`,
          [id],
        )).rows[0]?.berkas_id ?? null
      : null;

  await c.query("INSERT INTO kabar (laporan_id, status, teks, berkas_id) VALUES ($1,$2,$3,$4)", [
    id,
    STATUS_DB[nilai],
    teks,
    foto,
  ]);
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

/**
 * Pindahkan laporan ke klaster lain.
 *
 * Hanya berlaku untuk klaster nyata. Klaster sintetis dibentuk aplikasi dari
 * jenis masalah dan tidak punya baris sendiri di database, jadi memindahkan
 * ke sana tidak berarti apa-apa.
 */
export async function kategoriAksi(tiket: string, klasterKode: string) {
  await transaksi(async (c) => {
    const l = await idDari(c, tiket);
    if (!l) return;
    const k = (await c.query<{ id: number; kategori: string }>(
      "SELECT id, kategori FROM klaster WHERE kode = $1",
      [klasterKode],
    )).rows[0];
    if (!k || k.id === l.klaster_id) return;
    await c.query("UPDATE laporan SET klaster_id = $2 WHERE id = $1", [l.id, k.id]);
    await catat(c, l.id, "Kategori dikoreksi", `Dipindahkan ke klaster ${klasterKode} (${k.kategori})`);
  });
  segarkan();
}
