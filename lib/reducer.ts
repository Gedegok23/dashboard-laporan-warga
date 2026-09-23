import { LANJUT, TAHAP, TINDAK, dataAwal, petugas } from "./data";
import {
  cariPetugas,
  cukupBukti,
  klasterCocok,
  penangananLaporan,
  penerimaKlaster,
  saudaraKerja,
  statusTindak,
  susunKabar,
} from "./logika";
import type {
  Arah,
  Bukti,
  Klaster,
  Laporan,
  Penanganan,
  Saring,
  SaringTindak,
  StatusTindak,
  TabPeriksa,
  Tahap,
  Urut,
  UrutTindak,
} from "./tipe";

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
  /** Saringan, urutan, dan arah khusus meja penanganan. */
  tindak: SaringTindak;
  urutTindak: UrutTindak;
  arahTindak: Arah;
  /** Aksi penanganan ikut mengenai laporan mirip di klaster yang sama. */
  seKlaster: boolean;
  /** Isi meja datang dari database, bukan data contoh. */
  langsung: boolean;
  /**
   * Bertambah hanya ketika satu aksi benar-benar mengubah isi. Dipakai untuk
   * membedakan aksi yang diterima dari yang ditolak diam-diam oleh reducer,
   * tanpa terganggu pemuatan ulang data dari server.
   */
  revisi: number;
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
  tab: "penanganan",
  identitas: false,
  urut: "waktu",
  arah: "turun",
  buka: [0],
  tindak: "semua",
  urutTindak: "status",
  arahTindak: "naik",
  seKlaster: false,
  langsung: false,
  revisi: 0,
  undo: null,
  toast: null,
  nomorToast: 0,
};

export type Aksi =
  | { t: "pilih"; kls: number; lap: number; tab?: TabPeriksa }
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
  | { t: "saring-tindak"; nilai: SaringTindak }
  | { t: "urut-tindak"; kolom: UrutTindak }
  | { t: "se-klaster" }
  | { t: "tugaskan"; petugas: string | null; jam: string }
  | { t: "jadwal"; nilai: string; jam: string }
  | { t: "tindak"; nilai: StatusTindak; jam: string }
  | { t: "catatan"; teks: string }
  | { t: "bukti-tambah"; jam: string }
  | { t: "bukti-hapus"; nama: string; jam: string }
  | { t: "draf"; teks: string }
  | { t: "kirim-umpan"; jam: string }
  | { t: "muat"; data: Klaster[] }
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

/** Berkas penanganan laporan, dibuat saat pertama kali dipakai. */
function berkas(l: Laporan): Penanganan {
  if (!l.penanganan) l.penanganan = { petugas: null, jadwal: null, catatan: "", bukti: [] };
  return l.penanganan;
}

/**
 * Laporan yang kena satu aksi penanganan. Laporan mirip hanya ikut bila petugas
 * menyalakan sakelar seklaster, dan hanya yang sudah lolos verifikasi.
 */
function sasaran(k: Klaster, lap: number, seKlaster: boolean): Laporan[] {
  const utama = k.lapor[lap];
  return seKlaster ? [utama, ...saudaraKerja(k, utama)] : [utama];
}

const sebut = (n: number, tiket: string) => (n > 1 ? `${n} laporan klaster ini` : tiket);

/** Bentangkan setiap klaster yang lolos saringan supaya hasilnya langsung terlihat. */
const bukaYangCocok = (data: Klaster[], saring: Saring, kunci: string, buka: number[]) => {
  const tambahan = data
    .map((k, i) => (klasterCocok(k, saring, kunci) ? i : -1))
    .filter((i) => i >= 0);
  return [...new Set([...buka, ...tambahan])];
};

// Setiap aksi yang benar-benar mengubah isi berakhir di sini, jadi di sinilah
// penanda revisi dinaikkan.
const denganToast = (s: Keadaan, pesan: string, adaUndo = true): Keadaan => ({
  ...s,
  toast: { id: s.nomorToast + 1, pesan, adaUndo },
  nomorToast: s.nomorToast + 1,
  revisi: s.revisi + 1,
});

