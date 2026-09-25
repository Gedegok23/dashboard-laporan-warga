import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Foto dari kamera HP lazimnya 2-5 MB, sedangkan batas bawaan Server Action
    // hanya 1 MB. Tanpa ini, unggahan bukti ditolak framework sebelum kode
    // aplikasi jalan, dan peramban cuma menampilkan error React tanpa sebab.
    //
    // Angkanya sengaja di atas batas 12 MB milik `periksaGambar`, supaya berkas
    // kebesaran ditolak oleh validasi kita dengan pesan yang bisa dibaca petugas,
    // bukan oleh framework dengan pesan yang disembunyikan.
    serverActions: { bodySizeLimit: "14mb" },
  },
};

export default nextConfig;
