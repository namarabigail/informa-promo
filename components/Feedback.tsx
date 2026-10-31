"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Trash2, X } from "lucide-react";

type Tipe = "sukses" | "error";
type ToastItem = { id: number; tipe: Tipe; teks: string };
type OpsiKonfirmasi = { judul: string; pesan: string; ya?: string; bahaya?: boolean };

type Ctx = {
  /** Notifikasi singkat yang hilang sendiri */
  toast: (teks: string, tipe?: Tipe) => void;
  /** Dialog konfirmasi. Mengembalikan true kalau pengguna menekan tombol "ya" */
  konfirmasi: (o: OpsiKonfirmasi) => Promise<boolean>;
};

const FeedbackCtx = createContext<Ctx | null>(null);

export function useFeedback(): Ctx {
  const c = useContext(FeedbackCtx);
  if (!c) throw new Error("useFeedback harus dipakai di dalam FeedbackProvider");
  return c;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dlg, setDlg] = useState<OpsiKonfirmasi | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const idTerakhir = useRef(0);

  const hapusToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (teks: string, tipe: Tipe = "sukses") => {
      const id = ++idTerakhir.current;
      setToasts((t) => [...t, { id, tipe, teks }]);
      setTimeout(() => hapusToast(id), tipe === "error" ? 6000 : 3500);
    },
    [hapusToast]
  );

  const konfirmasi = useCallback(
    (o: OpsiKonfirmasi) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setDlg(o);
      }),
    []
  );

  const tutup = useCallback((hasil: boolean) => {
    resolver.current?.(hasil);
    resolver.current = null;
    setDlg(null);
  }, []);

  useEffect(() => {
    if (!dlg) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && tutup(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [dlg, tutup]);

  const nilai = useMemo(() => ({ toast, konfirmasi }), [toast, konfirmasi]);

  return (
    <FeedbackCtx.Provider value={nilai}>
      {children}

      {/* Toast: bawah layar, di tengah */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipe === "error" ? "alert" : "status"}
            className="animate-sheet pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl"
          >
            {t.tipe === "error" ? (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-400" />
            ) : (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            )}
            <p className="min-w-0 flex-1 break-words">{t.teks}</p>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => hapusToast(t.id)}
              className="cursor-pointer text-white/60 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Dialog konfirmasi */}
      {dlg && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => tutup(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="judul-konfirmasi"
            aria-describedby="pesan-konfirmasi"
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet w-full max-w-sm space-y-4 rounded-3xl bg-surface p-6 shadow-2xl"
          >
            <span
              className={`grid size-12 place-items-center rounded-2xl ${
                dlg.bahaya ? "bg-red-50 text-red-600" : "bg-page text-ink"
              }`}
            >
              {dlg.bahaya ? <Trash2 className="size-6" /> : <CircleAlert className="size-6" />}
            </span>
            <div className="space-y-1">
              <h2 id="judul-konfirmasi" className="text-lg font-extrabold">
                {dlg.judul}
              </h2>
              <p id="pesan-konfirmasi" className="break-words text-sm text-muted">
                {dlg.pesan}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" autoFocus onClick={() => tutup(false)} className="btn btn-ghost flex-1">
                Batal
              </button>
              <button
                type="button"
                onClick={() => tutup(true)}
                className={`btn flex-1 ${dlg.bahaya ? "bg-red-600 text-white hover:bg-red-700" : "btn-primary"}`}
              >
                {dlg.ya ?? "Ya"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackCtx.Provider>
  );
}