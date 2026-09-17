"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Dispatch, ReactNode } from "react";
import { keadaanAwal, reducer } from "@/lib/reducer";
import type { Aksi, Keadaan } from "@/lib/reducer";

/** Jam meja saat halaman dibuka. Tetap agar render server dan klien sama. */
const JAM_MULAI = "14:06";
const MENIT_MULAI = 14 * 60 + 6;

type Isi = {
  s: Keadaan;
  kirim: Dispatch<Aksi>;
  /** Jam meja yang berjalan sejak halaman dibuka, untuk stempel waktu aksi. */
  jamKini: () => string;
  /** Jam yang ditampilkan di label sinkron, ditahan sampai klien hidup. */
  jamTampil: string;
};

const Konteks = createContext<Isi | null>(null);

const formatJam = (menit: number) =>
  `${String(Math.floor(menit / 60) % 24).padStart(2, "0")}:${String(menit % 60).padStart(2, "0")}`;

export function MejaProvider({ children }: { children: ReactNode }) {
  const [s, kirim] = useReducer(reducer, keadaanAwal);
  const [jamTampil, setJamTampil] = useState(JAM_MULAI);
  const mulai = useRef<number | null>(null);

  const jamKini = useCallback(() => {
    const lewat = mulai.current ? Math.floor((Date.now() - mulai.current) / 60_000) : 0;
    return formatJam(MENIT_MULAI + lewat);
  }, []);

  useEffect(() => {
    mulai.current = Date.now();
    const id = setInterval(() => setJamTampil(jamKini()), 30_000);
    return () => clearInterval(id);
  }, [jamKini]);

  const nilai = useMemo(() => ({ s, kirim, jamKini, jamTampil }), [s, jamKini, jamTampil]);

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useMeja() {
  const isi = useContext(Konteks);
  if (!isi) throw new Error("useMeja dipakai di luar MejaProvider");
  return isi;
}
