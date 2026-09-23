import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ikon } from "@/components/Ikon";
import { LencanaStatus } from "@/components/portal/LencanaStatus";
import { SampulKategori } from "@/components/portal/SampulKategori";
import { JENIS } from "@/lib/kategori";
import { semuaLaporanPortal } from "@/lib/sumber";

export const revalidate = 0;

export async function generateMetadata(
  props: PageProps<"/portal/laporan/[tiket]">,
): Promise<Metadata> {
  const { tiket } = await props.params;
  const l = (await semuaLaporanPortal()).find((x) => x.tiket === tiket);
  if (!l) return { title: "Laporan tidak ditemukan" };
  return { title: `${l.ringkas} | Portal Laporan Warga`, description: l.ringkas };
}

export default async function RincianLaporan(props: PageProps<"/portal/laporan/[tiket]">) {
  const { tiket } = await props.params;
  const l = (await semuaLaporanPortal()).find((x) => x.tiket === tiket);
  if (!l) notFound();

  const jenis = JENIS[l.jenis];

  return (
    <div className="pmain sempit">
        <Link className="kembali" href="/portal/laporan">
          <Ikon nama="mundur" ukuran={16} />
          Semua laporan
        </Link>

        <article className="rincian-kartu">
          <div className="kartu-atas tinggi">
            <SampulKategori jenis={l.jenis} />
            <LencanaStatus status={l.status} />
          </div>

          <div className="rincian-isi">
            <span className="kartu-jenis">
              <span className={`jenis-bulat j-${l.jenis}`} aria-hidden>
                <Ikon nama={jenis.ikon} ukuran={15} />
              </span>
              {jenis.label}
              <span className="pisah" aria-hidden />
              <span className="kategori-nama">{l.kategori}</span>
            </span>

            <h2>{l.ringkas}</h2>

            <p className="rincian-lokasi">
              <Ikon nama="lokasi" ukuran={16} />
              <span>
                {l.jalan}
                <br />
                Kel. {l.kelurahan}, Kec. {l.kecamatan}
              </span>
            </p>

            {l.fotoBerkasId || l.buktiBerkas.length ? (
              <div className="galeri">
                {l.fotoBerkasId ? (
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/berkas/${l.fotoBerkasId}`} alt="Foto yang dikirim pelapor" loading="lazy" />
                    <figcaption>Dari pelapor</figcaption>
                  </figure>
                ) : null}
                {l.buktiBerkas.map((id, i) => (
                  <figure key={id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/berkas/${id}`} alt={`Bukti penanganan ${i + 1}`} loading="lazy" />
                    <figcaption>Bukti petugas {i + 1}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}

            <div className="pjalan-bungkus">
              <p className="plabel">Perjalanan laporan</p>
              <ol className="pjalan">
                {l.perjalanan.map((t) => (
                  <li key={t.nama} className={t.tercapai ? "tercapai" : "menunggu"}>
                    <span className="ptitik" aria-hidden />
                    <span className="pjisi">
                      <b>
                        {t.nama}
                        <span className="sr">
                          {t.tercapai ? ", sudah dilalui" : ", belum dilalui"}
                        </span>
                      </b>
                      <span className="pjket">{t.ket}</span>
                    </span>
                    {t.waktu ? <span className="pjwaktu mono">{t.waktu}</span> : null}
                  </li>
                ))}
              </ol>
            </div>

            {l.kabar ? (
              <div className="ppesan agent">
                <p className="plabel">
                  <Ikon nama="bot" ukuran={13} />
                  Kabar dari agent
                </p>
                <p>{l.kabar.teks}</p>
                <p className="pwaktu">{l.kabar.waktu}</p>
              </div>
            ) : null}

            {l.umpan ? (
              <div className="ppesan gov">
                <p className="plabel">
                  <Ikon nama="petugas" ukuran={13} />
                  Keterangan instansi
                </p>
                <p>{l.umpan.teks}</p>
                <p className="pwaktu">
                  {l.umpan.oleh}, {l.umpan.waktu}
                </p>
              </div>
            ) : null}

            {l.duplikat ? (
              <p className="pcatatan">
                <Ikon nama="salin" ukuran={14} />
                Laporan ini dinilai sama dengan laporan lain di jenis masalah yang sama, jadi
                ditangani dalam satu pekerjaan dan statusnya mengikuti pekerjaan itu.
              </p>
            ) : null}

            <dl className="pkaki-baris">
              <dt>Instansi</dt>
              <dd>{l.instansi}</dd>
              <dt>Masuk</dt>
              <dd>
                {l.tgl}, {l.jam} ({l.lalu})
              </dd>
              <dt>Foto</dt>
              <dd>
                {l.fotoPelapor ? "1 dari pelapor" : "Tidak ada dari pelapor"}
                {l.bukti ? `, ${l.bukti} dari petugas` : ""}
              </dd>
              <dt>Laporan serupa</dt>
              <dd>{l.serupa ? `${l.serupa} laporan lain` : "Tidak ada"}</dd>
              <dt>Nomor tiket</dt>
              <dd className="mono">{l.tiket}</dd>
            </dl>
          </div>
        </article>
    </div>
  );
}
