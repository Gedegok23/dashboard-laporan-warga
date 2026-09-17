import type { Jenis, NamaIkon } from "./tipe";

/**
 * Jenis masalah kota beserta identitas visualnya di portal. Warna disimpan
 * sebagai token CSS (`--kat-<jenis>`) supaya mode gelap bisa menimpanya tanpa
 * menyentuh berkas ini.
 */
export const JENIS: Record<Jenis, { label: string; ikon: NamaIkon }> = {
  infrastruktur: { label: "Infrastruktur", ikon: "kerja" },
  lingkungan: { label: "Lingkungan", ikon: "pohon" },
  keamanan: { label: "Keamanan", ikon: "perisai" },
  kesehatan: { label: "Kesehatan", ikon: "kesehatan" },
  sosial: { label: "Sosial", ikon: "regu" },
  lainnya: { label: "Lainnya", ikon: "dokumen" },
};

export const URUT_JENIS: Jenis[] = [
  "infrastruktur",
  "lingkungan",
  "keamanan",
  "kesehatan",
  "sosial",
  "lainnya",
];
