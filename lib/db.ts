import { Pool } from "pg";
import type { Jenis, KelompokPortal, LaporanPortal, StatusPortal, Tonggak } from "./tipe";

/**
 * Satu pool per proses. Next.js memuat ulang modul saat dev, jadi pool
 * disimpan di globalThis supaya tidak menumpuk koneksi tiap hot reload.
 */
const g = globalThis as unknown as { _mejaPool?: Pool };

export function kolam(): Pool | null {
  if (!process.env.MEJA_DATABASE_URL) return null;
  g._mejaPool ??= new Pool({ connectionString: process.env.MEJA_DATABASE_URL, max: 4 });
  return g._mejaPool;
}

/** Portal dan dashboard jalan dari data contoh bila database belum disetel. */
export const pakaiDatabase = () => Boolean(process.env.MEJA_DATABASE_URL);

/**
 * Tahap 0-3 diturunkan dari kolom `status` milik agent, yang tetap jadi satu
 * sumber kebenaran. Agent menulis 'Menunggu'; sisanya ditulis dashboard.
 */
const TAHAP_DARI_STATUS: Record<string, number> = {
  Menunggu: 0,
  "Perlu verifikasi": 0,
  Diverifikasi: 1,
  Diteruskan: 1,
  Ditugaskan: 1,
  Ditindaklanjuti: 2,
  Diproses: 2,
  Selesai: 3,
};

export const tahapDari = (status: string) => TAHAP_DARI_STATUS[status] ?? 0;

type BarisDb = {
  id: number;
  kode_lacak: string;
  judul: string;
  deskripsi: string;
  status: string;
  jenis: string | null;
  lokasi: string | null;
  kelurahan: string | null;
  kecamatan: string | null;
  duplikat: boolean | null;
  created_at: Date;
  instansi: string | null;
  kategori: string | null;
  klaster_kode: string | null;
  klaster_wilayah: string | null;
  foto_pelapor: string | null;
  foto_berkas_id: number | null;
  bukti: number;
  bukti_berkas: number[] | null;
  petugas_nama: string | null;
  petugas_regu: string | null;
  jadwal: string | null;
  umpan_teks: string | null;
  umpan_oleh: string | null;
  umpan_waktu: Date | null;
  kabar_teks: string | null;
  kabar_waktu: Date | null;
  riwayat: { status_baru: string; catatan: string | null; created_at: string }[] | null;
};

