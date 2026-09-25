import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { NAMA_COOKIE, bacaSesi } from "@/lib/sesi";

/**
 * Pintu meja petugas.
 *
 * Penjagaannya pindah dari HTTP Basic ke cookie sesi bertanda tangan. Basic
 * memaksa peramban menampilkan kotak masuk bawaan yang tidak bisa diberi
 * penjelasan, tidak bisa diberi tombol keluar, dan mengirim ulang sandi pada
 * setiap permintaan. Sekarang sandi melintas sekali di /masuk.
 *
 * Gagal tertutup tetap berlaku: tanpa kredensial di server, tidak ada cookie
 * yang bisa ditandatangani, jadi tidak ada yang bisa masuk.
 */
export async function proxy(request: NextRequest) {
  const akun = await bacaSesi(request.cookies.get(NAMA_COOKIE)?.value);
  if (akun) {
    // Nama akun yang lolos diteruskan ke halaman. Sebelum ini kop dan kalimat
    // jejak audit memakai nama petugas karangan dari data contoh, yang berarti
    // layar mengaku mencatat audit atas nama orang yang tidak ada.
    const kepala = new Headers(request.headers);
    kepala.set("x-meja-akun", akun);
    return NextResponse.next({ request: { headers: kepala } });
  }

  // Jalur yang diminta dibawa serta supaya setelah masuk petugas mendarat di
  // tempat yang tadi dituju, bukan selalu di beranda.
  const ke = new URL("/masuk", request.url);
  const asal = request.nextUrl.pathname + request.nextUrl.search;
  if (asal !== "/") ke.searchParams.set("next", asal);
  return NextResponse.redirect(ke);
}

export const config = {
  // Semua kecuali portal warga, halaman masuk, unggahan lapangan, penyaji
  // gambar, dan berkas statis. `/berkas` memeriksa haknya sendiri: foto
  // laporan publik memang boleh dilihat siapa saja, sedangkan aslinya hanya
  // untuk petugas.
  //
  // Berkas di public/ ikut dikecualikan lewat akhirannya. Tanpa itu logo dan
  // favicon ikut dialihkan ke /masuk, dan pengoptimal gambar Next yang
  // mengambil sumbernya sendiri lewat HTTP gagal dengan 400. Rute meja tidak
  // pernah punya titik di jalurnya, jadi aturan ini tidak membuka apa pun.
  matcher: [
    "/((?!portal|masuk|lapangan|berkas|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml|json|webmanifest)$).*)",
  ],
};
