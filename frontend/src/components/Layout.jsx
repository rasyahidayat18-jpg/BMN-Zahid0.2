import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/helpers";
import {
  LayoutDashboard, Package, PackagePlus, Wrench, CheckSquare, UserCog, MapPin,
  History, Boxes, ClipboardList, ClipboardCheck, Activity, Bell, Users, ShieldCheck,
  FileBarChart, ScrollText, Settings, LogOut, Menu, Building2, User, CheckCheck,
} from "lucide-react";

const NAV = [
  { group: null, items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" }] },
  {
    group: "Monitoring BMN",
    items: [
      { to: "/aset", label: "Data Aset", icon: Package, perm: "asset_view" },
      { to: "/aset/tambah", label: "Tambah Aset", icon: PackagePlus, perm: "asset_manage" },
      { to: "/pemeliharaan", label: "Pemeliharaan", icon: Wrench, permAny: ["maintenance_create", "maintenance_view_all", "maintenance_view_own"] },
      { to: "/pemeliharaan/approval", label: "Approval Pemeliharaan", icon: CheckSquare, permAny: ["maintenance_approve_1", "maintenance_approve_2", "maintenance_approve_3"] },
      { to: "/penanggung-jawab", label: "Penanggung Jawab", icon: UserCog, permAny: ["responsible_manage", "vehicle_view_own"] },
      { to: "/lokasi", label: "Lokasi BMN", icon: MapPin, perm: "location_view" },
      { to: "/pemeliharaan/riwayat", label: "Riwayat Pemeliharaan", icon: History, permAny: ["maintenance_view_all", "maintenance_view_own"] },
    ],
  },
  {
    group: "Monitoring Persediaan",
    items: [
      { to: "/persediaan/ajukan", label: "Ajukan Permintaan", icon: ClipboardList, perm: "inventory_create" },
      { to: "/persediaan/approval", label: "Approval Permintaan", icon: ClipboardCheck, perm: "inventory_approve" },
      { to: "/persediaan/monitoring", label: "Monitoring", icon: Activity, perm: "inventory_view_all" },
      { to: "/persediaan/riwayat", label: "Riwayat Permintaan", icon: Boxes, permAny: ["inventory_view_own", "inventory_view_all"] },
    ],
  },
  {
    group: "Administrasi",
    items: [
      { to: "/notifikasi", label: "Notifikasi", icon: Bell, perm: "notifications" },
      { to: "/users", label: "Manajemen User", icon: Users, perm: "manage_users" },
      { to: "/roles", label: "Manajemen Role", icon: ShieldCheck, perm: "manage_roles" },
    ],
  },
  {
    group: "Laporan & Audit",
    items: [
      { to: "/laporan", label: "Laporan", icon: FileBarChart, perm: "reports_view" },
      { to: "/audit", label: "Audit Trail", icon: ScrollText, perm: "audit_view" },
      { to: "/pengaturan", label: "Pengaturan", icon: Settings, perm: "settings" },
    ],
  },
];

const slug = (to) => to.replace(/\//g, "-").replace(/^-/, "") || "root";

const SidebarContent = ({ onNavigate }) => {
  const { user, can, canAny } = useAuth();
  const visible = (item) => (item.perm ? can(item.perm) : item.permAny ? canAny(...item.permAny) : true);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-sm font-bold text-foreground">MONITORING BMN</p>
          <p className="text-[11px] text-muted-foreground">& Barang Persediaan</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-4">
          {NAV.map((section, si) => {
            const items = section.items.filter(visible);
            if (items.length === 0) return null;
            return (
              <div key={si}>
                {section.group && (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-3 mb-1.5 font-medium">{section.group}</p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/aset" ? false : undefined}
                      data-testid={`sidebar-nav-item-${slug(item.to)}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent",
                          isActive && "bg-accent text-primary font-medium"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {(user?.nama_lengkap || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.nama_lengkap}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], unread: 0 });
  const prevUnread = useRef(0);
  const audioRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setData(data);
      if (data.unread > prevUnread.current && prevUnread.current !== 0) {
        try { audioRef.current?.play?.(); } catch {}
      }
      prevUnread.current = data.unread;
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };
  const markAll = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  // Simple beep via WebAudio-free data URI (short chime)
  const beep = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

  return (
    <DropdownMenu>
      <audio ref={audioRef} src={beep} preload="auto" />
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="topbar-notification-bell-button" aria-label="Notifikasi">
          <Bell className="h-5 w-5" />
          {data.unread > 0 && (
            <span data-testid="topbar-notification-count" className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {data.unread > 9 ? "9+" : data.unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="topbar-notification-dropdown">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifikasi</DropdownMenuLabel>
          {data.unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="notification-mark-all-button">
              <CheckCheck className="h-3 w-3" /> Tandai semua
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {data.items.length === 0 && <p className="text-sm text-muted-foreground px-3 py-6 text-center">Tidak ada notifikasi</p>}
          {data.items.slice(0, 8).map((n) => (
            <button
              key={n.id}
              data-testid="notification-mark-read-button"
              onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }}
              className={cn("w-full text-left px-3 py-2.5 hover:bg-accent border-b last:border-0 transition-colors", !n.is_read && "bg-sky-50/60")}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                <div className={cn("min-w-0", n.is_read && "pl-4")}>
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(n.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/notifikasi")} className="justify-center text-primary text-sm">
          Lihat semua notifikasi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[280px] border-r bg-card z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[280px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 backdrop-blur px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-button" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2" data-testid="topbar-profile-button">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(user?.nama_lengkap || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">{user?.nama_lengkap}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm">{user?.nama_lengkap}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profil")} data-testid="menu-profile">
                <User className="h-4 w-4 mr-2" /> Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/pengaturan")}>
                <Settings className="h-4 w-4 mr-2" /> Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive" data-testid="menu-logout">
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
