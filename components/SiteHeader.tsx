"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { EllipsisVertical, LayoutDashboard, LogIn, LogOut, Ticket } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

const ITEM =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-page";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Status login: dipakai untuk memilih isi menu
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = sb.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Tutup menu: klik/tap di luar, atau tekan Esc
  useEffect(() => {
    if (!open) return;
    const luar = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", luar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", luar);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await getSupabase().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const username = user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-xl bg-ink text-white">
            <Ticket className="size-[18px]" />
          </span>
          <span>
            Promo Informa <span className="font-medium text-muted">Depok</span>
          </span>
        </Link>

        <div ref={wrapRef} className="relative">
          <button
            ref={btnRef}
            type="button"
            aria-label="Menu"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 cursor-pointer place-items-center rounded-full transition hover:bg-page"
          >
            <EllipsisVertical className="size-5" />
          </button>

          {open && (
            <div
              role="menu"
              className="animate-sheet absolute right-0 top-full mt-2 w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
            >
              {user ? (
                <>
                  <div className="px-3 pb-2 pt-1.5">
                    <p className="text-xs text-muted">Masuk sebagai</p>
                    <p className="truncate text-sm font-bold">{username}</p>
                  </div>
                  <div className="mx-1.5 mb-1 border-t border-line" />
                  <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
                    <LayoutDashboard className="size-[18px] text-muted" />
                    Dashboard admin
                  </Link>
                  <button type="button" role="menuitem" onClick={logout} className={ITEM}>
                    <LogOut className="size-[18px] text-muted" />
                    Logout
                  </button>
                </>
              ) : pathname === "/login" ? (
                <Link href="/" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
                  <Ticket className="size-[18px] text-muted" />
                  Kembali ke halaman promo
                </Link>
              ) : (
                <Link href="/login" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
                  <LogIn className="size-[18px] text-muted" />
                  Login supervisor
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}