# Sapto Changes — 30 September 2026 (DFORM-53)

Ticket Jira: **DFORM-53** — `[broadcast] Invarian normalisasi email ditulis >=6x` (To Do → In Progress → In Review; Done oleh manusia). Branch: `dev` langsung (alur baru), tanpa push (auth origin menunggu pemilik). Scope STRICT hanya tiket ini. Board-ID: BE-33.

## Ringkasan (TL;DR)

1. Invarian trim→lowercase→FILTER_VALIDATE_EMAIL disatukan ke **satu fungsi kanonik** `App\Support\EmailAddress::normalizeEmail(?string): ?string` (null bila kosong/invalid), dipakai di **7 titik**: 4 resolver + 1 snapshot service + 2 di `CsvRecipientParser`.
2. Fallback `student_email` DIPERTAHANKAN di call-site (logika domain, bukan invarian).
3. **1 file test baru** (4 kasus). Verifikasi PM: ekuivalensi perilaku per-diff + statis lolos; **test belum dieksekusi lokal (PHP_UNAVAILABLE_LOCAL)**.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-53 | refactor: fungsi kanonik EmailAddress + 7 titik + test |
| — | _(docs ini)_ | PM+sapto | DFORM-53 | docs: changelog + README |

## Per-commit

#### fix(DFORM-53): kanonik + test

- `app/Support/EmailAddress.php` — BARU: final class murni, `normalizeEmail` + docblock. Lokasi ikut konvensi flat `App\Support`. Param `?string` (deviasi 1 baris dari saran tiket): rantai nullable `??` masuk langsung tanpa cast `(string)` yang menyamarkan null.
- `BroadcastDatasetResolver.php` — 4 titik (eventParticipants, recruitmentApplicants, users, customDataset map+filter `!== null`).
- `BroadcastSnapshotService.php` — extraRows map + filter `!== null`.
- `CsvRecipientParser.php` — heuristik pasangan + validasi utama via kanonik; gema `invalid` tetap lowercase-trim inline (kanonik return null by-design; perilaku user-facing identik).
- `tests/Unit/Support/EmailAddressTest.php` — BARU 4 test (valid, besar+spasi, invalid→null, kosong/spasi/null→null).

## Keputusan (divergensi tiket :97 vs :149)

- Fallback `student_email` adalah **perbedaan sumber data yang sah** (personal vs student), bukan duplikasi — dipertahankan di call-site dengan komentar eksplisit, hanya normalisasinya disatukan.
- Sisa `strtolower` inline yang DISENGAJA: `duplicateSummary` (hitung case-insensitive tanpa validasi — routing ke kanonik ubah perilaku), `headerIndexes` (keyword header, domain beda), gema `invalid` (di atas).
- Pola sama DI LUAR broadcast SENGAJA tak disentuh (di luar tiket): `BroadcastDatasetController:55-58`, `BroadcastRecipientController:61,81`, `UserManagementService:172`, `FormAnswerRecipientResolver:39`, `BundleGuestDuplicateChecker:14`, `FormSubmissionController:240,244,341,345` — kandidat tiket susulan.

## Verifikasi PM

- `grep FILTER_VALIDATE_EMAIL` di `app/Services/Broadcasting` → nol sisa; ekuivalensi tiap hunk diff dicek manual (skip/filter/map identik, echo invalid identik) — PASSED.
- `git status` → hanya 3 M + 2 A baru; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Trace statis 5 test CsvRecipientParser + 4 test baru terhadap kode — semua ekspektasi terpenuhi, tanpa ubah perilaku.
- Frontend gates SKIP (nol `.vue`/`.ts`). **PHP_UNAVAILABLE_LOCAL**: wajib `php artisan test --filter='EmailAddressTest|CsvRecipientParserTest'` di env ber-PHP sebelum PR `dev`→`main`.

## Utang di luar scope

- Daftar pola-sisa di luar broadcast (di atas) — kandidat tiket susulan.
- Push `main`+`dev` menunggu auth pemilik. Berikut urut: DFORM-54.
