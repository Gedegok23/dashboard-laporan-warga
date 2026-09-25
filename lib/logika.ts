import { BATAS_HARI_KERJA, BUKTI_MINIMAL, PETUGAS_LAPANGAN, TAHAP, TINDAK } from "./data";
import { BULAN } from "./waktu";
import type {
  Arah,
  BarisLog,
  Klaster,
  Laporan,
  Penanganan,
  PetugasLapangan,
  Saring,
  SaringTindak,
  KelompokPortal,
  LaporanPortal,
  StatusPortal,
  StatusTindak,
  Tonggak,
  Tahap,
  Urut,
  UrutTindak,
} from "./tipe";

/** Laporan yang masih membebani antrean: belum selesai dan bukan duplikat. */
export const aktif = (l: Laporan) => !l.duplikat && l.tahap < 3;

export const lewatBatas = (l: Laporan) =>
  aktif(l) && l.sisa !== null && l.sisa < 0;

/** Tahap klaster diturunkan dari laporan aktif yang paling tertinggal. */
export function tahapKlaster(k: Klaster): Tahap {
  const hidup = k.lapor.filter(aktif);
  return hidup.length ? (Math.min(...hidup.map((l) => l.tahap)) as Tahap) : 3;
}

export const terbaruKlaster = (k: Klaster) =>
  k.lapor.length ? Math.max(...k.lapor.map((l) => l.ts)) : 0;

/** YYMMDDHHMM menjadi "16 Sep 14:02". */
/**
 * Kunci YYMMDDHHMM jadi "5 Okt 14:06". Bulannya dibaca dari kuncinya; sebelum
 * ini teksnya dipaku "Sep", jadi tiap laporan tampil seolah dibuat bulan
 * September berapa pun bulan sebenarnya.
 */
export function fmtTs(ts: number) {
  const s = String(ts).padStart(10, "0");
  const bulan = BULAN[Number(s.slice(2, 4)) - 1] ?? "";
  return `${s.slice(4, 6).replace(/^0/, "")} ${bulan} ${s.slice(6, 8)}:${s.slice(8, 10)}`;
}

export const instansiLaporan = (l: Laporan, k: Klaster) => l.instansi || k.instansi;

export function laporCocok(l: Laporan, k: Klaster, saring: Saring, kunci: string) {
  if (saring === "dup") {
    if (!l.duplikat) return false;
  } else if (saring === "lewat") {
    if (!lewatBatas(l)) return false;
  } else if (saring === "3") {
    if (l.tahap !== 3) return false;
  } else if (saring !== "semua") {
    if (!(aktif(l) && String(l.tahap) === saring)) return false;
  } else if (l.duplikat) return false;

  if (!kunci) return true;
  return [
    l.tiket,
    l.ringkas,
    l.jalan,
    l.kelurahan,
    l.kecamatan,
    l.mentah,
    k.kategori,
    k.id,
    instansiLaporan(l, k),
  ]
    .join(" ")
    .toLowerCase()
    .includes(kunci.toLowerCase());
}

export const klasterCocok = (k: Klaster, saring: Saring, kunci: string) =>
  k.lapor.some((l) => laporCocok(l, k, saring, kunci));

export function bandingKlaster(a: Klaster, b: Klaster, urut: Urut, arah: Arah) {
  const arahAngka = arah === "turun" ? -1 : 1;
  let v: number;
  if (urut === "waktu") v = terbaruKlaster(a) - terbaruKlaster(b);
  else if (urut === "tahap") v = tahapKlaster(a) - tahapKlaster(b);
  else if (urut === "instansi") v = a.instansi.localeCompare(b.instansi, "id");
  else v = a.kategori.localeCompare(b.kategori, "id");
  return v * arahAngka;
}

export const semuaLapor = (data: Klaster[]) =>
  data.flatMap((k, i) => k.lapor.map((l, j) => ({ k, l, i, j })));

