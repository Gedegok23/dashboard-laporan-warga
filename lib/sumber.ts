import { dataAwal } from "./data";
import { dataPortalDb, pakaiDatabase } from "./db";
import { dataPortal } from "./logika";
import type { KelompokPortal } from "./tipe";

/**
 * Sumber isi portal. Memakai PostgreSQL bila `MEJA_DATABASE_URL` disetel,
 * selain itu jatuh ke data contoh supaya pengembangan lokal tetap jalan tanpa
 * database. Bila database disetel tapi gagal dijangkau, portal tetap tampil
 * dengan data contoh dan kegagalannya dicatat, bukan menjatuhkan halaman.
 */
export async function isiPortal(): Promise<{ kelompok: KelompokPortal[]; langsung: boolean }> {
  if (pakaiDatabase()) {
    try {
      const db = await dataPortalDb();
      if (db) return { kelompok: db, langsung: true };
    } catch (e) {
      console.error("[portal] database tidak terjangkau, memakai data contoh:", e);
    }
  }
  return { kelompok: dataPortal(dataAwal), langsung: false };
}

export const semuaLaporanPortal = async () => (await isiPortal()).kelompok.flatMap((g) => g.lapor);
