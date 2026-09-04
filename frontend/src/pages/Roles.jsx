import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, Loading } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Check } from "lucide-react";

const PERM_LABELS = {
  dashboard: "Dashboard", manage_users: "Manajemen User", manage_roles: "Manajemen Role",
  asset_view: "Lihat Aset", asset_manage: "Kelola Aset & Foto", location_view: "Lokasi BMN",
  responsible_manage: "Kelola Penanggung Jawab", vehicle_view_own: "Lihat Kendaraan Sendiri",
  maintenance_create: "Ajukan Pemeliharaan", maintenance_view_all: "Lihat Semua Pemeliharaan",
  maintenance_view_own: "Lihat Pemeliharaan Sendiri", maintenance_approve_1: "Approval Pemeliharaan T1",
  maintenance_approve_2: "Approval Pemeliharaan T2", maintenance_approve_3: "Approval Pemeliharaan T3",
  inventory_create: "Ajukan Permintaan Barang", inventory_view_all: "Lihat Semua Permintaan",
  inventory_view_own: "Lihat Permintaan Sendiri", inventory_approve: "Approval Permintaan Barang",
  reports_view: "Laporan", audit_view: "Audit Trail", approval_history_view: "Riwayat Approval",
  notifications: "Notifikasi", settings: "Pengaturan",
};

export default function Roles() {
  const [roles, setRoles] = useState(null);
  useEffect(() => { api.get("/meta/roles").then((r) => setRoles(r.data)); }, []);
  if (!roles) return <Loading />;
  return (
    <div>
      <PageHeader title="Manajemen Role" description="Daftar role dan hak akses yang berlaku pada sistem" icon={ShieldCheck} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map((r) => (
          <Card key={r.name} className="p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-4 w-4" /></div>
              <h3 className="font-semibold">{r.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{r.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {r.permissions.map((p) => (
                <Badge key={p} variant="secondary" className="gap-1 font-normal"><Check className="h-3 w-3 text-emerald-600" /> {PERM_LABELS[p] || p}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
