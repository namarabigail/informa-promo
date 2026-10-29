import { supabase } from "@/lib/supabase";
import LandingClient from "@/components/LandingClient";
import type { ZonaRingkas } from "@/lib/promo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("zona_ringkas")
    .select("*")
    .order("urutan");

  if (error) {
    return <pre className="p-6 text-red-600">{error.message}</pre>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Promo Informa Depok</h1>
        <p className="text-muted">Promo yang sedang berlangsung. Cari langsung, atau pilih zona.</p>
      </header>
      <LandingClient zona={data as ZonaRingkas[]} />
    </main>
  );
}