/**
 * Kabar status yang disusun agent sendiri, bukan diketik admin. Terbit tiap
 * penanda tindakan berubah, dan ikut tercatat di log supaya petugas tahu persis
 * kalimat apa yang sudah sampai ke pelapor.
 *
 * `sumber` adalah laporan yang berkas penanganannya dipakai menyusun kalimat.
 * Untuk laporan duplikat, sumbernya laporan yang pekerjaannya membereskan
 * masalah tersebut.
 */
function kabari(l: Laporan, k: Klaster, sumber: Laporan, jam: string) {
  const status = statusTindak(sumber);
  const teks = susunKabar(sumber, k, status);
  l.kabar = [{ status, teks, waktu: `16 Sep ${jam}`, penerima: 1 }, ...(l.kabar ?? [])];
  l.tambahan = [
    ...(l.tambahan ?? []),
    {
      siapa: "Bot",
      peran: "bot",
      ikon: "kirim",
      jam,
      teks: `Kabar status dikirim ke pelapor: ${teks}`,
    },
  ];
}

/**
 * Pindahkan tahap laporan mengikuti penanda tindakan lapangan. Sisa hari kerja
 * yang sudah minus sengaja tidak diputihkan supaya hitungan lewat batas jujur.
 */
function terapkanTindak(l: Laporan, nilai: StatusTindak) {
  l.tahap = TINDAK[nilai].tahap as Tahap;
  if (l.tahap === 3) l.sisa = null;
  else if (l.sisa === null) l.sisa = 2;
}

