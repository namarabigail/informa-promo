"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { type Promo, gambarUrl, periode, sisaHari } from "@/lib/promo";
import { IkonKategori } from "@/components/Ikon";
import { latar } from "@/lib/tema";

type Props = {
  p: Promo;
  tampilZona?: boolean; // true saat hasil lintas zona (landing)
  onClick: () => void;
};

// Kartu bergaya kupon: gradasi warna kategori, teks besar di kiri,
// tile gambar (atau ikon kategori) di kanan, chip putih di bawah.
export default function KartuPromo({ p, tampilZona, onClick }: Props) {
  const [gagal, setGagal] = useState(false);
  const url = gambarUrl(p.gambar_path);
  const sisa = sisaHari(p);
  const zonaTeks = p.semua_zona ? "Semua Zona" : p.zona_names.join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      style={latar(p.warna)}
      className="relative flex min-h-[10.5rem] w-full cursor-pointer overflow-hidden rounded-3xl p-5 text-left text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
    >
      <div className="flex min-w-0 flex-1 flex-col pr-28 sm:pr-32">
        {p.deskripsi && <span className="text-sm font-medium text-white/85">{p.kategori}</span>}
        <h3 className="mt-0.5 line-clamp-3 whitespace-pre-line text-2xl font-extrabold leading-tight tracking-tight">
          {p.deskripsi ?? p.kategori}
        </h3>
        <p className="mt-1.5 text-sm text-white/85">{periode(p)}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {p.department && (
            <span
              className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs font-bold"
              style={{ color: p.warna }}
            >
              {p.department}
            </span>
          )}
          {tampilZona && (
            <span className="max-w-full truncate rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {zonaTeks}
            </span>
          )}
          {sisa && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold">
              <Clock className="size-3.5" />
              {sisa}
            </span>
          )}
        </div>
      </div>

      {/* Tile kanan: gambar promo, atau ikon kategori kalau tidak ada gambar */}
      <div className="absolute right-4 top-1/2 grid size-24 -translate-y-1/2 place-items-center overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/30 sm:size-28">
        {url && !gagal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" onError={() => setGagal(true)} className="size-full object-cover" />
        ) : (
          <IkonKategori nama={p.kategori} className="size-12 text-white/90" strokeWidth={1.6} />
        )}
      </div>
    </button>
  );
}