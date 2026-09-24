"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";
import { petugas } from "@/lib/data";
import { PilihTema } from "./PilihTema";
import { KANAL, PEMERINTAH } from "@/lib/kota";

export function TopBar() {
  const { s, kirim, jamTampil } = useMeja();
  const kotak = useRef<HTMLInputElement>(null);

  // Garis miring melompat ke pencarian, Escape melepas fokus.
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

  return (
    <header className="topbar">
      <div className="brand">
        <div className="stempel" aria-hidden>
          ML
        </div>
        <div>
          <h1>Meja Laporan Warga</h1>
          <p className="sub">
            {PEMERINTAH} &middot; kanal {KANAL}
          </p>
        </div>
      </div>

      <div className="cari">
        <Ikon nama="cari" ukuran={19} />
        <label htmlFor="cari" className="sr">
          Cari laporan
        </label>
        <input
          id="cari"
          ref={kotak}
          type="search"
          value={s.kunci}
          placeholder="Cari tiket, jalan, kelurahan, kata kunci"
          autoComplete="off"
          onChange={(e) => kirim({ t: "kunci", nilai: e.target.value.trim() })}
        />
        {s.kunci ? (
          <button
            className="hapus"
            type="button"
            onClick={() => {
              kirim({ t: "kunci", nilai: "" });
              kotak.current?.focus();
            }}
          >
            <Ikon nama="hapus" ukuran={16} />
            <span className="sr">Hapus pencarian</span>
          </button>
        ) : null}
      </div>

      <div className="topmeta">
        <Link className="taut-portal" href="/portal">
          <Ikon nama="portal" ukuran={15} />
          Portal warga
        </Link>
        <PilihTema />
        <span className="tag-contoh">Data contoh</span>
        <span className="mono">Sinkron RDB {jamTampil}</span>
        <span className="petugas">
          <span className="av" aria-hidden>
            {petugas.inisial}
          </span>
          <span>
            <b>{petugas.nama}</b>
            <span style={{ fontSize: 11 }}>Verifikator Diskominfo</span>
          </span>
        </span>
      </div>
    </header>
  );
}
