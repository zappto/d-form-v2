# Sapto Changes — 30 September 2026 (DFORM-68)

Ticket Jira: **DFORM-68** — `[users] Filter stateful di Users Index + delete di Show` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar/artefak) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: FE-28. DFORM-67 dilewati (In Progress milik sesi lain; awas `Show.vue` kembar domain — yang disentuh hanya `Users/Show.vue`).

## BEFORE (masalah + bukti)

1. `Users/Index.vue`: `search`/`role` ref + `hasActiveFilters` + `applyFilters` (`router.get` + `preserveState`/`replace`) + `watch` + `resetFilters` + `IUsersQuery` lokal — logika filter stateful di dalam `.vue`.
2. `Users/Show.vue`: `isDeleting`/`showDeleteModal` ref + `confirmDelete` (`router.delete` + toast error + reset finish) — logika delete di dalam `.vue`.

## AFTER (fix + file)

1. `useUserListFilter({initialQuery})` (baru): search/role refs, `hasActiveFilters`, `applyFilters(page)`, watch→`router.get`, `resetFilters`; ekspor `IUserListQuery` sebagai single source of truth query props (gantikan `IUsersQuery` lokal). Perilaku identik: immediate watch (TANPA debounce baru — sumber tak punya debounce), param/URL/opsi router sama persis.
2. `useUserDeletion({userId, canDelete})` (baru): `isDeleting`, `showDeleteModal`, `confirmDelete` (guard ganda + izin, URL destroy, toast `'Gagal menghapus akun.'`, finish reset). Copy/toast/redirect identik (sumber tak punya redirect/toast-sukses — tak diada-adakan).
3. Kedua `.vue` UI-only: template/copy/layout NOL ubah; `hooks/index.ts` +2 baris aditif; `ui/**` dan dependensi NOL sentuh.
4. Vitest baru 2 file, 10 test (filter: state awal, search/role→`router.get`, page>1, reset; deletion: URL+flag, finish reset, guard izin, guard ganda, error toast).

## AKAR MASALAH (yang diselesaikan)

- Logika stateful halaman (filter + delete) tinggal di `.vue` melanggar arsitektur front-end (`.vue` UI-only, `hooks/` rumah logika). Kini 2 hooks `useXxx` bernama domain; `.vue` hanya panggil hooks + petakan props + ikat event.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-68 | refactor: 2 hooks users + .vue UI-only + vitest |
| — | _(docs ini)_ | PM+sapto | DFORM-68 | docs: changelog + README |

## Verifikasi PM (independen)

- Vitest 2 file baru → 10 passed (independen); suite hooks 14 file/74 passed (fixer).
- `npm run typecheck` → 0 error (independen).
- `prettier --check` 7 file tersentuh → bersih (independen; gate pre-commit aman).
- Diff: +15/−50 baris; `IUsersQuery` nol sisa; sisa `showErrorToast` di Index.vue = delete per-baris (di luar scope tiket); backend SKIP (nol PHP); `git status` hanya 7 file tiket; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.

## Utang di luar scope

- Blok delete per-baris Index.vue + formatter murni Show.vue belum pindah (batas "TEPAT 2 hooks" tiket ini) — kandidat tiket susulan. Push `main`+`dev` menunggu auth pemilik.
