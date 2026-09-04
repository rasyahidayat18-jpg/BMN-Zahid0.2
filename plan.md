# plan.md (UPDATED)

## 1) Objectives
- Membangun aplikasi web responsif berbahasa Indonesia: **SISTEM MONITORING BMN DAN BARANG PERSEDIAAN** untuk Kantor Imigrasi Takengon.
- Stack final (disepakati): **React + FastAPI + MongoDB** (Motor) + shadcn/ui + Tailwind + recharts + react-router-dom + JWT (email/password) + bcrypt.
- Modul utama:
  1) **Monitoring BMN** (aset + foto + lokasi + penanggung jawab + pemeliharaan + approval 3 tingkat).
  2) **Monitoring Persediaan** (permintaan barang + approval + status pemenuhan) **+ modul baru Stock Barang Persediaan** (stok, transaksi masuk/keluar, penyesuaian, riwayat pergerakan, notifikasi stok menipis, integrasi dengan permintaan).
- **RBAC ketat** (6 role) enforced di backend (bukan hanya hide menu).
- Notifikasi real-time MVP via polling: in-app (bell + badge) + suara browser.
- Audit trail untuk aksi penting.
- Laporan + export Excel/PDF.
- Akun admin awal (seed): **imigrasi.takengon2@gmail.com / Admin@123**. Tidak ada registrasi publik.

> Catatan penting perubahan requirement terakhir:
> - Permintaan user terbaru menyebut “Supabase Storage + RLS”, namun keputusan stack yang sudah disepakati sebelumnya adalah **MongoDB + local server storage/penyimpanan lokal**. Implementasi plan ini tetap **mengikuti keputusan stack yang sudah disetujui**: MongoDB + penyimpanan lokal/di server (atau penyimpanan gambar ala sistem yang sudah ada: base64 + endpoint serve image). Jika di masa depan benar-benar ingin migrasi ke Supabase Storage, akan dibuat fase migrasi terpisah.

## 2) Implementation Steps

### Phase 0 — Status saat ini (Sudah Selesai / Existing Implementation)
**Kondisi proyek sekarang**
- Backend FastAPI + MongoDB sudah berjalan, seed admin sukses, endpoint auth & RBAC teruji via curl.
- Frontend React + shadcn/ui sudah berjalan, login → dashboard teruji via screenshot smoke test.

**Sudah diimplementasi**
- Auth (JWT), RBAC, Manajemen User/Role, Dashboard, Notifikasi, Audit Trail, Laporan (Excel/PDF), Modul BMN (Aset + foto multi + primary), Pemeliharaan (approval 3 tingkat + komentar), Persediaan (permintaan barang + approval + status fulfillment + komentar).

**Pending P0**
- Verifikasi E2E upload & serve gambar (Assets/Maintenance) end-to-end.
- Menjalankan **testing_agent_v3** untuk pengujian menyeluruh semua alur (RBAC, approval, upload, export).

---

### Phase 1 — Foundation (Baseline sistem, RBAC, user management)
> **Status: DONE** (sudah dibangun dan smoke-tested)

**User stories**
1. Super Admin bisa login.
2. Super Admin bisa membuat user dan menetapkan role.
3. Super Admin bisa menonaktifkan user.
4. User bisa melihat profil.
5. Sistem mencatat audit trail.

**Backend**
- Setup env + Mongo connection.
- Collections inti: `users`, `activity_logs`, `notifications`.
- Auth + RBAC dependency guard.
- Seed super admin + seed roles.

**Frontend**
- App shell (sidebar + topbar), routing + protected routes.
- Halaman core: Login, Dashboard, Users, Roles, Profile, Settings.

**Testing (testing_agent_v3)**
- Tetap wajib dijalankan untuk regression lintas modul setelah perubahan besar.

---

### Phase 2 — V1 Modul BMN (Aset + Foto + Lokasi + PJ)
> **Status: DONE** (fitur selesai; butuh verifikasi E2E upload/serve foto)

**User stories**
1. Admin tambah aset + multi foto (utama + galeri).
2. Cari/filter/sort/pagination aset.
3. Detail aset dengan galeri.
4. Penetapan penanggung jawab + riwayat.
5. Lokasi BMN.

**Backend**
- Collections: `assets`, `asset_images` (saat ini base64 + serve via `GET /api/images/{id}`).

**Frontend**
- Data Aset, Tambah/Edit, Detail, Lokasi, Penanggung Jawab.

**Testing (testing_agent_v3)**
- E2E: tambah aset + upload multi foto + set primary + tampil thumbnail.

---

### Phase 3 — Pemeliharaan + Approval Berjenjang (3 level) + Komentar
> **Status: DONE** (fitur selesai; butuh verifikasi E2E foto kerusakan + workflow)

**User stories**
1. Pengajuan pemeliharaan + upload foto kerusakan.
2. Approval T1 (Admin) → T2 (Kepala TU) → T3 (Kepala Satker).
3. Riwayat approval lengkap + komentar.
4. Notifikasi saat status berubah.

**Backend**
- Collections: `maintenance_requests`, `maintenance_images`.

