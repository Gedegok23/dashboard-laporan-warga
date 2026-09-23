import type { Metadata } from "next";
import { Ikon } from "@/components/Ikon";
import { GrafikMasuk } from "@/components/portal/GrafikMasuk";
import { JENIS } from "@/lib/kategori";
import { sebaranJenis } from "@/lib/logika";
import { isiHarian, isiMeja, isiPortal } from "@/lib/sumber";
import type { Jenis } from "@/lib/tipe";
import { KOTA } from "@/lib/kota";

export const metadata: Metadata = {
  title: "Tren & Statistik",
  description: `Laporan warga Kota ${KOTA} yang masuk per hari dan sebarannya menurut jenis masalah.`,
};

export const revalidate = 0;

export default async function Tren() {
  const [{ data }, { harian }, { kelompok }] = await Promise.all([isiMeja(), isiHarian(), isiPortal()]);
  const semua = kelompok.flatMap((g) => g.lapor);
  const h = { total: semua.length, clear: semua.filter((l) => l.status === "clear").length };
  const sebaran = sebaranJenis(data);
  const maks = Math.max(1, ...sebaran.map((s) => s.total));
  const puncak = harian.reduce((a, b) => (b[1] > a[1] ? b : a));
  const totalMasuk = harian.reduce((n, d) => n + d[1], 0);

  return (
    <div className="pmain">
      <section className="phalaman">
        <h2>Tren &amp; Statistik</h2>
        <p className="plead">
          Berapa banyak laporan yang masuk tiap hari, dan masalah jenis apa yang paling sering
          dilaporkan warga.
        </p>
      </section>

      <section className="pangka-baris" aria-label="Angka utama">
        <div>
          <span className="pangka-ikon" aria-hidden>
            <Ikon nama="kotak-masuk" ukuran={19} />
          </span>
          <b>{totalMasuk}</b>
          <span>Laporan masuk, 14 hari</span>
        </div>
        <div>
          <span className="pangka-ikon" aria-hidden>
            <Ikon nama="naik" ukuran={19} />
          </span>
          <b>{puncak[1]}</b>
          <span>Hari tersibuk, {puncak[0]}</span>
        </div>
        <div>
          <span className="pangka-ikon" aria-hidden>
            <Ikon nama="selesai" ukuran={19} />
          </span>
          <b>{h.clear}</b>
          <span>Selesai dari {h.total} laporan di portal</span>
        </div>
      </section>

      <section className="panel-grafik">
        <header>
          <h3>Laporan masuk per hari</h3>
          <p>Seluruh kanal Kota {KOTA}, 14 hari terakhir.</p>
        </header>
        <GrafikMasuk harian={harian} />
      </section>

      <section className="panel-grafik">
        <header>
          <h3>Laporan menurut jenis masalah</h3>
          <p>
            Dihitung dari laporan yang tercatat di portal, tidak termasuk laporan yang ditandai
            sama dengan laporan lain.
          </p>
        </header>

        <ul className="batang-jenis">
          {sebaran.map((s) => {
            const j = s.jenis as Jenis;
            return (
              <li key={s.jenis} className={`j-${s.jenis}`}>
                <span className="bj-nama">
                  <span className={`jenis-bulat j-${s.jenis}`} aria-hidden>
                    <Ikon nama={JENIS[j].ikon} ukuran={14} />
                  </span>
                  {JENIS[j].label}
                </span>
                <span className="bj-jalur">
                  <span className="bj-isi" style={{ width: `${Math.round((s.total / maks) * 100)}%` }} />
                </span>
                <span className="bj-angka mono">
                  {s.total}
                  <span className="bj-selesai">{s.selesai} selesai</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="pcatatan">
        <Ikon nama="info" ukuran={14} />
        Angka harian mencakup seluruh laporan yang masuk ke kanal kota, sedangkan angka jenis
        masalah dihitung dari laporan yang sudah tercatat di portal ini.
      </p>
    </div>
  );
}
