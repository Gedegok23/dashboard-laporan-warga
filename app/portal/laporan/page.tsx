import type { Metadata } from "next";
import { PortalDaftar } from "@/components/PortalDaftar";
import { isiPortal } from "@/lib/sumber";

export const metadata: Metadata = {
  title: "Daftar Laporan",
  description: "Semua laporan warga Kota Bandung beserta status penanganannya.",
};

export const revalidate = 0;

export default async function DaftarLaporan() {
  const { kelompok } = await isiPortal();

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
