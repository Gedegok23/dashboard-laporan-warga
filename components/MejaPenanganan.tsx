"use client";

import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";
import { Sorot } from "./Sorot";
import { TINDAK } from "@/lib/data";
import { balasanWarga, barisPenanganan, hitungTindak, penangananLaporan } from "@/lib/logika";
import { gulirKe } from "@/lib/gerak";
import type { NamaIkon, SaringTindak, StatusTindak, UrutTindak } from "@/lib/tipe";

const URUTAN: { nilai: UrutTindak; label: string }[] = [
  { nilai: "status", label: "Penanda tindakan" },
  { nilai: "tanggal", label: "Tanggal masuk" },
  { nilai: "petugas", label: "Petugas lapangan" },
  { nilai: "lokasi", label: "Kelurahan" },
  { nilai: "pelapor", label: "Pelapor" },
  { nilai: "laporan", label: "Kategori laporan" },
];

export function TindakChip({ status }: { status: StatusTindak }) {
  return (
    <span className={`tindak s-${status}`}>
      <Ikon nama={TINDAK[status].ikon} ukuran={13} />
      {TINDAK[status].nama}
    </span>
  );
}

export function MejaPenanganan() {
  const { s, kirim } = useMeja();
  const h = hitungTindak(s.data);
  const baris = barisPenanganan(s.data, s.tindak, s.kunci, s.urutTindak, s.arahTindak);

  const opsi: { nilai: SaringTindak; nama: string; ikon: NamaIkon; jumlah: number }[] = [
    { nilai: "semua", nama: "Semua", ikon: "kerja", jumlah: h.total },
    { nilai: "belum", nama: TINDAK.belum.nama, ikon: TINDAK.belum.ikon, jumlah: h.belum },
    { nilai: "proses", nama: TINDAK.proses.nama, ikon: TINDAK.proses.ikon, jumlah: h.proses },
    { nilai: "selesai", nama: TINDAK.selesai.nama, ikon: TINDAK.selesai.ikon, jumlah: h.selesai },
    { nilai: "tanpa-petugas", nama: "Tanpa petugas", ikon: "tugas", jumlah: h.tanpaPetugas },
  ];

  return (
    <section className="meja" id="penanganan" aria-label="Penanganan laporan di lapangan">
      <header className="mejakop">
        <div>
          <h2>Penanganan laporan</h2>
          <p className="ket">
            {h.total} laporan sudah jadi pekerjaan instansi. {h.tanpaPetugas} menunggu regu,{" "}
            {h.tanpaBukti} sedang dikerjakan tanpa bukti dokumentasi.
          </p>
        </div>
      </header>

      <div className="mejaalat">
        <div className="saringan" role="group" aria-label="Saring menurut penanda tindakan">
          {opsi.map((o) => (
            <button
              key={o.nilai}
              className="chipbtn"
              type="button"
              aria-pressed={s.tindak === o.nilai}
              disabled={o.jumlah === 0 && o.nilai !== "semua"}
              onClick={() => kirim({ t: "saring-tindak", nilai: o.nilai })}
            >
              <Ikon nama={o.ikon} ukuran={15} />
              {o.nama}
              <span className="n">{o.jumlah}</span>
            </button>
          ))}
        </div>

        <div className="urutan">
          <label htmlFor="urutTindak">Urutkan</label>
          <select
            className="pilih"
            id="urutTindak"
            value={s.urutTindak}
            onChange={(e) => kirim({ t: "urut-tindak", kolom: e.target.value as UrutTindak })}
          >
            {URUTAN.map((u) => (
              <option key={u.nilai} value={u.nilai}>
                {u.label}
              </option>
            ))}
          </select>
          <button
            className="btn kecil"
            type="button"
            aria-label={`Urutan ${s.arahTindak === "turun" ? "menurun" : "menaik"}. Balik urutan`}
            onClick={() => kirim({ t: "urut-tindak", kolom: s.urutTindak })}
          >
            <Ikon nama={s.arahTindak === "turun" ? "turun" : "naik"} ukuran={15} />
          </button>
        </div>
      </div>

      <div className="tabel">
        <div className="tabelkop" aria-hidden>
          <span>Laporan, pelapor, dan lokasi</span>
          <span>Penanganan lapangan</span>
        </div>

        {baris.length === 0 ? (
          <div className="kosong">
            <p>
              Tidak ada laporan pada saringan ini. Laporan baru masuk ke meja penanganan setelah
              diverifikasi dan diteruskan ke instansi.
            </p>
            <button className="btn kecil" type="button" onClick={() => kirim({ t: "reset-saring" })}>
              <Ikon nama="atur-ulang" ukuran={17} />
              Bersihkan saringan
            </button>
          </div>
        ) : (
          <ul className="trows">
            {baris.map((b) => {
              const p = penangananLaporan(b.l);
              const terpilih = b.i === s.kls && b.j === s.lap;
              return (
                <li key={b.l.tiket}>
                  <button
                    className="trow"
                    type="button"
                    aria-current={terpilih}
                    onClick={() => {
                      kirim({ t: "pilih", kls: b.i, lap: b.j, tab: "penanganan" });
                      if (window.matchMedia("(max-width:900px)").matches) gulirKe("periksa");
                    }}
                  >
                    <span className="tkiri">
                      <b>
                        <Sorot teks={b.l.ringkas} kunci={s.kunci} />
                      </b>
                      <span className="tmeta">
                        <span className="tiket">
                          <Sorot teks={b.l.tiket} kunci={s.kunci} />
                        </span>
                        <span className="klasterchip">
                          <Sorot teks={b.k.id} kunci={s.kunci} />
                          {b.mirip ? <i>{b.mirip} mirip</i> : null}
                        </span>
                        {b.l.umpan?.length ? (
                          <span className="terbit">
                            <Ikon nama="portal" ukuran={12} />
                            Umpan balik terbit
                          </span>
                        ) : null}
                        {balasanWarga(b.l).length ? (
                          <span className="terbit balas">
                            <Ikon nama="pesan" ukuran={12} />
                            {balasanWarga(b.l).length} balasan warga
                          </span>
                        ) : null}
                      </span>
                      <span className="tbaris">
                        <Ikon nama="warga" ukuran={14} />
                        <span>
                          <Sorot teks={b.l.pelapor.nama} kunci={s.kunci} />
                          <span className="mono"> {b.l.pelapor.wa}</span>
                        </span>
                      </span>
                      <span className="tbaris">
                        <Ikon nama="lokasi" ukuran={14} />
                        <span>
                          <Sorot teks={b.l.jalan} kunci={s.kunci} />, Kel.{" "}
                          <Sorot teks={b.l.kelurahan} kunci={s.kunci} />
                          <span className="mono tgl">
                            {b.l.tgl}, {b.l.jam}
                          </span>
                        </span>
                      </span>
                    </span>

                    <span className="tkanan">
                      {b.petugas ? (
                        <span className="tpetugas">
                          <Ikon nama="regu" ukuran={15} />
                          <span>
                            <b>
                              <Sorot teks={b.petugas.nama} kunci={s.kunci} />
                            </b>
                            <span className="regu">
                              <Sorot teks={b.petugas.regu} kunci={s.kunci} />
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="tpetugas belum">
                          <Ikon nama="tugas" ukuran={15} />
                          <span>Belum ditugaskan</span>
                        </span>
                      )}

                      <span className="tchip">
                        <TindakChip status={b.status} />
                        <span className={`buktichip${b.bukti === 0 ? " nihil" : ""}`}>
                          <Ikon nama={b.bukti === 0 ? "tanpa-kamera" : "kamera"} ukuran={13} />
                          {b.bukti === 0 ? "Tanpa bukti" : `${b.bukti} bukti`}
                        </span>
                      </span>

                      {p.jadwal ? (
                        <span className="tjadwal">
                          <Ikon nama="jadwal" ukuran={13} />
                          {p.jadwal}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
            </ul>
        )}
      </div>

      <p className="jejak">
        <Ikon nama="perisai" ukuran={14} />
        Nama dan nomor WhatsApp pelapor tetap disamarkan di tabel. Buka satu laporan untuk melihat
        identitas penuh, dan pembukaannya tercatat di jejak audit.
      </p>
    </section>
  );
}
