# Sapto Changes — 30 September 2026 (DFORM-60)

Ticket Jira: **DFORM-60** — `[users] $labels selaras manual dengan ASSIGNABLE_ROLES` (To Do → In Progress → In Review; Done oleh manusia). Tiket diklaim paten sebelum eksekusi. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: BE-40.

## BEFORE (masalah + bukti)

1. `roleOptions()` mendefinisikan `$labels` manual (4 entri) lalu `$labels[$role] ?? $role`. Dua sumber (`ASSIGNABLE_ROLES` vs `$labels`) bisa drift diam-diam: role baru di konstanta tanpa label jatuh ke raw key tanpa sinyal.
2. File ini hasil refactor DFORM-56 agen lain — dikerjakan di kondisi terkini, tanpa menyentuh area DFORM-59 (Requests/Concerns Users milik agen lain).

## AFTER (fix + file)

1. `ROLE_LABELS` private (4 string user-visible PERSIS) + `roleLabel(string)` public (known → map; unknown → `Log::warning` + humanize) + `humanizeRoleKey()` private. `roleOptions()` = `ASSIGNABLE_ROLES` × `roleLabel()`; fallback silent `?? $role` DIHAPUS.
2. `ASSIGNABLE_ROLES` tak dibalik turunannya (const-expression PHP tak izinkan `array_keys()`; membaliknya sentuh Requests = luar scope/DFORM-59). Drift dicegah test kunci paritas.
3. Test baru `UserManagementRoleLabelsTest` (2 test: paritas tiap role + `roleOptions()` persis; unknown `super-admin` → `Super Admin` + warning sekali + tak masuk options).

## AKAR MASALAH (yang diselesaikan)

- Duplikasi pemetaan role→label di badan fungsi vs konstanta kunci + fallback yang menutupi drift. Kini satu alur turunan + fallback bersuara (log), dikunci test.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-60 | refactor: labels turun dari ASSIGNABLE_ROLES + test |
| — | _(docs ini)_ | PM+sapto | DFORM-60 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen)

- `UserManagementRoleLabelsTest|UserManagementTest` → 20 passed, 169 assertions.
- `pint --test` 2 file → bersih.
- Diff PM: nilai label identik persis, `Log` import terurut, kontrak `ASSIGNABLE_ROLES` untuk Requests tak berubah.
- `git status` → hanya service + test; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Frontend gates SKIP (nol `.vue`/`.ts`).

## Utang di luar scope

- Push `main`+`dev` menunggu auth pemilik. Berikut urut alami: DFORM-61.
