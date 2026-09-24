/**
 * Identitas produk.
 *
 * Nama dipisah dari nama daerah di lib/kota.ts: daerah berganti per pemasangan,
 * nama produk tidak. Halaman memakai konstanta ini, bukan string lepas, supaya
 * satu perubahan nama tidak meninggalkan sisa di pojok yang terlewat.
 */
export const MEREK = {
  /** Nama pendek, dipakai di kop, judul tab, dan realm autentikasi. */
  nama: "KITO",
  /** Kepanjangan, dipakai sekali di tempat yang memang menjelaskan. */
  panjang: "Kanal Informasi, Transparansi & Observasi",
  /** Semboyan. Bahasa Palembang: "Suara kita, urusan kita". */
  semboyan: "Suaro Kito, Urusan Kito",
  /** Monogram di dalam lingkaran stempel. Satu huruf supaya tetap terbaca di 34px. */
  monogram: "K",
} as const;