export function reducer(s: Keadaan, a: Aksi): Keadaan {
  switch (a.t) {
    case "pilih":
      return { ...s, kls: a.kls, lap: a.lap, identitas: false, tab: a.tab ?? s.tab };

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
      return { ...s, saring: "semua", tindak: "semua", kunci: "" };

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
      if (langkah.ke === 3 && !cukupBukti(l)) return s;
      const sebelum = statusTindak(l);
      l.tahap = langkah.ke;
      if (l.tahap === 3) l.sisa = null;
      else if (l.sisa !== null && l.sisa < 0) l.sisa = 5;
      catat(l, TAHAP[langkah.ke].nama, langkah.catatan, a.jam);
      if (statusTindak(l) !== sebelum) kabari(l, data[s.kls], l, a.jam);
      return denganToast(
        { ...s, data, undo: s.data },
        `${l.tiket} kini ${TAHAP[langkah.ke].nama.toLowerCase()}.`,
      );
    }

    case "mundur": {
      const data = structuredClone(s.data);
      const l = data[s.kls].lapor[s.lap];
      if (l.tahap === 0 || l.duplikat) return s;
      const sebelum = statusTindak(l);
      l.tahap = (l.tahap - 1) as Tahap;
      if (l.sisa === null) l.sisa = 2;
      catat(l, TAHAP[l.tahap].nama, `Status dikembalikan ke ${TAHAP[l.tahap].nama.toLowerCase()}`, a.jam);
      if (statusTindak(l) !== sebelum) kabari(l, data[s.kls], l, a.jam);
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
      const sasaranKls = data[a.tujuan];
      const [l] = asal.lapor.splice(s.lap, 1);
      sasaranKls.lapor.push(l);
      catat(l, "Kategori dikoreksi", `Dipindahkan dari ${asal.kategori} ke ${sasaranKls.kategori}`, a.jam);
      return denganToast(
        {
          ...s,
          data,
          undo: s.data,
          kls: a.tujuan,
          lap: sasaranKls.lapor.length - 1,
          buka: [...new Set([...s.buka, a.tujuan])],
        },
        `${l.tiket} dipindahkan ke klaster ${sasaranKls.id}.`,
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

    case "saring-tindak":
      return { ...s, tindak: a.nilai };

    case "urut-tindak":
      return s.urutTindak === a.kolom
        ? { ...s, arahTindak: s.arahTindak === "turun" ? "naik" : "turun" }
        : { ...s, urutTindak: a.kolom, arahTindak: a.kolom === "tanggal" ? "turun" : "naik" };

    case "se-klaster":
      return { ...s, seKlaster: !s.seKlaster };

    case "tugaskan": {
      const data = structuredClone(s.data);
      const k = data[s.kls];
      const kena = sasaran(k, s.lap, s.seKlaster);
      const p = cariPetugas(a.petugas);
      if (penangananLaporan(k.lapor[s.lap]).petugas === a.petugas) return s;
      for (const l of kena) {
        berkas(l).petugas = a.petugas;
        catat(
          l,
          p ? "Petugas lapangan ditugaskan" : "Penugasan lapangan dicabut",
          p ? `${p.nama} dari ${p.regu} dikirim ke lokasi` : "Laporan menunggu regu pengganti",
          a.jam,
        );
      }
      return denganToast(
        { ...s, data, undo: s.data },
        p
          ? `${p.nama} ditugaskan untuk ${sebut(kena.length, k.lapor[s.lap].tiket)}.`
          : `Penugasan ${sebut(kena.length, k.lapor[s.lap].tiket)} dicabut.`,
      );
    }

    case "jadwal": {
      const data = structuredClone(s.data);
      const k = data[s.kls];
      const kena = sasaran(k, s.lap, s.seKlaster);
      const nilai = a.nilai.trim() || null;
      if (penangananLaporan(k.lapor[s.lap]).jadwal === nilai) return s;
      for (const l of kena) {
        berkas(l).jadwal = nilai;
        catat(
          l,
          nilai ? "Jadwal lapangan diatur" : "Jadwal lapangan dikosongkan",
          nilai ? `Regu dijadwalkan ${nilai}` : "Jadwal turun lapangan belum ditetapkan",
          a.jam,
        );
      }
      return denganToast(
        { ...s, data, undo: s.data },
        nilai
          ? `Jadwal ${sebut(kena.length, k.lapor[s.lap].tiket)} diatur ${nilai}.`
          : `Jadwal ${sebut(kena.length, k.lapor[s.lap].tiket)} dikosongkan.`,
      );
    }

    case "tindak": {
      const data = structuredClone(s.data);
      const k = data[s.kls];
      const utama = k.lapor[s.lap];
      if (utama.duplikat || utama.tahap === 0) return s;
      // Menutup laporan tanpa dokumentasi tidak dilayani: bukti itu yang disimpan
      // RDB sebagai tanda pekerjaan lapangan benar-benar selesai.
      if (a.nilai === "selesai" && !cukupBukti(utama)) return s;
      const kena = sasaran(k, s.lap, s.seKlaster).filter((l) => l.tahap > 0);
      let dikabari = 0;
      for (const l of kena) {
        const sebelum = statusTindak(l);
        if (a.nilai === "selesai" && l.tiket !== utama.tiket && !cukupBukti(l)) {
          // Satu kali kerja lapangan menutup beberapa tiket mirip, jadi bukti yang
          // sama ikut disalin ke berkas laporan mirip sebagai rujukan yang sama.
          berkas(l).bukti = penangananLaporan(utama).bukti.map((b) => ({ ...b }));
          catat(l, "Bukti dirujuk", `Dokumentasi diambil dari penanganan ${utama.tiket}`, a.jam);
        }
        terapkanTindak(l, a.nilai);
        catat(l, TINDAK[a.nilai].nama, TINDAK[a.nilai].catatan, a.jam);
        if (statusTindak(l) !== sebelum) {
          kabari(l, k, l, a.jam);
          dikabari += 1;
        }
      }
      // Laporan duplikat tidak ikut berubah tahapnya, tapi pelapornya melaporkan
      // masalah yang sama, jadi tetap dikabari dari berkas penanganan utama.
      if (s.seKlaster) {
        for (const d of k.lapor.filter((x) => x.duplikat)) {
          kabari(d, k, utama, a.jam);
          dikabari += 1;
        }
      }
      return denganToast(
        { ...s, data, undo: s.data },
        `${sebut(kena.length, utama.tiket)} ditandai ${TINDAK[a.nilai].nama.toLowerCase()}. ` +
          `Agent mengabari ${dikabari} pelapor.`,
      );
    }

    case "catatan": {
      // Mengetik catatan lapangan tidak membuat titik undo sendiri: yang disimpan
      // adalah isi terakhir, sama seperti kolom catatan di RDB.
      const data = structuredClone(s.data);
      berkas(data[s.kls].lapor[s.lap]).catatan = a.teks;
      return { ...s, data };
    }

    case "bukti-tambah": {
      const data = structuredClone(s.data);
      const l = data[s.kls].lapor[s.lap];
      const p = cariPetugas(penangananLaporan(l).petugas);
      if (!p) return s;
      const b = berkas(l);
      const urutan = String(b.bukti.length + 1).padStart(2, "0");
      const berkasBukti: Bukti = {
        nama: `IMG-20260916-${a.jam.replace(":", "")}-lapangan-${urutan}.jpg`,
        ukuran: "2,0 MB",
        jam: a.jam,
        oleh: p.nama,
        gps: l.koordinat,
      };
      b.bukti = [...b.bukti, berkasBukti];
      catat(l, "Bukti dokumentasi masuk", `${berkasBukti.nama} diunggah ${p.nama}`, a.jam);
      return denganToast(
        { ...s, data, undo: s.data },
        `Bukti ${berkasBukti.nama} tersimpan di berkas ${l.tiket}.`,
      );
    }

    case "bukti-hapus": {
      const data = structuredClone(s.data);
      const l = data[s.kls].lapor[s.lap];
      const b = berkas(l);
      if (!b.bukti.some((x) => x.nama === a.nama)) return s;
      b.bukti = b.bukti.filter((x) => x.nama !== a.nama);
      catat(l, "Bukti dokumentasi dicabut", `${a.nama} dikeluarkan dari berkas`, a.jam);
      return denganToast({ ...s, data, undo: s.data }, `Bukti ${a.nama} dicabut dari ${l.tiket}.`);
    }

    case "draf": {
      const data = structuredClone(s.data);
      data[s.kls].lapor[s.lap].draf = a.teks;
      return { ...s, data };
    }

    case "kirim-umpan": {
      const data = structuredClone(s.data);
      const k = data[s.kls];
      const utama = k.lapor[s.lap];
      const teks = (utama.draf ?? "").trim();
      if (!teks) return s;
      const kena = s.seKlaster ? [utama, ...penerimaKlaster(k, utama)] : [utama];
      const catatanUmpan = {
        teks,
        oleh: `Admin ${utama.instansi || k.instansi}`,
        waktu: `16 Sep ${a.jam}`,
        penerima: kena.length,
      };
      for (const l of kena) {
        l.umpan = [catatanUmpan, ...(l.umpan ?? [])];
        l.draf = "";
        catat(
          l,
          "Umpan balik diterbitkan",
          `Balasan instansi tampil di portal dan dikirim agent ke ${kena.length} pelapor`,
          a.jam,
        );
      }
      return denganToast(
        { ...s, data, undo: s.data },
        `Umpan balik terbit di portal dan dikirim agent ke ${kena.length} pelapor.`,
      );
    }

    case "muat": {
      // Server memegang kebenaran. Pilihan petugas (laporan mana yang terbuka,
      // saringan, tab) dipertahankan; isinya yang diganti.
      //
      // Laporan yang terbuka dicari kembali lewat nomor tiketnya, bukan lewat
      // indeks: data server bisa datang dengan urutan berbeda, dan indeks yang
      // dipertahankan akan diam-diam memindahkan panel ke laporan lain.
      const tiket = s.data[s.kls]?.lapor[s.lap]?.tiket;
      let kls = Math.min(s.kls, Math.max(0, a.data.length - 1));
      let lap = Math.min(s.lap, Math.max(0, (a.data[kls]?.lapor.length ?? 1) - 1));
      if (tiket) {
        for (let i = 0; i < a.data.length; i += 1) {
          const j = a.data[i].lapor.findIndex((l) => l.tiket === tiket);
          if (j >= 0) {
            kls = i;
            lap = j;
            break;
          }
        }
      }
      return { ...s, data: a.data, kls, lap, undo: null };
    }

    case "undo":
      // Saat meja terhubung database, membatalkan di layar saja menyesatkan:
      // tulisannya sudah mendarat di server. Tombolnya pun disembunyikan.
      if (!s.undo || s.langsung) return s;
      return { ...s, data: s.undo, undo: null, toast: null };

    case "tutup-toast":
      return { ...s, toast: null };

    default:
      return s;
  }
}
