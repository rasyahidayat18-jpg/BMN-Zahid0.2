import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, StatCard, Loading, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, CheckCircle2, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, Boxes, Plus, List, RotateCcw, History } from "lucide-react";
import { AccessDenied } from "@/components/common";

export default function StockDashboard() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    if (!can("stock_manage")) return;
    const params = { period };
    if (period === "custom" && customStart && customEnd) {
      params.start = customStart;
      params.end = customEnd;
    }
    api.get("/stock/dashboard", { params }).then(({ data: d }) => setData(d)).catch(() => {});
  }, [period, customStart, customEnd, can]);

  if (!can("stock_manage")) return <AccessDenied />;

  if (!data) return <Loading />;

  const cards = [
    { label: "Total Jenis Barang", value: data.total_jenis, icon: Package, tone: "primary" },
    { label: "Stok Aman", value: data.stok_aman, icon: CheckCircle2, tone: "success" },
    { label: "Stok Menipis", value: data.stok_menipis, icon: AlertTriangle, tone: "warning" },
    { label: "Stok Habis", value: data.stok_habis, icon: XCircle, tone: "danger" },
    { label: "Barang Masuk", value: data.barang_masuk, icon: ArrowDownToLine, tone: "info" },
    { label: "Barang Keluar", value: data.barang_keluar, icon: ArrowUpFromLine, tone: "slate" },
  ];

  return (
    <div data-testid="stock-dashboard">
      <PageHeader
        title="Stock Barang Persediaan"
        description="Dashboard ringkasan stok barang persediaan"
        icon={Boxes}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate("/persediaan/stock/items")} data-testid="stock-go-items-btn">
              <List className="h-4 w-4 mr-1.5" /> Data Barang
            </Button>
            <Button variant="secondary" onClick={() => navigate("/persediaan/stock/items/tambah")} data-testid="stock-add-item-btn">
              <Plus className="h-4 w-4 mr-1.5" /> Tambah Barang
            </Button>
          </div>
        }
      />

      {/* Period Filter */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 min-w-[160px]">
            <Label>Filter Periode</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger data-testid="stock-period-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {period === "custom" && (
            <>
              <div className="space-y-1.5">
                <Label>Dari</Label>
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} data-testid="stock-date-start" />
              </div>
              <div className="space-y-1.5">
                <Label>Sampai</Label>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} data-testid="stock-date-end" />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {cards.map((c, i) => (
          <StatCard key={i} {...c} testId={`stock-stat-${i}`} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/persediaan/stock/in")} data-testid="stock-quick-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Barang Masuk</p>
              <p className="text-xs text-muted-foreground">Catat penerimaan barang</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/persediaan/stock/adjustment")} data-testid="stock-quick-adj">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Penyesuaian Stok</p>
              <p className="text-xs text-muted-foreground">Koreksi stok fisik</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/persediaan/stock/history")} data-testid="stock-quick-hist">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Riwayat Stok</p>
              <p className="text-xs text-muted-foreground">Pergerakan masuk/keluar</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/persediaan/approval")} data-testid="stock-quick-approval">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Approval</p>
              <p className="text-xs text-muted-foreground">Permintaan menunggu</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Items */}
      {data.low_stock_items?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Barang Stok Rendah / Habis
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Stok Saat Ini</TableHead>
                  <TableHead>Stok Minimum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.low_stock_items.map((it) => {
                  const status = it.current_stock <= 0 ? "Habis" : "Menipis";
                  return (
                    <TableRow key={it.id} className="cursor-pointer" onClick={() => navigate(`/persediaan/stock/items`)}>
                      <TableCell className="font-medium">{it.item_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{it.item_code}</TableCell>
                      <TableCell className="font-medium">{it.current_stock} {it.unit}</TableCell>
                      <TableCell className="text-sm">{it.minimum_stock} {it.unit}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status === "Habis" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-amber-50 text-amber-900 border-amber-200"}>
                          {status === "Habis" ? "STOK HABIS" : "STOK MENIPIS"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
