import type { Metadata } from "next";
import Link from "next/link";
import { KANAL_RESMI, KOTA, PEMERINTAH } from "@/lib/kota";

export const metadata: Metadata = {
  title: { default: "Portal Laporan Warga", template: "%s | Portal Laporan Warga" },
  description:
    `Cari laporan warga Kota ${KOTA} dan lihat sampai mana penanganannya, dari pengaduan sampai selesai.`,
};

const TAUTAN = [
  { href: "/portal", label: "Beranda" },
  { href: "/portal/laporan", label: "Daftar Laporan" },
  { href: "/portal/peta", label: "Peta" },
  { href: "/portal/scorecard", label: "Scorecard" },
  { href: "/portal/tren", label: "Tren & Statistik" },
  { href: "/portal/cek-status", label: "Cek Status" },
];

export default function TataLetakPortal({ children }: LayoutProps<"/portal">) {
  return (
    <div className="portal">
      <a className="skip" href="#isi">
        Lewati ke konten
      </a>

      <header className="pkop">
        <div className="pkop-isi">
          <Link href="/portal" className="brand">
            <div className="stempel" aria-hidden>
              ML
            </div>
            <div>
              <p className="pnama">Portal Laporan Warga</p>
              <p className="sub">{PEMERINTAH}</p>
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

          <span className="tag-contoh">Data contoh</span>
        </div>
      </header>

      <main id="isi">{children}</main>

      <footer className="pkaki">
        <p>
          Nama dan nomor WhatsApp pelapor tidak ditampilkan di portal. Saat laporan masuk, agent
          hanya menanyakan nama dan nomor WhatsApp, dan tidak pernah meminta NIK.
        </p>
        <p>
          Judul tiap laporan adalah ringkasan yang disusun agent dari pesan asli warga. Laporan yang
          mirip dikelompokkan jadi satu supaya masalah yang sama tidak dikerjakan berkali-kali.
        </p>
        <p>
          Belum menemukan laporan Anda? Kirim lewat {KANAL_RESMI} kanal resmi Kota {KOTA}.{" "}
          <Link href="/">Meja petugas</Link>
        </p>
      </footer>
    </div>
  );
}
