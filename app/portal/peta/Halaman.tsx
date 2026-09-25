import type { Metadata } from "next";
import { Ikon } from "@/components/Ikon";
import { PetaKlien } from "@/components/portal/PetaKlien";
import { JENIS, URUT_JENIS } from "@/lib/kategori";
import { semuaLaporanPortal } from "@/lib/sumber";
import { KOTA } from "@/lib/kota";

export const metadata: Metadata = {
  title: "Peta",
  description: `Sebaran laporan warga Kota ${KOTA} di peta, ditampilkan secara umum.`,
};

export const revalidate = 0;

export default async function HalamanPeta() {
  const semua = await semuaLaporanPortal();
  const daftar = semua.filter((l) => l.titik[0] !== 0);
  const jenisAda = URUT_JENIS.filter((j) => daftar.some((l) => l.jenis === j));

  // Tidak ada satu pun titik. Peta kosong tanpa penjelasan terlihat seperti
  // halaman rusak, padahal sebabnya sederhana dan disengaja: koordinat hanya
  // datang dari titik yang dibagikan warga sendiri lewat Telegram. Menebaknya
  // dari teks alamat akan menaruh laporan di tempat yang salah. Selama belum
  // ada titik, sebarannya tetap bisa dibaca per jenis dan per kelurahan.
  if (!daftar.length) {
    const perJenis = URUT_JENIS.map((j) => ({
      jenis: j,
      n: semua.filter((l) => l.jenis === j).length,
    })).filter((x) => x.n > 0);
    const puncak = Math.max(1, ...perJenis.map((x) => x.n));

    const perWilayah = [
      ...semua
        .filter((l) => l.kelurahan && l.kelurahan !== "-")
        .reduce((m, l) => m.set(l.kelurahan, (m.get(l.kelurahan) ?? 0) + 1), new Map<string, number>())
        .entries(),
    ].sort((a, b) => b[1] - a[1]);

    return (
      <div className="pmain">
        <section className="phalaman">
          <h2>Peta Laporan</h2>
          <p className="plead">
            Belum ada laporan yang membawa titik lokasi, jadi belum ada yang bisa digambar di peta.
          </p>
        </section>

        <section className="peta-kosong">
          <p>
            Titik hanya diambil dari lokasi yang dibagikan warga sendiri lewat lampiran Telegram.
            Alamat yang ditulis sebagai teks tidak diterjemahkan jadi koordinat, karena menebak
            titik dari nama jalan akan menaruh laporan di tempat yang salah.
          </p>
          <p>Sementara itu, sebarannya bisa dibaca dari angka di bawah.</p>
        </section>

        <section className="phalaman">
          <h3>Sebaran menurut jenis masalah</h3>
          <ul className="peta-sebaran">
            {perJenis.map((x) => (
              <li key={x.jenis} className={`j-${x.jenis}`}>
                <span className="peta-sebaran-nama">
                  <Ikon nama={JENIS[x.jenis].ikon} ukuran={15} />
                  {JENIS[x.jenis].label}
                </span>
                <span className="peta-sebaran-bar" aria-hidden>
                  <span style={{ width: `${Math.round((x.n / puncak) * 100)}%` }} />
                </span>
                <span className="peta-sebaran-n">{x.n}</span>
              </li>
            ))}
          </ul>
        </section>

        {perWilayah.length ? (
          <section className="phalaman">
            <h3>Kelurahan yang sudah tercatat</h3>
            <ul className="peta-wilayah">
              {perWilayah.map(([nama, n]) => (
                <li key={nama}>
                  <span>{nama}</span>
                  <span className="mono">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="pcatatan">
          <Ikon nama="perisai" ukuran={14} />
          Peta ini tidak memuat identitas pelapor. Warna hanya menandai jenis masalah, bukan status
          penanganannya.
        </p>
      </div>
    );
  }

  return (
    <div className="pmain">
      <section className="phalaman">
        <h2>Peta Laporan</h2>
        <p className="plead">
          Sebaran {daftar.length} laporan warga di Kota {KOTA}. Titik dibulatkan ke sekitar seratus
          meter, jadi peta menunjukkan ruas jalannya, bukan alamat persis pelapor.
        </p>
      </section>

      <div className="peta-bungkus">
        <PetaKlien daftar={daftar} />
      </div>

      <div className="peta-kunci" aria-label="Keterangan warna peta">
        {jenisAda.map((j) => (
          <span key={j} className={`peta-kunci-item j-${j}`}>
            <span className="peta-titik" aria-hidden />
            <Ikon nama={JENIS[j].ikon} ukuran={14} />
            {JENIS[j].label}
          </span>
        ))}
      </div>

      <p className="pcatatan">
        <Ikon nama="perisai" ukuran={14} />
        Peta ini tidak memuat identitas pelapor. Warna hanya menandai jenis masalah, bukan status
        penanganannya.
      </p>
    </div>
  );
}
