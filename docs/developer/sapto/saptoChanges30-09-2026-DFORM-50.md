# Sapto Changes — 30 September 2026 (DFORM-50)

Ticket Jira: **DFORM-50** — `Tech debt aturan 7 DFORM-46: konversi 21 fungsi >2 parameter ke objek argumen` (status awal To Do → In Progress → In Review; Done oleh manusia). Branch: `feat/DFORM-50-arg-objects` dari `main`, remote `origin` (fork), tanpa push. Scope STRICT hanya tiket ini.

## Ringkasan (TL;DR)

1. **17 dari 21 fungsi** dikonversi ke satu objek argumen (`I...Args`, maks 2 param); **4 helper murni dipertahankan** dengan alasan 1 baris (di bawah).
2. Duplikat `onCheckboxToggle` (`useFormFillPage:305` vs `TeamInvitation:145`) didedup via `createCheckboxToggleHandler` di `lib/formCheckboxAnswers.ts`.
3. `setCheckState` (`arguments.length`) diganti guard eksplisit `'found' in args` / `'helper' in args`, semantik identik.
4. Verifikasi PM: `typecheck` 0, `lint` 0, `prettier --check` 27 file tersentuh lolos, `vitest` penuh **507 passed**, `git status` bersih dari `Makefile`/`UserSeeder`/`ui/**`/`.php`.
5. Catatan CI: `prettier --check "resources/js/**/*.{vue,ts}" "resources/css/**/*.css"` repo-wide masih merah **10 file di luar scope** (broadcast/users/track, belum dinormalisasi); file DFORM-50 sendiri hijau. `pint` tak dijalankan lokal (php absen); tak relevan (nol `.php` tersentuh, gate pint `continue-on-error`).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `81fd407` | PM+sapto | DFORM-50 | refactor: satukan toggle checkbox via createCheckboxToggleHandler + test penjaga |
| — | `5f14b3a` | PM+sapto | DFORM-50 | refactor: hooks ke objek argumen (aturan 7) |
| — | `7483d56` | PM+sapto | DFORM-50 | refactor: builder ke objek argumen + call-site emit |
| — | `c4cfdd1` | PM+sapto | DFORM-50 | refactor: dashboard/pages call-site ke objek argumen |
| — | _(docs ini)_ | PM+sapto | DFORM-50 | docs: changelog + README |

## Per-commit

#### `81fd407` refactor lib checkbox (2 file, +65/−3)

- `lib/formCheckboxAnswers.ts` — `toggleCheckboxSelection` → `IToggleCheckboxSelectionArgs`; tambah `ICheckboxToggleArgs`, `ICheckboxAnswerAccess`, `createCheckboxToggleHandler` (sumber tunggal).
- `lib/__tests__/form-checkbox-answers.test.ts` — BARU, 3 test penjaga (tambah/lepas/non-array + handler bersama).

#### `5f14b3a` refactor hooks (10 file, +107/−55)

- `useGlobalQrScanPage` → `IGlobalQrScanPageArgs`; `scanIdentity` → `IScanIdentityArgs`; `onCanvasDragStart` → `ICanvasDragStartArgs`; `showHttpErrorToast` → `IShowHttpErrorToastArgs`; `useAutosaveSync` → `IUseAutosaveSyncArgs`; `onCheckboxToggle` (form fill) via handler bersama; call-site `useBuilderAutosave`, `useRespondentDraft`, `useHttpErrorToast`, `Scan/Global`, `Forms/Show` ikut objek.

#### `7483d56` refactor builder (7 file, +94/−49)

- `buildOptionImageFieldsFormData` → `IBuildOptionImageFieldsFormDataArgs`; `buildBannerFieldsFormData` → `IBuildBannerFieldsFormDataArgs`; `applyBannerUploadSuccess` → `IApplyBannerUploadSuccessArgs`; `allocateOrderRun` → `IAllocateOrderRunArgs`; `metaNumber` → `IMetaNumberArgs`; emit `canvasDragStart` jadi 1 objek; test `option-image`, `spaced-ordering` ikut objek.

#### `c4cfdd1` refactor dashboard/pages (8 file, +158/−75)

- `setCheckState` → `IEmailCheckStateArgs` + guard `in` (10 call-site); `slotStorageKey` → `ISlotStorageKeyArgs`; `imageUploadFillReadyForField` → `IImageUploadFillReadyArgs`; `to24h` → `ITo24hArgs`; `TeamInvitation` hapus duplikat; call-site `FormFillFieldSlotRows`, `ApplicantDetailContent`, `TimeAmPmInput` ikut objek.

## Keputusan & deviasi (borderline dipertahankan, 1 baris each)

- `lib/errorMessage.ts humanizeErrorMessage/getFieldError/injectFieldLabel` — DIPERTAHANKAN: helper murni lintas modul dengan puluhan call-site; konversi memaksa sentuh file di luar scope DFORM-50.
- `components/core/CometSpinner.vue clamp(value,min,max)` — DIPERTAHANKAN: signature kanonis Math 3-skalar, lokal satu file.
- `unknown` pada `selected`/`read`/`body`/payload response — DIPERTAHANKAN: nilai form Inertia / body HTTP dinamis di batas eksternal, langsung disempitkan guard (`isCheckboxAnswerList`/`parseApiErrorMessage`/`is...Body`) tanpa cast; alasan satu baris ini memenuhi AGENTS.md.
- `as`: tidak ada `as` baru ditambahkan.
- `!`/supresi/`any`: nol di file tersentuh (grep PM).

## Verifikasi PM (e2e Testing + CI)

- `npm run typecheck` → 0 error (exit 0; sempat 1 error TS2554 `ApplicantDetailContent` dari lane fixer, sudah diperbaiki + rerun bersih).
- `npm run lint` → 0 (exit 0).
- `npx prettier --check` 27 file tersentuh → All matched files use Prettier code style (exit 0).
- `npx vitest run` penuh → 507 passed (16.8s, exit 0); subset 7 file → 32 passed.
- `git status` → hanya 26 M + 1 A test; bersih dari `Makefile`, `database/seeders/UserSeeder.php`, `components/ui/**`, `*.php`.
- Repo-wide `prettier --check resources/js + css` → 10 file di luar scope masih warn (Broadcasts/Show, Events/Edit, Recruitment/Periods/Show, Users/Create+Edit, Track/Edit, types/formBuilder) — perlu tiket normalisasi terpisah, bukan DFORM-50.
- Prefix `I/T` bersih; tiap exported baru ber-doc 1–2 baris (spot check diff).

## Utang di luar scope (eksplisit, tidak dikerjakan)

- 10 file prettier-merah di luar scope (lihat di atas) — usulkan tiket normalisasi lanjutan.
- Smoke manual disarankan: drag canvas builder (`FormBuilderCanvasBuildView` emit objek) + debounce/abort `setCheckState` per-slot.
- `useAutosaveSync` menyentuh `useRespondentDraft` (call-site wajib, perilaku identik, test hijau).
