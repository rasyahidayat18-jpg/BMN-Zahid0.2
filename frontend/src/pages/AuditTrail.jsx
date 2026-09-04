import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, Loading, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/helpers";
import { ScrollText } from "lucide-react";

export default function AuditTrail() {
  const [logs, setLogs] = useState(null);
  const [search, setSearch] = useState("");

  const load = async (q = "") => { const { data } = await api.get("/audit-logs", { params: q ? { search: q } : {} }); setLogs(data); };
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => load(search), 400); return () => clearTimeout(t); }, [search]);

  return (
    <div>
      <PageHeader title="Audit Trail" description="Riwayat seluruh aktivitas penting pengguna" icon={ScrollText} />
      <Card className="p-4">
        <div className="mb-4"><Input data-testid="audit-search-input" placeholder="Cari nama, aksi, atau detail..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>
        {!logs ? <Loading /> : logs.length === 0 ? <EmptyState title="Belum ada aktivitas" icon={ScrollText} /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Pengguna</TableHead><TableHead>Role</TableHead><TableHead>Aktivitas</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(l.timestamp)}</TableCell>
                    <TableCell className="font-medium text-sm">{l.user_name}</TableCell>
                    <TableCell className="text-sm">{l.role}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-normal">{l.action}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.detail}</TableCell>
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
