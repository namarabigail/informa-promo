"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  X,
  type LucideIcon,
} from "lucide-react";
import { type Promo, gambarUrl, periode, sisaHari, teksLink, urlAman } from "@/lib/promo";
import { IkonKategori } from "@/components/Ikon";
import { latar } from "@/lib/tema";

// Bottom sheet di HP, dialog di tengah di layar besar.
// Gambar ditampilkan UTUH (object-contain), tidak dipotong.
export default function PromoDetail({ p, onClose }: { p: Promo; onClose: () => void }) {
  const [gagal, setGagal] = useState(false);
  const url = gambarUrl(p.gambar_path);
  const sisa = sisaHari(p);
  const href = urlAman(p.link);

  // Esc untuk menutup + kunci scroll halaman di belakang
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = lama;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-promo"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
      >
        <div className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-black/20 sm:hidden" />
        <button
          type="button"
          autoFocus
          aria-label="Tutup"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-surface/95 shadow hover:bg-surface"
        >
          <X className="size-5" />
        </button>

        {url && !gagal ? (
          <div className="bg-page px-4 pb-4 pt-14 sm:pt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={p.deskripsi ?? p.kategori}
              onError={() => setGagal(true)}
              className="mx-auto max-h-[60dvh] w-auto max-w-full rounded-2xl object-contain"
            />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
            >
              Buka gambar penuh <ExternalLink className="size-4" />
            </a>
          </div>
        ) : (
          <div className="grid h-36 place-items-center" style={latar(p.warna)}>
            <IkonKategori nama={p.kategori} className="size-16 text-white/90" strokeWidth={1.5} />
          </div>
        )}

        <div className="space-y-4 p-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={latar(p.warna)}
          >
            <IkonKategori nama={p.kategori} className="size-4" />
            {p.kategori}
          </span>

          <h2 id="judul-promo" className="whitespace-pre-line text-xl font-extrabold leading-snug">
            {p.deskripsi ?? "Hubungi toko untuk detail promo"}
          </h2>

          {/* Link tepat di bawah nama promo, bisa diklik (tab baru) */}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-page px-4 py-3 text-sm font-semibold transition hover:border-ink"
            >
              <ExternalLink className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate underline underline-offset-2">{teksLink(href)}</span>
            </a>
          )}

          <dl className="space-y-3">
            {p.department && (
              <Info ikon={Building2} label="Department">
                {p.department}
              </Info>
            )}
            <Info ikon={MapPin} label="Zona">
              {p.semua_zona ? "Semua Zona" : p.zona_names.join(", ")}
            </Info>
            <Info ikon={CalendarDays} label="Periode">
              {periode(p)}
            </Info>
            {sisa && (
              <Info ikon={Clock} label="Segera berakhir">
                {sisa}
              </Info>
            )}
          </dl>

          <button type="button" onClick={onClose} className="btn btn-primary w-full">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({
  ikon: Ikon,
  label,
  children,
}: {
  ikon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-page text-muted">
        <Ikon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}