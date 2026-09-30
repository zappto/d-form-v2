# Sapto Changes — 30 September 2026 (DFORM-56)

Ticket Jira: **DFORM-56** — `[users] God method toDetailPayload +-170 baris` (In Progress; Done oleh manusia). Branch: `dev` langsung (alur baru), tanpa push (auth origin menunggu pemilik). Scope STRICT hanya tiket ini. Board-ID: BE-36.

## Ringkasan (TL;DR)

1. `toDetailPayload` (171 baris) dipangkas jadi **orkestrator tipis 27 baris** + **6 builder domain privat** (`buildProfileSummary`, `buildRegistrationHistory`, `buildCreatedEvents`, `buildRecruitmentHistory`, `buildStaffActivity`, `buildDetailPermissions`) + 3 helper baris (`mapRegistrationRow`, `mapRecruitmentRow`, `eventStatusValue` satu sumber mapping status event).
2. **Test paritas dulu (TDD)**: `test_super_admin_can_view_user_detail_with_registrations` diperkuat — fixture event-buatan-member + aplikasi recruitment email-match + assert penuh 8 kunci stats, `events_created`, `recruitment_applications`, `staff`, `user`, `permissions`.
3. **YAGNI**: privat method dulu, tanpa kelas Reader baru. Verifikasi PM: diff ekuivalensi manual + grep bukti; **test/pint belum dieksekusi lokal (PHP_UNAVAILABLE_LOCAL)**.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `01afa7d` | PM+sapto | DFORM-56 | test: paritas payload detail registrations/stats/events/staff/permissions |
| — | `be769e8` | PM+sapto | DFORM-56 | refactor: pecah toDetailPayload 171 baris jadi orkestrator + 6 builder domain |
| — | _(docs ini)_ | PM+sapto | DFORM-56 | docs: changelog + README |

## Per-commit

#### test(DFORM-56): paritas payload

- `tests/Feature/UserManagementTest.php` — `test_super_admin_can_view_user_detail_with_registrations` diperluas (satu-satunya test yang diubah): fixture `Member Created Event` (`created_by` member) + `RecruitmentApplication` (`personal_email` cocok, `match: personal_email`) + assert 8 kunci stats (`events_joined`, `registrations_accepted/pending`, `attendances_as_participant`, `events_created`, `recruitment_applications`, `scans_recorded`, `interviews_assigned`), `has` `events_created`/`recruitment_applications`/`staff`, `staff.interviewer_divisions` 0 + 2 count 0, `user.name/roles/oauth`.

#### refactor(DFORM-56): orkestrator + builder

- `app/Services/User/UserManagementService.php` — `toDetailPayload` kini orkestrator 27 baris (load + 6 panggil + return gabung); `buildRegistrationHistory` kembalikan `{registrations, stats}` satu domain; stats lintas-domain digabung di orkestrator (`...registrationStats` + `count(createdEvents)` + `count(recruitmentHistory)` + count staff dari payload staff sendiri, tanpa query ganda); `buildRecruitmentHistory` early-return `[]` bila email kosong; `eventStatusValue(EventStatus|string|null): ?string` gantikan 2 duplikat `$event->status?->value ?? $event->status` (mapping enum lain `?->value` tunggal tak diduplikat, tak disentuh); metode lain (`paginateForAdminIndex`, `toInertiaArray`, `create/update/delete`, `roleOptions`) NOL ubah.

## Keputusan

- Tanda tangan publik `toDetailPayload(User, User, ?Request)` DIPERTAHANKAN 3 param (1 baris alasan: satu-satunya call-site `UserManagementController::show`, ubah ke objek argumen churn controller+test tanpa manfaat; builder internal semua ≤2 param).
- `buildStaffActivity` kembalikan payload `staff` final (`interviewer_divisions`, `interviews_assigned_count`, `scans_recorded_count`); stats `scans_recorded`/`interviews_assigned` diturunkan dari payload itu di orkestrator — satu sumber, tanpa query ganda.
- Limit `50/20/20` dipertahankan inline (satu-pakai per builder, bukan lintas-pakai; bukan magic tersebar).
- Tanpa kelas Reader baru (YAGNI): 6 builder privat cukup; ekstraksi lintas-pemakai hanya bila pemakai kedua terbukti.

## Verifikasi PM

- `awk '/function toDetailPayload/,/^    }$/'` → **27 baris** (sebelum 171) — PASSED.
- `grep function` → 6 builder + `mapRegistrationRow`/`mapRecruitmentRow`/`eventStatusValue`, tanpa suffix `Helper/Manager/Util`, tanpa AI-slop — PASSED.
- Diff hunk-per-hunk vs sebelum: query, eager-load, map key, stats filter, Gate policy identik (hanya pindah blok) — PASSED manual.
- `git status` → hanya 2 M + docs baru; bersih dari `Makefile`, `database/seeders/UserSeeder.php`, `.env`, dan 8 file kotor DFORM-55 orang lain — PASSED.
- Frontend gates SKIP (nol `.vue`/`.ts`). **PHP_UNAVAILABLE_LOCAL** (`php: command not found`): wajib `php artisan test --filter=UserManagementTest` + `./vendor/bin/pint --test app/Services/User/UserManagementService.php tests/Feature/UserManagementTest.php` di env ber-PHP sebelum PR `dev`→`main`.

## Utang di luar scope

- `paginateForAdminIndex` masih campur query+map (kandidat builder bila tiket susulan; tak disentuh — di luar tiket).
- Limit `50/20/20` belum jadi konstanta bernama (ditunggu kebutuhan lintas-pakai kedua).
- Push `dev` menunggu auth pemilik. Berikut urut: merge menunggu review e2e + CI (Prettier/vue-tsc blocking).
