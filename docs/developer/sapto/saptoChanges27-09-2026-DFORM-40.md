# Sapto Changes — 27 September 2026 (DFORM-40)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-33.md`](./saptoChanges27-09-2026-DFORM-33.md) (DFORM-33 Mx-A). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-40** — `Fix: 3 test merah (duplicate Vue di Vitest), lint warning, dan akar error tipe vue-tsc` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), board **DFORM**, Sprint 4 — ticket perbaikan kualitas, bukan bagian umbrella **DFORM-18** (Mx). **Bukan god commit**: 7 commit atomik (1 lint, 1 config, 4 lane tipe, 1 test) + 1 commit dokumen.

## Ringkasan (TL;DR)

Tiga masalah diselesaikan sebagai satu paket karena akarnya saling terkait:

1. **3 test merah** (`ConfirmationModal` portal tidak render) — akarnya **dua instance Vue**: `node_modules` memuat `vue@3.5.30` (hoisted) **dan** `vue@3.5.42` di dalam `.pnpm` dari instalasi isolated sebelumnya. Vitest meng-external `reka-ui`/`@vueuse/core`, sehingga Node me-resolve `vue` versi `.pnpm` → `useMounted()` di `reka-ui` melihat `getCurrentInstance() === null` → `Teleport` tidak pernah dibuka. **Diperbaiki di environment** (install bersih `npm ci`, tinggal satu `vue@3.5.30`), **bukan** dengan workaround kode.
2. **1 lint warning** — `canResendTracking` di `ApplicantDetailContent.vue` benar-benar dead code (gate sungguhan ada di `ApplicantDetailPanel.vue`) → dihapus (aturan 14).
3. **278 error tipe `vue-tsc`** (tidak pernah masuk CI — tidak ada script `typecheck`) → **0 error**, diperbaiki dari **akar tipe bersama** lebih dulu (`types/global.d.ts`, union field, `metadata`, `FontSpec`), lalu per-lane.

Hasil akhir: `npx vue-tsc --noEmit` → **0 error** (dari 278), `npm run lint` bersih, full suite **50 file / 327 test** passed. Runtime behavior tidak diubah, kecuali 2 guard/penyesuaian yang eksplisit dicatat.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 15:29 | `74022e9` | zappto | DFORM-40 | fix(test,DFORM-40): inline vue di vitest agar portal reka-ui render + hapus dead gate `canResendTracking` |
| 16:27 | `e18ff73` | zappto | DFORM-40 | chore(test,DFORM-40): buang workaround `dedupe`/`inline` vitest setelah install bersih |
| 16:27 | `5a9617b` | zappto | DFORM-40 | fix(types,DFORM-40): akar tipe bersama (`IUser`/`IProps` global, union field `banner`, `metadata`, `FontSpec`) |
| 16:27 | `bd621d9` | zappto | DFORM-40 | fix(types,DFORM-40): pembaca error agregat Inertia + handler input `string \| number` |
| 16:27 | `ee95d2b` | zappto | DFORM-40 | fix(types,DFORM-40): komponen recruitment/dashboard (`ApplicationRow` kanonik + guard props) |
| 16:27 | `b8c853d` | zappto | DFORM-40 | fix(types,DFORM-40): page one-offs + guard prop opsional |
| 16:27 | `849937e` | zappto | DFORM-40 | test(types,DFORM-40): tipe fixture & helper di 21 file test (hapus cast `as unknown`) |

Sumber waktu/SHA: `git log --pretty='%h|%ad'`.

### Catatan artefak git (kejujuran lintas-agen)

Ada **pekerja paralel** (DFORM-33 / DFORM-34, cluster Mx) yang menulis di working tree **yang sama** selama sesi ini. Konsekuensinya dicatat apa adanya:

- Commit `86e2cb5` berpesan `fix(lint,DFORM-40): hapus dead gate canResendTracking…` tetapi **isinya dokumen DFORM-33** (`docs/developer/sapto/README.md` + `saptoChanges27-09-2026-DFORM-33.md`). Ini artefak pemakaian git bersamaan (commit ter-amend), bukan pekerjaan DFORM-40. **Tidak di-rewrite** karena history sudah dipakai bersama.
- Perbaikan lint DFORM-40 tetap ada dan aman di `74022e9`; `HEAD:ApplicantDetailContent.vue` bersih dari `canResendTracking`.
- Commit `74022e9` juga memuat workaround `vitest.config.ts` yang kemudian dibuang di `e18ff73` (dua langkah: pasang → buang setelah akar environment terbukti).
- Lane T3 sempat memperbaiki `Periods/Edit.vue`; file itu lalu ikut ter-commit di `ca8c13d` (DFORM-34) karena pekerja paralel menyelesaikan refactor `BannerPickerField` di file yang sama. Perbaikannya **ada di history** (verifikasi langsung ke `ca8c13d:…/Periods/Edit.vue`), jadi tidak di-commit ulang.

