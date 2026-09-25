import type { Metadata } from "next";
import Link from "next/link";
import { PilihTema } from "@/components/PilihTema";
import { BOT_TELEGRAM, KOTA, PEMERINTAH } from "@/lib/kota";
import { MEREK } from "@/lib/merek";
import { isiPortal } from "@/lib/sumber";

export const metadata: Metadata = {
  title: { default: `${MEREK.nama} · ${MEREK.panjang}`, template: `%s | ${MEREK.nama}` },
  description:
    `Cari laporan warga Kota ${KOTA} dan lihat sampai mana penanganannya, dari pengaduan sampai selesai.`,
};

const TAUTAN = [
  { href: "/portal", label: "Beranda" },
  { href: "/portal/laporan", label: "Daftar Laporan" },
  { href: "/portal/scorecard", label: "Scorecard" },
  { href: "/portal/tren", label: "Tren & Statistik" },
  { href: "/portal/cek-status", label: "Cek Status" },
];

export default async function TataLetakPortal({ children }: LayoutProps<"/portal">) {
  // Lencana "Data contoh" hanya benar saat isi memang contoh. isiPortal()
  // dibungkus cache(), jadi ini berbagi kueri dengan halaman di bawahnya.
  const { langsung } = await isiPortal();

  return (
    <div className="portal">
      <a className="skip" href="#isi">
        Lewati ke konten
      </a>

      <header className="pkop">
        <div className="pkop-isi">
          <Link href="/portal" className="brand">
            <div className="stempel" aria-hidden>
              {MEREK.monogram}
            </div>
            <div>
              <p className="pnama">{MEREK.nama}</p>
              <p className="sub">{MEREK.semboyan}</p>
            </div>
          </Link>

          <nav aria-label="Navigasi portal">
            <ul>
              {TAUTAN.map((t) => (
                <li key={t.href}>
                  <Link href={t.href}>{t.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <PilihTema />
          {langsung ? null : <span className="tag-contoh">Data contoh</span>}
        </div>
      </header>

      <main id="isi">{children}</main>

      <footer className="pkaki">
        <p className="pkaki-merek">
          <b>{MEREK.nama}</b> &mdash; {MEREK.panjang}. Dikelola {PEMERINTAH}.
        </p>
        <p>
          Nama dan nomor WhatsApp pelapor tidak ditampilkan di portal. Saat laporan masuk, agent
          hanya menanyakan nama dan nomor WhatsApp, dan tidak pernah meminta NIK.
        </p>
        <p>
          Judul tiap laporan adalah ringkasan yang disusun agent dari pesan asli warga. Laporan yang
          mirip dikelompokkan jadi satu supaya masalah yang sama tidak dikerjakan berkali-kali.
        </p>
        <p>
          Belum menemukan laporan Anda? Kirim lewat bot Telegram resmi Kota {KOTA}:{" "}
          <a href={BOT_TELEGRAM.url} rel="noreferrer">
            {BOT_TELEGRAM.nama}
          </a>
        </p>
      </footer>
    </div>
  );
}
