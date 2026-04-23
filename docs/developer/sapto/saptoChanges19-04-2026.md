# Sapto Changes — 19 April 2026

Dokumentasi lengkap perubahan pada sesi pengembangan **desain kasar dashboard admin**, **halaman event (list & form)**, **landing navbar**, **middleware auth**, **data seed**, serta penyesuaian **Docker dev** dan **aset statis**. Tujuan utamanya adalah memberi tim gambaran jelas: *apa yang sudah berubah*, *di mana letaknya*, dan *apa yang masih placeholder* untuk integrasi lanjutan.

> **Catatan:** Beberapa bagian UI masih memakai **data dummy** (`resources/js/lib/dummyData.ts`) atau angka statis (misalnya trend di KPI) ketika props server belum tersedia — ini disengaja agar mockup bisa ditampilkan penuh. Bagian yang memakai data real dari backend sudah ditandai di bawah.

---

## Ringkasan (TL;DR)

- **Layout dashboard baru**: `DashboardLayout` memakai pola sidebar (reka-ui / shadcn-style) + `vue-sonner` untuk toast; navigasi utama di `DashboardSidebar` dengan role **admin/super-admin** vs **member**.
- **Halaman Dashboard (`/dashboard`)**: Admin mendapat KPI ringkas, daftar event terbaru (data server), chart registrasi & kategori, kalender mini & event calendar; user biasa melihat varian “My Dashboard” dengan beberapa nilai masih contoh.
- **List event admin**: UI baru dengan pencarian, filter kategori/sesi, tab (semua / upcoming / ongoing / completed / archived), pagination, progress kuota, dan banner thumbnail; terhubung ke `EventService::paginateForAdminIndex` + cache.
- **Form create/edit event**: Editor rich text **TipTap**, input tag-style **ComboboxTagInput**, upload banner dengan preview, dan **toast validasi** berbahasa Indonesia (`eventValidationToast.ts`).
- **Backend**: `HomeController` mengirim `recentEvents` + `stats`; `HandleInertiaRequests` membagikan **`roles`** user ke Inertia; `EventService` memuat **pagination + cache** untuk list admin.
- **Docker dev**: Entrypoint menjalankan Vite di lokal, `storage:link`, permission, dan Octane FrankenPHP; mapping port **3000→8000** (app) dan **5173→5173** (Vite).
- **Aset publik**: Banner, logo, dan gambar event untuk seed/demo; banyak file **Wayfinder** (`resources/js/actions/...`) ter-regenerate mengikuti rute Laravel.
- **Model `FormField`**: Penyesuaian (casts `metadata`, relasi) selaras form builder.
- **Seeder**: `EventSeeder` diperkaya dengan konten HTML & skenario tanggal/kuota; ditambah **`EventSessionSeeder`** untuk tabel `event_sessions` (opsional dipanggil dari `DatabaseSeeder` jika alur seed membutuhkannya).

---

## Daftar Area: File Utama

### Backend (PHP)

| Area | File / pola |
|------|-------------|
| Dashboard home | `app/Http/Controllers/Dashboard/HomeController.php` |
| Shared Inertia | `app/Http/Middleware/HandleInertiaRequests.php` |
| Event list & CRUD | `app/Http/Controllers/Dashboard/Events/EventController.php` |
| Layanan event | `app/Services/Event/EventService.php` (pagination + cache + `eventToInertiaArray`) |
| Model | `app/Models/FormField.php` |
| Factory | `database/factories/EventFactory.php`, `FormFactory.php` |
| Seed | `database/seeders/DatabaseSeeder.php`, `EventSeeder.php`, `EventCategorySeeder.php`, `FormSeeder.php`, **`EventSessionSeeder.php`** (baru) |

### Frontend (Vue / TS)

| Area | Lokasi |
|------|--------|
| Layout dashboard | `resources/js/layouts/DashboardLayout.vue` |
| Halaman | `resources/js/pages/Dashboard/Index.vue`, `Dashboard/Events/Index.vue`, `Create.vue`, `Edit.vue`, `Show.vue`, dll. |
| Modul dashboard | `resources/js/components/modules/dashboard/*` (sidebar, KPI, chart, calendar, empty state, banner, dll.) |
| Event forms | `resources/js/components/modules/dashboard/events/TipTapEditor.vue`, `ComboboxTagInput.vue` |
| Core UI | `resources/js/components/core/ConfirmationModal.vue` |
| UI kit (shadcn-style) | `resources/js/components/ui/*` (alert-dialog, avatar, badge, breadcrumb, card, checkbox, dropdown-menu, input, pagination, progress, scroll-area, select, sidebar, sonner, tabs, …) |
| Data mock & chart dummy | `resources/js/lib/dummyData.ts` |
| Validasi toast | `resources/js/lib/eventValidationToast.ts` |
| Landing | `resources/js/components/modules/landing/Navbar.vue` |
| Styles | `resources/css/app.css` |
| Wayfinder actions | `resources/js/actions/App/Http/Controllers/**/*.ts` (regenerasi) |

### DevOps & publik

