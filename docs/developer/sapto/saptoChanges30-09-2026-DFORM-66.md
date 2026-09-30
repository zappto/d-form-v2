# Sapto Changes — 30 September 2026 (DFORM-66)

Ticket Jira: **DFORM-66** — `[recruitment] Guard ganda policy vs service` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar/artefak) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: BE-46. DFORM-65 dilewati (In Progress milik sesi lain).

## BEFORE (masalah + bukti)

1. Kondisi "boleh kirim ulang tracking" ditulis ulang di **3 tempat** dengan konsekuensi beda: policy `resendTrackingInformation:93-98` (`cancelled→false`, `blank email→false`), service `resend():23-33` (dua `if` → `ValidationException` per kondisi), presenter `canResendTracking()` (flag JSON `can_resend_tracking`, varian `filled()`). Defensible tapi drift hanya soal waktu.
2. Urutan cek (cancelled menang bila keduanya terjadi) dan copy pesan error hanya dijamin oleh kedisiplinan penyalin.

## AFTER (fix + file)

1. Enum baru `TrackingResendBlockReason` (`Cancelled`, `MissingPersonalEmail`) — kosakata tunggal alasan penolakan (+ doc 1 baris).
2. Guard kanonik murni `RecruitmentApplication::trackingResendBlocker(): ?TrackingResendBlockReason` (cancelled dulu, lalu email kosong — urutan semula; tanpa query).
3. Policy delegasi (`!== null → false`, kontrak otorisasi identik, tanpa ability baru); service `match` blocker → `ValidationException` copy pesan PERSIS; presenter delegasi (`filled() ≡ !blank()` untuk string, perilaku identik).
4. Test baru `RecruitmentTrackingResendGuardParityTest` (3 test: cancelled ditolak dua sisi + pesan semula; email kosong sama; valid lolos + job ter-push).

## AKAR MASALAH (yang diselesaikan)

- Satu aturan bisnis ("kapan resend boleh") tersebar sebagai 3 salinan kondisi di 3 lapis (otorisasi boolean / prasyarat exception / flag presenter). Kini 1 definisi di model; arah dependensi benar per Laravel (policy=boleh/tidak, service=prasyarat bisnis).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-66 | refactor: guard kanonik resend-tracking + enum + test paritas |
| — | _(docs ini)_ | PM+sapto | DFORM-66 | docs: changelog + README |

## Verifikasi PM (runtime independen via podman)

- `RecruitmentTrackingResendGuardParityTest` → 3 passed, 7 assertions (independen).
- Suite terkait resend/permission/security/applicant → 35 passed, 166 assertions (independen).
- `pint --test` 6 file → bersih.
- Diff: +24/−17 baris; pesan error + kontrak otorisasi identik; `git status` hanya 6 file tiket; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Frontend gates SKIP (nol `.vue`/`.ts`).

## Utang di luar scope

- Push `main`+`dev` menunggu auth pemilik. Guard `cancelled_at` lain (decideFinal/screen/verify/edit/final) punya kondisi tambahan stage/result — di luar scope, bukan duplikat.
