"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PromoBrowser from "@/components/PromoBrowser";
import type { ZonaRingkas } from "@/lib/promo";

export default function LandingClient({ zona }: { zona: ZonaRingkas[] }) {
  const [q, setQ] = useState("");
  const [terakhir, setTerakhir] = useState<ZonaRingkas | null>(null);

  // Zona terakhir yang dibuka (disimpan di browser)
  useEffect(() => {
    const id = Number(localStorage.getItem("zona_terakhir"));
    setTerakhir(zona.find((z) => z.id === id) ?? null);
  }, [zona]);

  const mencari = q.trim() !== "";

  return (
    <div className="space-y-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari promo… (mis. sofa, bedset, hadiah)"
        className="w-full rounded-xl border px-4 py-3 text-lg"
      />

      {/* Hasil search lintas zona. Selalu dimuat supaya cepat, disembunyikan kalau tidak mencari */}
      <div className={mencari ? "" : "hidden"}>
        <PromoBrowser query={q} onReset={() => setQ("")} />
      </div>

      {!mencari && (
        <>
          {terakhir && (
            <Link
              href={`/zona/${terakhir.id}`}
              className="inline-block rounded-full border px-4 py-2 text-sm"
            >
              Lanjut ke zona {terakhir.nama} →
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zona.map((z) => {
              const kosong = z.jumlah_promo === 0;
              return (
                <Link
                  key={z.id}
                  href={`/zona/${z.id}`}
                  className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
                    kosong ? "opacity-50 grayscale" : ""
                  }`}
                >
                  <div className="text-xl font-bold">{z.nama}</div>
                  <div className="mt-1 text-sm opacity-70">
                    {kosong ? "Belum ada promo" : `${z.jumlah_promo} promo aktif`}
                  </div>
                  {z.umum && <div className="mt-2 text-xs opacity-60">Berlaku di semua zona</div>}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}