import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { imageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Loading, StatusPill } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { kondisiBadge, formatRupiah, formatDate } from "@/lib/helpers";
import { Package, ArrowLeft, Pencil, ImageIcon, ChevronLeft, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [asset, setAsset] = useState(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => { api.get(`/assets/${id}`).then((r) => setAsset(r.data)).catch(() => navigate("/aset")); }, [id]);
  if (!asset) return <Loading />;

  const images = asset.images || [];
  const current = images[active];
  const isVehicle = asset.jenis_aset === "Kendaraan";

  const Row = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-2 border-b last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-right">{value || "-"}</span></div>
  );

  return (
    <div>
      <PageHeader title={asset.nama_barang} description={`${asset.kode_barang || "-"} - NUP ${asset.nup || "-"}`} icon={Package}
        actions={<div className="flex gap-2"><Button variant="secondary" onClick={() => navigate("/aset")}><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali</Button>{can("asset_manage") && <Button onClick={() => navigate(`/aset/${id}/edit`)}><Pencil className="h-4 w-4 mr-1.5" /> Edit</Button>}</div>} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Card className="p-3">
            <div className="aspect-[16/10] rounded-lg border bg-muted overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => current && setLightbox(true)} data-testid="asset-primary-photo">
              {current ? <img src={imageUrl(current.id)} alt="" className="h-full w-full object-cover" /> : <div className="text-center text-muted-foreground"><ImageIcon className="h-10 w-10 mx-auto mb-2" /><p className="text-sm">Belum ada foto</p></div>}
            </div>
            {images.length > 0 && (
              <ScrollArea className="mt-3 w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActive(i)} className={cn("h-16 w-16 rounded-md border overflow-hidden shrink-0", i === active && "ring-2 ring-primary")}>
                      <img src={imageUrl(img.id)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Informasi Aset</h3>
              <StatusPill label={asset.kondisi} className={kondisiBadge(asset.kondisi)} />
            </div>
            <Row label="Nama Barang" value={asset.nama_barang} />
            <Row label="Kode Barang" value={asset.kode_barang} />
            <Row label="NUP" value={asset.nup} />
            <Row label="Merk / Tipe" value={asset.merk_tipe} />
            <Row label="Tahun Perolehan" value={asset.tahun_perolehan} />
            <Row label="Nilai Perolehan" value={formatRupiah(asset.nilai_perolehan)} />
            <Row label="Jenis Aset" value={asset.jenis_aset} />
            <Row label="Lokasi" value={asset.lokasi} />
            <Row label="Penanggung Jawab" value={asset.penanggung_jawab} />
            <Row label="Status" value={asset.status} />
            <Row label="Keterangan" value={asset.keterangan} />
          </Card>

          {isVehicle && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Informasi Kendaraan</h3>
              <Row label="Nomor Polisi" value={asset.nomor_polisi} />
              <Row label="Jenis Kendaraan" value={asset.jenis_kendaraan} />
              <Row label="Nomor Rangka" value={asset.nomor_rangka} />
              <Row label="Nomor Mesin" value={asset.nomor_mesin} />
              <Row label="Tahun Kendaraan" value={asset.tahun_kendaraan} />
            </Card>
          )}

          {asset.responsible_history?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><History className="h-4 w-4" /> Riwayat Penanggung Jawab</h3>
              <div className="space-y-2">
                {[...asset.responsible_history].reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div><p className="text-sm font-medium">{h.penanggung_jawab}</p><p className="text-xs text-muted-foreground">{h.catatan} - oleh {h.oleh}</p></div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(h.tanggal, false)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-0">
          <div className="relative flex items-center justify-center">
            {current && <img src={imageUrl(current.id)} alt="" className="max-h-[80vh] w-auto object-contain" />}
            {images.length > 1 && (
              <>
                <button onClick={() => setActive((active - 1 + images.length) % images.length)} className="absolute left-2 h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"><ChevronLeft className="h-6 w-6" /></button>
                <button onClick={() => setActive((active + 1) % images.length)} className="absolute right-2 h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
