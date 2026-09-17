"use client";

import { useState } from "react";

const W = 720;
const H = 200;
const KIRI = 30;
const KANAN = 8;
const ATAS = 12;
const BAWAH = 26;
const LEBAR = W - KIRI - KANAN;
const TINGGI = H - ATAS - BAWAH;

/**
 * Deret tunggal, jadi tidak perlu legenda: judulnya sudah menyebut isinya.
 * Batang tipis, ujung data membulat 4px, kaki menempel garis nol, dan sela 2px
 * antar batang seperti ketentuan spesifikasi tanda.
 */
export function GrafikMasuk({ harian }: { harian: [string, number][] }) {
  const [aktif, setAktif] = useState<number | null>(null);

  const maks = Math.max(...harian.map((d) => d[1]));
  const langkah = LEBAR / harian.length;
  const lebar = Math.max(6, langkah - 6);

  const batang = harian.map(([hari, nilai], i) => {
    const tinggi = Math.max(3, (nilai / maks) * TINGGI);
    const x = KIRI + i * langkah + (langkah - lebar) / 2;
    const y = ATAS + TINGGI - tinggi;
    const r = Math.min(4, lebar / 2, tinggi);
    return {
      hari,
      nilai,
      x,
      y,
      tinggi,
      jalur: [
        `M${x} ${y + tinggi}`,
        `L${x} ${y + r}`,
        `Q${x} ${y} ${x + r} ${y}`,
        `L${x + lebar - r} ${y}`,
        `Q${x + lebar} ${y} ${x + lebar} ${y + r}`,
        `L${x + lebar} ${y + tinggi}`,
        "Z",
      ].join(" "),
    };
  });

  const b = aktif === null ? null : batang[aktif];

  return (
    <div className="plot" onMouseLeave={() => setAktif(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik batang laporan masuk per hari selama 14 hari terakhir. Tabel angkanya ada di bawah grafik.">
        <line x1={KIRI - 6} y1={ATAS + TINGGI} x2={W - KANAN} y2={ATAS + TINGGI} className="sumbu-garis" />
        <line x1={KIRI - 6} y1={ATAS} x2={W - KANAN} y2={ATAS} className="sumbu-kisi" />
        <text x={KIRI - 9} y={ATAS + 4} className="sumbu" textAnchor="end">{maks}</text>
        <text x={KIRI - 9} y={ATAS + TINGGI / 2 + 4} className="sumbu" textAnchor="end">{Math.round(maks / 2)}</text>

        {batang.map((bar, i) => (
          <g key={bar.hari}>
            <rect
              x={KIRI + i * langkah}
              y={ATAS}
              width={langkah}
              height={TINGGI}
              className="hit"
              tabIndex={0}
              role="button"
              aria-label={`${bar.hari}, ${bar.nilai} laporan`}
              onMouseEnter={() => setAktif(i)}
              onFocus={() => setAktif(i)}
              onBlur={() => setAktif(null)}
            />
            <path d={bar.jalur} className={`bar${aktif === i ? " sorot" : ""}`} />
          </g>
        ))}

        {[0, 6, 13].map((i) => (
          <text key={i} x={KIRI + i * langkah + langkah / 2} y={H - 8} className="sumbu" textAnchor="middle">
            {harian[i][0].slice(4)}
          </text>
        ))}
      </svg>

      <div
        className={`tip${b ? " tampil" : ""}`}
        style={b ? { left: `${((b.x + lebar / 2) / W) * 100}%`, top: `${(b.y / H) * 100 - 3}%` } : undefined}
        aria-hidden
      >
        {b ? (
          <>
            {b.hari}, <b>{b.nilai}</b> laporan
          </>
        ) : null}
      </div>

      <table className="sr">
        <caption>Laporan masuk per hari, 14 hari terakhir</caption>
        <thead>
          <tr>
            <th scope="col">Hari</th>
            <th scope="col">Laporan masuk</th>
          </tr>
        </thead>
        <tbody>
          {harian.map(([hari, nilai]) => (
            <tr key={hari}>
              <th scope="row">{hari}</th>
              <td>{nilai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
