"use client";

import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";
import { INSTANSI } from "@/lib/data";
import { bebanInstansi, hitungRingkas } from "@/lib/logika";
import type { NamaIkon, Saring } from "@/lib/tipe";

const ANTREAN: { nilai: Saring; label: string; ikon: NamaIkon; tanda?: boolean }[] = [
  { nilai: "semua", label: "Semua aktif", ikon: "kotak-masuk" },
  { nilai: "0", label: "Perlu verifikasi", ikon: "tunggu" },
  { nilai: "lewat", label: "Lewat batas", ikon: "peringatan", tanda: true },
  { nilai: "dup", label: "Ditandai duplikat", ikon: "salin" },
  { nilai: "3", label: "Selesai", ikon: "selesai" },
];

export function Rail() {
  const { s, kirim } = useMeja();
  const h = hitungRingkas(s.data);
  const beban = bebanInstansi(s.data, INSTANSI);

  const jumlah: Record<string, number> = {
    semua: h.antre,
    "0": h.verifikasi,
    lewat: h.lewat,
    dup: h.duplikat,
    "3": h.selesai,
  };

  return (
    <div className="rail">
      <div>
        <p className="label">Antrean</p>
        <nav>
          {ANTREAN.map((a) => (
            <button
              key={a.nilai}
              type="button"
              aria-current={s.saring === a.nilai}
              onClick={() => {
                kirim({ t: "saring", nilai: a.nilai });
                document.getElementById("antrean")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <Ikon nama={a.ikon} ukuran={19} />
              {a.label}
              <span className={`n${a.tanda ? " tanda" : ""}`}>{jumlah[a.nilai]}</span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        <p className="label">Beban instansi</p>
        <div className="instansi-list">
          {beban.map((b) => (
            <div key={b.nama}>
              <b>
                {b.nama}
                <span className="meter">
                  <i style={{ width: `${b.persen}%` }} />
                </span>
              </b>
              <span>{b.n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
