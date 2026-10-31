// Helper dan tipe bersama untuk halaman admin.

// Supabase Auth memakai email. Supervisor cukup mengetik username,
// lalu kita tambahkan domain ini. Harus sama dengan email user di Supabase.
export const LOGIN_DOMAIN = "promo-informa.com";
export const PERAN = "Product Specialist";

export function namaPengguna(u: string | null): string {
  if (!u) return "-";
  return u.toLowerCase() === "supervisor" ? PERAN : u;
}

export const BUCKET = "promo-images";

export type Kategori = { nama: string; warna: string | null; urutan?: number };
export type Zona = { id: number; nama: string; aktif?: boolean; urutan?: number };
export type PromoRow = {
  id: string;
  kategori: string;
  department: string | null;
  deskripsi: string | null;
  mulai: string;
  berakhir: string | null;
  gambar_path: string | null;
  link: string | null;
  updated_by: string | null;
  updated_at: string | null;
};

export type Status = "berlangsung" | "akan_datang" | "berakhir";

// Tanggal hari ini (YYYY-MM-DD) menurut WIB.
export function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

// Status dihitung otomatis dari tanggal, tidak pernah diisi manual.
export function statusPromo(
  p: { mulai: string; berakhir: string | null },
  today: string = todayWIB()
): Status {
  if (p.mulai > today) return "akan_datang";
  if (p.berakhir && p.berakhir < today) return "berakhir";
  return "berlangsung";
}

// Selisih hari antara dua tanggal YYYY-MM-DD (b - a).
export function selisihHari(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

export const STATUS_LABEL: Record<Status, string> = {
  berlangsung: "Berlangsung",
  akan_datang: "Akan datang",
  berakhir: "Berakhir",
};

export const STATUS_CLASS: Record<Status, string> = {
  berlangsung: "bg-green-100 text-green-800",
  akan_datang: "bg-blue-100 text-blue-800",
  berakhir: "bg-red-100 text-red-800",
};

export function gambarUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path)}`;
}

export function formatTanggal(d: string | null): string {
  if (!d) return "-";
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatWaktu(t: string | null): string {
  if (!t) return "-";
  return new Date(t).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pesanError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Terjadi kesalahan.";
}