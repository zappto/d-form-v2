# Sapto Changes — 30 September 2026 (DFORM-58)

Ticket Jira: **DFORM-58** — `[broadcast] Konstanta batas kembar 1.5 MB` (To Do → In Progress → In Review; Done oleh manusia). Tiket diklaim paten sebelum eksekusi. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: BE-38.

## BEFORE (masalah + bukti)

1. `BroadcastAttachmentService.php:13,15` mendefinisikan dua konstanta bernilai identik `MAX_FILE_BYTES = MAX_INLINE_IMAGE_BYTES = 1572864` + komentar '1.5 MB' 3x. Ubah batas satu jalur = mudah lupa sinkron jalur lain.
2. Suite broadcast punya 1 test merah warisan DFORM-54 (`both_schedule_requests_share_resolves_trait`).

## AFTER (fix + file)

1. Satu konstanta `MAX_BROADCAST_UPLOAD_BYTES = 1572864` + docblock (berlaku attachment & inline image; pecah lagi bila kebutuhan berbeda). `store()` + `validateInlineImages()` memakainya. Nilai byte, pesan error, mimes tak diubah.
2. Test baru `BroadcastAttachmentServiceLimitTest` (5 test: nilai terkunci + tepat-batas lolos + lewat-batas 422 untuk kedua jalur).
3. Fix bug asersi warisan DFORM-54 (1 baris, file test): `getDeclaringClass()` untuk method trait me-return using-class sehingga `assertSame` antar-request TAKKAN pernah lolos → diganti perbandingan `getFileName()` (definisi bersama yang sama). Intent test utuh.

## AKAR MASALAH (yang diselesaikan)

- Magic number ganda tanpa penanda kapan boleh divergen + test refleksi yang salah API (lolos review DFORM-54 karena kala itu tanpa runtime PHP). Kini suite broadcast hijau penuh.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-58 | refactor: satu konstanta batas + test + fix asersi warisan |
| — | _(docs ini)_ | PM+sapto | DFORM-58 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen dari fixer)

- `artisan test --filter=BroadcastAttachmentServiceLimitTest` → 5 passed, 9 assertions.
- `artisan test tests/Feature/Broadcasting tests/Unit/Broadcasting` → 32 passed, 94 assertions (sebelum fix asersi: 31+1 failed).
- `pint --test` 2 file → PASS.
- `git status` → hanya service + 2 test; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Frontend gates SKIP (nol `.vue`/`.ts`). d_form_app crash-loop pre-existing (entrypoint gagal migrasi) — verifikasi via container ephemeris image sama; di luar scope.

## Utang di luar scope

- Perbaiki entrypoint/migrasi `d_form_app` (crash-loop) — kandidat tooling. Push `main`+`dev` menunggu auth pemilik. Berikut urut: DFORM-59.
