"use client";

import Link from "next/link";
import { useState } from "react";
import { Ikon } from "../Ikon";
import { LencanaStatus } from "./LencanaStatus";
import { JENIS } from "@/lib/kategori";
import type { LaporanPortal } from "@/lib/tipe";

type Hasil = { ada: true; l: LaporanPortal } | { ada: false; tiket: string } | null;

export function CekStatus({ daftar }: { daftar: LaporanPortal[] }) {
  const [tiket, setTiket] = useState("");
  const [hasil, setHasil] = useState<Hasil>(null);

  const cari = (e: React.FormEvent) => {
    e.preventDefault();
    const bersih = tiket.trim().toUpperCase();
    if (!bersih) return;
    const l = daftar.find((x) => x.tiket.toUpperCase() === bersih);
    setHasil(l ? { ada: true, l } : { ada: false, tiket: bersih });
  };

  return (
    <>
      <form className="cek-form" onSubmit={cari}>
        <label className="isian" htmlFor="tiket">
          <span>Nomor tiket</span>
          <input
            id="tiket"
            type="text"
            value={tiket}
            placeholder="TKT-260916-0473"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setTiket(e.target.value);
              if (hasil) setHasil(null);
            }}
          />
          <span className="bantu">
            Nomor tiket dikirim agent lewat WhatsApp saat laporan Anda tercatat.
          </span>
        </label>
        <button className="btn utama" type="submit" disabled={!tiket.trim()}>
          <Ikon nama="cari" ukuran={17} />
          Cek status
        </button>
      </form>

      <div aria-live="polite">
        {hasil === null ? null : hasil.ada ? (
          <article className="cek-hasil">
            <div className="cek-kop">
              <span className={`jenis-bulat j-${hasil.l.jenis}`} aria-hidden>
                <Ikon nama={JENIS[hasil.l.jenis].ikon} ukuran={15} />
              </span>
              <span>{JENIS[hasil.l.jenis].label}</span>
              <LencanaStatus status={hasil.l.status} />
            </div>

            <h3>{hasil.l.ringkas}</h3>
            <p className="cek-lokasi">
              {hasil.l.jalan}, Kel. {hasil.l.kelurahan}
            </p>

            <ol className="pjalan">
              {hasil.l.perjalanan.map((t) => (
                <li key={t.nama} className={t.tercapai ? "tercapai" : "menunggu"}>
                  <span className="ptitik" aria-hidden />
                  <span className="pjisi">
                    <b>
                      {t.nama}
                      <span className="sr">{t.tercapai ? ", sudah dilalui" : ", belum dilalui"}</span>
                    </b>
                    <span className="pjket">{t.ket}</span>
                  </span>
                  {t.waktu ? <span className="pjwaktu mono">{t.waktu}</span> : null}
                </li>
              ))}
            </ol>

            <Link className="btn" href={`/portal/laporan/${hasil.l.tiket}`}>
              <Ikon nama="buka" ukuran={17} />
              Buka rincian lengkap
            </Link>
          </article>
        ) : (
          <div className="pkosong">
            <p>
              Nomor tiket <b className="mono">{hasil.tiket}</b> tidak ditemukan. Periksa lagi
              penulisannya, atau cari laporan Anda lewat nama jalan.
            </p>
            <Link className="btn" href="/portal/laporan">
              <Ikon nama="cari" ukuran={17} />
              Cari lewat nama jalan
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
