# Sapto Changes — 30 September 2026 (DFORM-82)

Ticket Jira: **DFORM-82** — `[security] Resend-tracking tanpa throttle + token tertimpa` (In Progress, assignee saptogusty). Branch: `dev` langsung, tanpa push. Board-ID: SEC-17. Scope: **THROTTLE + TEST**.

## BEFORE (masalah + bukti)

- `routes/web/admin/recruitment.php:65-66`: `POST applications/{application}/resend-tracking` (`RecruitmentApplicationController::resendTracking :97`), grup hanya `['auth', 'recruitment.access']`, **NOL throttle** — resend token tak terbatas selama pegang permission.
- `app/Services/Recruitment/RecruitmentTrackingResendService.php:35-56`: tiap panggil langsung overwrite `tracking_token_hash` (invalidasi instan token lama), lalu dispatch job async `ShouldQueue` ke `personal_email` (target terkendali, bukan input bebas).
- Preseden limiter ada (`AppServiceProvider::boot`: `broadcast-test` 10/jam, `scan-*`, `oprec-*`; pola DFORM-80; 429 dirender + log di `bootstrap/app.php:44-53`) — resend-tracking belum ikut.
- Test resend eksisting 3 file (`GuardParity`, `ResendTest`, `EndToEndTest`) — **NOL coverage throttle**.

## AFTER (fix + file)

1. `app/Providers/AppServiceProvider.php` — named limiter baru `recruitment-resend`: `Limit::perMinute(3)->by($request->user()?->id ?: $request->ip())`, mengikuti pola `scan-*`/`broadcast-test`.
2. `routes/web/admin/recruitment.php` — `->middleware('throttle:recruitment-resend')` pada route resend-tracking. Service/policy/request/validasi lain NOL ubah.
3. Test baru `tests/Feature/Recruitment/RecruitmentTrackingResendThrottleTest.php` (3 test, TDD merah-dulu): resend ke-1..3 → redirect + 3 job pushed; ke-4 → 429; user lain masih bisa resend (bucket per-user).

## Matriks throttle

| Endpoint | Middleware | Batas | Bucket |
|---|---|---|---|
| `POST applications/{application}/resend-tracking` | `throttle:recruitment-resend` | 3/menit per user (fallback IP) | sendiri (named limiter) |

Nilai 3/mnt: resend adalah aksi manual langka, bukan alur massal.

## Keputusan PM (ikat, tercatat)

- **Hanya throttle; kolom `tracking_resend_at`/`count` + grace previous-hash DITUNDA** — alasan: butuh migrasi skema + `EndToEndTest:99` & `ResendTest:72` meng-assert invalidasi instan sebagai perilaku benar; ubah itu = keputusan produk + tiket sendiri.
- **Service/policy/request/validasi NOL ubah** — throttle di lapis route saja.

## AKAR MASALAH (yang diselesaikan)

- Route resend-tracking terisolasi dengan auth + gate permission tetapi tanpa lapis rate-limit, padahal tiap hit me-rotasi token dan men-dispatch job mail. Kini resend dibatasi 3/menit per user; 429 dirender + log oleh handler yang sudah ada (`bootstrap/app.php:44-53`).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `4fd04af` | PM+sapto | DFORM-82 | fix: throttle resend-tracking 3/menit per-user |
| — | _(docs ini)_ | PM+sapto | DFORM-82 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen)

- `artisan test --filter=RecruitmentTrackingResendThrottleTest` SEBELUM fix → RED (**2 failed**: resend ke-4 → 302, bukan 429; 1 passed) → SESUDAH fix → GREEN (**3 passed, 15 assertions**).
- `artisan test --filter='RecruitmentTrackingResendTest|RecruitmentTrackingResendEndToEndTest|RecruitmentTrackingResendGuardParityTest'` → **10 passed (37 assertions)** — PASSED (perilaku resend utuh).
- `pint --test` 3 file diubah → **PASS (3 files)** — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php` image `localhost/d-form-v2_app:latest` + bind repo (sqlite `:memory:` per `phpunit.xml`, `APP_KEY` ephemeral via `-e`, tanpa sentuh MySQL dev/`d_form_app`); `.env` tidak tersentuh.
- `git status --short` awal: hanya `package-lock.json` kotor milik pihak lain — TIDAK disentuh; commit hanya path spesifik.

## Utang di luar scope

- Kolom `tracking_resend_at`/`count` + grace previous-hash menunggu keputusan produk — kandidat tiket lanjutan.
- Throttle berbagi bucket per user untuk semua application (bukan per-application); bila butuh kuota per-application, kunci limiter perlu `application` id.
- Push `dev` menunggu auth pemilik. Merge menunggu review PM + security review.
