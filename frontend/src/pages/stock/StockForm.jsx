import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, AccessDenied } from "@/components/common";
import { PhotoUploader } from "@/components/PhotoUploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SATUAN } from "@/lib/helpers";
import { PackagePlus, ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const STOCK_CATEGORIES = ["ATK", "Kertas", "Tinta Printer", "Toner", "Peralatan Kebersihan", "Barang Elektronik", "Perlengkapan Kantor", "Lainnya"];

export default function StockForm() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    item_code: "", item_name: "", category: "ATK", unit: "Unit",
    initial_stock: 0, minimum_stock: 0, storage_location: "", description: "",
  });

  useEffect(() => {
    if (!can("stock_manage") || !isEdit) return;
    api.get(`/stock/items/${id}`).then(({ data }) => {
      setForm({
        item_code: data.item_code || "",
        item_name: data.item_name || "",
        category: data.category || "ATK",
        unit: data.unit || "Unit",
        initial_stock: data.initial_stock || 0,
        minimum_stock: data.minimum_stock || 0,
        storage_location: data.storage_location || "",
        description: data.description || "",
      });
      setLoading(false);
    }).catch(() => { toast.error("Gagal memuat data"); navigate("/persediaan/stock/items"); });
  }, [id, isEdit, navigate, can]);

  if (!can("stock_manage")) return <AccessDenied />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_code.trim() || !form.item_name.trim()) {
      return toast.error("Kode dan nama barang wajib diisi");
    }
    setBusy(true);
    try {
      let itemId = id;
      if (isEdit) {
        await api.put(`/stock/items/${id}`, {
          item_code: form.item_code, item_name: form.item_name,
          category: form.category, unit: form.unit,
          minimum_stock: form.minimum_stock, storage_location: form.storage_location,
          description: form.description,
        });
        toast.success("Barang berhasil diperbarui");
      } else {
        const { data } = await api.post("/stock/items", form);
        itemId = data.id;
        toast.success("Barang berhasil ditambahkan");
      }
      // Upload photos if any
      if (photos.length > 0 && itemId) {
        const fd = new FormData();
        photos.forEach((p) => fd.append("files", p.file));
        await api.post(`/stock/items/${itemId}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      navigate("/persediaan/stock/items");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan");
    } finally { setBusy(false); }
  };

  if (loading) return <Loading />;

  return (
    <div data-testid="stock-form-page">
      <PageHeader
        title={isEdit ? "Edit Barang Persediaan" : "Tambah Barang Persediaan"}
        description={isEdit ? "Ubah informasi barang" : "Tambahkan barang persediaan baru"}
        icon={PackagePlus}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>}
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-4">Informasi Barang</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Kode Barang *</Label>
              <Input data-testid="stock-item-code" value={form.item_code} onChange={(e) => setForm({ ...form, item_code: e.target.value })} placeholder="cth: ATK-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Barang *</Label>
              <Input data-testid="stock-item-name" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="cth: Kertas A4 80gsm" />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="stock-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Satuan</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger data-testid="stock-unit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SATUAN.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Stok Awal</Label>
                <Input data-testid="stock-initial" type="number" min="0" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Stok Minimum</Label>
              <Input data-testid="stock-minimum" type="number" min="0" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Lokasi Penyimpanan</Label>
              <Input data-testid="stock-location" value={form.storage_location} onChange={(e) => setForm({ ...form, storage_location: e.target.value })} placeholder="cth: Gudang A, Rak 3" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Keterangan</Label>
              <Textarea data-testid="stock-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan tambahan..." rows={2} />
            </div>
          </div>
        </Card>

        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-4">Foto Barang</h3>
          <p className="text-sm text-muted-foreground mb-3">Foto bersifat opsional tetapi sangat disarankan.</p>
          <PhotoUploader files={photos} setFiles={setPhotos} label="Unggah Foto Barang" />
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" disabled={busy} data-testid="stock-save-btn">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {isEdit ? "Simpan Perubahan" : "Tambah Barang"}
          </Button>
        </div>
      </form>
    </div>
  );
}
