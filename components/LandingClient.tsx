"use client";

import Link from "next/link";
import { useState } from "react";
import PromoBrowser from "@/components/PromoBrowser";
import SearchBar from "@/components/SearchBar";
import { IkonZona } from "@/components/Ikon";
import type { ZonaRingkas } from "@/lib/promo";
import { latar, warnaZona } from "@/lib/tema";

export default function LandingClient({ zona }: { zona: ZonaRingkas[] }) {
  const [q, setQ] = useState("");

  const mencari = q.trim() !== "";

  return (
    <div className="space-y-6">
      <SearchBar value={q} onChange={setQ} placeholder="Cari promo…" />

      {/* Hasil search lintas zona. Selalu dimuat supaya cepat, disembunyikan kalau tidak mencari */}
      <div className={mencari ? "" : "hidden"}>
        <PromoBrowser query={q} onReset={() => setQ("")} />
      </div>

      {!mencari && (
        <section className="space-y-3">
          <h2 className="pt-1 text-sm font-bold uppercase tracking-wide text-muted">Pilih zona</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zona.map((z) => {
              const kosong = z.jumlah_promo === 0;
              const warna = warnaZona(z.nama, z.id);
              return (
                <Link
                  key={z.id}
                  href={`/zona/${z.id}`}
                  style={latar(warna)}
                  className={`relative flex min-h-[8.5rem] items-center overflow-hidden rounded-3xl p-5 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] ${
                    kosong ? "opacity-70 saturate-50" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-24">
                    <h3 className="text-2xl font-extrabold leading-tight tracking-tight">{z.nama}</h3>
                    <span
                      className="mt-2.5 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold"
                      style={{ color: warna }}
                    >
                      {kosong ? "Belum ada promo" : `${z.jumlah_promo} promo aktif`}
                    </span>
                  </div>
                  <div className="absolute right-4 top-1/2 grid size-20 -translate-y-1/2 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 sm:size-24">
                    <IkonZona nama={z.nama} className="size-10 text-white/90 sm:size-11" strokeWidth={1.6} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}