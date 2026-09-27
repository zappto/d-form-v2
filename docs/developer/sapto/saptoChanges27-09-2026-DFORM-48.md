# Sapto Changes — 27 September 2026 (DFORM-48)

Penutup **saran tindak lanjut** dari [`saptoChanges27-09-2026-DFORM-34.md`](./saptoChanges27-09-2026-DFORM-34.md) (Mx-C banner) pada bagian `Deviasi yang disengaja — batas/format banner 5 MB`. Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-48** — `[upload] Selaraskan batas banner backend ke 5 MB + test batas (follow-up DFORM-34)` (status: In Review). Basis kerja: DFORM-34 `:71` yang mencatat backend periods/events masih `max:10240` (10 MB) sementara komponen klien mengunci 5 MB. Dua commit: `97bf512` (7 file, +59/−9) + `8ae73ee` (1 baris komentar). HEAD saat dokumen ini ditulis: `8ae73ee`.

Ticket ini **menyelaraskan batas ukuran** banner backend event & periode ke 5 MB (`max:5120` KB) plus test batas. **Daftar mimes/format tidak diubah** — perbedaan format WebP/GIF tetap terbuka (dicatat di Utang di luar scope). Tidak ada perubahan JS/Vue.

## Ringkasan (TL;DR)

1. **Masalah**: sejak DFORM-34, komponen klien `BannerPickerField` mengunci banner di **5 MB** (dan hanya PNG/JPG/GIF), sedangkan validasi backend event & periode masih **`max:10240`** (10 MB). Klien jadi lebih ketat daripada backend.
2. **Keputusan user**: **turunkan backend ke 5 MB** (bukan memparameterkan komponen `maxBytes`/`accept`).
3. Empat FormRequest diturunkan `max:10240` → `max:5120`: `StoreEventRequest` / `UpdateEventRequest` (banner) dan `StoreRecruitmentPeriodRequest` / `UpdateRecruitmentPeriodRequest` (banner). Pesan galat event & periode ikut ke 5 MB.
4. Dua **test batas baru**: `EventManagementTest::test_store_rejects_banner_over_5mb` (POST `dashboard.events.store`, banner 5121 KB) dan `RecruitmentPeriodBannerTest::test_store_menolak_banner_lebih_dari_5mb` (POST `dashboard.recruitment.periods.store`).
5. Nilai dipilih **`5120` dalam KB**, konsisten dengan `max:5120` yang sudah dipakai di `app/Http/Requests/FieldModifyRequest.php` (`banner_file`, `option_images.*.*`).
6. Komentar basi `(image, max 10MB)` di `FieldOperationController.php` dirapikan ke `max 5MB` — dua lokasi.
7. **Tidak ada test backend yang mem-pin `10240`**, jadi menurunkan batas tidak memerahkan test lama.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `97bf512` | zappto | DFORM-48 | fix(validation,DFORM-34): turunkan batas banner event & periode jadi 5 MB |
| — | `8ae73ee` | zappto | DFORM-48 | docs(comment,DFORM-48): rapikan komentar basi option_images max 5 MB |

Waktu commit tidak dicatat di brief; kolom Author diisi `zappto` (pemilik seri) dan **belum diverifikasi ulang tanpa shell**. Pesan commit pertama menyebut `DFORM-34` (asal follow-up), commit kedua menyebut `DFORM-48`.

## Per-commit

#### `97bf512` fix(validation,DFORM-34): turunkan batas banner event & periode jadi 5 MB

- Apa (7 file, +59/−9):
  - `app/Http/Requests/StoreEventRequest.php:40` — `'banner' => ['required', 'image', 'max:5120']` (sebelumnya `max:10240`); pesan `:89` → `'Banner image size cannot exceed 5 MB.'`.
  - `app/Http/Requests/UpdateEventRequest.php:40` — `'banner' => ['sometimes', 'nullable', 'image', 'max:5120']`; pesan `:88` → 5 MB.
  - `app/Http/Requests/Recruitment/StoreRecruitmentPeriodRequest.php:27` — `'banner' => ['sometimes', 'nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp']` (**mimes tidak diubah**); pesan `:38` → `'Ukuran banner tidak boleh lebih dari 5 MB.'`.
  - `app/Http/Requests/Recruitment/UpdateRecruitmentPeriodRequest.php:27` + pesan `:38` — identik dengan di atas.
  - `app/Http/Controllers/Dashboard/Events/Forms/FieldOperationController.php:44` — komentar `(image, max 10MB …)` → `max 5MB` (banner form builder).
  - `tests/Feature/EventManagementTest.php` — test baru `test_store_rejects_banner_over_5mb`: POST `route('dashboard.events.store')` dengan `banner` `UploadedFile::fake()->image('banner.jpg')->size(5121)`, asersi pesan `'Banner image size cannot exceed 5 MB.'`, dan `assertDatabaseMissing('events', …)`.
  - `tests/Feature/Recruitment/RecruitmentPeriodBannerTest.php` — test baru `test_store_menolak_banner_lebih_dari_5mb`: POST `route('dashboard.recruitment.periods.store')` dengan banner 5121 KB, asersi `'Ukuran banner tidak boleh lebih dari 5 MB.'` + `assertDatabaseMissing('recruitment_periods', …)`.
- Rujukan aturan: `5120` (KB) dipilih agar konsisten dengan `app/Http/Requests/FieldModifyRequest.php:49` (`banner_file`) dan `:52` (`option_images.*.*`) yang memang sudah `max:5120`.
- Jira: DFORM-48 (pesan commit menulis `DFORM-34`).

