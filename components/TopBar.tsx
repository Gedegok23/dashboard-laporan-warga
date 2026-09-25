"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";
import { PilihTema } from "./PilihTema";
import { keluarAksi } from "@/app/masuk/masuk";
import { KANAL, PEMERINTAH } from "@/lib/kota";
import { MEREK } from "@/lib/merek";

export function TopBar() {
  const { s, kirim, jamTampil, akun } = useMeja();
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
        <Image
          className="stempel-logo"
          src="/kito-mark.png"
          alt=""
          aria-hidden
          width={395}
          height={395}
          priority
        />
        <div>
          <h1>{MEREK.nama}</h1>
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
        <Link className="taut-portal" href="/petugas">
          <Ikon nama="regu" ukuran={15} />
          Regu lapangan
        </Link>
        <Link className="taut-portal" href="/portal">
          <Ikon nama="portal" ukuran={15} />
          Portal warga
        </Link>
        <PilihTema />
        {s.langsung ? null : <span className="tag-contoh">Data contoh</span>}
        <span className="mono">Sinkron RDB {jamTampil}</span>
        <span className="petugas">
          <span className="av" aria-hidden>
            {akun.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <b>{akun}</b>
            <span style={{ fontSize: 11 }}>{PEMERINTAH}</span>
          </span>
        </span>
        <form action={keluarAksi}>
          <button className="keluar" type="submit" title="Keluar dari meja petugas">
            <Ikon nama="keluar" ukuran={16} />
            <span className="sr">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}
