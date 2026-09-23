import { kolam } from "@/lib/db";
import { tanpaMetadata } from "@/lib/gambar";
import { ambilIsi, cariBerkas } from "@/lib/simpanan";

/**
 * Penyaji gambar. MinIO hanya mendengar di loopback dan buckernya privat, jadi
 * peramban tidak pernah bicara langsung dengannya: rute ini yang memeriksa hak
 * akses lalu meneruskan isinya.
 *
 * Dua bentuk jawaban untuk berkas yang sama:
 * - publik menerima salinan tanpa metadata (EXIF GPS foto pelapor dibuang)
 * - petugas yang sudah masuk menerima aslinya, karena koordinat EXIF itu yang
 *   dipakai memverifikasi lokasi laporan di meja
 */
function petugasSah(auth: string | null) {
  const user = process.env.MEJA_ADMIN_USER;
  const pass = process.env.MEJA_ADMIN_PASS;
  if (!user || !pass || !auth?.startsWith("Basic ")) return false;
  try {
    const isi = atob(auth.slice(6));
    const i = isi.indexOf(":");
    return i > 0 && isi.slice(0, i) === user && isi.slice(i + 1) === pass;
  } catch {
    return false;
  }
}

export async function GET(request: Request, ctx: RouteContext<"/berkas/[id]">) {
  const { id } = await ctx.params;
  const nomor = Number(id);
  if (!Number.isInteger(nomor) || nomor <= 0) {
    return new Response("Berkas tidak ditemukan.", { status: 404 });
  }

  const berkas = await cariBerkas(nomor);
  if (!berkas) return new Response("Berkas tidak ditemukan.", { status: 404 });

  const petugas = petugasSah(request.headers.get("authorization"));

  // Berkas hanya boleh terbuka untuk umum bila laporan yang memilikinya publik.
  if (!petugas) {
    const p = kolam();
    const { rows } = (await p?.query<{ n: string }>(
      `SELECT count(*) n FROM laporan l
        WHERE l.is_public
          AND (l.foto_berkas_id = $1
               OR EXISTS (SELECT 1 FROM bukti b WHERE b.laporan_id = l.id AND b.berkas_id = $1))`,
      [nomor],
    )) ?? { rows: [{ n: "0" }] };
    if (Number(rows[0].n) === 0) return new Response("Berkas tidak ditemukan.", { status: 404 });
  }

  const isi = await ambilIsi(berkas.bucket, berkas.kunci);
  if (!isi) return new Response("Berkas tidak ditemukan.", { status: 404 });

  const keluar = petugas ? isi : tanpaMetadata(isi, berkas.mime);
  return new Response(new Uint8Array(keluar) as unknown as BodyInit, {
    headers: {
      "Content-Type": berkas.mime,
      "Content-Length": String(keluar.length),
      // Isi objek tidak pernah berubah: kuncinya sekali pakai.
      "Cache-Control": petugas ? "private, max-age=300" : "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
