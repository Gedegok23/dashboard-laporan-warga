import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { GambarBeranda } from "@/components/portal/GambarBeranda";
import { KartuLaporan } from "@/components/portal/KartuLaporan";
import { BATAS_HARI_KERJA, dataAwal } from "@/lib/data";
import { JENIS, URUT_JENIS } from "@/lib/kategori";
import { dataPortal, hitungPortal } from "@/lib/logika";

export default function Beranda() {
  const kelompok = dataPortal(dataAwal);
  const semua = kelompok.flatMap((g) => g.lapor).sort((a, b) => b.ts - a.ts);
  const h = hitungPortal(dataAwal);
  const jenisAda = URUT_JENIS.filter((j) => semua.some((l) => l.jenis === j));

  const angka = [
    { ikon: "dokumen" as const, nilai: h.total, label: "Laporan warga masuk" },
    { ikon: "selesai" as const, nilai: h.clear, label: "Sudah selesai ditangani" },
    {
      ikon: "peringatan" as const,
      nilai: h.lewat,
      label: `Lewat batas ${BATAS_HARI_KERJA} hari kerja`,
      kritis: h.lewat > 0,
    },
  ];

  return (
    <div className="pmain">
      <section className="pintro">
        <div className="pintro-teks">
          <h2>Sampai mana laporan Anda?</h2>
          <p className="plead">
            Setiap laporan warga yang masuk lewat bot WhatsApp dan web tercatat di sini, lengkap
            dengan siapa yang menanganinya dan sampai langkah mana prosesnya.
          </p>
          <div className="pintro-aksi">
            <Link className="btn utama" href="/portal/laporan">
              <Ikon nama="cari" ukuran={17} />
              Cari laporan saya
            </Link>
            <Link className="btn" href="/portal/cek-status">
              <Ikon nama="dokumen" ukuran={17} />
              Cek dengan nomor tiket
            </Link>
          </div>
        </div>
        <GambarBeranda />
      </section>

      <section className="pangka-baris" aria-label="Ringkasan portal">
        {angka.map((a) => (
          <div key={a.label} className={a.kritis ? "kritis" : undefined}>
            <span className="pangka-ikon" aria-hidden>
              <Ikon nama={a.ikon} ukuran={19} />
            </span>
            <b>{a.nilai}</b>
            <span>{a.label}</span>
          </div>
        ))}
      </section>

      <section>
        <p className="plabel">Jenis masalah</p>
        <div className="pjenis" style={{ marginTop: 10 }}>
          {jenisAda.map((j) => (
            <Link key={j} className={`jchip j-${j}`} href={`/portal/laporan?jenis=${j}`}>
              <Ikon nama={JENIS[j].ikon} ukuran={15} />
              {JENIS[j].label}
              <span className="jn">{semua.filter((l) => l.jenis === j).length}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <header className="pbagian">
          <h3>Laporan terbaru</h3>
          <Link href="/portal/laporan">Lihat semua</Link>
        </header>
        <ul className="kartu-grid">
          {semua.slice(0, 6).map((l) => (
            <li key={l.tiket}>
              <KartuLaporan l={l} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
