"use client";

import { useState } from "react";
import { Ikon } from "./Ikon";
import { harian } from "@/lib/data";

const W = 560;
const H = 96;
const KIRI = 26;
const KANAN = 6;
const ATAS = 10;
const BAWAH = 20;
const LEBAR_PLOT = W - KIRI - KANAN;
const TINGGI_PLOT = H - ATAS - BAWAH;

const maks = Math.max(...harian.map((d) => d[1]));
const langkah = LEBAR_PLOT / harian.length;
const lebarBar = langkah - 4;

/** Batang dengan ujung data membulat, kaki menempel pada garis nol. */
function jalurBatang(x: number, y: number, tinggi: number) {
  const r = Math.min(4, lebarBar / 2, tinggi);
  return [
    `M${x} ${y + tinggi}`,
    `L${x} ${y + r}`,
    `Q${x} ${y} ${x + r} ${y}`,
    `L${x + lebarBar - r} ${y}`,
    `Q${x + lebarBar} ${y} ${x + lebarBar} ${y + r}`,
    `L${x + lebarBar} ${y + tinggi}`,
    "Z",
  ].join(" ");
}

const batang = harian.map(([hari, nilai], i) => {
  const tinggi = Math.max(3, (nilai / maks) * TINGGI_PLOT);
  const x = KIRI + i * langkah + 2;
  const y = ATAS + TINGGI_PLOT - tinggi;
  return { hari, nilai, x, y, tinggi, jalur: jalurBatang(x, y, tinggi), terakhir: i === harian.length - 1 };
});

const puncak = harian.reduce((a, b) => (b[1] > a[1] ? b : a));

export function GrafikHarian() {
  const [aktif, setAktif] = useState<number | null>(null);
  const b = aktif === null ? null : batang[aktif];

  const terakhir = harian[harian.length - 1];

  return (
    <details className="grafik" open>
      <summary>
        <Ikon nama="buka" ukuran={16} />
        <h2>Laporan masuk per hari</h2>
        <span className="ket">
          {terakhir[1]} laporan hari ini, puncak 14 hari {puncak[0]} dengan {puncak[1]} laporan
        </span>
      </summary>

      <div className="plot" onMouseLeave={() => setAktif(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Grafik batang jumlah laporan masuk seluruh kanal selama 14 hari terakhir."
        >
          <line
            x1={KIRI - 6}
            y1={ATAS + TINGGI_PLOT}
            x2={W - KANAN}
            y2={ATAS + TINGGI_PLOT}
            stroke="var(--line-strong)"
            strokeWidth={1}
          />
          <line
            x1={KIRI - 6}
            y1={ATAS}
            x2={W - KANAN}
            y2={ATAS}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <text x={KIRI - 8} y={ATAS + 3} className="sumbu" textAnchor="end">
            {maks}
          </text>
          <text x={KIRI - 8} y={ATAS + TINGGI_PLOT / 2 + 3} className="sumbu" textAnchor="end">
            {Math.round(maks / 2)}
          </text>

          {batang.map((bar, i) => (
            <g key={bar.hari}>
              <rect
                x={bar.x - 2}
                y={ATAS}
                width={langkah}
                height={TINGGI_PLOT}
                className="hit"
                tabIndex={0}
                role="button"
                aria-label={`${bar.hari}, ${bar.nilai} laporan`}
                onMouseEnter={() => setAktif(i)}
                onFocus={() => setAktif(i)}
                onBlur={() => setAktif(null)}
              />
              <path d={bar.jalur} className={`bar${bar.terakhir || aktif === i ? " hi" : ""}`} />
            </g>
          ))}

          {[0, 6, 13].map((i) => (
            <text
              key={i}
              x={KIRI + i * langkah + lebarBar / 2}
              y={H - 6}
              className="sumbu"
              textAnchor="middle"
            >
              {harian[i][0].slice(4)}
            </text>
          ))}
        </svg>

        <div
          className={`tip${b ? " tampil" : ""}`}
          style={
            b
              ? { left: `${((b.x + lebarBar / 2) / W) * 100}%`, top: `${(b.y / H) * 100 - 4}%` }
              : undefined
          }
          aria-hidden
        >
          {b ? (
            <>
              {b.hari} &middot; <b>{b.nilai}</b> laporan
            </>
          ) : null}
        </div>
      </div>
    </details>
  );
}
