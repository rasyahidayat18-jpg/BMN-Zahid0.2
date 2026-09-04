import React, { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ nama_lengkap: user?.nama_lengkap || "", jabatan: user?.jabatan || "", unit: user?.unit || "" });
  const [pwd, setPwd] = useState({ old_password: "", new_password: "" });
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    try { await api.put("/profile", form); await refreshUser(); toast.success("Profil diperbarui"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };
  const changePwd = async () => {
    setBusy(true);
    try { await api.post("/profile/change-password", pwd); toast.success("Password diubah"); setPwd({ old_password: "", new_password: "" }); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Profil Pengguna" description="Kelola informasi akun Anda" icon={User} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4"><AvatarFallback className="bg-primary/10 text-primary text-2xl">{(user?.nama_lengkap || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
          <h3 className="font-semibold text-lg">{user?.nama_lengkap}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3 rounded-full bg-primary/10 text-primary text-xs px-3 py-1 font-medium">{user?.role}</div>
        </Card>
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">Informasi Profil</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2"><Label>Nama Lengkap</Label><Input value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email} disabled /></div>
            <div className="space-y-1.5"><Label>Username</Label><Input value={user?.username} disabled /></div>
            <div className="space-y-1.5"><Label>Jabatan</Label><Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Unit / Subsi</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          </div>
          <div className="flex justify-end"><Button onClick={saveProfile} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan Profil</Button></div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Ubah Password</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Password Lama</Label><Input type="password" value={pwd.old_password} onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Password Baru</Label><Input type="password" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} /></div>
            </div>
            <div className="flex justify-end mt-4"><Button variant="secondary" onClick={changePwd} disabled={busy || !pwd.old_password || !pwd.new_password}>Ubah Password</Button></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
