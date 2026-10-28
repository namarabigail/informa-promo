import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PromoBrowser from "@/components/PromoBrowser";
import type { ZonaRingkas } from "@/lib/promo";

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

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href="/" className="text-sm underline">
        ← Ganti zona
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{zona.nama}</h1>
        <p className="text-sm opacity-70">
          {zona.jumlah_promo} promo aktif
          {zona.umum ? " · berlaku di semua zona" : ""}
        </p>
      </div>
      <PromoBrowser zonaId={zona.id} />
    </main>
  );
}