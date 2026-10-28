import { createBrowserClient } from "@supabase/ssr";

// Client Supabase untuk sisi browser (login & admin).
// Sesi login disimpan di cookie oleh @supabase/ssr.
export function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}