## Skala perubahan

- **Sebelum** (setelah install bersih): `vue-tsc` **278 → 125** error; 3 test merah (`ConfirmationModal`); 1 lint warning; tidak ada script `typecheck` dan tidak ada job CI yang menjalankan `vue-tsc`.
- **Sesudah**: `vue-tsc` **0 error**; suite **50 file / 327 test** passed; lint bersih.
- Lane paralel (kepemilikan file disjoint, verifikasi `vue-tsc` ter-filter ke file masing-masing = **0 baris**):
  - **T1** akar tipe bersama — kontribusi 125 → 82 (6 file).
  - **T2** form Inertia + handler input — 7 file (+1 modul baru).
  - **T3** komponen recruitment/dashboard — 5 file.
  - **T4** page one-offs — 8 file.
  - **T5** test typing — 21 file.

## Per-commit

#### `74022e9` fix(test,DFORM-40): inline vue di vitest agar portal reka-ui render + hapus dead gate canResendTracking

- Apa: hapus computed `canResendTracking` + import yang jadi tak terpakai di `recruitment/ApplicantDetailContent.vue` (aturan 14 — dead code; gate nyata ada di `ApplicantDetailPanel.vue`). Menambahkan `vitest.config.ts` `dedupe`/`inline` sebagai upaya awal memperbaiki portal `reka-ui`.
- File (2): `ApplicantDetailContent.vue` (−5), `vitest.config.ts` (+12).
- Catatan: workaround config ini **kemudian dibuang** (`e18ff73`) setelah terbukti akar masalahnya env, bukan konfigurasi test.
- Jira: DFORM-40.

#### `e18ff73` chore(test,DFORM-40): buang workaround dedupe/inline vitest setelah install bersih

- Apa: hapus `dedupe: ['vue']` dan `test.server.deps.inline: ['reka-ui','@vueuse/core']` dari `vitest.config.ts` (−12). Setelah install bersih (satu `vue@3.5.30`), suite **tetap hijau tanpa workaround** → workaround redundant (aturan 14).
- Bukti: suite hijau dengan config tanpa workaround (49 file / 319 test saat itu).
- Jira: DFORM-40.

#### `5a9617b` fix(types,DFORM-40): akar tipe bersama (IUser/IProps global, union field banner, metadata, FontSpec)

- Apa: `types/global.d.ts` — `IUser` + `IProps` dipindah ke `declare global` (memperbaiki `TS2304 IProps` di `Events/Index.vue`); `IProps` dari `interface` → `type` agar memenuhi index signature `PageProps` Inertia (`TS2344`); tambah **7 flag izin opsional** (`can_view_recruitment_queue`, `can_view_my_recruitment_interviews`, `can_view_recruitment_activity`, `is_recruitment_interviewer_only`, `can_scan_recruitment_attendance`, `can_review_recruitment_corrections`, `can_decide_recruitment_final`) — selaras konvensi opsional-boolean `HandleInertiaRequests::share()` dan call-site `=== true`.
- `types/form-builder.ts`: `'banner'` masuk `BackendFieldType` (`TS2367` di `formBanner.ts:175`). `types/event.d.ts`: `IFormField.type` = `FormApiType | FormBuilderType | ''` (anggota union eksplisit, tanpa `any`). `types/form.ts`: `CreateDashboardFormPayload.metadata` = `FormRegistrationMetadata | null`; `toFormMetadataPayload` mengembalikan `FormRegistrationMetadata` (bukan `Record<string, unknown>`) — memenuhi `FormDataType` Inertia dan menghapus loose bag (aturan 14). `lib/chartTheme.ts`: `IChartTooltipTitleFont`/`IChartTooltipBodyFont` diturunkan dari chart.js `Partial<FontSpec>`; konstanta bobot `'600'` bertipe `FontSpec['weight']`. `CategoryChart.vue`: `weight: '500'` → `weight: 500` (output canvas identik — `toFontString` mengonkat `weight + ' '`).
- File (6): `types/global.d.ts` (+53/−39), `lib/chartTheme.ts`, `types/form.ts`, `types/event.d.ts`, `types/form-builder.ts`, `CategoryChart.vue`. Total +68/−57.
- Test: `npx vitest run resources/js/lib/__tests__ resources/js/components/modules/dashboard` → **10 file / 64 test** passed (termasuk `chartTheme.test.ts` 8/8 — mem-pin bobot tooltip `'600'` tidak berubah).
- Jira: DFORM-40.

