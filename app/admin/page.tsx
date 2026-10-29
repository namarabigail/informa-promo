"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import SearchBar from "@/components/SearchBar";
import { latar } from "@/lib/tema";
import {
  formatTanggal,
  formatWaktu,
  gambarUrl,
  pesanError,
  selisihHari,
  statusPromo,
  STATUS_CLASS,
  STATUS_LABEL,
  todayWIB,
  type Kategori,
  type PromoRow,
  type Status,
  type Zona,
} from "@/lib/admin";

type PZ = { promo_id: string; zona_id: number };
type Fokus = { label: string; ids: string[] } | null;

const URUTAN: Record<Status, number> = { berlangsung: 0, akan_datang: 1, berakhir: 2 };

const WARNA_BANNER = {
  merah: "border-red-200 bg-red-50 text-red-800",
  oranye: "border-orange-200 bg-orange-50 text-orange-800",
  biru: "border-blue-200 bg-blue-50 text-blue-800",
  abu: "border-line bg-surface text-muted",
};

export default function AdminPage() {
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [zona, setZona] = useState<Zona[]>([]);
  const [pz, setPz] = useState<PZ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"semua" | Status>("semua");
  const [fokus, setFokus] = useState<Fokus>(null);
  const [versi, setVersi] = useState(0); // naikkan untuk memuat ulang data

  useEffect(() => {
    let batal = false;
    const sb = getSupabase();
    Promise.all([
      sb.from("promo").select("id,kategori,department,deskripsi,mulai,berakhir,gambar_path,updated_by,updated_at"),
      sb.from("kategori").select("nama,warna,urutan"),
      sb.from("zona").select("id,nama,urutan").order("urutan"),
      sb.from("promo_zona").select("promo_id,zona_id"),
    ]).then(([a, b, c, d]) => {
      if (batal) return;
      const err = a.error || b.error || c.error || d.error;
      if (err) {
        setError(pesanError(err));
      } else {
        setPromos((a.data ?? []) as PromoRow[]);
        setKategori((b.data ?? []) as Kategori[]);
        setZona((c.data ?? []) as Zona[]);
        setPz((d.data ?? []) as PZ[]);
        setError("");
      }
      setLoading(false);
    });
    return () => {
      batal = true;
    };
  }, [versi]);

  // Semua promo + info turunan (status, sisa hari, dst), belum difilter.
  const semua = useMemo(() => {
    const today = todayWIB();
    const katMap = new Map(kategori.map((k) => [k.nama, k]));
    const zonaMap = new Map(zona.map((z) => [z.id, z.nama]));

    return promos.map((p) => {
      const zonaNama = pz
        .filter((x) => x.promo_id === p.id)
        .map((x) => zonaMap.get(x.zona_id))
        .filter(Boolean) as string[];
      return {
        ...p,
        kat: katMap.get(p.kategori),
        zonaText: zonaNama.length ? zonaNama.join(", ") : "Semua Zona",
        status: statusPromo(p, today),
        sisa: p.berakhir ? selisihHari(today, p.berakhir) : null,
        mulaiIn: selisihHari(today, p.mulai),
      };
    });
  }, [promos, kategori, zona, pz]);

  // Kartu ringkasan + banner.
  const ringkas = useMemo(() => {
    const berlangsung = semua.filter((r) => r.status === "berlangsung");
    const segera = berlangsung.filter((r) => r.sisa !== null && r.sisa <= 3);
    const lewat = semua.filter((r) => r.status === "berakhir");
    const segeraMulai = semua.filter((r) => r.status === "akan_datang" && r.mulaiIn <= 2);
    const kurang = semua.filter((r) => r.status !== "berakhir" && (!r.gambar_path || !r.deskripsi));
    const terakhir = semua.reduce<string | null>(
      (m, r) => (r.updated_at && (!m || r.updated_at > m) ? r.updated_at : m),
      null
    );

    const ids = (arr: { id: string }[]) => arr.map((r) => r.id);
    const banners: { key: string; warna: keyof typeof WARNA_BANNER; teks: string; ids?: string[] }[] = [];

    if (berlangsung.length === 0) {
      banners.push({
        key: "kosong",
        warna: "merah",
        teks: "Tidak ada promo yang sedang berlangsung. Web publik saat ini kosong.",
      });
    }
    if (lewat.length > 0) {
      banners.push({
        key: "lewat",
        warna: "merah",
        teks: `${lewat.length} promo sudah lewat tanggal berakhir dan belum dihapus.`,
        ids: ids(lewat),
      });
    }
    if (segera.length > 0) {
      banners.push({
        key: "segera",
        warna: "oranye",
        teks: `${segera.length} promo berakhir dalam 3 hari.`,
        ids: ids(segera),
      });
    }
    if (segeraMulai.length > 0) {
      banners.push({
        key: "mulai",
        warna: "biru",
        teks: `${segeraMulai.length} promo mulai besok atau lusa.`,
        ids: ids(segeraMulai),
      });
    }
    if (kurang.length > 0) {
      banners.push({
        key: "kurang",
        warna: "abu",
        teks: `${kurang.length} promo belum ada gambar atau deskripsi.`,
        ids: ids(kurang),
      });
    }

    return { jumlahBerlangsung: berlangsung.length, jumlahSegera: segera.length, terakhir, banners };
  }, [semua]);

  const rows = useMemo(() => {
    return semua
      .filter((r) => !fokus || fokus.ids.includes(r.id))
      .filter((r) => filter === "semua" || r.status === filter)
      .filter((r) => {
        const s = q.trim().toLowerCase();
        if (!s) return true;
        return [r.kategori, r.department, r.deskripsi, r.zonaText]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(s);
      })
      .sort((a, b) => {
        if (URUTAN[a.status] !== URUTAN[b.status]) return URUTAN[a.status] - URUTAN[b.status];
        return (a.berakhir ?? "9999-12-31").localeCompare(b.berakhir ?? "9999-12-31");
      });
  }, [semua, q, filter, fokus]);

  function klikBanner(label: string, ids?: string[]) {
    if (!ids) return;
    setFokus({ label, ids });
    setFilter("semua");
    setQ("");
  }

  async function hapus(id: string, label: string) {
    if (!confirm(`Hapus promo "${label}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const sb = getSupabase();
    const r1 = await sb.from("promo_zona").delete().eq("promo_id", id);
    if (r1.error) return alert("Gagal menghapus: " + pesanError(r1.error));
    const r2 = await sb.from("promo").delete().eq("id", id);
    if (r2.error) return alert("Gagal menghapus: " + pesanError(r2.error));
    setFokus(null);
    setVersi((v) => v + 1);
  }

  const FILTER_STATUS: { v: "semua" | Status; label: string }[] = [
    { v: "semua", label: "Semua" },
    { v: "berlangsung", label: "Berlangsung" },
    { v: "akan_datang", label: "Akan datang" },
    { v: "berakhir", label: "Berakhir" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Promo</h1>
        <Link href="/admin/promo/new" className="btn btn-primary">
          <Plus className="size-4" /> Tambah promo
        </Link>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat data: {error}</p>}

      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Memuat data">
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-line" />
            ))}
          </div>
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Kartu ringkasan */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <div className="text-xs font-medium text-muted">Promo berlangsung</div>
              <div className="text-3xl font-extrabold">{ringkas.jumlahBerlangsung}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-medium text-muted">Berakhir ≤ 3 hari</div>
              <div className={`text-3xl font-extrabold ${ringkas.jumlahSegera > 0 ? "text-orange-600" : ""}`}>
                {ringkas.jumlahSegera}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-medium text-muted">Update terakhir</div>
              <div className="text-lg font-extrabold">{formatWaktu(ringkas.terakhir)}</div>
            </div>
          </div>

          {/* Banner: hanya muncul kalau ada yang perlu perhatian */}
          {ringkas.banners.length > 0 && (
            <div className="space-y-2">
              {ringkas.banners.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => klikBanner(b.teks, b.ids)}
                  disabled={!b.ids}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium ${WARNA_BANNER[b.warna]} ${
                    b.ids ? "cursor-pointer hover:brightness-95" : "cursor-default"
                  }`}
                >
                  <span>{b.teks}</span>
                  {b.ids && <ChevronRight className="size-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {fokus && (
            <div className="card flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">Menampilkan: {fokus.label}</span>
              <button onClick={() => setFokus(null)} className="shrink-0 cursor-pointer font-semibold underline">
                Tampilkan semua
              </button>
            </div>
          )}

          <SearchBar value={q} onChange={setQ} placeholder="Cari kategori, department, deskripsi, zona…" />

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FILTER_STATUS.map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => setFilter(f.v)}
                className={`chip ${filter === f.v ? "chip-aktif" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="card p-8 text-center text-muted">Tidak ada promo.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-page text-muted">
                      {r.gambar_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gambarUrl(r.gambar_path)} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageOff className="size-6" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                          style={latar(r.kat?.warna ?? "#6b7280")}
                        >
                          {r.kategori}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>
                      <p className="line-clamp-2 whitespace-pre-line font-semibold leading-snug">
                        {r.deskripsi ?? "(tanpa deskripsi)"}
                      </p>
                      <p className="text-xs text-muted">
                        {r.zonaText} · {r.department ?? "tanpa department"}
                      </p>
                      <p className="text-xs text-muted">
                        {formatTanggal(r.mulai)} – {r.berakhir ? formatTanggal(r.berakhir) : "persediaan habis"}
                      </p>
                      <p className="text-[11px] text-muted">
                        Update {formatWaktu(r.updated_at)}
                        {r.updated_by ? ` oleh ${r.updated_by}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col">
                    <Link href={`/admin/promo/${r.id}`} className="btn btn-ghost flex-1">
                      <Pencil className="size-4" /> Edit
                    </Link>
                    <button type="button" onClick={() => hapus(r.id, r.kategori)} className="btn btn-danger flex-1">
                      <Trash2 className="size-4" /> Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}