import { Pool } from "pg";
import type { Jenis, KelompokPortal, LaporanPortal, StatusPortal, Tonggak } from "./tipe";

/**
 * Satu pool per proses. Next.js memuat ulang modul saat dev, jadi pool
 * disimpan di globalThis supaya tidak menumpuk koneksi tiap hot reload.
 */
const g = globalThis as unknown as { _mejaPool?: Pool };

function pool(): Pool | null {
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
  bukti: number;
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
         l.kelurahan, l.kecamatan, l.duplikat, l.created_at, l.foto_pelapor,
         i.nama              AS instansi,
         k.kategori          AS kategori,
         k.kode              AS klaster_kode,
         k.wilayah           AS klaster_wilayah,
         p.jadwal            AS jadwal,
         pt.nama             AS petugas_nama,
         pt.regu             AS petugas_regu,
         (SELECT count(*) FROM bukti b WHERE b.laporan_id = l.id)::int AS bukti,
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
    fotoPelapor: Boolean(r.foto_pelapor),
    bukti: r.bukti,
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
  const p = pool();
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
