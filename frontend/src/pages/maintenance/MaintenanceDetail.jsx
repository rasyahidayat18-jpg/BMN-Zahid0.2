import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { imageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, StatusPill } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CommentSection } from "@/components/CommentSection";
import { statusBadge, formatDate, formatRupiah } from "@/lib/helpers";
import { Wrench, ArrowLeft, CheckCircle2, XCircle, Loader2, ImageIcon, Clock, PlayCircle, CheckCheck } from "lucide-react";
import { toast } from "sonner";

const LEVEL_STATUS = { 1: "Menunggu Approval Tingkat 1", 2: "Menunggu Approval Tingkat 2", 3: "Menunggu Approval Tingkat 3" };

export default function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [m, setM] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const load = async () => { const { data } = await api.get(`/maintenance/${id}`); setM(data); };
  useEffect(() => { load().catch(() => navigate("/pemeliharaan")); }, [id]);
  if (!m) return <Loading />;

  const level = m.current_level;
  const canApproveNow =
    m.status === LEVEL_STATUS[level] &&
    ((level === 1 && can("maintenance_approve_1")) || (level === 2 && can("maintenance_approve_2")) || (level === 3 && can("maintenance_approve_3")));
  const canManageStatus = can("maintenance_approve_1") && ["Disetujui", "Sedang Dalam Pemeliharaan"].includes(m.status);

  const doApprove = async (action) => {
    if (action === "reject" && !catatan.trim()) return toast.error("Berikan catatan alasan penolakan");
    setBusy(true);
    try { await api.post(`/maintenance/${id}/approve`, { action, catatan }); toast.success(action === "approve" ? "Pengajuan disetujui" : "Pengajuan ditolak"); setCatatan(""); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };
  const doStatus = async (status) => {
    setBusy(true);
    try { await api.post(`/maintenance/${id}/status`, { status }); toast.success("Status diperbarui"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };
  const addComment = async (isi) => { await api.post(`/maintenance/${id}/comments`, { isi }); load(); };

  const timeline = [1, 2, 3].map((lv) => {
    const appr = m.approvals?.find((a) => a.level === lv);
    const roleName = { 1: "Pengelola BMN / Admin", 2: "Kepala Tata Usaha", 3: "Kepala Satker" }[lv];
    return { lv, roleName, appr };
  });

  return (
    <div>
      <PageHeader title={`Pemeliharaan ${m.request_number}`} description={m.asset_name} icon={Wrench}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Detail Pengajuan</h3>
              <StatusPill label={m.status} className={statusBadge(m.status)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Aset</span><span className="font-medium">{m.asset_name}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Nomor Polisi</span><span className="font-medium">{m.nomor_polisi || "-"}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Pemohon</span><span className="font-medium">{m.created_by_name}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Penanggung Jawab</span><span className="font-medium">{m.penanggung_jawab || "-"}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Jenis Pemeliharaan</span><span className="font-medium">{m.jenis_pemeliharaan || "-"}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Jenis Kerusakan</span><span className="font-medium">{m.jenis_kerusakan || "-"}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Perkiraan Biaya</span><span className="font-medium">{formatRupiah(m.perkiraan_biaya)}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Tanggal</span><span className="font-medium">{m.tanggal_pengajuan || formatDate(m.created_at, false)}</span></div>
            </div>
            {m.deskripsi_kerusakan && <div className="mt-3"><p className="text-sm text-muted-foreground">Deskripsi Kerusakan</p><p className="text-sm mt-1">{m.deskripsi_kerusakan}</p></div>}
          </Card>

          {m.images?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Foto Kerusakan</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {m.images.map((img) => (
                  <button key={img.id} onClick={() => setLightbox(img.id)} className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    <img src={imageUrl(img.id)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-4">Alur Persetujuan Berjenjang</h3>
            <div className="space-y-0" data-testid="approval-timeline">
              {timeline.map((t, i) => (
                <div key={t.lv} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${t.appr ? (t.appr.status === "Disetujui" ? "bg-emerald-100 border-emerald-500 text-emerald-700" : "bg-rose-100 border-rose-500 text-rose-700") : (m.current_level === t.lv && !["Ditolak", "Disetujui"].includes(m.status) ? "bg-indigo-100 border-indigo-500 text-indigo-700" : "bg-slate-100 border-slate-300 text-slate-400")}`}>
                      {t.appr ? (t.appr.status === "Disetujui" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />) : <Clock className="h-4 w-4" />}
                    </div>
                    {i < 2 && <div className="w-0.5 flex-1 min-h-8 bg-border my-1" />}
                  </div>
                  <div className="pb-6 flex-1">
                    <p className="text-sm font-medium">Tingkat {t.lv} - {t.roleName}</p>
                    {t.appr ? (
                      <div className="mt-0.5">
                        <p className="text-xs text-muted-foreground">{t.appr.status} oleh {t.appr.approver_name} - {formatDate(t.appr.timestamp)}</p>
                        {t.appr.catatan && <p className="text-sm mt-1 rounded-lg bg-secondary p-2">"{t.appr.catatan}"</p>}
                      </div>
                    ) : <p className="text-xs text-muted-foreground mt-0.5">{m.current_level === t.lv && !["Ditolak", "Disetujui"].includes(m.status) ? "Menunggu persetujuan" : "Belum diproses"}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <CommentSection comments={m.comments || []} onSubmit={addComment} />
        </div>

        <div className="space-y-6">
          {canApproveNow && (
            <Card className="p-5 space-y-3 border-primary/30">
              <h3 className="font-semibold">Tindakan Approval (Tingkat {level})</h3>
              <div className="space-y-1.5"><Label>Catatan</Label><Textarea data-testid="approval-catatan-input" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan / alasan (wajib untuk penolakan)" /></div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => doApprove("approve")} disabled={busy} data-testid="approve-button"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Setujui</Button>
                <Button variant="destructive" onClick={() => doApprove("reject")} disabled={busy} data-testid="reject-button"><XCircle className="h-4 w-4 mr-1.5" /> Tolak</Button>
              </div>
            </Card>
          )}

          {canManageStatus && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">Kelola Status Pemeliharaan</h3>
              {m.status === "Disetujui" && <Button className="w-full" variant="secondary" onClick={() => doStatus("Sedang Dalam Pemeliharaan")} disabled={busy}><PlayCircle className="h-4 w-4 mr-1.5" /> Mulai Pemeliharaan</Button>}
              {m.status === "Sedang Dalam Pemeliharaan" && <Button className="w-full" onClick={() => doStatus("Selesai")} disabled={busy}><CheckCheck className="h-4 w-4 mr-1.5" /> Tandai Selesai</Button>}
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Riwayat Status</h3>
            <div className="space-y-2">
              {[...(m.history || [])].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div><p className="font-medium">{h.status}</p><p className="text-xs text-muted-foreground">{h.oleh} - {formatDate(h.timestamp)}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-0">
          {lightbox && <img src={imageUrl(lightbox)} alt="" className="max-h-[80vh] w-auto object-contain mx-auto" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
