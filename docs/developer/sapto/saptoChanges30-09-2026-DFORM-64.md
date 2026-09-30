# Sapto Changes — 30 September 2026 (DFORM-64)

Ticket Jira: **DFORM-64** — `[broadcast] Kolom mati source_id EmailDataset` (In Progress; Done oleh manusia). Branch: `dev` langsung, tanpa push. Scope STRICT hanya tiket ini: DROP kolom lahir-mati, NOL perubahan perilaku. Board-ID: BE-44.

## Ringkasan (TL;DR)

1. **DROP `source_id`**: kolom lahir mati (nullable, tanpa index/FK, nol pembaca) dihapus via migrasi baru `2026_10_02_000001_drop_source_id_from_email_datasets_table.php` (guard `Schema::hasColumn`; down() re-add `string(100)->nullable()`).
2. **`EmailDataset::$fillable`**: hapus `'source_id'`; casts/relasi NOL ubah (tak ada yang menyentuh kolom ini).
3. **Verifikasi**: grep repo-wide 3 → 0 di kode aplikasi (sisa: migrasi historis + PRD); `EmailBroadcastFlowTest` 5 passed + suite broadcast 34 passed + pint 2 file PASS via podman one-off (sqlite `:memory:`).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(kode ini)_ | PM+sapto | DFORM-64 | refactor: drop kolom mati source_id + fillable |
| — | _(docs ini)_ | PM+sapto | DFORM-64 | docs: changelog + README |

## Per-commit

#### refactor(DFORM-64): drop kolom mati source_id

- `database/migrations/2026_10_02_000001_drop_source_id_from_email_datasets_table.php` — BARU: `up()` guard `hasColumn` → `dropColumn('source_id')`; `down()` re-add `string('source_id', 100)->nullable()`. Tanpa cabang driver (1 baris alasan: kolom tanpa index/FK sehingga `dropColumn` polos cukup, preseden cabang driver `2026_09_07_100000` hanya untuk kolom ber-FK/index).
- `app/Models/EmailDataset.php` — hapus `'source_id'` dari `$fillable`; casts (`source_type`) dan relasi (`recipients`, `creator`) NOL ubah.

## Recon (bukti kolom lahir mati)

- `database/migrations/2026_10_01_000001_create_email_datasets_tables.php:14` — `$table->string('source_id',100)->nullable();` tanpa index/FK (satu-satunya index tabel: `source_type`).
- `app/Models/EmailDataset.php:22` — `'source_id'` hanya di `$fillable`; tanpa casts/relasi/accessor.
- Grep repo-wide `source_id` → **3 hasil**: definisi migrasi, fillable, PRD spec :1364. Nol factory/seeder/test/request/service/Vue. Tidak ada `EmailDatasetFactory`.
- Pembaca tabel (`BroadcastDatasetController` index/store/preview, `BroadcastDatasetResolver::customDataset`, `Datasets.vue`) — semua pakai `id`/`source_type`/`recipients`, tak pernah `source_id`.

## Keputusan

- DROP via migrasi baru, bukan edit migrasi lama (1 baris alasan: migrasi `2026_10_01` sudah rilis ke `dev`, riwayat migrasi tak boleh ditulis ulang).
- PRD spec :1364 dibiarkan apa adanya (1 baris alasan: dokumen historis, bukan kode; perubahan spec butuh persetujuan PM).
- Tanpa cabang driver sqlite/mysql di migrasi baru (1 baris alasan: kolom tanpa index/FK, `dropColumn` polos cukup di semua driver).

## Verifikasi PM

- `./vendor/bin/pint --test` 2 file (`EmailDataset.php`, migrasi baru) → **PASS (2 files, PSR-12)** — PASSED.
- `artisan test --filter=EmailBroadcastFlowTest` → **5 passed (26 assertions)** — PASSED.
- `artisan test --filter=Broadcast` (seluruh suite broadcast: 4 unit + 5 feature) → **34 passed (125 assertions)** — PASSED.
- Migrasi baru ikut jalan otomatis via `RefreshDatabase`; `dropColumn` lolos di sqlite tanpa `doctrine/dbal` (tak perlu instal paket).
- Grep repo-wide `source_id` pasca-perubahan → **0 di kode aplikasi** (sisa hanya: definisi historis di migrasi lama `2026_10_01` yang tak boleh ditulis ulang + referensi drop di migrasi baru + PRD historis :1364 + changelog ini) — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php` image `localhost/d-form-v2_app:latest` + bind repo + volume vendor yang sama (sqlite `:memory:` via `phpunit.xml`, tanpa sentuh MySQL dev); container `d_form_app` TIDAK diutak-atik.
- `git status --short` → file larangan tak tersentuh (`Makefile`, `database/seeders/UserSeeder.php`, `.env`, `AGENTS.md`).

## Utang di luar scope

- PRD `docs/module/PRD — Email Broadcasting DForm v1.0.md:1364` masih menyebut `source_id nullable` — kandidat koreksi spec susulan (butuh persetujuan PM).
- Push `dev` menunggu auth pemilik. Merge menunggu review PM.
