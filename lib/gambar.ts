/**
 * Pemeriksaan gambar tanpa dependensi asing.
 *
 * Ekstensi dan header Content-Type datang dari pengunggah, jadi keduanya tidak
 * dipercaya. Jenis berkas ditentukan dari byte awalnya sendiri.
 */

export type JenisGambar = "image/jpeg" | "image/png" | "image/webp";

export type Periksa =
  | { sah: true; mime: JenisGambar; lebar: number | null; tinggi: number | null }
  | { sah: false; alasan: string };

const BATAS = 12 * 1024 * 1024;

/** Jenis ditentukan dari byte penanda, bukan dari nama atau header. */
function jenisDariByte(b: Uint8Array): JenisGambar | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length > 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length > 12 &&
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function ukuranPng(b: Uint8Array) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { lebar: v.getUint32(16), tinggi: v.getUint32(20) };
}

function ukuranJpeg(b: Uint8Array) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const tanda = b[i + 1];
    // SOF0..SOF15, kecuali penanda yang bukan awal bingkai.
    if (tanda >= 0xc0 && tanda <= 0xcf && tanda !== 0xc4 && tanda !== 0xc8 && tanda !== 0xcc) {
      return { tinggi: v.getUint16(i + 5), lebar: v.getUint16(i + 7) };
    }
    i += 2 + v.getUint16(i + 2);
  }
  return { lebar: null, tinggi: null };
}

function ukuranWebp(b: Uint8Array) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const bentuk = String.fromCharCode(b[12], b[13], b[14], b[15]);
  if (bentuk === "VP8 ") return { lebar: v.getUint16(26, true) & 0x3fff, tinggi: v.getUint16(28, true) & 0x3fff };
  if (bentuk === "VP8L") {
    const n = v.getUint32(21, true);
    return { lebar: (n & 0x3fff) + 1, tinggi: ((n >> 14) & 0x3fff) + 1 };
  }
  if (bentuk === "VP8X") {
    const l = b[24] | (b[25] << 8) | (b[26] << 16);
    const t = b[27] | (b[28] << 8) | (b[29] << 16);
    return { lebar: l + 1, tinggi: t + 1 };
  }
  return { lebar: null, tinggi: null };
}

export function periksaGambar(b: Uint8Array): Periksa {
  if (b.length === 0) return { sah: false, alasan: "berkas kosong" };
  if (b.length > BATAS) return { sah: false, alasan: "ukuran melebihi 12 MB" };
  const mime = jenisDariByte(b);
  if (!mime) return { sah: false, alasan: "hanya menerima JPEG, PNG, atau WebP" };
  try {
    const u = mime === "image/png" ? ukuranPng(b) : mime === "image/jpeg" ? ukuranJpeg(b) : ukuranWebp(b);
    return { sah: true, mime, lebar: u.lebar ?? null, tinggi: u.tinggi ?? null };
  } catch {
    return { sah: true, mime, lebar: null, tinggi: null };
  }
}

/**
 * Buang segmen metadata JPEG sebelum gambar disajikan ke publik.
 *
 * Foto ponsel membawa EXIF berisi koordinat GPS persis, merek perangkat, dan
 * kadang nama pemilik. Portal menampilkan foto pelapor ke siapa saja, jadi
 * metadata itu tidak boleh ikut keluar. Berkas asli tetap utuh di bucket
 * privat supaya petugas masih bisa memverifikasi lokasinya.
 */
export function tanpaMetadata(b: Uint8Array, mime: string): Uint8Array {
  if (mime !== "image/jpeg") return b;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const keluar: number[] = [0xff, 0xd8];
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) break;
    const tanda = b[i + 1];
    // Mulai data terkompresi: sisanya disalin apa adanya.
    if (tanda === 0xda) {
      return new Uint8Array([...keluar, ...b.subarray(i)]);
    }
    const panjang = v.getUint16(i + 2);
    const buang =
      (tanda >= 0xe0 && tanda <= 0xef) || // APP0..APP15: EXIF, XMP, ICC, JFIF
      tanda === 0xfe; // komentar
    if (!buang) keluar.push(...b.subarray(i, i + 2 + panjang));
    i += 2 + panjang;
  }
  return b;
}
