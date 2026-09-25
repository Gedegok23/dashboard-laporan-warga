"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { NAMA_COOKIE, UMUR_SESI, tulisSesi } from "@/lib/sesi";

export type HasilMasuk = { pesan: string } | null;

/**
 * Pembatas percobaan, di memori proses.
 *
 * Cukup untuk satu proses Next di satu server, yang memang bentuk pemasangan
 * ini. Kalau nanti berjalan lebih dari satu proses, hitungannya harus pindah
 * ke Postgres seperti cek_status_log milik agent.
 */
const JENDELA = 10 * 60 * 1000;
const MAKS = 8;
const percobaan = new Map<string, { n: number; sejak: number }>();

function terlaluSering(kunci: string) {
  const kini = Date.now();
  const ada = percobaan.get(kunci);
  if (!ada || kini - ada.sejak > JENDELA) {
    percobaan.set(kunci, { n: 1, sejak: kini });
    return false;
  }
  ada.n += 1;
  return ada.n > MAKS;
}

/** Perbandingan panjang tetap, sama seperti di proxy. */
function aman(a: string, b: string) {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i += 1) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

/** Hanya jalur lokal. Tanpa ini, ?next= bisa dipakai melempar orang ke situs lain. */
function tujuanAman(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

export async function masukAksi(_sebelum: HasilMasuk, borang: FormData): Promise<HasilMasuk> {
  const user = process.env.MEJA_ADMIN_USER;
  const sandi = process.env.MEJA_ADMIN_PASS;
  if (!user || !sandi) {
    return { pesan: "Dashboard belum dibuka di server ini. Hubungi pengelola sistem." };
  }

  const kepala = await headers();
  // Next berjalan langsung di port 3000 tanpa proxy di depannya, jadi alamat
  // asli sering tidak ada. Saat itu terjadi hitungannya jadi satu ember
  // bersama: menahan tebakan beruntun lebih penting daripada memisahkan sumber.
  const dari = kepala.get("x-forwarded-for")?.split(",")[0].trim() || "bersama";
  if (terlaluSering(dari)) {
    return { pesan: "Terlalu banyak percobaan. Tunggu sepuluh menit lalu coba lagi." };
  }

  const namaDiisi = String(borang.get("akun") ?? "");
  const sandiDiisi = String(borang.get("sandi") ?? "");
  // Keduanya selalu dibandingkan supaya lama jawab tidak menunjukkan bagian mana yang salah.
  const namaCocok = aman(namaDiisi, user);
  const sandiCocok = aman(sandiDiisi, sandi);
  if (!namaCocok || !sandiCocok) {
    return { pesan: "Nama akun atau sandi salah." };
  }

  const token = await tulisSesi(user);
  if (!token) return { pesan: "Sesi gagal dibuat. Coba lagi." };

  percobaan.delete(dari);
  const toples = await cookies();
  toples.set(NAMA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_SESI,
    // Server ini masih melayani HTTP polos, dan cookie bertanda `secure` tidak
    // akan pernah terkirim di sana. Ditandai hanya bila sambungannya memang TLS.
    secure: kepala.get("x-forwarded-proto") === "https",
  });

  redirect(tujuanAman(borang.get("next") ? String(borang.get("next")) : null));
}

export async function keluarAksi() {
  const toples = await cookies();
  toples.delete(NAMA_COOKIE);
  redirect("/masuk");
}
