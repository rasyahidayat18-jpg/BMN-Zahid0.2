import React from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, Building2, ShieldCheck, Info } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Pengaturan" description="Informasi sistem dan preferensi aplikasi" icon={SettingsIcon} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2.5 mb-4"><Building2 className="h-5 w-5 text-primary" /><h3 className="font-semibold">Informasi Instansi</h3></div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Nama Aplikasi</dt><dd className="font-medium text-right">Sistem Monitoring BMN & Barang Persediaan</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Instansi</dt><dd className="font-medium">Kantor Imigrasi Takengon</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Versi</dt><dd className="font-medium">1.0.0</dd></div>
          </dl>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2.5 mb-4"><ShieldCheck className="h-5 w-5 text-primary" /><h3 className="font-semibold">Akun Anda</h3></div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Nama</dt><dd className="font-medium">{user?.nama_lengkap}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Role</dt><dd className="font-medium">{user?.role}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Unit</dt><dd className="font-medium">{user?.unit || "-"}</dd></div>
          </dl>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-3"><Info className="h-5 w-5 text-primary" /><h3 className="font-semibold">Tentang Sistem</h3></div>
          <p className="text-sm text-muted-foreground">Aplikasi ini digunakan untuk memantau Barang Milik Negara (BMN) dan Barang Persediaan secara terintegrasi, dengan dukungan approval berjenjang, manajemen foto aset, notifikasi, audit trail, dan pelaporan. Akses setiap fitur disesuaikan dengan role pengguna.</p>
        </Card>
      </div>
    </div>
  );
}
