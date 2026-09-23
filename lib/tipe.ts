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
  | "info"
  | "tugas"
  | "regu"
  | "jadwal"
  | "unggah"
  | "kirim"
  | "portal"
  | "pesan"
  | "lokasi"
  | "vektor"
  | "pohon"
  | "kesehatan";

export type Pelapor = {
  nama: string;
  namaPenuh: string;
  wa: string;
  waPenuh: string;
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

/**
 * Penanda tindakan lapangan. Diturunkan dari tahap laporan supaya meja triase
 * dan meja penanganan tidak pernah menyimpan dua kebenaran yang berbeda.
 */
export type StatusTindak = "belum" | "proses" | "selesai";

/** Orang lapangan yang bisa dikirim oleh admin instansi. */
export type PetugasLapangan = {
  id: string;
  nama: string;
  regu: string;
  instansi: string;
  wa: string;
};

/** Dokumentasi dari lapangan, disimpan di RDB sebagai bukti penyelesaian. */
export type Bukti = {
  nama: string;
  ukuran: string;
  jam: string;
  /** Nama petugas lapangan yang mengunggah. */
  oleh: string;
  gps: string;
};

export type Penanganan = {
  /** Id petugas lapangan yang dikirim, null bila belum ditugaskan. */
  petugas: string | null;
  /** Tanggal penugasan ke lapangan, contoh "17 Sep 2026 pagi". */
  jadwal: string | null;
  /** Catatan kerja untuk orang lapangan. Tidak pernah dikirim ke pelapor. */
  catatan: string;
  bukti: Bukti[];
};

/**
 * Umpan balik yang ditulis admin instansi. Disimpan di RDB, tampil di portal,
 * lalu disampaikan agent ke pelapor dan pelapor laporan mirip.
 */
export type Umpan = {
  teks: string;
  oleh: string;
  waktu: string;
  /** Jumlah pelapor yang dihubungi agent, termasuk pelapor laporan mirip. */
  penerima: number;
};

/**
 * Kabar status yang disusun agent sendiri, bukan diketik admin. Terbit tiap
 * penanda tindakan berubah, menjawab tugas agent memberi tahu pelapor apakah
 * laporannya sudah selesai atau masih dalam proses.
 */
export type Kabar = {
  status: StatusTindak;
  teks: string;
  waktu: string;
  /** Jumlah pelapor yang dihubungi agent untuk kabar ini. */
  penerima: number;
};

/** Portal hanya mengenal dua status. */
export type StatusPortal = "clear" | "belum";

/**
 * Satu tonggak perjalanan laporan, ditulis dengan kata yang dipakai warga.
 * Tonggak yang belum tercapai tetap ditampilkan supaya pelapor tahu sisa
 * langkahnya, bukan cuma tahu posisi sekarang.
 */
export type Tonggak = {
  nama: string;
  ket: string;
  waktu: string | null;
  tercapai: boolean;
};

/**
 * Bentuk laporan yang aman dikirim ke halaman publik. Sengaja tidak memuat
 * identitas pelapor, teks mentah, catatan kerja internal, maupun koordinat:
 * apa pun yang masuk tipe ini ikut terkirim ke peramban siapa saja.
 */
export type LaporanPortal = {
  tiket: string;
  ringkas: string;
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  tgl: string;
  jam: string;
  ts: number;
  /** Jarak waktu dalam bahasa sehari-hari, contoh "3 hari lalu". */
  lalu: string;
  kategori: string;
  jenis: Jenis;
  klaster: string;
  instansi: string;
  status: StatusPortal;
  duplikat: boolean;
  /** Laporan mirip lain di klaster yang sama. */
  serupa: number;
  /**
   * Titik peta yang sudah dikasarkan ke tiga angka di belakang koma, kira-kira
   * seratus meter. Portal tidak pernah menerbitkan koordinat persis laporan.
   */
  titik: [number, number];
  fotoPelapor: boolean;
  bukti: number;
  kabar: { teks: string; waktu: string } | null;
  umpan: { teks: string; oleh: string; waktu: string } | null;
  perjalanan: Tonggak[];
};

export type KelompokPortal = {
  id: string;
  kategori: string;
  jenis: Jenis;
  wilayah: string;
  instansi: string;
  lapor: LaporanPortal[];
};

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
  /** Penugasan lapangan. Kosong berarti belum ada yang dikirim. */
  penanganan?: Penanganan;
  /** Umpan balik yang sudah terbit di portal dan dikirim agent. */
  umpan?: Umpan[];
  /** Draf umpan balik yang belum dikirim. */
  draf?: string;
  /** Kabar status otomatis dari agent, terbaru di depan. */
  kabar?: Kabar[];
};

/**
 * Jenis masalah tingkat kota. Dipakai portal untuk memberi tiap klaster warna,
 * ikon, dan sampul yang sama, supaya warga bisa memindai daftar tanpa membaca.
 */
export type Jenis =
  | "infrastruktur"
  | "lingkungan"
  | "keamanan"
  | "kesehatan"
  | "sosial"
  | "lainnya";

export type Klaster = {
  id: string;
  kategori: string;
  jenis: Jenis;
  wilayah: string;
  instansi: string;
  /** Ambang kemiripan untuk masuk klaster ini. */
  ambang: number;
  /**
   * true bila klaster ini dibentuk aplikasi dari jenis masalah, bukan hasil
   * pengelompokan kemiripan. Aksi seklaster tidak berlaku untuk klaster
   * semacam ini karena di database laporannya tidak benar-benar terhubung.
   */
  sintetis?: boolean;
  lapor: Laporan[];
};

export type Saring = "semua" | "0" | "1" | "2" | "3" | "lewat" | "dup";
export type Urut = "kategori" | "instansi" | "tahap" | "waktu";
export type Arah = "naik" | "turun";
export type TabPeriksa = "detail" | "penanganan" | "log";

/** Saringan meja penanganan, terpisah dari saringan triase. */
export type SaringTindak = "semua" | "belum" | "proses" | "selesai" | "tanpa-petugas";
export type UrutTindak = "laporan" | "pelapor" | "lokasi" | "tanggal" | "petugas" | "status";
