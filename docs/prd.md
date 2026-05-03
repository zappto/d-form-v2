# Product Requirements Document (PRD) — D-Form v2

**Versi dokumen:** 1.1  
**Sumber:** Project Brief D-Form v2 (PDF), diselaraskan dengan keadaan repositori, keputusan stack frontend, dan **skema basis data terbaru** (`database/migrations/`, termasuk perubahan Mei 2026).

Dokumen ini mendefinisikan *apa* yang dibangun dan kriteria utamanya. Detail implementasi mengikuti [pedoman front-end](rules/front-end.md), [pedoman back-end](rules/back-end.md), dan [struktur folder](02-directory-structure.md). Tahapan pengiriman diuraikan di [milestone.md](milestone.md).

---

## 1. Ringkasan produk

D-Form v2 adalah aplikasi web untuk **membuat, mengelola, dan memproses formulir pendaftaran event secara dinamis**. Admin mendefinisikan event dan form tanpa mengubah kode; peserta mendaftar melalui form tersebut, menerima **email konfirmasi berisi QR Code**, dan kehadiran dicatat dengan **pemindaian QR** saat event berlangsung.

---

## 2. Tujuan produk

1. Menyediakan platform manajemen event berbasis web yang **dinamis dan dapat dikembangkan** (scalable secara arsitektur).
2. Memudahkan admin membuat **form event dengan input yang sepenuhnya dapat dikustomisasi** (label, tipe field, validasi, urutan).
3. Mempercepat **pendaftaran oleh peserta** melalui alur yang jelas (pilih event → isi form → konfirmasi).
4. Mengotomatisasi **email konfirmasi** pendaftaran beserta **QR unik** untuk absensi.
5. Menyediakan **absensi berbasis QR** yang terukur (waktu, event, petugas scan).
6. Menegakkan **pemisahan peran Admin dan Member** untuk keamanan dan pembatasan akses.

---

## 3. Persona dan use case utama

### 3.1 Admin / Event organizer

- Membuat dan mengatur event (metadata dan jadwal pendaftaran).
- Mendesain **form pendaftaran dinamis** per event.
- (Fase lanjutan) Mengirim **siaran email** terkait event mendatang atau perubahan informasi.
- Melihat **daftar peserta** dan statistik kehadiran.
- Melakukan **pemindaian QR** untuk absensi (kamera perangkat melalui web app).

### 3.2 Member / peserta

- Mendaftar ke event yang dibuka.
- Mengisi **form dinamis** sesuai konfigurasi admin.
- Menerima **email konfirmasi** (detail event + QR).
- Menghadiri event dan menunjukkan QR untuk discan.

---

## 4. Lingkup fitur

### 4.1 MVP (wajib untuk rilis pertama)

