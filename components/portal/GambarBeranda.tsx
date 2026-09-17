/**
 * Gambar kepala beranda. Motif sendiri, bukan foto: portal ini tidak pernah
 * memajang dokumentasi kejadian di halaman depan.
 */
export function GambarBeranda() {
  return (
    <div className="pgambar" aria-hidden>
      <svg viewBox="0 0 280 210" fill="none">
        <circle cx="140" cy="105" r="98" fill="var(--accent)" fillOpacity="0.07" />
        <circle cx="52" cy="58" r="6" fill="var(--accent)" fillOpacity="0.28" />
        <circle cx="236" cy="150" r="5" fill="var(--t2)" fillOpacity="0.4" />
        <circle cx="228" cy="52" r="4" fill="var(--accent)" fillOpacity="0.22" />

        <rect x="108" y="62" width="130" height="96" rx="12" fill="var(--surface)" stroke="var(--line-strong)" />
        <rect x="126" y="84" width="76" height="9" rx="4.5" fill="var(--accent)" fillOpacity="0.75" />
        <rect x="126" y="104" width="94" height="7" rx="3.5" fill="var(--line-strong)" />
        <rect x="126" y="120" width="70" height="7" rx="3.5" fill="var(--line-strong)" />
        <rect x="126" y="136" width="44" height="9" rx="4.5" fill="var(--t2)" fillOpacity="0.85" />

        <path
          d="M74 46c-18 0-32 14-32 32 0 24 32 56 32 56s32-32 32-56c0-18-14-32-32-32z"
          fill="var(--accent)"
        />
        <circle cx="74" cy="77" r="12" fill="var(--surface)" />

        <circle cx="222" cy="66" r="21" fill="var(--t3)" />
        <path
          d="M213 66l6 7 12-14"
          stroke="var(--t3-ink)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
