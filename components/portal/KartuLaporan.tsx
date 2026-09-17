import Link from "next/link";
import { Ikon } from "../Ikon";
import { LencanaStatus } from "./LencanaStatus";
import { SampulKategori } from "./SampulKategori";
import { JENIS } from "@/lib/kategori";
import type { LaporanPortal } from "@/lib/tipe";

export function KartuLaporan({ l }: { l: LaporanPortal }) {
  const jenis = JENIS[l.jenis];

  return (
    <Link href={`/portal/laporan/${l.tiket}`} className="kartu">
      <div className="kartu-atas">
        <SampulKategori jenis={l.jenis} />
        <LencanaStatus status={l.status} />
      </div>

      <div className="kartu-isi">
        <span className="kartu-jenis">
          <span className={`jenis-bulat j-${l.jenis}`} aria-hidden>
            <Ikon nama={jenis.ikon} ukuran={15} />
          </span>
          {jenis.label}
        </span>

        <p className="kartu-ringkas">{l.ringkas}</p>

        <span className="kartu-meta">
          <span>
            <Ikon nama="lokasi" ukuran={14} />
            Kel. {l.kelurahan}
          </span>
          <span className="pisah" aria-hidden />
          <span>{l.lalu}</span>
        </span>

        {l.serupa > 0 ? (
          <span className="chip-serupa">
            <Ikon nama="regu" ukuran={13} />
            {l.serupa} laporan serupa
          </span>
        ) : null}
      </div>
    </Link>
  );
}
