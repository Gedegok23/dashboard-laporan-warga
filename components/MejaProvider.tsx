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
import type { Klaster } from "@/lib/tipe";
import {
  buktiHapusAksi,
  buktiTambahAksi,
  catatanAksi,
  duplikatAksi,
  instansiAksi,
  jadwalAksi,
  kirimUmpanAksi,
  lanjutAksi,
  mundurAksi,
  tindakAksi,
  tugaskanAksi,
} from "@/lib/aksi";

/** Jam meja saat halaman dibuka. Tetap agar render server dan klien sama. */
const JAM_MULAI = "14:06";
const MENIT_MULAI = 14 * 60 + 6;

type Isi = {
  s: Keadaan;
  kirim: Dispatch<Aksi>;
  /** Pesan kegagalan dari server, null bila tidak ada. */
  gagal: string | null;
  tutupGagal: () => void;
  /** Jam meja yang berjalan sejak halaman dibuka, untuk stempel waktu aksi. */
  jamKini: () => string;
  /** Jam yang ditampilkan di label sinkron, ditahan sampai klien hidup. */
  jamTampil: string;
};

const Konteks = createContext<Isi | null>(null);

const formatJam = (menit: number) =>
  `${String(Math.floor(menit / 60) % 24).padStart(2, "0")}:${String(menit % 60).padStart(2, "0")}`;

export function MejaProvider({
  children,
  data,
  langsung = false,
}: {
  children: ReactNode;
  /** Isi meja dari database. Tanpa ini, meja memakai data contoh. */
  data?: Klaster[];
  /** true bila isi meja datang dari database, bukan data contoh. */
  langsung?: boolean;
}) {
  const [s, kirim] = useReducer(reducer, data ? { ...keadaanAwal, data, langsung } : keadaanAwal);
  const [jamTampil, setJamTampil] = useState(JAM_MULAI);
  const [gagal, setGagal] = useState<string | null>(null);
  const mulai = useRef<number | null>(null);
  // Keadaan terakhir, dibaca kirimGabung saat menyusun panggilan ke server.
  // Disetel lewat effect, bukan saat render: ref tidak boleh ditulis di render.
  const simpanan = useRef(s);

  const jamKini = useCallback(() => {
    const lewat = mulai.current ? Math.floor((Date.now() - mulai.current) / 60_000) : 0;
    return formatJam(MENIT_MULAI + lewat);
  }, []);

  useEffect(() => {
    simpanan.current = s;
  });

  // `revalidatePath` di server action mengirim data baru lewat prop. Tanpa ini
  // reducer akan terus memakai salinan pertamanya dan layar melenceng dari DB.
  useEffect(() => {
    if (data) kirim({ t: "muat", data });
  }, [data]);

  useEffect(() => {
    mulai.current = Date.now();
    const id = setInterval(() => setJamTampil(jamKini()), 30_000);
    return () => clearInterval(id);
  }, [jamKini]);

  // Saat meja terhubung database, tiap aksi yang mengubah data diteruskan ke
  // server. Reducer tetap jalan lebih dulu supaya layar langsung bergerak;
  // server yang memegang kebenaran, dan `revalidatePath` menariknya kembali.
  const kirimKeServer = useCallback(
    async (a: Aksi, k: Keadaan) => {
      const l = k.data[k.kls]?.lapor[k.lap];
      if (!l) return;
      const t = l.tiket;
      const se = k.seKlaster;
      switch (a.t) {
        case "tugaskan":
          return tugaskanAksi(t, a.petugas, se);
        case "jadwal":
          return jadwalAksi(t, a.nilai, se);
        case "tindak":
          return tindakAksi(t, a.nilai, se);
        case "bukti-tambah":
          return buktiTambahAksi(t);
        case "bukti-hapus":
          return buktiHapusAksi(t, a.nama);
        case "catatan":
          return catatanAksi(t, a.teks);
        case "kirim-umpan":
          return kirimUmpanAksi(t, l.draf ?? "", se);
        case "lanjut":
          return lanjutAksi(t);
        case "mundur":
          return mundurAksi(t);
        case "duplikat":
          return duplikatAksi(t, a.hapus);
        case "instansi":
          return instansiAksi(t, a.nama);
        default:
          return;
      }
    },
    [],
  );

  const kirimGabung = useCallback(
    (a: Aksi) => {
      const sebelum = simpanan.current;
      kirim(a);
      if (sebelum.langsung) {
        kirimKeServer(a, sebelum).catch((e) => {
          console.error("[meja] server menolak aksi:", e);
          setGagal(e instanceof Error ? e.message : "Server menolak perubahan.");
        });
      }
    },
    [kirimKeServer],
  );

  const nilai = useMemo(
    () => ({ s, kirim: kirimGabung, jamKini, jamTampil, gagal, tutupGagal: () => setGagal(null) }),
    [s, kirimGabung, jamKini, jamTampil, gagal],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useMeja() {
  const isi = useContext(Konteks);
  if (!isi) throw new Error("useMeja dipakai di luar MejaProvider");
  return isi;
}
