"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { type Promo, cocok } from "@/lib/promo";
import Dropdown from "@/components/Dropdown";
import KartuPromo from "@/components/KartuPromo";
import PromoDetail from "@/components/PromoDetail";
import SearchBar from "@/components/SearchBar";

type Props = {
  zonaId?: number; // kosong = semua zona (dipakai di landing)
  query?: string;
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

  if (error) {
    return <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat promo: {error}</p>;
  }

  if (!all) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Memuat promo">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[10.5rem] animate-pulse rounded-3xl bg-line" />
        ))}
      </div>
    );
  }

  const pesanKosong =
    all.length === 0
      ? zonaId
        ? "Belum ada promo di zona ini"
        : "Promo baru segera hadir"
      : q.trim()
      ? `Tidak ada promo untuk “${q.trim()}”`
      : "Tidak ada promo dengan filter ini";

  return (
    <div className="space-y-4">
      {query === undefined && (
        <SearchBar value={qLocal} onChange={setQLocal} placeholder="Cari promo di zona ini…" />
      )}

      {all.length > 0 && (
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => setKategori(null)}
            className={`chip ${!kategori ? "chip-aktif" : ""}`}
          >
            Semua
          </button>
          {kategoriList.map(([nama, warna]) => (
            <button
              key={nama}
              type="button"
              onClick={() => setKategori(kategori === nama ? null : nama)}
              className={`chip ${kategori === nama ? "chip-aktif" : ""}`}
              style={kategori === nama ? { background: warna, borderColor: warna } : undefined}
            >
              {nama}
            </button>
          ))}
        </div>
      )}

      {all.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{hasil.length} promo</p>
          {deptList.length > 0 && (
            <Dropdown
              label="Department"
              value={dept}
              onChange={setDept}
              opsi={[{ value: "", label: "Semua department" }, ...deptList.map((d) => ({ value: d, label: d }))]}
            />
          )}
        </div>
      )}

      {hasil.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface text-muted shadow-card">
            <SearchX className="size-7" />
          </span>
          <p className="text-lg font-bold">{pesanKosong}</p>
          {all.length > 0 && (
            <button type="button" onClick={reset} className="btn btn-ghost">
              Reset pencarian &amp; filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((p) => (
            <KartuPromo key={p.id} p={p} tampilZona={!zonaId} onClick={() => setDipilih(p)} />
          ))}
        </div>
      )}

      {dipilih && <PromoDetail p={dipilih} onClose={() => setDipilih(null)} />}
    </div>
  );
}