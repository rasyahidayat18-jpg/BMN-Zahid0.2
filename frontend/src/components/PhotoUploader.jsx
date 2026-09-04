import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, X, Star, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Local-file photo uploader with preview + drag & drop.
// Manages a list of {file, url} objects. Cover is index 0.
export const PhotoUploader = ({ files, setFiles, label = "Unggah Foto" }) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const addFiles = (list) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const mapped = arr.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const remove = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const makeCover = (idx) =>
    setFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      return [item, ...copy];
    });

  return (
    <div className="space-y-3">
      <div
        data-testid="asset-photo-dropzone"
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-xl border border-dashed bg-secondary p-6 text-sm text-muted-foreground text-center cursor-pointer transition-colors",
          drag ? "border-primary bg-primary/5" : "hover:border-primary/50"
        )}
      >
        <UploadCloud className="h-7 w-7 mx-auto mb-2 text-primary" />
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs mt-1">Seret & lepas gambar di sini, atau klik untuk memilih. Bisa lebih dari satu.</p>
        <input
          ref={inputRef}
          data-testid="asset-photo-file-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f, idx) => (
            <div key={idx} className="relative rounded-lg border bg-card overflow-hidden group">
              <div className="aspect-square bg-muted">
                <img src={f.url} alt="preview" className="h-full w-full object-cover" />
              </div>
              {idx === 0 && (
                <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Sampul</Badge>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {idx !== 0 && (
                  <button type="button" data-testid="asset-photo-set-cover-button" onClick={(e) => { e.stopPropagation(); makeCover(idx); }} className="text-white text-[11px] flex items-center gap-1 hover:text-amber-300">
                    <Star className="h-3 w-3" /> Sampul
                  </button>
                )}
                <button type="button" data-testid="asset-photo-remove-button" onClick={(e) => { e.stopPropagation(); remove(idx); }} className="text-white text-[11px] flex items-center gap-1 hover:text-rose-300 ml-auto">
                  <X className="h-3 w-3" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