#### `bd621d9` fix(types,DFORM-40): pembaca error agregat Inertia + handler input string | number

- Apa: `lib/formErrors.ts` (**baru**, 12 baris) — `readFormError(errors, key): string | null` membaca error server untuk key agregat di luar peta field form (mis. `credentials`) tanpa `any`/`unknown`/cast. Dipakai `Track/Login.vue` (`credentials`, `tracking`), `Track/Edit.vue` (`application`), `OpRecFeedbackForm.vue` (`feedback`) — satu sumber (aturan 14). `FieldEditor.vue`: `onMaxLengthInput(v)` dilebarkan ke `string | number` (akar: emit `Input.vue`). `QrScanSidebar.vue`: `onLogQueryInput(value)` dilebarkan + `String(value)` di batas emit (kontrak `update:logQuery` tetap string). `TeamInvitation.vue`: `initialFormState()` → `Record<string, FormFillAnswerValue>` (bukan `Record<string, unknown>`); `metadata()` duplikat diganti `metadataText(field, key)` bertipe di atas `readFieldMetadata`.
- File (7): `lib/formErrors.ts` (baru), `FieldEditor.vue`, `QrScanSidebar.vue`, `OpRecFeedbackForm.vue`, `TeamInvitation.vue`, `Track/Edit.vue`, `Track/Login.vue`. Total +46/−21.
- Test: `npx vitest run resources/js/components/ui resources/js/pages/OpenRecruitment/Track resources/js/components/modules/open-recruitment` → **5 file / 32 test** passed.
- Catatan kejujuran: `Input.vue`/`Textarea.vue` **tidak diubah** — keduanya sudah 0 error (error ada di handler konsumen, bukan di komponen).
- Jira: DFORM-40.

#### `ee95d2b` fix(types,DFORM-40): komponen recruitment/dashboard (ApplicationRow kanonik + guard props)

- Apa: `ApplicationRow` yang **berduplikasi dan sudah divergen** (`Periods/Show.vue` vs `PeriodApplicantSection.vue` — satu ketinggalan `secondary_division`) disatukan jadi **satu definisi kanonik** yang di-export dari `PeriodApplicantSection.vue` dan di-import `Periods/Show.vue` (aturan 14); karena type-only, drift fixture test ikut hilang. `PeriodApplicantSection.vue`: `rejectForm.errors.application` → helper `crossCuttingError()` + computed `rejectApplicationError` (key sama, tanpa `!`/cast). `MyInterviews/Show.vue`: `portfolioExternalUrl` pakai optional chaining. `MyInterviews/Index.vue`: `interface InterviewFilterParams` → `type` agar punya index signature implisit (memenuhi `RequestPayload` Inertia). `InterviewSessions/Show.vue` + `Periods/Edit.vue`: early-return saat data sesi/periode `null` (guard, perilaku identik — fungsinya hanya terjangkau di cabang `v-else`).
- File (5): `PeriodApplicantSection.vue` (+20/−3), `Periods/Show.vue` (+3/−17), `MyInterviews/Show.vue`, `MyInterviews/Index.vue`, `InterviewSessions/Show.vue`. Total +27/−25.
- Test: `npx vitest run resources/js/components/modules/dashboard` → **6 file / 31 test** passed; `forms-periods-skeleton.test.ts` (drift) → 5 test passed.
- Jira: DFORM-40.

#### `b8c853d` fix(types,DFORM-40): page one-offs + guard prop opsional

