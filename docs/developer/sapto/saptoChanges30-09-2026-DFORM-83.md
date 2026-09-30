# Sapto Changes — 30 September 2026 (DFORM-83)

Ticket Jira: **DFORM-83** — `[security] Token plaintext di payload queue` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim lalu diklaim paten. Branch: `dev`, tanpa push. Board-ID: SEC-18. Vonis @oracle → opsi (a) enkripsi per-field.

## BEFORE (masalah + bukti)

- `trackingToken` (bearer login portal) plaintext di payload queue pada 2 situs dispatch (resend + submitter lama) — terbaca di redis/`failed_jobs`/inspector tanpa expiry. Pola lama sama-sama plaintext, bukan teladan.

## AFTER (fix + file)

1. Job: ctor tetap 2 argumen (anti-konflik DFORM-82); `handle()` via `resolveTrackingToken()` — decrypt, fallback warisan ≤64 char + warning depresiasi + TODO hapus, rusak → fail-closed tanpa mail/log-token.
2. Dua situs dispatch bungkus `Crypt::encryptString` (1 baris tiap situs); zona throttle/transaksi/logger tak tersentuh.
3. Test: baru 5 (no-plaintext, round-trip ×2, backward-compat, fail-closed) + 3 file lama disesuaikan (decrypt-sebelum-assert).
4. **Temuan PM (menyelamatkan CI)**: fixer verifikasi dengan flag `-e APP_KEY` dadakan — TANPANYA 9 test gagal total (`MissingAppKeyException`; `.env` kosong, phpunit.xml tanpa key). Perbaikan PM: dummy `APP_KEY` di phpunit.xml (konvensi Laravel, 1 baris, test-only). 28 test hijau mode CI.

## AKAR MASALAH (yang diselesaikan)

- Bearer secret lewat queue sebagai plaintext dengan retensi panjang. Kini terenkripsi-at-rest (pemegang APP_KEY dikecualikan sadar); store+referensi ditolak (hanya pindah plaintext + biaya migrasi).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-83 | refactor: enkripsi token job + test + APP_KEY test |
| — | _(docs ini)_ | PM+sapto | DFORM-83 | docs: changelog + README |

## Verifikasi PM (independen, via podman)

- Scope 28 passed/127 assertions (mode CI, tanpa flag); suite PENUH 616 passed/3905 assertions; pint 7 file bersih.
- Diff direview: ctor tak berubah, fallback ber-TODO, token tak pernah ke log. `git status`: hanya file tiket; file DFORM-82/sesi lain + `Makefile`/`UserSeeder` tak tersentuh. Frontend SKIP.

## Utang / sisa risiko

- Fallback plaintext + TODO wajib dihapus deploy berikut pasca-retensi (~1 hari). Rotasi APP_KEY menginvalidasi antrean (fail-closed by design). Produksi WAJIB APP_KEY terisi (dispatch kini gagal loud tanpanya — lebih baik dari plaintext diam-diam). Spoof ≤64 char jadi sampah terkirim (bukan secret; resend memulihkan).
- Push `main`+`dev` menunggu auth pemilik.
