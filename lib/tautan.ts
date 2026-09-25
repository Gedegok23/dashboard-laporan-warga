import { createHash, randomBytes } from "node:crypto";

import { kolam } from "./db";

/**
 * Tautan sekali-pakai untuk petugas lapangan.
 *
 * Petugas tidak punya akun: yang dipegangnya hanya tautan bertoken yang
 * dikirim admin lewat WhatsApp. Token TIDAK disimpan apa adanya; yang masuk
 * database hanya hash-nya, sama seperti kata sandi. Isi tabel bocor pun tidak
 * memberi siapa pun akses.
 *
 * Cakupan satu token sengaja sempit: satu laporan, satu petugas, ada masa
 * berlaku, dan hanya boleh menambah bukti. Menutup laporan tetap wewenang
 * admin di dashboard.
 */

export const HARI_BERLAKU = 7;
/** Batas foto per laporan, supaya satu tautan tidak bisa dipakai membanjiri penyimpanan. */
export const MAKS_BUKTI = 20;
/** Batas pemakaian satu tautan. */
export const MAKS_PAKAI = 20;

export const sidik = (token: string) => createHash("sha256").update(token).digest("hex");

/** 32 byte acak, ditulis base64url supaya aman di dalam URL. */
export const tokenBaru = () => randomBytes(32).toString("base64url");

/** Bentuk token yang sah, diperiksa sebelum menyentuh database. */
export const bentukSah = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export type Tautan = {
  id: number;
  laporanId: number;
  tiket: string;
  judul: string;
  lokasi: string | null;
  petugas: string | null;
  jumlahBukti: number;
  jumlahPakai: number;
};

/**
 * Tautan yang masih berlaku beserta laporannya.
 *
 * Sengaja tidak mengambil apa pun tentang pelapor: nama, nomor, dan catatan
 * kerja internal tidak boleh ikut ke halaman yang dibuka tanpa login.
 */
export async function periksaTautan(token: string): Promise<Tautan | null> {
  if (!bentukSah(token)) return null;
  const p = kolam();
  if (!p) return null;
  const { rows } = await p.query<{
    id: number;
    laporan_id: number;
    kode_lacak: string;
    judul: string;
    lokasi: string | null;
    petugas: string | null;
    bukti: number;
    jumlah_pakai: number;
  }>(
    `SELECT t.id, t.laporan_id, t.jumlah_pakai,
            l.kode_lacak, l.judul, l.lokasi,
            pt.nama AS petugas,
            (SELECT count(*)::int FROM bukti b WHERE b.laporan_id = l.id) AS bukti
       FROM tautan_lapangan t
       JOIN laporan l ON l.id = t.laporan_id
       LEFT JOIN petugas_lapangan pt ON pt.id = t.petugas_id
      WHERE t.token_hash = $1
        AND t.dicabut = false
        AND t.kadaluarsa > now()`,
    [sidik(token)],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    laporanId: r.laporan_id,
    tiket: r.kode_lacak,
    judul: r.judul,
    lokasi: r.lokasi,
    petugas: r.petugas,
    jumlahBukti: r.bukti,
    jumlahPakai: r.jumlah_pakai,
  };
}
