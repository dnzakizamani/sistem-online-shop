# Azatech Online Shop — Order Management System

Sistem manajemen pesanan (*Order Management System*) sederhana berbasis Fullstack Web Application yang dirancang untuk mengelola katalog produk, data pelanggan, transaksi penjualan dengan pemotongan stok otomatis & atomik, serta laporan analitik dashboard.

Proyek ini dibangun untuk memenuhi kriteria **Technical Test — Medior Fullstack Developer** di **PT Laksmada Aza Simetri (Azatech)**.

---

## 1. Pilihan Tech Stack & Alasan

| Sisi | Teknologi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Backend** | Node.js (v22 LTS) + Express + TypeScript (Strict Mode) | Memberikan performa I/O tinggi, arsitektur modular yang ringan, serta *type-safety* penuh di seluruh layer (*compile-time error checking*). |
| **Database** | PostgreSQL | Basis data relasional standar industri yang handal dengan dukungan *ACID transaction*, *row-level locking*, indexing performa tinggi, dan integritas data yang kokoh. |
| **ORM & Migrasi** | Prisma ORM | Menyediakan migrasi deklaratif, skema strongly-typed, auto-generated Prisma Client, dan API transaksi database atomik (`prisma.$transaction`) yang sangat bersih. |
| **Autentikasi** | JSON Web Token (JWT) + bcryptjs | Mekanisme *stateless authentication* standar dengan token bearer yang aman, dilengkapi enkripsi password satu arah menggunakan *salt rounds* bcrypt. |
| **Validasi Input**| Zod | Validasi skema input yang ketat dan otomatis menghasilkan response error HTTP 422 dengan struktur field terpetakan rapi. |
| **Testing** | Vitest + Supertest | Framework testing modern berbasis ESM yang sangat cepat untuk menjalankan *integration / feature tests* mencakup skenario sukses, kegagalan stok, dan otorisasi. |
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | Mendukung *component-driven UI*, routing yang terstruktur, optimasi bundle produksi, serta fleksibilitas pengelolaan state. |
| **Styling** | Tailwind CSS + Lucide Icons | *Utility-first styling* yang responsif (desktop & mobile-friendly) tanpa CSS bloated, menghasilkan tampilan dashboard yang bersih dan modern. |
| **Data Fetching**| TanStack Query (React Query) | Menyediakan otomatisasi *caching*, *revalidation*, penanganan state *loading/error*, dan mutasi asinkron yang konsisten. |
| **Visualisasi** | Recharts | Render grafik tren pendapatan harian yang responsif, interaktif, dan ringan di halaman dashboard. |

---

## 2. Panduan Setup Aplikasi (Maksimal ±6 Perintah)

### Opsi A: Menggunakan Docker Compose (Paling Praktis)
Jika Anda memiliki Docker terpasang, cukup jalankan:
```bash
# 1. Jalankan seluruh container (Postgres, Backend, Frontend)
docker compose up -d --build

# 2. Jalankan migrasi & seeder awal di container backend
docker compose exec backend npm run prisma:migrate && docker compose exec backend npm run prisma:seed
```

---

### Opsi B: Setup Lokal Manual (PostgreSQL Lokal)

Pastikan service PostgreSQL lokal Anda telah aktif (port 5432).

```bash
# 1. Buat database di PostgreSQL
createdb azatech_order_db

# 2. Masuk ke folder backend & pasang dependensi
cd backend && npm install

# 3. Jalankan sinkronisasi skema Prisma dan seeder data
npx prisma db push && npm run prisma:seed

# 4. Jalankan backend server (berjalan di http://localhost:5000)
npm run dev

# 5. Di terminal baru: masuk ke folder frontend & pasang dependensi
cd ../frontend && npm install

# 6. Jalankan frontend development server (berjalan di http://localhost:3000)
npm run dev
```

### Akun Login Default (Seeder)
* **URL Aplikasi:** `http://localhost:3000`
* **Email:** `admin@azatech.id`
* **Password:** `admin123`
* **Dokumentasi API (Swagger UI):** `http://localhost:5000/api/docs`

---

## 3. Logika Bisnis Aplikasi & Penanganan Stok

### Alur Pembuatan Pesanan (`POST /api/orders`)
1. **Otorisasi & Sanitasi Input:**
   * Client hanya mengirimkan `customer_id` dan daftar `items: [{ product_id, quantity }]`.
   * **Aturan Keamanan:** Nilai harga (`price`), subtotal, maupun total transaksi **wajib dihitung di server** dan tidak diterima dari input client untuk mencegah manipulasi data.
2. **Transaksi Database Atomik (`prisma.$transaction`):**
   * Seluruh alur validasi dan pengurangan stok dibungkus dalam satu blok transaksi database tunggal.
   * Server memeriksa keberadaan pelanggan yang aktif (bukan soft-deleted).
   * Server mengambil data produk terkini berdasarkan ID produk yang dipesan.
