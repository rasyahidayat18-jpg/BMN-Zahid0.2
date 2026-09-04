// Shared helpers: formatting, status maps
export const formatDate = (iso, withTime = true) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const opts = { day: "2-digit", month: "short", year: "numeric" };
    let s = d.toLocaleDateString("id-ID", opts);
    if (withTime) s += " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return s;
  } catch {
    return iso;
  }
};

export const formatRupiah = (n) => {
  if (n == null || n === "") return "-";
  return "Rp " + Number(n).toLocaleString("id-ID");
};

export const kondisiBadge = (k) => {
  switch (k) {
    case "Baik":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Rusak Ringan":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "Rusak Berat":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export const statusBadge = (s) => {
  if (!s) return "bg-slate-50 text-slate-700 border-slate-200";
  if (s === "Disetujui" || s === "Selesai") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "Ditolak") return "bg-rose-50 text-rose-800 border-rose-200";
  if (s.startsWith("Menunggu")) return "bg-indigo-50 text-indigo-800 border-indigo-200";
  if (s === "Draft") return "bg-slate-100 text-slate-700 border-slate-200";
  if (s === "Sedang Dalam Pemeliharaan" || s === "Sedang Diproses") return "bg-sky-50 text-sky-800 border-sky-200";
  if (s === "Barang Diserahkan") return "bg-teal-50 text-teal-800 border-teal-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

export const ROLES = [
  "Kepala Satker",
  "Kepala Tata Usaha",
  "Pengelola BMN / Admin",
  "Kasubsi TI Inteldakim",
  "Kasubsi Yanverdokim",
  "Penanggung Jawab Kendaraan Dinas",
];

export const KONDISI = ["Baik", "Rusak Ringan", "Rusak Berat"];
export const SATUAN = ["Unit", "Buah", "Rim", "Lusin", "Box", "Pak", "Dus", "Lembar", "Set"];
