export type Tahap = 0 | 1 | 2 | 3;

export type NamaIkon =
  | "cari"
  | "hapus"
  | "kotak-masuk"
  | "tunggu"
  | "peringatan"
  | "salin"
  | "selesai"
  | "lingkaran"
  | "teruskan"
  | "proses"
  | "buka"
  | "turun"
  | "naik"
  | "kamera"
  | "tanpa-kamera"
  | "dokumen"
  | "bot"
  | "warga"
  | "kilau"
  | "basis-data"
  | "petugas"
  | "perisai"
  | "lihat"
  | "sembunyi"
  | "verifikasi"
  | "kerja"
  | "mundur"
  | "alih"
  | "saring-mati"
  | "atur-ulang"
  | "info";

export type Pelapor = {
  nama: string;
  namaPenuh: string;
  nik: string;
  nikPenuh: string;
  wa: string;
  waPenuh: string;
  verif: string;
};

export type Foto = {
  nama: string;
  ukuran: string;
  gps: string;
  /** Jarak antara koordinat EXIF dan lokasi yang ditulis warga, null bila cocok. */
  selisih: string | null;
};

export type PeranLog = "warga" | "bot" | "sistem" | "petugas";

export type BarisLog = {
  siapa: string;
  peran: PeranLog;
  ikon: NamaIkon;
  jam: string;
  teks: string;
  /** Input mentah warga, disimpan apa adanya untuk jejak audit. */
  mentah?: string;
};

/** [judul status, keterangan, waktu] */
export type Riwayat = [string, string, string];

export type Laporan = {
  tiket: string;
  tahap: Tahap;
  /** Sisa hari kerja sebelum batas tindak lanjut, negatif berarti lewat. */
  sisa: number | null;
  /** YYMMDDHHMM, dipakai untuk pengurutan. */
  ts: number;
  tgl: string;
  jam: string;
  kanal: string;
  ringkas: string;
  mentah: string;
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  koordinat: string;
  /** Skor klasifikasi bot, dibandingkan dengan ambang klaster. */
  skor: number;
  foto: Foto;
  pelapor: Pelapor;
  riwayat: Riwayat[];
  duplikat?: boolean;
  /** Instansi pengganti bila petugas mengalihkan dari penanggung jawab klaster. */
  instansi?: string | null;
  /** Baris log yang ditambahkan petugas lewat aksi di meja. */
  tambahan?: BarisLog[];
};

export type Klaster = {
  id: string;
  kategori: string;
  wilayah: string;
  instansi: string;
  /** Ambang kemiripan untuk masuk klaster ini. */
  ambang: number;
  lapor: Laporan[];
};

export type Saring = "semua" | "0" | "1" | "2" | "3" | "lewat" | "dup";
export type Urut = "kategori" | "instansi" | "tahap" | "waktu";
export type Arah = "naik" | "turun";
export type TabPeriksa = "detail" | "log";