3. **Pengecekan Stok Menyeluruh (*All-or-Nothing*):**
   * Setiap item dicek ketersediaan stok fisiknya di database (`product.stock >= item.quantity`).
   * Jika ada **satu saja item** yang stoknya kurang (misal stok tersisa 3 tapi dipesan 5), transaksi **langsung digagalkan** dan database membatalkan seluruh operasi (*rollback*).
   * Tidak ada satu pun stok produk lain yang terpotong jika salah satu item gagal.
   * Pesan error dikembalikan dalam format spesifik `errors: { "items.X.quantity": ["Stok [Nama Produk] tersisa Y, diminta Z"] }` dengan HTTP status **422 Unprocessable Entity**.
4. **Eksekusi Pengurangan Stok & Snapshot Harga:**
   * Jika seluruh stok valid, kuantitas stok masing-masing produk dikurangi di database (`decrement: quantity`).
   * Harga satuan produk saat itu di-snapshot ke kolom `unit_price` di tabel `order_items`. Hal ini menjamin keakuratan laporan keuangan historis meskipun di masa mendatang harga produk di katalog mengalami perubahan.
5. **Auto-Generate Nomor Pesanan Unik:**
   * Nomor pesanan digenerate otomatis di server dengan format `INV-YYYYMMDD-XXXX`.
   * Urutan nomor (`XXXX`) dihitung secara sequential berdasarkan jumlah order yang telah dibuat pada hari kalender tersebut (contoh: `INV-20261028-0001`, `INV-20261028-0002`).

---

## 4. Cara Menjalankan Automated Tests

Backend dilengkapi dengan test otomatis (*integration / feature testing*) menggunakan **Vitest** dan **Supertest** yang menguji skenario nyata dari layer HTTP hingga database.

```bash
cd backend
npm run test
```

### Skenario Test yang Dicakup:
1. `POST /api/auth/login`: Sukses login mengembalikan JWT token & info user.
2. `POST /api/auth/login`: Menolak login dengan password salah (HTTP 401).
3. `GET /api/auth/me`: Akses tanpa token ditolak (HTTP 401).
4. `GET /api/auth/me`: Akses profil berhasil jika menyertakan token bearer.
5. `GET /api/products`: Mengambil list produk dengan pagination & search query.
6. `POST /api/products`: Validasi input gagal saat parameter kosong / stok negatif (HTTP 422).
7. `POST /api/orders` (**Wajib**): Buat order sukses, memotong stok di DB, dan generate order_number `INV-YYYYMMDD-XXXX`.
8. `POST /api/orders` (**Wajib**): Order gagal saat stok tidak cukup (HTTP 422) & verifikasi rollback atomik (stok tidak berubah sama sekali).
9. `POST /api/orders` (**Wajib**): Validasi input gagal saat order tanpa items (HTTP 422).
10. `POST /api/orders` (**Wajib**): Akses order ditolak jika tanpa token (HTTP 401).
11. `GET /api/dashboard/summary`: Mengambil ringkasan data transaksi, omset, top 5 produk, dan stok menipis.

---

## 5. Dokumentasi API

Tersedia dalam 2 format:
1. **Interactive Swagger / OpenAPI UI:** Kunjungi `http://localhost:5000/api/docs` saat server backend berjalan.
2. **Postman Collection:** File siap import tersedia di path:  
   `backend/docs/azatech_order_api.postman_collection.json`.

---

## 6. Asumsi, Keterbatasan, & Hal yang Dapat Ditingkatkan

### Asumsi
* Transaksi penjualan dianggap lunas seketika (*instant completed purchase*), sehingga stok langsung dipotong saat order dibuat.
* Format mata uang default adalah Rupiah (IDR) tanpa desimal sen.

### Keterbatasan Saat Ini
* Belum ada fitur refund / pembatalan order yang mengembalikan stok secara otomatis.
* Pembatasan hak akses berbasis multi-role (misal: Superadmin vs Staff Gudang vs Kasir) belum diimplementasikan karena scope studi kasus berfokus pada 1 role admin.

### Rencana Pengembangan Lebih Lanjut
* Menambahkan status order bertahap (*Pending Payment*, *Processing*, *Shipped*, *Completed*, *Cancelled*).
* Menambahkan integrasi Payment Gateway (Midtrans / Xendit).
* Penambahan sistem audit log untuk mencatat perubahan stok produk (*stock movement history*).
* Implementasi rate limiting dan Redis caching untuk query produk dan dashboard summary.

---

## 7. AI Usage

Sesuai ketentuan teknis, berikut adalah rincian penggunaan AI Assistant dalam pengerjaan proyek ini:
* **Tool AI yang Digunakan:** Gemini.
* **Bagian yang Dibantu AI:**
  1. *Scaffolding & Boilerplate:* Pembuatan skema Prisma awal, konfigurasi TypeScript strict mode, dan setup skeleton Next.js 15.
  2. *Data Seeding:* Pembuatan daftar 22 produk kebutuhan sehari-hari dan 16 nama/alamat pelanggan Indonesia yang realistis untuk seeder database.
  3. *Testing Suite:* Penyusunan skenario pengujian Supertest dan assertions untuk memastikan seluruh requirement teknis terpenuhi.
* Seluruh logika transaksi database atomik, alur validasi Zod, penanganan error stok, perhitungan harga di server, dan interaksi komponen frontend telah ditinjau dan diverifikasi secara langsung.
