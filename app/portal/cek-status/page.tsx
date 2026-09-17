import type { Metadata } from "next";
import { CekStatus } from "@/components/portal/CekStatus";
import { dataAwal } from "@/lib/data";
import { dataPortal } from "@/lib/logika";

export const metadata: Metadata = {
  title: "Cek Status",
  description: "Lacak satu laporan warga Kota Bandung dengan nomor tiketnya.",
};

export default function HalamanCekStatus() {
  const daftar = dataPortal(dataAwal).flatMap((g) => g.lapor);

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
