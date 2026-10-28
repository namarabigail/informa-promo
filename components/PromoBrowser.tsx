"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Promo, cocok, gambarUrl, periode, sisaHari } from "@/lib/promo";

type Props = {
  zonaId?: number; // kosong = semua zona (dipakai di landing)
  query?: string; // kalau diisi, search dikontrol parent (landing)
  onReset?: () => void;
};

export default function PromoBrowser({ zonaId, query, onReset }: Props) {
  const [all, setAll] = useState<Promo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qLocal, setQLocal] = useState("");
  const [kategori, setKategori] = useState<string | null>(null);
  const [dept, setDept] = useState("");
  const [dipilih, setDipilih] = useState<Promo | null>(null);

  useEffect(() => {
    supabase
      .rpc("search_promo", zonaId ? { zona_filter: zonaId } : {})
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setAll(data as Promo[]);
      });
    if (zonaId) localStorage.setItem("zona_terakhir", String(zonaId));
  }, [zonaId]);

  const q = query ?? qLocal;

  const kategoriList = useMemo(
    () => Array.from(new Map((all ?? []).map((p) => [p.kategori, p.warna] as const))),
    [all]
  );
  const deptList = useMemo(
    () =>
      Array.from(
        new Set((all ?? []).map((p) => p.department).filter(Boolean) as string[])
      ).sort(),
    [all]
  );

  const hasil = useMemo(
    () =>
      (all ?? []).filter(
        (p) =>
          (!kategori || p.kategori === kategori) &&
          (!dept || !p.department || p.department === dept) &&
          cocok(p, q)
      ),
    [all, kategori, dept, q]
  );

  function reset() {
    setQLocal("");
    setKategori(null);
    setDept("");
    onReset?.();
  }

  if (error) return <pre className="p-4 text-red-600">{error}</pre>;
  if (!all) return <p className="py-8 text-center opacity-60">Memuat promo…</p>;

  return (
    <div className="space-y-4">
      {query === undefined && (
        <input
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="Cari promo di zona ini…"
          className="w-full rounded-xl border px-4 py-3"
        />
      )}

      {all.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Chip aktif={!kategori} onClick={() => setKategori(null)}>
            Semua
          </Chip>
          {kategoriList.map(([nama, warna]) => (
            <Chip
              key={nama}
              aktif={kategori === nama}
              warna={warna}
              onClick={() => setKategori(kategori === nama ? null : nama)}
            >
              {nama}
            </Chip>
          ))}
          {deptList.length > 0 && (
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="rounded-full border px-3 py-1.5 text-sm"
            >
              <option value="">Semua department</option>
              {deptList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {hasil.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg font-semibold">
            {all.length === 0
              ? zonaId
                ? "Belum ada promo di zona ini"
                : "Promo baru segera hadir"
              : q.trim()
              ? `Tidak ada promo untuk “${q.trim()}”`
              : "Tidak ada promo dengan filter ini"}
          </p>
          {all.length > 0 && (
            <button onClick={reset} className="mt-3 rounded-full border px-4 py-2 text-sm">
              Reset pencarian & filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((p) => (
            <Kartu key={p.id} p={p} onClick={() => setDipilih(p)} />
          ))}
        </div>
      )}

      {dipilih && <Detail p={dipilih} onClose={() => setDipilih(null)} />}
    </div>
  );
}

function Chip({
  aktif,
  warna,
  onClick,
  children,
}: {
  aktif: boolean;
  warna?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm ${aktif ? "text-white" : ""}`}
      style={aktif ? { background: warna ?? "#111", borderColor: warna ?? "#111" } : undefined}
    >
      {children}
    </button>
  );
}

function Gambar({ p, className }: { p: Promo; className: string }) {
  const [gagal, setGagal] = useState(false);
  const url = gambarUrl(p.gambar_path);
  if (url && !gagal) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={p.kategori} onError={() => setGagal(true)} className={className} />;
  }
  // Placeholder: blok warna kategori + inisial
  return (
    <div className={`${className} flex items-center justify-center bg-black/20 text-5xl font-bold text-white/80`}>
      {p.kategori.charAt(0)}
    </div>
  );
}

function ZonaBadge({ p }: { p: Promo }) {
  return (
    <span className="rounded-full bg-white/20 px-2 py-0.5">
      {p.semua_zona ? "Semua Zona" : p.zona_names.join(", ")}
    </span>
  );
}

function Kartu({ p, onClick }: { p: Promo; onClick: () => void }) {
  const sisa = sisaHari(p);
  return (
    <button
      onClick={onClick}
      className="overflow-hidden rounded-2xl text-left text-white shadow transition hover:-translate-y-0.5"
      style={{ background: p.warna }}
    >
      <Gambar p={p} className="h-40 w-full object-cover" />
      <div className="space-y-2 p-4">
        {p.deskripsi && <div className="text-sm opacity-90">{p.kategori}</div>}
        <div className="line-clamp-3 whitespace-pre-line text-lg font-bold">
          {p.deskripsi ?? p.kategori}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {p.department && <span className="rounded-full bg-white/20 px-2 py-0.5">{p.department}</span>}
          <ZonaBadge p={p} />
        </div>
        <div className="text-xs opacity-90">{periode(p)}</div>
        {sisa && <div className="text-xs font-semibold">⏳ {sisa}</div>}
      </div>
    </button>
  );
}

function Detail({ p, onClose }: { p: Promo; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const sisa = sisaHari(p);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <Gambar p={p} className="h-56 w-full object-cover" />
        <div className="space-y-3 p-5">
          <span
            className="inline-block rounded-full px-3 py-1 text-sm text-white"
            style={{ background: p.warna }}
          >
            {p.kategori}
          </span>
          <p className="whitespace-pre-line text-lg font-bold">
            {p.deskripsi ?? "Hubungi toko untuk detail promo"}
          </p>
          <dl className="space-y-1 text-sm">
            {p.department && <Baris k="Department" v={p.department} />}
            <Baris k="Zona" v={p.semua_zona ? "Semua Zona" : p.zona_names.join(", ")} />
            <Baris k="Periode" v={periode(p)} />
            {sisa && <Baris k="Status" v={`⏳ ${sisa}`} />}
          </dl>
          <button onClick={onClose} className="w-full rounded-xl border py-2.5">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 opacity-60">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}