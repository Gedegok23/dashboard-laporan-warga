"use client";

import dynamic from "next/dynamic";
import type { LaporanPortal } from "@/lib/tipe";

/**
 * Leaflet menyentuh `window` saat modulnya dimuat, jadi peta hanya boleh
 * dirender di peramban. Pembungkus tipis ini yang memegang `ssr: false`,
 * karena opsi itu tidak boleh dipakai dari komponen server.
 */
const Peta = dynamic(() => import("./PetaLaporan").then((m) => m.PetaLaporan), {
  ssr: false,
  loading: () => (
    <div className="peta-muat" role="status">
      Memuat peta laporan...
    </div>
  ),
});

export function PetaKlien({ daftar }: { daftar: LaporanPortal[] }) {
  return <Peta daftar={daftar} />;
}
