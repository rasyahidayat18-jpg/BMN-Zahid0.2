import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, Loading, StatusPill, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusBadge, formatDate } from "@/lib/helpers";
import { ClipboardCheck } from "lucide-react";

export default function InventoryApproval() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/inventory", { params: { queue: true } }).then((r) => setItems(r.data)); }, []);
  if (!items) return <Loading />;
  return (
    <div>
      <PageHeader title="Approval Permintaan Barang" description="Permintaan barang yang menunggu persetujuan" icon={ClipboardCheck} />
      <Card className="p-4">
        {items.length === 0 ? <EmptyState title="Tidak ada permintaan menunggu approval" icon={ClipboardCheck} /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>No. Permintaan</TableHead><TableHead>Pemohon</TableHead><TableHead>Unit</TableHead><TableHead>Item</TableHead><TableHead>Status</TableHead><TableHead>Tanggal</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m.id} data-testid={`inv-approval-row-${m.id}`}>
                    <TableCell className="font-medium">{m.request_number}</TableCell>
                    <TableCell className="text-sm">{m.pemohon_name}</TableCell>
                    <TableCell className="text-sm">{m.unit || "-"}</TableCell>
                    <TableCell className="text-sm">{m.items?.length || 0} item</TableCell>
                    <TableCell><StatusPill label={m.status} className={statusBadge(m.status)} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(m.created_at, false)}</TableCell>
                    <TableCell className="text-right"><Button size="sm" onClick={() => navigate(`/persediaan/${m.id}`)} data-testid={`inv-review-${m.id}`}>Tinjau</Button></TableCell>
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
