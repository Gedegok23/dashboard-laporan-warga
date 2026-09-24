/**
 * Identitas daerah dan kanal laporan.
 *
 * Aplikasi ini dipakai lebih dari satu kota, jadi namanya tidak dipaku di
 * halaman. Nilai bawaan mengikuti data contoh; pemasangan nyata menimpanya
 * lewat env saat build.
 */
export const KOTA = process.env.NEXT_PUBLIC_KOTA?.trim() || "Bandung";
export const PEMERINTAH = `Pemerintah Kota ${KOTA}`;
export const KANAL = process.env.NEXT_PUBLIC_KANAL?.trim() || "bot WhatsApp dan web";

/** Kanal untuk kalimat ajakan, contoh "bot WhatsApp kanal resmi Kota Bandung". */
export const KANAL_RESMI = process.env.NEXT_PUBLIC_KANAL_RESMI?.trim() || "bot WhatsApp";

/** Bot Telegram tempat warga mengirim laporan. */
export const BOT_TELEGRAM = {
  nama: process.env.NEXT_PUBLIC_BOT_NAMA?.trim() || "@Palembang_lapor_bot",
  get url() {
    return `https://t.me/${this.nama.replace(/^@/, "")}`;
  },
};