- Apa: `Track/Show.vue` — guard `props.tracking` eksplisit di `heroToneClass`/`interviewSchedule`/`showInterviewSection`/`handleHeroAction` (hanya jalan di cabang `v-else`). `Apply.vue` — `ctx` dibungkus `reactive(useFormFillPage({...}))` **menyamai pola nyata** `pages/Dashboard/Events/Forms/Fill.vue` (lihat Keputusan). `Events/Forms/Index.vue`: guard `props.event` di `confirmDelete`/`submissionsHref`. `EventRegistration.vue`: bentuk registrasi inline diekstrak ke interface `RegistrationSummary`; guard `props.registration`. `EventRegistrationPickForm.vue`: `event.slug` → `props.event.slug` (narrowing `v-if` berlaku). `DashboardTopbar.vue`: `BASE_PAGE_PATHS` = `new Set<string>()`. `FieldRenderer.vue`: `as const` pada `TYPE_CONFIG` agar `config.tone` menyempit ke union `FIELD_TONE_CLASSES`. `DatePicker.vue`: `selected` → `shallowRef` (`UnwrapRef` menghapus brand class → `Calendar` `modelValue` rusak) dan `class?: string` → `class?: ClassValue`.
- File (8): `FieldRenderer.vue`, `DashboardTopbar.vue`, `DatePicker.vue`, `Events/Forms/Index.vue`, `EventRegistration.vue`, `EventRegistrationPickForm.vue`, `Apply.vue`, `Track/Show.vue`. Total +67/−46.
- Test: `npx vitest run resources/js/pages/Dashboard/Events resources/js/pages/Dashboard/User resources/js/components/ui/date-picker` → **3 file / 15 test** passed.
- Catatan: `SplitDateTimeField.vue` **tidak perlu diubah** — errornya berasal dari prop `class` di `DatePicker.vue`. `Events/Forms/Create.vue` sudah 0 error (dibuat bersih oleh akar T1) → dilewati.
- Jira: DFORM-40.

#### `849937e` test(types,DFORM-40): tipe fixture & helper di 21 file test (hapus cast as unknown)

- Apa: seluruh cast `props: X as unknown as Record<string, never>` dan `findComponent(...) as unknown as VueWrapper` dihapus, diganti tipe fixture yang **diturunkan dari props komponen** via `InstanceType<typeof Comp>['$props']` (setara `ComponentProps` test-utils, yang tidak diekspor vue 3.5.30). Helper mount/find kini bertipe `VueWrapper<InstanceType<typeof Comp>>`; test "missing props" mengirim key wajib secara eksplisit (`undefined`, atau `[]` untuk `pendingInvitations` yang non-opsional). **Tidak ada assertion yang dihapus/dilemahkan.**
- File (21): `event-show-aside-rail`, `applicant-detail-corrections`, `period-applicant-section`, `use-qr-feed`, `autosaveHeader`, `form-delete`, `my-interviews-grade`, `skeleton-foundation`, `queue-skeleton`, `forms-periods-skeleton`, `interview-detail-skeleton`, `period-oprec-skeleton`, `team-invitation`, `event-manage-skeleton`, `events-recruitment-skeleton`, `laporan-user-eventdetail-skeleton`, `logs-registrants-submissions-skeleton`, `scan-dashboard-eventshow-skeleton`, `user-area-skeleton`, `track-feedback-skeleton`, `track-submit`. Total +385/−259.
- Test: `npx vitest run` atas 21 file tersebut → **21 file / 161 test** passed, 0 failed.
- Jira: DFORM-40.

## Keputusan yang dicatat