const SQL = `
  SELECT l.id, l.kode_lacak, l.judul, l.deskripsi, l.status, l.jenis, l.lokasi,
         l.kelurahan, l.kecamatan, l.duplikat, l.created_at, l.foto_pelapor, l.foto_berkas_id,
         i.nama              AS instansi,
         k.kategori          AS kategori,
         k.kode              AS klaster_kode,
         k.wilayah           AS klaster_wilayah,
         p.jadwal            AS jadwal,
         pt.nama             AS petugas_nama,
         pt.regu             AS petugas_regu,
         (SELECT count(*) FROM bukti b WHERE b.laporan_id = l.id)::int AS bukti,
         (SELECT array_agg(b.berkas_id ORDER BY b.diunggah_at)
            FROM bukti b WHERE b.laporan_id = l.id AND b.berkas_id IS NOT NULL) AS bukti_berkas,
         u.teks AS umpan_teks, u.oleh AS umpan_oleh, u.created_at AS umpan_waktu,
         kb.teks AS kabar_teks, kb.created_at AS kabar_waktu,
         (SELECT json_agg(json_build_object(
                    'status_baru', s.status_baru,
                    'catatan',     s.catatan,
                    'created_at',  s.created_at)
                  ORDER BY s.created_at)
            FROM status_log s WHERE s.laporan_id = l.id) AS riwayat
    FROM laporan l
    LEFT JOIN instansi          i  ON i.id  = l.instansi_id
    LEFT JOIN klaster           k  ON k.id  = l.klaster_id
    LEFT JOIN penanganan        p  ON p.laporan_id = l.id
    LEFT JOIN petugas_lapangan  pt ON pt.id = p.petugas_id
    LEFT JOIN LATERAL (SELECT teks, oleh, created_at FROM umpan
                        WHERE laporan_id = l.id ORDER BY created_at DESC LIMIT 1) u ON true
    LEFT JOIN LATERAL (SELECT teks, created_at FROM kabar
                        WHERE laporan_id = l.id ORDER BY created_at DESC LIMIT 1) kb ON true
   WHERE l.is_public
   ORDER BY l.created_at DESC
`;

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const tgl = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
const jam = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const pendek = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${jam(d)}`;

function lalu(d: Date, kini = Date.now()) {
  const hari = Math.floor((kini - d.getTime()) / 86_400_000);
  if (hari <= 0) return "hari ini";
  if (hari === 1) return "kemarin";
  if (hari < 7) return `${hari} hari lalu`;
  if (hari < 14) return "seminggu lalu";
  return `${Math.floor(hari / 7)} minggu lalu`;
}

/** Perjalanan laporan dalam bahasa warga, disusun dari status_log. */
function perjalananDb(r: BarisDb): Tonggak[] {
  const tahap = tahapDari(r.status);
  const kapan = (min: number) => {
    const c = (r.riwayat ?? []).find((x) => tahapDari(x.status_baru) === min);
    return c ? pendek(new Date(c.created_at)) : null;
  };
  return [
    { nama: "Laporan masuk", ket: "Diterima lewat bot Telegram", waktu: pendek(r.created_at), tercapai: true },
    { nama: "Diteruskan ke instansi", ket: r.instansi ?? "Menunggu penetapan instansi", waktu: kapan(1), tercapai: tahap >= 1 },
    {
      nama: "Ditangani di lapangan",
      ket: r.petugas_regu
        ? `${r.petugas_regu}${r.jadwal ? `, dijadwalkan ${r.jadwal}` : ""}`
        : "Menunggu regu dijadwalkan",
      waktu: kapan(2),
      tercapai: tahap >= 2,
    },
    {
      nama: "Selesai",
      ket: r.bukti ? `${r.bukti} bukti dokumentasi dari lapangan` : "Menunggu bukti penyelesaian",
      waktu: kapan(3),
      tercapai: tahap === 3,
    },
  ];
}

const JENIS_SAH: Jenis[] = ["infrastruktur", "lingkungan", "keamanan", "kesehatan", "sosial", "lainnya"];
const jenisDari = (v: string | null): Jenis =>
  JENIS_SAH.includes(v as Jenis) ? (v as Jenis) : "lainnya";

function keLaporanPortal(r: BarisDb, serupa: number): LaporanPortal {
  const tahap = tahapDari(r.status);
  const status: StatusPortal = tahap === 3 ? "clear" : "belum";
  const lok = r.lokasi ?? r.deskripsi.split("Lokasi:").pop()?.trim() ?? "";
  return {
    tiket: r.kode_lacak,
    ringkas: r.judul,
    jalan: lok || "Lokasi menyusul",
    kelurahan: r.kelurahan ?? "-",
    kecamatan: r.kecamatan ?? "-",
    tgl: tgl(r.created_at),
    jam: jam(r.created_at),
    ts: r.created_at.getTime(),
    lalu: lalu(r.created_at),
    kategori: r.kategori ?? "Laporan warga",
    jenis: jenisDari(r.jenis),
    klaster: r.klaster_kode ?? "-",
    instansi: r.instansi ?? "Belum ditetapkan",
    status,
    duplikat: Boolean(r.duplikat),
    serupa,
    titik: [0, 0],
    fotoPelapor: Boolean(r.foto_pelapor || r.foto_berkas_id),
    fotoBerkasId: r.foto_berkas_id,
    bukti: r.bukti,
    buktiBerkas: r.bukti_berkas ?? [],
    kabar: r.kabar_teks ? { teks: r.kabar_teks, waktu: pendek(r.kabar_waktu!) } : null,
    umpan: r.umpan_teks
      ? { teks: r.umpan_teks, oleh: r.umpan_oleh ?? "Instansi", waktu: pendek(r.umpan_waktu!) }
      : null,
    perjalanan: perjalananDb(r),
  };
}

/**
 * Isi portal dari database. Laporan yang belum punya klaster dikelompokkan
 * menurut jenis masalahnya, supaya halaman tetap punya struktur sebelum
 * pengelompokan kemiripan dikerjakan agent.
 */
export async function dataPortalDb(): Promise<KelompokPortal[] | null> {
  const p = kolam();
  if (!p) return null;
  const { rows } = await p.query<BarisDb>(SQL);

  const kunci = (r: BarisDb) => r.klaster_kode ?? `jenis:${jenisDari(r.jenis)}`;
  const hitung = new Map<string, number>();
  for (const r of rows) hitung.set(kunci(r), (hitung.get(kunci(r)) ?? 0) + 1);

  const grup = new Map<string, KelompokPortal>();
  for (const r of rows) {
    const k = kunci(r);
    const j = jenisDari(r.jenis);
    if (!grup.has(k)) {
      grup.set(k, {
        id: r.klaster_kode ?? k,
        kategori: r.kategori ?? LABEL_JENIS[j],
        jenis: j,
        wilayah: r.klaster_wilayah ?? r.kecamatan ?? "Kota Palembang",
        instansi: r.instansi ?? "Belum ditetapkan",
        lapor: [],
      });
    }
    grup.get(k)!.lapor.push(keLaporanPortal(r, (hitung.get(k) ?? 1) - 1));
  }
  return [...grup.values()];
}

const LABEL_JENIS: Record<Jenis, string> = {
  infrastruktur: "Infrastruktur dan jalan",
  lingkungan: "Lingkungan dan kebersihan",
  keamanan: "Keamanan dan ketertiban",
  kesehatan: "Kesehatan",
  sosial: "Sosial",
  lainnya: "Laporan lain",
};

/* ---------- pembacaan untuk dashboard instansi ---------- */

import type { BarisLog, Bukti, Klaster, Laporan, Riwayat, Tahap } from "./tipe";

type BarisMeja = BarisDb & {
  laporan_id: number;
  deskripsi: string;
  latitude: string | null;
  longitude: string | null;
  skor: string | null;
  urgensi: string | null;
  sla_hari: number | null;
  instansi_id: number | null;
  klaster_id: number | null;
  klaster_kategori: string | null;
  klaster_jenis: string | null;
  klaster_ambang: string | null;
  petugas_kode: string | null;
  catatan: string | null;
  telegram_user: string | null;
  bukti_rinci: { nama: string; ukuran: string | null; gps: string | null; oleh: string | null; diunggah_at: string; berkas_id: number | null }[] | null;
  umpan_semua: { teks: string; oleh: string; penerima: number; created_at: string }[] | null;
  kabar_semua: { teks: string; status: string; penerima: number; created_at: string }[] | null;
};

const SQL_MEJA = `
  SELECT l.id AS laporan_id, l.kode_lacak, l.judul, l.deskripsi, l.status, l.jenis,
         l.lokasi, l.kelurahan, l.kecamatan, l.duplikat, l.created_at, l.foto_pelapor,
         l.latitude, l.longitude, l.skor, l.urgensi, l.instansi_id, l.klaster_id, l.foto_berkas_id,
         l.telegram_user,
         i.nama AS instansi, i.sla_hari,
         k.kategori AS klaster_kategori, k.kode AS klaster_kode, k.jenis AS klaster_jenis,
         k.wilayah AS klaster_wilayah, k.ambang AS klaster_ambang,
         p.jadwal, p.catatan,
         pt.nama AS petugas_nama, pt.regu AS petugas_regu, pt.kode AS petugas_kode,
         (SELECT count(*) FROM bukti b WHERE b.laporan_id = l.id)::int AS bukti,
         (SELECT json_agg(json_build_object('nama',b.nama,'ukuran',b.ukuran,'gps',b.gps,
                   'oleh',b.oleh,'diunggah_at',b.diunggah_at,'berkas_id',b.berkas_id)
                 ORDER BY b.diunggah_at)
            FROM bukti b WHERE b.laporan_id = l.id) AS bukti_rinci,
         (SELECT json_agg(json_build_object('teks',u.teks,'oleh',u.oleh,'penerima',u.penerima,
                   'created_at',u.created_at) ORDER BY u.created_at DESC)
            FROM umpan u WHERE u.laporan_id = l.id) AS umpan_semua,
         (SELECT json_agg(json_build_object('teks',kb.teks,'status',kb.status,'penerima',kb.penerima,
                   'created_at',kb.created_at) ORDER BY kb.created_at DESC)
            FROM kabar kb WHERE kb.laporan_id = l.id) AS kabar_semua,
         (SELECT json_agg(json_build_object('status_baru',s.status_baru,'catatan',s.catatan,
                   'created_at',s.created_at) ORDER BY s.created_at DESC)
            FROM status_log s WHERE s.laporan_id = l.id) AS riwayat,
         NULL::text AS umpan_teks, NULL::text AS umpan_oleh, NULL::timestamp AS umpan_waktu,
         NULL::text AS kabar_teks, NULL::timestamp AS kabar_waktu
    FROM laporan l
    LEFT JOIN instansi i ON i.id = l.instansi_id
    LEFT JOIN klaster  k ON k.id = l.klaster_id
    LEFT JOIN penanganan p ON p.laporan_id = l.id
    LEFT JOIN petugas_lapangan pt ON pt.id = p.petugas_id
   WHERE l.is_public
   ORDER BY l.created_at DESC
