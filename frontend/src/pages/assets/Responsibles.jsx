import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { imageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/helpers";
import { UserCog, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Responsibles() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState(null);
  const [users, setUsers] = useState([]);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ penanggung_jawab: "", penanggung_jawab_id: null, catatan: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => { const { data } = await api.get("/responsibles"); setAssets(data); };
  useEffect(() => { load(); if (can("responsible_manage")) api.get("/users/options").then((r) => setUsers(r.data)); }, []);

  const openAssign = (a) => { setTarget(a); setForm({ penanggung_jawab: a.penanggung_jawab || "", penanggung_jawab_id: a.penanggung_jawab_id || null, catatan: "" }); };
  const save = async () => {
    setBusy(true);
    try { await api.post(`/assets/${target.id}/responsible`, form); toast.success("Penanggung jawab diperbarui"); setTarget(null); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };

  if (!assets) return <Loading />;

  return (
    <div>
      <PageHeader title="Penanggung Jawab Aset" description="Kelola dan pantau penanggung jawab setiap aset" icon={UserCog} />
      <Card className="p-4">
        {assets.length === 0 ? <EmptyState title="Belum ada aset" icon={UserCog} /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Foto</TableHead><TableHead>Nama Aset</TableHead><TableHead>NUP</TableHead><TableHead>Lokasi</TableHead><TableHead>Penanggung Jawab</TableHead><TableHead>Ditetapkan</TableHead>{can("responsible_manage") && <TableHead className="text-right">Aksi</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {assets.map((a) => {
                  const last = a.responsible_history?.[a.responsible_history.length - 1];
                  return (
                    <TableRow key={a.id}>
                      <TableCell><div className="h-10 w-10 rounded-md border bg-muted overflow-hidden flex items-center justify-center">{a.primary_image_id ? <img src={imageUrl(a.primary_image_id)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}</div></TableCell>
                      <TableCell className="font-medium cursor-pointer" onClick={() => navigate(`/aset/${a.id}`)}>{a.nama_barang}</TableCell>
                      <TableCell>{a.nup || "-"}</TableCell>
                      <TableCell>{a.lokasi || "-"}</TableCell>
                      <TableCell>{a.penanggung_jawab || <span className="text-muted-foreground">Belum ditetapkan</span>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{last ? formatDate(last.tanggal, false) : "-"}</TableCell>
                      {can("responsible_manage") && <TableCell className="text-right"><Button variant="secondary" size="sm" onClick={() => openAssign(a)} data-testid={`assign-pj-${a.id}`}>Tetapkan</Button></TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tetapkan Penanggung Jawab</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Aset: <b>{target?.nama_barang}</b></p>
          <div className="space-y-1.5"><Label>Penanggung Jawab</Label>
            <Select value={form.penanggung_jawab_id || undefined} onValueChange={(v) => { const u = users.find((x) => x.id === v); setForm({ ...form, penanggung_jawab_id: v, penanggung_jawab: u?.nama_lengkap || "" }); }}>
              <SelectTrigger data-testid="pj-user-select"><SelectValue placeholder="Pilih pengguna" /></SelectTrigger>
              <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.nama_lengkap} ({u.role})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Catatan</Label><Textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Alasan penetapan (opsional)" /></div>
          <DialogFooter><Button variant="secondary" onClick={() => setTarget(null)}>Batal</Button><Button onClick={save} disabled={busy || !form.penanggung_jawab_id}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