| Area | Deskripsi |
|------|-----------|
| **Autentikasi & peran** | Multi-peran: Admin dan Member. Alur login, registrasi akun, lupa password; akun dapat menautkan **Google** dan/atau **GitHub** (`google_id`, `github_id` pada `users`). Akses dibatasi middleware berdasarkan peran / permission. |
| **Manajemen event** | Admin membuat event dengan: judul, deskripsi, lokasi, rentang tanggal event, jendela buka–tutup pendaftaran, kuota, **harga (`price`)**, **banner**, **status**, **kategori** dan **sesi/informasi sesi** (kolom teks panjang di skema), serta **`registered_count`** (counter denormalisasi jumlah pendaftar). Halaman daftar event, detail event, dan indikator status pendaftaran (buka/tutup/kuota). |
| **Form per event** | Satu event dapat memiliki **satu atau lebih** entri `forms`: judul/deskripsi form, **`closed_at`** (penutupan form), **`visible_for`** (siapa yang boleh melihat/mengisi — disimpan sebagai JSON dipetakan ke enum aplikasi), dan opsional **banner form** (`banner_url` berbasis teks panjang untuk URL/data URL, plus `banner_caption`). |
| **Form builder dinamis** | Per form: label, nama field internal, **`input_type`** di basis data: `input`, `selectInput`, `textarea`, `datePicker`, `fileUpload`, **`radio`**, **`checkbox`** (perluasan enum di migrasi MySQL/MariaDB; SQLite mengikuti definisi tabel), deskripsi field opsional, **`metadata` JSON** untuk opsi, validasi, dan perilaku tambahan, serta **`order`** urutan field. |
| **Pendaftaran (Member)** | Pemilihan event dan form yang relevan, render form otomatis, penyimpanan jawaban dalam **kolom JSON `answers`** pada **`form_answers`**, upload file jika ada field file, validasi sesuai aturan admin. **Constraint unik `(user_id, form_id)`**: satu pengguna hanya boleh **satu submission** per form (pendaftaran ganda dicegah di basis data). |
| **Notifikasi email** | Email sukses pendaftaran berisi detail event, ringkasan data peserta, dan **QR unik** terikat pada submission (`form_answers`). Pengiriman melalui **SMTP**. Pengiriman non-blocking memakai **antrean (queue)**. **Audit pengiriman** pada tabel **`email_logs`**: tautan ke `form_answer_id` (nullable jika submission dihapus), `event_id`, `user_id`, alamat penerima, **status**, pesan error opsional, **`sent_at`**. |
| **Absensi QR** | Satu QR unik per **submission** (`form_answers`); pemindaian untuk kehadiran merupakan sasaran produk (waktu, event, **admin yang memproses scan**). **Catatan skema:** belum ada tabel dedikasi `event_attendances` (atau setara) di migrasi saat ini — implementasi pencatatan per scan dapat mengikuti milestone teknis terpisah. |
| **Dasbor & pelaporan** | Admin melihat jumlah pendaftar per event, statistik kehadiran, data peserta, dan log/rekaman absensi (minimal tampilan tabular; ekspor dapat berupa CSV pada MVP). |

### 4.2 Fase lanjutan (di luar MVP inti)

- **Email broadcast:** pengingat event mendatang, pemberitahuan perubahan jadwal/lokasi/deskripsi.
- Pelaporan lanjutan (filter lanjutan, agregasi, unduhan format tambahan).
- Optimasi skala dan observabilitas (metrik, rate limit, dsb.) sesuai kebutuhan operasional.

---

## 5. Kebutuhan non-fungsional

| Aspek | Requirement |
|-------|-------------|
| **Keamanan** | Autentikasi sesi/Laravel; pembatasan route per peran; validasi server-side untuk semua input form dinamis; upload file dibatasi tipe dan ukuran. |
| **Performa** | Pengiriman email tidak menghalangi response HTTP utama (queue). |
| **Audit email** | Riwayat pengiriman disimpan di **`email_logs`** (status, error, `sent_at`, korelasi ke submission/event/user). |
| **Audit absensi** | Rekaman scan (admin, waktu) menjadi sasaran akuntabilitas; **persistensi** mengikuti desain migrasi ketika tabel absensi ditambahkan. |
| **Kompatibilitas** | Flow scan QR dapat berjalan pada browser umum di desktop/mobile dengan akses kamera (dengan izin pengguna). |
| **Kualitas kode** | Formatter PHP (Laravel Pint, PSR-12) dan Prettier untuk front-end sesuai konfigurasi proyek. |

---

## 6. Stack teknologi (keputusan disepakati)

Deviasi dari Project Brief PDF bagian Blade/Livewire: **UI aplikasi utama dibangun dengan Vue + Inertia**, bukan Livewire/Volt sebagai lapisan UI utama.

### 6.1 Backend

- Laravel 12, PHP 8.2+.
- Endpoint/halaman melalui **Inertia** (response `Inertia::render`) dan validasi Form Request / controller sesuai pola proyek.
- Basis data: **MySQL / MariaDB**; **Redis** untuk cache/antrean sesuai konfigurasi.
- **Laravel Queue** untuk pengiriman email.
- Pustaka **QR Code**: **`endroid/qr-code`** (sesuai `composer.json`) untuk generate gambar / payload QR.
- Web server: sesuai deployment tim (mis. Frankenphp/Octane seperti yang tercatat di README proyek).

### 6.2 Frontend

- **Vue 3** (Composition API, `<script setup>`) dan **Inertia.js** untuk navigasi dan state halaman.
- **Tailwind CSS** dan komponen UI mengikuti konvensi repositori (mis. pola Shadcn-Vue di `resources/js/components/ui` — lihat [front-end rules](rules/front-end.md)).
- **Bukan** Livewire/Volt untuk fitur-fitur di atas; migrasi dari modul Livewire yang masih ada adalah bagian dari pekerjaan berkelanjutan (lihat [milestone.md](milestone.md)).

