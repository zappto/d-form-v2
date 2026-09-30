# Sapto Changes — 30 September 2026 (DFORM-52)

Ticket Jira: **DFORM-52** — `[broadcast] Parser CSV ganda snapshot vs dataset` (To Do → In Progress → In Review; Done oleh manusia). Branch: `dev` langsung (alur baru: tanpa feat terpisah, `main` hanya untuk PR), tanpa push (auth GitHub tertahan, push manual oleh pemilik). Scope STRICT hanya tiket ini. Board-ID: BE-32.

## Ringkasan (TL;DR)

1. Parser CSV ganda (~70 + ~42 baris di 2 controller) diekstrak ke **satu service murni** `CsvRecipientParser` (string-in/array-out, tanpa HTTP); kedua controller kini tipis.
2. Semantik disatukan via **UNION** (header + fallback tanpa header + daftar `invalid` + heuristik "name,email") + 1 perbaikan inkonsistensi baris-pertama.
3. **1 file test unit baru** (5 kasus). Verifikasi PM statis lolos; **test belum dieksekusi lokal (PHP_UNAVAILABLE_LOCAL)** — wajib run di env ber-PHP sebelum PR ke `main`.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-52 | refactor: ekstrak CsvRecipientParser + tipiskan 2 controller + test unit |
| — | _(docs ini)_ | PM+sapto | DFORM-52 | docs: changelog + README |

## Per-commit

#### fix(DFORM-52): parser tunggal + test

- `app/Services/Broadcasting/CsvRecipientParser.php` — BARU: `parse(string): array{valid,invalid}` + 3 private (≤2 param, docblock 1–2 baris). Nama tanpa prefix `Broadcast-`: namespace sudah memberi konteks (redundan bila diulang).
- `BroadcastSnapshotController.php` — hapus `parseCsv` + `pushCsvRow` (~70 baris); inject service, 1 baris glue `instanceof UploadedFile ? parse(getContent())`.
- `BroadcastDatasetController.php` — hapus `parseCsvEmails` (~42 baris); `store()` inject service, pakai `['valid']` saja (key `invalid` ekstra diabaikan — backward compatible). FQCN inline → `use UploadedFile` (rapi).
- `tests/Unit/Broadcasting/CsvRecipientParserTest.php` — BARU 5 test: header, tanpa header, pasangan "name,email", baris kosong + invalid, lowercase/trim.

## Keputusan semantik (UNION, diverifikasi PM via diff)

- Heuristik "name,email" tanpa header kini seragam termasuk **baris pertama**: versi snapshot lama kehilangan baris pertama itu (kolom 0 "Andi" dicatat invalid), versi dataset lama membuangnya diam-diam. Kini ter-parse benar — strict improvement, bukan regresi.
- Tradeoff diterima: `getContent()` (muat penuh) ganti `fopen` stream — wajar untuk CSV recipient (kecil); `UploadedFile::getContent()` ada di vendor Symfony dan diwarisi `Illuminate\Http\UploadedFile`.
- DFORM-53 (normalisasi email) TIDAK dikerjakan; lowercase/trim dipertahankan agar tidak bertentangan.
- Edge di luar scope (perilaku lama juga begitu): sel multiline-quoted, BOM tak di-strip.

## Verifikasi PM

- `grep parseCsv|parseCsvEmails|pushCsvRow` di `app/` → nol sisa; `CsvRecipientParser` dipakai hanya 2 controller + service + test.
- `git status` → hanya 2 M + 2 A baru; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Statis: namespace/use/class-match, signature, shape `valid/invalid`, guard `instanceof` (lebih aman dari `hasFile` untuk input array) — PASSED.
- Frontend gates SKIP (nol `.vue`/`.ts`).
- **PHP_UNAVAILABLE_LOCAL** (`php`/`docker` absen): `phpunit`/`pint` tak dijalankan — wajib `php artisan test --filter=CsvRecipientParserTest` di env ber-PHP sebelum PR `dev`→`main`. CI GitHub: tanpa job test, `pint` non-blocking.

## Utang di luar scope

- Push `main`+`dev` ke origin menunggu auth pemilik (2 perintah manual sudah diberikan).
- Berikut urut: DFORM-53 normalisasi email.
