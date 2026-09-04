import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, AccessDenied } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function StockAdjustment() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    item_id: "", physical_stock: 0, adjustment_type: "Penambahan Stok",
    reason: "", notes: "",
  });

  useEffect(() => {
    if (!can("stock_manage")) return;
    api.get("/stock/items", { params: { per_page: 1000 } }).then(({ data }) => setItems(data.items || []));
  }, [can]);

  if (!can("stock_manage")) return <AccessDenied />;

  const selectedItem = items.find((i) => i.id === form.item_id);
  const systemStock = selectedItem?.current_stock || 0;
  const diff = form.physical_stock - systemStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id) return toast.error("Pilih barang terlebih dahulu");
    if (!form.reason.trim()) return toast.error("Alasan penyesuaian wajib diisi");
    if (form.physical_stock === systemStock) return toast.error("Stok fisik sama dengan stok sistem, tidak ada perubahan");
    setBusy(true);
    try {
      const { data } = await api.post("/stock/adjustments", form);
      toast.success(`Penyesuaian stok berhasil. Stok: ${data.stock_before} → ${data.stock_after}`);
      navigate("/persediaan/stock/history");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan penyesuaian");
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="stock-adjustment-page">
      <PageHeader
        title="Penyesuaian Stok"
        description="Koreksi stok berdasarkan hasil pemeriksaan fisik"
        icon={RotateCcw}
        actions={<Button variant="secondary" onClick={() => navigate("/persediaan/stock")}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>}
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-4">Form Penyesuaian Stok</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Pilih Barang *</Label>
              <Select value={form.item_id} onValueChange={(v) => {
                const it = items.find((i) => i.id === v);
                setForm({ ...form, item_id: v, physical_stock: it?.current_stock || 0 });
              }}>
                <SelectTrigger data-testid="adj-item-select"><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>{it.item_code} - {it.item_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stok Sistem</Label>
              <Input value={systemStock} disabled />
              {selectedItem && <p className="text-xs text-muted-foreground">{selectedItem.unit}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stok Fisik *</Label>
              <Input data-testid="adj-physical" type="number" min="0" step="any" value={form.physical_stock} onChange={(e) => setForm({ ...form, physical_stock: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Selisih</Label>
              <Input value={selectedItem ? `${diff >= 0 ? "+" : ""}${diff} ${selectedItem.unit}` : "-"} disabled
                className={diff > 0 ? "text-emerald-700" : diff < 0 ? "text-rose-700" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Penyesuaian</Label>
              <Select value={form.adjustment_type} onValueChange={(v) => setForm({ ...form, adjustment_type: v })}>
                <SelectTrigger data-testid="adj-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Penambahan Stok">Penambahan Stok</SelectItem>
                  <SelectItem value="Pengurangan Stok">Pengurangan Stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Alasan Penyesuaian *</Label>
              <Input data-testid="adj-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="cth: Selisih stock opname" />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>Catatan</Label>
              <Textarea data-testid="adj-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." rows={2} />
            </div>
          </div>

          {selectedItem && diff !== 0 && (
            <div className={`mt-6 rounded-lg p-4 border ${diff > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-sm font-medium ${diff > 0 ? "text-emerald-800" : "text-amber-800"}`}>Ringkasan Penyesuaian:</p>
              <p className={`text-sm mt-1 ${diff > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                Stok sistem: <b>{systemStock} {selectedItem.unit}</b> → Stok fisik: <b>{form.physical_stock} {selectedItem.unit}</b>
                {" "}(Selisih: <b>{diff >= 0 ? "+" : ""}{diff}</b>)
              </p>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" disabled={busy} data-testid="adj-submit-btn">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Simpan Penyesuaian
          </Button>
        </div>
      </form>
    </div>
  );
}
