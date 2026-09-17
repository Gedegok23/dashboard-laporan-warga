"use client";

import { MapContainer, CircleMarker, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";
import { JENIS } from "@/lib/kategori";
import type { LaporanPortal } from "@/lib/tipe";
import "leaflet/dist/leaflet.css";

const PUSAT: [number, number] = [-6.914, 107.61];

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
    <MapContainer center={PUSAT} zoom={12} scrollWheelZoom className="peta">
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
