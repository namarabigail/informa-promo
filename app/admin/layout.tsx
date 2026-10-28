"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function keluar() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  if (!ready) {
    return <main className="p-8 text-gray-500">Memeriksa login...</main>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-bold">Admin Promo Informa</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" target="_blank" className="text-gray-600 underline">Lihat web publik</Link>
            <button onClick={keluar} className="border rounded-lg px-3 py-1.5">Keluar</button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}