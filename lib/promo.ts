// lib/promo.ts

export const BUCKET = "promo-images";

export type Promo = {
  id: string; // uuid
  kategori: string;
  warna: string;
  department: string | null;
  deskripsi: string | null;
  gambar_path: string | null;
  link: string | null; // link produk/promo (opsional)
  mulai: string | null; // format YYYY-MM-DD
  berakhir: string | null; // format YYYY-MM-DD
  zona_ids: number[];
  zona_names: string[];
  semua_zona: boolean;
  sisa_hari: number | null;
};

export type ZonaRingkas = {
  id: number;
  nama: string;
  urutan: number;
  jumlah_promo: number;
  umum: boolean;
};

// URL publik gambar dari Supabase Storage (bucket harus Public)
export function gambarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${encodeURI(path)}`;
}

// ---------- Tanggal ----------
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function tanggalPendek(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function hariIniWIB(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function selisihHari(dariIso: string, keIso: string): number {
  const a = dariIso.slice(0, 10).split("-").map(Number);
  const b = keIso.slice(0, 10).split("-").map(Number);
  const ms = Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2]);
  return Math.round(ms / 86400000);
}

// Teks periode promo
export function periode(p: Promo): string {
  if (!p.berakhir) {
    return p.mulai
      ? `Mulai ${tanggalPendek(p.mulai)} · Selama persediaan masih ada`
      : "Selama persediaan masih ada";
  }
  return p.mulai
    ? `${tanggalPendek(p.mulai)} – ${tanggalPendek(p.berakhir)}`
    : `Sampai ${tanggalPendek(p.berakhir)}`;
}

// Label sisa waktu, hanya muncul kalau berakhir dalam 3 hari
export function sisaHari(p: Promo): string | null {
  if (!p.berakhir) return null;
  const d = selisihHari(hariIniWIB(), p.berakhir);
  if (d < 0 || d > 3) return null;
  if (d === 0) return "Berakhir hari ini";
  if (d === 1) return "Berakhir besok";
  return `Berakhir ${d} hari lagi`;
}

// ---------- Search ----------
// Semua kata yang diketik harus ditemukan di Kategori / Deskripsi / Department / Zona
export function cocok(p: Promo, q: string): boolean {
  const kata = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return true;
  const jerami = [
    p.kategori,
    p.deskripsi,
    p.department,
    p.semua_zona ? "semua zona" : "",
    ...(p.zona_names ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return kata.every((k) => jerami.includes(k));
}

// ---------- Link ----------
export function urlAman(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const dengan = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(dengan);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export function teksLink(href: string): string {
  return href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}