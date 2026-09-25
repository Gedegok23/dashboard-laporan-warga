import { DaftarKlaster } from "@/components/DaftarKlaster";
import { GrafikHarian } from "@/components/GrafikHarian";
import { MejaPenanganan } from "@/components/MejaPenanganan";
import { MejaProvider } from "@/components/MejaProvider";
import { PanelPeriksa } from "@/components/PanelPeriksa";
import { Rail } from "@/components/Rail";
import { Ringkas } from "@/components/Ringkas";
import { Saringan } from "@/components/Saringan";
import { Toast } from "@/components/Toast";
import { TopBar } from "@/components/TopBar";
import { daftarPetugas } from "@/lib/petugas";
import { isiMeja } from "@/lib/sumber";

export const revalidate = 0;

export default async function Halaman() {
  const [{ data, langsung }, regu] = await Promise.all([isiMeja(), daftarPetugas()]);
  // Bentuk yang dipakai panel: kode regu jadi id, nomor WA ditulis siap kirim.
  const petugas = regu
    .filter((p) => p.aktif)
    .map((p) => ({
      id: p.kode,
      nama: p.nama,
      regu: p.regu,
      instansi: p.instansi ?? "",
      wa: p.wa ? `+${p.wa}` : "",
    }));

  return (
    <MejaProvider data={data} langsung={langsung} petugas={petugas}>
      <a className="skip" href="#penanganan">
        Lewati ke penanganan laporan
      </a>

      <TopBar />

      <div className="shell">
        <Rail />

        <main className="antrean" id="antrean">
          <Ringkas />

          <MejaPenanganan />

          <section className="meja" id="triase" aria-label="Triase klaster laporan">
            <header className="mejakop">
              <div>
                <h2>Triase klaster</h2>
                <p className="ket">
                  Laporan mirip dikelompokkan bot sebelum diteruskan ke instansi penanggung jawab.
                </p>
              </div>
            </header>
            <Saringan />
            <DaftarKlaster />
          </section>

          <GrafikHarian />
        </main>

        <PanelPeriksa />
      </div>

      <Toast />
    </MejaProvider>
  );
}
