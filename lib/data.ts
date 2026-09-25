import type {
  Klaster,
  NamaIkon,
  PetugasLapangan,
  StatusTindak,
  Tahap,
} from "./tipe";

/** Petugas yang sedang masuk. Dipakai untuk jejak audit dan baris log. */
export const TAHAP: { nama: string; ikon: NamaIkon }[] = [
  { nama: "Perlu verifikasi", ikon: "lingkaran" },
  { nama: "Diteruskan", ikon: "teruskan" },
  { nama: "Ditindaklanjuti", ikon: "proses" },
  { nama: "Selesai", ikon: "selesai" },
];

/** Satu langkah maju dari tiap tahap, dipakai tombol utama di panel periksa. */
export const LANJUT: { ke: Tahap; label: string; ikon: NamaIkon; catatan: string }[] = [
  {
    ke: 1,
    label: "Verifikasi dan teruskan",
    ikon: "verifikasi",
    catatan: "Laporan diverifikasi dan didisposisi ke instansi penanggung jawab",
  },
  {
    ke: 2,
    label: "Tandai ditindaklanjuti",
    ikon: "kerja",
    catatan: "Instansi menyatakan penanganan lapangan sedang berjalan",
  },
  {
    ke: 3,
    label: "Tandai selesai",
    ikon: "selesai",
    catatan: "Penanganan dinyatakan selesai oleh petugas",
  },
];

/**
 * Penanda tindakan yang dipakai meja penanganan. Urutannya sama dengan tahap
 * laporan supaya satu perubahan status hanya punya satu arti di seluruh meja.
 */
export const TINDAK: Record<
  StatusTindak,
  { nama: string; pendek: string; ikon: NamaIkon; tahap: Tahap; catatan: string }
> = {
  belum: {
    nama: "Belum ditindak",
    pendek: "Belum",
    ikon: "lingkaran",
    tahap: 1,
    catatan: "Penanganan lapangan dikembalikan ke antrean instansi",
  },
  proses: {
    nama: "Sedang ditindak",
    pendek: "Sedang",
    ikon: "proses",
    tahap: 2,
    catatan: "Regu lapangan sedang menangani laporan ini",
  },
  selesai: {
    nama: "Sudah ditindak",
    pendek: "Sudah",
    ikon: "selesai",
    tahap: 3,
    catatan: "Penanganan lapangan dinyatakan selesai dengan bukti dokumentasi",
  },
};

/** Minimal satu bukti dokumentasi sebelum laporan boleh ditutup di RDB. */
export const BUKTI_MINIMAL = 1;

/**
 * Regu lapangan yang bisa dikirim admin instansi. Bukan data pegawai
 * sungguhan: nama dan nomor dikarang, unit mengikuti struktur nyata.
 */
export const PETUGAS_LAPANGAN: PetugasLapangan[] = [
  {
    id: "PTG-11",
    nama: "Dadang Suherman",
    regu: "Regu tambal cepat 2",
    instansi: "Dinas Bina Marga dan Penataan Ruang",
    wa: "+62 813-2207-5510",
  },
  {
    id: "PTG-14",
    nama: "Eka Nurjanah",
    regu: "Regu pemeliharaan trotoar",
    instansi: "Dinas Bina Marga dan Penataan Ruang",
    wa: "+62 812-6641-8123",
  },
  {
    id: "PTG-23",
    nama: "Iwan Gunawan",
    regu: "Regu angkut TPS wilayah barat",
    instansi: "Dinas Lingkungan Hidup dan Kebersihan",
    wa: "+62 878-3390-2274",
  },
  {
    id: "PTG-27",
    nama: "Nanang Sutisna",
    regu: "Regu sapu jalan malam",
    instansi: "Dinas Lingkungan Hidup dan Kebersihan",
    wa: "+62 856-1148-9067",
  },
  {
    id: "PTG-35",
    nama: "Rizal Maulana",
    regu: "Regu PJU sektor utara",
    instansi: "Dinas Perhubungan",
    wa: "+62 819-4402-3318",
  },
  {
    id: "PTG-41",
    nama: "Surya Adiputra",
    regu: "Regu drainase Kiaracondong",
    instansi: "Dinas Pekerjaan Umum",
    wa: "+62 811-2295-7740",
  },
  {
    id: "PTG-48",
    nama: "Heru Purnomo",
    regu: "Regu pangkas pohon 1",
    instansi: "DPKP3",
    wa: "+62 877-5063-4192",
  },
  {
    id: "PTG-52",
    nama: "Tuti Herawati",
    regu: "Regu penertiban Andir",
    instansi: "Satuan Polisi Pamong Praja",
    wa: "+62 838-7719-2205",
  },
];

