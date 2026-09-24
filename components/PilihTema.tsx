"use client";

import { useState } from "react";
import { Ikon } from "./Ikon";
import type { NamaIkon } from "@/lib/tipe";

type Tema = "sistem" | "terang" | "gelap";

const PILIHAN: { nilai: Tema; label: string; ikon: NamaIkon }[] = [
  { nilai: "sistem", label: "Ikut sistem", ikon: "lingkaran" },
  { nilai: "terang", label: "Terang", ikon: "kilau" },
  { nilai: "gelap", label: "Gelap", ikon: "sembunyi" },
];

/** Tanpa atribut, CSS mengikuti prefers-color-scheme. Dengan atribut, dipaksa. */
function terapkan(t: Tema) {
  const akar = document.documentElement;
  if (t === "sistem") akar.removeAttribute("data-theme");
  else akar.setAttribute("data-theme", t === "gelap" ? "dark" : "light");
  try {
    if (t === "sistem") localStorage.removeItem("tema");
    else localStorage.setItem("tema", t === "gelap" ? "dark" : "light");
  } catch {
    // Penyimpanan diblokir (mode privat). Tema tetap berlaku untuk sesi ini.
  }
}

export function PilihTema() {
  // Server tidak tahu pilihan pengguna, jadi ia selalu merender "sistem".
  // Di peramban, keadaan sebenarnya sudah disetel skrip di <head> sebelum
  // halaman digambar, jadi dibaca sekali saat state dibuat. Hanya atribut
  // aria-pressed yang berbeda antara server dan klien, dan itu ditandai.
  const [tema, setTema] = useState<Tema>(() => {
    if (typeof document === "undefined") return "sistem";
    const ada = document.documentElement.getAttribute("data-theme");
    return ada === "dark" ? "gelap" : ada === "light" ? "terang" : "sistem";
  });

  return (
    <div className="pilih-tema" role="group" aria-label="Tampilan terang atau gelap">
      {PILIHAN.map((p) => (
        <button
          key={p.nilai}
          type="button"
          suppressHydrationWarning
          aria-pressed={tema === p.nilai}
          title={p.label}
          onClick={() => {
            setTema(p.nilai);
            terapkan(p.nilai);
          }}
        >
          <Ikon nama={p.ikon} ukuran={15} />
          <span className="sr">{p.label}</span>
        </button>
      ))}
    </div>
  );
}
