# Sapto Changes — 30 September 2026 (DFORM-64)

Ticket Jira: **DFORM-64** — `[broadcast] Kolom mati source_id EmailDataset` (To Do → In Progress → In Review; Done oleh manusia). Tiket diklaim paten sebelum eksekusi. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: BE-44.

## BEFORE (masalah + bukti)

- `source_id` (`email_datasets`, `string(100)->nullable()`, tanpa index/FK) dicurigai kolom mati: grep repo-wide hanya definisi (migrasi `2026_10_01` + fillable `EmailDataset`) + 1 baris spec PRD. Rekomendasi awal tiket: isi/pakai atau drop via migrasi.
- Sesi paralel (tanpa klaim Jira) mengeksekusi opsi drop: migrasi `2026_10_02_000001_drop_...` + hapus fillable (`298f77f`/`9e90dad`, belum lama mendarat saat review berjalan).

## AFTER (keputusan + kondisi akhir)

- Keputusan stakeholder: **kolom DIPERTAHANKAN nullable apa adanya sesuai PRD** (`PRD — Email Broadcasting DForm v1.0.md:1364`, cadangan tautan sumber) — tidak disentuh.
- Kedua commit drop dibatalkan via revert history-preserving (`38a4e8f`); tree kembali baseline: fillable + definisi migrasi utuh, migrasi drop hilang. NOL ubah perilaku vs baseline.
- Commit docs ini satu-satunya artefak tiket (catatan keputusan, tanpa kode).

## AKAR MASALAH (yang diselesaikan)

- Kolom spekulatif/cadangan (nullable, tanpa index/FK, nol pembaca hari ini) disangka sampah skema — padahal statusnya "dicadangkan PRD", bukan "mati tak berguna". Aksi termurah yang benar = no-op + catatan keputusan, bukan migrasi drop yang justru melanggar spec.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | 298f77f + 9e90dad | sesi paralel | DFORM-64 | drop source_id + docs (DIBATALKAN) |
| — | 38a4e8f | PM+sapto | DFORM-64 | revert: batalkan drop, pertahankan nullable per PRD |
| — | _(docs ini)_ | PM+sapto | DFORM-64 | docs: catatan keputusan + README |

## Verifikasi PM (runtime via podman, independen)

- `EmailBroadcastFlowTest` pasca-revert → 5 passed (tree sehat kembali baseline).
- Grep `source_id` di kode → 2 hasil baseline (definisi migrasi + fillable); drop migration nol sisa.
- `git status` → hanya changelog + README; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Pint SKIP (nol file PHP berubah vs baseline). Frontend gates SKIP (nol `.vue`/`.ts`).

## Utang di luar scope

- Bila `source_id` kelak benar dipakai (tautan sumber dataset), tiket tersendiri yang mengisinya + test. Push `main`+`dev` menunggu auth pemilik.
