import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, StatCard, Loading, StatusPill, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { statusBadge, formatDate } from "@/lib/helpers";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  Package, Car, CheckCircle2, AlertTriangle, XCircle, Wrench, ClipboardList, ClipboardCheck, Activity, Bell, Boxes,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <Loading />;
  const s = data.stats;

  const cards = [
    { label: "Total Aset BMN", value: s.total_aset, icon: Package, tone: "primary" },
    { label: "Total Aset Bergerak", value: s.total_aset_bergerak, icon: Activity, tone: "info" },
    { label: "Total Kendaraan Dinas", value: s.total_kendaraan, icon: Car, tone: "info" },
    { label: "Kondisi Baik", value: s.aset_baik, icon: CheckCircle2, tone: "success" },
    { label: "Rusak Ringan", value: s.aset_rusak_ringan, icon: AlertTriangle, tone: "warning" },
    { label: "Rusak Berat", value: s.aset_rusak_berat, icon: XCircle, tone: "danger" },
    { label: "Kendaraan Menunggu Pemeliharaan", value: s.kendaraan_pemeliharaan, icon: Wrench, tone: "warning" },
    { label: "Pemeliharaan Menunggu Approval", value: s.pemeliharaan_menunggu, icon: ClipboardCheck, tone: "info" },
    { label: "Permintaan Barang Menunggu", value: s.permintaan_menunggu, icon: ClipboardList, tone: "warning" },
    { label: "Permintaan Barang Disetujui", value: s.permintaan_disetujui, icon: Boxes, tone: "success" },
  ];

  return (
    <div>
      <PageHeader title={`Selamat datang, ${user?.nama_lengkap?.split(" ")[0]}`} description={`Ringkasan sistem sesuai role: ${user?.role}`} icon={Activity} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {cards.map((c, i) => <StatCard key={i} {...c} testId={`stat-card-${i}`} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-semibold mb-4">Kondisi Aset</h3>
          {(s.aset_baik + s.aset_rusak_ringan + s.aset_rusak_berat) === 0 ? (
            <EmptyState title="Belum ada aset" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.kondisi_chart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {data.kondisi_chart.map((e, i) => <Cell key={i} fill={e.fill} stroke="#fff" />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Permintaan Barang per Bulan</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.permintaan_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Permintaan" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.approval_queue?.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Menunggu Approval Anda</h3>
            <div className="space-y-2">
              {data.approval_queue.map((m) => (
                <button key={m.id} onClick={() => navigate(`/pemeliharaan/${m.id}`)} className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{m.asset_name}</span>
                    <StatusPill label={m.status} className={statusBadge(m.status)} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.request_number} - {m.created_by_name}</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Permintaan Terbaru</h3>
          {(!data.recent_maintenance?.length && !data.recent_inventory?.length) ? <p className="text-sm text-muted-foreground">Belum ada permintaan.</p> : (
            <div className="space-y-2">
              {data.recent_maintenance?.slice(0, 3).map((m) => (
                <button key={m.id} onClick={() => navigate(`/pemeliharaan/${m.id}`)} className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">Pemeliharaan: {m.asset_name}</span>
                    <StatusPill label={m.status} className={statusBadge(m.status)} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.request_number}</p>
                </button>
              ))}
              {data.recent_inventory?.slice(0, 3).map((m) => (
                <button key={m.id} onClick={() => navigate(`/persediaan/${m.id}`)} className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">Barang: {m.pemohon_name}</span>
                    <StatusPill label={m.status} className={statusBadge(m.status)} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.request_number}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /> Notifikasi Terbaru</h3>
          {!data.recent_notifications?.length ? <p className="text-sm text-muted-foreground">Tidak ada notifikasi.</p> : (
            <div className="space-y-2">
              {data.recent_notifications.map((n) => (
                <div key={n.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {data.recent_activity?.length > 0 && (
          <Card className="p-5 lg:col-span-3">
            <h3 className="font-semibold mb-3">Aktivitas Terbaru</h3>
            <div className="space-y-2">
              {data.recent_activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="text-sm"><span className="font-medium">{a.user_name}</span> - {a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
