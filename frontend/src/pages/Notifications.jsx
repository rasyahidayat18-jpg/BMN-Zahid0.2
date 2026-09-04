import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, Loading, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/helpers";
import { Bell, CheckCheck } from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("all");

  const load = async () => { const { data } = await api.get("/notifications"); setData(data); };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { await api.post(`/notifications/${id}/read`); load(); };
  const markAll = async () => { await api.post("/notifications/read-all"); load(); };

  if (!data) return <Loading />;
  const items = data.items.filter((n) => (tab === "unread" ? !n.is_read : tab === "read" ? n.is_read : true));

  return (
    <div>
      <PageHeader title="Notifikasi" description={`${data.unread} notifikasi belum dibaca`} icon={Bell}
        actions={data.unread > 0 && <Button variant="secondary" onClick={markAll} data-testid="notification-mark-all-page"><CheckCheck className="h-4 w-4 mr-1.5" /> Tandai semua dibaca</Button>} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList><TabsTrigger value="all">Semua</TabsTrigger><TabsTrigger value="unread">Belum dibaca</TabsTrigger><TabsTrigger value="read">Sudah dibaca</TabsTrigger></TabsList>
      </Tabs>
      {items.length === 0 ? <Card className="p-4"><EmptyState title="Tidak ada notifikasi" icon={Bell} /></Card> : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={cn("p-4 flex items-start gap-3 cursor-pointer hover:bg-accent transition-colors", !n.is_read && "border-l-4 border-l-primary")}
              onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) navigate(n.link); }} data-testid="notification-item">
              <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0", n.is_read ? "bg-transparent" : "bg-primary")} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
