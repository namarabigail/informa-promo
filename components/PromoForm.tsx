"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import { BUCKET, gambarUrl, pesanError, type Kategori, type Zona } from "@/lib/admin";

const MAKS_MB = 3;

// Form tambah (tanpa promoId) dan edit (dengan promoId).
export default function PromoForm({ promoId }: { promoId?: string }) {
  const router = useRouter();

  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [zonaList, setZonaList] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [kategoriId, setKategoriId] = useState("");
  const [department, setDepartment] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [mulai, setMulai] = useState("");
  const [berakhir, setBerakhir] = useState("");
  const [zonaIds, setZonaIds] = useState<number[]>([]);
  const [gambarLama, setGambarLama] = useState<string | null>(null);
  const [hapusGambar, setHapusGambar] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const sb = getSupabase();
      const [k, z] = await Promise.all([
        sb.from("kategori").select("nama,warna,urutan").order("urutan"),
        sb.from("zona").select("id,nama,aktif,urutan").order("urutan"),
      ]);
      if (k.error || z.error) {
        setError(pesanError(k.error || z.error));
        setLoading(false);
        return;
      }
      setKategoriList((k.data ?? []) as Kategori[]);
      setZonaList((z.data ?? []) as Zona[]);

      if (promoId) {
        const [p, pz] = await Promise.all([
          sb.from("promo").select("*").eq("id", promoId).single(),
          sb.from("promo_zona").select("zona_id").eq("promo_id", promoId),
        ]);
        if (p.error || !p.data) {
          setError("Promo tidak ditemukan. " + pesanError(p.error));
          setLoading(false);
          return;
        }
        setKategoriId(p.data.kategori ?? "");
        setDepartment(p.data.department ?? "");
        setDeskripsi(p.data.deskripsi ?? "");
        setMulai(p.data.mulai ?? "");
        setBerakhir(p.data.berakhir ?? "");
        setGambarLama(p.data.gambar_path ?? null);
        setZonaIds((pz.data ?? []).map((x: { zona_id: number }) => x.zona_id));
      }
      setLoading(false);
    }
    init();
  }, [promoId]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function toggleZona(id: number) {
    setZonaIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function pilihFile(f: File | null) {
    setError("");
    if (!f) return setFile(null);
    if (!f.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (f.size > MAKS_MB * 1024 * 1024) {
      setError(`Ukuran gambar maksimal ${MAKS_MB} MB.`);
      return;
    }
    setFile(f);
    setHapusGambar(false);
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const kat = kategoriList.find((k) => k.nama === kategoriId);
    if (!kat) return setError("Pilih kategori dulu.");
    if (!mulai) return setError("Tanggal mulai wajib diisi.");
    if (berakhir && berakhir < mulai) return setError("Tanggal berakhir tidak boleh sebelum tanggal mulai.");

    setSaving(true);
    try {
      const sb = getSupabase();

      let gambar_path: string | null = hapusGambar ? null : gambarLama;
      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const dasar = file.name
          .replace(/\.[^.]+$/, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40);
        const nama = `${Date.now()}-${dasar || "promo"}.${ext || "jpg"}`;
        const up = await sb.storage.from(BUCKET).upload(nama, file, { contentType: file.type });
        if (up.error) throw up.error;
        gambar_path = nama;
      }

      const { data: auth } = await sb.auth.getUser();
      const payload = {
        kategori: kat.nama,
        department: department.trim() || null,
        deskripsi: deskripsi.trim() || null,
        mulai,
        berakhir: berakhir || null,
        gambar_path,
        updated_by: auth.user?.email?.split("@")[0] ?? null,
        updated_at: new Date().toISOString(),
      };

      let id = promoId;
      if (promoId) {
        const r = await sb.from("promo").update(payload).eq("id", promoId);
        if (r.error) throw r.error;
      } else {
        const r = await sb.from("promo").insert(payload).select("id").single();
        if (r.error) throw r.error;
        id = r.data.id;
      }

      // Zona: hapus semua lalu isi ulang. Kosong = "Semua Zona".
      const del = await sb.from("promo_zona").delete().eq("promo_id", id!);
      if (del.error) throw del.error;
      if (zonaIds.length > 0) {
        const ins = await sb
          .from("promo_zona")
          .insert(zonaIds.map((zona_id) => ({ promo_id: id!, zona_id })));
        if (ins.error) throw ins.error;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("Gagal menyimpan: " + pesanError(err));
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  const gambarTampil = preview ?? (!hapusGambar && gambarLama ? gambarUrl(gambarLama) : null);

  return (
    <form onSubmit={simpan} className="bg-white rounded-xl shadow p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold">{promoId ? "Edit promo" : "Tambah promo"}</h1>

      <div className="space-y-1">
        <label className="text-sm font-medium">Kategori <span className="text-red-600">*</span></label>
        <select
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Pilih kategori...</option>
          {kategoriList.map((k) => (
            <option key={k.nama} value={k.nama}>{k.nama}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Mulai <span className="text-red-600">*</span></label>
          <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} required className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Berakhir</label>
          <input type="date" value={berakhir} onChange={(e) => setBerakhir(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <p className="text-xs text-gray-500">Kosong = &quot;Selama persediaan masih ada&quot;.</p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Zona</label>
        <div className="flex flex-wrap gap-2">
          {zonaList.filter((z) => z.aktif !== false || zonaIds.includes(z.id)).map((z) => (
            <label
              key={z.id}
              className={`border rounded-full px-3 py-1 text-sm cursor-pointer select-none ${
                zonaIds.includes(z.id) ? "bg-blue-700 text-white border-blue-700" : "bg-white"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={zonaIds.includes(z.id)} onChange={() => toggleZona(z.id)} />
              {z.nama}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {zonaIds.length === 0 ? "Tidak ada yang dipilih: promo tampil di SEMUA zona." : "Promo hanya tampil di zona yang dipilih."}
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Department</label>
        <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="contoh: BA - Sofa and Chair" className="w-full border rounded-lg px-3 py-2" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Deskripsi</label>
        <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2" />
        <p className="text-xs text-gray-500">Isi deskripsi agar promo mudah dicari.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Gambar</label>
        {gambarTampil && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gambarTampil} alt="Pratinjau" className="w-full max-w-xs rounded-lg border" />
        )}
        <input type="file" accept="image/*" onChange={(e) => pilihFile(e.target.files?.[0] ?? null)} className="block text-sm" />
        {gambarLama && !file && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hapusGambar} onChange={(e) => setHapusGambar(e.target.checked)} />
            Hapus gambar saat ini
          </label>
        )}
        <p className="text-xs text-gray-500">Maksimal {MAKS_MB} MB. Kalau kosong, web memakai placeholder berwarna.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-blue-700 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-60">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <Link href="/admin" className="border rounded-lg px-5 py-2">Batal</Link>
      </div>
    </form>
  );
}