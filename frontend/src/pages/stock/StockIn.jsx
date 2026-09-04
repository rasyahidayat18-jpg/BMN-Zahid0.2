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
import { ArrowDownToLine, ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function StockIn() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    item_id: "", quantity: 1, source: "", document_number: "", notes: "",
    tanggal: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!can("stock_manage")) return;
    api.get("/stock/items", { params: { per_page: 1000 } }).then(({ data }) => setItems(data.items || []));
  }, [can]);

  if (!can("stock_manage")) return <AccessDenied />;

  const selectedItem = items.find((i) => i.id === form.item_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id) return toast.error("Pilih barang terlebih dahulu");
    if (form.quantity <= 0) return toast.error("Jumlah harus lebih dari 0");
    setBusy(true);
    try {
      const { data } = await api.post("/stock/transactions/in", form);
      toast.success(`Barang masuk berhasil dicatat. Stok: ${data.stock_before} → ${data.stock_after}`);
      navigate("/persediaan/stock/history");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mencatat barang masuk");
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="stock-in-page">
      <PageHeader
        title="Tambah Barang Masuk"
        description="Catat penerimaan barang ke dalam stok"
        icon={ArrowDownToLine}
        actions={<Button variant="secondary" onClick={() => navigate("/persediaan/stock")}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>}
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-4">Informasi Barang Masuk</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Pilih Barang *</Label>
              <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
                <SelectTrigger data-testid="stockin-item-select"><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>{it.item_code} - {it.item_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItem && (
                <p className="text-xs text-muted-foreground">Stok saat ini: <b>{selectedItem.current_stock} {selectedItem.unit}</b></p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah Barang *</Label>
              <Input data-testid="stockin-quantity" type="number" min="1" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} />
              {selectedItem && <p className="text-xs text-muted-foreground">Satuan: {selectedItem.unit}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Barang Masuk</Label>
              <Input data-testid="stockin-date" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Sumber Barang</Label>
              <Input data-testid="stockin-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="cth: Pengadaan 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Nomor Dokumen (Opsional)</Label>
              <Input data-testid="stockin-docno" value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} placeholder="cth: SPK-2026-001" />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Keterangan</Label>
              <Textarea data-testid="stockin-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Keterangan tambahan..." rows={2} />
            </div>
          </div>

          {selectedItem && form.quantity > 0 && (
            <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm font-medium text-emerald-800">Kalkulasi Stok:</p>
              <p className="text-sm text-emerald-700 mt-1">
                Stok sebelumnya: <b>{selectedItem.current_stock} {selectedItem.unit}</b> +
                Barang masuk: <b>{form.quantity} {selectedItem.unit}</b> =
                Stok baru: <b>{selectedItem.current_stock + form.quantity} {selectedItem.unit}</b>
              </p>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" disabled={busy} data-testid="stockin-submit-btn">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Simpan Barang Masuk
          </Button>
        </div>
      </form>
    </div>
  );
}
