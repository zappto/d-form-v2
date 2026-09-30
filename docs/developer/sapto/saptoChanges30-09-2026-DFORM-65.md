# Sapto Changes — 30 September 2026 (DFORM-65)

Ticket Jira: **DFORM-65** — `[broadcast] Index dispatchDue belum komposit` (In Progress; Done oleh manusia). Branch: `dev` langsung, tanpa push. Putusan PM: eksekusi minimal ADITIF (index lama dipertahankan, tanpa hapus). Board-ID: BE-45.

## BEFORE (masalah + bukti)

- `email_broadcasts` hanya punya index tunggal `email_broadcasts_status_idx` (status) + `email_broadcasts_scheduled_at_idx` (scheduled_at) (`2026_10_01_000002_create_email_broadcasts_tables.php:34-35`); preseden komposit ada di tabel pasangan (`:52-53`).
- `dispatchDue()` (`BroadcastDispatchService.php:38-45`): `WHERE status='scheduled' AND scheduled_at <= now ORDER BY scheduled_at LIMIT 10` — filter dua kolom tanpa index komposit yang menutupinya.
- Scheduler `broadcast:dispatch-scheduled` jalan `everyMinute` (`bootstrap/app.php:22`), bukan hot-path; tak ada test langsung `dispatchDue`.

## AFTER (fix + file)

- Migrasi aditif `2026_10_02_000001_add_status_scheduled_at_index_to_email_broadcasts_table.php`: `up()` guard (`hasTable` + cek index lintas driver mysql/sqlite/pgsql ala preseden `2026_06_05`) → `$table->index(['status','scheduled_at'], 'email_broadcasts_status_scheduled_at_idx')`; `down()` drop index itu saja. Urutan kolom equality-dulu (`status`), range+`ORDER BY` kedua (`scheduled_at`). Index tunggal lama TIDAK dihapus.
- Test baru `BroadcastDispatchIndexTest` (2 test): index komposit ada via `Schema::getIndexes` (fallback `PRAGMA index_info` sqlite) + fungsional `dispatchDue` (1 scheduled-due, 1 future, 1 completed → hanya due; `Bus::assertDispatched` 1 job; future/completed utuh). TDD: merah dulu (index kosong), hijau setelah migrasi.

## AKAR MASALAH (yang diselesaikan)

- Query dua-kolom + `ORDER BY` hanya ditopang index tunggal — komposit `(status, scheduled_at)` menutup filter equality + range/sort dalam satu index. Gain marginal (scheduler per-menit, `LIMIT 10`), tetapi murah, aman, aditif — alasan tetap dieksekusi sekaligus menutup tiket.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(kode ini)_ | PM+sapto | DFORM-65 | refactor: index komposit dispatch + test |
| — | _(docs ini)_ | PM+sapto | DFORM-65 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen)

- `artisan test --filter=BroadcastDispatchIndexTest` → RED sebelum migrasi (1 failed: index kosong) → GREEN sesudah (2 passed, 5 assertions) — PASSED.
- `artisan test tests/Feature/Broadcasting` → **25 passed (105 assertions)** — PASSED.
- `artisan test tests/Unit/Broadcasting` → **11 passed (25 assertions)** — PASSED.
- `pint --test` 2 file → **PASS (2 files)** — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php|./vendor/bin/pint` image `localhost/d-form-v2_app:latest` + bind repo (sqlite `:memory:`, tanpa sentuh MySQL dev); container `d_form_app` TIDAK diutak-atik.
- `git status --short` → hanya 2 file kode + changelog + README; bersih dari `Makefile`, `database/seeders/UserSeeder.php`, `.env`, `AGENTS.md`, PRD.

## Utang di luar scope

- Index tunggal lama (`status`, `scheduled_at`) sengaja dipertahankan (aditif) — konsolidasi/drop butuh tiket tersendiri bila terbukti redundan.
- `dispatchDue` tanpa `orderBy id` sebagai tiebreaker `scheduled_at` kembar — di luar scope tiket ini.
- Push `dev` menunggu auth pemilik. Merge menunggu review PM.
