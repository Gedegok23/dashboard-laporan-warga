"use client";

import { useRef, useState, useTransition } from "react";

import { Ikon } from "./Ikon";
import { TindakChip } from "./MejaPenanganan";
import { useMeja } from "./MejaProvider";
import { buktiTambahAksi, tautanLapanganAksi } from "@/lib/aksi";
import { BUKTI_MINIMAL, TINDAK } from "@/lib/data";
import {
  cariPetugas,
  cukupBukti,
  instansiLaporan,
  kabarTerakhir,
  penangananLaporan,
  penerimaUmpan,
  petugasUntuk,
  saudaraKerja,
  saudaraKlaster,
  statusTindak,
  umpanTerakhir,
} from "@/lib/logika";
import type { Klaster, Laporan, StatusTindak } from "@/lib/tipe";

const LANGKAH: StatusTindak[] = ["belum", "proses", "selesai"];

export function PanelPenanganan({ k, l }: { k: Klaster; l: Laporan }) {
  const { s, kirim, jamKini } = useMeja();
  const kotakBerkas = useRef<HTMLInputElement>(null);
  const [mengunggah, mulaiUnggah] = useTransition();
  const [galatUnggah, setGalatUnggah] = useState<string | null>(null);

  const p = penangananLaporan(l);
  const status = statusTindak(l);
  const petugasKini = cariPetugas(p.petugas);
  const [tautan, setTautan] = useState<string | null>(null);
  const [galatTautan, setGalatTautan] = useState<string | null>(null);
  const [membuatTautan, mulaiTautan] = useTransition();
  const { cocok, lain } = petugasUntuk(instansiLaporan(l, k));
  const mirip = saudaraKlaster(k, l).length;
  const miripKerja = saudaraKerja(k, l).length;
  // Klaster sintetis cuma pengelompokan tampilan: di database laporannya tidak
  // terhubung, jadi aksi seklaster tidak akan mengenai siapa pun.
  const bisaSeKlaster = mirip > 0 && !k.sintetis;
  const siapDitutup = cukupBukti(l);
  const draf = (l.draf ?? "").trim();
  const penerima = penerimaUmpan(k, l, s.seKlaster);
  const terakhir = umpanTerakhir(l);
  const kabar = kabarTerakhir(l);

  const blokKabar = (
    <div className="blok">
      <p className="label">Kabar status dari agent</p>
      {kabar ? (
        <blockquote className="kabarkutip">
          {kabar.teks}
          <span className="asal">
            Disusun agent sendiri, {kabar.waktu}. Terbit tiap penanda tindakan berubah.
          </span>
        </blockquote>
      ) : (
        <p className="bantu">
          Agent belum mengabari pelapor. Kabar terbit otomatis begitu penanda tindakan berubah,
          tanpa perlu diketik.
        </p>
      )}
    </div>
  );

  // Laporan duplikat dan yang belum diverifikasi tidak dikerjakan sendiri, tapi
  // pelapornya tetap dikabari agent, jadi kabar itu harus tetap terlihat di sini.
  if (l.duplikat || l.tahap === 0) {
    return (
      <>
        {blokKabar}
        <div className="kosong">
          <p>
            {l.duplikat
              ? `Laporan ini ditandai duplikat dari klaster ${k.id}, jadi tidak dikerjakan sebagai tiket sendiri. Pelapornya tetap ikut dikabari agent dan menerima umpan balik saat masalah klaster ini selesai.`
              : "Laporan ini belum diverifikasi, jadi belum bisa ditugaskan ke lapangan. Verifikasi dan teruskan dulu lewat tab Detail laporan."}
          </p>
          <button className="btn kecil" type="button" onClick={() => kirim({ t: "tab", nilai: "detail" })}>
            <Ikon nama="dokumen" ukuran={17} />
            Buka detail laporan
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="lingkup">
        <input
          type="checkbox"
          id="seKlaster"
          checked={s.seKlaster}
          disabled={!bisaSeKlaster}
          onChange={() => kirim({ t: "se-klaster" })}
        />
        <label htmlFor="seKlaster">
          <b>Terapkan ke laporan mirip</b>
          <span>
            {k.sintetis
              ? "Laporan di sini dikelompokkan menurut jenis masalah, belum menurut kemiripan isi. Aksi seklaster baru berlaku setelah agent mengelompokkan laporan."
              : mirip === 0
              ? `Tidak ada laporan mirip lain di klaster ${k.id}.`
              : `Penugasan, jadwal, dan penanda tindakan ikut mengenai ${miripKerja} laporan mirip yang sudah diverifikasi. Umpan balik dan kabar agent sampai ke ${penerima} pelapor di klaster ${k.id}.`}
          </span>
        </label>
      </div>

      <div className="blok">
        <p className="label">Petugas yang dikirim</p>
        <label className="sr" htmlFor="pilihPetugas">
          Petugas lapangan
        </label>
        <select
          className="pilih"
          id="pilihPetugas"
          value={p.petugas ?? ""}
          onChange={(e) => kirim({ t: "tugaskan", petugas: e.target.value || null, jam: jamKini() })}
        >
          <option value="">Belum ditugaskan</option>
          <optgroup label={instansiLaporan(l, k)}>
            {cocok.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nama} ({x.regu})
              </option>
            ))}
          </optgroup>
          <optgroup label="Regu instansi lain">
            {lain.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nama} ({x.regu}, {x.instansi})
              </option>
            ))}
          </optgroup>
        </select>
        {petugasKini ? (
          <dl className="petugaskartu">
            <dt>Regu</dt>
            <dd>{petugasKini.regu}</dd>
            <dt>Instansi</dt>
            <dd>{petugasKini.instansi}</dd>
            <dt>Kontak</dt>
            <dd className="mono">{petugasKini.wa}</dd>
          </dl>
        ) : (
          <p className="bantu">
            Pilih regu dulu. Bukti dokumentasi hanya bisa dicatat atas nama petugas yang dikirim.
          </p>
        )}

        <label className="isian" htmlFor="jadwalLapangan">
          <span>Jadwal turun lapangan</span>
          <input
            id="jadwalLapangan"
            type="text"
            defaultValue={p.jadwal ?? ""}
            key={`${l.tiket}-jadwal`}
            onBlur={(e) => kirim({ t: "jadwal", nilai: e.target.value, jam: jamKini() })}
          />
          <span className="bantu">Contoh: 17 Sep 2026, 07.00. Tersimpan saat kolom ditinggalkan.</span>
        </label>
      </div>

      <div className="blok">
        <p className="label">Penanda tindakan</p>
        <div className="segmen" role="group" aria-label="Penanda tindakan laporan">
          {LANGKAH.map((x) => {
            const terkunci = x === "selesai" && !siapDitutup;
            return (
              <button
                key={x}
                type="button"
                aria-pressed={status === x}
                disabled={terkunci}
                onClick={() => kirim({ t: "tindak", nilai: x, jam: jamKini() })}
              >
                <Ikon nama={TINDAK[x].ikon} ukuran={15} />
                {TINDAK[x].pendek}
              </button>
            );
          })}
        </div>
        {siapDitutup ? null : (
          <p className="bantu">
            Laporan belum bisa ditandai sudah ditindak. RDB menyimpan bukti dokumentasi sebagai tanda
            penyelesaian, jadi perlu minimal {BUKTI_MINIMAL} berkas dari lapangan.
          </p>
        )}
        <p className="statusnyata">
          Tersimpan sekarang: <TindakChip status={status} />
        </p>
      </div>

      <label className="blok isian" htmlFor="catatanLapangan">
        <span className="label">Catatan kerja untuk lapangan</span>
        <textarea
          id="catatanLapangan"
          rows={4}
          value={p.catatan}
          placeholder="Alat yang dibawa, akses lokasi, atau hal yang perlu dikoordinasikan lebih dulu."
          onChange={(e) => kirim({ t: "catatan", teks: e.target.value })}
        />
        <span className="bantu">
          Hanya dibaca petugas instansi dan regu lapangan. Tidak pernah dikirim ke pelapor.
        </span>
      </label>

      <div className="blok">
        <p className="label">Bukti dokumentasi</p>
        {p.bukti.length === 0 ? (
          <p className="bantu">
            Belum ada berkas dari lapangan. Bukti inilah yang disimpan di RDB sebagai tanda laporan
            benar-benar selesai ditangani.
          </p>
        ) : (
          <ul className="buktilist">
            {p.bukti.map((b) => (
              <li key={b.nama}>
                {b.berkasId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="kotak foto" src={`/berkas/${b.berkasId}`} alt={`Bukti lapangan ${b.nama}`} />
                ) : (
                  <span className="kotak" aria-hidden>
                    <Ikon nama="kamera" ukuran={18} />
                  </span>
                )}
                <span className="isi">
                  <b className="mono">{b.nama}</b>
                  <span>
                    {b.ukuran}, diunggah {b.oleh} pukul {b.jam}
                  </span>
                  <span className="mono gps">{b.gps}</span>
                </span>
                <button
                  className="taut"
                  type="button"
                  onClick={() => kirim({ t: "bukti-hapus", nama: b.nama, jam: jamKini() })}
                >
                  Cabut
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={kotakBerkas}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr"
          id="berkasBukti"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setGalatUnggah(null);
            if (!s.langsung) {
              kirim({ t: "bukti-tambah", jam: jamKini() });
              return;
            }
            const muatan = new FormData();
            muatan.set("berkas", f);
            mulaiUnggah(async () => {
              try {
                await buktiTambahAksi(l.tiket, muatan);
              } catch (err) {
                setGalatUnggah(err instanceof Error ? err.message : "Unggahan ditolak server.");
              }
            });
          }}
        />
        <div className="barisaksi">
          <button
            className="btn"
            type="button"
            disabled={!petugasKini || mengunggah}
            onClick={() => kotakBerkas.current?.click()}
          >
            <Ikon nama="unggah" ukuran={17} />
            {mengunggah ? "Mengunggah..." : "Unggah bukti dari lapangan"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={!petugasKini || membuatTautan}
            onClick={() => {
              setGalatTautan(null);
              mulaiTautan(async () => {
                try {
                  setTautan(await tautanLapanganAksi(l.tiket));
                } catch (err) {
                  setGalatTautan(err instanceof Error ? err.message : "Tautan gagal dibuat.");
                }
              });
            }}
          >
            <Ikon nama="kamera" ukuran={17} />
            {membuatTautan ? "Membuat..." : "Buat tautan untuk petugas"}
          </button>
        </div>
        {petugasKini ? null : (
          <p className="bantu">
            Tugaskan petugas lapangan lebih dulu di atas. Bukti selalu dicatat atas nama petugas yang
            dikirim, jadi kedua tombol ini baru hidup setelah ada penugasan.
          </p>
        )}
        {tautan ? (
          <div className="tautanlapangan">
            <p className="bantu">
              Kirim tautan ini ke {petugasKini?.wa ?? "petugas"} lewat WhatsApp. Berlaku 7 hari, hanya
              untuk laporan ini, dan hanya bisa menambah foto.
            </p>
            <input className="mono" readOnly value={tautan} onFocus={(e) => e.currentTarget.select()} />
            <button
              className="taut"
              type="button"
              onClick={() => navigator.clipboard?.writeText(tautan)}
            >
              Salin
            </button>
          </div>
        ) : null}
        {galatTautan ? <p className="bantu galat">{galatTautan}</p> : null}
        {galatUnggah ? <p className="bantu galat">{galatUnggah}</p> : null}
      </div>

      {blokKabar}

      <div className="blok umpan">
        <p className="label">Umpan balik untuk pelapor</p>
        <p className="bantu">
          Berbeda dari kabar status di atas, tulisan ini diketik admin. Disimpan di RDB, tampil di
          portal laporan, lalu disampaikan agent lewat WhatsApp ke {penerima} pelapor.
        </p>

        {terakhir ? (
          <blockquote className="terbitkutip">
            {terakhir.teks}
            <span className="asal">
              {terakhir.oleh}, {terakhir.waktu}. Dikirim agent ke {terakhir.penerima} pelapor.
            </span>
          </blockquote>
        ) : null}

        <label className="isian" htmlFor="drafUmpan">
          <span className="sr">Draf umpan balik</span>
          <textarea
            id="drafUmpan"
            rows={4}
            value={l.draf ?? ""}
            placeholder="Sebutkan apa yang sudah dikerjakan, kapan, dan apa yang perlu dilakukan pelapor bila masalahnya kembali."
            onChange={(e) => kirim({ t: "draf", teks: e.target.value })}
          />
        </label>

        <div className="aksi">
          <button
            className="btn utama"
            type="button"
            disabled={!draf}
            onClick={() => kirim({ t: "kirim-umpan", jam: jamKini() })}
          >
            <Ikon nama="kirim" ukuran={17} />
            Terbitkan dan kirim lewat agent
          </button>
        </div>
        {draf ? null : (
          <p className="bantu">Isi draf dulu sebelum umpan balik bisa diterbitkan ke portal.</p>
        )}
      </div>
    </>
  );
}
