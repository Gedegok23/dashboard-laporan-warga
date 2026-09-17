import { LANJUT, TAHAP, dataAwal, petugas } from "./data";
import { klasterCocok } from "./logika";
import type { Arah, Klaster, Laporan, Saring, TabPeriksa, Tahap, Urut } from "./tipe";

export type Keadaan = {
  data: Klaster[];
  /** Indeks klaster dan laporan yang sedang dibuka di panel periksa. */
  kls: number;
  lap: number;
  saring: Saring;
  kunci: string;
  tab: TabPeriksa;
  /** Identitas pelapor terbuka atau disamarkan. */
  identitas: boolean;
  urut: Urut;
  arah: Arah;
  /** Indeks klaster yang barisnya sedang dibentangkan. */
  buka: number[];
  /** Salinan data sebelum aksi terakhir, sumber tombol Batalkan. */
  undo: Klaster[] | null;
  toast: { id: number; pesan: string; adaUndo: boolean } | null;
  nomorToast: number;
};

export const keadaanAwal: Keadaan = {
  data: dataAwal,
  kls: 0,
  lap: 0,
  saring: "semua",
  kunci: "",
  tab: "detail",
  identitas: false,
  urut: "waktu",
  arah: "turun",
  buka: [0],
  undo: null,
  toast: null,
  nomorToast: 0,
};

export type Aksi =
  | { t: "pilih"; kls: number; lap: number }
  | { t: "toggle-klaster"; i: number }
  | { t: "saring"; nilai: Saring }
  | { t: "kunci"; nilai: string }
  | { t: "reset-saring" }
  | { t: "tab"; nilai: TabPeriksa }
  | { t: "identitas" }
  | { t: "urut"; kolom: Urut }
  | { t: "lanjut"; jam: string }
  | { t: "mundur"; jam: string }
  | { t: "duplikat"; hapus: boolean; jam: string }
  | { t: "kategori"; tujuan: number; jam: string }
  | { t: "instansi"; nama: string; jam: string }
  | { t: "undo" }
  | { t: "tutup-toast" };

/** Tulis riwayat status sekaligus baris log petugas, seperti yang dilakukan RDB. */
function catat(l: Laporan, judul: string, ket: string, jam: string) {
  l.riwayat.unshift([judul, ket, `16 Sep ${jam}`]);
  l.tambahan = [
    ...(l.tambahan ?? []),
    {
      siapa: "Petugas",
      peran: "petugas",
      ikon: "petugas",
      jam,
      teks: `${ket} oleh ${petugas.nama} (${petugas.unit}).`,
    },
  ];
}

/** Bentangkan setiap klaster yang lolos saringan supaya hasilnya langsung terlihat. */
const bukaYangCocok = (data: Klaster[], saring: Saring, kunci: string, buka: number[]) => {
  const tambahan = data
    .map((k, i) => (klasterCocok(k, saring, kunci) ? i : -1))
    .filter((i) => i >= 0);
  return [...new Set([...buka, ...tambahan])];
};

const denganToast = (s: Keadaan, pesan: string, adaUndo = true): Keadaan => ({
  ...s,
  toast: { id: s.nomorToast + 1, pesan, adaUndo },
  nomorToast: s.nomorToast + 1,
});