| Area | File |
|------|------|
| Compose | `docker-compose.yml` |
| Image dev | `docker/Dockerfile.dev` |
| Entrypoint | `docker/entrypoint.sh` |
| Publik | `public/images/**`, `public/favicon.ico`, `public/index.php`, `public/.htaccess`, `public/robots.txt` |
| Paket JS | `package.json`, `package-lock.json` |

---

## Detail Perubahan Backend

### 1. `HomeController` — data untuk dashboard

Endpoint dashboard (`__invoke`) sekarang:

- Mengambil semua event non-trashed, memetakan **5 event terbaru** lewat `EventService::eventToInertiaArray()` (termasuk `registration_status`, `registered_count`).
- Menghitung **`stats`**: `totalEvents`, `activeEvents` (status published), `totalRegistrants` (sum `registered_count`), `completionRate` (proporsi event dengan status registrasi **Closed** dibanding total — untuk indikator “selesai” di KPI).

Halaman Inertia: `Dashboard/Index` dengan props `recentEvents` dan `stats`.

### 2. `HandleInertiaRequests` — role untuk UI

Properti shared `auth.user` jika login tidak hanya `toArray()` user, tetapi juga:

- **`roles`**: array nama role dari Spatie (`getRoleNames()->toArray()`).

Digunakan di sidebar dan `Dashboard/Index` untuk membedakan tampilan **admin** vs **user**.

### 3. `EventService` — list admin dengan cache

- Method **`paginateForAdminIndex`** memfilter search, kategori, sesi, status, soft-deleted, sorting, dan pagination; hasil di-cache (dengan fallback jika driver cache tidak mendukung tags).
- Tetap memakai **`eventToInertiaArray`** di controller untuk tiap item halaman list.

### 4. `FormField` model

Model diselaraskan untuk form dinamis: **`metadata`** di-cast ke array, relasi ke `Form`, UUID, soft deletes — konsisten dengan factory/seed form.

### 5. Factory & seeder

- **EventFactory / FormFactory**: disesuaikan dengan skema dan pengujian seed.
- **EventSeeder**: event dummy dengan deskripsi HTML (TipTap-friendly), tanggal relatif `now()`, variasi `registered_count`, banner path, draft vs published, dll.
- **EventSessionSeeder** (baru): mengisi/memperbarui tabel `event_sessions` dari enum `EventSession` (slug, label, sort order).
- **DatabaseSeeder**: urutan pemanggilan seeder user/role/event/form — cek file untuk akun default admin/super-admin/member.

---

## Detail Perubahan Frontend

### 1. `DashboardLayout` & shell

- Memakai **`SidebarProvider`** + **`DashboardSidebar`** + area konten utama dengan padding responsif.
- **Toast global**: `vue-sonner` (`Toaster`, posisi kanan atas, `richColors`).
- Header mobile: **`SidebarTrigger`** untuk membuka sidebar.

### 2. `DashboardSidebar`

- Navigasi: Dashboard, Events (admin: `/dashboard/events` + badge contoh; member: `/dashboard/user/events`), Recruitment (admin), dll.
- **Avatar** + dropdown user (logout via Wayfinder).
- Deteksi aktif route dan visibilitas item berdasarkan **role**.

### 3. Halaman `Dashboard/Index.vue`

- **Admin**: `PageHeader`, empat **`KpiCard`** (Total Events, Active, Total Registrants, Completion Rate), **`RecentEventsCard`**, **`MiniCalendar`**, **`RegistrationChart`**, **`CategoryChart`**, **`EventCalendar`**.
- **Non-admin**: KPI “My Dashboard” dan list upcoming (sebagian angka/event masih mengandalkan dummy atau subset).
- **Fallback**: Jika `recentEvents` / `stats` dari server kosong, komponen bisa jatuh ke **`dummyData`** agar tampilan tetap utuh.

**Yang sudah real dari server (admin):** `recentEvents`, `stats` dari `HomeController`.

**Yang masih mock / placeholder:** trend persentase di `KpiCard` (props statis di template), isi chart registrasi & kategori (membaca `dummyChartData` di `dummyData.ts`), sebagian konten kalender tergantung implementasi komponen.

### 4. `Dashboard/Events/Index.vue`

- Mode **server-side**: ketika props `events` (paginator) ada, filter dikirim via Inertia `router.get` ke index route dengan `preserveState` / `preserveScroll`.
- Tab tambahan untuk menyaring **upcoming / ongoing / completed** di sisi klien (berdasarkan tanggal), plus **archived** (trashed).
- Kartu event: banner (`EventBannerImage`), judul, lokasi, tanggal, badge status/kategori, **Progress** kuota (`registered_count` / `quota`).
- **`EmptyState`** jika tidak ada data.

### 5. Create / Edit event

- **TipTap** untuk deskripsi HTML (heading, list, table, link, dll. — lihat dependensi `@tiptap/*` di `package.json`).
- **ComboboxTagInput** untuk field yang membutuhkan pill/input gaya tag (sesuai desain).
- **Validasi**: pada error 422, **`showEventValidationToast`** memetakan key error Laravel ke label Bahasa Indonesia dan menampilkan satu toast dengan deskripsi multi-baris.

