/**
 * Menyalin teks ke papan klip.
 *
 * `navigator.clipboard` hanya ada di konteks aman. Meja ini dilayani lewat
 * HTTP polos, jadi di sana objeknya tidak ada sama sekali dan pemanggilan
 * dengan `?.` gagal tanpa suara: tombolnya tampak bekerja, papan klip tetap
 * kosong.
 *
 * Jalur cadangannya `document.execCommand("copy")`. Ia memang sudah usang,
 * tapi inilah satu-satunya yang jalan tanpa TLS, dan selama meja belum
 * dilayani lewat HTTPS ia yang menahan fitur ini tetap hidup.
 */
export async function salinTeks(teks: string): Promise<boolean> {
  if (!teks) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(teks);
      return true;
    } catch {
      // Izin ditolak atau dokumen tidak fokus. Jatuh ke cara lama.
    }
  }

  if (typeof document === "undefined") return false;
  const kotak = document.createElement("textarea");
  kotak.value = teks;
  // Di luar layar, tapi tetap terpilih: pilihan pada elemen tersembunyi diabaikan.
  kotak.setAttribute("readonly", "");
  kotak.style.position = "fixed";
  kotak.style.top = "0";
  kotak.style.left = "-9999px";
  document.body.appendChild(kotak);
  const pilihanLama = document.getSelection()?.rangeCount
    ? document.getSelection()?.getRangeAt(0)
    : null;
  try {
    kotak.select();
    kotak.setSelectionRange(0, kotak.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(kotak);
    if (pilihanLama) {
      const pilihan = document.getSelection();
      pilihan?.removeAllRanges();
      pilihan?.addRange(pilihanLama);
    }
  }
}
