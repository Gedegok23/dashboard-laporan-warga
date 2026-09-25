"use client";

import { useActionState } from "react";

import { Ikon } from "@/components/Ikon";
import { masukAksi, type HasilMasuk } from "./masuk";

export function FormMasuk({ next }: { next: string }) {
  const [hasil, kirim, menunggu] = useActionState<HasilMasuk, FormData>(masukAksi, null);

  return (
    <form className="masuk-form" action={kirim}>
      <input type="hidden" name="next" value={next} />

      <div className="masuk-isian">
        <label htmlFor="akun">Nama akun</label>
        <input
          id="akun"
          name="akun"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
          disabled={menunggu}
        />
      </div>

      <div className="masuk-isian">
        <label htmlFor="sandi">Kata sandi</label>
        {/* Tidak pernah diisi lebih dulu: entering-data.md > Best practices,
            "Never prepopulate a password field." */}
        <input
          id="sandi"
          name="sandi"
          type="password"
          autoComplete="current-password"
          required
          disabled={menunggu}
        />
      </div>

      {hasil ? (
        <p className="masuk-galat" role="alert">
          <Ikon nama="peringatan" ukuran={16} />
          <span>{hasil.pesan}</span>
        </p>
      ) : null}

      <button className="btn utama masuk-tombol" type="submit" disabled={menunggu}>
        {menunggu ? "Memeriksa" : "Masuk"}
      </button>
    </form>
  );
}