#### `8ae73ee` docs(comment,DFORM-48): rapikan komentar basi option_images max 5 MB

- Apa (1 baris): `app/Http/Controllers/Dashboard/Events/Forms/FieldOperationController.php:54` — komentar `(image, max 10MB — samakan banner)` → `(image, max 5MB — samakan banner)`.
- Alasan: `option_images.*.*` di `FieldModifyRequest.php:52` memang sudah `max:5120`, jadi komentar lama salah dan kini selaras.
- Jira: DFORM-48.

## Keputusan & deviasi

- **Arah penyelarasan: turunkan backend, bukan naikkan klien.** DFORM-34 menawarkan dua jalan (selaraskan backend **atau** parameterkan komponen). User memilih **turunkan backend ke 5 MB** — satu batas global, tanpa menyentuh komponen/konsumen.
- **Nilai `5120` KB.** Bukan `5 * 1024` literal di rule, melainkan `5120` agar sebaris dengan aturan builder yang sudah ada (`FieldModifyRequest`). (Keduanya ekuivalen: 5 × 1024.)
- **Daftar mimes sengaja tidak disentuh.** Fokus ticket hanya batas ukuran. Perbedaan format WebP/GIF dibiarkan (lihat Utang di luar scope).
- **Test lewat rute store (end-to-end), bukan menguji array rules FormRequest langsung.** Mengikuti pola test batas banner yang sudah ada di repo, sehingga jalur validasi nyata (termasuk pesan) yang diuji.
- **Komentar basi dirapikan di commit terpisah** (`8ae73ee`) agar commit fungsional (`97bf512`) tetap fokus validasi + test.

## Utang di luar scope (eksplisit, **tidak** dikerjakan di DFORM-48)

Dicatat agar tidak terlihat "selesai semua":

- **Beda mimes WebP/GIF.** Banner event memakai rule `image` (jpg/jpeg/png/bmp/gif/svg/webp), sedangkan banner periode memakai `mimes:jpg,jpeg,png,webp`. Klien (`BannerPickerField`) hanya PNG/JPEG/GIF. Setelah DFORM-48, **ukuran** selaras 5 MB, tetapi **format** masih belum selaras. Ini kelanjutan trade-off DFORM-34.
- **Avatar: `UpdateDashboardProfileAvatarRequest.php:21` `max:2048`** vs UI `Profile.vue:440` yang menulis "di bawah 5MB" — belum diselaraskan, di luar ticket ini.
- **Builder `file_upload`: `fieldMapping.ts:260` `max_size: 10240`** + `FieldRenderer.vue:350` ("hingga 10 MB") — domain builder, **sengaja dibiarkan** di ticket ini.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell**, jadi tidak bisa menjalankan `php artisan test`, `pint`, atau `git show`. Yang **sudah diverifikasi langsung ke tree**: nilai rule `max:5120` di empat FormRequest, pesan 5 MB, dua komentar `max 5MB` di `FieldOperationController.php`, dan isi kedua test batas baru. Sisanya ditandai **"dari brief"**.

- **Diverifikasi langsung (tree)**:
  - `StoreEventRequest.php:40` → `max:5120`; `:89` → `'Banner image size cannot exceed 5 MB.'`.
  - `UpdateEventRequest.php:40` → `max:5120`; `:88` → pesan 5 MB.
  - `StoreRecruitmentPeriodRequest.php:27` → `max:5120` + `mimes:jpg,jpeg,png,webp` (tidak berubah); `:38` → `'Ukuran banner tidak boleh lebih dari 5 MB.'`. `UpdateRecruitmentPeriodRequest.php:27`/`:38` identik.
  - `FieldOperationController.php:44` → `max 5MB`; `:54` → `max 5MB`.
  - `EventManagementTest.php:192` `test_store_rejects_banner_over_5mb` (banner `size(5121)`, asersi pesan 5 MB, `assertDatabaseMissing('events', …)`); `RecruitmentPeriodBannerTest.php:145` `test_store_menolak_banner_lebih_dari_5mb` (banner `size(5121)`, asersi pesan 5 MB, `assertDatabaseMissing('recruitment_periods', …)`).
- **Dari brief (belum diverifikasi independen)**: commit `97bf512` = 7 file, +59/−9; commit `8ae73ee` = 1 baris; dua tes baru **lolos** (6 assertions) via `podman exec -w /app d_form_app php artisan test --filter=…`; dua file test terkait **17 lolos / 88 assertions** tanpa regresi; `./vendor/bin/pint --test` pada file yang diubah → **PASS (PSR 12)**; tidak ada test backend yang mem-pin `10240`.
- **Tidak ada perubahan JS/Vue** pada kedua commit ini.
- **Status ticket**: Jira DFORM-48 **In Review** (satu komentar spec/implementasi dilampirkan).
- **Sumber kebenaran akhir**: diff Git + status Jira DFORM-48.

## Checklist

- [x] Empat rule banner backend turun ke `max:5120` (event store/update, periode store/update)
- [x] Pesan galat event & periode menyebut 5 MB
- [x] Dua test batas baru (event + periode), asersi pesan + DB tidak terisi
- [x] Komentar basi `max 10MB` → `max 5MB` di `FieldOperationController.php`
- [x] Mimes tidak diubah (di luar scope)
- [x] `./vendor/bin/pint --test` pada file yang diubah → PASS
- [x] Tidak ada test backend yang mem-pin `10240`
- [ ] Utang tercatat: format WebP/GIF (periode vs event), avatar `max:2048` vs copy "5MB", builder `max_size: 10240`
