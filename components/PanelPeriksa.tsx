"use client";

import { useEffect, useState } from "react";
import { Ikon } from "./Ikon";
import { DupChip, SlaChip, TahapChip } from "./Lencana";
import { useMeja } from "./MejaProvider";
import { Sorot } from "./Sorot";
import { BATAS_HARI_KERJA, INSTANSI, LANJUT, TAHAP, petugas } from "@/lib/data";
import { instansiLaporan, laporCocok, susunLog } from "@/lib/logika";

export function PanelPeriksa() {
  const { s, kirim, jamKini } = useMeja();
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
          Detail laporan
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
            <div className="kotak">
              <Ikon nama={l.foto.nama === "tidak ada lampiran" ? "tanpa-kamera" : "kamera"} ukuran={24} />
              <span>{l.foto.nama === "tidak ada lampiran" ? "Tanpa foto" : "Pratinjau"}</span>
            </div>
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
                <option key={x.id} value={i}>
                  {x.kategori}
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
              {INSTANSI.map((n) => (
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
            <dt>NIK</dt>
            <dd>{s.identitas ? p.nikPenuh : p.nik}</dd>
            <dt>WhatsApp</dt>
            <dd>{s.identitas ? p.waPenuh : p.wa}</dd>
            <dt>Status</dt>
            <dd>{p.verif}</dd>
          </dl>
          <p className="jejak">
            <Ikon nama="perisai" ukuran={14} />
            {s.identitas
              ? `Akses identitas tercatat di jejak audit atas nama ${petugas.nama}, ${petugas.unit}.`
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
