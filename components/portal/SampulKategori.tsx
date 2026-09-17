import type { Jenis } from "@/lib/tipe";

/**
 * Sampul bergambar untuk tiap jenis masalah. Bukan foto laporan: memalsukan
 * dokumentasi kejadian warga akan menyesatkan, sedangkan motif ini jujur
 * menggambarkan jenisnya saja. Foto asli baru tampil di halaman rincian,
 * dari berkas pelapor dan petugas.
 */
function Motif({ jenis }: { jenis: Jenis }) {
  switch (jenis) {
    case "infrastruktur":
      return (
        <g>
          <rect x="24" y="74" width="152" height="7" rx="3.5" fill="#fff" fillOpacity="0.45" />
          <path d="M92 28h16l9 34H83z" fill="#fff" fillOpacity="0.95" />
          <rect x="94" y="37" width="12" height="6" fill="currentColor" />
          <rect x="92" y="49" width="16" height="6" fill="currentColor" />
          <circle cx="48" cy="52" r="9" fill="#fff" fillOpacity="0.4" />
          <circle cx="152" cy="46" r="6" fill="#fff" fillOpacity="0.3" />
        </g>
      );
    case "lingkungan":
      return (
        <g>
          <rect x="96" y="58" width="8" height="26" rx="2" fill="#fff" fillOpacity="0.9" />
          <circle cx="100" cy="40" r="25" fill="#fff" fillOpacity="0.92" />
          <circle cx="79" cy="53" r="15" fill="#fff" fillOpacity="0.55" />
          <circle cx="121" cy="53" r="15" fill="#fff" fillOpacity="0.55" />
          <rect x="24" y="80" width="152" height="5" rx="2.5" fill="#fff" fillOpacity="0.35" />
        </g>
      );
    case "keamanan":
      return (
        <g>
          <path d="M100 24l30 11v22c0 17-13 27-30 32-17-5-30-15-30-32V35z" fill="#fff" fillOpacity="0.92" />
          <path d="M88 55l9 9 17-18" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      );
    case "kesehatan":
      return (
        <g>
          <rect x="66" y="34" width="68" height="48" rx="10" fill="#fff" fillOpacity="0.92" />
          <rect x="94" y="44" width="12" height="28" rx="3" fill="currentColor" />
          <rect x="86" y="52" width="28" height="12" rx="3" fill="currentColor" />
        </g>
      );
    case "sosial":
      return (
        <g>
          <circle cx="84" cy="42" r="15" fill="#fff" fillOpacity="0.92" />
          <circle cx="116" cy="42" r="15" fill="#fff" fillOpacity="0.55" />
          <path d="M62 82c0-12 10-21 22-21s22 9 22 21z" fill="#fff" fillOpacity="0.92" />
          <path d="M94 82c0-12 10-21 22-21s22 9 22 21z" fill="#fff" fillOpacity="0.55" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="72" y="26" width="56" height="60" rx="8" fill="#fff" fillOpacity="0.92" />
          <rect x="84" y="42" width="32" height="6" rx="3" fill="currentColor" />
          <rect x="84" y="56" width="32" height="6" rx="3" fill="currentColor" />
          <rect x="84" y="70" width="20" height="6" rx="3" fill="currentColor" />
        </g>
      );
  }
}

export function SampulKategori({ jenis }: { jenis: Jenis }) {
  return (
    <div className={`sampul j-${jenis}`} aria-hidden>
      <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
        <circle cx="32" cy="18" r="30" fill="#fff" fillOpacity="0.12" />
        <circle cx="176" cy="88" r="34" fill="#fff" fillOpacity="0.1" />
        <Motif jenis={jenis} />
      </svg>
    </div>
  );
}
