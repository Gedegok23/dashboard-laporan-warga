"use client";

import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";
import { TAHAP } from "@/lib/data";
import { hitungRingkas, klasterCocok } from "@/lib/logika";
import type { NamaIkon, Saring } from "@/lib/tipe";

export function Saringan() {
  const { s, kirim } = useMeja();
  const h = hitungRingkas(s.data);

  const opsi: { nilai: Saring; nama: string; ikon?: NamaIkon; jumlah: number }[] = [
    { nilai: "semua", nama: "Semua tahap", jumlah: h.antre },
    { nilai: "0", nama: TAHAP[0].nama, ikon: TAHAP[0].ikon, jumlah: h.verifikasi },
    { nilai: "1", nama: TAHAP[1].nama, ikon: TAHAP[1].ikon, jumlah: h.diteruskan },
    { nilai: "2", nama: TAHAP[2].nama, ikon: TAHAP[2].ikon, jumlah: h.ditindaklanjuti },
    { nilai: "3", nama: TAHAP[3].nama, ikon: TAHAP[3].ikon, jumlah: h.selesai },
    { nilai: "dup", nama: "Duplikat", ikon: "salin", jumlah: h.duplikat },
  ];

  const terlihat = s.data.filter((k) => klasterCocok(k, s.saring, s.kunci)).length;

  return (
    <div className="saringan" role="group" aria-label="Saring menurut tahap tindak lanjut">
      {opsi.map((o) => (
        <button
          key={o.nilai}
          className="chipbtn"
          type="button"
          aria-pressed={s.saring === o.nilai}
          disabled={o.jumlah === 0 && o.nilai !== "semua"}
          onClick={() => kirim({ t: "saring", nilai: o.nilai })}
        >
          {o.ikon ? <Ikon nama={o.ikon} ukuran={15} /> : null}
          {o.nama}
          <span className="n">{o.jumlah}</span>
        </button>
      ))}
      <span className="sisa">
        {terlihat} dari {s.data.length} klaster ditampilkan
      </span>
    </div>
  );
}
