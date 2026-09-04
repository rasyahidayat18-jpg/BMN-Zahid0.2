"""Role & permission definitions for RBAC."""

# Role constants
KEPALA_SATKER = "Kepala Satker"
KEPALA_TU = "Kepala Tata Usaha"
PENGELOLA_BMN = "Pengelola BMN / Admin"
KASUBSI_TI = "Kasubsi TI Inteldakim"
KASUBSI_YAN = "Kasubsi Yanverdokim"
PJ_KENDARAAN = "Penanggung Jawab Kendaraan Dinas"

ALL_ROLES = [
    KEPALA_SATKER,
    KEPALA_TU,
    PENGELOLA_BMN,
    KASUBSI_TI,
    KASUBSI_YAN,
    PJ_KENDARAAN,
]

# Permission keys
PERMISSIONS_BY_ROLE = {
    PENGELOLA_BMN: [
        "dashboard", "manage_users", "manage_roles",
        "asset_view", "asset_manage", "location_view", "responsible_manage",
        "maintenance_view_all", "maintenance_approve_1",
        "inventory_view_all", "inventory_approve",
        "stock_manage",
        "reports_view", "audit_view", "notifications", "settings",
    ],
    KEPALA_SATKER: [
        "dashboard", "asset_view", "location_view",
        "inventory_create", "inventory_view_own",
        "maintenance_create", "maintenance_view_all", "maintenance_approve_3",
        "approval_history_view", "reports_view", "notifications", "settings",
    ],
    KEPALA_TU: [
        "dashboard", "asset_view", "location_view",
        "inventory_create", "inventory_view_own",
        "maintenance_create", "maintenance_view_all", "maintenance_approve_2",
        "approval_history_view", "reports_view", "notifications", "settings",
    ],
    KASUBSI_TI: [
        "dashboard", "asset_view", "location_view",
        "inventory_create", "inventory_view_own",
        "maintenance_create", "maintenance_view_own",
        "notifications", "settings",
    ],
    KASUBSI_YAN: [
        "dashboard", "asset_view", "location_view",
        "inventory_create", "inventory_view_own",
        "maintenance_create", "maintenance_view_own",
        "notifications", "settings",
    ],
    PJ_KENDARAAN: [
        "dashboard", "vehicle_view_own",
        "maintenance_create", "maintenance_view_own",
        "notifications", "settings",
    ],
}

# Descriptions for the "Manajemen Role" page
ROLE_DESCRIPTIONS = {
    PENGELOLA_BMN: "Super Admin / Pengelola BMN. Akses penuh: manajemen user, aset, foto, lokasi, penanggung jawab, approval pemeliharaan tingkat 1, approval barang, stock barang persediaan, laporan, dan audit trail.",
    KEPALA_SATKER: "Approval pemeliharaan tingkat 3 (final), mengajukan kebutuhan barang & pemeliharaan, melihat dashboard dan riwayat approval.",
    KEPALA_TU: "Approval pemeliharaan tingkat 2, mengajukan kebutuhan barang & pemeliharaan, melihat dashboard dan riwayat approval.",
    KASUBSI_TI: "Mengajukan kebutuhan barang & pemeliharaan kendaraan dinas serta memantau status pengajuan sendiri.",
    KASUBSI_YAN: "Mengajukan kebutuhan barang & pemeliharaan kendaraan dinas serta memantau status pengajuan sendiri.",
    PJ_KENDARAAN: "Melihat kendaraan yang menjadi tanggung jawabnya, mengajukan pemeliharaan, dan mengunggah foto kerusakan.",
}


def get_permissions(role: str):
    return PERMISSIONS_BY_ROLE.get(role, ["dashboard", "notifications", "settings"])


def has_permission(role: str, permission: str) -> bool:
    return permission in get_permissions(role)