- **Akar environment, bukan workaround.** 3 test merah diperbaiki dengan **install bersih (`npm ci`)** — `node_modules` sebelumnya memuat dua salinan Vue dari instalasi isolated `.pnpm`. Workaround `vitest.config.ts` (dedupe/inline) diuji ulang lalu **dibuang** karena redundant. Tidak ada suppression (`@ts-ignore`/`eslint-disable`) yang ditambahkan.
- **Urutan lane mengikuti dependensi.** T1 (akar tipe bersama) **harus** mendarat lebih dulu karena error `IUser`/union field muncul di file lane lain; T2–T5 baru jalan paralel setelah T1 selesai — mencegah lane lain menambal gejala (cast lokal) yang akan bertabrakan dengan perbaikan akar.
- **`Apply.vue` pakai `reactive(useFormFillPage(...))`** — perubahan yang menyentuh runtime. Diverifikasi ke pola nyata `pages/Dashboard/Events/Forms/Fill.vue` (konsumen `useFormFillPage` lain juga membungkus `reactive`). Tanpa pembungkusan, ref di dalam objek `ctx` tidak ter-unwrap saat diteruskan ke child → memang mismatch nilai, bukan sekadar tipe.
- **`ApplicationRow` kanonik** diletakkan di `PeriodApplicantSection.vue` (bukan file types baru) agar kepemilikan lane tetap disjoint dan tidak menyentuh `types/**` milik T1.
- **`readFormError` sebagai satu sumber**, bukan cast per file. Error agregat Laravel (`credentials`/`tracking`/`application`/`feedback`) tidak ada di `FormDataErrors<T>` Inertia; solusi cast lokal akan berulang 4×.
- **`as` yang tersisa sengaja dipertahankan** dan terdokumentasi: (a) `'600' as FontSpec['weight']` di `chartTheme.ts` — chart.js mengetik `weight` sebagai `number | …` sementara nilai `'600'` dipin oleh test (output canvas tidak berubah); (b) pola `as DOMWrapper<HTMLButtonElement>` di test — **idiom yang sudah ada dan tersebar** di repo, konsisten dengan file test lain.
- **Deviasi aturan yang tidak dibetulkan (pre-existing, di luar scope):** `Record<string, unknown>` di `Queue/__tests__/queue-skeleton.test.ts` (`mountDisplay`/`demoDisplaySnapshot`) sudah ada di HEAD sebelum ticket ini; merapikannya memaksa penulisan ulang fixture mock API, jadi dilaporkan bukan dikerjakan.

## Verifikasi

> Catatan kejujuran: seluruh perintah verifikasi **dieksekusi oleh orchestrator dan lane fixer**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten commit dan evidence yang dilaporkan orchestrator.

- **Tipe:** `npx vue-tsc --noEmit` → **278 error → 0 error**. Setiap lane memverifikasi dengan filter path miliknya sendiri = **0 baris** (bukan sekadar angka global).
- **Test:** `npx vitest run` (working tree, termasuk test DFORM-34 milik pekerja paralel) → **50 file / 327 test passed**. Sebelum sesi: 47 file / 303 test dengan 3 merah (`ConfirmationModal`). Governor per lane: T1 10 file/64 test, T2 5/32, T3 6/31, T4 3/15, T5 21/161.
- **Lint:** `npm run lint` → bersih (sebelumnya 1 warning `canResendTracking`).
- **Bukti workaround tak perlu:** suite hijau **tanpa** `dedupe`/`inline` di `vitest.config.ts` (dijalankan sebelum `e18ff73`).
- **Kepatuhan aturan (scan diff, baris `+`):** tanpa `@ts-ignore`/`@ts-expect-error`/`eslint-disable`/`noqa`; tanpa `any`; tanpa non-null assertion (`!.`); tanpa `as unknown`. Sisa `as` terdaftar di Keputusan.
- **Scope commit:** setiap commit diverifikasi hanya memuat file milik lane-nya (`git show --stat`); `Makefile` dan `database/seeders/UserSeeder.php` (pekerjaan paralel) **tidak ikut**; tidak ada `git add -A`; tidak ada push.

## Catatan untuk tim

- **Rekomendasi (belum dieksekusi):** tambahkan `"typecheck": "vue-tsc --noEmit"` ke `package.json` **dan** jalankan di CI. Selama ini 278 error tipe hanya terakumulasi karena tak ada gate yang menjalankannya — inilah pencegah regresi termurah.
- **Environment:** `package-lock.json` (tracked, in-sync) kini sumber kebenaran install; `bun.lock` untracked; `pnpm-lock.yaml` tidak ada. Instalasi isolated ala pnpm yang menghasilkan direktori `.pnpm` adalah pemicu duplikasi Vue — hindari mencampur manajer paket.
- **Pekerjaan paralel:** DFORM-33 dan DFORM-34 berjalan di working tree yang sama selama sesi ini. Bila bekerja paralel lagi, sepakati pembagian file sebelum commit untuk menghindari artefak seperti `86e2cb5`.
- Guard baru (`Track/Show.vue`, `InterviewSessions/Show.vue`, `Periods/Edit.vue`, `Events/Forms/Index.vue`, `EventRegistration.vue`) bersifat defensif pada cabang yang tidak dirender saat data `null`; perilaku tampilan tidak berubah.
- DFORM-40 adalah ticket **perbaikan kualitas**, bukan cluster Mx; umbrella Mx tetap DFORM-18 dengan pecahan DFORM-30..DFORM-39.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-40.
