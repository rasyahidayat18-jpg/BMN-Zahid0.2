import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, Loading, StatusPill, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/helpers";
import { Users as UsersIcon, Plus, MoreVertical, Pencil, KeyRound, Power, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { nama_lengkap: "", email: "", username: "", password: "", role: ROLES[2], jabatan: "", unit: "", is_active: true };

export default function Users() {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState("");
  const [delTarget, setDelTarget] = useState(null);

  const load = async () => {
    const { data } = await api.get("/users");
    setUsers(data);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: "" }); setOpen(true); };

  const save = async () => {
    setBusy(true);
    try {
      if (editing) {
        const payload = { ...form }; delete payload.password;
        await api.put(`/users/${editing.id}`, payload);
        toast.success("User diperbarui");
      } else {
        await api.post("/users", form);
        toast.success("User ditambahkan");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan");
    } finally { setBusy(false); }
  };

  const toggleActive = async (u) => {
    try { await api.post(`/users/${u.id}/toggle-active`); load(); toast.success("Status diperbarui"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };
  const doReset = async () => {
    try { await api.post(`/users/${resetTarget.id}/reset-password`, { new_password: resetPwd }); toast.success("Password direset"); setResetTarget(null); setResetPwd(""); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };
  const doDelete = async () => {
    try { await api.delete(`/users/${delTarget.id}`); toast.success("User dihapus"); setDelTarget(null); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  if (!users) return <Loading />;
  const filtered = users.filter((u) => [u.nama_lengkap, u.email, u.username, u.role].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Manajemen User" description="Kelola akun pengguna dan hak akses berdasarkan role" icon={UsersIcon}
        actions={<Button onClick={openCreate} data-testid="add-user-button"><Plus className="h-4 w-4 mr-1.5" /> Tambah User</Button>} />

      <Card className="p-4">
        <div className="mb-4">
          <Input data-testid="data-table-search-input" placeholder="Cari nama, email, atau role..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        {filtered.length === 0 ? <EmptyState title="Tidak ada user" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email / Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Jabatan / Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.username}`}>
                    <TableCell className="font-medium">{u.nama_lengkap}</TableCell>
                    <TableCell><div className="text-sm">{u.email}</div><div className="text-xs text-muted-foreground">@{u.username}</div></TableCell>
                    <TableCell><span className="text-sm">{u.role}</span></TableCell>
                    <TableCell><div className="text-sm">{u.jabatan || "-"}</div><div className="text-xs text-muted-foreground">{u.unit}</div></TableCell>
                    <TableCell><StatusPill label={u.is_active ? "Aktif" : "Nonaktif"} className={u.is_active ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`user-actions-${u.username}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetTarget(u)}><KeyRound className="h-4 w-4 mr-2" /> Reset Password</DropdownMenuItem>
                          {!u.is_super_admin && <DropdownMenuItem onClick={() => toggleActive(u)}><Power className="h-4 w-4 mr-2" /> {u.is_active ? "Nonaktifkan" : "Aktifkan"}</DropdownMenuItem>}
                          {!u.is_super_admin && <DropdownMenuItem onClick={() => setDelTarget(u)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Tambah User Baru"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2"><Label>Nama Lengkap</Label><Input data-testid="user-nama-input" value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input data-testid="user-email-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Username</Label><Input data-testid="user-username-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            {!editing && <div className="space-y-1.5"><Label>Password</Label><Input data-testid="user-password-input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>}
            <div className="space-y-1.5"><Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="user-role-select"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Jabatan</Label><Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Unit / Subsi</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div className="flex items-center gap-2 sm:col-span-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Akun Aktif</Label></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={busy} data-testid="user-save-button">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(v) => !v && setResetTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Atur password baru untuk <b>{resetTarget?.nama_lengkap}</b>.</p>
          <Input data-testid="reset-password-input" type="text" placeholder="Password baru" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} />
          <DialogFooter><Button variant="secondary" onClick={() => setResetTarget(null)}>Batal</Button><Button onClick={doReset} disabled={!resetPwd}>Reset</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delTarget} onOpenChange={(v) => !v && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus User?</AlertDialogTitle><AlertDialogDescription>User <b>{delTarget?.nama_lengkap}</b> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
