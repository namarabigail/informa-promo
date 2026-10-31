"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import { FeedbackProvider } from "@/components/Feedback";

// Penjaga login untuk semua halaman /admin.
// Header + menu (Dashboard / Logout) ada di SiteHeader (root layout).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <FeedbackProvider>
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      {ready ? (
        children
      ) : (
        <div className="space-y-3" aria-busy="true" aria-label="Memeriksa login">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-line" />
          <div className="h-24 animate-pulse rounded-2xl bg-line" />
          <div className="h-24 animate-pulse rounded-2xl bg-line" />
        </div>
      )}
    </div>
    </FeedbackProvider>
  );
}