`;

const dua = (n: number) => String(n).padStart(2, "0");
/** YYMMDDHHMM, format urut yang dipakai seluruh aplikasi. */
const keTs = (d: Date) =>
  Number(`${dua(d.getFullYear() % 100)}${dua(d.getMonth() + 1)}${dua(d.getDate())}${dua(d.getHours())}${dua(d.getMinutes())}`);

/** Sisa hari kerja sebelum batas tindak lanjut instansi. Null bila sudah selesai. */
function sisaHari(dibuat: Date, sla: number | null, tahap: number) {
  if (tahap === 3) return null;
  const lewat = Math.floor((Date.now() - dibuat.getTime()) / 86_400_000);
  return (sla ?? 5) - lewat;
}

function keLaporanMeja(r: BarisMeja): Laporan {
  const tahap = tahapDari(r.status) as Tahap;
  const d = r.created_at;
  const bukti: Bukti[] = (r.bukti_rinci ?? []).map((b) => ({
    nama: b.nama,
    ukuran: b.ukuran ?? "-",
    jam: jam(new Date(b.diunggah_at)),
    oleh: b.oleh ?? "Petugas lapangan",
    gps: b.gps ?? "-",
    berkasId: b.berkas_id,
  }));
  const riwayat: Riwayat[] = (r.riwayat ?? []).map((s) => [
    s.status_baru,
    s.catatan ?? "",
    pendek(new Date(s.created_at)),
  ]);
  // Agent dilarang menanyakan nama dan nomor. Yang ada cuma pegangan Telegram.
  const pegangan = r.telegram_user ? `@${r.telegram_user}` : "Lewat bot Telegram";
  const tambahan: BarisLog[] = (r.kabar_semua ?? [])
    .slice()
    .reverse()
    .map((k) => ({
      siapa: "Bot",
      peran: "bot" as const,
      ikon: "kirim" as const,
      jam: jam(new Date(k.created_at)),
      teks: `Kabar status dikirim ke pelapor: ${k.teks}`,
    }));

  return {
    tiket: r.kode_lacak,
    tahap,
    sisa: sisaHari(d, r.sla_hari, tahap),
    ts: keTs(d),
    tgl: tgl(d),
    jam: jam(d),
    kanal: "bot Telegram",
    ringkas: r.judul,
    mentah: r.deskripsi,
    jalan: r.lokasi ?? r.deskripsi.split("Lokasi:").pop()?.trim() ?? "Lokasi menyusul",
    kelurahan: r.kelurahan ?? "-",
    kecamatan: r.kecamatan ?? "-",
    koordinat: r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : "belum dicatat",
    skor: r.skor ? Number(r.skor) : 0,
    foto: {
      nama: r.foto_pelapor ?? "tidak ada lampiran",
      ukuran: r.foto_pelapor ? "-" : "-",
      gps: "-",
      selisih: null,
    },
    pelapor: { nama: pegangan, namaPenuh: pegangan, wa: "tidak diminta", waPenuh: "tidak diminta agent" },
    riwayat,
    duplikat: Boolean(r.duplikat),
    // Instansi laporan diambil dari kolomnya sendiri, bukan diwarisi klaster,
    // supaya pengalihan instansi tidak hilang saat halaman dimuat ulang.
    instansi: r.instansi,
    tambahan,
    penanganan: {
      petugas: r.petugas_kode,
      jadwal: r.jadwal,
      catatan: r.catatan ?? "",
      bukti,
    },
    umpan: (r.umpan_semua ?? []).map((u) => ({
      teks: u.teks,
      oleh: u.oleh,
      waktu: pendek(new Date(u.created_at)),
      penerima: u.penerima,
    })),
    kabar: (r.kabar_semua ?? []).map((k) => ({
      status: (k.status === "Selesai" ? "selesai" : k.status === "Ditindaklanjuti" ? "proses" : "belum") as
        | "belum"
        | "proses"
        | "selesai",
      teks: k.teks,
      waktu: pendek(new Date(k.created_at)),
      penerima: k.penerima,
    })),
    draf: "",
  };
}

const LABEL_KLASTER: Record<string, string> = {
  infrastruktur: "Infrastruktur dan jalan",
  lingkungan: "Lingkungan dan kebersihan",
  keamanan: "Keamanan dan ketertiban",
  kesehatan: "Kesehatan",
  sosial: "Sosial",
  lainnya: "Laporan lain",
};

/**
 * Isi meja petugas dari database. Laporan yang belum dikelompokkan agent
 * disatukan menurut jenis masalah, supaya meja tetap punya struktur klaster.
 */
export async function dataMejaDb(): Promise<Klaster[] | null> {
  const p = kolam();
  if (!p) return null;
  const { rows } = await p.query<BarisMeja>(SQL_MEJA);

  const grup = new Map<string, Klaster>();
  for (const r of rows) {
    const j = jenisDari(r.klaster_jenis ?? r.jenis);
    const kunci = r.klaster_kode ?? `jenis:${j}`;
    if (!grup.has(kunci)) {
      grup.set(kunci, {
        id: r.klaster_kode ?? `KLS-${j.slice(0, 4).toUpperCase()}`,
        kategori: r.klaster_kategori ?? LABEL_KLASTER[j],
        jenis: j,
        wilayah: r.klaster_wilayah ?? r.kecamatan ?? "Kota Palembang",
        instansi: r.instansi ?? "Belum ditetapkan",
        ambang: r.klaster_ambang ? Number(r.klaster_ambang) : 0.85,
        sintetis: r.klaster_kode === null,
        lapor: [],
      });
    }
    grup.get(kunci)!.lapor.push(keLaporanMeja(r));
  }
  return [...grup.values()];
}

/** Laporan masuk per hari, 14 hari terakhir, untuk halaman tren. */
export async function harianDb(): Promise<[string, number][] | null> {
  const p = kolam();
  if (!p) return null;
  const { rows } = await p.query<{ hari: Date; n: string }>(
    `WITH hari AS (
       SELECT generate_series(current_date - interval '13 day', current_date, interval '1 day')::date AS d
     )
     SELECT h.d AS hari, count(l.id) AS n
       FROM hari h LEFT JOIN laporan l ON l.created_at::date = h.d
      GROUP BY h.d ORDER BY h.d`,
  );
  const NAMA = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return rows.map((r) => {
    const d = new Date(r.hari);
    return [`${NAMA[d.getDay()]} ${d.getDate()} ${BULAN[d.getMonth()]}`, Number(r.n)] as [string, number];
  });
}
