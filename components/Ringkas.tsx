"use client";

import { useMeja } from "./MejaProvider";
import { BATAS_HARI_KERJA } from "@/lib/data";
import { hitungRingkas, hitungTindak } from "@/lib/logika";

export function Ringkas() {
  const { s } = useMeja();
  const h = hitungRingkas(s.data);
  const t = hitungTindak(s.data);

  return (
    <dl className="ringkas">
      <div>
        <dt>Menunggu regu</dt>
        <dd>
          <span className="angka">{t.tanpaPetugas}</span>
          <span className="delta">dari {t.total} laporan di instansi</span>
        </dd>
      </div>
      <div>
        <dt>Sedang ditindak</dt>
        <dd>
          <span className="angka">{t.proses}</span>
          <span className="delta">
            {t.tanpaBukti ? `${t.tanpaBukti} belum ada bukti` : "bukti lengkap"}
          </span>
        </dd>
      </div>
      <div className={t.lewat ? "kritis" : undefined}>
        <dt>Lewat batas {BATAS_HARI_KERJA} hari</dt>
        <dd>
          <span className="angka">{t.lewat}</span>
          <span className="delta">
            {t.lewat ? "perlu tindakan hari ini" : `tidak ada, ${h.lewat} masih di triase`}
          </span>
        </dd>
      </div>
      <div>
        <dt>Sudah ditindak</dt>
        <dd>
          <span className="angka">{t.selesai}</span>
          <span className="delta">
            {t.umpan} umpan balik terkirim, {h.verifikasi} masih di triase
          </span>
        </dd>
      </div>
    </dl>
  );
}
