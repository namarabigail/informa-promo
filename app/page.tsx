import { supabase } from "@/lib/supabase";
import LandingClient from "@/components/LandingClient";
import type { ZonaRingkas } from "@/lib/promo";

// Selalu ambil data terbaru: status promo bergantung pada tanggal hari ini
export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("zona_ringkas")
    .select("*")
    .order("urutan");

  if (error) return <pre className="p-6 text-red-600">{error.message}</pre>;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Promo Informa</h1>
      <LandingClient zona={data as ZonaRingkas[]} />
    </main>
  );
}