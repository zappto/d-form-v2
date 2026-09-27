# CONTEXT.md — D-Form v2

Ringkasan domain dan konvensi lintas-cutting untuk repo single-context ini
(satu app Laravel 12 + Inertia/Vue 3, bukan monorepo). Baca dokumen ini sebelum
mengubah lintas-domain. Perubahan arsitektur dicatat sebagai ADR di `docs/adr/`,
bukan sekadar komentar kode.

## 1. Domain

### 1.1 Dynamic form builder

Pengguna admin menyusun form event secara dinamis: kanvas field, pengaturan
form, banner, dan preview.

- **Model:** `app/Models/Event.php`, `app/Models/Form.php`,
  `app/Models/FormField.php`, `app/Models/FormAnswer.php`.
- **Route admin:** `routes/web/admin/event.php` (grup forms + field, mis.
  `events.forms.store`, `events.forms.fields`, `events.forms.autosave`).
- **Controller:** `app/Http/Controllers/Dashboard/Events/Forms/`
  (`FormAutosaveController.php`, `FieldOperationController.php`, ...).
- **UI:** `resources/js/components/modules/builder/`
  (`FormBuilderWorkspace.vue`, `FieldEditor.vue`, `fieldMapping.ts`,
  `formBuilderFieldFactory.ts`, `dirtyFields.ts`, `autosaveGuard.ts`, ...).
- **Hook:** `resources/js/hooks/useFormBuilderWorkspace.ts`,
  `resources/js/hooks/useBuilderAutosave.ts`.

### 1.2 Autosave & dirty-sync

Perubahan builder dikirim senyap (background) saat pengguna mengedit, dengan
payload parsial dan anti-race. Lihat
[ADR-0001](docs/adr/0001-endpoint-autosave-parsial.md) dan
[ADR-0002](docs/adr/0002-dirty-sync-diff-snapshot.md).

- **Backend:** `app/Http/Controllers/Dashboard/Events/Forms/FormAutosaveController.php`,
  `app/Http/Requests/AutosaveEventFormRequest.php`.
- **Diff/dirty murni:** `resources/js/components/modules/builder/dirtyFields.ts`,
  `resources/js/components/modules/builder/autosaveGuard.ts`,
  `resources/js/components/modules/builder/fieldMapping.ts`.
- **Hook & utilitas:** `resources/js/hooks/useBuilderAutosave.ts`,
  `resources/js/hooks/useAutosaveSync.ts`, `resources/js/lib/autosaveHeader.ts`.
- **Test:** `tests/Feature/Forms/FormAutosaveTest.php`,
  `tests/Feature/DirtyFieldSyncTest.php`,
  `resources/js/hooks/__tests__/useBuilderAutosave.test.ts`,
  `resources/js/components/modules/builder/__tests__/hydrate-guard.test.ts`.

### 1.3 Recruitment (Open Recruitment)

Modul rekrutmen DOSCOM: periode, divisi/interviewer, screening, interview,
queue display, koreksi, keputusan akhir, dan presensi.

- **Model:** `app/Models/Recruitment/` (mis. `RecruitmentPeriod.php`,
  `RecruitmentApplication.php`, `RecruitmentInterview.php`,
  `RecruitmentQueueEntry.php`, `RecruitmentDocument.php`).
- **Route admin:** `routes/web/admin/recruitment.php` (grup
  `dashboard.recruitment.*`); route publik/Open Recruitment terpisah dari
  `routes/web/admin/*`.
- **UI admin:** `resources/js/components/modules/dashboard/` dan
  page terkait; **UI pelamar:** `resources/js/pages/OpenRecruitment/`
  (`Apply.vue`, `QueueDisplay.vue`, `Track/*.vue`, ...) serta
  `resources/js/components/modules/open-recruitment/`.
- **Hook:** `resources/js/hooks/useRecruitmentQueue.ts`,
  `resources/js/hooks/useFormFillPage.ts`, `resources/js/hooks/useDraftRestore.ts`.
- **Dokumentasi modul:** `docs/module/oprec/`.

### 1.4 Upload & storage

File upload disimpan di disk (bukan base64 inline) dan dibersihkan lewat helper
terpusat saat diganti atau saat pemiliknya di-hard-delete. Lihat
[ADR-0003](docs/adr/0003-upload-to-storage-storagejanitor.md).

- **Helper:** `app/Support/StorageJanitor.php`.
- **Observer:** `app/Observers/` (`EventObserver.php`, `FormObserver.php`,
  `FormFieldObserver.php`, `FormAnswerObserver.php`, ...), diregistrasi via
  atribut `#[ObservedBy]` di model masing-masing.
