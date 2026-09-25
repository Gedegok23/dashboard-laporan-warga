"use client";

import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";
import { TINDAK } from "@/lib/data";
import { bebanInstansi, bebanPetugas, hitungRingkas, hitungTindak } from "@/lib/logika";
import { gulirKe } from "@/lib/gerak";
import type { NamaIkon, Saring, SaringTindak } from "@/lib/tipe";

const PENANGANAN: { nilai: SaringTindak; label: string; ikon: NamaIkon; tanda?: boolean }[] = [
  { nilai: "semua", label: "Semua pekerjaan", ikon: "kerja" },
  { nilai: "tanpa-petugas", label: "Menunggu regu", ikon: "tugas", tanda: true },
  { nilai: "proses", label: TINDAK.proses.nama, ikon: TINDAK.proses.ikon },
  { nilai: "selesai", label: TINDAK.selesai.nama, ikon: TINDAK.selesai.ikon },
];

const ANTREAN: { nilai: Saring; label: string; ikon: NamaIkon; tanda?: boolean }[] = [
  { nilai: "semua", label: "Semua aktif", ikon: "kotak-masuk" },
  { nilai: "0", label: "Perlu verifikasi", ikon: "tunggu" },
  { nilai: "lewat", label: "Lewat batas", ikon: "peringatan", tanda: true },
  { nilai: "dup", label: "Ditandai duplikat", ikon: "salin" },
];

const lompat = (id: string) => gulirKe(id);

export function Rail() {
  const { s, kirim } = useMeja();
  const h = hitungRingkas(s.data);
  const t = hitungTindak(s.data);
  const regu = bebanPetugas(s.data);
  const beban = bebanInstansi(s.data);

  const jumlahTindak: Record<string, number> = {
    semua: t.total,
    "tanpa-petugas": t.tanpaPetugas,
    proses: t.proses,
    selesai: t.selesai,
  };

  const jumlah: Record<string, number> = {
    semua: h.antre,
    "0": h.verifikasi,
    lewat: h.lewat,
    dup: h.duplikat,
  };

  const maksRegu = Math.max(1, ...regu.map((r) => r.n));

  return (
    <div className="rail">
      <div>
        <p className="label">Penanganan lapangan</p>
        <nav>
          {PENANGANAN.map((a) => (
            <button
              key={a.nilai}
              type="button"
              aria-current={s.tindak === a.nilai}
              onClick={() => {
                kirim({ t: "saring-tindak", nilai: a.nilai });
                lompat("penanganan");
              }}
            >
              <Ikon nama={a.ikon} ukuran={19} />
              {a.label}
              <span className={`n${a.tanda && jumlahTindak[a.nilai] ? " tanda" : ""}`}>
                {jumlahTindak[a.nilai]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        <p className="label">Beban regu lapangan</p>
        {regu.length === 0 ? (
          <p className="bantu">Belum ada regu yang sedang memegang laporan.</p>
        ) : (
          <div className="instansi-list">
            {regu.map((r) => (
              <div key={r.petugas.id}>
                <b>
                  {r.petugas.nama}
                  <span className="sub">{r.petugas.regu}</span>
                  <span className="meter">
                    <i style={{ width: `${Math.round((r.n / maksRegu) * 100)}%` }} />
                  </span>
                </b>
                <span>{r.n}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="label">Antrean triase</p>
        <nav>
          {ANTREAN.map((a) => (
            <button
              key={a.nilai}
              type="button"
              aria-current={s.saring === a.nilai}
              onClick={() => {
                kirim({ t: "saring", nilai: a.nilai });
                lompat("triase");
              }}
            >
              <Ikon nama={a.ikon} ukuran={19} />
              {a.label}
              <span className={`n${a.tanda && jumlah[a.nilai] ? " tanda" : ""}`}>
                {jumlah[a.nilai]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        <p className="label">Beban instansi</p>
        <div className="instansi-list">
          {beban.map((b) => (
            <div key={b.nama}>
              <b>
                {b.nama}
                <span className="meter">
                  <i style={{ width: `${b.persen}%` }} />
                </span>
              </b>
              <span>{b.n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
