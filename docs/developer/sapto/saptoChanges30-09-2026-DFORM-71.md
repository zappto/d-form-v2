# Sapto Changes — 30 September 2026 (DFORM-71)

Ticket Jira: **DFORM-71** — `[docs] Spec/plan broadcasting absen hanya PRD` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar; stub memang absen) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: TL-39, tingkat Sedang.

## BEFORE (masalah + bukti)

- Satu-satunya dokumen broadcast ter-commit: PRD 1950 baris tanpa jangkar ke file nyata. `docs/big-changes/` (specs 4 file, plans belasan, security 1 audit) nol spec/plan broadcasting — tiap tiket broadcast harus riset ulang.

## AFTER (fix + file)

1. `docs/big-changes/specs/2026-09-30-broadcasting-design.md` (65 baris, DRAFT): arsitektur per lapisan grounded ke path nyata; entitas + kontrak kunci; 10 keputusan DFORM-51..65 (dirujuk, bukan diduplikat); §6 terbuka (SEC-11..15, PRB-1..3, FE-29/FE-30, prettier, `source_id`); promosi via plan.
2. `docs/big-changes/plans/2026-09-30-broadcasting-plan.md` (56 baris, DRAFT): 3 task checkbox (verifikasi fakta → GATE janitor/paladin MENUNGGU → finalisasi + serah terima PM); constraints docs-only.
3. **Batasan material**: `docs/big-changes/` di-gitignore (`.gitignore:60`) — kedua stub ada di disk tapi TAK ter-commit; file ini + README satu-satunya artefak tracked tiket ini. Promosi/finalisasi + nasib ignore = gate PM berikutnya.

## AKAR MASALAH (yang diselesaikan)

- Kekosongan peta PRD↔kode. Stub menyediakan jangkar awal yang jujur (fakta bersitasi vs asumsi bertanda); finalisasi diserahkan ke gate verifikasi, bukan klaim sepihak.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | — (ignored) | fixer+PM | DFORM-71 | 2 stub DRAFT di `docs/big-changes/` (tak ter-commit per `.gitignore:60`) |
| — | _(docs ini)_ | PM+sapto | DFORM-71 | docs: changelog + README (tracked) |

## Verifikasi PM (independen)

- 9/9 path yang dikutip stub ada; 2 migrasi broadcast cocok; scheduler `broadcast:dispatch-scheduled`/`everyMinute` cocok `bootstrap/app.php:22`.
- Link relatif + pola header meniru spec/plan existing; <150 baris per file; tanpa emoji; PRD/audit/utang/changelog dirujuk bukan diduplikat.
- `git status`: commit ini hanya changelog + README; NOL file kode; file DFORM-67 sesi lain tak tersentuh. Backend/frontend gates SKIP (docs-only).

## Utang di luar scope

- Gate Task 2 (vonis tertulis janitor/paladin) MENUNGGU — promosi dilarang sebelumnya. Finalisasi Task 1 (skim UI) tunggu tree DFORM-67 stabil. Push `main`+`dev` menunggu auth pemilik.
