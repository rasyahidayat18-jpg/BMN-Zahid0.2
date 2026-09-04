import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, Loading } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUploader } from "@/components/PhotoUploader";
import { Wrench, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const JENIS_PEMELIHARAAN = ["Servis Rutin", "Perbaikan", "Penggantian Suku Cadang", "Perawatan Berkala", "Lainnya"];

export default function MaintenanceForm() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ asset_id: "", asset_name: "", nomor_polisi: "", penanggung_jawab: "", jenis_pemeliharaan: "", jenis_kerusakan: "", deskripsi_kerusakan: "", tanggal_pengajuan: new Date().toISOString().slice(0, 10), perkiraan_biaya: 0, catatan: "" });

  useEffect(() => { api.get("/assets").then((r) => setAssets(r.data)).catch(() => {}); }, []);

  const pickAsset = (id) => {
    const a = assets.find((x) => x.id === id);
    setForm((f) => ({ ...f, asset_id: id, asset_name: a?.nama_barang || "", nomor_polisi: a?.nomor_polisi || "", penanggung_jawab: a?.penanggung_jawab || "" }));
  };

  const submit = async (asDraft) => {
    if (!form.asset_name) return toast.error("Pilih aset/kendaraan terlebih dahulu");
    setBusy(true);
    try {
      const { data } = await api.post("/maintenance", { ...form, submit: !asDraft });
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f.file));
        await api.post(`/maintenance/${data.id}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success(asDraft ? "Disimpan sebagai draft" : "Pengajuan pemeliharaan terkirim");
      navigate(`/pemeliharaan/${data.id}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Ajukan Pemeliharaan" description="Buat pengajuan pemeliharaan kendaraan atau aset" icon={Wrench}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">Detail Pengajuan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2"><Label>Aset / Kendaraan *</Label>
                <Select value={form.asset_id || undefined} onValueChange={pickAsset}><SelectTrigger data-testid="maint-asset-select"><SelectValue placeholder="Pilih aset/kendaraan" /></SelectTrigger>
                  <SelectContent>{assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.nama_barang} {a.nomor_polisi ? `(${a.nomor_polisi})` : ""}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Nomor Polisi</Label><Input value={form.nomor_polisi} onChange={(e) => setForm({ ...form, nomor_polisi: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Penanggung Jawab</Label><Input value={form.penanggung_jawab} onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Jenis Pemeliharaan</Label>
                <Select value={form.jenis_pemeliharaan || undefined} onValueChange={(v) => setForm({ ...form, jenis_pemeliharaan: v })}><SelectTrigger data-testid="maint-jenis-select"><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                  <SelectContent>{JENIS_PEMELIHARAAN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Jenis Kerusakan</Label><Input value={form.jenis_kerusakan} onChange={(e) => setForm({ ...form, jenis_kerusakan: e.target.value })} placeholder="cth: Mesin, Ban, AC" /></div>
              <div className="space-y-1.5"><Label>Tanggal Pengajuan</Label><Input type="date" value={form.tanggal_pengajuan} onChange={(e) => setForm({ ...form, tanggal_pengajuan: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Perkiraan Biaya (Rp)</Label><Input type="number" value={form.perkiraan_biaya} onChange={(e) => setForm({ ...form, perkiraan_biaya: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Deskripsi Kerusakan</Label><Textarea data-testid="maint-deskripsi-input" value={form.deskripsi_kerusakan} onChange={(e) => setForm({ ...form, deskripsi_kerusakan: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Catatan</Label><Textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} /></div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5 space-y-3"><h3 className="font-semibold">Foto Kerusakan</h3><PhotoUploader files={files} setFiles={setFiles} label="Unggah Foto Kerusakan" /></Card>
          <div className="flex flex-col gap-2">
            <Button onClick={() => submit(false)} disabled={busy} data-testid="maint-submit-button">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ajukan Sekarang</Button>
            <Button variant="secondary" onClick={() => submit(true)} disabled={busy}>Simpan sebagai Draft</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
