"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type Opsi = { value: string; label: string };

export default function Dropdown({
  label,
  value,
  onChange,
  opsi,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opsi: Opsi[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const terpilih = opsi.find((o) => o.value === value) ?? opsi[0];
  const aktif = value !== "";

  useEffect(() => {
    if (!open) return;
    const luar = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", luar);
    document.addEventListener("keydown", esc);
    // Fokus ke pilihan yang sedang aktif
    panelRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", luar);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
        ? items.length - 1
        : e.key === "ArrowDown"
        ? Math.min(i + 1, items.length - 1)
        : Math.max(i - 1, 0);
    items[next]?.focus();
  }

  function pilih(v: string) {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`chip ${aktif ? "chip-aktif" : ""}`}
      >
        <span className="max-w-[13rem] truncate">{terpilih?.label ?? label}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Latar gelap hanya di HP */}
          <div className="fixed inset-0 z-50 bg-ink/40 sm:hidden" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            role="listbox"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="animate-sheet fixed inset-x-0 bottom-0 z-[60] max-h-[70dvh] overflow-y-auto rounded-t-3xl bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-72 sm:w-72 sm:rounded-2xl sm:border sm:border-line sm:p-1.5 sm:pb-1.5"
          >
            <div className="mx-auto mb-1 mt-1 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
            <p className="px-3 pb-1.5 pt-1 text-sm font-bold sm:hidden">{label}</p>
            {opsi.map((o) => {
              const dipilih = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={dipilih}
                  onClick={() => pilih(o.value)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-page sm:py-2.5"
                  style={dipilih ? { background: "color-mix(in srgb, var(--aksen) 12%, white)" } : undefined}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
                  {dipilih && <Check className="size-4 shrink-0" style={{ color: "var(--aksen)" }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}