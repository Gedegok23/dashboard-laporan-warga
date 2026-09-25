import { kolam } from "./db";

/**
 * Daftar regu lapangan, dibaca dari database.
 *
 * Sebelum ini daftar petugas hidup sebagai data contoh di kode, sementara
 * penugasan mencarinya di tabel. Dua sumber yang tidak pernah disamakan, dan
 * memilih petugas yang tidak ada di tabel membuat penugasan gagal tanpa pesan.
 * Tabel inilah sumbernya sekarang.
 */

export type PetugasBaris = {
  id: number;
  kode: string;
  nama: string;
  regu: string;
  instansiId: number | null;
  instansi: string | null;
  wa: string | null;
  aktif: boolean;
  /** Berapa laporan yang sedang dipegang. Petugas yang masih memegang tugas tidak dihapus. */
  tugas: number;
};

export async function daftarPetugas(): Promise<PetugasBaris[]> {
  const p = kolam();
  if (!p) return [];
  const { rows } = await p.query<{
    id: number;
    kode: string;
    nama: string;
    regu: string;
    instansi_id: number | null;
    instansi: string | null;
    wa: string | null;
    aktif: boolean;
    tugas: number;
  }>(
    `SELECT pt.id, pt.kode, pt.nama, pt.regu, pt.instansi_id, pt.wa,
            coalesce(pt.aktif, true) AS aktif,
            i.nama AS instansi,
            (SELECT count(*)::int FROM penanganan pn WHERE pn.petugas_id = pt.id) AS tugas
       FROM petugas_lapangan pt
       LEFT JOIN instansi i ON i.id = pt.instansi_id
      ORDER BY coalesce(pt.aktif, true) DESC, i.nama NULLS LAST, pt.nama`,
  );
  return rows.map((r) => ({
    id: r.id,
    kode: r.kode,
    nama: r.nama,
    regu: r.regu,
    instansiId: r.instansi_id,
    instansi: r.instansi,
    wa: r.wa,
    aktif: r.aktif,
    tugas: r.tugas,
  }));
}

export type InstansiBaris = { id: number; nama: string };

export async function daftarInstansi(): Promise<InstansiBaris[]> {
  const p = kolam();
  if (!p) return [];
  const { rows } = await p.query<InstansiBaris>("SELECT id, nama FROM instansi ORDER BY id");
  return rows;
}
