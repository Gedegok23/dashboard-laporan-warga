"use client";

import { useRef } from "react";
import { Ikon } from "./Ikon";
import { DupChip, SlaChip, TahapChip } from "./Lencana";
import { useMeja } from "./MejaProvider";
import { Sorot } from "./Sorot";
import {
  aktif,
  bandingKlaster,
  fmtTs,
  klasterCocok,
  laporCocok,
  lewatBatas,
  tahapKlaster,
  terbaruKlaster,
} from "@/lib/logika";
import { gulirKe } from "@/lib/gerak";
import type { Urut } from "@/lib/tipe";

const KOLOM: { urut: Urut; label: string }[] = [
  { urut: "kategori", label: "Kategori laporan" },
  { urut: "instansi", label: "Instansi" },
  { urut: "tahap", label: "Tahap" },
  { urut: "waktu", label: "Terbaru" },
];

export function DaftarKlaster() {
  const { s, kirim } = useMeja();
  const wadah = useRef<HTMLDivElement>(null);

  const tampil = s.data
    .map((k, i) => ({ k, i }))
    .filter((o) => klasterCocok(o.k, s.saring, s.kunci))
    .sort((a, b) => bandingKlaster(a.k, b.k, s.urut, s.arah));

  // Panah atas dan bawah berpindah antar baris yang sedang terlihat.
  function navigasi(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const baris = [...(wadah.current?.querySelectorAll<HTMLButtonElement>(".krow, .klaster.buka .arow") ?? [])];
    const i = baris.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1) return;
    e.preventDefault();
    baris[e.key === "ArrowDown" ? Math.min(baris.length - 1, i + 1) : Math.max(0, i - 1)]?.focus();
  }

  return (
    <section className="daftar" aria-label="Klaster laporan serupa">
      <div className="kolom">
        <span />
        {KOLOM.map((k) => {
          const terpakai = s.urut === k.urut;
          return (
            <button
              key={k.urut}
              type="button"
              className={terpakai ? "terurut" : undefined}
              aria-label={
                terpakai
                  ? `${k.label}, diurutkan ${s.arah === "turun" ? "menurun" : "menaik"}. Balik urutan`
                  : `Urutkan menurut ${k.label}`
              }
              onClick={() => kirim({ t: "urut", kolom: k.urut })}
            >
              {k.label}
              {terpakai ? <Ikon nama={s.arah === "turun" ? "turun" : "naik"} ukuran={14} /> : null}
            </button>
          );
        })}
      </div>

      <div ref={wadah} onKeyDown={navigasi}>
        {tampil.length === 0 ? (
          <div className="kosong">
            <p>Tidak ada klaster yang cocok dengan saringan ini.</p>
            <button className="btn kecil" type="button" onClick={() => kirim({ t: "reset-saring" })}>
              <Ikon nama="atur-ulang" ukuran={17} />
              Bersihkan saringan
            </button>
          </div>
        ) : (
          tampil.map(({ k, i }) => {
            const buka = s.buka.includes(i);
            const anak = k.lapor
              .map((l, j) => ({ l, j }))
              .filter((o) => laporCocok(o.l, k, s.saring, s.kunci));
            const adaLewat = k.lapor.some(lewatBatas);
            const hidup = k.lapor.filter(aktif).length;
            const dialihkan = k.lapor.filter((l) => l.instansi).length;

            return (
              <div className={`klaster${buka ? " buka" : ""}`} key={k.id}>
                <button
                  className="krow"
                  type="button"
                  aria-expanded={buka}
                  onClick={() => kirim({ t: "toggle-klaster", i })}
                >
                  <span className="kar">
                    <Ikon nama="buka" ukuran={18} />
                  </span>
                  <span className="judul">
                    <b>
                      <Sorot teks={k.kategori} kunci={s.kunci} />
                    </b>
                    <span className="meta">
                      <span className="mirip">{k.lapor.length} laporan mirip</span>
                      <span>{hidup} aktif</span>
                      <span>
                        <Sorot teks={k.wilayah} kunci={s.kunci} />
                      </span>
                      <span className="mono">
                        <Sorot teks={k.id} kunci={s.kunci} />
                      </span>
                    </span>
                  </span>
                  <span className="sel">
                    <Sorot teks={k.instansi} kunci={s.kunci} />
                    {dialihkan ? (
                      <>
                        <br />
                        <span style={{ fontSize: 11 }}>{dialihkan} laporan dialihkan</span>
                      </>
                    ) : null}
                  </span>
                  <span className="tahapsel">
                    <TahapChip tahap={tahapKlaster(k)} />
                    {adaLewat ? (
                      <span className="lewat">
                        <Ikon nama="peringatan" ukuran={14} />
                        Ada yang lewat
                      </span>
                    ) : null}
                  </span>
                  <span className="waktu">{fmtTs(terbaruKlaster(k))}</span>
                </button>

                <div className="anak">
                  {anak.map(({ l, j }) => (
                    <button
                      key={l.tiket}
                      className={`arow${l.tahap === 3 ? " selesai" : ""}${l.duplikat ? " duplikat" : ""}`}
                      type="button"
                      aria-current={i === s.kls && j === s.lap}
                      onClick={() => {
                        kirim({ t: "pilih", kls: i, lap: j });
                        if (window.matchMedia("(max-width:900px)").matches) gulirKe("periksa");
                      }}
                    >
                      <span>
                        <span className="tiket">
                          <Sorot teks={l.tiket} kunci={s.kunci} />
                        </span>
                        <span className="isi">
                          <Sorot teks={l.ringkas} kunci={s.kunci} />
                        </span>
                      </span>
                      <span className="tahapsel">
                        <TahapChip tahap={l.tahap} />
                        <SlaChip laporan={l} />
                        <DupChip laporan={l} />
                      </span>
                      <span className="waktu">
                        {l.tgl.slice(0, 6)} {l.jam}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
