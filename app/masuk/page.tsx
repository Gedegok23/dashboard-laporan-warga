import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Ikon } from "@/components/Ikon";
import { PilihTema } from "@/components/PilihTema";
import { KOTA, PEMERINTAH } from "@/lib/kota";
import { MEREK } from "@/lib/merek";
import { FormMasuk } from "./FormMasuk";

export const metadata: Metadata = {
  title: `Masuk · ${MEREK.nama}`,
  description: "Masuk ke meja petugas instansi.",
};

export const dynamic = "force-dynamic";

export default async function Masuk({ searchParams }: PageProps<"/masuk">) {
  const { next } = await searchParams;
  const tujuan = typeof next === "string" && next.startsWith("/") ? next : "/";

  return (
    <main className="masuk">
      <div className="masuk-kartu">
        <div className="masuk-kop">
          {/* Lockup sudah memuat nama dan semboyan, jadi keduanya tidak ditulis
              ulang sebagai teks. Nama lengkapnya tetap ada di alt untuk
              pembaca layar. Dua berkas karena wordmark-nya navy: di permukaan
              gelap kontrasnya 1,13:1, praktis hilang. */}
          <Link href="/portal" className="masuk-logo" aria-label={`${MEREK.nama}, ${MEREK.panjang}`}>
            <Image
              className="logo-terang"
              src="/kito-lockup.png"
              alt={`${MEREK.nama}. ${MEREK.semboyan}`}
              width={1100}
              height={440}
              priority
            />
            <Image
              className="logo-gelap"
              src="/kito-lockup-gelap.png"
              alt=""
              aria-hidden
              width={1100}
              height={440}
              priority
            />
          </Link>
          <PilihTema />
        </div>

        <h1>Masuk ke meja petugas</h1>

        {/* managing-accounts.md > Best practices: "write a brief, friendly
            description of the reasons for the requirement". Alasannya di sini
            bukan fitur, melainkan isi yang dijaga. */}
        <p className="masuk-alasan">
          Di balik halaman ini ada nama dan nomor telepon warga yang melapor, catatan kerja
          instansi, dan tombol yang mengubah status laporan.
        </p>

        <FormMasuk next={tujuan} />

        <p className="masuk-jejak">
          <Ikon nama="perisai" ukuran={14} />
          <span>Sesi berlaku delapan jam, lalu Anda diminta masuk lagi.</span>
        </p>
      </div>

      <footer className="masuk-kaki">
        <p>
          Ingin melihat status laporan Anda sendiri? Itu terbuka untuk umum di{" "}
          <Link href="/portal">portal warga Kota {KOTA}</Link>, tanpa perlu masuk.
        </p>
        <p>{PEMERINTAH}</p>
      </footer>
    </main>
  );
}
