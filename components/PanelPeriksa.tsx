"use client";

import { useEffect, useState } from "react";
import { Ikon } from "./Ikon";
import { DupChip, SlaChip, TahapChip } from "./Lencana";
import { useMeja } from "./MejaProvider";
import { PanelPenanganan } from "./PanelPenanganan";
import { Sorot } from "./Sorot";
import { BATAS_HARI_KERJA, LANJUT, TAHAP } from "@/lib/data";
import {
  cariPetugasDi,
  cukupBukti,
  instansiLaporan,
  laporCocok,
  penangananLaporan,
  susunLog,
} from "@/lib/logika";

export function PanelPeriksa() {
  const { s, kirim, jamKini, petugas: daftarPetugas, akun, instansi } = useMeja();
  const [disalin, setDisalin] = useState(false);

  const k = s.data[s.kls];
  const l = k.lapor[s.lap] ?? k.lapor[0];

  useEffect(() => {
    if (!disalin) return;
    const id = setTimeout(() => setDisalin(false), 1800);
    return () => clearTimeout(id);
  }, [disalin]);

  if (!l) {
    return (
      <aside className="periksa" id="periksa" aria-label="Rincian laporan terpilih">
        <p className="kosong">Klaster ini kosong. Pilih laporan lain dari daftar.</p>
      </aside>
    );
  }

  const p = l.pelapor;
  const log = susunLog(l, k);
  const luarSaring = !laporCocok(l, k, s.saring, s.kunci);
  const langkah = l.tahap < 3 && !l.duplikat ? LANJUT[l.tahap] : null;
  // Penutupan lewat tab Detail memakai aturan bukti yang sama dengan meja penanganan.
  const langkahTerkunci = langkah?.ke === 3 && !cukupBukti(l);
  const tugas = penangananLaporan(l);
  const petugasLapangan = cariPetugasDi(daftarPetugas, tugas.petugas);

  return (
    <aside className="periksa" id="periksa" aria-label="Rincian laporan terpilih">
      <header>
        <span className="tiketbesar">
          <span>{l.tiket}</span>
          <span>{k.id}</span>
        </span>
        <h2>{l.ringkas}</h2>
      </header>

      <div className="statusbaris">
        <TahapChip tahap={l.tahap} />
        <SlaChip laporan={l} />
        <DupChip laporan={l} />
        {!l.duplikat && l.sisa !== null && l.sisa >= 0 && l.tahap < 3 ? (
          <span className="tahap netral">Sisa {l.sisa} hari kerja</span>
        ) : null}
      </div>

      {luarSaring ? (
        <div className="spanduk">
          <Ikon nama="saring-mati" ukuran={16} />
          <span>Laporan ini di luar saringan yang sedang aktif.</span>
          <button className="btn kecil" type="button" onClick={() => kirim({ t: "reset-saring" })}>
            Tampilkan
          </button>
        </div>
      ) : null}

      {l.duplikat ? (
        <div className="spanduk">
          <Ikon nama="salin" ukuran={16} />
          <span>
            Ditandai duplikat dari klaster {k.id}, tidak dihitung dalam antrean aktif.
          </span>
          <button
            className="btn kecil"
            type="button"
            onClick={() => kirim({ t: "duplikat", hapus: true, jam: jamKini() })}
          >
            Batalkan
          </button>
        </div>
      ) : null}

      <div className="tabs" role="tablist">
        <button
          className="tab"
          role="tab"
          aria-selected={s.tab === "detail"}
          onClick={() => kirim({ t: "tab", nilai: "detail" })}
        >
          <Ikon nama="dokumen" ukuran={16} />
          Detail
        </button>
        <button
          className="tab"
          role="tab"
          aria-selected={s.tab === "penanganan"}
          onClick={() => kirim({ t: "tab", nilai: "penanganan" })}
        >
          <Ikon nama="kerja" ukuran={16} />
          Penanganan
        </button>
        <button
          className="tab"
          role="tab"
          aria-selected={s.tab === "log"}
          onClick={() => kirim({ t: "tab", nilai: "log" })}
        >
          <Ikon nama="bot" ukuran={16} />
          Log bot
          <span className="n">{log.length}</span>
        </button>
      </div>

      <div className="panel" hidden={s.tab !== "detail"}>
        <div>
          <div className="foto">
            {l.foto.berkasId ? (
              // Petugas yang sudah masuk menerima berkas aslinya, lengkap dengan
              // EXIF, karena koordinat itu yang dibandingkan dengan lokasi laporan.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="kotak foto"
                src={`/berkas/${l.foto.berkasId}`}
                alt="Foto yang dikirim pelapor"
              />
            ) : (
              <div className="kotak">
                <Ikon nama={l.foto.nama === "tidak ada lampiran" ? "tanpa-kamera" : "kamera"} ukuran={24} />
                <span>{l.foto.nama === "tidak ada lampiran" ? "Tanpa foto" : "Pratinjau"}</span>
              </div>
            )}
            <dl>
              <dt>Berkas</dt>
              <dd>{l.foto.nama}</dd>
              <dt>Ukuran</dt>
              <dd>{l.foto.ukuran}</dd>
              <dt>GPS EXIF</dt>
              <dd>{l.foto.gps}</dd>
            </dl>
          </div>
          {l.foto.selisih ? (
            <p className="nota">
              <Ikon nama="peringatan" ukuran={15} />
              Koordinat EXIF foto berjarak {l.foto.selisih} dari lokasi yang ditulis warga. Pastikan
              dulu sebelum diteruskan.
            </p>
          ) : null}
        </div>

        <blockquote className="kutip">
          &ldquo;
          <Sorot teks={l.mentah} kunci={s.kunci} />
          &rdquo;
          <span className="asal">
            Teks mentah dari warga &middot; {l.kanal} &middot; {l.tgl}, {l.jam}
          </span>
        </blockquote>

        <dl className="rincian">
          <dt>Kategori</dt>
          <dd>
            <label className="sr" htmlFor="pilihKategori">
              Kategori laporan
            </label>
            <select
              className="pilih"
              id="pilihKategori"
              value={s.kls}
              onChange={(e) => kirim({ t: "kategori", tujuan: Number(e.target.value), jam: jamKini() })}
            >
              {s.data.map((x, i) => (
                // Klaster sintetis cuma pengelompokan tampilan: tidak punya baris
                // di database, jadi memindahkan laporan ke sana tidak tersimpan.
                <option key={x.id} value={i} disabled={s.langsung && Boolean(x.sintetis) && i !== s.kls}>
                  {x.kategori}
                  {s.langsung && x.sintetis && i !== s.kls ? " (belum bisa dipindah)" : ""}
                </option>
              ))}
            </select>
            <span className={`auto${l.skor < k.ambang ? " rendah" : ""}`}>
              <Ikon nama="kilau" ukuran={13} />
              klasifikasi bot {l.skor.toFixed(2)} &middot; ambang {k.ambang.toFixed(2)}
            </span>
          </dd>

          <dt>Lokasi</dt>
          <dd>
            <Sorot teks={l.jalan} kunci={s.kunci} />
            <br />
            Kel. <Sorot teks={l.kelurahan} kunci={s.kunci} />, Kec.{" "}
            <Sorot teks={l.kecamatan} kunci={s.kunci} />
            <br />
            <span className="mono">{l.koordinat}</span>{" "}
            <button
              className="taut"
              type="button"
              onClick={() => navigator.clipboard?.writeText(l.koordinat).then(() => setDisalin(true))}
            >
              {disalin ? "Koordinat disalin" : "Salin koordinat"}
            </button>
          </dd>

          <dt>Instansi</dt>
          <dd>
            <label className="sr" htmlFor="pilihInstansi">
              Instansi penanggung jawab
            </label>
            <select
              className="pilih"
              id="pilihInstansi"
              value={instansiLaporan(l, k)}
              onChange={(e) => kirim({ t: "instansi", nama: e.target.value, jam: jamKini() })}
            >
              {instansi.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            {l.instansi ? (
              <span className="auto">
                <Ikon nama="alih" ukuran={13} />
                dialihkan dari {k.instansi}
              </span>
            ) : null}
          </dd>

          <dt>Kanal</dt>
          <dd>
            {l.kanal} &middot; masuk {l.tgl}, {l.jam}
          </dd>

          <dt>Lapangan</dt>
          <dd>
            {petugasLapangan ? (
              <>
                {petugasLapangan.nama}
                <br />
                <span style={{ fontSize: 11.5 }}>
                  {petugasLapangan.regu}, {tugas.bukti.length} bukti dokumentasi
                </span>
              </>
            ) : (
              "Belum ada regu yang dikirim"
            )}
            <br />
            <button className="taut" type="button" onClick={() => kirim({ t: "tab", nilai: "penanganan" })}>
              Buka tab Penanganan
            </button>
          </dd>
        </dl>

        <div className="pelapor">
          <div className="kop">
            <p className="label">Identitas pelapor</p>
            <button className="btn kecil" type="button" onClick={() => kirim({ t: "identitas" })}>
              <Ikon nama={s.identitas ? "sembunyi" : "lihat"} ukuran={16} />
              {s.identitas ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <dl>
            <dt>Nama</dt>
            <dd>{s.identitas ? p.namaPenuh : p.nama}</dd>
            <dt>WhatsApp</dt>
            <dd>{s.identitas ? p.waPenuh : p.wa}</dd>
          </dl>
          <p className="jejak">
            <Ikon nama="bot" ukuran={14} />
            Agent hanya menanyakan nama dan nomor WhatsApp. NIK dan status verifikasi NIK tidak
            pernah diminta, jadi tidak ada di berkas laporan.
          </p>
          <p className="jejak">
            <Ikon nama="perisai" ukuran={14} />
            {s.identitas
              ? `Akses identitas tercatat di jejak audit atas nama akun ${akun}.`
              : "Identitas disamarkan secara bawaan. Membukanya akan tercatat di jejak audit."}
          </p>
        </div>

        <div>
          <p className="label" style={{ marginBottom: 9 }}>
            Riwayat status
          </p>
          <ol className="riwayat">
            {l.riwayat.map((r, i) => (
              <li key={`${r[2]}-${i}`}>
                <span className={`titik${i === 0 ? "" : " pudar"}`} />
                <span>
                  <b>{r[0]}</b>
                  <span className="k">{r[1]}</span>
                  <span className="w">{r[2]}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="aksi">
          {langkah ? (
            <button
              className="btn utama"
              type="button"
              disabled={langkahTerkunci}
              onClick={() => kirim({ t: "lanjut", jam: jamKini() })}
            >
              <Ikon nama={langkah.ikon} ukuran={17} />
              {langkah.label}
            </button>
          ) : null}
          {l.tahap > 0 && !l.duplikat ? (
            <button className="btn" type="button" onClick={() => kirim({ t: "mundur", jam: jamKini() })}>
              <Ikon nama="mundur" ukuran={17} />
              Kembalikan ke {TAHAP[l.tahap - 1].nama.toLowerCase()}
            </button>
          ) : null}
          {!l.duplikat ? (
            <button
              className="btn"
              type="button"
              onClick={() => kirim({ t: "duplikat", hapus: false, jam: jamKini() })}
            >
              <Ikon nama="salin" ukuran={17} />
              Tandai duplikat
            </button>
          ) : null}
        </div>
        {langkahTerkunci ? (
          <p className="bantu">
            Laporan baru bisa ditandai selesai setelah bukti dokumentasi lapangan masuk. Catat
            buktinya di tab Penanganan.
          </p>
        ) : null}
      </div>

      <div className="panel" hidden={s.tab !== "penanganan"}>
        <PanelPenanganan k={k} l={l} />
      </div>

      <div className="panel" hidden={s.tab !== "log"}>
        <ul className="log">
          {log.map((b, i) => (
            <li className={b.peran} key={`${b.jam}-${i}`}>
              <span className="ikon-bulat">
                <Ikon nama={b.ikon} ukuran={15} />
              </span>
              <span>
                <span className="kop">
                  <span className="siapa">{b.siapa}</span>
                  <span className="jam">{b.jam}</span>
                </span>
                <span className="teks">{b.teks}</span>
                {b.mentah ? <span className="mentah">{b.mentah}</span> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="jejak">
          <Ikon nama="info" ukuran={14} />
          Balasan bot, input mentah, dan hasil klasifikasi disimpan apa adanya, termasuk saat petugas
          mengoreksi kategori atau instansi. Batas tindak lanjut instansi {BATAS_HARI_KERJA} hari
          kerja.
        </p>
      </div>
    </aside>
  );
}
