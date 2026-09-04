from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nama_lengkap: str
    email: EmailStr
    username: str
    password: str
    role: str
    jabatan: Optional[str] = ""
    unit: Optional[str] = ""
    is_active: bool = True
    foto: Optional[str] = None


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nama_lengkap: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[str] = None
    jabatan: Optional[str] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    foto: Optional[str] = None


class PasswordReset(BaseModel):
    new_password: str


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nama_lengkap: Optional[str] = None
    jabatan: Optional[str] = None
    unit: Optional[str] = None
    foto: Optional[str] = None


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


class AssetCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nama_barang: str
    kode_barang: Optional[str] = ""
    nup: Optional[str] = ""
    merk_tipe: Optional[str] = ""
    tahun_perolehan: Optional[str] = ""
    nilai_perolehan: Optional[float] = 0
    kondisi: str = "Baik"
    lokasi: Optional[str] = ""
    penanggung_jawab: Optional[str] = ""
    penanggung_jawab_id: Optional[str] = None
    status: Optional[str] = "Aktif"
    keterangan: Optional[str] = ""
    jenis_aset: str = "Umum"  # Umum | Kendaraan
    # vehicle-specific
    nomor_polisi: Optional[str] = ""
    nomor_rangka: Optional[str] = ""
    nomor_mesin: Optional[str] = ""
    jenis_kendaraan: Optional[str] = ""
    tahun_kendaraan: Optional[str] = ""


class AssetUpdate(AssetCreate):
    nama_barang: Optional[str] = None
    kondisi: Optional[str] = None
    jenis_aset: Optional[str] = None


class ResponsibleAssign(BaseModel):
    penanggung_jawab: str
    penanggung_jawab_id: Optional[str] = None
    catatan: Optional[str] = ""


class MaintenanceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    asset_id: Optional[str] = None
    asset_name: str
    nomor_polisi: Optional[str] = ""
    penanggung_jawab: Optional[str] = ""
    jenis_pemeliharaan: Optional[str] = ""
    jenis_kerusakan: Optional[str] = ""
    deskripsi_kerusakan: Optional[str] = ""
    tanggal_pengajuan: Optional[str] = ""
    perkiraan_biaya: Optional[float] = 0
    catatan: Optional[str] = ""
    submit: bool = True  # if False, save as Draft


class ApprovalAction(BaseModel):
    action: str  # approve | reject
    catatan: Optional[str] = ""


class StatusUpdate(BaseModel):
    status: str
    catatan: Optional[str] = ""


class CommentCreate(BaseModel):
    isi: str


class InventoryItemLine(BaseModel):
    nama_barang: str
    jumlah: float = 1
    satuan: str = "Unit"
    keperluan: Optional[str] = ""


class InventoryCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    unit: Optional[str] = ""
    tanggal_permintaan: Optional[str] = ""
    catatan: Optional[str] = ""
    items: List[InventoryItemLine] = []
    submit: bool = True