### 6.3 Opsional / keputusan tim

- **Filament** (paket ada di `composer.json`) dapat dipakai untuk panel admin terpisah atau dikurangi seiring konsolidasi UI di Vue — keputusan eksplisit disarankan di milestone M0 agar tidak ada duplikasi UX.

### 6.4 Tooling

- Node.js & npm untuk build front-end (Vite).
- Docker untuk lingkungan tim (folder `docker/`).
- Dokumentasi kode: PHPDoc dan Markdown sesuai kebiasaan proyek.

---

## 7. Model data (ringkas)

Entitas utama mengikuti **migrasi aktual** di `database/migrations/` (Laravel). Nama tabel di bawah ini menggantikan ringkasan brief yang sebelumnya memakai penamaan `event_form_*` / jadwal terpisah — **skema repositori memakai `forms` / `form_fields` / `form_answers`**, tanpa tabel `event_schedules` atau `event_attendances` pada migrasi saat ini (fitur absensi QR tetap pada rencana produk; payload QR mengacu **ID submission** / `form_answers`).

| Entitas / tabel | Peran |
|-----------------|--------|
| `users` | Akun pengguna (UUID); `google_id`, **`github_id`** untuk OAuth; peran Admin/Member lewat **Spatie Laravel Permission** (`permissions`, `roles`, pivot terkait). |
| `events` | Metadata event: tanggal, lokasi, kuota, **`registered_count`**, banner, harga, status, kategori & sesi (tipe teks panjang setelah migrasi perluasan kolom), jendela pendaftaran; soft delete. |
| `forms` | Form pendaftaran terikat **`event_id`**; judul, deskripsi, **`visible_for`** (JSON), **`closed_at`**, **`banner_url`** (longText, nullable), **`banner_caption`** (nullable); soft delete. |
| `form_fields` | Definisi field per **`form_id`**: **`input_type`** (enum/string sesuai driver: `input`, `selectInput`, `textarea`, `datePicker`, `fileUpload`, `radio`, `checkbox`), label, nama internal, **`metadata`** JSON, **`order`**; soft delete. |
| `form_answers` | Satu baris **submission** per kombinasi **user + form** (unik di basis data); kolom **`answers`** JSON; foreign key ke `users` dan `forms`. |
| `email_logs` | Audit pengiriman email: `form_answer_id` (nullable, `nullOnDelete`), `event_id`, `user_id`, `recipient_email`, `status`, `error_message`, `sent_at`; indeks pada `form_answer_id` dan `(event_id, status)`. |

**Infra Laravel (bukan domain bisnis inti, tetapi ada di migrasi):** `jobs`, `job_batches`, `failed_jobs`, `cache`, `cache_locks`, `sessions`, `password_reset_tokens`.

---

## 8. Kriteria sukses (definisi “selesai” tingkat produk)

- Alur **Admin**: buat event → bangun form → buka pendaftaran → lihat peserta → scan QR → lihat statistik kehadiran berjalan tanpa error kritikal pada jalur utama.
- Alur **Member**: daftar → isi form dinamis → terima email dengan QR → hadir dan tercatat absensi.
- Kebijakan akses: Member tidak mengakses panel admin; Admin tidak mengubah data orang lain tanpa alur yang disengaja (sesuai desain permission).
- Dokumentasi operasional minimal: cara set SMTP, queue worker, dan menjalankan build front-end (mengacu [README](../README.md) dan [instalasi](01-installation.md)).

---

## 9. Luar lingkup (eksplisit)

- Aplikasi mobile native (hanya web yang responsif).
- Pembayaran / gateway (kecuali ditambahkan di PRD revisi).
- Integrasi kalender pihak ketiga (Google Calendar, dsb.) kecuali ditambahkan kemudian.

---

## 10. Referensi

- [Milestone & fase pengiriman](milestone.md)
- [README proyek](../README.md)
- Skema basis data: folder migrasi Laravel [`../database/migrations/`](../database/migrations/)
- Project Brief D-Form v2 (PDF)
