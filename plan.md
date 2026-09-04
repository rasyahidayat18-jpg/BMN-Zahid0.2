# plan.md

## 1) Objectives
- Membangun aplikasi web responsif berbahasa Indonesia: **SISTEM MONITORING BMN DAN BARANG PERSEDIAAN** dengan 2 modul utama (BMN & Persediaan), **RBAC ketat di backend**, workflow approval, foto aset/kerusakan (base64 di MongoDB), notifikasi in-app + suara browser, audit trail, dan laporan ekspor.
- Stack: **React + FastAPI + MongoDB**, shadcn/ui + Tailwind, recharts, react-router-dom, JWT email/password + bcrypt.
- Seed awal: super admin **imigrasi.takengon2@gmail.com** (password **Admin@123**) + dummy data agar aplikasi terlihat hidup.

## 2) Implementation Steps

### Phase 1 — Foundation (tanpa POC terpisah; langsung bangun core & test bertahap)
**User stories**
1. Sebagai Super Admin, saya bisa login dengan email+password agar dapat mengelola sistem.
2. Sebagai Super Admin, saya bisa menambah user baru dan menetapkan role agar akses menu sesuai jabatan.
3. Sebagai Super Admin, saya bisa menonaktifkan user agar akun tidak bisa digunakan.
4. Sebagai user, saya bisa melihat profil saya agar data akun jelas.
5. Sebagai sistem, setiap aksi penting tercatat di audit trail agar dapat diaudit.

**Backend (FastAPI + MongoDB)**
- Setup proyek backend, koneksi Mongo, config env.
- Model/collection inti: `users`, `roles`(opsional hard-coded permissions), `activity_logs`.
- Auth: JWT login, bcrypt hash, refresh opsional (MVP: access token cukup), guard dependency per role.
- Seed super admin (idempotent) + seed roles.
- CRUD Manajemen User (admin-only): create/edit/activate/deactivate/reset password.
- Endpoint profil (self) + update foto profil (base64 opsional).
- Audit trail middleware/service untuk event penting.

**Frontend (React)**
- Setup app shell: layout sidebar + topbar + routing, guard route by role.
- Halaman: Login, Dashboard (placeholder stats), Manajemen User, Manajemen Role (MVP: daftar role & hak akses read-only), Profil, Pengaturan.
- Komponen standar: table, modal form, badge status, empty/loading state.

**Testing (testing_agent_v3)**
- Uji login, RBAC backend (akses ilegal ditolak), CRUD user, aktivasi/nonaktif, seed admin.

---

### Phase 2 — V1 Modul BMN (Aset + Foto + Lokasi + PJ)
**User stories**
1. Sebagai Admin, saya bisa menambah aset BMN beserta foto utama dan foto tambahan.
2. Sebagai Admin, saya bisa mencari/filter/sort aset agar cepat menemukan barang.
3. Sebagai user berwenang, saya bisa melihat detail aset dengan galeri & lightbox.
4. Sebagai Admin, saya bisa menetapkan Penanggung Jawab aset dan melihat riwayat perubahan PJ.
5. Sebagai Admin, saya bisa melihat aset per lokasi untuk monitoring cepat.

**Backend**
- Collections: `assets`, `asset_images`(base64 + metadata + isPrimary), `asset_locations`(seed), `asset_responsibles` + `asset_responsible_history`.
- CRUD aset (admin-only): fields umum + field khusus kendaraan, validasi kondisi/status.
- Upload gambar aset (multipart) → simpan base64 di `asset_images`, dukung multiple + set primary.
- Endpoint serve image: `GET /api/images/{imageId}` (content-type sesuai).
- Listing aset dengan query (search/filter/pagination) + join sederhana (resolve primary image + PJ + lokasi).

**Frontend**
- Data Aset BMN: tabel modern (search/filter/sort/pagination), thumbnail dari image endpoint.
- Tambah/Edit Aset: form dengan section kendaraan kondisional; uploader multi gambar + preview + set cover.
- Detail Aset: foto utama besar + galeri + lightbox + info lengkap.
- Lokasi BMN: kartu lokasi + jumlah aset + listing per lokasi.
- Penanggung Jawab Aset: assign PJ + riwayat.

**Testing (testing_agent_v3)**
- E2E: tambah aset + upload banyak foto + set primary + lihat detail + listing/filter + RBAC.

---

### Phase 3 — Pemeliharaan + Approval Berjenjang (3 level) + Komentar
**User stories**
1. Sebagai Penanggung Jawab Kendaraan, saya bisa mengajukan pemeliharaan dan mengunggah foto kerusakan.
2. Sebagai Admin (T1), saya bisa menyetujui/menolak dengan catatan dan meneruskan ke level berikutnya.
3. Sebagai Kepala TU (T2), saya bisa melakukan approval hanya pada permintaan yang sudah lolos T1.
4. Sebagai Kepala Satker (T3), saya bisa final approve/deny dan melihat riwayat approval lengkap.
5. Sebagai pengaju, saya mendapat notifikasi saat status berubah.

**Backend**
- Collections: `maintenance_requests`, `maintenance_images`(base64), `maintenance_approvals`, `maintenance_history`, `maintenance_notes`.
- Workflow status: Draft → Menunggu T1/T2/T3 → Disetujui/ Ditolak → Sedang Dalam Pemeliharaan → Selesai.
- Aturan RBAC per level approval + atomic update untuk transisi status.
- Riwayat approval (nama, role, level, timestamp, catatan) + komentar per pengajuan.

