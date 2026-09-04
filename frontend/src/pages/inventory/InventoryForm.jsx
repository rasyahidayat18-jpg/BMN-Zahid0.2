import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SATUAN } from "@/lib/helpers";
import { ClipboardList, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InventoryForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [header, setHeader] = useState({ unit: user?.unit || "", tanggal_permintaan: new Date().toISOString().slice(0, 10), catatan: "" });
  const [items, setItems] = useState([{ nama_barang: "", jumlah: 1, satuan: "Unit", keperluan: "" }]);

  const setItem = (i, k, v) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addRow = () => setItems((arr) => [...arr, { nama_barang: "", jumlah: 1, satuan: "Unit", keperluan: "" }]);
  const removeRow = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const submit = async (asDraft) => {
    const valid = items.filter((it) => it.nama_barang.trim());
    if (valid.length === 0) return toast.error("Isi minimal satu barang");
    setBusy(true);
    try {
      const { data } = await api.post("/inventory", { ...header, items: valid, submit: !asDraft });
      toast.success(asDraft ? "Disimpan sebagai draft" : "Permintaan terkirim");
      navigate(`/persediaan/${data.id}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Ajukan Permintaan Barang" description="Buat permintaan kebutuhan barang persediaan" icon={ClipboardList}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>} />

      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-4">Informasi Permintaan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Pemohon</Label><Input value={user?.nama_lengkap} disabled /></div>
          <div className="space-y-1.5"><Label>Role / Jabatan</Label><Input value={user?.role} disabled /></div>
          <div className="space-y-1.5"><Label>Unit / Subsi</Label><Input value={header.unit} onChange={(e) => setHeader({ ...header, unit: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Tanggal Permintaan</Label><Input type="date" value={header.tanggal_permintaan} onChange={(e) => setHeader({ ...header, tanggal_permintaan: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Catatan</Label><Input value={header.catatan} onChange={(e) => setHeader({ ...header, catatan: e.target.value })} /></div>
        </div>
      </Card>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Daftar Barang</h3><Button size="sm" variant="secondary" onClick={addRow} data-testid="add-item-button"><Plus className="h-4 w-4 mr-1.5" /> Tambah Baris</Button></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Nama Barang</TableHead><TableHead className="w-28">Jumlah</TableHead><TableHead className="w-36">Satuan</TableHead><TableHead>Keperluan</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell><Input data-testid={`item-nama-${i}`} value={it.nama_barang} onChange={(e) => setItem(i, "nama_barang", e.target.value)} placeholder="cth: Kertas A4" /></TableCell>
                  <TableCell><Input type="number" min="1" value={it.jumlah} onChange={(e) => setItem(i, "jumlah", parseFloat(e.target.value) || 1)} /></TableCell>
                  <TableCell><Select value={it.satuan} onValueChange={(v) => setItem(i, "satuan", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SATUAN.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell><Input value={it.keperluan} onChange={(e) => setItem(i, "keperluan", e.target.value)} placeholder="Untuk kegiatan..." /></TableCell>
                  <TableCell>{items.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeRow(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => submit(true)} disabled={busy}>Simpan Draft</Button>
        <Button onClick={() => submit(false)} disabled={busy} data-testid="inventory-submit-button">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ajukan Permintaan</Button>
      </div>
    </div>
  );
}
