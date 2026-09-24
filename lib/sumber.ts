import { cache } from "react";

import { dataAwal, harian } from "./data";
import { dataMejaDb, dataPortalDb, harianDb, pakaiDatabase } from "./db";
import { dataPortal } from "./logika";
import type { Klaster, KelompokPortal } from "./tipe";

/**
 * Sumber isi portal. Memakai PostgreSQL bila `MEJA_DATABASE_URL` disetel,
 * selain itu jatuh ke data contoh supaya pengembangan lokal tetap jalan tanpa
 * database. Bila database disetel tapi gagal dijangkau, portal tetap tampil
 * dengan data contoh dan kegagalannya dicatat, bukan menjatuhkan halaman.
 */
export const isiPortal = cache(async function isiPortal(): Promise<{
  kelompok: KelompokPortal[];
  langsung: boolean;
}> {
  if (pakaiDatabase()) {
    try {
      const db = await dataPortalDb();
      if (db) return { kelompok: db, langsung: true };
    } catch (e) {
      console.error("[portal] database tidak terjangkau, memakai data contoh:", e);
    }
  }
  return { kelompok: dataPortal(dataAwal), langsung: false };
});

export const semuaLaporanPortal = async () => (await isiPortal()).kelompok.flatMap((g) => g.lapor);

/**
 * Sumber isi meja petugas. Aturannya sama dengan portal: database bila
 * disetel, data contoh bila tidak, dan tetap tampil bila database mati.
 */
export const isiMeja = cache(async function isiMeja(): Promise<{ data: Klaster[]; langsung: boolean }> {
  if (pakaiDatabase()) {
    try {
      const db = await dataMejaDb();
      // Database kosong tetap dianggap sah: meja menampilkan keadaan kosong,
      // bukan diam-diam jatuh ke data contoh yang menyesatkan petugas.
      if (db) return { data: db, langsung: true };
    } catch (e) {
      console.error("[meja] database tidak terjangkau, memakai data contoh:", e);
    }
  }
  return { data: dataAwal, langsung: false };
});

/** Deret laporan harian: database bila ada, selain itu data contoh 14 hari. */
export const isiHarian = cache(async function isiHarian(): Promise<{
  harian: [string, number][];
  langsung: boolean;
}> {
  if (pakaiDatabase()) {
    try {
      const db = await harianDb();
      if (db) return { harian: db, langsung: true };
    } catch (e) {
      console.error("[tren] database tidak terjangkau, memakai data contoh:", e);
    }
  }
  return { harian, langsung: false };
});
