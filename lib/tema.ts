import type { CSSProperties } from "react";

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function campur(hex: string, ke: string, f: number): string {
  const a = rgb(hex);
  const b = rgb(ke);
  if (!a || !b) return hex;
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * f));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Latar kartu bergaya kupon: gradasi + kilau lembut di pojok kiri atas
export function latar(warna: string): CSSProperties {
  const w = rgb(warna) ? warna : "#475569";
  return {
    backgroundColor: w,
    backgroundImage: `radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,.30) 0%, rgba(255,255,255,0) 60%), linear-gradient(135deg, ${campur(w, "#ffffff", 0.1)} 0%, ${w} 45%, ${campur(w, "#000000", 0.35)} 100%)`,
  };
}

// Warna tiap zona (landing + halaman zona). Zona baru otomatis kebagian warna cadangan.
const WARNA_ZONA: [string, string][] = [
  ["living", "#E76F51"],
  ["dining", "#1B998B"],
  ["sleeping", "#5B5BD6"],
  ["commercial", "#B7791F"],
  ["business", "#B7791F"],
  ["general", "#475569"],
];
const WARNA_CADANGAN = ["#D6336C", "#0C8599", "#7048E8", "#2F9E44", "#E8590C"];

export function warnaZona(nama: string, id: number): string {
  const n = nama.toLowerCase();
  return (
    WARNA_ZONA.find(([kunci]) => n.includes(kunci))?.[1] ??
    WARNA_CADANGAN[Math.abs(id) % WARNA_CADANGAN.length]
  );
}