/** Batas tindak lanjut yang berlaku di meja ini. */
export const BATAS_HARI_KERJA = 5;

/** Laporan masuk seluruh kanal, 14 hari sampai 16 Sep 2026. */
export const harian: [string, number][] = [
  ["Kam 3 Sep", 38],
  ["Jum 4 Sep", 52],
  ["Sab 5 Sep", 19],
  ["Min 6 Sep", 12],
  ["Sen 7 Sep", 41],
  ["Sel 8 Sep", 47],
  ["Rab 9 Sep", 36],
  ["Kam 10 Sep", 44],
  ["Jum 11 Sep", 58],
  ["Sab 12 Sep", 22],
  ["Min 13 Sep", 15],
  ["Sen 14 Sep", 61],
  ["Sel 15 Sep", 53],
  ["Rab 16 Sep", 47],
];

/**
 * Data contoh. Bukan laporan warga sungguhan: nama dan nomor WhatsApp dikarang,
 * koordinat menunjuk ke ruas jalan nyata di Kota Bandung. Agent hanya menanyakan
 * nama dan nomor WhatsApp, jadi tidak ada NIK yang tersimpan di berkas laporan.
 */
export const dataAwal: Klaster[] = [
  {
    id: "KLS-0031",
    kategori: "Jalan rusak dan berlubang",
    jenis: "infrastruktur",
    wilayah: "Sukajadi, Cicendo, Gedebage",
    instansi: "Dinas Bina Marga dan Penataan Ruang",
    ambang: 0.85,
    lapor: [
      {
        tiket: "TKT-260916-0473",
        tambahan: [
          {
            siapa: "Bot",
            peran: "bot",
            ikon: "kirim",
            jam: "16:45",
            teks: "Kabar status dikirim ke pelapor: Laporan Anda sedang ditangani Regu tambal cepat 2 dari Dinas Bina Marga dan Penataan Ruang. Jadwal turun lapangan 17 Sep 2026, 07.00. Kami kabari lagi begitu pekerjaannya selesai.",
          },
        ],
        kabar: [
          {
            status: "proses",
            teks:
              "Laporan Anda sedang ditangani Regu tambal cepat 2 dari Dinas Bina Marga dan Penataan Ruang. Jadwal turun lapangan 17 Sep 2026, 07.00. Kami kabari lagi begitu pekerjaannya selesai.",
            waktu: "16 Sep 16:45",
            penerima: 1,
          },
        ],
        penanganan: {
          petugas: "PTG-11",
          jadwal: "17 Sep 2026, 07.00",
          catatan:
            "Tutup jalur lambat sebelah kiri saat penambalan. Volume lubang kira-kira 1,2 m2, bawa hotmix cadangan karena sekitarnya sudah retak buaya.",
          bukti: [
            {
              nama: "IMG-20260916-1642-sebelum.jpg",
              ukuran: "1,8 MB",
              jam: "16:42",
              oleh: "Dadang Suherman",
              gps: "-6.89216, 107.58758",
            },
          ],
        },
        tahap: 2,
        sisa: 2,
        ts: 2609161402,
        tgl: "16 Sep 2026",
        jam: "14:02",
        kanal: "WhatsApp bot",
        ringkas: "Lubang sedalam kira-kira 20 cm di jalur lambat depan gang",
        mentah:
          "pak jalan depan gang deket pvj bolong parah udah 2 minggu, tadi pagi ada motor jatuh",
        jalan: "Jl. Dr. Djunjunan, jalur lambat arah timur, dekat KM 2+300",
        kelurahan: "Sukabungah",
        kecamatan: "Sukajadi",
        koordinat: "-6.89213, 107.58761",
        skor: 0.91,
        foto: {
          nama: "IMG-20260916-140127.jpg",
          ukuran: "2,1 MB",
          gps: "-6.89347, 107.59904",
          selisih: "1,4 km",
        },
        pelapor: {
          nama: "Rangga N.",
          namaPenuh: "Rangga Nurhakim",
          wa: "+62 812-••••-4471",
          waPenuh: "+62 812-9033-4471",
        },
        riwayat: [
          ["Ditindaklanjuti", "Regu tambal cepat dijadwalkan 17 Sep pagi", "16 Sep 16:40"],
          ["Diteruskan", "Disposisi ke Bidang Pemeliharaan Jalan", "16 Sep 15:12"],
          ["Perlu verifikasi", "Masuk lewat bot, dipetakan ke klaster KLS-0031", "16 Sep 14:02"],
        ],
      },
      {
        tiket: "TKT-260915-0388",
        tahap: 1,
        sisa: 4,
        ts: 2609151944,
        tgl: "15 Sep 2026",
        jam: "19:44",
        kanal: "WhatsApp bot",
        ringkas: "Aspal mengelupas sepanjang kira-kira 30 meter di jalur cepat",
        mentah:
          "aspal ngelupas panjang banget di soekarno hatta arah cibiru, bahaya buat motor malem",
        jalan: "Jl. Soekarno-Hatta arah timur, seberang Gedebage",
        kelurahan: "Cisaranten Kidul",
        kecamatan: "Gedebage",
        koordinat: "-6.94118, 107.69432",
        skor: 0.88,
        foto: {
          nama: "IMG-20260915-194402.jpg",
          ukuran: "1,7 MB",
          gps: "-6.94120, 107.69430",
          selisih: null,
        },
        pelapor: {
          nama: "Siti M.",
          namaPenuh: "Siti Maryani",
          wa: "+62 857-••••-1120",
          waPenuh: "+62 857-6644-1120",
        },
        riwayat: [
          ["Diteruskan", "Disposisi ke Bidang Pemeliharaan Jalan", "16 Sep 08:10"],
          ["Perlu verifikasi", "Masuk lewat bot, dipetakan ke klaster KLS-0031", "15 Sep 19:44"],
        ],
      },
      {
        tiket: "TKT-260915-0359",
        duplikat: true,
        tahap: 0,
        sisa: 3,
        ts: 2609151107,
        tgl: "15 Sep 2026",
        jam: "11:07",
        kanal: "WhatsApp bot",
        ringkas: "Bekas galian pipa belum dirapikan, permukaan bergelombang",
        mentah:
          "bekas galian pipa depan sekolah blm dirapihin, jadi gundukan, anak sekolah suka kepeleset",
        jalan: "Jl. Cihampelas, depan sekolah",
        kelurahan: "Cipaganti",
        kecamatan: "Coblong",
        koordinat: "-6.89055, 107.60402",
        skor: 0.72,
        foto: {
          nama: "IMG-20260915-110640.jpg",
          ukuran: "1,9 MB",
          gps: "-6.89052, 107.60399",
          selisih: null,
        },
        pelapor: {
          nama: "Wulan D.",
          namaPenuh: "Wulan Damayanti",
          wa: "+62 895-••••-3067",
          waPenuh: "+62 895-2214-3067",
        },
        riwayat: [
          [
            "Perlu verifikasi",
            "Skor klasifikasi di bawah ambang klaster, perlu penilaian petugas",
            "15 Sep 11:07",
          ],
        ],
      },
      {
        tiket: "TKT-260914-0201",
        kabar: [
          {
            status: "selesai",
            teks:
              "Laporan Anda sudah selesai ditangani Regu tambal cepat 2 dari Dinas Bina Marga dan Penataan Ruang, dengan 2 bukti dokumentasi dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru.",
            waktu: "15 Sep 11:10",
            penerima: 1,
          },
        ],
        tambahan: [
          {
            siapa: "Bot",
            peran: "bot",
            ikon: "kirim",
            jam: "11:10",
            teks: "Kabar status dikirim ke pelapor: Laporan Anda sudah selesai ditangani Regu tambal cepat 2 dari Dinas Bina Marga dan Penataan Ruang, dengan 2 bukti dokumentasi dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru.",
          },
          {
            siapa: "Warga",
            peran: "warga",
            ikon: "warga",
            jam: "15:42",
            teks: "Membalas kabar penyelesaian.",
            mentah: "udah rata pak, makasih. tapi garis putihnya belum dicat ulang",
          },
        ],
        penanganan: {
          petugas: "PTG-11",
          jadwal: "15 Sep 2026, 07.00",
          catatan: "Penambalan dua titik selesai dalam satu kali kerja, tidak perlu penutupan jalur.",
          bukti: [
            {
              nama: "IMG-20260915-0731-sebelum.jpg",
              ukuran: "1,9 MB",
              jam: "07:31",
              oleh: "Dadang Suherman",
              gps: "-6.94118, 107.69042",
            },
            {
              nama: "IMG-20260915-1104-sesudah.jpg",
              ukuran: "2,0 MB",
              jam: "11:04",
              oleh: "Dadang Suherman",
              gps: "-6.94120, 107.69039",
            },
          ],
        },
        umpan: [
          {
            teks:
              "Lubang di ruas ini sudah ditambal regu tambal cepat pada 15 September dan jalur kembali normal. Bila dalam dua minggu muncul retak baru di titik yang sama, balas pesan ini dengan foto terbaru supaya kami jadwalkan pelapisan ulang.",
            oleh: "Admin Dinas Bina Marga dan Penataan Ruang",
            waktu: "15 Sep 13:20",
            penerima: 4,
          },
        ],
        tahap: 3,
        sisa: null,
        ts: 2609140921,
        tgl: "14 Sep 2026",
        jam: "09:21",
        kanal: "Web",
        ringkas: "Lubang di mulut putaran balik sudah ditambal",
        mentah: "di puteran balik deket rs ada lubang gede, mobil sering kena",
        jalan: "Jl. Pasteur, putaran balik dekat rumah sakit",
        kelurahan: "Pasteur",
        kecamatan: "Sukajadi",
        koordinat: "-6.89902, 107.59015",
        skor: 0.84,
        foto: {
          nama: "unggahan-web-4412.jpg",
          ukuran: "980 KB",
          gps: "tidak ada EXIF",
          selisih: null,
        },
        pelapor: {
          nama: "Bayu P.",
          namaPenuh: "Bayu Prasetya",
          wa: "+62 811-••••-7781",
          waPenuh: "+62 811-2058-7781",
        },
        riwayat: [
          ["Selesai", "Penambalan selesai, foto hasil diunggah petugas lapangan", "15 Sep 11:05"],
          ["Ditindaklanjuti", "Regu tambal cepat berangkat", "14 Sep 13:30"],
          ["Diteruskan", "Disposisi ke Bidang Pemeliharaan Jalan", "14 Sep 10:02"],
          ["Perlu verifikasi", "Masuk lewat web", "14 Sep 09:21"],
        ],
      },
    ],
  },
  {
    id: "KLS-0044",
    kategori: "Sampah menumpuk di TPS",
    jenis: "lingkungan",
    wilayah: "Babakan Ciparay, Bandung Kulon",
    instansi: "Dinas Lingkungan Hidup dan Kebersihan",
    ambang: 0.88,
    lapor: [
      {
        tiket: "TKT-260916-0455",
        tahap: 0,
        sisa: -2,
        ts: 2609161137,
        tgl: "16 Sep 2026",
        jam: "11:37",
        kanal: "WhatsApp bot",
        ringkas: "Sampah meluber ke badan jalan, belum diangkut sejak akhir pekan",
        mentah: "tps deket pasar udah numpuk sampe jalan, bau banget dari sabtu belum diangkut",
        jalan: "Jl. Kopo, TPS samping pasar",
        kelurahan: "Babakan",
        kecamatan: "Babakan Ciparay",
        koordinat: "-6.94517, 107.58102",
        skor: 0.94,
        foto: {
          nama: "IMG-20260916-113701.jpg",
          ukuran: "3,0 MB",
          gps: "-6.94515, 107.58099",
          selisih: null,
        },
        pelapor: {
          nama: "Dewi R.",
          namaPenuh: "Dewi Rahmawati",
          wa: "+62 813-••••-2290",
          waPenuh: "+62 813-7712-2290",
        },
        riwayat: [
          ["Perlu verifikasi", "Batas tindak lanjut 5 hari kerja terlampaui 2 hari", "16 Sep 11:37"],
        ],
      },
      {
        tiket: "TKT-260916-0448",
        tahap: 0,
        sisa: 3,
        ts: 2609160912,
        tgl: "16 Sep 2026",
        jam: "09:12",
        kanal: "WhatsApp bot",
        ringkas: "Gerobak sampah tidak datang tiga hari berturut-turut",
        mentah: "gerobak sampah ga dateng 3 hari, warga rt 04 udah numpuk di depan rumah",
        jalan: "Jl. Situ Aksan, RT 04 RW 09",
        kelurahan: "Cibuntu",
        kecamatan: "Bandung Kulon",
        koordinat: "-6.91744, 107.57388",
        skor: 0.79,
        foto: { nama: "tidak ada lampiran", ukuran: "-", gps: "-", selisih: null },
        pelapor: {
          nama: "Hendra S.",
          namaPenuh: "Hendra Saputra",
          wa: "+62 878-••••-6543",
          waPenuh: "+62 878-3391-6543",
        },
        riwayat: [["Perlu verifikasi", "Bot meminta foto, warga belum mengirim", "16 Sep 09:12"]],
      },
      {
        tiket: "TKT-260913-0311",
        tambahan: [
          {
            siapa: "Bot",
            peran: "bot",
            ikon: "kirim",
            jam: "09:22",
            teks: "Kabar status dikirim ke pelapor: Laporan Anda sedang ditangani Regu angkut TPS wilayah barat dari Dinas Lingkungan Hidup dan Kebersihan. Jadwal turun lapangan 17 Sep 2026, 05.30. Kami kabari lagi begitu pekerjaannya selesai.",
          },
        ],
        kabar: [
          {
            status: "proses",
            teks:
              "Laporan Anda sedang ditangani Regu angkut TPS wilayah barat dari Dinas Lingkungan Hidup dan Kebersihan. Jadwal turun lapangan 17 Sep 2026, 05.30. Kami kabari lagi begitu pekerjaannya selesai.",
            waktu: "16 Sep 09:22",
            penerima: 1,
          },
        ],
        penanganan: {
          petugas: "PTG-23",
          jadwal: "17 Sep 2026, 05.30",
          catatan:
            "Butuh dua rit karena TPS sudah meluber ke bahu jalan. Koordinasi dulu dengan petugas pasar supaya lapak pagi tidak terhalang truk.",
          bukti: [
            {
              nama: "IMG-20260916-0918-tps.jpg",
              ukuran: "2,2 MB",
              jam: "09:18",
              oleh: "Iwan Gunawan",
              gps: "-6.93382, 107.56914",
            },
          ],
        },
        tahap: 2,
        sisa: 1,
        ts: 2609131628,
        tgl: "13 Sep 2026",
        jam: "16:28",
        kanal: "WhatsApp bot",
        ringkas: "Bak sampah rusak sehingga sampah berserakan saat hujan",
        mentah: "bak sampahnya jebol, tiap hujan sampah kebawa air ke selokan",
        jalan: "Jl. Caringin, TPS pasar induk",
        kelurahan: "Babakan Ciparay",
        kecamatan: "Babakan Ciparay",
        koordinat: "-6.94820, 107.57611",
        skor: 0.9,
        foto: {
          nama: "IMG-20260913-162755.jpg",
          ukuran: "2,6 MB",
          gps: "-6.94818, 107.57608",
          selisih: null,
        },
        pelapor: {
          nama: "Asep K.",
          namaPenuh: "Asep Kurniawan",
          wa: "+62 821-••••-5512",
          waPenuh: "+62 821-4490-5512",
        },
        riwayat: [
          ["Ditindaklanjuti", "Penggantian bak dijadwalkan pekan ini", "15 Sep 09:15"],
          ["Diteruskan", "Disposisi ke UPT Kebersihan Wilayah Barat", "14 Sep 08:40"],
          ["Perlu verifikasi", "Masuk lewat bot", "13 Sep 16:28"],
        ],
      },
    ],
  },
  {
    id: "KLS-0052",
    kategori: "Lampu penerangan jalan mati",
    jenis: "keamanan",
    wilayah: "Coblong, Cidadap",
    instansi: "Dinas Perhubungan",
    ambang: 0.8,
    lapor: [
      {
        tiket: "TKT-260915-0402",
        tahap: 1,
        sisa: 3,
        ts: 2609152108,
        tgl: "15 Sep 2026",
        jam: "21:08",
        kanal: "WhatsApp bot",
        ringkas: "Enam titik lampu padam di sepanjang tanjakan",
        mentah: "lampu jalan dago atas mati semua dari simpang sampe atas, gelap parah rawan",
        jalan: "Jl. Ir. H. Juanda atas, enam tiang antara simpang dan tikungan",
        kelurahan: "Dago",
        kecamatan: "Coblong",
        koordinat: "-6.86340, 107.61552",
        skor: 0.86,
        foto: {
          nama: "IMG-20260915-210812.jpg",
          ukuran: "1,2 MB",
          gps: "-6.86338, 107.61549",
          selisih: null,
        },
        pelapor: {
          nama: "Maya A.",
          namaPenuh: "Maya Anggraeni",
          wa: "+62 812-••••-8830",
          waPenuh: "+62 812-4417-8830",
        },
        riwayat: [
          ["Diteruskan", "Disposisi ke UPT Penerangan Jalan Umum", "16 Sep 07:55"],
          ["Perlu verifikasi", "Masuk lewat bot", "15 Sep 21:08"],
        ],
      },
      {
        tiket: "TKT-260914-0333",
        tahap: 1,
        sisa: 2,
        ts: 2609142216,
        tgl: "14 Sep 2026",
        jam: "22:16",
        kanal: "WhatsApp bot",
        ringkas: "Lampu berkedip lalu padam di dua tiang dekat jembatan",
        mentah: "lampu deket jembatan kedap kedip terus mati, udah seminggu begitu",
        jalan: "Jl. Siliwangi, dua tiang dekat jembatan",
        kelurahan: "Lebak Siliwangi",
        kecamatan: "Coblong",
        koordinat: "-6.88712, 107.60894",
        skor: 0.83,
        foto: {
          nama: "IMG-20260914-221540.jpg",
          ukuran: "890 KB",
          gps: "-6.88710, 107.60890",
          selisih: null,
        },
        pelapor: {
          nama: "Fajar H.",
          namaPenuh: "Fajar Hidayat",
          wa: "+62 856-••••-7724",
          waPenuh: "+62 856-1187-7724",
        },
        riwayat: [
          ["Diteruskan", "Disposisi ke UPT Penerangan Jalan Umum", "15 Sep 08:30"],
          ["Perlu verifikasi", "Masuk lewat bot", "14 Sep 22:16"],
        ],
      },
      {
        tiket: "TKT-260912-0244",
        tahap: 0,
        sisa: -1,
        ts: 2609122003,
        tgl: "12 Sep 2026",
        jam: "20:03",
        kanal: "Web",
        ringkas: "Tiang lampu miring dan kabel menjuntai ke trotoar",
        mentah: "tiang lampu miring, kabelnya ngegantung rendah banget di trotoar, bahaya kesetrum",
        jalan: "Jl. Ciumbuleuit, dekat pertigaan",
        kelurahan: "Hegarmanah",
        kecamatan: "Cidadap",
        koordinat: "-6.87205, 107.60310",
        skor: 0.74,
        foto: {
          nama: "unggahan-web-4377.jpg",
          ukuran: "1,4 MB",
          gps: "tidak ada EXIF",
          selisih: null,
        },
        pelapor: {
          nama: "Lina S.",
          namaPenuh: "Lina Suryani",
          wa: "+62 813-••••-9902",
          waPenuh: "+62 813-6650-9902",
        },
        riwayat: [
          ["Perlu verifikasi", "Batas tindak lanjut 5 hari kerja terlampaui 1 hari", "12 Sep 20:03"],
        ],
      },
    ],
  },
  {
    id: "KLS-0058",
    kategori: "Saluran tersumbat dan genangan",
    jenis: "infrastruktur",
    wilayah: "Kiaracondong, Batununggal",
    instansi: "Dinas Pekerjaan Umum",
    ambang: 0.82,
    lapor: [
      {
        tiket: "TKT-260916-0431",
        draf:
          "Laporan genangan di ruas ini sudah kami terima dan dijadwalkan untuk pengecekan drainase.",
        tahap: 1,
        sisa: 4,
        ts: 2609160726,
        tgl: "16 Sep 2026",
        jam: "07:26",
        kanal: "WhatsApp bot",
        ringkas: "Genangan setinggi mata kaki bertahan lebih dari sehari",
        mentah:
          "got depan komplek mampet, air naik sampe mata kaki tiap hujan, udah sehari belum surut",
        jalan: "Jl. Ibrahim Adjie, depan gang komplek",
        kelurahan: "Babakan Surabaya",
        kecamatan: "Kiaracondong",
        koordinat: "-6.92210, 107.64418",
        skor: 0.85,
        foto: {
          nama: "IMG-20260916-072558.jpg",
          ukuran: "2,4 MB",
          gps: "-6.92208, 107.64420",
          selisih: null,
        },
        pelapor: {
          nama: "Teguh W.",
          namaPenuh: "Teguh Wibowo",
          wa: "+62 856-••••-3312",
          waPenuh: "+62 856-7028-3312",
        },
        riwayat: [
          ["Diteruskan", "Disposisi ke Bidang Sumber Daya Air", "16 Sep 09:40"],
          ["Perlu verifikasi", "Masuk lewat bot", "16 Sep 07:26"],
        ],
      },
      {
        tiket: "TKT-260914-0296",
        tambahan: [
          {
            siapa: "Bot",
            peran: "bot",
            ikon: "kirim",
            jam: "10:04",
            teks: "Kabar status dikirim ke pelapor: Laporan Anda sedang ditangani Regu drainase Kiaracondong dari Dinas Pekerjaan Umum. Jadwal turun lapangan 18 Sep 2026, 08.00. Kami kabari lagi begitu pekerjaannya selesai.",
          },
        ],
        kabar: [
          {
            status: "proses",
            teks:
              "Laporan Anda sedang ditangani Regu drainase Kiaracondong dari Dinas Pekerjaan Umum. Jadwal turun lapangan 18 Sep 2026, 08.00. Kami kabari lagi begitu pekerjaannya selesai.",
            waktu: "16 Sep 10:04",
            penerima: 1,
          },
        ],
        penanganan: {
          petugas: "PTG-41",
          jadwal: "18 Sep 2026, 08.00",
          catatan:
            "Perlu mesin sedot lumpur, gorong-gorong tersumbat sampai kedalaman 60 cm. Belum ada dokumentasi lapangan yang masuk.",
          bukti: [],
        },
        tahap: 2,
        sisa: 0,
        ts: 2609141510,
        tgl: "14 Sep 2026",
        jam: "15:10",
        kanal: "WhatsApp bot",
        ringkas: "Mulut gorong-gorong tertutup endapan dan sampah",
        mentah: "gorong gorong ketutup lumpur sama sampah, kalo hujan air balik ke jalan",
        jalan: "Jl. Gatot Subroto, mulut gorong-gorong sisi utara",
        kelurahan: "Kacapiring",
        kecamatan: "Batununggal",
        koordinat: "-6.92044, 107.63091",
        skor: 0.87,
        foto: {
          nama: "IMG-20260914-150932.jpg",
          ukuran: "2,2 MB",
          gps: "-6.92041, 107.63088",
          selisih: null,
        },
        pelapor: {
          nama: "Rina O.",
          namaPenuh: "Rina Oktaviani",
          wa: "+62 878-••••-1188",
          waPenuh: "+62 878-5502-1188",
        },
        riwayat: [
          ["Ditindaklanjuti", "Regu pengerukan dijadwalkan 17 Sep", "16 Sep 10:25"],
          ["Diteruskan", "Disposisi ke Bidang Sumber Daya Air", "15 Sep 08:05"],
          ["Perlu verifikasi", "Masuk lewat bot", "14 Sep 15:10"],
        ],
      },
    ],
  },
  {
    id: "KLS-0063",
    kategori: "Parkir liar di badan jalan",
    jenis: "keamanan",
    wilayah: "Andir, Cicendo",
    instansi: "Satuan Polisi Pamong Praja",
    ambang: 0.78,
    lapor: [
      {
        tiket: "TKT-260915-0371",
        tahap: 0,
        sisa: 1,
        ts: 2609151655,
        tgl: "15 Sep 2026",
        jam: "16:55",
        kanal: "Web",
        ringkas: "Mobil parkir dua lajur di depan pertokoan pada jam sibuk",
        mentah: "tiap sore mobil parkir dua baris depan ruko, jalan tinggal separo, macet sampe simpang",
        jalan: "Jl. Kebon Jati, depan deretan pertokoan",
        kelurahan: "Kebon Jeruk",
        kecamatan: "Andir",
        koordinat: "-6.91480, 107.60021",
        skor: 0.76,
        foto: {
          nama: "unggahan-web-4390.jpg",
          ukuran: "1,1 MB",
          gps: "tidak ada EXIF",
          selisih: null,
        },
        pelapor: {
          nama: "Ika F.",
          namaPenuh: "Ika Fitriani",
          wa: "+62 819-••••-4408",
          waPenuh: "+62 819-5523-4408",
        },
        riwayat: [
          [
            "Perlu verifikasi",
            "Skor klasifikasi di bawah ambang klaster, perlu penilaian petugas",
            "15 Sep 16:55",
          ],
        ],
      },
      {
        tiket: "TKT-260913-0278",
        tahap: 1,
        sisa: 2,
        ts: 2609131822,
        tgl: "13 Sep 2026",
        jam: "18:22",
        kanal: "WhatsApp bot",
        ringkas: "Juru parkir memungut tarif di ruas larangan parkir",
        mentah: "ada jukir narik parkir padahal ada rambu dilarang parkir, tiap hari begitu",
        jalan: "Jl. Pajajaran, sisi selatan dekat rambu larangan",
        kelurahan: "Pasir Kaliki",
        kecamatan: "Cicendo",
        koordinat: "-6.90312, 107.59544",
        skor: 0.81,
        foto: {
          nama: "IMG-20260913-182102.jpg",
          ukuran: "1,5 MB",
          gps: "-6.90310, 107.59541",
          selisih: null,
        },
        pelapor: {
          nama: "Gilang R.",
          namaPenuh: "Gilang Ramadhan",
          wa: "+62 852-••••-3340",
          waPenuh: "+62 852-7719-3340",
        },
        riwayat: [
          ["Diteruskan", "Disposisi ke Bidang Penegakan Perda dan Dishub", "14 Sep 09:12"],
          ["Perlu verifikasi", "Masuk lewat bot", "13 Sep 18:22"],
        ],
      },
    ],
  },
  {
    id: "KLS-0067",
    kategori: "Pohon tumbang dan dahan rawan",
    jenis: "lingkungan",
    wilayah: "Antapani, Arcamanik",
    instansi: "DPKP3",
    ambang: 0.86,
    lapor: [
      {
        tiket: "TKT-260914-0288",
        kabar: [
          {
            status: "selesai",
            teks:
              "Laporan Anda sudah selesai ditangani Regu pangkas pohon 1 dari DPKP3, dengan 2 bukti dokumentasi dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru.",
            waktu: "15 Sep 09:48",
            penerima: 1,
          },
        ],
        tambahan: [
          {
            siapa: "Bot",
            peran: "bot",
            ikon: "kirim",
            jam: "09:48",
            teks: "Kabar status dikirim ke pelapor: Laporan Anda sudah selesai ditangani Regu pangkas pohon 1 dari DPKP3, dengan 2 bukti dokumentasi dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru.",
          },
          {
            siapa: "Warga",
            peran: "warga",
            ikon: "warga",
            jam: "16:20",
            teks: "Membalas kabar penyelesaian.",
            mentah: "sudah bersih. pohon sebelahnya miring juga, perlu dilaporkan terpisah ga?",
          },
        ],
        penanganan: {
          petugas: "PTG-48",
          jadwal: "15 Sep 2026, 06.00",
          catatan: "Dahan rawan dipangkas sampai batas aman kabel PLN, sisa potongan diangkut hari yang sama.",
          bukti: [
            {
              nama: "IMG-20260915-0612-dahan.jpg",
              ukuran: "2,4 MB",
              jam: "06:12",
              oleh: "Heru Purnomo",
              gps: "-6.91549, 107.68118",
            },
            {
              nama: "IMG-20260915-0940-bersih.jpg",
              ukuran: "2,1 MB",
              jam: "09:40",
              oleh: "Heru Purnomo",
              gps: "-6.91547, 107.68120",
            },
          ],
        },
        umpan: [
          {
            teks:
              "Dahan yang menggantung di atas jalur pejalan kaki sudah dipangkas regu DPKP3 pada 15 September, potongan juga sudah diangkut. Pohon induknya kami masukkan ke jadwal pemeriksaan rutin triwulan berikutnya.",
            oleh: "Admin DPKP3",
            waktu: "15 Sep 15:05",
            penerima: 2,
          },
        ],
        tahap: 3,
        sisa: null,
        ts: 2609141812,
        tgl: "14 Sep 2026",
        jam: "18:12",
        kanal: "WhatsApp bot",
        ringkas: "Dahan besar menimpa trotoar, sudah dipangkas petugas",
        mentah: "dahan gede patah nutupin trotoar depan taman, orang jalan mesti turun ke jalan",
        jalan: "Jl. Terusan Jakarta, trotoar sisi taman",
        kelurahan: "Antapani Kidul",
        kecamatan: "Antapani",
        koordinat: "-6.91027, 107.65880",
        skor: 0.93,
        foto: {
          nama: "IMG-20260914-181204.jpg",
          ukuran: "2,8 MB",
          gps: "-6.91025, 107.65877",
          selisih: null,
        },
        pelapor: {
          nama: "Nurul H.",
          namaPenuh: "Nurul Hasanah",
          wa: "+62 852-••••-9075",
          waPenuh: "+62 852-1164-9075",
        },
        riwayat: [
          ["Selesai", "Pemangkasan selesai, trotoar dibersihkan", "15 Sep 10:20"],
          ["Ditindaklanjuti", "Regu pemangkasan diberangkatkan", "14 Sep 19:45"],
          ["Diteruskan", "Disposisi ke Bidang Pertamanan", "14 Sep 18:50"],
          ["Perlu verifikasi", "Masuk lewat bot", "14 Sep 18:12"],
        ],
      },
      {
        tiket: "TKT-260916-0468",
        tahap: 0,
        sisa: 5,
        ts: 2609161318,
        tgl: "16 Sep 2026",
        jam: "13:18",
        kanal: "WhatsApp bot",
        ringkas: "Pohon miring ke arah rumah warga setelah angin kencang",
        mentah: "pohon di pinggir jalan miring ke rumah warga abis angin kenceng kemaren, takut roboh",
        jalan: "Jl. Cisaranten Kulon, bahu jalan sisi timur",
        kelurahan: "Cisaranten Kulon",
        kecamatan: "Arcamanik",
        koordinat: "-6.91544, 107.68122",
        skor: 0.89,
        foto: {
          nama: "IMG-20260916-131705.jpg",
          ukuran: "2,5 MB",
          gps: "-6.91540, 107.68119",
          selisih: null,
        },
        pelapor: {
          nama: "Yusuf A.",
          namaPenuh: "Yusuf Abdillah",
          wa: "+62 811-••••-4408",
          waPenuh: "+62 811-7736-4408",
        },
        riwayat: [
          [
            "Perlu verifikasi",
            "Masuk lewat bot, ditandai berisiko oleh petugas piket",
            "16 Sep 13:18",
          ],
        ],
      },
    ],
  },
];
