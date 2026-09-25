import type { Metadata } from "next";
import Link from "next/link";

import { Ikon } from "@/components/Ikon";
import { petugasHapusAksi, petugasSimpanAksi } from "@/lib/aksi";
import { pakaiDatabase } from "@/lib/db";
import { daftarInstansi, daftarPetugas } from "@/lib/petugas";

export const revalidate = 0;
export const metadata: Metadata = { title: "Regu lapangan | Meja Laporan Warga" };

/**
 * Pengelolaan regu lapangan.
 *
 * Daftar ini yang dipakai penugasan dan yang menentukan atas nama siapa bukti
 * dokumentasi dicatat, jadi tabelnya harus bisa diurus tanpa membuka SQL.
 *
 * Halaman ada di balik Basic Auth yang sama dengan meja (lihat proxy.ts).
 */
export default async function Petugas(props: PageProps<"/petugas">) {
  const { ubah } = await props.searchParams;
  if (!pakaiDatabase()) {
    return (
      <main className="pmain sempit">
        <h1>Regu lapangan</h1>
        <p>Halaman ini butuh sambungan database. Setel `MEJA_DATABASE_URL` lebih dulu.</p>
      </main>
    );
  }

  const [petugas, instansi] = await Promise.all([daftarPetugas(), daftarInstansi()]);
  const diubah = petugas.find((p) => String(p.id) === String(ubah)) ?? null;

  return (
    <main className="pmain sempit petugas">
      <Link className="kembali" href="/">
        <Ikon nama="mundur" ukuran={15} /> Kembali ke meja
      </Link>
      <h1>Regu lapangan</h1>
      <p className="ket">
        Daftar ini yang muncul saat menugaskan laporan, dan yang menentukan atas nama siapa bukti
        dokumentasi tercatat. Nomor WA dipakai untuk mengirim tautan unggah bukti.
      </p>

      <form className="petugasform" action={petugasSimpanAksi} key={diubah?.id ?? "baru"}>
        <h2>{diubah ? `Ubah ${diubah.nama}` : "Tambah regu"}</h2>
        {diubah ? <input type="hidden" name="id" value={diubah.id} /> : null}

        <label className="isian">
          <span className="label">Kode regu</span>
          <input name="kode" required maxLength={20} placeholder="PTG-11" defaultValue={diubah?.kode ?? ""} />
        </label>

        <label className="isian">
          <span className="label">Nama petugas</span>
          <input name="nama" required maxLength={150} defaultValue={diubah?.nama ?? ""} />
        </label>

        <label className="isian">
          <span className="label">Peran / regu</span>
          <input
            name="regu"
            required
            maxLength={150}
            placeholder="Regu tambal cepat 2"
            defaultValue={diubah?.regu ?? ""}
          />
        </label>

        <label className="isian">
          <span className="label">Instansi</span>
          <select name="instansi_id" defaultValue={diubah?.instansiId ?? ""}>
            <option value="">Belum ditentukan</option>
            {instansi.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nama}
              </option>
            ))}
          </select>
        </label>

        <label className="isian">
          <span className="label">Nomor WA</span>
          <input name="wa" maxLength={40} placeholder="0812xxxxxxx" defaultValue={diubah?.wa ?? ""} />
        </label>

        <label className="pilihaktif">
          <input type="checkbox" name="aktif" defaultChecked={diubah ? diubah.aktif : true} />
          <span>Aktif, boleh ditugaskan</span>
        </label>

        <div className="barisaksi">
          <button className="btn utama" type="submit">
            <Ikon nama="selesai" ukuran={16} />
            {diubah ? "Simpan perubahan" : "Tambah regu"}
          </button>
          {diubah ? (
            <Link className="btn" href="/petugas">
              Batal
            </Link>
          ) : null}
        </div>
      </form>

      <table className="petugastabel">
        <caption className="sr">Daftar regu lapangan</caption>
        <thead>
          <tr>
            <th scope="col">Kode</th>
            <th scope="col">Nama</th>
            <th scope="col">Peran</th>
            <th scope="col">Instansi</th>
            <th scope="col">WA</th>
            <th scope="col">Tugas</th>
            <th scope="col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {petugas.length === 0 ? (
            <tr>
              <td colSpan={7}>Belum ada regu lapangan. Tambahkan lewat formulir di atas.</td>
            </tr>
          ) : (
            petugas.map((p) => (
              <tr key={p.id} className={p.aktif ? undefined : "nonaktif"}>
                <td className="mono">{p.kode}</td>
                <td>{p.nama}</td>
                <td>{p.regu}</td>
                <td>{p.instansi ?? "—"}</td>
                <td className="mono">{p.wa ? `+${p.wa}` : "—"}</td>
                <td>{p.tugas}</td>
                <td className="barisaksi">
                  <Link className="taut" href={`/petugas?ubah=${p.id}`}>
                    Ubah
                  </Link>
                  <form action={petugasHapusAksi}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="taut" type="submit">
                      {p.tugas > 0 ? "Nonaktifkan" : "Hapus"}
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="bantu">
        Regu yang pernah memegang laporan tidak dihapus, hanya dinonaktifkan. Menghapusnya akan
        memutus jejak siapa yang mengerjakan laporan lama beserta pemilik bukti dokumentasinya.
      </p>
    </main>
  );
}