**Frontend**
- Form Pengajuan Pemeliharaan: auto nomor, pilih aset/kendaraan, upload foto kerusakan multiple, status.
- Approval Pemeliharaan: queue per level (role-based), aksi setujui/tolak + catatan.
- Detail pengajuan: timeline status, riwayat approval, komentar.
- Riwayat Pemeliharaan: filter status/tanggal/aset.

**Testing (testing_agent_v3)**
- Simulasi alur lengkap T1→T2→T3, tolak di level mana pun, komentar, validasi akses.

---

### Phase 4 — Modul Persediaan (Permintaan Barang) + Approval Admin
**User stories**
1. Sebagai Kasubsi, saya bisa membuat permintaan barang dengan banyak item dalam satu pengajuan.
2. Sebagai Admin, saya bisa menyetujui/menolak permintaan dengan alasan.
3. Sebagai Admin, saya bisa mengubah status pemenuhan (Diproses→Diserahkan→Selesai).
4. Sebagai pemohon, saya bisa memantau status permintaan saya.
5. Sebagai sistem, setiap perubahan status tercatat agar audit jelas.

**Backend**
- Collections: `inventory_requests`, `inventory_request_items`, `inventory_notes`.
- Nomor permintaan otomatis, multi-item, status workflow.
- Endpoint monitoring (admin) + endpoint riwayat (self).

**Frontend**
- Ajukan Permintaan: form header + tabel item dinamis (tambah/hapus baris), draft/submit.
- Approval Permintaan (admin): setujui/tolak + catatan.
- Monitoring & Riwayat: filter status/tanggal/unit.
- Komentar pada permintaan.

**Testing (testing_agent_v3)**
- E2E submit multi item → approve → ubah status hingga selesai, RBAC.

---

### Phase 5 — Notifikasi, Audit Trail UI, Laporan + Export
**User stories**
1. Sebagai Admin, saya melihat badge notifikasi saat ada pengajuan baru.
2. Sebagai pengaju, saya menerima notifikasi saat permintaan disetujui/ditolak/diteruskan.
3. Sebagai user, saya bisa menandai notifikasi sebagai sudah dibaca atau tandai semua.
4. Sebagai auditor, saya bisa menelusuri audit trail berdasarkan user/tanggal/aksi.
5. Sebagai Admin, saya bisa ekspor laporan ke Excel/PDF untuk pelaporan resmi.

**Backend**
- Collections: `notifications`.
- Trigger notifikasi pada event: pengajuan baru, approval per level, perubahan status.
- API notifikasi: list (unread first), mark read, mark all.
- Laporan: endpoint agregasi + filter (tanggal/unit/status/kondisi) + export Excel/PDF.

**Frontend**
- Bell dropdown + halaman Notifikasi (read/unread, mark all), suara browser saat notif baru (polling interval MVP).
- Halaman Audit Trail (filter + table).
- Halaman Laporan: tab per jenis laporan + filter + tombol Export Excel/PDF + Print.
- Dashboard: isi statistik + charts recharts (kondisi aset, permintaan per bulan) berbasis API.

**Testing (testing_agent_v3)**
- Uji notifikasi end-to-end, badge, mark read, suara, audit trail tampil, export berjalan.

---

### Phase 6 — Hardening, RBAC matrix final, seed data, polish UX
**User stories**
1. Sebagai tiap role, saya hanya melihat menu yang relevan dan tidak bisa akses endpoint terlarang.
2. Sebagai user mobile, tampilan tetap nyaman dipakai.
3. Sebagai Admin, saya bisa mencari cepat di semua tabel besar tanpa lag berlebihan.
4. Sebagai user, saya mendapat pesan error yang jelas saat aksi ditolak.
5. Sebagai instansi, aplikasi terlihat profesional (empty/loading/confirm dialog konsisten).

**Scope**
- Review & kunci RBAC per endpoint + per halaman.
- Seed data lengkap: users per role + aset + permintaan pemeliharaan + permintaan barang.
- Konsistensi status badge, dialog konfirmasi hapus, validasi form.
- Final regression test.

**Testing (testing_agent_v3)**
- Uji lintas role (6 role) + skenario utama BMN & Persediaan + export.

## 3) Next Actions
1. Buat struktur repo frontend/backend + konfigurasi Mongo connection.
2. Implement seed super admin (email: imigrasi.takengon2@gmail.com, password: Admin@123) + JWT login.
3. Implement RBAC dependency di backend + route guard di frontend.
4. Implement Manajemen User (backend+frontend) sebagai baseline semua modul.
5. Jalankan **testing_agent_v3** untuk Phase 1 sebelum lanjut ke modul BMN.

## 4) Success Criteria
- Super admin bisa login, kelola user, set role; tidak ada registrasi publik.
- RBAC benar-benar enforced di backend (akses tidak sah mendapat 401/403) dan menu UI menyesuaikan role.
- Modul BMN: CRUD aset + multi-foto (utama+galeri) tersimpan permanen (base64 MongoDB) dan tampil di detail.
- Pemeliharaan: workflow + approval 3 tingkat dengan riwayat & komentar berjalan end-to-end.
- Persediaan: pengajuan multi-item + approval admin + status fulfillment berjalan.
- Notifikasi in-app (badge + read/unread + mark all) + suara browser bekerja.
- Audit trail & laporan (filter + export Excel/PDF/print) tersedia.
- Responsif (desktop–mobile), ada seed data, dan seluruh fitur utama lolos pengujian bertahap dengan testing_agent_v3.
