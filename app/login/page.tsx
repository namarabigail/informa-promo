"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, Ticket } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { LOGIN_DOMAIN } from "@/lib/admin";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const u = username.trim().toLowerCase();
    const email = u.includes("@") ? u : `${u}@${LOGIN_DOMAIN}`;

    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      setError("Username atau password salah.");
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-5 p-6">
        <div className="space-y-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-ink text-white">
            <Ticket className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Login Supervisor</h1>
            <p className="text-sm text-muted">Khusus untuk update promo Informa.</p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={lihat ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setLihat((v) => !v)}
              aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted hover:bg-page"
            >
              {lihat ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <CircleAlert className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "Masuk..." : "Masuk"}
        </button>

        <Link href="/" className="block text-center text-sm font-medium text-muted hover:text-ink">
          Kembali ke halaman promo
        </Link>
      </form>
    </main>
  );
}