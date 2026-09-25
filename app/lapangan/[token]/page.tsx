import type { Metadata } from "next";

import { Ikon } from "@/components/Ikon";
import { FormBukti } from "@/components/lapangan/FormBukti";
import { MEREK } from "@/lib/merek";
import { periksaTautan } from "@/lib/tautan";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "Kirim bukti lapangan",
  // Halaman bertoken tidak boleh nyangkut di mesin pencari.
  robots: { index: false, follow: false },
};

/**
 * Halaman petugas lapangan.
 *
 * Dibuka tanpa login, cukup dari tautan yang dikirim admin lewat WhatsApp.
 * Karena itu isinya dibatasi pada yang perlu untuk mengerjakan dan memotret:
 * judul, lokasi, dan nama petugas. Identitas pelapor, nomor kontaknya, dan
 * catatan kerja internal TIDAK pernah ditampilkan di sini.
 */
export default async function Lapangan(props: PageProps<"/lapangan/[token]">) {
  const { token } = await props.params;
  const t = await periksaTautan(token);

  if (!t) {
    return (
      <main className="lapangan">
        <h1>Tautan tidak berlaku</h1>
        <p>
          Tautan ini sudah kedaluwarsa, dicabut, atau salah ketik. Minta tautan baru kepada admin
          instansi yang menugaskan Anda.
        </p>
      </main>
    );
  }

  return (
    <main className="lapangan">
      <p className="merek">{MEREK.nama}</p>
      <h1>Kirim bukti pengerjaan</h1>

      <dl className="lapangan-rinci">
        <dt>Laporan</dt>
        <dd className="mono">{t.tiket}</dd>
        <dt>Masalah</dt>
        <dd>{t.judul}</dd>
        {t.lokasi ? (
          <>
            <dt>Lokasi</dt>
            <dd>{t.lokasi}</dd>
          </>
        ) : null}
        {t.petugas ? (
          <>
            <dt>Petugas</dt>
            <dd>{t.petugas}</dd>
          </>
        ) : null}
      </dl>

      <p className="bantu">
        {t.jumlahBukti === 0
          ? "Belum ada foto yang masuk untuk laporan ini."
          : `Sudah ada ${t.jumlahBukti} foto yang masuk untuk laporan ini.`}
      </p>

      <FormBukti token={token} sudah={t.jumlahBukti} />

      <p className="bantu">
        <Ikon nama="dokumen" ukuran={14} /> Laporan dinyatakan selesai oleh admin instansi setelah
        memeriksa foto ini. Pelapor akan dikabari otomatis.
      </p>
    </main>
  );
}
