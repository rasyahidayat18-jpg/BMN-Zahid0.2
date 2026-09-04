import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, EmptyState, AccessDenied } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { imageUrl } from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { Boxes, Search, Plus, Pencil, Trash2, ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const STOCK_CATEGORIES = ["ATK", "Kertas", "Tinta Printer", "Toner", "Peralatan Kebersihan", "Barang Elektronik", "Perlengkapan Kantor", "Lainnya"];
const STATUS_OPTIONS = ["Aman", "Menipis", "Habis"];

const stockBadge = (s) => {
  if (s === "Aman") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "Menipis") return "bg-amber-50 text-amber-900 border-amber-200";
  if (s === "Habis") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

export default function StockList() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!can("stock_manage")) return;
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (status) params.status = status;
    try {
      const { data: d } = await api.get("/stock/items", { params });
      setData(d);
    } catch {}
  }, [page, search, category, status, can]);

  useEffect(() => { load(); }, [load]);

  if (!can("stock_manage")) return <AccessDenied />;

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await api.delete(`/stock/items/${deleteDialog.id}`);
      toast.success("Barang berhasil dihapus");
      setDeleteDialog(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menghapus");
    } finally { setDeleting(false); }
  };

  if (!data) return <Loading />;

  return (
    <div data-testid="stock-list-page">
      <PageHeader
        title="Data Stock Barang"
        description="Kelola seluruh barang persediaan"
        icon={Boxes}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/persediaan/stock")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard
            </Button>
            <Button onClick={() => navigate("/persediaan/stock/items/tambah")} data-testid="stock-add-btn">
              <Plus className="h-4 w-4 mr-1.5" /> Tambah Barang
            </Button>
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="stock-search-input"
              placeholder="Cari nama/kode barang..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[160px]" data-testid="stock-filter-category">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {STOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[140px]" data-testid="stock-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4">
        {data.items.length === 0 ? (
          <EmptyState title="Belum ada barang" description="Tambahkan barang persediaan pertama" icon={Boxes}
            action={<Button onClick={() => navigate("/persediaan/stock/items/tambah")}><Plus className="h-4 w-4 mr-1.5" /> Tambah Barang</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">No</TableHead>
                    <TableHead className="w-12">Foto</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead className="text-right">Stok Awal</TableHead>
                    <TableHead className="text-right">Masuk</TableHead>
                    <TableHead className="text-right">Keluar</TableHead>
                    <TableHead className="text-right">Stok Saat Ini</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((it, idx) => (
                    <TableRow key={it.id} data-testid={`stock-row-${it.id}`}>
                      <TableCell className="text-sm text-muted-foreground">{(page - 1) * 15 + idx + 1}</TableCell>
                      <TableCell>
                        {it.primary_image ? (
                          <img src={imageUrl(it.primary_image.id)} alt="" className="h-10 w-10 rounded-md object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{it.item_code}</TableCell>
                      <TableCell className="font-medium">{it.item_name}</TableCell>
                      <TableCell className="text-sm">{it.category}</TableCell>
                      <TableCell className="text-sm">{it.unit}</TableCell>
                      <TableCell className="text-right text-sm">{it.initial_stock}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-700">{it.stock_in_total || 0}</TableCell>
                      <TableCell className="text-right text-sm text-rose-700">{it.stock_out_total || 0}</TableCell>
                      <TableCell className="text-right font-semibold">{it.current_stock}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{it.minimum_stock}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={stockBadge(it.stock_status)}>
                          {it.stock_status === "Aman" ? "STOK AMAN" : it.stock_status === "Menipis" ? "STOK MENIPIS" : "STOK HABIS"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{it.storage_location || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(it.updated_at, false)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/persediaan/stock/items/${it.id}/edit`)} data-testid={`stock-edit-${it.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog(it)} data-testid={`stock-del-${it.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">Menampilkan {data.items.length} dari {data.total} barang</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="stock-prev-page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-2">Halaman {data.page} / {data.total_pages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)} data-testid="stock-next-page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus <b>{deleteDialog?.item_name}</b>? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialog(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} data-testid="stock-confirm-delete">
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
