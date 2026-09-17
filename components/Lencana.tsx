"use client";

import { Ikon } from "./Ikon";
import { TAHAP } from "@/lib/data";
import { lewatBatas } from "@/lib/logika";
import type { Laporan, Tahap } from "@/lib/tipe";

/** Tahap dibaca dari bentuk ikon dan teks, bukan dari warna saja. */
export function TahapChip({ tahap }: { tahap: Tahap }) {
  return (
    <span className={`tahap t${tahap}`}>
      <Ikon nama={TAHAP[tahap].ikon} ukuran={14} />
      {TAHAP[tahap].nama}
    </span>
  );
}

export function SlaChip({ laporan }: { laporan: Laporan }) {
  if (!lewatBatas(laporan)) return null;
  return (
    <span className="lewat">
      <Ikon nama="peringatan" ukuran={14} />
      Lewat {Math.abs(laporan.sisa as number)} hari
    </span>
  );
}

export function DupChip({ laporan }: { laporan: Laporan }) {
  if (!laporan.duplikat) return null;
  return (
    <span className="dup">
      <Ikon nama="salin" ukuran={14} />
      Duplikat
    </span>
  );
}
