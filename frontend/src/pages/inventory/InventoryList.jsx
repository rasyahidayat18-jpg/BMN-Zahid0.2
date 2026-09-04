import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, Loading, StatusPill, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusBadge, formatDate } from "@/lib/helpers";
import { Boxes, Search, Activity, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function InventoryList({ monitorMode }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { api.get("/inventory").then((r) => setItems(r.data)); }, []);
  if (!items) return <Loading />;
  const filtered = items.filter((m) => [m.request_number, m.pemohon_name, m.unit, m.status].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={monitorMode ? "Monitoring Permintaan" : "Riwayat Permintaan"} description={monitorMode ? "Pantau seluruh permintaan barang persediaan" : "Riwayat permintaan barang"} icon={monitorMode ? Activity : Boxes}
        actions={can("inventory_create") && <Button onClick={() => navigate("/persediaan/ajukan")}><Plus className="h-4 w-4 mr-1.5" /> Ajukan Permintaan</Button>} />
      <Card className="p-4">
        <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input data-testid="data-table-search-input" placeholder="Cari nomor/pemohon/status..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        {filtered.length === 0 ? <EmptyState title="Belum ada permintaan" icon={Boxes} /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>No. Permintaan</TableHead><TableHead>Pemohon</TableHead><TableHead>Unit</TableHead><TableHead>Jumlah Item</TableHead><TableHead>Status</TableHead><TableHead>Tanggal</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/persediaan/${m.id}`)} data-testid={`inventory-row-${m.id}`}>
                    <TableCell className="font-medium">{m.request_number}</TableCell>
                    <TableCell className="text-sm">{m.pemohon_name}<div className="text-xs text-muted-foreground">{m.role}</div></TableCell>
                    <TableCell className="text-sm">{m.unit || "-"}</TableCell>
                    <TableCell className="text-sm">{m.items?.length || 0} item</TableCell>
                    <TableCell><StatusPill label={m.status} className={statusBadge(m.status)} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(m.created_at, false)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
