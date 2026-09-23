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
import { isiMeja } from "@/lib/sumber";

export const revalidate = 0;

export default async function Halaman() {
  const { data, langsung } = await isiMeja();

  return (
    <MejaProvider data={data} langsung={langsung}>
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
