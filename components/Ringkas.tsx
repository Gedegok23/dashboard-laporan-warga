"use client";

import { useMeja } from "./MejaProvider";
import { BATAS_HARI_KERJA } from "@/lib/data";
import { hitungRingkas } from "@/lib/logika";

export function Ringkas() {
  const { s } = useMeja();
  const h = hitungRingkas(s.data);
  const persenVerifikasi = h.antre ? Math.round((h.verifikasi / h.antre) * 100) : 0;

  return (
    <dl className="ringkas">
      <div>
        <dt>Antrean aktif</dt>
        <dd>
          <span className="angka">{h.antre}</span>
          <span className="delta">dari {h.total} laporan di meja</span>
        </dd>
      </div>
      <div>
        <dt>Perlu verifikasi</dt>
        <dd>
          <span className="angka">{h.verifikasi}</span>
          <span className="delta">{persenVerifikasi}% antrean</span>
        </dd>
      </div>
      <div className={h.lewat ? "kritis" : undefined}>
        <dt>Lewat batas {BATAS_HARI_KERJA} hari</dt>
        <dd>
          <span className="angka">{h.lewat}</span>
          <span className="delta">{h.lewat ? "perlu tindakan hari ini" : "tidak ada"}</span>
        </dd>
      </div>
      <div>
        <dt>Selesai dan duplikat</dt>
        <dd>
          <span className="angka">{h.selesai + h.duplikat}</span>
          <span className="delta">
            {h.selesai} selesai, {h.duplikat} duplikat
          </span>
        </dd>
      </div>
    </dl>
  );
}
