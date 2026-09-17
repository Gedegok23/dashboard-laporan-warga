import { BATAS_HARI_KERJA, TAHAP } from "./data";
import type { Arah, BarisLog, Klaster, Laporan, Saring, Tahap, Urut } from "./tipe";

/** Laporan yang masih membebani antrean: belum selesai dan bukan duplikat. */
export const aktif = (l: Laporan) => !l.duplikat && l.tahap < 3;

export const lewatBatas = (l: Laporan) =>
  aktif(l) && l.sisa !== null && l.sisa < 0;

/** Tahap klaster diturunkan dari laporan aktif yang paling tertinggal. */
export function tahapKlaster(k: Klaster): Tahap {
  const hidup = k.lapor.filter(aktif);
  return hidup.length ? (Math.min(...hidup.map((l) => l.tahap)) as Tahap) : 3;
}

export const terbaruKlaster = (k: Klaster) =>
  k.lapor.length ? Math.max(...k.lapor.map((l) => l.ts)) : 0;

/** YYMMDDHHMM menjadi "16 Sep 14:02". */
export function fmtTs(ts: number) {
  const s = String(ts);
  return `${s.slice(4, 6).replace(/^0/, "")} Sep ${s.slice(6, 8)}:${s.slice(8, 10)}`;
}

export const instansiLaporan = (l: Laporan, k: Klaster) => l.instansi || k.instansi;

export function laporCocok(l: Laporan, k: Klaster, saring: Saring, kunci: string) {
  if (saring === "dup") {
    if (!l.duplikat) return false;
  } else if (saring === "lewat") {
    if (!lewatBatas(l)) return false;
  } else if (saring === "3") {
    if (l.tahap !== 3) return false;
  } else if (saring !== "semua") {
    if (!(aktif(l) && String(l.tahap) === saring)) return false;
  } else if (l.duplikat) return false;

  if (!kunci) return true;
  return [
    l.tiket,
    l.ringkas,
    l.jalan,
    l.kelurahan,
    l.kecamatan,
    l.mentah,
    k.kategori,
    k.id,
    instansiLaporan(l, k),
  ]
    .join(" ")
    .toLowerCase()
    .includes(kunci.toLowerCase());
}

export const klasterCocok = (k: Klaster, saring: Saring, kunci: string) =>
  k.lapor.some((l) => laporCocok(l, k, saring, kunci));

export function bandingKlaster(a: Klaster, b: Klaster, urut: Urut, arah: Arah) {
  const arahAngka = arah === "turun" ? -1 : 1;
  let v: number;
  if (urut === "waktu") v = terbaruKlaster(a) - terbaruKlaster(b);
  else if (urut === "tahap") v = tahapKlaster(a) - tahapKlaster(b);
  else if (urut === "instansi") v = a.instansi.localeCompare(b.instansi, "id");
  else v = a.kategori.localeCompare(b.kategori, "id");
  return v * arahAngka;
}

export const semuaLapor = (data: Klaster[]) =>
  data.flatMap((k, i) => k.lapor.map((l, j) => ({ k, l, i, j })));

export function hitungRingkas(data: Klaster[]) {
  const semua = semuaLapor(data);
  const antre = semua.filter((o) => aktif(o.l)).length;
  return {
    total: semua.length,
    antre,
    verifikasi: semua.filter((o) => aktif(o.l) && o.l.tahap === 0).length,
    diteruskan: semua.filter((o) => aktif(o.l) && o.l.tahap === 1).length,
    ditindaklanjuti: semua.filter((o) => aktif(o.l) && o.l.tahap === 2).length,
    lewat: semua.filter((o) => lewatBatas(o.l)).length,
    selesai: semua.filter((o) => o.l.tahap === 3).length,
    duplikat: semua.filter((o) => o.l.duplikat).length,
  };
}

export function bebanInstansi(data: Klaster[], daftar: string[]) {
  const beban = daftar
    .map((nama) => ({
      nama,
      n: semuaLapor(data).filter((o) => aktif(o.l) && instansiLaporan(o.l, o.k) === nama).length,
    }))
    .sort((a, b) => b.n - a.n);
  const maks = Math.max(1, ...beban.map((b) => b.n));
  return beban.map((b) => ({ ...b, persen: Math.round((b.n / maks) * 100) }));
}

const tambahMenit = (jam: string, n: number) => {
  const [h, m] = jam.split(":").map(Number);
  const total = h * 60 + m + n;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Log bot disusun ulang dari berkas laporan: alur bot memang berskrip, yang
 * berbeda per laporan adalah input mentah, foto, dan hasil klasifikasi.
 */
export function susunLog(l: Laporan, k: Klaster): BarisLog[] {
  const baris: BarisLog[] = [
    {
      siapa: "Warga",
      peran: "warga",
      ikon: "warga",
      jam: l.jam,
      teks: `Pesan masuk lewat ${l.kanal}.`,
      mentah: l.mentah,
    },
    {
      siapa: "Bot",
      peran: "bot",
      ikon: "bot",
      jam: l.jam,
      teks: "Terima kasih, laporan Anda kami catat. Boleh kirim foto lokasinya?",
    },
  ];

  if (l.foto.nama === "tidak ada lampiran") {
    baris.push({
      siapa: "Bot",
      peran: "bot",
      ikon: "bot",
      jam: tambahMenit(l.jam, 7),
      teks: "Belum ada foto yang masuk. Laporan tetap diproses, foto bisa menyusul.",
    });
  } else {
    baris.push({
      siapa: "Warga",
      peran: "warga",
      ikon: "kamera",
      jam: tambahMenit(l.jam, 2),
      teks: `Mengirim foto ${l.foto.nama} (${l.foto.ukuran}).`,
    });
  }

  baris.push({
    siapa: "Bot",
    peran: "bot",
    ikon: "bot",
    jam: tambahMenit(l.jam, 3),
    teks: `Lokasi terbaca: ${l.jalan}, Kel. ${l.kelurahan}. Sudah benar?`,
  });
  baris.push({
    siapa: "Warga",
    peran: "warga",
    ikon: "warga",
    jam: tambahMenit(l.jam, 4),
    teks: "Konfirmasi lokasi.",
    mentah: "iya betul itu",
  });
  baris.push({
    siapa: "Sistem",
    peran: "sistem",
    ikon: "kilau",
    jam: tambahMenit(l.jam, 4),
    teks:
      `Klasifikasi otomatis: ${k.kategori} dengan skor ${l.skor.toFixed(2)}. ` +
      (l.skor >= k.ambang
        ? `Kemiripan melewati ambang klaster ${k.ambang.toFixed(2)}, dipetakan ke ${k.id}.`
        : `Skor di bawah ambang klaster ${k.ambang.toFixed(2)}, ditandai untuk penilaian petugas.`),
  });
  baris.push({
    siapa: "Sistem",
    peran: "sistem",
    ikon: "basis-data",
    jam: tambahMenit(l.jam, 5),
    teks: `Tiket ${l.tiket} ditulis ke basis data dengan penanggung jawab awal ${k.instansi}.`,
  });
  baris.push({
    siapa: "Bot",
    peran: "bot",
    ikon: "bot",
    jam: tambahMenit(l.jam, 5),
    teks: `Nomor tiket Anda ${l.tiket}. Batas tindak lanjut instansi ${BATAS_HARI_KERJA} hari kerja.`,
  });

  return baris.concat(l.tambahan ?? []);
}

export const namaTahap = (t: Tahap) => TAHAP[t].nama;
