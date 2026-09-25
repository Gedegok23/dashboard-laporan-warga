/**
 * Sesi petugas: satu cookie bertanda tangan, tanpa tabel sesi.
 *
 * Sebelum ini dashboard dijaga HTTP Basic, jadi peramban yang menampilkan
 * kotak masuknya dan kredensial dikirim ulang pada setiap permintaan. Dengan
 * cookie, sandi hanya melintas sekali saat masuk.
 *
 * Kunci tanda tangan diturunkan dari MEJA_ADMIN_PASS, bukan disimpan terpisah.
 * Dua akibatnya disengaja: tidak ada rahasia baru yang harus dipasang di
 * server, dan mengganti sandi otomatis membatalkan semua sesi yang beredar.
 *
 * Hanya memakai Web Crypto supaya berkas ini jalan di dua tempat: proxy (Edge)
 * dan server action (Node).
 */

export const NAMA_COOKIE = "kito_sesi";
/** Satu giliran kerja. Lewat itu petugas masuk lagi. */
export const UMUR_SESI = 8 * 60 * 60;

const LABEL = "kito-sesi-v1";

const b64url = (b: Uint8Array) => {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const dariB64url = (s: string) => {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  const isi = atob(p + "=".repeat((4 - (p.length % 4)) % 4));
  return Uint8Array.from(isi, (c) => c.charCodeAt(0));
};

async function kunci() {
  const rahasia = process.env.MEJA_ADMIN_PASS;
  if (!rahasia) return null;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${LABEL}:${rahasia}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Perbandingan panjang tetap: waktu jawab tidak boleh membocorkan tanda tangan. */
function sama(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i += 1) beda |= a[i] ^ b[i];
  return beda === 0;
}

export async function tulisSesi(akun: string): Promise<string | null> {
  const k = await kunci();
  if (!k) return null;
  const isi = b64url(
    new TextEncoder().encode(JSON.stringify({ u: akun, exp: Math.floor(Date.now() / 1000) + UMUR_SESI })),
  );
  const tanda = b64url(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(isi))));
  return `${isi}.${tanda}`;
}

/** Nama akun bila cookie utuh dan belum kedaluwarsa, null bila tidak. */
export async function bacaSesi(nilai: string | undefined): Promise<string | null> {
  if (!nilai) return null;
  const titik = nilai.indexOf(".");
  if (titik < 1) return null;
  const k = await kunci();
  if (!k) return null;

  const isi = nilai.slice(0, titik);
  let diberi: Uint8Array;
  try {
    diberi = dariB64url(nilai.slice(titik + 1));
  } catch {
    return null;
  }
  const benar = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(isi)));
  if (!sama(diberi, benar)) return null;

  try {
    const { u, exp } = JSON.parse(new TextDecoder().decode(dariB64url(isi)));
    if (typeof u !== "string" || typeof exp !== "number") return null;
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return u;
  } catch {
    return null;
  }
}
