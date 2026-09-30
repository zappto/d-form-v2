# Sapto Changes — 30 September 2026 (DFORM-51)

Ticket Jira: **DFORM-51** — `[broadcast] Impor hilang di jalur retryFailed BroadcastDispatchService` (To Do → In Progress → In Review; Done oleh manusia). Branch: `feat/DFORM-51-retryfailed-import` dari `main`, remote `origin` (fork), tanpa push. Scope STRICT hanya tiket ini. Board-ID: BE-31.

## Ringkasan (TL;DR)

1. **1 baris fix:** `use App\Models\EmailBroadcastRecipient;` di `BroadcastDispatchService.php` (alfabetis, setelah `EmailBroadcast`). Nol perubahan logika — `retryFailed()` baris ~151 kini ter-resolve, retry manual tak lagi 500 Class-not-found.
2. **1 file test baru:** `tests/Feature/Broadcasting/BroadcastRetryFailedTest.php` (2 kasus, pola `EmailBroadcastFlowTest`): retry reset Failed→Pending + dispatch job, dan return 0 tanpa failed.
3. Verifikasi PM statis lolos; **test belum dieksekusi lokal (PHP_UNAVAILABLE_LOCAL)** — wajib run di env ber-PHP sebelum merge.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-51 | fix: tambah import hilang + test retryFailed |
| — | _(docs ini)_ | PM+sapto | DFORM-51 | docs: changelog + README |

## Per-commit

#### fix(DFORM-51): import + test

- `app/Services/Broadcasting/BroadcastDispatchService.php` — +1 `use` (baris 9). Grep: satu-satunya `EmailBroadcastRecipient::` di file kini ter-resolve; class lain (`RecipientStatus`, `BroadcastStatus`, `SendBroadcastRecipientJob`, `EmailBroadcast`, `DB`) sudah ter-import.
- `tests/Feature/Broadcasting/BroadcastRetryFailedTest.php` — BARU: `RefreshDatabase` + `RoleSeeder` + `superAdmin()` (pola tetangga); `Queue::fake()`; broadcast via `EmailBroadcast::query()->create()` (field semua `$fillable`: name/scheduled_at/delay_min/delay_max/subject/content/status/created_by); recipient via `recipients()->create()` (field semua `$fillable`); asersi enum `assertSame` valid karena `casts()` enum.

## Verifikasi PM

- `git status` → hanya `M service` + `?? test`. Bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Statis: namespace/use/class-match, `$fillable` vs field test, enum cast, `Queue::assertPushed/assertNothingPushed` — PASSED.
- Frontend gates: SKIP (nol `.vue`/`.ts` tersentuh) — `typecheck`/`lint`/`prettier` tak terdampak.
- **PHP_UNAVAILABLE_LOCAL:** `php -v` absen, `docker` absen — `./vendor/bin/pint --test` dan `php artisan test --filter=BroadcastRetryFailedTest` TIDAK dapat dijalankan lokal. CI GitHub: job `pint` = `continue-on-error` (non-blocking); tidak ada job test (TL-01). Tumpuan: review statis + wajib run test di env ber-PHP: `php artisan test --filter=BroadcastRetryFailedTest`.
- Risiko: `Queue::fake()` + `dispatch()->delay()->onQueue()` — `assertPushed` bentuk paling aman; bila fake bermasalah di versi Laravel, sesuaikan asersi.

## Utang di luar scope

- Normalisasi 10 file prettier-merah repo-wide (catatan DFORM-50) — bukan tiket ini.
- DFORM-52 dst (antrean broadcast) — satu tiket per giliran.