### 6. Komponen modul dashboard (cuplikan)

| Komponen | Fungsi singkat |
|----------|----------------|
| `PageHeader` | Judul + subtitle konsisten |
| `KpiCard` | Kartu metrik dengan ikon Lucide & animasi ringan |
| `RecentEventsCard` | Daftar event terbaru + link “view all” |
| `MiniCalendar` / `EventCalendar` | Kalender & agenda (cek sumber data di masing-masing file) |
| `RegistrationChart` / `CategoryChart` | Chart.js + vue-chartjs; saat ini data dari **`dummyData`** |
| `EmptyState` | State kosong yang ramah |
| `EventBannerImage` | Thumbnail banner dengan fallback |

### 7. `ConfirmationModal`

Wrapper **`AlertDialog`** (reka-ui) untuk konfirmasi aksi destruktif atau penting — reusable di seluruh app.

### 8. Landing `Navbar.vue`

Perbaikan tampilan: logo, link navigasi (Home, Features, Event, Docs), responsif mobile, efek scroll (border/shadow).

### 9. Dependensi npm utama yang mendukung desain

- **Inertia** Vue 3, **Tailwind** 4, **Lucide** icons  
- **reka-ui** + pola komponen UI (setara shadcn)  
- **TipTap** suite untuk editor  
- **Chart.js** + **vue-chartjs**  
- **vue-sonner** untuk toast  
- **@vueuse/core**, **class-variance-authority**, **clsx**, **tailwind-merge**

Jalankan di lokal setelah pull:

```bash
npm install
npm run dev
```

### 10. Wayfinder (`resources/js/actions`)

File di bawah `resources/js/actions/` banyak yang **ter-generate** dari rute Laravel. Jika menambah/mengubah route, regenerate sesuai kebiasaan project (misalnya `php artisan wayfinder:generate` — sesuaikan dengan dokumentasi internal).

---

## Docker & pengembangan lokal

- **`docker-compose.yml`**: service `app` mem-build `Dockerfile.dev`, volume source code, expose **3000** (FrankenPHP/Octane) dan **5173** (Vite), depends_on `db` & `redis`.
- **`docker/entrypoint.sh`**: install composer/npm jika perlu, permission, **`php artisan storage:link`**, generate `APP_KEY` jika kosong, menjalankan **Vite** di `APP_ENV=local`, lalu **`php artisan octane:frankenphp`** dengan argumen dari compose (mis. `--watch`).

Pastikan `.env` di container memiliki `APP_ENV=local` bila ingin Vite otomatis di dalam container.

---

## Aset publik (`public/`)

- **`public/images/banners/`** — gambar banner untuk seed/demo.  
- **`public/images/events/`** — ilustrasi event.  
- **`public/images/logo.*`** — logo aplikasi untuk navbar/UI.  
- Pembaruan favicon / `index.php` / `.htaccess` / robots — selaras hosting & SEO dasar.

Banner path di database mengacu ke **`storage`** atau folder `public` sesuai implementasi `EventResource` (URL banner).

---

## Dampak untuk Tim

| Peran | Yang perlu diketahui |
|-------|----------------------|
| **Frontend** | Komponen UI banyak bertambah; patokan styling mengikuti token Tailwind + komponen di `components/ui`. Cek fallback `dummyData` sebelum mengira data production. |
| **Backend** | Dashboard dan list event bergantung pada **`EventService`** dan field **`registered_count`** / status registrasi — selaras dengan perubahan [Nafan 17-04](../nafan/nafanChanges17-04-2026.md). |
| **QA** | Uji role admin vs member, filter & pagination event, create/edit dengan validasi error, upload banner, dan tampilan mobile (sidebar). |
| **DevOps** | Port compose dan entrypoint berubah; pastikan dokumentasi deploy non-Docker tetap memuat `npm run build` dan `storage:link`. |

---

## Checklist Sebelum Merge / Rilis

- [ ] `composer install` && `php artisan migrate` (dan seed jika perlu)
- [ ] `npm install` && `npm run build` untuk aset production
- [ ] `php artisan storage:link` di environment baru
- [ ] Regenerate Wayfinder bila ada perubahan route
- [ ] Smoke test: login admin & member, dashboard, events index/create/edit/show, logout
- [ ] Verifikasi gambar banner/seed tampil (path storage/public)
- [ ] (Opsional) Ganti angka **trend** KPI & sumber **chart** dari API sungguhan ketika endpoint analytics siap

---

## Catatan Tambahan

- Badge angka di sidebar Events (mis. `'8'`) saat ini **statis** — bisa diganti query count dari backend nanti.
- **User dashboard** (“Events Joined”, dll.) masih berisi placeholder — sesuaikan ketika data partisipasi user tersedia.
- Jika **`EventSessionSeeder`** tidak dipanggil di `DatabaseSeeder`, jalankan manual atau tambahkan ke `call([...])` bila fitur membutuhkan baris di `event_sessions`.

Dokumen ini dibuat agar tim bisa melanjutkan integrasi data real dan penyempurnaan UX tanpa kehilangan konteks desain kasar yang sudah ada.
