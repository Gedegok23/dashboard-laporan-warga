import type { Metadata } from "next";
import { CekStatus } from "@/components/portal/CekStatus";
import { semuaLaporanPortal } from "@/lib/sumber";

export const metadata: Metadata = {
  title: "Cek Status",
  description: "Lacak satu laporan warga Kota Bandung dengan nomor tiketnya.",
};

export const revalidate = 0;

export default async function HalamanCekStatus() {
  const daftar = await semuaLaporanPortal();

  return (
    <div className="pmain sempit">
      <section className="phalaman">
        <h2>Cek Status</h2>
        <p className="plead">
          Punya nomor tiket? Masukkan di sini untuk langsung melihat sampai langkah mana laporan
          Anda diproses, tanpa perlu menelusuri daftar.
        </p>
      </section>

      <CekStatus daftar={daftar} />
    </div>
  );
}