export function hitungRingkas(data: Klaster[]) {
  const semua = semuaLapor(data);
  const antre = semua.filter((o) => aktif(o.l)).length;
  return {
    total: semua.length,
    antre,
    verifikasi: semua.filter((o) => aktif(o.l) && o.l.tahap === 0).length,
    diteruskan: semua.filter((o) => aktif(o.l) && o.l.tahap === 1).length,
    ditindaklanjuti: semua.filter((o) => aktif(o.l) && o.l.tahap === 2).length,
    lewat: semua.filter((o) => lewatBatas(o.l)).length,
    selesai: semua.filter((o) => o.l.tahap === 3).length,
    duplikat: semua.filter((o) => o.l.duplikat).length,
  };
}

/**
 * Beban per instansi, dihitung dari instansi yang benar-benar muncul di isi.
 *
 * Sebelumnya daftarnya dipaku sebagai konstanta contoh, jadi meja menampilkan
 * dinas dari kota lain dengan angka nol dan menyembunyikan dinas yang memang
 * memegang laporan tapi tidak ada di konstanta itu.
 */
export function bebanInstansi(data: Klaster[], daftar?: string[]) {
  const hidup = semuaLapor(data).filter((o) => aktif(o.l));
  const nama = daftar ?? [...new Set(hidup.map((o) => instansiLaporan(o.l, o.k)))].filter(Boolean);
  const beban = nama
    .map((n) => ({
      nama: n,
      n: hidup.filter((o) => instansiLaporan(o.l, o.k) === n).length,
    }))
    .sort((a, b) => b.n - a.n);
  const maks = Math.max(1, ...beban.map((b) => b.n));
  return beban.map((b) => ({ ...b, persen: Math.round((b.n / maks) * 100) }));
}

