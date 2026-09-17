import { DaftarKlaster } from "@/components/DaftarKlaster";
import { GrafikHarian } from "@/components/GrafikHarian";
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
      <a className="skip" href="#antrean">
        Lewati ke antrean laporan
      </a>

      <TopBar />

      <div className="shell">
        <Rail />

        <main className="antrean" id="antrean">
          <Ringkas />
          <GrafikHarian />
          <Saringan />
          <DaftarKlaster />
        </main>

        <PanelPeriksa />
      </div>

      <Toast />
    </MejaProvider>
  );
}
