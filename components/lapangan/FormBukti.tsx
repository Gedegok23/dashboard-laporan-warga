"use client";

import { useRef, useState, useTransition } from "react";

import { kirimBuktiAksi } from "@/app/lapangan/[token]/kirim";
import { Ikon } from "@/components/Ikon";

/**
 * Pengirim foto untuk petugas di lapangan.
 *
 * Dibuat untuk dipakai sambil berdiri di lokasi: satu tombol besar yang
 * langsung membuka kamera, tanpa isian lain yang harus diketik.
 */
export function FormBukti({ token, sudah }: { token: string; sudah: number }) {
  const kotak = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [mengirim, mulai] = useTransition();

  return (
    <div className="lapangan-kirim">
      <input
        ref={kotak}
        className="sr"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        // Di HP, ini membuka kamera belakang langsung.
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setPesan(null);
          const muatan = new FormData();
          muatan.set("berkas", f);
          mulai(async () => {
            const hasil = await kirimBuktiAksi(token, muatan);
            setPesan({ ok: hasil.ok, teks: hasil.pesan });
          });
        }}
      />
      <button className="btn utama" type="button" disabled={mengirim} onClick={() => kotak.current?.click()}>
        <Ikon nama="kamera" ukuran={18} />
        {mengirim ? "Mengirim..." : sudah === 0 ? "Ambil foto hasil kerja" : "Tambah foto lagi"}
      </button>
      {pesan ? <p className={pesan.ok ? "bantu" : "bantu galat"}>{pesan.teks}</p> : null}
      <p className="bantu">
        Foto langsung masuk ke berkas laporan dan dilihat admin instansi. Jangan memotret wajah atau
        data pribadi warga.
      </p>
    </div>
  );
}
