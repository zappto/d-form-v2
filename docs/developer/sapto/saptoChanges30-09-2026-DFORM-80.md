# Sapto Changes — 30 September 2026 (DFORM-80)

Ticket Jira: **DFORM-80** — `[security] Endpoint broadcast tanpa throttle + test ke arbitrer` (In Progress, assignee saptogusty). Branch: `dev` langsung, tanpa push. Board-ID: SEC-15.

## BEFORE (masalah + bukti)

- `routes/web/admin/broadcasting.php:20-51`: grup `['auth', 'broadcast.access']`, **NOL throttle** di seluruh file.
- Endpoint termahal: `POST /{broadcast}/test` (`BroadcastTestController`) sinkron `Mail::send` ke **email arbitrer** tanpa kuota — spam tak terbatas ke alamat mana pun selama pegang permission CREATE.
- Endpoint tulis lain tanpa batas: `POST|PATCH /schedule`, `POST /retry-failed`, `POST /` (store), `POST /snapshot|content|attachments`.
- Preseden limiter ada (`AppServiceProvider::boot`: `oprec-apply` 5/menit, `scan-*` by `user->id ?: ip`; 429 dirender + log di `bootstrap/app.php:44-53`) — broadcast belum ikut.
- Test eksisting `EmailBroadcastFlowTest:134-156` hanya `assertSent` 1 kirim — tanpa coverage throttle.

## AFTER (fix + file)

1. `app/Providers/AppServiceProvider.php` — named limiter baru `broadcast-test`: `Limit::perHour(10)->by($request->user()?->id ?: $request->ip())`, mengikuti pola `scan-*`.
2. `routes/web/admin/broadcasting.php` — middleware throttle per endpoint (matriks di bawah). Gate/authorize/validasi lain NOL ubah: gate test-mail **tetap CREATE** (tidak diturunkan ke VIEW).
3. Test baru `tests/Feature/Broadcasting/BroadcastThrottleTest.php` (4 test, TDD merah-dulu): 1 kirim normal → redirect + `assertSent` 1; test-mail ke-11 → 429; schedule hit ke-31 → 429; retry hit ke-31 → 429.

## Matriks throttle per endpoint

| Endpoint | Middleware | Batas | Bucket |
|---|---|---|---|
| `POST /{broadcast}/test` | `throttle:broadcast-test` | 10/jam per user (fallback IP) | sendiri (named limiter) |
| `POST /{broadcast}/schedule`, `PATCH /{broadcast}/schedule` | `throttle:30,1` | 30/menit per user | **bersama** schedule + retry (satu signature user, konsekuensi `throttle` numerik) |
| `POST /{broadcast}/retry-failed` | `throttle:30,1` | 30/menit per user | bersama (lihat atas) |
| `POST /` (store), `POST /snapshot`, `POST /content`, `POST /attachments` | `throttle:60,1` | 60/menit per user | bersama keempatnya |
| recipients/datasets/preview/cancel/destroy | — | tak dibatasi (di luar scope tiket) | — |

## Keputusan PM (ikat, tercatat)

- **Hanya throttle; restriksi target test-mail ke email-sendiri DITUNDA** — alasan: memutus alur legit kirim test ke kolega; butuh keputusan produk; throttle per-user 10/jam sudah menutup spam ke arbitrer.

## AKAR MASALAH (yang diselesaikan)

- Grup route broadcast terisolasi dengan auth + gate permission tetapi tanpa lapis rate-limit, padahal dua endpoint mengeksekusi kerja mahal sinkron (kirim mail, dispatch ulang). Kini setiap endpoint mahal punya kuota per-user; 429 dirender + log oleh handler yang sudah ada (`bootstrap/app.php:44-53`).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-80 | fix: throttle endpoint broadcast + test limit per-user |
| — | _(docs ini)_ | PM+sapto | DFORM-80 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen)

- `artisan test --filter=BroadcastThrottleTest` SEBELUM fix → RED (**3 failed**: kirim ke-11/ke-31 → 302, bukan 429; 1 passed) → SESUDAH fix → GREEN (**4 passed, 76 assertions**).
- `artisan test --filter=EmailBroadcastFlowTest` → **5 passed (26 assertions)** — PASSED (gate CREATE utuh).
- `artisan test tests/Feature/Broadcasting tests/Unit/Broadcasting` → **66 passed (274 assertions)** — PASSED.
- `pint --test` 3 file diubah → **PASS (3 files)** — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php` image `localhost/d-form-v2_app:latest` + bind repo (sqlite `:memory:` per `phpunit.xml`, `APP_KEY` ephemeral via `-e`, tanpa sentuh MySQL dev/`d_form_app`); entrypoint bawaan sempat menulis `APP_KEY` ke `.env` → dikembalikan kosong via `sed`, `.env` bersih.
- `git status --short` awal: `StoreBroadcastAttachmentRequest.php` + `BroadcastAttachmentService.php` + `package-lock.json` kotor milik pihak lain — TIDAK disentuh; commit hanya path spesifik.

## Utang di luar scope

- Restriksi target test-mail (hanya email-sendiri) menunggu keputusan produk — kandidat tiket lanjutan.
- Bucket `throttle:30,1` / `throttle:60,1` berbagi kuota antar-route berparam sama per user (perilaku bawaan Laravel, bukan bug); bila butuh kuota per-route, migrasi ke named limiter.
- Recipients/datasets/preview/cancel/destroy belum di-throttle — bila abuse terlihat, kandidat pengetatan susulan.
- Push `dev` menunggu auth pemilik. Merge menunggu review PM + security review.