**Frontend**
- List/Form/Detail/Approval.

**Testing (testing_agent_v3)**
- Simulasi alur lengkap T1→T2→T3 + reject path.

---

### Phase 4 — Modul Persediaan (Permintaan Barang) + Approval Admin + Status Pemenuhan
> **Status: DONE (versi awal)**, **akan di-upgrade untuk integrasi stok**

**User stories**
1. User ajukan permintaan multi-item.
2. Admin approve/reject.
3. Admin ubah status pemenuhan (Diproses→Diserahkan→Selesai).
4. Pemohon memantau status.

**Backend**
- Collection: `inventory_requests` (items embedded + comments + history).

**Frontend**
- Ajukan Permintaan, Approval, Monitoring, Riwayat, Detail.

**Testing (testing_agent_v3)**
- E2E submit → approve → status sampai selesai.

---

### Phase 5 — Notifikasi, Audit Trail UI, Laporan + Export
> **Status: DONE (fitur utama)**, perlu verifikasi export end-to-end

**User stories**
1. Badge notifikasi untuk pengajuan baru.
2. Notifikasi perubahan status.
3. Mark read / mark all.
4. Audit trail bisa ditelusuri.
5. Export laporan Excel/PDF.

**Testing (testing_agent_v3)**
- Uji notifikasi, suara, audit, export.

---

### Phase 6 — NEW: Modul **Stock Barang Persediaan** (P0 Feature Addition)
> **Status: NOT STARTED** (akan dibangun sekarang)

**Tujuan**
- Menambah submenu dan sistem **Stock Barang Persediaan** yang hanya dapat diakses **PENGELOLA BMN / ADMIN (Super Admin)**.
- Menyediakan dashboard stok, CRUD master barang, transaksi barang masuk, penyesuaian stok, riwayat pergerakan, notifikasi stok menipis/habis, serta integrasi dengan permintaan barang.

#### 6.1 User Stories (Stock)
1. Admin bisa melihat ringkasan: total jenis, stok aman/menipis/habis, barang masuk/keluar (filter periode).
2. Admin bisa mengelola master barang: tambah/edit/hapus + foto barang.
3. Admin bisa mencatat **Barang Masuk** → stok otomatis bertambah.
4. Admin bisa melakukan **Penyesuaian Stok** (tambah/kurang) dengan alasan wajib.
5. Sistem menyimpan **Riwayat Pergerakan Stok**.
6. Sistem mengirim notifikasi otomatis ke Admin saat stok ≤ minimum atau stok = 0.
7. Integrasi permintaan: stok hanya berkurang saat status **Barang Diserahkan/Selesai**.
8. Validasi stok sebelum approval; dukung opsi **partial approval** (jumlah diminta vs disetujui vs diserahkan).

#### 6.2 Backend (FastAPI + MongoDB)
**RBAC**
- Tambah permission: `stock_manage` (hanya role `Pengelola BMN / Admin`).
- Semua endpoint stock wajib `Depends(require_permission("stock_manage"))`.

**Collections baru (MongoDB)**
- `inventory_items`
- `inventory_categories` (opsional; bisa hard-coded seed kategori)
- `inventory_images` (foto barang persediaan)
- `inventory_stock_transactions`
- `inventory_stock_adjustments` (atau digabung jadi transaksi dengan type)

**Endpoints baru (router `routers/stock.py`)**
1. Dashboard stats:
   - `GET /api/stock/dashboard?period=today|week|month|year|custom&start=YYYY-MM-DD&end=YYYY-MM-DD`
2. Master items:
   - `GET /api/stock/items` (search/filter/sort/pagination)
   - `POST /api/stock/items`
   - `GET /api/stock/items/{id}`
   - `PUT /api/stock/items/{id}`
   - `DELETE /api/stock/items/{id}`
3. Foto item (mengikuti pola gambar existing: base64 + serve):
   - `POST /api/stock/items/{id}/images` (upload)
   - `PUT /api/stock/items/{id}/images/{image_id}/primary`
   - `DELETE /api/stock/items/{id}/images/{image_id}`
   - (Serve image reuse endpoint existing `GET /api/images/{image_id}` dengan perluasan lookup ke inventory_images)
4. Barang masuk:
   - `POST /api/stock/transactions/in` (record STOCK_IN)
5. Penyesuaian stok:
   - `POST /api/stock/adjustments` (ADJUSTMENT_IN/OUT) + alasan wajib
6. Riwayat stock:
   - `GET /api/stock/history` (filter tanggal, item, jenis transaksi)

**Integrasi dengan `routers/inventory.py`**
- Validasi stok saat admin approve:
  - Jika stok tidak cukup → blok approval (atau izinkan partial approval jika diaktifkan).
- Tambah field di `inventory_requests.items[]`:
  - `jumlah_diminta`, `jumlah_disetujui`, `jumlah_diserahkan`.
- Saat status berubah ke **Barang Diserahkan** atau **Selesai**:
  - sistem membuat transaksi STOCK_OUT dan mengurangi `current_stock` item.
- Pastikan stok **tidak** berkurang saat permintaan dibuat.

