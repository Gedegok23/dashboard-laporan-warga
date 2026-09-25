import { redirect } from "next/navigation";

/**
 * Peta disembunyikan sementara.
 *
 * Belum ada laporan yang membawa titik lokasi, dan koordinat hanya datang dari
 * lokasi yang dibagikan warga sendiri lewat Telegram. Sampai titik pertama
 * masuk, halaman ini tidak punya apa pun untuk digambar.
 *
 * Isinya tidak dibuang: halaman aslinya ada di Halaman.tsx di folder yang sama,
 * lengkap dengan peta dan sebaran per jenis. Mengembalikannya berarti menjadikan
 * berkas itu `page.tsx` lagi dan memasang kembali tautan "Peta" di TAUTAN pada
 * app/portal/layout.tsx.
 *
 * Tautan lama tidak dibiarkan mati: pengunjung diarahkan ke daftar laporan.
 */
export default function PetaDisembunyikan() {
  redirect("/portal/laporan");
}
