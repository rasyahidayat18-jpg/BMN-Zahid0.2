import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, EmptyState, AccessDenied } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/helpers";
import { History, ArrowLeft, ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine, RotateCcw, Package } from "lucide-react";

const TX_TYPES = [
  { value: "STOCK_IN", label: "Barang Masuk", icon: ArrowDownToLine, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "STOCK_OUT", label: "Barang Keluar", icon: ArrowUpFromLine, color: "bg-rose-50 text-rose-800 border-rose-200" },
  { value: "ADJUSTMENT_IN", label: "Penyesuaian (+)", icon: RotateCcw, color: "bg-sky-50 text-sky-800 border-sky-200" },
  { value: "ADJUSTMENT_OUT", label: "Penyesuaian (-)", icon: RotateCcw, color: "bg-amber-50 text-amber-900 border-amber-200" },
];

const txLabel = (type) => TX_TYPES.find((t) => t.value === type) || { label: type, color: "bg-slate-50 text-slate-700 border-slate-200" };

export default function StockHistory() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [txType, setTxType] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!can("stock_manage")) return;
    const params = { page, per_page: 20 };
    if (txType) params.tx_type = txType;
    if (dateStart) params.start = dateStart;
    if (dateEnd) params.end = dateEnd;
    try {
      const { data: d } = await api.get("/stock/history", { params });
      setData(d);
    } catch {}
  }, [page, txType, dateStart, dateEnd, can]);

  useEffect(() => { load(); }, [load]);

  if (!can("stock_manage")) return <AccessDenied />;

  if (!data) return <Loading />;

  return (
    <div data-testid="stock-history-page">
      <PageHeader
        title="Riwayat Pergerakan Stok"
        description="Semua aktivitas pergerakan barang masuk, keluar, dan penyesuaian"
        icon={History}
        actions={<Button variant="secondary" onClick={() => navigate("/persediaan/stock")}><ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard</Button>}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 min-w-[160px]">
            <Label>Jenis Transaksi</Label>
            <Select value={txType} onValueChange={(v) => { setTxType(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger data-testid="history-filter-type"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {TX_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dari Tanggal</Label>
            <Input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); setPage(1); }} data-testid="history-date-start" />
          </div>
          <div className="space-y-1.5">
            <Label>Sampai</Label>
            <Input type="date" value={dateEnd} onChange={(e) => { setDateEnd(e.target.value); setPage(1); }} data-testid="history-date-end" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {data.transactions.length === 0 ? (
          <EmptyState title="Belum ada riwayat" description="Riwayat pergerakan stok akan muncul di sini" icon={History} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Transaksi</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Stok Sebelum</TableHead>
                    <TableHead className="text-right">Perubahan</TableHead>
                    <TableHead className="text-right">Stok Sesudah</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.map((tx) => {
                    const info = txLabel(tx.transaction_type);
                    const change = tx.stock_after - tx.stock_before;
                    return (
                      <TableRow key={tx.id} data-testid={`history-row-${tx.id}`}>
                        <TableCell className="text-sm whitespace-nowrap">{formatDate(tx.created_at, false)}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.transaction_number}</TableCell>
                        <TableCell className="font-medium text-sm">{tx.item_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={info.color}>{info.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{tx.stock_before}</TableCell>
                        <TableCell className={`text-right font-semibold ${change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {change >= 0 ? "+" : ""}{change}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{tx.stock_after}</TableCell>
                        <TableCell className="text-sm">{tx.created_by}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.notes || tx.reason || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">Menampilkan {data.transactions.length} dari {data.total} transaksi</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="history-prev-page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-2">Halaman {data.page} / {data.total_pages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)} data-testid="history-next-page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
