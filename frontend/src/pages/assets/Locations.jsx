import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { imageUrl } from "@/lib/api";
import { PageHeader, Loading, StatusPill } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { kondisiBadge } from "@/lib/helpers";
import { MapPin, ImageIcon, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Locations() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/assets").then((r) => setAssets(r.data));
    api.get("/meta/locations").then((r) => setLocations(r.data));
  }, []);

  if (!assets) return <Loading />;
  const countByLoc = (nama) => assets.filter((a) => a.lokasi === nama).length;
  const filtered = assets.filter((a) => (selected === "all" || a.lokasi === selected) && a.nama_barang.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Lokasi BMN" description="Monitoring aset berdasarkan lokasi penyimpanan" icon={MapPin} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setSelected("all")} className={cn("rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40", selected === "all" && "ring-2 ring-primary border-primary")}>
          <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Semua Lokasi</span></div>
          <p className="font-heading text-2xl font-semibold">{assets.length}</p>
        </button>
        {locations.map((l) => (
          <button key={l.id} onClick={() => setSelected(l.nama)} className={cn("rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40", selected === l.nama && "ring-2 ring-primary border-primary")}>
            <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-primary" /><span className="text-sm font-medium truncate">{l.nama}</span></div>
            <p className="font-heading text-2xl font-semibold">{countByLoc(l.nama)}</p>
            <p className="text-xs text-muted-foreground">aset</p>
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari aset..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => navigate(`/aset/${a.id}`)} className="rounded-xl border bg-card overflow-hidden text-left hover:border-primary/40 transition-colors">
              <div className="aspect-video bg-muted flex items-center justify-center">{a.primary_image_id ? <img src={imageUrl(a.primary_image_id)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}</div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{a.nama_barang}</p>
                <p className="text-xs text-muted-foreground truncate mb-2">{a.lokasi || "-"}</p>
                <StatusPill label={a.kondisi} className={kondisiBadge(a.kondisi)} />
              </div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Tidak ada aset pada lokasi ini.</p>}
      </Card>
    </div>
  );
}
