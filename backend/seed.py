"""Idempotent seed of super admin, sample users, locations, and demo data."""
from database import db
from auth import hash_password
from utils import gen_id, now_iso
import rbac

SUPER_ADMIN_EMAIL = "imigrasi.takengon2@gmail.com"
SUPER_ADMIN_PASSWORD = "Admin@123"

LOCATIONS = [
    "Kantor Utama", "Ruang Kepala Kantor", "Ruang Tata Usaha",
    "Subsi TI Inteldakim", "Subsi Yanverdokim", "Gudang", "Lokasi Lainnya",
]


async def seed():
    # --- Super admin ---
    existing = await db.users.find_one({"email": SUPER_ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": gen_id(),
            "nama_lengkap": "Administrator Utama",
            "email": SUPER_ADMIN_EMAIL,
            "username": "superadmin",
            "password": hash_password(SUPER_ADMIN_PASSWORD),
            "role": rbac.PENGELOLA_BMN,
            "jabatan": "Pengelola BMN",
            "unit": "Tata Usaha",
            "is_active": True,
            "foto": None,
            "created_at": now_iso(),
            "is_super_admin": True,
        })

    # --- Locations meta ---
    if await db.asset_locations.count_documents({}) == 0:
        for loc in LOCATIONS:
            await db.asset_locations.insert_one({"id": gen_id(), "nama": loc})

    # --- Sample users per role (demo, only if just super admin exists) ---
    if await db.users.count_documents({}) <= 1:
        samples = [
            ("Budi Santoso", "kasatker@bmn.go.id", "kasatker", rbac.KEPALA_SATKER, "Kepala Satuan Kerja", "Pimpinan"),
            ("Siti Rahma", "katu@bmn.go.id", "katu", rbac.KEPALA_TU, "Kepala Tata Usaha", "Tata Usaha"),
            ("Andi Wijaya", "kasubsiti@bmn.go.id", "kasubsiti", rbac.KASUBSI_TI, "Kasubsi TI Inteldakim", "Subsi TI Inteldakim"),
            ("Dewi Lestari", "kasubsiyan@bmn.go.id", "kasubsiyan", rbac.KASUBSI_YAN, "Kasubsi Yanverdokim", "Subsi Yanverdokim"),
            ("Rudi Hartono", "pjkendaraan@bmn.go.id", "pjkendaraan", rbac.PJ_KENDARAAN, "Penanggung Jawab Kendaraan", "Tata Usaha"),
        ]
        for nama, email, uname, role, jab, unit in samples:
            await db.users.insert_one({
                "id": gen_id(),
                "nama_lengkap": nama,
                "email": email,
                "username": uname,
                "password": hash_password("Password@123"),
                "role": role,
                "jabatan": jab,
                "unit": unit,
                "is_active": True,
                "foto": None,
                "created_at": now_iso(),
            })

    # --- Sample assets ---
    if await db.assets.count_documents({}) == 0:
        pj = await db.users.find_one({"role": rbac.PJ_KENDARAAN})
        pj_name = pj["nama_lengkap"] if pj else "Rudi Hartono"
        pj_id = pj["id"] if pj else None
        assets = [
            {"nama_barang": "Mobil Dinas Toyota Avanza", "kode_barang": "3.05.01.04.001", "nup": "1", "merk_tipe": "Toyota Avanza", "tahun_perolehan": "2020", "nilai_perolehan": 210000000, "kondisi": "Baik", "lokasi": "Kantor Utama", "penanggung_jawab": pj_name, "penanggung_jawab_id": pj_id, "status": "Aktif", "jenis_aset": "Kendaraan", "nomor_polisi": "BL 1234 AA", "nomor_rangka": "MHFXW43G5L1234567", "nomor_mesin": "2NR1234567", "jenis_kendaraan": "Minibus", "tahun_kendaraan": "2020"},
            {"nama_barang": "Sepeda Motor Honda Vario", "kode_barang": "3.05.01.05.002", "nup": "2", "merk_tipe": "Honda Vario 125", "tahun_perolehan": "2021", "nilai_perolehan": 22000000, "kondisi": "Rusak Ringan", "lokasi": "Kantor Utama", "penanggung_jawab": pj_name, "penanggung_jawab_id": pj_id, "status": "Aktif", "jenis_aset": "Kendaraan", "nomor_polisi": "BL 5678 BB", "nomor_rangka": "MH1JFV110MK123456", "nomor_mesin": "JFV1E1234567", "jenis_kendaraan": "Sepeda Motor", "tahun_kendaraan": "2021"},
            {"nama_barang": "Laptop Lenovo ThinkPad", "kode_barang": "3.10.01.02.010", "nup": "5", "merk_tipe": "Lenovo ThinkPad E14", "tahun_perolehan": "2022", "nilai_perolehan": 15000000, "kondisi": "Baik", "lokasi": "Subsi TI Inteldakim", "penanggung_jawab": "Andi Wijaya", "status": "Aktif", "jenis_aset": "Umum"},
            {"nama_barang": "Printer Epson L3210", "kode_barang": "3.10.01.03.011", "nup": "6", "merk_tipe": "Epson L3210", "tahun_perolehan": "2022", "nilai_perolehan": 3200000, "kondisi": "Baik", "lokasi": "Ruang Tata Usaha", "penanggung_jawab": "Siti Rahma", "status": "Aktif", "jenis_aset": "Umum"},
            {"nama_barang": "Komputer PC Dell OptiPlex", "kode_barang": "3.10.01.02.012", "nup": "7", "merk_tipe": "Dell OptiPlex 3090", "tahun_perolehan": "2021", "nilai_perolehan": 12000000, "kondisi": "Rusak Berat", "lokasi": "Subsi Yanverdokim", "penanggung_jawab": "Dewi Lestari", "status": "Aktif", "jenis_aset": "Umum"},
            {"nama_barang": "Scanner Canon LiDE", "kode_barang": "3.10.01.04.013", "nup": "8", "merk_tipe": "Canon LiDE 400", "tahun_perolehan": "2023", "nilai_perolehan": 1500000, "kondisi": "Baik", "lokasi": "Ruang Tata Usaha", "penanggung_jawab": "Siti Rahma", "status": "Aktif", "jenis_aset": "Umum"},
        ]
        for a in assets:
            a.update({"id": gen_id(), "keterangan": "", "primary_image_id": None, "responsible_history": [], "created_at": now_iso(), "updated_at": now_iso()})
            await db.assets.insert_one(a)
