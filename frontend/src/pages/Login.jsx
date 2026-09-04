import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Building2, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Berhasil masuk");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal masuk");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 text-white overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1697968652402-0b4a38964be1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-primary/85" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-heading font-bold text-lg leading-tight">Sistem Monitoring BMN</p>
            <p className="text-sm text-white/80">& Barang Persediaan</p>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-heading text-4xl font-bold leading-tight">Kelola Aset & Persediaan Instansi dalam Satu Sistem</h1>
          <p className="mt-4 text-white/85">Pantau kondisi Barang Milik Negara, alur persetujuan pemeliharaan berjenjang, dan permintaan barang persediaan dengan cepat, aman, dan transparan.</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" /> Akses berbasis role &amp; audit trail lengkap
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/60">Kantor Imigrasi Takengon</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground">Monitoring BMN</p>
              <p className="text-xs text-muted-foreground">& Barang Persediaan</p>
            </div>
          </div>
          <h2 className="font-heading text-2xl font-semibold">Selamat Datang</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Masuk menggunakan email dan password Anda.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email atau Username</Label>
              <Input id="email" data-testid="login-email-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@instansi.go.id" required autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" data-testid="login-password-input" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" required autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy} data-testid="login-submit-button">
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Masuk
            </Button>
          </form>
          <div className="mt-6 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Akun Administrator Utama</p>
            <p>Email: imigrasi.takengon2@gmail.com</p>
            <p>Pendaftaran akun hanya dapat dilakukan oleh Administrator.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
