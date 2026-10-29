"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  function toggleZona(id: number) {
    setZonaIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  // Pratinjau dibuat di handler (bukan di effect): baca file jadi data URL
  function setFileDanPreview(f: File | null) {
    setFile(f);
    if (!f) {
      setPreview(null);
      return;
    }
    const fr = new FileReader();
    fr.onload = () => setPreview(typeof fr.result === "string" ? fr.result : null);
    fr.readAsDataURL(f);
  }

  function pilihFile(f: File | null) {
    setError("");
    if (!f) return setFileDanPreview(null);
    if (!f.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (f.size > MAKS_MB * 1024 * 1024) {
      setError(`Ukuran gambar maksimal ${MAKS_MB} MB.`);
      return;
    }
    setFileDanPreview(f);
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

  if (loading) {
    return (
      <div className="max-w-2xl space-y-3" aria-busy="true" aria-label="Memuat form">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-line" />
        <div className="h-72 animate-pulse rounded-2xl bg-line" />
      </div>
    );
  }

  const gambarTampil = preview ?? (!hapusGambar && gambarLama ? gambarUrl(gambarLama) : null);

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Kembali ke dashboard
      </Link>

      <form onSubmit={simpan} className="card space-y-5 p-5 sm:p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{promoId ? "Edit promo" : "Tambah promo"}</h1>

        <div>
          <label className="label" htmlFor="kategori">
            Kategori <span className="text-red-600">*</span>
          </label>
          <select
            id="kategori"
            value={kategoriId}
            onChange={(e) => setKategoriId(e.target.value)}
            required
            className="input"
          >
            <option value="">Pilih kategori...</option>
            {kategoriList.map((k) => (
              <option key={k.nama} value={k.nama}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mulai">
              Mulai <span className="text-red-600">*</span>
            </label>
            <input id="mulai" type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="berakhir">
              Berakhir
            </label>
            <input id="berakhir" type="date" value={berakhir} onChange={(e) => setBerakhir(e.target.value)} className="input" />
            <p className="hint">Kosong = &quot;Selama persediaan masih ada&quot;.</p>
          </div>
        </div>

        <div>
          <span className="label">Zona</span>
          <div className="flex flex-wrap gap-2">
            {zonaList
              .filter((z) => z.aktif !== false || zonaIds.includes(z.id))
              .map((z) => (
                <label
                  key={z.id}
                  className={`chip select-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${
                    zonaIds.includes(z.id) ? "chip-aktif" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={zonaIds.includes(z.id)}
                    onChange={() => toggleZona(z.id)}
                  />
                  {z.nama}
                </label>
              ))}
          </div>
          <p className="hint">
            {zonaIds.length === 0
              ? "Tidak ada yang dipilih: promo tampil di SEMUA zona."
              : "Promo hanya tampil di zona yang dipilih."}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="department">
            Department
          </label>
          <input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="contoh: BA - Sofa and Chair"
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="deskripsi">
            Deskripsi
          </label>
          <textarea
            id="deskripsi"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={4}
            className="input"
          />
          <p className="hint">Isi deskripsi agar promo mudah dicari.</p>
        </div>

        <div>
          <label className="label" htmlFor="gambar">
            Gambar
          </label>
          {gambarTampil && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gambarTampil}
              alt="Pratinjau"
              className="mb-3 max-h-64 w-auto max-w-full rounded-xl border border-line object-contain"
            />
          )}
          <input
            id="gambar"
            type="file"
            accept="image/*"
            onChange={(e) => pilihFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {gambarLama && !file && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={hapusGambar}
                onChange={(e) => setHapusGambar(e.target.checked)}
              />
              Hapus gambar saat ini
            </label>
          )}
          <p className="hint">Maksimal {MAKS_MB} MB. Kalau kosong, web memakai tampilan berwarna sesuai kategori.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <Link href="/admin" className="btn btn-ghost">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}