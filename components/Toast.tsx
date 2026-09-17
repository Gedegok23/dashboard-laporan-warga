"use client";

import { useEffect } from "react";
import { Ikon } from "./Ikon";
import { useMeja } from "./MejaProvider";

export function Toast() {
  const { s, kirim } = useMeja();
  const toast = s.toast;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => kirim({ t: "tutup-toast" }), 7000);
    return () => clearTimeout(id);
  }, [toast, kirim]);

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