const tambahMenit = (jam: string, n: number) => {
  const [h, m] = jam.split(":").map(Number);
  const total = h * 60 + m + n;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Log bot disusun ulang dari berkas laporan: alur bot memang berskrip, yang
 * berbeda per laporan adalah input mentah, foto, dan hasil klasifikasi.
 */
export function susunLog(l: Laporan, k: Klaster): BarisLog[] {
  const baris: BarisLog[] = [
    {
      siapa: "Warga",
      peran: "warga",
      ikon: "warga",
      jam: l.jam,
      teks: `Pesan masuk lewat ${l.kanal}.`,
      mentah: l.mentah,
    },
    {
      siapa: "Bot",
      peran: "bot",
      ikon: "bot",
      jam: l.jam,
      teks: "Terima kasih, laporan Anda kami catat. Boleh kirim foto lokasinya?",
    },
  ];

  if (l.foto.nama === "tidak ada lampiran") {
    baris.push({
      siapa: "Bot",
      peran: "bot",
      ikon: "bot",
      jam: tambahMenit(l.jam, 7),
      teks: "Belum ada foto yang masuk. Laporan tetap diproses, foto bisa menyusul.",
    });
  } else {
    baris.push({
      siapa: "Warga",
      peran: "warga",
      ikon: "kamera",
      jam: tambahMenit(l.jam, 2),
      teks: `Mengirim foto ${l.foto.nama} (${l.foto.ukuran}).`,
    });
  }

  baris.push({
    siapa: "Bot",
    peran: "bot",
    ikon: "bot",
    jam: tambahMenit(l.jam, 3),
    teks: `Lokasi terbaca: ${l.jalan}, Kel. ${l.kelurahan}. Sudah benar?`,
  });
  baris.push({
    siapa: "Warga",
    peran: "warga",
    ikon: "warga",
    jam: tambahMenit(l.jam, 4),
    teks: "Konfirmasi lokasi.",
    mentah: "iya betul itu",
  });
  baris.push({
    siapa: "Bot",
    peran: "bot",
    ikon: "bot",
    jam: tambahMenit(l.jam, 5),
    teks: "Terakhir, boleh sebutkan nama dan nomor WhatsApp yang bisa kami hubungi?",
  });
  baris.push({
    siapa: "Warga",
    peran: "warga",
    ikon: "warga",
    jam: tambahMenit(l.jam, 6),
    teks: `Mengirim kontak: ${l.pelapor.nama}, ${l.pelapor.wa}.`,
  });
  baris.push({
    siapa: "Sistem",
    peran: "sistem",
    ikon: "perisai",
    jam: tambahMenit(l.jam, 6),
    teks: "Agent hanya meminta nama dan nomor WhatsApp. NIK tidak diminta dan tidak disimpan.",
  });
  baris.push({
    siapa: "Sistem",
    peran: "sistem",
    ikon: "vektor",
    jam: tambahMenit(l.jam, 7),
    teks:
      "Teks laporan diubah menjadi vektor dan disimpan di Vec.DB. Pencarian kemiripan " +
      `mengembalikan ${Math.max(0, k.lapor.length - 1)} tetangga terdekat di klaster ${k.id}.`,
  });
  baris.push({
    siapa: "Sistem",
    peran: "sistem",
    ikon: "kilau",
    jam: tambahMenit(l.jam, 7),
    teks:
      `Klasifikasi otomatis: ${k.kategori} dengan skor ${l.skor.toFixed(2)}. ` +
      (l.skor >= k.ambang
        ? `Kemiripan melewati ambang klaster ${k.ambang.toFixed(2)}, dipetakan ke ${k.id}.`
        : `Skor di bawah ambang klaster ${k.ambang.toFixed(2)}, ditandai untuk penilaian petugas.`),
  });
  baris.push({
    siapa: "Sistem",
    peran: "sistem",
    ikon: "basis-data",
    jam: tambahMenit(l.jam, 8),
    teks: `Tiket ${l.tiket} ditulis ke basis data dengan penanggung jawab awal ${k.instansi}.`,
  });
  baris.push({
    siapa: "Bot",
    peran: "bot",
    ikon: "bot",
    jam: tambahMenit(l.jam, 8),
    teks: `Nomor tiket Anda ${l.tiket}. Batas tindak lanjut instansi ${BATAS_HARI_KERJA} hari kerja.`,
  });

  return baris.concat(l.tambahan ?? []);
}

export const namaTahap = (t: Tahap) => TAHAP[t].nama;

/* ---------- meja penanganan ---------- */

const PENANGANAN_KOSONG: Penanganan = { petugas: null, jadwal: null, catatan: "", bukti: [] };

/** Berkas penanganan laporan, dengan bentuk kosong bila belum pernah ditugaskan. */
export const penangananLaporan = (l: Laporan): Penanganan => l.penanganan ?? PENANGANAN_KOSONG;

/**
 * Penanda tindakan diturunkan dari tahap laporan, bukan disimpan terpisah,
 * supaya meja triase dan meja penanganan tidak pernah punya dua kebenaran.
 */
export const statusTindak = (l: Laporan): StatusTindak =>
  l.tahap === 3 ? "selesai" : l.tahap === 2 ? "proses" : "belum";

/** Laporan yang sudah menjadi pekerjaan instansi, jadi muncul di meja penanganan. */
export const masukPenanganan = (l: Laporan) => !l.duplikat && l.tahap >= 1;

export const cariPetugas = (id: string | null) =>
  PETUGAS_LAPANGAN.find((p) => p.id === id) ?? null;

/** Versi yang memakai daftar dari database; konstanta hanya untuk mode data contoh. */
export const cariPetugasDi = (daftar: PetugasLapangan[], id: string | null) =>
  daftar.find((p) => p.id === id) ?? null;

export function petugasUntukDi(daftar: PetugasLapangan[], instansi: string) {
  return {
    cocok: daftar.filter((p) => p.instansi === instansi),
    lain: daftar.filter((p) => p.instansi !== instansi),
  };
}

/** Regu yang unitnya cocok didahulukan, regu lain tetap bisa dipinjam. */
export function petugasUntuk(instansi: string) {
  return {
    cocok: PETUGAS_LAPANGAN.filter((p) => p.instansi === instansi),
    lain: PETUGAS_LAPANGAN.filter((p) => p.instansi !== instansi),
  };
}

/** Laporan mirip yang masih dihitung di klaster yang sama, di luar laporan ini. */
export const saudaraKlaster = (k: Klaster, l: Laporan) =>
  k.lapor.filter((x) => x.tiket !== l.tiket && !x.duplikat);

/**
 * Laporan mirip yang bisa ikut kena aksi kerja. Laporan yang belum diverifikasi
 * tidak ikut ditugaskan supaya penanganan tidak mendahului triase.
 */
export const saudaraKerja = (k: Klaster, l: Laporan) =>
  saudaraKlaster(k, l).filter((x) => x.tahap >= 1);

/** Jumlah pelapor yang dihubungi agent bila umpan balik dikirim untuk seklaster. */
export const penerimaUmpan = (k: Klaster, l: Laporan, seKlaster: boolean) =>
  seKlaster ? penerimaKlaster(k, l).length + 1 : 1;

export const umpanTerakhir = (l: Laporan) => l.umpan?.[0] ?? null;

/** Laporan hanya boleh ditutup bila bukti dokumentasi sudah masuk. */
export const cukupBukti = (l: Laporan) =>
  penangananLaporan(l).bukti.length >= BUKTI_MINIMAL;

export type BarisTindak = {
  k: Klaster;
  l: Laporan;
  /** Indeks klaster dan laporan, dipakai untuk membuka panel periksa. */
  i: number;
  j: number;
  status: StatusTindak;
  petugas: PetugasLapangan | null;
  /** Banyak laporan mirip lain di klaster yang sama. */
  mirip: number;
  bukti: number;
};

function cocokTindak(b: BarisTindak, saring: SaringTindak, kunci: string) {
  if (saring === "tanpa-petugas") {
    if (b.petugas || b.status === "selesai") return false;
  } else if (saring !== "semua" && b.status !== saring) return false;

  if (!kunci) return true;
  return [
    b.l.tiket,
    b.l.ringkas,
    b.l.jalan,
    b.l.kelurahan,
    b.l.kecamatan,
    b.l.pelapor.nama,
    b.k.kategori,
    b.k.id,
    instansiLaporan(b.l, b.k),
    b.petugas?.nama ?? "",
    b.petugas?.regu ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(kunci.toLowerCase());
}

const URUTAN_TINDAK: Record<StatusTindak, number> = { belum: 0, proses: 1, selesai: 2 };

function bandingTindak(a: BarisTindak, b: BarisTindak, urut: UrutTindak) {
  if (urut === "tanggal") return a.l.ts - b.l.ts;
  if (urut === "status") return URUTAN_TINDAK[a.status] - URUTAN_TINDAK[b.status];
  if (urut === "pelapor") return a.l.pelapor.nama.localeCompare(b.l.pelapor.nama, "id");
  if (urut === "lokasi") return a.l.kelurahan.localeCompare(b.l.kelurahan, "id");
  if (urut === "petugas") {
    // Baris tanpa petugas ditaruh di ujung: itu yang paling perlu ditugaskan.
    const na = a.petugas?.nama ?? "￿";
    const nb = b.petugas?.nama ?? "￿";
    return na.localeCompare(nb, "id");
  }
  return a.k.kategori.localeCompare(b.k.kategori, "id") || a.l.ringkas.localeCompare(b.l.ringkas, "id");
}

export function barisPenanganan(
  data: Klaster[],
  saring: SaringTindak,
  kunci: string,
  urut: UrutTindak,
  arah: Arah,
): BarisTindak[] {
  const arahAngka = arah === "turun" ? -1 : 1;
  return semuaLapor(data)
    .filter((o) => masukPenanganan(o.l))
    .map(({ k, l, i, j }) => ({
      k,
      l,
      i,
      j,
      status: statusTindak(l),
      petugas: cariPetugas(penangananLaporan(l).petugas),
      mirip: saudaraKlaster(k, l).length,
      bukti: penangananLaporan(l).bukti.length,
    }))
    .filter((b) => cocokTindak(b, saring, kunci))
    .sort((a, b) => bandingTindak(a, b, urut) * arahAngka);
}

export function hitungTindak(data: Klaster[]) {
  const baris = semuaLapor(data)
    .filter((o) => masukPenanganan(o.l))
    .map((o) => ({ l: o.l, status: statusTindak(o.l), p: penangananLaporan(o.l) }));
  return {
    total: baris.length,
    belum: baris.filter((b) => b.status === "belum").length,
    proses: baris.filter((b) => b.status === "proses").length,
    selesai: baris.filter((b) => b.status === "selesai").length,
    tanpaPetugas: baris.filter((b) => !b.p.petugas && b.status !== "selesai").length,
    tanpaBukti: baris.filter((b) => b.status === "proses" && b.p.bukti.length === 0).length,
    lewat: baris.filter((b) => lewatBatas(b.l)).length,
    umpan: baris.filter((b) => (b.l.umpan?.length ?? 0) > 0).length,
  };
}

/** Beban tiap regu lapangan: laporan yang ditugaskan dan belum dinyatakan selesai. */
export function bebanPetugas(data: Klaster[]) {
  const semua = semuaLapor(data).filter((o) => masukPenanganan(o.l));
  const beban = PETUGAS_LAPANGAN.map((p) => ({
    petugas: p,
    n: semua.filter((o) => penangananLaporan(o.l).petugas === p.id && statusTindak(o.l) !== "selesai")
      .length,
  })).filter((b) => b.n > 0);
  return beban.sort((a, b) => b.n - a.n || a.petugas.nama.localeCompare(b.petugas.nama, "id"));
}

/* ---------- kabar agent dan portal ---------- */

/**
 * Semua pelapor lain di klaster, termasuk yang laporannya ditandai duplikat.
 * Duplikat tetap dihitung: orangnya melaporkan masalah yang sama, jadi berhak
 * tahu hasilnya walau tiketnya tidak dihitung di antrean kerja.
 */
export const penerimaKlaster = (k: Klaster, l: Laporan) =>
  k.lapor.filter((x) => x.tiket !== l.tiket);

/** Kalimat kabar yang disusun agent sendiri dari isi berkas penanganan. */
export function susunKabar(l: Laporan, k: Klaster, status: StatusTindak) {
  const p = penangananLaporan(l);
  const regu = cariPetugas(p.petugas);
  const instansi = instansiLaporan(l, k);

  if (status === "proses") {
    const oleh = regu ? `${regu.regu} dari ${instansi}` : instansi;
    const kapan = p.jadwal ? ` Jadwal turun lapangan ${p.jadwal}.` : "";
    return `Laporan Anda sedang ditangani ${oleh}.${kapan} Kami kabari lagi begitu pekerjaannya selesai.`;
  }
  if (status === "selesai") {
    const bukti = p.bukti.length;
    const oleh = regu ? `${regu.regu} dari ${instansi}` : instansi;
    return (
      `Laporan Anda sudah selesai ditangani ${oleh}, dengan ${bukti} bukti dokumentasi ` +
      "dari lapangan. Kalau masalahnya muncul lagi di titik yang sama, balas pesan ini dengan foto terbaru."
    );
  }
  return `Laporan Anda kembali ke antrean ${instansi} dan sedang menunggu penjadwalan regu.`;
}

export const kabarTerakhir = (l: Laporan) => l.kabar?.[0] ?? null;

/** Balasan warga yang masuk lewat agent setelah tiket terbit. */
export const balasanWarga = (l: Laporan) =>
  (l.tambahan ?? []).filter((b) => b.peran === "warga");

/**
 * Portal hanya mengenal Clear atau belum. Laporan duplikat mengikuti status
 * klasternya karena masalah yang dilaporkan sama. Clear selalu berlandas bukti:
 * tahap 3 tidak bisa dicapai tanpa bukti dokumentasi lapangan.
 */
export const statusPortal = (k: Klaster, l: Laporan): StatusPortal =>
  (l.duplikat ? tahapKlaster(k) : l.tahap) === 3 ? "clear" : "belum";

export const labelTindak = (status: StatusTindak) => TINDAK[status].nama;

/**
 * Perjalanan laporan dalam kata yang dipakai warga, bukan istilah disposisi
 * internal. Tonggak yang belum tercapai tetap dikembalikan supaya portal bisa
 * menunjukkan sisa langkahnya. Laporan duplikat mengikuti tahap klasternya.
 */
export function perjalanan(k: Klaster, l: Laporan): Tonggak[] {
  const tahap = l.duplikat ? tahapKlaster(k) : l.tahap;
  const p = penangananLaporan(l);
  const regu = cariPetugas(p.petugas);
  const kapan = (judul: string) => l.riwayat.find((r) => r[0] === judul)?.[2] ?? null;

  return [
    {
      nama: "Laporan masuk",
      ket: `Diterima lewat ${l.kanal}`,
      waktu: `${l.tgl.slice(0, 6)} ${l.jam}`,
      tercapai: true,
    },
    {
      nama: "Diteruskan ke instansi",
      ket: instansiLaporan(l, k),
      waktu: kapan(TAHAP[1].nama),
      tercapai: tahap >= 1,
    },
    {
      nama: "Ditangani di lapangan",
      ket: regu
        ? `${regu.regu}${p.jadwal ? `, dijadwalkan ${p.jadwal}` : ""}`
        : "Menunggu regu dijadwalkan",
      waktu: kapan(TAHAP[2].nama),
      tercapai: tahap >= 2,
    },
    {
      nama: "Selesai",
      ket: p.bukti.length
        ? `${p.bukti.length} bukti dokumentasi dari lapangan`
        : "Menunggu bukti penyelesaian",
      waktu: kapan(TAHAP[3].nama),
      tercapai: tahap === 3,
    },
  ];
}

/** Bulatkan koordinat ke tiga angka di belakang koma sebelum keluar ke publik. */
function kasarkan(koordinat: string): [number, number] {
  const [lat, lng] = koordinat.split(",").map((x) => Number(x.trim()));
  const bulat = (n: number) => Math.round(n * 1000) / 1000;
  return [bulat(lat), bulat(lng)];
}

/** Ubah satu laporan jadi bentuk yang aman ditampilkan di halaman publik. */
function untukPortal(k: Klaster, l: Laporan): LaporanPortal {
  const u = l.umpan?.[0] ?? null;
  const kb = kabarTerakhir(l);
  return {
    tiket: l.tiket,
    ringkas: l.ringkas,
    jalan: l.jalan,
    kelurahan: l.kelurahan,
    kecamatan: l.kecamatan,
    tgl: l.tgl,
    jam: l.jam,
    ts: l.ts,
    lalu: waktuRelatif(l.ts),
    kategori: k.kategori,
    jenis: k.jenis,
    klaster: k.id,
    instansi: instansiLaporan(l, k),
    status: statusPortal(k, l),
    duplikat: Boolean(l.duplikat),
    serupa: saudaraKlaster(k, l).length,
    titik: kasarkan(l.koordinat),
    fotoPelapor: l.foto.nama !== "tidak ada lampiran",
    // Data contoh tidak punya berkas nyata di penyimpanan objek.
    fotoBerkasId: null,
    bukti: penangananLaporan(l).bukti.length,
    buktiBerkas: [],
    kabar: kb ? { teks: kb.teks, waktu: kb.waktu } : null,
    umpan: u ? { teks: u.teks, oleh: u.oleh, waktu: u.waktu } : null,
    perjalanan: perjalanan(k, l),
  };
}

/** Seluruh isi portal, dikelompokkan menurut jenis masalah, terbaru di depan. */
export function dataPortal(data: Klaster[]): KelompokPortal[] {
  return data
    .map((k) => ({
      id: k.id,
      kategori: k.kategori,
      jenis: k.jenis,
      wilayah: k.wilayah,
      instansi: k.instansi,
      lapor: k.lapor
        .slice()
        .sort((a, b) => b.ts - a.ts)
        .map((l) => untukPortal(k, l)),
    }))
    .sort((a, b) => Math.max(...b.lapor.map((l) => l.ts)) - Math.max(...a.lapor.map((l) => l.ts)));
}

export function hitungPortal(data: Klaster[]) {
  const semua = semuaLapor(data);
  const clear = semua.filter((o) => statusPortal(o.k, o.l) === "clear").length;
  return {
    total: semua.length,
    clear,
    belum: semua.length - clear,
    lewat: semua.filter((o) => lewatBatas(o.l)).length,
    jenis: new Set(data.map((k) => k.jenis)).size,
  };
}

/** Pencarian portal hanya menyentuh kolom yang memang tampil di halaman publik. */
export const cocokPortal = (l: LaporanPortal, kunci: string) =>
  !kunci ||
  [l.tiket, l.ringkas, l.jalan, l.kelurahan, l.kecamatan, l.kategori, l.klaster, l.instansi]
    .join(" ")
    .toLowerCase()
    .includes(kunci.toLowerCase());

/**
 * Jarak waktu dari jam meja ke tanggal laporan, ditulis seperti orang bicara.
 * Titik acuannya jam meja yang tetap, bukan jam peramban, supaya render server
 * dan klien menghasilkan teks yang sama.
 */
export function waktuRelatif(ts: number, acuan = 2609161406) {
    const hari = (n: number) => {
      const s = String(n);
      return Date.UTC(2000 + +s.slice(0, 2), +s.slice(2, 4) - 1, +s.slice(4, 6));
    };
    const selisih = Math.round((hari(acuan) - hari(ts)) / 86_400_000);
    if (selisih <= 0) return "hari ini";
    if (selisih === 1) return "kemarin";
    if (selisih < 7) return `${selisih} hari lalu`;
    if (selisih < 14) return "seminggu lalu";
    return `${Math.floor(selisih / 7)} minggu lalu`;
}

/** Ringkasan kinerja tiap instansi, dihitung dari berkas laporan yang ada. */
export function scorecardInstansi(data: Klaster[]) {
  const semua = semuaLapor(data).filter((o) => !o.l.duplikat);
  const nama = [...new Set(semua.map((o) => instansiLaporan(o.l, o.k)))];
  return nama
    .map((n) => {
      const milik = semua.filter((o) => instansiLaporan(o.l, o.k) === n);
      const selesai = milik.filter((o) => o.l.tahap === 3).length;
      const berjalan = milik.filter((o) => o.l.tahap > 0 && o.l.tahap < 3).length;
      const antre = milik.filter((o) => o.l.tahap === 0).length;
      const lewat = milik.filter((o) => lewatBatas(o.l)).length;
      return {
        nama: n,
        total: milik.length,
        selesai,
        berjalan,
        antre,
        lewat,
        persen: milik.length ? Math.round((selesai / milik.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama, "id"));
}

/** Sebaran laporan menurut jenis masalah, untuk halaman tren. */
export function sebaranJenis(data: Klaster[]) {
  const semua = semuaLapor(data).filter((o) => !o.l.duplikat);
  const per = new Map<string, { total: number; selesai: number }>();
  for (const o of semua) {
    const j = o.k.jenis;
    const b = per.get(j) ?? { total: 0, selesai: 0 };
    b.total += 1;
    if (o.l.tahap === 3) b.selesai += 1;
    per.set(j, b);
  }
  return [...per.entries()]
    .map(([jenis, b]) => ({ jenis, ...b }))
    .sort((a, b) => b.total - a.total);
}

/** Cari satu laporan dari nomor tiket, untuk halaman cek status. */
export function cariTiket(data: Klaster[], tiket: string) {
  const bersih = tiket.trim().toUpperCase();
  if (!bersih) return null;
  const ketemu = semuaLapor(data).find((o) => o.l.tiket.toUpperCase() === bersih);
  return ketemu ? untukPortal(ketemu.k, ketemu.l) : null;
}
