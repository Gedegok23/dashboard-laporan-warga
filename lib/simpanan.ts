import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "node:crypto";
import { kolam } from "./db";
import { periksaGambar } from "./gambar";

/**
 * Penyimpanan objek. Bytes gambar tidak pernah masuk Postgres: yang disimpan
 * di sana hanya kunci dan metadata. Antarmukanya S3, jadi MinIO sekarang bisa
 * ditukar S3 atau R2 nanti tanpa mengubah kode ini.
 */
export const BUCKET = {
  pelapor: "laporan-pelapor",
  bukti: "bukti-lapangan",
} as const;

export type NamaBucket = (typeof BUCKET)[keyof typeof BUCKET];

const g = globalThis as unknown as { _mejaS3?: S3Client };

export function s3(): S3Client | null {
  if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) return null;
  g._mejaS3 ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    // MinIO memakai path-style, bukan subdomain per bucket.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  });
  return g._mejaS3;
}

export const adaSimpanan = () => Boolean(process.env.S3_ENDPOINT);

const EKSTENSI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type HasilUnggah =
  | { ok: true; berkasId: number; kunci: string }
  | { ok: false; alasan: string };

/**
 * Simpan satu gambar lalu catat metadatanya.
 *
 * Kunci objek dibuat server dari UUID, tidak pernah dari nama berkas kiriman:
 * nama kiriman bisa memuat `../`, bisa bentrok, dan bisa membocorkan isi.
 */
export async function unggahGambar(
  bucket: NamaBucket,
  laporanId: number,
  isi: Uint8Array,
  namaAsli: string | null,
): Promise<HasilUnggah> {
  const klien = s3();
  const p = kolam();
  if (!klien || !p) return { ok: false, alasan: "penyimpanan berkas belum disetel di server ini" };

  const periksa = periksaGambar(isi);
  if (!periksa.sah) return { ok: false, alasan: periksa.alasan };

  const sha = createHash("sha256").update(isi).digest("hex");
  const kunci = `${laporanId}/${randomUUID()}.${EKSTENSI[periksa.mime]}`;

  await klien.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: kunci,
      Body: isi,
      ContentType: periksa.mime,
      ContentLength: isi.length,
      ChecksumSHA256: Buffer.from(sha, "hex").toString("base64"),
    }),
  );

  const { rows } = await p.query<{ id: number }>(
    `INSERT INTO berkas (bucket, kunci, mime, ukuran, sha256, lebar, tinggi, nama_asli)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [bucket, kunci, periksa.mime, isi.length, sha, periksa.lebar, periksa.tinggi, namaAsli?.slice(0, 255) ?? null],
  );
  return { ok: true, berkasId: rows[0].id, kunci };
}

export type BerkasTersimpan = {
  id: number;
  bucket: string;
  kunci: string;
  mime: string;
  ukuran: number;
  nama_asli: string | null;
};

export async function cariBerkas(id: number): Promise<BerkasTersimpan | null> {
  const p = kolam();
  if (!p) return null;
  const { rows } = await p.query<BerkasTersimpan>(
    "SELECT id, bucket, kunci, mime, ukuran, nama_asli FROM berkas WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

/** Ambil isi objek. Dipanggil hanya setelah hak akses diperiksa pemanggil. */
export async function ambilIsi(bucket: string, kunci: string): Promise<Uint8Array | null> {
  const klien = s3();
  if (!klien) return null;
  const r = await klien.send(new GetObjectCommand({ Bucket: bucket, Key: kunci }));
  if (!r.Body) return null;
  return new Uint8Array(await r.Body.transformToByteArray());
}
