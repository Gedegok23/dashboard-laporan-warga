import { Fragment } from "react";

/**
 * Menandai potongan yang cocok dengan kata kunci pencarian. Memecah teks jadi
 * potongan React, bukan menyuntik HTML, supaya isi laporan warga tidak pernah
 * ditafsirkan sebagai markup.
 */
export function Sorot({ teks, kunci }: { teks: string; kunci: string }) {
  if (!kunci) return <>{teks}</>;

  const pola = new RegExp(`(${kunci.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const potongan = teks.split(pola);

  return (
    <>
      {potongan.map((p, i) =>
        p.toLowerCase() === kunci.toLowerCase() ? (
          <mark key={i}>{p}</mark>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
