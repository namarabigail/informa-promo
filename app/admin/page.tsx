"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-browser";
import {
  formatTanggal,
  formatWaktu,
  gambarUrl,
  pesanError,
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

function selisihHari(a: Date | string, b: Date | string) {
  const toDay = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return NaN;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const start = toDay(a);
  const end = toDay(b);

  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

const URUTAN: Record<Status, number> = { berlangsung: 0, akan_datang: 1, berakhir: 2 };

const WARNA_BANNER = {
  merah: "bg-red-50 border-red-300 text-red-800",
  oranye: "bg-orange-50 border-orange-300 text-orange-800",
  biru: "bg-blue-50 border-blue-300 text-blue-800",
  abu: "bg-gray-100 border-gray-300 text-gray-700",
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

  const load = useCallback(async () => {
    const sb = getSupabase();
    const [a, b, c, d] = await Promise.all([
      sb.from("promo").select("id,kategori,department,deskripsi,mulai,berakhir,gambar_path,updated_by,updated_at"),
      sb.from("kategori").select("nama,warna,urutan"),
      sb.from("zona").select("id,nama,urutan").order("urutan"),
      sb.from("promo_zona").select("promo_id,zona_id"),
    ]);
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      const status = statusPromo(p, today);
      return {
        ...p,
        kat: katMap.get(p.kategori),
        zonaText: zonaNama.length ? zonaNama.join(", ") : "Semua Zona",
        status,
        // sisa hari sampai berakhir (hanya untuk yang punya tanggal berakhir)
        sisa: p.berakhir ? selisihHari(today, p.berakhir) : null,
        // berapa hari lagi mulai (hanya relevan untuk akan_datang)
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
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Dashboard Promo</h1>
        <Link href="/admin/promo/new" className="bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
          + Tambah promo
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Gagal memuat data: {error}</p>}
      {loading && <p className="text-gray-500">Memuat...</p>}

      {!loading && !error && (
        <>
          {/* Kartu ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-gray-500">Promo berlangsung</div>
              <div className="text-2xl font-bold">{ringkas.jumlahBerlangsung}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-gray-500">Berakhir ≤ 3 hari</div>
              <div className={`text-2xl font-bold ${ringkas.jumlahSegera > 0 ? "text-orange-600" : ""}`}>
                {ringkas.jumlahSegera}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-gray-500">Update terakhir</div>
              <div className="text-lg font-bold">{formatWaktu(ringkas.terakhir)}</div>
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
                  className={`w-full text-left border rounded-lg px-4 py-2 text-sm ${WARNA_BANNER[b.warna]} ${
                    b.ids ? "cursor-pointer hover:brightness-95" : "cursor-default"
                  }`}
                >
                  {b.teks}
                  {b.ids && <span className="underline ml-2">Lihat</span>}
                </button>
              ))}
            </div>
          )}

          {fokus && (
            <div className="flex items-center justify-between gap-3 bg-white border rounded-lg px-4 py-2 text-sm">
              <span>Menampilkan: {fokus.label}</span>
              <button onClick={() => setFokus(null)} className="text-blue-700 underline whitespace-nowrap">
                Tampilkan semua
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kategori, department, deskripsi, zona..."
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px] bg-white"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "semua" | Status)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="semua">Semua status</option>
              <option value="berlangsung">Berlangsung</option>
              <option value="akan_datang">Akan datang</option>
              <option value="berakhir">Berakhir</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Gambar</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Deskripsi</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">Tidak ada promo.</td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3">
                      {r.gambar_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gambarUrl(r.gambar_path)} alt="" className="w-16 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-12 rounded bg-gray-200 text-[10px] text-gray-500 flex items-center justify-center">
                          Belum ada
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs text-white whitespace-nowrap"
                        style={{ background: r.kat?.warna ?? "#6b7280" }}
                      >
                        {r.kategori}
                      </span>
                    </td>
                    <td className="p-3">{r.zonaText}</td>
                    <td className="p-3">{r.department ?? "-"}</td>
                    <td className="p-3 whitespace-pre-line max-w-xs">{r.deskripsi ?? "-"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {formatTanggal(r.mulai)}
                      <br />s/d {r.berakhir ? formatTanggal(r.berakhir) : "persediaan habis"}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_CLASS[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      <div className="text-[11px] text-gray-500 mt-1 whitespace-nowrap">
                        Update {formatWaktu(r.updated_at)}
                        {r.updated_by ? ` oleh ${r.updated_by}` : ""}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap space-x-3">
                      <Link href={`/admin/promo/${r.id}`} className="text-blue-700 underline">Edit</Link>
                      <button onClick={() => hapus(r.id, r.kategori)} className="text-red-600 underline">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}