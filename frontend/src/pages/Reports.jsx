import React, { useEffect, useState } from "react";
import api, { API } from "@/lib/api";
import { PageHeader, Loading, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KONDISI } from "@/lib/helpers";
import { FileBarChart, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

const REPORTS = [
  { key: "aset", label: "Data Aset BMN" },
  { key: "kondisi", label: "Kondisi Aset" },
  { key: "lokasi", label: "Lokasi BMN" },
  { key: "penanggung_jawab", label: "Penanggung Jawab Aset" },
  { key: "pemeliharaan", label: "Pemeliharaan" },
  { key: "kendaraan", label: "Kendaraan Dinas" },
  { key: "barang", label: "Permintaan Barang Persediaan" },
  { key: "barang_subsi", label: "Barang per Subsi/Unit" },
];
const MAINT_STATUS = ["Draft", "Menunggu Approval Tingkat 1", "Menunggu Approval Tingkat 2", "Menunggu Approval Tingkat 3", "Disetujui", "Ditolak", "Sedang Dalam Pemeliharaan", "Selesai"];
const INV_STATUS = ["Menunggu Approval", "Disetujui", "Ditolak", "Sedang Diproses", "Barang Diserahkan", "Selesai"];

export default function Reports() {
  const [report, setReport] = useState("aset");
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { report, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== "all")) };
      const { data } = await api.get("/reports/data", { params });
      setData(data);
    } catch (e) { toast.error("Gagal memuat laporan"); } finally { setLoading(false); }
  };
  useEffect(() => { setFilters({}); }, [report]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [report, filters]);

  const download = async (fmt) => {
    try {
      const token = localStorage.getItem("bmn_token");
      const params = new URLSearchParams({ report, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== "all")) });
      const res = await fetch(`${API}/reports/export/${fmt}?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${report}_laporan.${fmt === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Gagal mengunduh"); }
  };

  const showKondisi = ["aset", "kondisi", "lokasi", "penanggung_jawab", "kendaraan"].includes(report);
  const showStatus = ["pemeliharaan", "barang", "barang_subsi"].includes(report);
  const statusOpts = report === "pemeliharaan" ? MAINT_STATUS : INV_STATUS;

  return (
    <div>
      <PageHeader title="Laporan" description="Buat, filter, dan ekspor laporan BMN & Persediaan" icon={FileBarChart}
        actions={<div className="flex gap-2">
          <Button variant="secondary" onClick={() => download("excel")} data-testid="report-export-excel-button"><FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel</Button>
          <Button variant="secondary" onClick={() => download("pdf")} data-testid="report-export-pdf-button"><FileText className="h-4 w-4 mr-1.5" /> PDF</Button>
          <Button variant="secondary" onClick={() => window.print()} data-testid="report-print-button"><Printer className="h-4 w-4 mr-1.5" /> Print</Button>
        </div>} />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Jenis Laporan</label>
            <Select value={report} onValueChange={setReport}><SelectTrigger data-testid="report-type-select"><SelectValue /></SelectTrigger>
              <SelectContent>{REPORTS.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent></Select>
          </div>
          {showKondisi && <div><label className="text-xs text-muted-foreground mb-1 block">Kondisi</label>
            <Select value={filters.kondisi || "all"} onValueChange={(v) => setFilters({ ...filters, kondisi: v })}><SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua</SelectItem>{KONDISI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div>}
          {showStatus && <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v })}><SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua</SelectItem>{statusOpts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>}
        </div>
      </Card>

      <Card className="p-4" id="report-table">
        {loading || !data ? <Loading /> : data.rows.length === 0 ? <EmptyState title="Tidak ada data untuk laporan ini" icon={FileBarChart} /> : (
          <div className="overflow-x-auto">
            <h3 className="font-semibold mb-3">{data.title} <span className="text-sm font-normal text-muted-foreground">({data.rows.length} data)</span></h3>
            <Table>
              <TableHeader><TableRow>{data.columns.map((c) => <TableHead key={c.field}>{c.header}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {data.rows.map((row, i) => (
                  <TableRow key={i}>{data.columns.map((c) => <TableCell key={c.field} className="text-sm">{String(row[c.field] ?? "-")}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