- **Disk `public`:** `events/banners`, `recruitment/banners`, `avatars/{userId}`,
  `forms/banners`, `forms/options`, `form-uploads/{formId}`.
- **Disk `local`:** `recruitment/{periodId}/{appId}` (dokumen rekrutmen).
- **Test:** `tests/Unit/StorageJanitorTest.php`,
  `tests/Feature/Forms/ForceDeleteStorageCleanupTest.php`,
  `tests/Feature/Forms/FormOptionImageUploadTest.php`.

## 2. Konvensi lintas-cutting

### 2.1 Lokasi hook & alias

- Semua hook halaman/fitur hidup di **`resources/js/hooks/`**, bukan di
  `resources/js/utils/`. Barrel aditif `resources/js/hooks/index.ts`
  me-re-export seluruh hook.
- Path `@/` memetakan ke `resources/js/` (`tsconfig.json`), sehingga
  `@/hooks` dan `@/lib` adalah alias yang sah. `components.json` juga
  memetakan `lib` → `@/lib` dan `composables` → `@/hooks`.

### 2.2 Formatter & utilitas bersama

- **Format kanonis id-ID** (tanggal, count, rupiah, nomor antrean, byte,
  inisial) berada di **`resources/js/lib/format.ts`** — satu sumber kebenaran
  locale; jangan menulis literal locale di komponen.
- Utilitas domain lain juga tinggal di `resources/js/lib/` (mis.
  `error-message.ts`, `autosaveHeader.ts`, `chartTheme.ts`).

### 2.3 Skill & Tooling

- **Vertical-slice TDD (RED → GREEN per slice):** setiap perubahan perilaku
  dikerjakan sebagai slice vertikal dengan test lebih dulu. Vitest untuk
  front-end (`resources/js/**/__tests__/`), PHPUnit untuk Laravel
  (`tests/Unit`, `tests/Feature`).
- **TypeScript ketat:** strict aktif; tanpa `any`/`unknown` sebagai tipe
  longgar. Prefix `I` untuk interface, `G` untuk generic, `T` untuk type alias.
- **Penamaan file:** `camelCase.ts` / `PascalCase.vue` (`docs/rules/front-end.md`).

### 2.4 Aturan 10–13 (kode baru/pindahan)

Empat aturan mengikat yang sering dirujuk di changelog dan review kode:

10. **Satu fungsi = satu tanggung jawab** (satu alasan berubah); komposisi
    lewat pemanggilan, larang god function.
11. **Softcoded default**; hardcode hanya bila pantas dan beralasan tertulis
    satu baris (literal sekali pakai stabil vs magic number tersebar).
12. **Penamaan readable manusia, non-AI-slop**; larang `foo`/`bar`, singkatan
    samar, suffix generik `-Util`/`-Helper`/`-Manager`.
13. **Doc singkat 1–2 baris** per fungsi (terutama exported): apa + kapan dipakai.

Sumber lengkap 14 aturan (termasuk 1–9 dan 14) ada di spec migrasi hooks
`docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:66-83`
(aturan 10–13 di baris 77–80). Catatan: direktori `docs/big-changes/`
**gitignored** sehingga hanya tersedia lokal, bukan bagian dari checkout repo;
daftar ringkasnya juga tercatat di dokumen ter-commit
`docs/developer/sapto/saptoChanges27-09-2026-DFORM-16.md`.

## 3. Architecture Decision Records

- [ADR-0001 — Endpoint autosave parsial](docs/adr/0001-endpoint-autosave-parsial.md)
- [ADR-0002 — Dirty-sync diff berbasis snapshot](docs/adr/0002-dirty-sync-diff-snapshot.md)
- [ADR-0003 — Upload-to-storage & StorageJanitor](docs/adr/0003-upload-to-storage-storagejanitor.md)
- [ADR-0004 — Spaced ordering field](docs/adr/0004-spaced-ordering.md)
- [ADR-0005 — Chart theme sumber tunggal](docs/adr/0005-chart-theme-sumber-tunggal.md)

## 4. Catatan konsumen (agen)

- Baca dokumen ini sebelum mengubah lintas-domain.
- Perubahan arsitektur → tulis ADR baru di `docs/adr/NNNN-judul.md`
  (Status, Konteks, Keputusan, Konsekuensi), bukan hanya komentar kode.
- Klaim dokumentasi harus dapat dilacak ke source, konfigurasi, atau test.
