import type { Metadata } from "next";
import { Ikon } from "@/components/Ikon";
import { PetaKlien } from "@/components/portal/PetaKlien";
import { JENIS, URUT_JENIS } from "@/lib/kategori";
import { semuaLaporanPortal } from "@/lib/sumber";
import { KOTA } from "@/lib/kota";

export const metadata: Metadata = {
  title: "Peta",
  description: `Sebaran laporan warga Kota ${KOTA} di peta, ditampilkan secara umum.`,
};

export const revalidate = 0;

export default async function HalamanPeta() {
  const daftar = (await semuaLaporanPortal()).filter((l) => l.titik[0] !== 0);
  const jenisAda = URUT_JENIS.filter((j) => daftar.some((l) => l.jenis === j));

  return (
    <div className="pmain">
      <section className="phalaman">
        <h2>Peta Laporan</h2>
        <p className="plead">
          Sebaran {daftar.length} laporan warga di Kota {KOTA}. Titik dibulatkan ke sekitar seratus
          meter, jadi peta menunjukkan ruas jalannya, bukan alamat persis pelapor.
        </p>
      </section>

      <div className="peta-bungkus">
        <PetaKlien daftar={daftar} />
      </div>

      <div className="peta-kunci" aria-label="Keterangan warna peta">
        {jenisAda.map((j) => (
          <span key={j} className={`peta-kunci-item j-${j}`}>
            <span className="peta-titik" aria-hidden />
            <Ikon nama={JENIS[j].ikon} ukuran={14} />
            {JENIS[j].label}
          </span>
        ))}
      </div>

      <p className="pcatatan">
        <Ikon nama="perisai" ukuran={14} />
        Peta ini tidak memuat identitas pelapor. Warna hanya menandai jenis masalah, bukan status
        penanganannya.
      </p>
    </div>
  );
}
