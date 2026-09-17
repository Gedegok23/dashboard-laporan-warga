import { Ikon } from "../Ikon";
import type { StatusPortal } from "@/lib/tipe";

/**
 * Portal cuma punya dua status, jadi lencananya tidak ikut memakai warna
 * kategori. Satu warna satu arti: teal di sini selalu berarti selesai.
 */
export function LencanaStatus({ status }: { status: StatusPortal }) {
  const selesai = status === "clear";
  return (
    <span className={`lencana ${status}`}>
      <Ikon nama={selesai ? "selesai" : "proses"} ukuran={14} />
      {selesai ? "Selesai" : "Belum selesai"}
    </span>
  );
}
