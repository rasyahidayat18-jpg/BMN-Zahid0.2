import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { imageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, StatusPill, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { kondisiBadge, KONDISI } from "@/lib/helpers";
import { Package, Plus, Search, MoreVertical, Eye, Pencil, Trash2, ImageIcon, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export default function AssetList() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState(null);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [kondisi, setKondisi] = useState("all");
  const [lokasi, setLokasi] = useState("all");
  const [jenis, setJenis] = useState("all");
  const [sortKey, setSortKey] = useState("nama_barang");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [delTarget, setDelTarget] = useState(null);
  const perPage = 8;

  const load = async () => {
    const params = {};
    if (kondisi !== "all") params.kondisi = kondisi;
    if (lokasi !== "all") params.lokasi = lokasi;
    if (jenis !== "all") params.jenis_aset = jenis;
    if (search) params.search = search;
    const { data } = await api.get("/assets", { params });
    setAssets(data);
    setPage(1);
  };
  useEffect(() => { api.get("/meta/locations").then((r) => setLocations(r.data)); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search, kondisi, lokasi, jenis]);

  const sorted = useMemo(() => {
    if (!assets) return [];
    const arr = [...assets].sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return va < vb ? -1 : va > vb ? 1 : 0;
    });
    return sortAsc ? arr : arr.reverse();
  }, [assets, sortKey, sortAsc]);

  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const pageData = sorted.slice((page - 1) * perPage, page * perPage);

  const doDelete = async () => {
    try { await api.delete(`/assets/${delTarget.id}`); toast.success("Aset dihapus"); setDelTarget(null); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  const sortBtn = (key, label) => (
    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => { setSortKey(key); setSortAsc(sortKey === key ? !sortAsc : true); }}>
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div>
      <PageHeader title="Data Aset BMN" description="Daftar seluruh Barang Milik Negara" icon={Package}
        actions={can("asset_manage") && <Button onClick={() => navigate("/aset/tambah")} data-testid="add-asset-button"><Plus className="h-4 w-4 mr-1.5" /> Tambah Aset</Button>} />

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input data-testid="data-table-search-input" placeholder="Cari nama/kode/NUP/nopol..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={kondisi} onValueChange={setKondisi}><SelectTrigger data-testid="filter-kondisi"><SelectValue placeholder="Kondisi" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Kondisi</SelectItem>{KONDISI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
          <Select value={lokasi} onValueChange={setLokasi}><SelectTrigger data-testid="filter-lokasi"><SelectValue placeholder="Lokasi" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Lokasi</SelectItem>{locations.map((l) => <SelectItem key={l.id} value={l.nama}>{l.nama}</SelectItem>)}</SelectContent></Select>
          <Select value={jenis} onValueChange={setJenis}><SelectTrigger data-testid="filter-jenis"><SelectValue placeholder="Jenis" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Jenis</SelectItem><SelectItem value="Kendaraan">Kendaraan</SelectItem><SelectItem value="Umum">Umum</SelectItem></SelectContent></Select>
        </div>

        {!assets ? <Loading /> : sorted.length === 0 ? <EmptyState title="Belum ada aset" description="Tambahkan aset BMN pertama Anda" icon={Package} action={can("asset_manage") && <Button onClick={() => navigate("/aset/tambah")}><Plus className="h-4 w-4 mr-1.5" /> Tambah Aset</Button>} /> : (
          <>
            <div className="overflow-x-auto">
              <Table data-testid="data-table-assets">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead className="w-16">Foto</TableHead>
                    <TableHead>{sortBtn("nama_barang", "Nama Barang")}</TableHead>
                    <TableHead>{sortBtn("kode_barang", "Kode / NUP")}</TableHead>
                    <TableHead>Merk/Tipe</TableHead>
                    <TableHead>No. Polisi</TableHead>
                    <TableHead>{sortBtn("kondisi", "Kondisi")}</TableHead>
                    <TableHead>{sortBtn("lokasi", "Lokasi")}</TableHead>
                    <TableHead>Penanggung Jawab</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((a, i) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/aset/${a.id}`)} data-testid={`asset-row-${a.id}`}>
                      <TableCell className="text-muted-foreground">{(page - 1) * perPage + i + 1}</TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                          {a.primary_image_id ? <img src={imageUrl(a.primary_image_id)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{a.nama_barang}<div className="text-xs text-muted-foreground font-normal">{a.jenis_aset}</div></TableCell>
                      <TableCell className="text-sm">{a.kode_barang || "-"}<div className="text-xs text-muted-foreground">NUP: {a.nup || "-"}</div></TableCell>
                      <TableCell className="text-sm">{a.merk_tipe || "-"}</TableCell>
                      <TableCell className="text-sm">{a.nomor_polisi || "-"}</TableCell>
                      <TableCell><StatusPill label={a.kondisi} className={kondisiBadge(a.kondisi)} /></TableCell>
                      <TableCell className="text-sm">{a.lokasi || "-"}</TableCell>
                      <TableCell className="text-sm">{a.penanggung_jawab || "-"}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`asset-actions-${a.id}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/aset/${a.id}`)}><Eye className="h-4 w-4 mr-2" /> Detail</DropdownMenuItem>
                            {can("asset_manage") && <DropdownMenuItem onClick={() => navigate(`/aset/${a.id}/edit`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>}
                            {can("asset_manage") && <DropdownMenuItem onClick={() => setDelTarget(a)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Menampilkan {pageData.length} dari {sorted.length} aset</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="data-table-pagination-prev">Sebelumnya</Button>
                <span className="text-sm">{page} / {totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} data-testid="data-table-pagination-next">Berikutnya</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <AlertDialog open={!!delTarget} onOpenChange={(v) => !v && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Aset?</AlertDialogTitle><AlertDialogDescription>Aset <b>{delTarget?.nama_barang}</b> beserta seluruh fotonya akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="confirm-delete-asset">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
