# Sapto Changes — 30 September 2026 (DFORM-76)

Ticket Jira: **DFORM-76** — `[security] Stored XSS via unwrap sanitizer broadcast` (In Progress, assignee saptogusty). Branch: `dev` langsung, tanpa push. Board-ID: SEC-11.

## BEFORE (masalah + bukti)

- `BroadcastHtmlSanitizer::sanitizeNode()` (`app/Services/Broadcasting/BroadcastHtmlSanitizer.php:76-84`): tag non-allowlist di-unwrap (anak dipindah via `insertBefore` + `continue`) tetapi anak pindahan tak ada di snapshot `iterator_to_array(:70)` → `sanitizeNode`/`sanitizeAttributes` tak jalan → atribut `on*`/URL jahat lolos. Vektor: `font>img-onerror`, `svg-onload` bersarang, `math>font>a-javascript:`, `span-style-expression` pada node pindahan; kontrol `a-javascript:` langsung (jalur allowlist) sudah aman.
- Sanitizer hanya saat simpan (`BroadcastContentController:29`); render tanpa sanitasi ulang: `BroadcastPreviewController`, `SendBroadcastRecipientJob:67` (`renderHtml`), `BroadcastTestController:24`. Sink: `Show.vue` `v-html` (preview admin) + `broadcast-html.blade.php:8` (`{!! !!}`) → email ke penerima asli.
- Test eksisting `EmailBroadcastFlowTest:44-53` hanya menutup jalur allowlist langsung, tak menyentuh celah unwrap.

## AFTER (fix + file)

1. `BroadcastHtmlSanitizer.php` — hapus `continue` buta: anak hasil unwrap dikumpulkan lalu wajib lewat `sanitizeMovedNode()` baru (rekursif: unwrap bersarang diurai ulang, tag allowlist dibersihkan atribut+URL+style, komentar dibuang). `script`/`style` non-allowlist kini dibuang beserta isinya (bukan di-unwrap). Aturan `on*`/URL/`style` yang ada dipertahankan; NOL ubah allowlist; TANPA paket baru (htmlpurifier butuh konfirmasi user).
2. Defense-in-depth satu baris per titik render (sanitizer yang sama, tanpa ubah signature/alur): `SendBroadcastRecipientJob:67`, `BroadcastPreviewController` (`content` preview), `BroadcastTestController:24` — `app(BroadcastHtmlSanitizer::class)->sanitize($personalization->renderHtml(...))`.
3. Test baru `tests/Unit/Broadcasting/BroadcastHtmlSanitizerTest.php` (7 test): 6 payload recon + 1 anti over-strip (tag/atribut allowlist valid + teks dipertahankan). TDD: merah dulu (5 failed, 2 passed: kontrol + allowlist), hijau setelah fix (7 passed).
4. Batas: data lama di DB yang sudah beracun tetap perlu render-sanitize — kini tertutup oleh poin 2.

## AKAR MASALAH (yang diselesaikan)

- Iterator snapshot + `continue` buta membuat subtree pindahan lolos dari seluruh pipeline sanitasi; satu-satunya sanitasi di titik simpan membuat baris DB beracun tetap dieksekusi di semua titik render. Kini unwrap = sanitasi rekursif, dan setiap render = sanitasi ulang.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-76 | fix: tutup XSS unwrap sanitizer + sanitasi ulang render |
| — | _(docs ini)_ | PM+sapto | DFORM-76 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen)

- `artisan test --filter=BroadcastHtmlSanitizerTest` → RED sebelum fix (5 failed, 2 passed) → GREEN sesudah (**7 passed, 19 assertions**) — PASSED.
- `artisan test --filter=EmailBroadcastFlowTest` → **5 passed (26 assertions)** — PASSED.
- `artisan test tests/Feature/Broadcasting tests/Unit/Broadcasting` → **43 passed (149 assertions)** — PASSED.
- `pint --test` 5 file diubah → **PASS (5 files)** — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php|./vendor/bin/pint` image `localhost/d-form-v2_app:latest` + bind repo (sqlite `:memory:`, tanpa sentuh MySQL dev); container `d_form_app` TIDAK diutak-atik.
- `git status --short` → hanya 4 file kode + 1 test + changelog + README; bersih dari `Makefile`, `database/seeders/UserSeeder.php`, `.env`, `AGENTS.md`, `package-lock.json`. Payload hanya di-assert sebagai string, tak dijalankan di browser.

## Utang di luar scope

- `sanitizeStyle()` regex nilai masih meloloskan `expression(...)` pada prop allowlist di tag allowlist (terbukti: `<p style="color: expression(alert(1))">` lolos) — aturan style dipertahankan per scope; kandidat tiket lanjutan (perketat allowlist nilai CSS).
- `Show.vue` `v-html` + `broadcast-html.blade.php` `{!! !!}` tetap sink mentah bila konten non-sanitizer lewat — kini tertutup berlapis, tetapi CSP header email/preview belum ada (kandidat tiket).
- Push `dev` menunggu auth pemilik. Merge menunggu review PM + security review.
