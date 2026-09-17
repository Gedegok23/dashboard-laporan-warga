"use client";

import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUUpLeft,
  ArrowUp,
  ArrowsClockwise,
  ArrowsLeftRight,
  Camera,
  CameraSlash,
  CaretRight,
  CheckCircle,
  Circle,
  CircleDashed,
  Copy,
  Database,
  Eye,
  EyeSlash,
  FileText,
  FunnelX,
  IdentificationBadge,
  Info,
  MagnifyingGlass,
  Robot,
  SealCheck,
  ShieldCheck,
  Sparkle,
  Tray,
  User,
  Warning,
  Wrench,
  X,
} from "@phosphor-icons/react";
import type { NamaIkon } from "@/lib/tipe";

/**
 * Satu keluarga ikon untuk seluruh aplikasi, satu bobot. Nama dipetakan ke peran
 * di meja kerja, bukan ke bentuk gambarnya, supaya penggantinya tetap konsisten.
 */
const PETA = {
  cari: MagnifyingGlass,
  hapus: X,
  "kotak-masuk": Tray,
  tunggu: CircleDashed,
  peringatan: Warning,
  salin: Copy,
  selesai: CheckCircle,
  lingkaran: Circle,
  teruskan: ArrowRight,
  proses: ArrowsClockwise,
  buka: CaretRight,
  turun: ArrowDown,
  naik: ArrowUp,
  kamera: Camera,
  "tanpa-kamera": CameraSlash,
  dokumen: FileText,
  bot: Robot,
  warga: User,
  kilau: Sparkle,
  "basis-data": Database,
  petugas: IdentificationBadge,
  perisai: ShieldCheck,
  lihat: Eye,
  sembunyi: EyeSlash,
  verifikasi: SealCheck,
  kerja: Wrench,
  mundur: ArrowUUpLeft,
  alih: ArrowsLeftRight,
  "saring-mati": FunnelX,
  "atur-ulang": ArrowCounterClockwise,
  info: Info,
} as const satisfies Record<NamaIkon, unknown>;

export function Ikon({ nama, ukuran = 18 }: { nama: NamaIkon; ukuran?: number }) {
  const Bentuk = PETA[nama];
  return <Bentuk className="ikon" size={ukuran} weight="regular" aria-hidden />;
}
