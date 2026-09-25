/**
 * Aturan gerak yang tidak bisa dipasang lewat CSS.
 *
 * Blok `prefers-reduced-motion` di globals.css hanya mengikat properti CSS.
 * Gerak yang dijadwalkan JavaScript — gulir mulus, animasi peta — tidak
 * tersentuh olehnya dan harus memeriksa preferensinya sendiri.
 */

/**
 * Dibaca tiap kali dipanggil, bukan sekali saat modul dimuat: pengguna bisa
 * mengubah setelan sistem sementara halaman terbuka.
 */
export function kurangiGerak(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Gulir ke sebuah elemen, mulus hanya bila pengguna tidak menolak gerak.
 * Tanpa pemeriksaan ini, `behavior: "smooth"` tetap menggulir layar penuh
 * dengan animasi pada orang yang justru meminta gerak dihentikan.
 */
export function gulirKe(id: string, blok: ScrollLogicalPosition = "start") {
  document.getElementById(id)?.scrollIntoView({
    behavior: kurangiGerak() ? "auto" : "smooth",
    block: blok,
  });
}
