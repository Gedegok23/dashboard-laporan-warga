import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Dashboard instansi berisi identitas pelapor, catatan kerja internal, dan
 * tombol yang mengubah status laporan warga. Portal warga terbuka untuk umum,
 * dashboard tidak.
 *
 * Gagal tertutup: bila kredensial belum disetel, dashboard ditolak sama sekali,
 * bukan dibiarkan terbuka.
 */
function sah(header: string | null) {
  const user = process.env.MEJA_ADMIN_USER;
  const pass = process.env.MEJA_ADMIN_PASS;
  if (!user || !pass) return false;
  if (!header?.startsWith("Basic ")) return false;
  let isi: string;
  try {
    isi = atob(header.slice(6));
  } catch {
    return false;
  }
  const pisah = isi.indexOf(":");
  if (pisah < 0) return false;
  // Perbandingan panjang tetap supaya waktu jawab tidak membocorkan kredensial.
  return aman(isi.slice(0, pisah), user) && aman(isi.slice(pisah + 1), pass);
}

function aman(a: string, b: string) {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i += 1) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

export function proxy(request: NextRequest) {
  if (sah(request.headers.get("authorization"))) return NextResponse.next();

  const belumDisetel = !process.env.MEJA_ADMIN_USER || !process.env.MEJA_ADMIN_PASS;
  return new NextResponse(
    belumDisetel
      ? "Dashboard belum dibuka: MEJA_ADMIN_USER dan MEJA_ADMIN_PASS belum disetel di server."
      : "Meja petugas hanya untuk petugas instansi.",
    {
      status: 401,
      headers: {
        "WWW-Authenticate": belumDisetel ? "" : 'Basic realm="Meja Laporan Warga", charset="UTF-8"',
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}

export const config = {
  // Semua kecuali portal warga, berkas statis, dan favicon.
  matcher: ["/((?!portal|_next/static|_next/image|favicon.ico).*)"],
};
