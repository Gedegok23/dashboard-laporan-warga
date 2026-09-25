/**
 * Waktu: disimpan UTC, ditampilkan WIB.
 *
 * Server, Postgres, dan proses Node semuanya berjalan di UTC, dan itu
 * dibiarkan: instan yang tersimpan jadi tidak bergantung pada setelan mesin.
 * Yang salah sebelumnya adalah penyajiannya. Semua pemformat memakai
 * `Date#getHours()` dan kerabatnya, yang membaca zona proses, sehingga jam
 * yang dilihat warga dan petugas mundur tujuh jam dari waktu setempat.
 *
 * Konversi ke WIB dilakukan di sini, sekali, dan dinyatakan terang-terangan
 * lewat `timeZone`. Dengan begitu tampilannya tetap benar walau nanti ada yang
 * mengubah zona waktu server.
 */

export const ZONA = "Asia/Jakarta";
export const LABEL_ZONA = "WIB";

const pecah = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export type BagianWaktu = {
  tahun: number;
  /** 1 sampai 12, bukan 0 sampai 11 seperti Date#getMonth. */
  bulan: number;
  tanggal: number;
  jam: number;
  menit: number;
};

/** Pecahan tanggal dan jam sebuah instan, dibaca di WIB. */
export function bagianWib(d: Date): BagianWaktu {
  const p: Record<string, string> = {};
  for (const bagian of pecah.formatToParts(d)) p[bagian.type] = bagian.value;
  return {
    tahun: Number(p.year),
    bulan: Number(p.month),
    tanggal: Number(p.day),
    // Tengah malam bisa keluar sebagai "24" di sebagian mesin.
    jam: Number(p.hour) % 24,
    menit: Number(p.minute),
  };
}

/** Tengah malam WIB pada hari yang memuat instan ini, sebagai milidetik UTC. */
export function awalHariWib(d: Date): number {
  const b = bagianWib(d);
  return Date.UTC(b.tahun, b.bulan - 1, b.tanggal);
}

export const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