**Notifikasi stok menipis/habis**
- Setelah setiap perubahan stok (in/out/adjustment), cek:
  - `current_stock <= minimum_stock` → kirim notifikasi ke role Admin.
  - `current_stock == 0` → kirim notifikasi tipe “danger”.

**Audit trail**
- Semua aksi stock (tambah item, edit, delete, stock-in, adjustment, stock-out dari pemenuhan permintaan) wajib log ke `activity_logs`.

#### 6.3 Frontend (React)
**Menu & struktur sidebar**
- Update grup “Monitoring Persediaan” menjadi:
  - Stock Barang Persediaan (🔒 hanya admin)
  - Kebutuhan Barang (opsional placeholder bila belum dibuat)
  - Ajukan Permintaan
  - Approval
  - Monitoring Permintaan
  - Riwayat Permintaan

**Routes & halaman baru**
- `/persediaan/stock` → StockDashboard
- `/persediaan/stock/items` → StockList
- `/persediaan/stock/items/tambah` → StockForm
- `/persediaan/stock/items/:id` → StockItemDetail (opsional)
- `/persediaan/stock/in` → StockIn
- `/persediaan/stock/adjustment` → StockAdjustment
- `/persediaan/stock/history` → StockHistory

**Guard akses**
- Frontend:
  - Menu hanya tampil jika `can("stock_manage")`.
  - Jika user non-admin akses via URL → tampil halaman **Akses Ditolak**.
- Backend:
  - Semua endpoint stock 403 bila tanpa permission.

**Integrasi UI dengan permintaan**
- Di `InventoryDetail` (admin):
  - tampilkan stok tersedia per item (berdasarkan master stock), warning jika tidak cukup.
  - dukung input `jumlah_disetujui` (partial approval) + catatan wajib saat partial.
  - saat “Serahkan Barang” men-trigger pengurangan stok otomatis.

**Komponen foto**
- Reuse pola uploader (opsional: single uploader untuk foto barang persediaan) + thumbnail di tabel.

#### 6.4 Testing (testing_agent_v3)
- RBAC:
  - Role selain admin tidak bisa akses `/persediaan/stock*` (frontend + backend 403).
- Stock CRUD:
  - tambah item + upload foto + edit + delete.
- Stock movements:
  - barang masuk menaikkan stok, adjustment menaik/menurunkan, semuanya masuk riwayat.
- Integrasi permintaan:
  - permintaan dibuat tidak mengurangi stok.
  - approval validasi stok.
  - status “Barang Diserahkan/Selesai” mengurangi stok dan membuat transaksi STOCK_OUT.
  - notifikasi stok menipis/habis muncul.

---

### Phase 7 — Hardening, seed data, polish UX, regression
> Menggabungkan hardening lama (Phase 6 pada plan sebelumnya) + tambahan hardening untuk modul Stock.

**Scope**
- Review & kunci RBAC matrix final semua endpoint + semua halaman.
- Seed data lengkap:
  - users per role,
  - aset,
  - pemeliharaan,
  - permintaan persediaan,
  - master stock item + transaksi contoh.
- Konsistensi status badge & pesan error (termasuk halaman “Akses Ditolak”).
- Pastikan export laporan tetap berjalan.
- Final regression test menyeluruh.

**Testing (testing_agent_v3)**
- Uji lintas 6 role + alur BMN + Pemeliharaan + Persediaan + Stock + export.

## 3) Next Actions (Revised)
1. **Jalankan testing_agent_v3** untuk baseline regression (modul existing) sebelum menambah modul Stock.
2. Verifikasi E2E upload/serve gambar (aset & pemeliharaan) dan perbaiki jika ada issue.
3. Implement **Phase 6 (Stock Barang Persediaan)**:
   - Tambah permission `stock_manage` (admin only).
   - Buat router stock + collections + integrasi permintaan.
   - Tambah halaman stock di frontend + route + akses ditolak.
4. Jalankan **testing_agent_v3** khusus modul Stock + integrasi permintaan.

## 4) Success Criteria (Updated)
- Super admin bisa login dan kelola user/role; tidak ada registrasi publik.
- RBAC enforced di backend (401/403) + UI menyesuaikan role.
- BMN: CRUD aset + multi-foto tampil dan bisa diserve konsisten.
- Pemeliharaan: workflow + approval 3 tingkat dengan riwayat & komentar berjalan E2E.
- Persediaan: permintaan multi-item + approval + fulfillment berjalan.
- **Stock Persediaan (Admin-only)**:
  - Master item + foto, transaksi masuk, penyesuaian stok, riwayat stok.
  - Integrasi permintaan: stok berkurang hanya saat barang diserahkan/selesai.
  - Validasi stok sebelum approval + dukung partial approval (opsional).
  - Notifikasi stok menipis/habis ke admin.
- Notifikasi in-app (badge + read/unread + mark all) + suara browser bekerja.
- Audit trail & laporan (filter + export Excel/PDF) tersedia.
- Responsif (desktop–mobile), seed data memadai, dan seluruh fitur utama lolos pengujian bertahap dengan **testing_agent_v3**.
