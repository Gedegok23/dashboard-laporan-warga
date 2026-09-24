"use client";

import { MapContainer, CircleMarker, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";
import { JENIS } from "@/lib/kategori";
import type { LaporanPortal } from "@/lib/tipe";
import "leaflet/dist/leaflet.css";

/**
 * Pusat peta dihitung dari titik laporan yang ada, bukan dipaku ke satu kota.
 * Dengan begitu peta selalu terbuka di wilayah yang datanya benar-benar ada.
 */
function pusatDari(daftar: LaporanPortal[]): [number, number] {
  const titik = daftar.map((l) => l.titik).filter(([a, b]) => a !== 0 || b !== 0);
  if (!titik.length) return [-2.976, 104.775];
  const lat = titik.reduce((n, t) => n + t[0], 0) / titik.length;
  const lng = titik.reduce((n, t) => n + t[1], 0) / titik.length;
  return [lat, lng];
}

const WARNA: Record<string, string> = {
  infrastruktur: "#ea580c",
  lingkungan: "#16a34a",
  keamanan: "#2563eb",
  kesehatan: "#e11d48",
  sosial: "#9333ea",
  lainnya: "#64748b",
};

export function PetaLaporan({ daftar }: { daftar: LaporanPortal[] }) {
  return (
    <MapContainer center={pusatDari(daftar)} zoom={12} scrollWheelZoom className="peta">
      <TileLayer
        attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {daftar.map((l) => (
        <CircleMarker
          key={l.tiket}
          center={l.titik}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: WARNA[l.jenis] ?? WARNA.lainnya,
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <span className="peta-pop">
              <b>{JENIS[l.jenis].label}</b>
              <span>{l.ringkas}</span>
              <span className="peta-lokasi">Kel. {l.kelurahan}</span>
              <Link href={`/portal/laporan/${l.tiket}`}>Buka rincian</Link>
            </span>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
