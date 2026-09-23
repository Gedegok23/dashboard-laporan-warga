"use client";

import { useEffect } from "react";
import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";

export function Toast() {
  const { s, kirim, gagal, tutupGagal } = useMeja();
  const toast = s.toast;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => kirim({ t: "tutup-toast" }), 7000);
    return () => clearTimeout(id);
  }, [toast, kirim]);

  // Kegagalan server mendahului pesan sukses: layar sudah terlanjur berubah,
  // jadi petugas harus tahu perubahannya tidak tersimpan.
  if (gagal) {
    return (
      <div className="toast tampil gagal" role="alert" aria-live="assertive">
        <Ikon nama="peringatan" ukuran={18} />
        <span>Tidak tersimpan: {gagal} Muat ulang halaman untuk melihat keadaan sebenarnya.</span>
        <button type="button" onClick={tutupGagal}>
          Tutup
        </button>
      </div>
    );
  }

  return (
    <div className={`toast${toast ? " tampil" : ""}`} role="status" aria-live="polite">
      {toast ? (
        <>
          <Ikon nama="selesai" ukuran={18} />
          <span>{toast.pesan}</span>
          {toast.adaUndo && s.undo ? (
            <button type="button" onClick={() => kirim({ t: "undo" })}>
              Batalkan
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
