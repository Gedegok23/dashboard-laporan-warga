"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ikon } from "./Ikon";
import { KartuLaporan } from "./portal/KartuLaporan";
import { JENIS, URUT_JENIS } from "@/lib/kategori";
import { cocokPortal } from "@/lib/logika";
import type { Jenis, KelompokPortal, StatusPortal } from "@/lib/tipe";

type Saring = "semua" | StatusPortal;

const SARINGAN: { nilai: Saring; label: string }[] = [
  { nilai: "semua", label: "Semua" },
  { nilai: "belum", label: "Belum selesai" },
  { nilai: "clear", label: "Selesai" },
];

export function PortalDaftar({ kelompok }: { kelompok: KelompokPortal[] }) {
  const [kunci, setKunci] = useState("");
  const [saring, setSaring] = useState<Saring>("semua");
  const [jenis, setJenis] = useState<Jenis | null>(null);
  const kotak = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pintas = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== kotak.current) {
        e.preventDefault();
        kotak.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === kotak.current) kotak.current?.blur();
    };
    window.addEventListener("keydown", pintas);
    return () => window.removeEventListener("keydown", pintas);
  }, []);

  const semua = useMemo(() => kelompok.flatMap((g) => g.lapor), [kelompok]);

  const hasil = useMemo(
    () =>
      semua
        .filter(
          (l) =>
            cocokPortal(l, kunci) &&
            (saring === "semua" || l.status === saring) &&
            (jenis === null || l.jenis === jenis),
        )
        .sort((a, b) => b.ts - a.ts),
    [semua, kunci, saring, jenis],
  );

  const jumlah: Record<Saring, number> = {
    semua: semua.length,
    belum: semua.filter((l) => l.status === "belum").length,
    clear: semua.filter((l) => l.status === "clear").length,
  };

  // Jenis yang belum punya laporan tidak ditawarkan: menawarkan saringan yang
  // pasti kosong cuma bikin warga mengira pencariannya gagal.
  const jenisAda = URUT_JENIS.filter((j) => semua.some((l) => l.jenis === j));
  const menyaring = Boolean(kunci) || saring !== "semua" || jenis !== null;

  const bersihkan = () => {
    setKunci("");
    setSaring("semua");
    setJenis(null);
  };

  return (
    <>
      <div className="pcari-blok">
        <div className="pcari">
          <Ikon nama="cari" ukuran={20} />
          <label htmlFor="pcari" className="sr">
            Cari laporan menurut nomor tiket, jalan, kelurahan, atau kata kunci
          </label>
          <input
            id="pcari"
            ref={kotak}
            type="search"
            value={kunci}
            placeholder="Cari nomor tiket, jalan, atau kelurahan"
            autoComplete="off"
            onChange={(e) => setKunci(e.target.value)}
          />
          {kunci ? (
            <button
              className="phapus"
              type="button"
              onClick={() => {
                setKunci("");
                kotak.current?.focus();
              }}
            >
              <Ikon nama="hapus" ukuran={17} />
              <span className="sr">Hapus pencarian</span>
            </button>
          ) : null}
        </div>

        <div className="pjenis" role="group" aria-label="Saring menurut jenis masalah">
          {jenisAda.map((j) => (
            <button
              key={j}
              type="button"
              className={`jchip j-${j}`}
              aria-pressed={jenis === j}
              onClick={() => setJenis(jenis === j ? null : j)}
            >
              <Ikon nama={JENIS[j].ikon} ukuran={15} />
              {JENIS[j].label}
            </button>
          ))}
        </div>

        <div className="psaring" role="group" aria-label="Saring menurut status">
          {SARINGAN.map((o) => (
            <button
              key={o.nilai}
              type="button"
              aria-pressed={saring === o.nilai}
              onClick={() => setSaring(o.nilai)}
            >
              {o.label}
              <span className="n">{jumlah[o.nilai]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="phasil" role="status" aria-live="polite">
        {hasil.length === 0 ? (
          "Tidak ada laporan yang cocok."
        ) : menyaring ? (
          <>
            <b>{hasil.length}</b> laporan cocok dengan pencarian Anda.
          </>
        ) : (
          <>
            <b>{hasil.length}</b> laporan warga tercatat, <b>{jumlah.clear}</b> sudah selesai
            ditangani.
          </>
        )}
      </p>

      {hasil.length === 0 ? (
        <div className="pkosong">
          <p>
            Tidak ada laporan yang cocok dengan pencarian itu. Coba kata yang lebih umum, misalnya
            nama jalan atau kelurahan saja.
          </p>
          <button className="btn" type="button" onClick={bersihkan}>
            <Ikon nama="atur-ulang" ukuran={17} />
            Tampilkan semua laporan
          </button>
        </div>
      ) : (
        <ul className="kartu-grid">
          {hasil.map((l) => (
            <li key={l.tiket}>
              <KartuLaporan l={l} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
