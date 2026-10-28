"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import { LOGIN_DOMAIN } from "@/lib/admin";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Login Supervisor</h1>
          <p className="text-sm text-gray-500">Khusus untuk update promo Informa.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 text-white rounded-lg py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>

        <a href="/" className="block text-center text-sm text-gray-500 underline">Kembali ke halaman promo</a>
      </form>
    </main>
  );
}