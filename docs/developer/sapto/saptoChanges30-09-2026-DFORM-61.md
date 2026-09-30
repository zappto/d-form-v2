# Sapto Changes — 30 September 2026 (DFORM-61)

Ticket Jira: **DFORM-61** — `[recruitment] downloadDocument 3 cabang identik` (In Progress; Done oleh manusia). Branch: `dev` langsung, tanpa push. Scope STRICT hanya tiket ini. Board-ID: BE-41.

## Ringkasan (TL;DR)

1. **Test kunci dulu (TDD)**: 3 test baru (`RecruitmentDocumentDownloadTest`) — unduh portfolio + instagram_follow (200 + nama file asli) dan tipe tak dikenal → 404. Lolos sebelum refactor (karakterisasi) — refactor wajib tetap hijau tanpa ubah perilaku.
2. **Satu alur**: DTO readonly baru `RecruitmentDocumentProfile` (path, originalName, mime, previewContentType) + resolver `match($type)` (null untuk tipe tak dikenal → 404) + satu streamer private `streamRecruitmentDocumentProfile($profile, $preview)`. Controller `downloadDocument` jadi orkestrator tipis; route/policy/response shape NOL ubah.
3. **Normalisasi**: fallback nama unduh portfolio `'portfolio'` → `'portfolio.pdf'` (satu-satunya perubahan user-visible; sebelumnya preview `'portfolio.pdf'` vs unduh `'portfolio'` tanpa ekstensi).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `7835e4b` | PM+sapto | DFORM-61 | test: kunci unduhan portfolio instagram_follow dan tipe tak dikenal |
| — | `f49f86e` | PM+sapto | DFORM-61 | refactor: satu alur unduhan dokumen via profil dan match resolver |
| — | _(docs ini)_ | PM+sapto | DFORM-61 | docs: changelog + README |

## Per-commit

#### test(DFORM-61): kunci unduhan

- `tests/Feature/Recruitment/RecruitmentDocumentDownloadTest.php` (baru) — setup staff (`recruitment-staff` lolos policy tanpa assignment interview) + dokumen cv/portfolio/instagram; 3 test: portfolio 200 + `Content-Disposition` memuat `Portfolio.pdf`, instagram_follow 200 + memuat `bukti-follow.jpg`, tipe `ktp` → 404 via constraint route. Lolos di atas kode lama (3 passed) — karakterisasi perilaku yang dikunci.

#### refactor(DFORM-61): satu alur via profil

- `app/Http/Controllers/Dashboard/Recruitment/RecruitmentDocumentProfile.php` (baru) — `final readonly class` 4 prop (`?string $path`, `string $originalName/mime/previewContentType`); path nullable karena kolom portfolio/instagram nullable di DB.
- `RecruitmentApplicationController::downloadDocument` — tinggal authorize + null-document 404 + resolve + stream; guard bersama (`authorize`, null → 404, `preview` boolean, 404 fallback) NOL ubah.
- `resolveRecruitmentDocumentProfile()` (private, 2 param) — `match($type)`; `default => null` untuk tipe tak dikenal; cv passthrough langsung (kolom DB non-null), portfolio `?? 'portfolio.pdf'` + `?? 'application/octet-stream'`, instagram `?: 'image/jpeg'` dipertahankan.
- `streamRecruitmentDocumentProfile()` (private, 2 param) — satu `abort_if(blank(path), 404)` + satu cabang preview (`response(..., 'inline')`) vs unduh (`download(...)`) di disk `local`.

## Keputusan

- DTO tinggal di namespace controller, bukan `Services/Recruitment` (1 baris alasan: satu-satunya pemakai aksi `downloadDocument`; Services untuk logika lintas-controller, bukan wadah data satu aksi).
- `downloadDocument` tetap 3 param (1 baris alasan: signature didikte route-model binding Laravel, bukan pilihan desain).
- Konstruktor DTO 4 param (1 baris alasan: DTO adalah objek argumen itu sendiri; pemanggil kini hanya terima 1 profil + 1 flag sehingga aturan 7 terpenuhi di sisi logika).
- Fallback unduh portfolio diseragamkan ke `'portfolio.pdf'` (1 baris alasan: preview sudah `'portfolio.pdf'`; nama tanpa ekstensi membingungkan OS/browser saat menyimpan).
- cv tanpa fallback baru (1 baris alasan: kolom `cv_path/nama/mime` non-nullable di migrasi, passthrough byte-identik).
- `?:` instagram dipertahankan, bukan `??` (1 baris alasan: mencakup null dan string kosong persis seperti semula).
- Sisa literal fallback kini satu titik di resolver (1 baris alasan: dulunya tersebar di 3 cabang; tak ada lagi hardcode lintas-pakai yang wajib disoftcode).

## Verifikasi PM

- `artisan test --filter=RecruitmentDocumentDownloadTest` → **3 passed (5 assertions)** sebelum maupun sesudah refactor — PASSED.
- `artisan test --filter=RecruitmentPermissionTest` → **11 passed (49 assertions)** — PASSED.
- `artisan test --filter=RecruitmentEvaluationTest` → **17 passed (44 assertions)** — PASSED.
- `artisan test --filter=RecruitmentSecurityTest` → **8 passed (27 assertions)** — PASSED.
- `artisan test --filter=RecruitmentMyInterviewsDocumentPreviewTest` → **2 passed (54 assertions)** — PASSED.
- `./vendor/bin/pint --test` 3 file (controller + DTO + test) → **PASS** — PASSED.
- `grep 'Storage::disk|abort_if(blank|match ($type'` controller → 1 match + 1 blank-abort + 2 call Storage (dulu 3 `if type` + 3 blank-abort + 6 call) — PASSED dedup.
- `git status --short` → bersih dari file larangan (`Makefile`, `database/seeders/UserSeeder.php`, `.env`, `AGENTS.md`, `app/Services/User/*`, file broadcast) — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php` image `localhost/d-form-v2_app:latest` + volume vendor yang sama (sqlite `:memory:`, tanpa sentuh MySQL dev); container crash-loop `d_form_app` TIDAK diutak-atik.
- Catatan koordinasi: sebelum refactor, working tree berisi perubahan TAK-tercommit pihak lain pada file controller yang sama (varian array-shape + guard `exists`/`..` traversal). Perubahan itu menabrak spec tiket ini (array bukan DTO, `if` bukan `match`, guard perilaku baru, inkonsistensi portfolio dipertahankan) sehingga file ditulis ulang penuh per spec DFORM-61 tanpa `stash/checkout/reset` — orchestrator wajib rekonsiliasi dengan pemilik perubahan tersebut sebelum merge.

## Utang di luar scope

- `verify()`/`resendTracking()` belum punya doc 1–2 baris (aturan 13) — sengaja tak disentuh (scope tiket ini hanya `downloadDocument`).
- Fetch preview aktual (`?preview=1` → `inline` + CT) belum dikunci test HTTP; baru URL-nya yang dikunci `RecruitmentMyInterviewsDocumentPreviewTest` — kandidat test susulan.
- Perubahan tak-tercommit pihak lain yang tertimpa (lihat catatan koordinasi) perlu dipulihkan/dipindah ke tiketnya sendiri bila masih relevan.
- Crash-loop `d_form_app` (entrypoint migrasi) ranah infra, bukan tiket ini.
- Push `dev` menunggu auth pemilik. Merge menunggu review e2e + CI.
