import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, StatusPill } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommentSection } from "@/components/CommentSection";
import { statusBadge, formatDate } from "@/lib/helpers";
import { ClipboardList, ArrowLeft, CheckCircle2, XCircle, Loader2, PlayCircle, PackageCheck, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [m, setM] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { const { data } = await api.get(`/inventory/${id}`); setM(data); };
  useEffect(() => { load().catch(() => navigate("/persediaan/riwayat")); }, [id]);
  if (!m) return <Loading />;

  const isApprover = can("inventory_approve");
  const canApproveNow = isApprover && m.status === "Menunggu Approval";

  const doApprove = async (action) => {
    if (action === "reject" && !catatan.trim()) return toast.error("Alasan penolakan wajib diisi");
    setBusy(true);
    try { await api.post(`/inventory/${id}/approve`, { action, catatan }); toast.success(action === "approve" ? "Permintaan disetujui" : "Permintaan ditolak"); setCatatan(""); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };
  const doStatus = async (status) => {
    setBusy(true);
    try { await api.post(`/inventory/${id}/status`, { status }); toast.success("Status diperbarui"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };
  const addComment = async (isi) => { await api.post(`/inventory/${id}/comments`, { isi }); load(); };

  const nextStatus = { "Disetujui": ["Sedang Diproses", "Mulai Proses", PlayCircle], "Sedang Diproses": ["Barang Diserahkan", "Serahkan Barang", PackageCheck], "Barang Diserahkan": ["Selesai", "Tandai Selesai", CheckCheck] };
  const ns = nextStatus[m.status];

  return (
    <div>
      <PageHeader title={`Permintaan ${m.request_number}`} description={`${m.pemohon_name} - ${m.unit || "-"}`} icon={ClipboardList}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Informasi Permintaan</h3>
              <StatusPill label={m.status} className={statusBadge(m.status)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Pemohon</span><span className="font-medium">{m.pemohon_name}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Role</span><span className="font-medium">{m.role}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Unit / Subsi</span><span className="font-medium">{m.unit || "-"}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Tanggal</span><span className="font-medium">{m.tanggal_permintaan}</span></div>
            </div>
            {m.catatan && <div className="mt-3"><p className="text-sm text-muted-foreground">Catatan</p><p className="text-sm mt-1">{m.catatan}</p></div>}
            {m.reject_reason && <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-3"><p className="text-sm text-rose-800"><b>Alasan penolakan:</b> {m.reject_reason}</p></div>}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Daftar Barang</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Nama Barang</TableHead><TableHead>Jumlah</TableHead><TableHead>Satuan</TableHead><TableHead>Keperluan</TableHead></TableRow></TableHeader>
                <TableBody>
                  {m.items?.map((it, i) => (
                    <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell className="font-medium">{it.nama_barang}</TableCell><TableCell>{it.jumlah}</TableCell><TableCell>{it.satuan}</TableCell><TableCell className="text-sm text-muted-foreground">{it.keperluan || "-"}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <CommentSection comments={m.comments || []} onSubmit={addComment} />
        </div>

        <div className="space-y-6">
          {canApproveNow && (
            <Card className="p-5 space-y-3 border-primary/30">
              <h3 className="font-semibold">Tindakan Approval</h3>
              <div className="space-y-1.5"><Label>Catatan</Label><Textarea data-testid="inv-approval-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan / alasan penolakan" /></div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => doApprove("approve")} disabled={busy} data-testid="inv-approve-button"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Setujui</Button>
                <Button variant="destructive" onClick={() => doApprove("reject")} disabled={busy} data-testid="inv-reject-button"><XCircle className="h-4 w-4 mr-1.5" /> Tolak</Button>
              </div>
            </Card>
          )}

          {isApprover && ns && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">Proses Pemenuhan</h3>
              <Button className="w-full" onClick={() => doStatus(ns[0])} disabled={busy} data-testid="inv-next-status-button">
                {React.createElement(ns[2], { className: "h-4 w-4 mr-1.5" })} {ns[1]}
              </Button>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Riwayat Status</h3>
            <div className="space-y-2">
              {[...(m.history || [])].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div><p className="font-medium">{h.status}</p><p className="text-xs text-muted-foreground">{h.oleh} - {formatDate(h.timestamp)}</p>{h.catatan && <p className="text-xs mt-0.5">"{h.catatan}"</p>}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
