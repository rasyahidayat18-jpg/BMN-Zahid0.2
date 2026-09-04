import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, Loading, StatusPill, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { statusBadge, formatDate, formatRupiah } from "@/lib/helpers";
import { CheckSquare } from "lucide-react";

export default function MaintenanceApproval() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/maintenance", { params: { queue: true } }).then((r) => setItems(r.data)); }, []);
  if (!items) return <Loading />;

  return (
    <div>
      <PageHeader title="Approval Pemeliharaan" description="Pengajuan yang menunggu persetujuan Anda" icon={CheckSquare} />
      <Card className="p-4">
        {items.length === 0 ? <EmptyState title="Tidak ada pengajuan menunggu approval Anda" icon={CheckSquare} /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>No. Pengajuan</TableHead><TableHead>Aset</TableHead><TableHead>Pemohon</TableHead><TableHead>Perkiraan Biaya</TableHead><TableHead>Status</TableHead><TableHead>Tanggal</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m.id} data-testid={`approval-row-${m.id}`}>
                    <TableCell className="font-medium">{m.request_number}</TableCell>
                    <TableCell>{m.asset_name}<div className="text-xs text-muted-foreground">{m.nomor_polisi}</div></TableCell>
                    <TableCell className="text-sm">{m.created_by_name}</TableCell>
                    <TableCell className="text-sm">{formatRupiah(m.perkiraan_biaya)}</TableCell>
                    <TableCell><StatusPill label={m.status} className={statusBadge(m.status)} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(m.created_at, false)}</TableCell>
                    <TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/pemeliharaan/${m.id}`)} data-testid={`review-${m.id}`}>Tinjau</Button></TableCell>
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
