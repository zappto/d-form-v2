# Sapto Changes — 30 September 2026 (DFORM-69)

Ticket Jira: **DFORM-69** — `[users] Salinan formatDate + roleLabels + canEdit/canDelete` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar/artefak) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: FE-29. DFORM-70 diantre setelah DFORM-67 mendarat (tabrakan file, keputusan user).

## BEFORE (masalah + bukti)

1. `Users/Show.vue:134-156`: `formatDate`/`formatDateTime` lokal menduplikasi locale+opsi `formatDisplayDate`/`formatDisplayDateTime` (`lib/format.ts:11-24`).
2. `Users/Show.vue:109-115`: `roleLabels` lokal 5 entri vs `ROLE_LABELS` backend (4 entri, tanpa super-admin) — drift menunggu waktu; payload detail tak mengekspos label display.
3. Dugaan salinan `canEdit`/`canDelete`: TIDAK TERBUKTI — Show.vue sudah `props.permissions` (Gate→UserPolicy) + `useUserDeletion({canDelete})`, dikunci test existing. Tanpa perubahan.

## AFTER (fix + file)

1. Show.vue: hapus 2 fungsi tanggal lokal + `roleLabels` lokal; impor lib; tambah prop `roleLabels: Record<string,string>`; 6 call-site template diberi guard null (`?: '—'`/`'Belum'`/`''`) — output identik (lib non-nullable, guard di call-site; lib TANPA tambahan).
2. `UserManagementService::detailRoleLabels()` (baru, + doc): super-admin via `humanizeRoleKey` (tanpa warning, display sah) + assignable via `roleLabel()`; `toDetailPayload()` +`'roleLabels'` (aditif, shape lain utuh); `roleOptions()` NOL sentuh (super-admin tetap tak assignable — menambahkannya membuka celah assignment).
3. Test: `user-show.test.ts` 6 test (tanggal lib vs fallback, label prop + fallback kunci mentah, visibilitas Edit/Hapus 3 kombinasi izin); `UserDetailRoleLabelsTest` (payload 5 label); `UserManagementRoleLabelsTest` +1 (peta eksak + `Log::warning never`).

## AKAR MASALAH (yang diselesaikan)

- Format tanggal + label display didefinisikan ulang di komponen alih-alih diimpor dari sumber kanonik (lib + service). Kini single-source; template `roleLabels[role] ?? role` tak berubah.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-69 | refactor: dedup tanggal+label ke lib/service + test |
| — | _(docs ini)_ | PM+sapto | DFORM-69 | docs: changelog + README |

## Verifikasi PM (independen, via podman — node_modules host rusak)

- Backend: label tests 4 passed/31 assertions; `UserManagementTest` 18 passed/160; pint 3 file bersih.
- FE (container): vitest user-show 6 passed; `vue-tsc --noEmit` exit 0; prettier file tersentuh bersih.
- `git status`: hanya file tiket (Show.vue, service, 2 test + 1 test dir); file DFORM-67 (Broadcasts/Show.vue, hooks/index.ts, 15 broadcast, package-lock.json) TAK tersentuh; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.

## Utang di luar scope

- `canEdit`/`canDelete` lokal di `Users/Index.vue:88-94` masih salinan — kandidat tiket tersendiri (file milik komit lain, dilarang sentuh). Cabang `NaN→return value` hilang (unreachable dari string ISO backend). Push `main`+`dev` menunggu auth pemilik.
