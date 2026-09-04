import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, StatusPill, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusBadge, formatDate, formatRupiah } from "@/lib/helpers";
import { Wrench, Plus, Search, History } from "lucide-react";

export default function MaintenanceList({ historyMode }) {
  const { can, canAny } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => { const { data } = await api.get("/maintenance"); setItems(data); };
  useEffect(() => { load(); }, []);

  if (!items) return <Loading />;
  const filtered = items.filter((m) => [m.asset_name, m.request_number, m.status, m.created_by_name].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={historyMode ? "Riwayat Pemeliharaan" : "Pemeliharaan Aset"} description={historyMode ? "Seluruh riwayat pengajuan pemeliharaan" : "Daftar & pengajuan pemeliharaan kendaraan/aset"} icon={historyMode ? History : Wrench}
        actions={can("maintenance_create") && <Button onClick={() => navigate("/pemeliharaan/ajukan")} data-testid="add-maintenance-button"><Plus className="h-4 w-4 mr-1.5" /> Ajukan Pemeliharaan</Button>} />

      <Card className="p-4">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input data-testid="data-table-search-input" placeholder="Cari nomor/aset/status..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {filtered.length === 0 ? <EmptyState title="Belum ada pengajuan pemeliharaan" icon={Wrench} action={can("maintenance_create") && <Button onClick={() => navigate("/pemeliharaan/ajukan")}><Plus className="h-4 w-4 mr-1.5" /> Ajukan</Button>} /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>No. Pengajuan</TableHead><TableHead>Aset / Kendaraan</TableHead><TableHead>Pemohon</TableHead><TableHead>Jenis</TableHead><TableHead>Perkiraan Biaya</TableHead><TableHead>Status</TableHead><TableHead>Tanggal</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/pemeliharaan/${m.id}`)} data-testid={`maintenance-row-${m.id}`}>
                    <TableCell className="font-medium">{m.request_number}</TableCell>
                    <TableCell>{m.asset_name}<div className="text-xs text-muted-foreground">{m.nomor_polisi}</div></TableCell>
                    <TableCell className="text-sm">{m.created_by_name}<div className="text-xs text-muted-foreground">{m.created_by_role}</div></TableCell>
                    <TableCell className="text-sm">{m.jenis_pemeliharaan || "-"}</TableCell>
                    <TableCell className="text-sm">{formatRupiah(m.perkiraan_biaya)}</TableCell>
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
