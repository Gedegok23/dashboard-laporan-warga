import type { Metadata } from "next";
import { Ikon } from "@/components/Ikon";
import { BATAS_HARI_KERJA } from "@/lib/data";
import { scorecardInstansi } from "@/lib/logika";
import { isiMeja } from "@/lib/sumber";

export const metadata: Metadata = {
  title: "Scorecard",
  description: "Perbandingan penanganan laporan warga antar instansi Kota Bandung.",
};

export const revalidate = 0;

export default async function Scorecard() {
  const { data } = await isiMeja();
  const baris = scorecardInstansi(data);
  const maks = Math.max(1, ...baris.map((b) => b.total));

  return (
    <div className="pmain">
      <section className="phalaman">
        <h2>Scorecard Instansi</h2>
        <p className="plead">
          Berapa banyak laporan yang dipegang tiap instansi, berapa yang sudah tuntas, dan berapa
          yang lewat batas {BATAS_HARI_KERJA} hari kerja.
        </p>
      </section>

      <div className="tabel-bungkus">
        <table className="skor">
          <caption className="sr">
            Penanganan laporan warga per instansi, diurutkan dari yang paling banyak memegang
            laporan
          </caption>
          <thead>
            <tr>
              <th scope="col">Instansi</th>
              <th scope="col">Laporan</th>
              <th scope="col">Selesai</th>
              <th scope="col">Berjalan</th>
              <th scope="col">Lewat batas</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.nama}>
                <th scope="row">
                  {b.nama}
                  <span className="skor-meter" aria-hidden>
                    <i style={{ width: `${Math.round((b.total / maks) * 100)}%` }} />
                  </span>
                </th>
                <td className="mono">{b.total}</td>
                <td>
                  <span className="skor-selesai">
                    <b className="mono">{b.selesai}</b>
                    <span className="mono">{b.persen}%</span>
                  </span>
                </td>
                <td className="mono">{b.berjalan}</td>
                <td className={b.lewat ? "skor-kritis" : undefined}>
                  <span className="mono">{b.lewat}</span>
                  {b.lewat ? <Ikon nama="peringatan" ukuran={14} /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="pcatatan">
        <Ikon nama="info" ukuran={14} />
        Angka dihitung langsung dari berkas laporan yang tercatat, bukan dari laporan kinerja yang
        dikirim instansi. Rata-rata waktu respons belum ditampilkan karena stempel waktu tiap
        perpindahan status belum tersedia lengkap untuk semua laporan.
      </p>
    </div>
  );
}
