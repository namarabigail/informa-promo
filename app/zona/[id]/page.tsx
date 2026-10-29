import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PromoBrowser from "@/components/PromoBrowser";
import { IkonZona } from "@/components/Ikon";
import type { ZonaRingkas } from "@/lib/promo";
import { latar, warnaZona } from "@/lib/tema";

export const dynamic = "force-dynamic";

export default async function ZonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zid = Number(id);
  if (!Number.isInteger(zid)) notFound();

  const { data } = await supabase
    .from("zona_ringkas")
    .select("*")
    .eq("id", zid)
    .maybeSingle();
  if (!data) notFound();
  const zona = data as ZonaRingkas;
  const warna = warnaZona(zona.nama, zona.id);

  return (
    // --aksen: chip aktif, fokus input, dan dropdown di halaman ini ikut warna zona
    <main
      className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-16 pt-5 sm:px-6"
      style={{ "--aksen": warna } as CSSProperties}
    >
      <section
        style={latar(warna)}
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-card sm:p-7"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Ganti zona
        </Link>

        <div className="mt-5 pr-24 sm:pr-32">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{zona.nama}</h1>
          <span
            className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold"
            style={{ color: warna }}
          >
            {zona.jumlah_promo} promo aktif
          </span>
          {zona.umum && <p className="mt-2 text-sm text-white/85">Berlaku di semua zona</p>}
        </div>

        <div className="absolute right-5 top-1/2 grid size-20 -translate-y-1/2 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 sm:size-24">
          <IkonZona nama={zona.nama} className="size-10 text-white/90 sm:size-11" strokeWidth={1.6} />
        </div>
      </section>

      <PromoBrowser zonaId={zona.id} />
    </main>
  );
}