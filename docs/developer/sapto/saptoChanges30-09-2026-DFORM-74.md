# Sapto Changes — 30 September 2026 (DFORM-74)

Ticket Jira: **DFORM-74** — `[docs] Spec user management dan deps bump absen` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar; spec memang absen) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: TL-42, tingkat Sedang.

## BEFORE (masalah + bukti)

- NOL spec user-management di `docs/big-changes/specs/` — sumber kebenaran role + invariant super-admin tersebar di service/policy/request/seeder/props tanpa dokumen rujukan; versi framework (klaim v12.69.3) tanpa jejak verifikasi.

## AFTER (fix + file)

1. `docs/big-changes/specs/2026-09-30-user-management-design.md` (53 baris, DRAFT): rantai role tunggal (konstanta→label→opsi/props→UI); 6 invariant super-admin; rujuk DFORM-56/59/60/66/68/69; §6 terbuka (filter-role, matriks admin).
2. `docs/big-changes/plans/2026-09-30-deps-upstream-sync-plan.md` (57 baris, DRAFT): verifikasi role + rencana bump/regresi/lock tanpa eksekusi; constraints docs-only.
3. **Batasan material**: `docs/big-changes/` di-gitignore (`.gitignore:60`) — stub di disk tapi TAK ter-commit; file ini + README satu-satunya artefak tracked.

## AKAR MASALAH (yang diselesaikan)

- Aturan role ("siapa boleh apa, siapa tak tersentuh") hidup sebagai 6+ invariansi tersebar tanpa peta. Stub menguncinya sebagai fakta bersitasi; matriks non-super-admin yang belum dipetakan dicatat OPEN, bukan diputuskan.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | — (ignored) | fixer+PM | DFORM-74 | 2 stub DRAFT di `docs/big-changes/` (tak ter-commit per `.gitignore:60`) |
| — | _(docs ini)_ | PM+sapto | DFORM-74 | docs: changelog + README (tracked) |

## Verifikasi PM (independen)

- `ASSIGNABLE_ROLES` 4 tanpa super-admin + `ROLE_LABELS` cocok; `composer.lock` v12.69.3 cocok klaim tiket (nol diskrepansi); guard policy `:38`/`:55`/`:68` cocok.
- <150 baris per file; link relatif valid; pola meniru DFORM-71/72/73; tanpa emoji; changelog dirujuk bukan diduplikat.
- `git status`: commit ini hanya changelog + README; NOL file kode; file sesi lain tak tersentuh. Backend/frontend gates SKIP (docs-only).

## Utang di luar scope

- Matriks aktor non-super-admin + filter-role super-admin OPEN (keputusan produk). Promosi stub = gate PM berikutnya. Push `main`+`dev` menunggu auth pemilik.
