import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { MEREK } from "@/lib/merek";

/**
 * Dashboard instansi berisi identitas pelapor, catatan kerja internal, dan
 * tombol yang mengubah status laporan warga. Portal warga terbuka untuk umum,
 * dashboard tidak.
 *
 * Gagal tertutup: bila kredensial belum disetel, dashboard ditolak sama sekali,
 * bukan dibiarkan terbuka.
 */
/** Nama akun bila kredensialnya cocok, null bila tidak. */
function akunSah(header: string | null) {
  const user = process.env.MEJA_ADMIN_USER;
  const pass = process.env.MEJA_ADMIN_PASS;
  if (!user || !pass) return null;
  if (!header?.startsWith("Basic ")) return null;
  let isi: string;
  try {
    isi = atob(header.slice(6));
  } catch {
    return null;
  }
  const pisah = isi.indexOf(":");
  if (pisah < 0) return null;
  // Keduanya selalu dibandingkan, dan dengan panjang tetap, supaya waktu jawab
  // tidak membocorkan kredensial.
  const namaCocok = aman(isi.slice(0, pisah), user);
  const sandiCocok = aman(isi.slice(pisah + 1), pass);
  return namaCocok && sandiCocok ? user : null;
}

function aman(a: string, b: string) {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i += 1) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

export function proxy(request: NextRequest) {
  const akun = akunSah(request.headers.get("authorization"));
  if (akun) {
    // Nama akun yang lolos diteruskan ke halaman. Sebelum ini kop dan kalimat
    // jejak audit memakai nama petugas karangan dari data contoh, yang berarti
    // layar mengaku mencatat audit atas nama orang yang tidak ada.
    const kepala = new Headers(request.headers);
    kepala.set("x-meja-akun", akun);
    return NextResponse.next({ request: { headers: kepala } });
  }

  const belumDisetel = !process.env.MEJA_ADMIN_USER || !process.env.MEJA_ADMIN_PASS;
  return new NextResponse(
    belumDisetel
      ? "Dashboard belum dibuka: MEJA_ADMIN_USER dan MEJA_ADMIN_PASS belum disetel di server."
      : "Meja petugas hanya untuk petugas instansi.",
    {
      status: 401,
      headers: {
        "WWW-Authenticate": belumDisetel ? "" : `Basic realm="${MEREK.nama}", charset="UTF-8"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}

export const config = {
  // Semua kecuali portal warga, penyaji gambar, berkas statis, dan favicon.
  // `/berkas` memeriksa haknya sendiri: foto laporan publik memang boleh
  // dilihat siapa saja, sedangkan aslinya hanya untuk petugas.
  matcher: ["/((?!portal|lapangan|berkas|_next/static|_next/image|favicon.ico).*)"],
};
