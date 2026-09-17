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

export default function Halaman() {
  return (
    <MejaProvider>
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
