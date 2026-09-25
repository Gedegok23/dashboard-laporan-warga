"use server";

import { revalidatePath } from "next/cache";

import { kolam } from "@/lib/db";
import { BUCKET, unggahGambar } from "@/lib/simpanan";
import { MAKS_BUKTI, MAKS_PAKAI, bentukSah, sidik } from "@/lib/tautan";

export type HasilKirim = { ok: boolean; pesan: string };

/**
 * Terima bukti dari petugas lapangan.
 *
 * Halaman ini terbuka tanpa login, jadi tokennya yang jadi kredensial dan
 * setiap pemeriksaan dilakukan di sini, bukan di halaman. Baris tautan dikunci
 * (FOR UPDATE) selama transaksi supaya dua unggahan berbarengan tidak
 * melewati batas pemakaian.
 *
 * Yang boleh dilakukan token ini hanya satu: menambah bukti pada satu laporan.
 * Status laporan tidak disentuh sama sekali; penilaian selesai tetap di admin.
 */
export async function kirimBuktiAksi(token: string, muatan: FormData): Promise<HasilKirim> {
  if (!bentukSah(token)) return { ok: false, pesan: "Tautan tidak dikenali." };

  const isi = muatan.get("berkas");
  if (!(isi instanceof File) || isi.size === 0) {
    return { ok: false, pesan: "Pilih atau ambil foto lebih dulu." };
  }

  const p = kolam();
  if (!p) return { ok: false, pesan: "Server belum tersambung ke database." };

  const c = await p.connect();
  try {
    await c.query("BEGIN");
    const t = (await c.query<{
      id: number;
      laporan_id: number;
      jumlah_pakai: number;
      petugas: string | null;
    }>(
      `SELECT t.id, t.laporan_id, t.jumlah_pakai, pt.nama AS petugas
         FROM tautan_lapangan t
         LEFT JOIN petugas_lapangan pt ON pt.id = t.petugas_id
        WHERE t.token_hash = $1 AND t.dicabut = false AND t.kadaluarsa > now()
        FOR UPDATE OF t`,
      [sidik(token)],
    )).rows[0];
    if (!t) {
      await c.query("ROLLBACK");
      return { ok: false, pesan: "Tautan sudah tidak berlaku. Minta tautan baru ke admin." };
    }
    if (t.jumlah_pakai >= MAKS_PAKAI) {
      await c.query("ROLLBACK");
      return { ok: false, pesan: "Tautan ini sudah dipakai terlalu sering. Minta tautan baru ke admin." };
    }

    const jumlah = Number(
      (await c.query<{ n: string }>("SELECT count(*) n FROM bukti WHERE laporan_id = $1", [t.laporan_id]))
        .rows[0].n,
    );
    if (jumlah >= MAKS_BUKTI) {
      await c.query("ROLLBACK");
      return { ok: false, pesan: `Laporan ini sudah punya ${MAKS_BUKTI} bukti, sudah cukup.` };
    }

    const hasil = await unggahGambar(
      BUCKET.bukti,
      t.laporan_id,
      new Uint8Array(await isi.arrayBuffer()),
      isi.name,
    );
    if (!hasil.ok) {
      await c.query("ROLLBACK");
      return { ok: false, pesan: hasil.alasan };
    }

    const oleh = t.petugas ? `${t.petugas} (lapangan)` : "Regu lapangan";
    await c.query(
      "INSERT INTO bukti (laporan_id, nama, ukuran, oleh, berkas_id) VALUES ($1,$2,$3,$4,$5)",
      [t.laporan_id, isi.name, `${Math.round(isi.size / 1024)} KB`, oleh, hasil.berkasId],
    );
    await c.query(
      "INSERT INTO status_log (laporan_id, status_baru, actor, catatan) VALUES ($1,$2,$3,$4)",
      [t.laporan_id, "Bukti dokumentasi", oleh, "Bukti dikirim langsung dari lapangan"],
    );
    await c.query(
      "UPDATE tautan_lapangan SET jumlah_pakai = jumlah_pakai + 1, dipakai_terakhir = now() WHERE id = $1",
      [t.id],
    );
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("[lapangan] gagal menerima bukti:", e);
    return { ok: false, pesan: "Foto gagal dikirim. Coba lagi beberapa saat lagi." };
  } finally {
    c.release();
  }

  // Meja admin ikut menampilkan bukti baru ini.
  revalidatePath("/");
  revalidatePath(`/lapangan/${token}`);
  return { ok: true, pesan: "Foto terkirim. Terima kasih." };
}
