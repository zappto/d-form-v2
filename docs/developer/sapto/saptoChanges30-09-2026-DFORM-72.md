# Sapto Changes — 30 September 2026 (DFORM-72)

Ticket Jira: **DFORM-72** — `[docs] Spec custom dataset dan impor CSV absen` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar; spec memang absen) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: TL-40, tingkat Sedang.

## BEFORE (masalah + bukti)

- NOL spec kontrak CSV/PII dataset di `docs/big-changes/specs/`; acuan satu-satunya kode (`BroadcastDatasetController::store` + `CsvRecipientParser`) dan PRD §13. Perluasan impor tanpa desain = risiko PII.

## AFTER (fix + file)

1. `docs/big-changes/specs/2026-09-30-dataset-design.md` (52 baris, DRAFT): kontrak CSV terverifikasi (parser, request rules, chunk 500, invalid handling); peta PII ada-vs-hilang + GAP eksplisit; rujuk DFORM-52/53/64; §6: perluasan impor DILARANG sebelum desain final + diskrepansi nomor baris tiket (file aktual 86 baris, bukan :14-126).
2. `docs/big-changes/plans/2026-09-30-dataset-plan.md` (57 baris, DRAFT): 3 task checkbox (verifikasi kontrak → keputusan PII → finalisasi + serah terima PM); constraints docs-only.
3. **Batasan material**: `docs/big-changes/` di-gitignore (`.gitignore:60`) — stub di disk tapi TAK ter-commit; file ini + README satu-satunya artefak tracked.

## AKAR MASALAH (yang diselesaikan)

- Kontrak impor (kolom, validasi, batas, nasib baris rusak) dan aliran PII hanya ada di kepala pembaca kode. Stub menguncinya sebagai fakta bersitasi + GAP jujur; keputusan PII diserahkan ke gate, bukan klaim sepihak.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | — (ignored) | fixer+PM | DFORM-72 | 2 stub DRAFT di `docs/big-changes/` (tak ter-commit per `.gitignore:60`) |
| — | _(docs ini)_ | PM+sapto | DFORM-72 | docs: changelog + README (tracked) |

## Verifikasi PM (independen)

- Controller 86 baris (diskrepansi tiket dikonfirmasi); `MIN_PAIR_COLUMNS=2`, `getContent()['valid']` :47, `array_chunk(,500)`; rules `mimes:csv,txt`/`max:2048`/`manual max:1000`; `Log::error` di job :88 — semua cocok sitasi stub.
- <150 baris per file; link relatif valid; pola meniru DFORM-71; tanpa emoji; PRD/audit dirujuk bukan diduplikat.
- `git status`: commit ini hanya changelog + README; NOL file kode; `package-lock.json` sesi lain tak tersentuh. Backend/frontend gates SKIP (docs-only).

## Utang di luar scope

- Inkonsistensi invalid CSV (snapshot toast vs custom diam-diam) + SEC-14/SEC-15 OPEN menunggu keputusan; batas baris/dedupe-insert belum ada di kode. Promosi stub = gate PM berikutnya. Push `main`+`dev` menunggu auth pemilik.