export function reducer(s: Keadaan, a: Aksi): Keadaan {
  switch (a.t) {
    case "pilih":
      return { ...s, kls: a.kls, lap: a.lap, identitas: false };

    case "toggle-klaster": {
      const buka = s.buka.includes(a.i) ? s.buka.filter((x) => x !== a.i) : [...s.buka, a.i];
      const pindah = buka.includes(a.i) && s.kls !== a.i;
      return { ...s, buka, kls: pindah ? a.i : s.kls, lap: pindah ? 0 : s.lap, identitas: pindah ? false : s.identitas };
    }

    case "saring":
      return { ...s, saring: a.nilai, buka: bukaYangCocok(s.data, a.nilai, s.kunci, s.buka) };

    case "kunci":
      return {
        ...s,
        kunci: a.nilai,
        buka: a.nilai ? bukaYangCocok(s.data, s.saring, a.nilai, s.buka) : s.buka,
      };

    case "reset-saring":
      return { ...s, saring: "semua", kunci: "" };

    case "tab":
      return { ...s, tab: a.nilai };

    case "identitas":
      return { ...s, identitas: !s.identitas };

    case "urut":
      return s.urut === a.kolom
        ? { ...s, arah: s.arah === "turun" ? "naik" : "turun" }
        : { ...s, urut: a.kolom, arah: a.kolom === "waktu" ? "turun" : "naik" };

    case "lanjut": {
      const data = structuredClone(s.data);
      const l = data[s.kls].lapor[s.lap];
      const langkah = LANJUT[l.tahap];
      if (!langkah || l.duplikat) return s;
      l.tahap = langkah.ke;
      if (l.tahap === 3) l.sisa = null;
      else if (l.sisa !== null && l.sisa < 0) l.sisa = 5;
      catat(l, TAHAP[langkah.ke].nama, langkah.catatan, a.jam);
      return denganToast(
        { ...s, data, undo: s.data },
        `${l.tiket} kini ${TAHAP[langkah.ke].nama.toLowerCase()}.`,
      );
    }

    case "mundur": {
      const data = structuredClone(s.data);
      const l = data[s.kls].lapor[s.lap];
      if (l.tahap === 0 || l.duplikat) return s;
      l.tahap = (l.tahap - 1) as Tahap;
      if (l.sisa === null) l.sisa = 2;
      catat(l, TAHAP[l.tahap].nama, `Status dikembalikan ke ${TAHAP[l.tahap].nama.toLowerCase()}`, a.jam);
      return denganToast(
        { ...s, data, undo: s.data },
        `${l.tiket} dikembalikan ke ${TAHAP[l.tahap].nama.toLowerCase()}.`,
      );
    }

    case "duplikat": {
      const data = structuredClone(s.data);
      const k = data[s.kls];
      const l = k.lapor[s.lap];
      l.duplikat = !a.hapus;
      catat(
        l,
        a.hapus ? "Tanda duplikat dicabut" : "Ditandai duplikat",
        a.hapus
          ? "Laporan dikembalikan ke antrean aktif"
          : `Laporan dinilai duplikat dari klaster ${k.id}`,
        a.jam,
      );
      return denganToast(
        { ...s, data, undo: s.data },
        a.hapus ? `${l.tiket} kembali ke antrean aktif.` : `${l.tiket} ditandai duplikat.`,
      );
    }

    case "kategori": {
      if (a.tujuan === s.kls) return s;
      const data = structuredClone(s.data);
      const asal = data[s.kls];
      const sasaran = data[a.tujuan];
      const [l] = asal.lapor.splice(s.lap, 1);
      sasaran.lapor.push(l);
      catat(l, "Kategori dikoreksi", `Dipindahkan dari ${asal.kategori} ke ${sasaran.kategori}`, a.jam);
      return denganToast(
        {
          ...s,
          data,
          undo: s.data,
          kls: a.tujuan,
          lap: sasaran.lapor.length - 1,
          buka: [...new Set([...s.buka, a.tujuan])],
        },
        `${l.tiket} dipindahkan ke klaster ${sasaran.id}.`,
      );
    }

    case "instansi": {
      const data = structuredClone(s.data);
      const k = data[s.kls];
      const l = k.lapor[s.lap];
      if (a.nama === (l.instansi || k.instansi)) return s;
      l.instansi = a.nama === k.instansi ? null : a.nama;
      catat(l, "Instansi dialihkan", `Penanggung jawab menjadi ${a.nama}`, a.jam);
      return denganToast({ ...s, data, undo: s.data }, `${l.tiket} dialihkan ke ${a.nama}.`);
    }

    case "undo":
      if (!s.undo) return s;
      return { ...s, data: s.undo, undo: null, toast: null };

    case "tutup-toast":
      return { ...s, toast: null };

    default:
      return s;
  }
}
