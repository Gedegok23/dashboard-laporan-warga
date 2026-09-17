import type { Metadata } from "next";
import { PortalDaftar } from "@/components/PortalDaftar";
import { dataAwal } from "@/lib/data";
import { dataPortal } from "@/lib/logika";

export const metadata: Metadata = {
  title: "Daftar Laporan",
  description: "Semua laporan warga Kota Bandung beserta status penanganannya.",
};

export default function DaftarLaporan() {
  // Data dibentuk di server lebih dulu. Hanya kolom yang memang tampil di
  // halaman publik yang ikut terkirim, jadi identitas pelapor, teks mentah,
  // catatan kerja instansi, dan koordinat tidak pernah sampai ke peramban.
  const kelompok = dataPortal(dataAwal);

  return (
    <div className="pmain">
      <section className="phalaman">
        <h2>Daftar Laporan</h2>
        <p className="plead">
          Cari nomor tiket atau nama jalan untuk melihat siapa yang menangani laporan Anda dan
          sampai langkah mana prosesnya.
        </p>
      </section>

      <PortalDaftar kelompok={kelompok} />
    </div>
  );
}
