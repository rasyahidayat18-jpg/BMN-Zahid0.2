import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { imageUrl } from "@/lib/api";
import { PageHeader, Loading } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhotoUploader } from "@/components/PhotoUploader";
import { KONDISI } from "@/lib/helpers";
import { PackagePlus, ArrowLeft, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { nama_barang: "", kode_barang: "", nup: "", merk_tipe: "", tahun_perolehan: "", nilai_perolehan: 0, kondisi: "Baik", lokasi: "", penanggung_jawab: "", penanggung_jawab_id: null, status: "Aktif", keterangan: "", jenis_aset: "Umum", nomor_polisi: "", nomor_rangka: "", nomor_mesin: "", jenis_kendaraan: "", tahun_kendaraan: "" };

export default function AssetForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]); // new uploads
  const [existing, setExisting] = useState([]); // existing images {id,is_primary}
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!editing);

  useEffect(() => {
    api.get("/meta/locations").then((r) => setLocations(r.data));
    api.get("/users/options").then((r) => setUsers(r.data)).catch(() => {});
    if (editing) {
      api.get(`/assets/${id}`).then((r) => { setForm({ ...EMPTY, ...r.data }); setExisting(r.data.images || []); setLoaded(true); }).catch(() => { toast.error("Aset tidak ditemukan"); navigate("/aset"); });
    }
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadNew = async (assetId) => {
    if (files.length === 0) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f.file));
    await api.post(`/assets/${assetId}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  };

  const submit = async () => {
    if (!form.nama_barang.trim()) return toast.error("Nama barang wajib diisi");
    setBusy(true);
    try {
      let assetId = id;
      if (editing) {
        await api.put(`/assets/${id}`, form);
      } else {
        const { data } = await api.post("/assets", form);
        assetId = data.id;
      }
      await uploadNew(assetId);
      toast.success(editing ? "Aset diperbarui" : "Aset ditambahkan");
      navigate(`/aset/${assetId}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal menyimpan"); } finally { setBusy(false); }
  };

  const setPrimary = async (imgId) => { const { data } = await api.put(`/assets/${id}/images/${imgId}/primary`); setExisting(data); };
  const removeExisting = async (imgId) => { const { data } = await api.delete(`/assets/${id}/images/${imgId}`); setExisting(data); };

  if (!loaded) return <Loading />;
  const isVehicle = form.jenis_aset === "Kendaraan";

  return (
    <div>
      <PageHeader title={editing ? "Edit Aset" : "Tambah Aset BMN"} description="Lengkapi informasi aset dan unggah foto" icon={PackagePlus}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">Informasi Utama</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2"><Label>Nama Barang *</Label><Input data-testid="asset-nama-input" value={form.nama_barang} onChange={(e) => set("nama_barang", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Kode Barang</Label><Input value={form.kode_barang} onChange={(e) => set("kode_barang", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>NUP</Label><Input value={form.nup} onChange={(e) => set("nup", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Merk / Tipe</Label><Input value={form.merk_tipe} onChange={(e) => set("merk_tipe", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Tahun Perolehan</Label><Input value={form.tahun_perolehan} onChange={(e) => set("tahun_perolehan", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Nilai Perolehan (Rp)</Label><Input type="number" value={form.nilai_perolehan} onChange={(e) => set("nilai_perolehan", parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1.5"><Label>Jenis Aset</Label>
                <Select value={form.jenis_aset} onValueChange={(v) => set("jenis_aset", v)}><SelectTrigger data-testid="asset-jenis-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Umum">Umum</SelectItem><SelectItem value="Kendaraan">Kendaraan</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Kondisi</Label>
                <Select value={form.kondisi} onValueChange={(v) => set("kondisi", v)}><SelectTrigger data-testid="asset-kondisi-select"><SelectValue /></SelectTrigger><SelectContent>{KONDISI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Lokasi</Label>
                <Select value={form.lokasi || undefined} onValueChange={(v) => set("lokasi", v)}><SelectTrigger data-testid="asset-lokasi-select"><SelectValue placeholder="Pilih lokasi" /></SelectTrigger><SelectContent>{locations.map((l) => <SelectItem key={l.id} value={l.nama}>{l.nama}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Penanggung Jawab</Label>
                <Select value={form.penanggung_jawab_id || "none"} onValueChange={(v) => { if (v === "none") { set("penanggung_jawab_id", null); set("penanggung_jawab", ""); } else { const u = users.find((x) => x.id === v); set("penanggung_jawab_id", v); set("penanggung_jawab", u?.nama_lengkap || ""); } }}>
                  <SelectTrigger data-testid="asset-pj-select"><SelectValue placeholder="Pilih penanggung jawab" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">- Tidak ada -</SelectItem>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.nama_lengkap} ({u.role})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status Aset</Label><Input value={form.status} onChange={(e) => set("status", e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Keterangan</Label><Textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} /></div>
            </div>
          </Card>

          {isVehicle && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">Informasi Kendaraan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Nomor Polisi</Label><Input data-testid="asset-nopol-input" value={form.nomor_polisi} onChange={(e) => set("nomor_polisi", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Jenis Kendaraan</Label><Input value={form.jenis_kendaraan} onChange={(e) => set("jenis_kendaraan", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Nomor Rangka</Label><Input value={form.nomor_rangka} onChange={(e) => set("nomor_rangka", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Nomor Mesin</Label><Input value={form.nomor_mesin} onChange={(e) => set("nomor_mesin", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Tahun Kendaraan</Label><Input value={form.tahun_kendaraan} onChange={(e) => set("tahun_kendaraan", e.target.value)} /></div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">Foto Aset</h3>
            {editing && existing.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Foto tersimpan</p>
                <div className="grid grid-cols-3 gap-2">
                  {existing.map((img) => (
                    <div key={img.id} className="relative rounded-lg border overflow-hidden group aspect-square bg-muted">
                      <img src={imageUrl(img.id)} alt="" className="h-full w-full object-cover" />
                      {img.is_primary && <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-primary">Sampul</Badge>}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.is_primary && <button onClick={() => setPrimary(img.id)} className="text-white"><Star className="h-3.5 w-3.5" /></button>}
                        <button onClick={() => removeExisting(img.id)} className="text-white ml-auto"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <PhotoUploader files={files} setFiles={setFiles} label={editing ? "Tambah Foto Baru" : "Unggah Foto Aset"} />
          </Card>
          <Button className="w-full" onClick={submit} disabled={busy} data-testid="asset-save-button">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editing ? "Simpan Perubahan" : "Simpan Aset"}</Button>
        </div>
      </div>
    </div>
  );
}
