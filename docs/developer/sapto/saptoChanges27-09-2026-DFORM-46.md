# Sapto Changes — 27 September 2026 (DFORM-46)

Tiket Jira: **DFORM-46** — kepatuhan `resources/` terhadap **14 aturan user** + aturan typing/arsitektur (status: **selesai — menunggu review**, Jira: **In Review**).
Rencana (`docs/big-changes/plans/2026-09-27-DFORM-46-rule-compliance-plan.md`, 14 tugas/5 fase) dan ledger eksekusi (`.superpowers/sdd/2026-09-27-DFORM-46-rule-compliance-plan/ledger.md`) bersifat **lokal & gitignored** — tidak ikut ter-commit. Dokumen ini karena itu **mandiri**: rujukan utamanya riwayat Git + kode, bukan plan.
Basis verifikasi dokumen ini: reflog/`git log` + kode pada HEAD akhir **`eba04ce`** (50 commit ber-subjek `DFORM-46`, rentang `7680d67..eba04ce`); seluruh lane sudah ter-commit. Nomor baris yang disebut adalah posisi saat dokumen disusun dan dapat bergeser oleh perubahan berikutnya.

Pola: **satu tiket, satu berkas changelog, tabel per-commit dengan kolom Issue**, eksekusi **subagent-driven TDD vertical slice**, commit **atomik** per langkah (`git add <path spesifik>`, tidak pernah `git add -A`), tanpa push. Tabel di bawah hanya memuat commit ber-`DFORM-46`; commit tiket lain (DFORM-47/48/49) yang berselang-seling di `main` sengaja tidak dihitung.

## Ringkasan (TL;DR)

- **50 commit atomik** ber-subjek `DFORM-46` sampai HEAD `eba04ce` (rentang `7680d67..eba04ce`; 45 saat commit changelog `0965e39`). Jumlah per-commit seluruh tiket: **719 berkas, +6117 / −3214**; agregat seluruh rentang **tidak valid** karena memuat commit sibling DFORM-49, jadi tidak dipakai.
- Aturan 1 (prefix `I`/`G`/`T`): seragam di seluruh `resources/js` (5 commit per-slice + residual).
- Aturan 2/14 (utility TS, tanpa redundansi): `IPaginator<GItem>`, `Partial<T>`/`Record<keyof T, …>`, satu `stripHtmlToText`, satu predikat file-upload, satu sumber teks field.
- Aturan 3 (tipe longgar): **`any` = 0** dan **`as unknown as` = 0** di produksi; `unknown` hanya di **batas eksternal** (respons HTTP/parser) dan selalu dipersempit lewat guard predikat. Termasuk seluruh berkas test (mock bertipe konkret).
- Aturan 4 (`!` & supresi): **0** `@ts-ignore`/`@ts-expect-error`/`eslint-disable`/`noqa` dan **0** non-null assertion di luar `components/ui/**`; 3 non-null assertion template pra-eksisting yang lolos audit T3 ditutup di `eba04ce` (+ test penjaga).
- Aturan 5/6/7 (optimal, dedup, ≤2 parameter): satu token/alur review, modul `lib/` bersama, objek argumen untuk fungsi >2 parameter.
- Aturan 10–12: jalur utama god function dipecah (`useQrFeed.submitScan` **166→32**, `dcda688`; sisa god function `.vue` terdokumentasi), nama ambigu sebagian di-rename (`obs`→`revealObserver`, `wb`→`workspace`, dst. — lihat §Status); konstanta bernama menggantikan magic value (`CHART_FONT_FAMILY`, `AUTOSAVE_DEBOUNCE_MS`, `CATEGORY_COLOR_FALLBACK`, dst.).
- Aturan 13: doc 1–2 baris pada **77 fungsi exported** (T1) + seluruh ekspor baru.
- Arsitektur: `lib/` **bebas DOM** dan **bebas `vue-sonner`**; efek UI (suara/getar, toast, Inertia request) pindah ke `hooks/`; arah impor `lib → components` = **0**; komponen kustom keluar dari `components/ui/**` (`71ccb0b`).
- Gerbang terintegrasi final (pohon tenang): `typecheck` 0 · `lint` 0 · **75 berkas / 503 test** · `prettier --check` bersih (kode). Trajektori: baseline **50 berkas / 330 test** → 71/473 → 74/501 (`dcda688`) → 74/501 (`71ccb0b`) → **75/503** (`eba04ce`); tidak ada test yang dihapus/di-`skip`.
- **Delta user-visible: 4** — dirinci di §Delta user-visible (perbaikan bug `EventCard`, warna latar badge kategori, deteksi tautan berkas, normalisasi `/storage/`; satu di antaranya perbaikan bug yang kamu minta).

## Pemetaan tugas → status

| Tugas    | Isi                                                             | Status                                                                                                                                                                             |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1       | Doc 1–2 baris tiap fungsi exported (aturan 13)                  | **selesai** (`4fd2909`, `ded16c8`)                                                                                                                                                 |
| T2       | Prefix `I`/`G`/`T` (aturan 1)                                   | **selesai** (6 commit)                                                                                                                                                             |
| T3       | Hapus `!` + supresi (aturan 4)                                  | **selesai** (4 commit + sisa template `eba04ce`)                                                                                                                                   |
| T4       | Hapus `any`/`unknown` longgar di produksi **+ test** (aturan 3) | **selesai** (12 commit)                                                                                                                                                            |
| T5       | Guard predikat ganti `as` (aturan 3)                            | **selesai** (5 commit, 37/42 situs cast dihapus)                                                                                                                                   |
| T6/T7/T8 | Dedup lintas berkas + tipe reusable (aturan 6/14)               | **selesai** (`fbed7ca`, `434d297`, `88d5528`)                                                                                                                                      |
| T9       | Magic value/teks duplikat → konstanta bernama (aturan 11)       | **selesai dengan sisa terdokumentasi** — `20d1959`; sisa: adopsi label/batas builder opsional pasca-review `ora-8`, `lib/dummyData.ts` `#6B7280` peran lain, `FieldEditor.vue:318` |
| T10      | God function dipisah per tanggung jawab (aturan 10)             | **selesai dengan sisa terdokumentasi** — `useQrFeed.submitScan` dipecah (`dcda688`); sisa: god function `.vue` `Profile.vue`/`Forms/Show.vue`                                      |
| T11      | `lib/` murni: pindahkan efek UI ke `hooks/`                     | **selesai** (`f153c42`, `800799e`, `3006428`, `b58f2e0`; T11e `SCAN_STATUS_THEME` di `71ccb0b`)                                                                                    |
| T12      | Struktur folder & rename berkas                                 | **selesai** (`9e49c2a`, `281d758`; T12b rename kebab→camel di `71ccb0b`)                                                                                                           |
| T13      | Komponen kustom keluar dari `components/ui/**`                  | **selesai dengan sisa terdokumentasi** (`71ccb0b`); sisa utang historis: `ui/**` 4× `ariaInvalidClass`, varian DFORM-39 di `button/index.ts`, wrapper `DatePicker.vue`             |
| T14      | Nama ambigu/AI-slop (aturan 8/12)                               | **selesai dengan sisa terdokumentasi** — landing/builder/dashboard/forms (`dcda688`); sisa: agregat `hooks/useFormFillPage.ts`                                                     |

## Keputusan user yang mengikat (mengubah cakupan/perilaku)

| #   | Keputusan                                                                                                                               | Dampak                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Bug `EventCard` **diperbaiki**                                                                                                          | satu-satunya delta perilaku di T5 (`1b49877`), +6 test                                              |
| 2   | 9 nilai divergen T9 **diperbaiki** ke yang paling konsisten dengan aturan                                                               | melahirkan §Delta #2, #3, #4 dan temuan yang sengaja _tidak_ diubah                                 |
| 3   | `components/seo/` → `core/`                                                                                                             | bagian T13 (`71ccb0b`)                                                                              |
| 4   | `lib/inertiaRequest.ts` → **`hooks/useInertiaRequest.ts`**                                                                              | `3006428`                                                                                           |
| 5   | Dead code `lib/eventValidationToast.ts` + `showEventValidationToast` **dihapus**                                                        | `8ca2674`                                                                                           |
| 6   | Hook mati `hooks/useFormSubmissionsPage.ts` **dihapus** (0 konsumen, 0 test)                                                            | `b3144e3`                                                                                           |
| 7   | `TITLE_MAX` **tetap 200**, hanya komentar `lib/displayLimits.ts` yang dikoreksi                                                         | **nol** perubahan batas ketik (lihat §Non-delta)                                                    |
| 8   | Karena #7, kapabilitas `accept` banner **tidak dinaikkan** — hanya representasinya disatukan                                            | mismatch `webp` dilaporkan, tidak diubah (T9 tail)                                                  |
| 9   | Routing dokumen (proses, bukan produk): seluruh permukaan dokumentasi DFORM-46 dikerjakan `@documenter`, bukan implementer/orchestrator | suntingan dokumen eks-implementer = bahan mentah; changelog + baris README kini milik `@documenter` |

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit    | Author | Issue    | Fase       | Deskripsi                                                                                                 |
| ----- | --------- | ------ | -------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| 19:48 | `4fd2909` | zappto | DFORM-46 | T1         | docs(js): doc singkat 58 fungsi di `lib`+`types` (17 berkas)                                              |
| 19:48 | `ded16c8` | zappto | DFORM-46 | T1         | docs(js): doc singkat 19 fungsi di `hooks`+`builder` (9 berkas)                                           |
| 20:04 | `a2f28a6` | zappto | DFORM-46 | T2         | refactor(types): prefix `I`/`T` slice `types` (55 berkas)                                                 |
| 20:07 | `3011a79` | zappto | DFORM-46 | T2         | refactor(lib): prefix `I`/`T` slice `lib` (24 berkas)                                                     |
| 20:09 | `07a2743` | zappto | DFORM-46 | T2         | refactor(hooks): prefix `I`/`T` slice `hooks` (44 berkas)                                                 |
| 20:14 | `2d2e6dd` | zappto | DFORM-46 | T2         | refactor(components): prefix `I`/`T` slice `components` (54 berkas)                                       |
| 20:16 | `6159e77` | zappto | DFORM-46 | T2         | refactor(pages): prefix `I`/`T` slice `pages` (38 berkas)                                                 |
| 20:24 | `cc022a8` | zappto | DFORM-46 | T2         | refactor(types): rapikan sisa prefix + rujukan di luar slice                                              |
| 20:24 | `80e70e9` | zappto | DFORM-46 | T3         | fix(types): hilangkan non-null assertion + supresi                                                        |
| 20:24 | `fe17112` | zappto | DFORM-46 | T3         | refactor(architecture): mutasi `answerForm` ke hook, hapus 2 supresi                                      |
| 20:28 | `9f8e373` | zappto | DFORM-46 | T3         | test: paku parity spread `setTeamMemberEmail` (temuan review T3b)                                         |
| 20:37 | `08ae451` | zappto | DFORM-46 | T3         | test: kontrak `_method` create/edit + `validateRequired` (temuan review T3a)                              |
| 20:37 | `557b53f` | zappto | DFORM-46 | T4         | refactor(types): tipe konkret qr-scan tanpa `unknown` longgar                                             |
| 20:40 | `5d0c350` | zappto | DFORM-46 | T4         | refactor(types): tipe konkret draft snapshot                                                              |
| 20:42 | `abd34df` | zappto | DFORM-46 | T4         | refactor(types): `TJsonLd` untuk alur SEO, hapus `Record<string, unknown>`                                |
| 20:44 | `ad00b0c` | zappto | DFORM-46 | T4         | test: paku toleransi parser payload QR scan (temuan review S3)                                            |
| 20:51 | `014dc66` | zappto | DFORM-46 | T4         | refactor(types): konsumen draft Track/OpRec, hapus `as unknown`                                           |
| 20:53 | `73c43a8` | zappto | DFORM-46 | T4         | refactor(types): hapus `unknown`/cast longgar di `useFormFillPage`                                        |
| 20:54 | `92382c2` | zappto | DFORM-46 | T4         | refactor(types): metadata konkret builder/form-fill + adaptasi konsumen                                   |
| 20:59 | `13f53e6` | zappto | DFORM-46 | T4         | refactor(types): residual recruitment/event-lib + dedup token list                                        |
| 21:03 | `7eaa86f` | zappto | DFORM-46 | T4         | refactor(types): residual events/builder/lib, guard ganti cast                                            |
| 21:07 | `56dbb10` | zappto | DFORM-46 | T4         | test: tipe konkret mock komponen                                                                          |
| 21:11 | `4fc10a7` | zappto | DFORM-46 | T4         | test: tipe konkret mock pages/lib                                                                         |
| 21:12 | `8c482e8` | zappto | DFORM-46 | T4         | test: tipe konkret mock dashboard/recruitment/hooks                                                       |
| 21:19 | `7009aeb` | zappto | DFORM-46 | T5         | refactor(types): cast hook batas-eksternal → guard predikat                                               |
| 21:21 | `480d3aa` | zappto | DFORM-46 | T5         | refactor(types): guard predikat ganti cast `types`/`lib` + pembaca metadata                               |
| 21:21 | `f3c4b81` | zappto | DFORM-46 | T5         | refactor(types): cast `pages` → guard/predikat + dedup cast SEO                                           |
| 21:24 | `3d7ebeb` | zappto | DFORM-46 | T5         | refactor(types): guard DOM/ref + batas eksternal dashboard/seo/layouts                                    |
| 21:31 | `1b49877` | zappto | DFORM-46 | T5         | **fix: eksklusi ref pemicu EventCard via `$el` + 6 test**                                                 |
| 21:59 | `fbed7ca` | zappto | DFORM-46 | T6/7/8     | refactor(dedup): satu token/alur review, satu `stripHtml`, satu predikat file-upload, `IPaginator<GItem>` |
| 21:59 | `7ec6fb5` | zappto | DFORM-46 | T9         | refactor(constants): modul `lib/debounce`,`displayLimits`,`uiLabels` + ekspor `CHART_FONT_FAMILY`         |
| 22:02 | `9e49c2a` | zappto | DFORM-46 | T12a       | feat(seo): `<Head>` di 4 halaman Auth memakai judul H1 yang sudah ada                                     |
| 22:03 | `281d758` | zappto | DFORM-46 | T12a       | refactor(structure): Navbar/Footer/Sidebar/Topbar → `components/layout/`                                  |
| 22:05 | `88d5528` | zappto | DFORM-46 | audit      | fix(lib): pulihkan paritas guard null/undefined `stripHtmlToText`                                         |
| 22:06 | `a42eca8` | zappto | DFORM-46 | T5         | refactor(types): guard predikat ganti cast builder (37/42 situs) + test paritas                           |
| 22:08 | `434d297` | zappto | DFORM-46 | T8         | refactor(dedup): pakai `hasMeaningfulHtmlText` bersama                                                    |
| 22:19 | `8ca2674` | zappto | DFORM-46 | dead code  | refactor(lib): hapus `eventValidationToast` + `showEventValidationToast`                                  |
| 22:21 | `299b9e0` | zappto | DFORM-46 | T9         | refactor(constants): adopsi debounce/`CHART_FONT_FAMILY` + `jsonRequestHeaders`                           |
| 22:27 | `f153c42` | zappto | DFORM-46 | T11        | refactor(lib): efek suara/getar qrScan → `hooks/useScanFeedback`                                          |
| 22:27 | `800799e` | zappto | DFORM-46 | T11        | refactor(lib): `normalizeBannerSrc` → `lib/bannerSrc`, `IApplicationDetail` → `types/recruitment`         |
| 22:30 | `3006428` | zappto | DFORM-46 | T11        | refactor(hooks): `lib/inertiaRequest.ts` → `hooks/useInertiaRequest.ts`                                   |
| 22:30 | `15c42b2` | zappto | DFORM-46 | guard test | test: penjaga binding jawaban `TeamInvitation` pasca penghapusan cast                                     |
| 22:30 | `b3144e3` | zappto | DFORM-46 | dead code  | chore: hapus hook mati `useFormSubmissionsPage` (−237)                                                    |
| 22:40 | `b58f2e0` | zappto | DFORM-46 | T11        | refactor(lib): teks murni vs emisi toast → `hooks/useErrorToast` + `useGlobalErrorToast`                  |
| 22:42 | `0cb402a` | zappto | DFORM-46 | T9 #3      | refactor(colors): `CATEGORY_COLOR_FALLBACK` untuk peran latar badge kategori                              |
| 22:43 | `0965e39` | zappto | DFORM-46 | docs       | docs(DFORM-46): changelog tiket + baris README (saat itu 45 commit)                                       |
| 22:49 | `20d1959` | zappto | DFORM-46 | T9-tail    | refactor(values): arbitrase nilai divergen T9 + satu sumber `/storage/` (2 bug normalisasi)               |
| 23:06 | `dcda688` | zappto | DFORM-46 | T10/T14    | refactor(naming): pecah god function `useQrFeed.submitScan` + rename nama samar T10/T14 (23 berkas)       |
| 23:12 | `71ccb0b` | zappto | DFORM-46 | struktur   | refactor(structure): rename kebab→camel, komponen kustom keluar `ui/`, `SCAN_STATUS_THEME` ke view        |
| 23:18 | `eba04ce` | zappto | DFORM-46 | T3-sisa    | fix(types): hapus 3 non-null assertion template + `shortDate` nullable (aturan 4)                         |

Sumber waktu/SHA: `git log --format='%h %ad %s'` + `git show --shortstat` per commit; lima baris terakhir diverifikasi dari reflog `+0700` (epoch).

### T10 + T14 awal — **TER-COMMIT** sebagai `dcda688`

Refactor murni penamaan + pemecahan god function. **Sudah ter-commit** (`dcda688`, 23 berkas `resources/js`, **tanpa** `docs/**`), jadi label "pohon kerja (belum di-commit)" yang dulu tertulis di sini **tidak berlaku lagi**. Ringkas (diverifikasi ke kode pada HEAD):

- **T10 (aturan 10):** `hooks/useQrFeed.ts` `submitScan` **166 → 32 baris** (32 baris terhitung di baris 424–455). Helper baru terverifikasi: module-level `mapEnvelopeKind`, `buildCheckInResult`, `showCheckInSuccessToast`, `buildDuplicateScan`, `buildInvalidScanResult`, `readScanErrorBody`; composable-level `handleDuplicateScan`, `handleInvalidScan`, `handleRateLimitedScan`, `handleNetworkScanFailure`, `handleScanFailure`. Urutan efek samping dipertahankan (terverifikasi): sukses = toast lalu `pushResult`; semua cabang error = `pushResult` lalu toast.
- **Guard test:** `hooks/__tests__/use-qr-feed.test.ts` `it()` **3 → 12** (12 `it()` terhitung; meng-mock `vue-sonner`); mengunci input kosong, busy-lock, sukses event, sukses oprec, 409 oprec/event (termasuk urutan push-sebelum-toast), 422, 429, gagal non-axios. Total test repo **492 → 501** (ledger `dcda688`).
- **T14 (aturan 8/12):** `obs`→`revealObserver` di **11 berkas** landing (terhitung: `components/modules/landing/{events/EventList,events/EventHighlight,features/FeaturesIntegrations,features/FeaturesHowItWorks,features/FeaturesGrid,features/FeaturesComparison,home/HomeCTA,home/HomeSteps,home/HomeShowcase,home/HomeFeatures,home/HomeFAQ}.vue`); builder (`FormBuilderWorkspace.vue` `wb`→`workspace`; `fieldMapping.ts` `bt`→`builderType`; `formBanner.ts`/`optionImage.ts` `fd`→`formData`; `FormSettingsPanel.vue` `m`→`registrationMode`/`formMetadata`); dashboard (`EventDashboardForm.vue` `val`→`value`, `FormFieldAnswerDisplay.vue` `res`→`response`, `FormFillParticipantEmailsSection.vue` `res`→`response`); forms (`pages/Dashboard/Events/Forms/Show.vue` `id`→`submissionId`); hook `useFormFillPage.ts` `val`→`value`. Loop counter `i`/`j`/`k` sengaja tidak diubah.
- **Gerbang pada `dcda688`:** `prettier --check` bersih · `typecheck` 0 · `lint` 0 · `npm test` **74 berkas / 501 test hijau**.

#### Sisa T10/T14 — **terdokumentasi** (di luar cakupan tiket)

- **Sisa T10:** god function di `<script setup>` `.vue` — `pages/Dashboard/Profile.vue` `saveAllChanges` (ada di baris 199; ~98 baris), `pages/Dashboard/Events/Forms/Show.vue` `syncFieldsFromProps`/`requestSaveAll`/`submitSubmissionReview` (baris 189/124/388). Butuh test penjaga tingkat mount dulu; ditunda agar berhenti di titik hijau.
- **Sisa T14:** agregat `hooks/useFormFillPage.ts` (rename lokal sebagian sudah, god composable belum pecah).

### Struktur (T12b/T13/T11e/T9 residual) — **TER-COMMIT** sebagai `71ccb0b`

Lane struktur (`fix-48`) **selesai dan sudah di-commit** sebagai `71ccb0b`: rename kebab→camel, komponen kustom keluar dari `components/ui/**` + `seo/`→`core/`, dan `SCAN_STATUS_THEME` keluar dari `lib/`. Terverifikasi di kode pada HEAD: `components/core/{SearchableSelect,AutosaveStatus,CometSpinner}.vue` ada & `components/ui/searchable-select/**` kosong, `SCAN_STATUS_THEME` kini di `components/modules/dashboard/qrScanStatusTheme.ts`, dan `pages/Dashboard/User/Index.vue`/`EventDetail.vue` memakai `CATEGORY_COLOR_FALLBACK`. Utang yang tetap terdokumentasi: `ui/**` 4× `ariaInvalidClass`, varian DFORM-39 di `button/index.ts`, wrapper `DatePicker.vue`, item builder opsional pasca-review `ora-8`, `types/designSystem.ts` orphan, `lib/dummyData.ts` `#6B7280` peran lain, dan `FieldEditor.vue:318` (lihat §Status).

## Per-fase (yang sudah mendarat)

### T1 — Doc 1–2 baris (aturan 13)

77 fungsi exported di `lib/`, `types/`, `hooks/`, `builder/` diberi doc singkat (apa + kapan dipakai). Doc ditulis **tanpa** mengubah perilaku; seluruh ekspor baru di commit berikutnya juga mengikuti aturan ini.

### T2 — Prefix `I`/`G`/`T` (aturan 1)

`interface` → `I…`, `type` alias → `T…`, generic → `G…`, per slice (`types`, `lib`, `hooks`, `components`, `pages`) + residu. Murni rename simbol; import di luar slice ikut diperbarui.

### T3 — `!` dan supresi (aturan 4)

Non-null assertion dihapus lewat guard/early return; 2 supresi dihapus dengan memindahkan mutasi `answerForm` ke hook (aturan 10/14 sekaligus). Dua celah test yang ditemukan reviewer ditutup dengan commit test terpisah. Sisa 3 non-null assertion template pra-eksisting yang lolos audit T3 ditutup di `eba04ce` (`shortDate` kini `string | undefined`) + test penjaga.

### T4 — `any`/`unknown` longgar (aturan 3)

Produksi **dan** test: `any` = 0, `as unknown as` = 0. `unknown` yang tersisa hanya di **batas eksternal** (payload respons HTTP, JSON, `localStorage`) dan selalu dipersempit segera oleh guard predikat — alasan satu baris per situs dicatat (lihat §`unknown` & `as` yang dipertahankan). Mock test memakai tipe konkret (`IMockFormState`, `TMockFormStateValue`), bukan `any`.

### T5 — Guard predikat ganti `as` (aturan 3)

37 dari 42 situs cast dihapus; 5 dipertahankan dengan alasan tertulis. Dua temuan reviewer ditutup dengan test (paritas + kasus batas). Bug `EventCard` (satu-satunya delta perilaku) diperbaiki di sini bersama 6 test penjaga.

### T6/T7/T8 — Dedup & tipe reusable (aturan 6/14)

Satu token/alur review, satu `stripHtmlToText` (+ `hasMeaningfulHtmlText`), satu predikat file-upload, `IPaginator<GItem>` untuk paginator lintas modul, `lib/htmlText.ts` + `lib/formFieldKind.ts` sebagai satu sumber kebenaran.

### T9 — Konstanta bernama (aturan 11), slice 1–5 + #3

- Slice 1: modul `lib/debounce.ts`, `lib/displayLimits.ts`, `lib/uiLabels.ts`; `CHART_FONT_FAMILY` diekspor dari `lib/chartTheme.ts`.
- Slice 2–3: 4 situs debounce → `AUTOSAVE_DEBOUNCE_MS`/`RESPONDENT_DRAFT_DEBOUNCE_MS`; 4 situs font chart → `CHART_FONT_FAMILY`; 11 situs header JSON → helper murni `lib/jsonRequest.ts` (`jsonRequestHeaders()`), +3 berkas test/6 test.
- #3 (peran warna): konstanta `CATEGORY_COLOR_FALLBACK` menggantikan campuran `#6B7280`/`var(--muted-foreground)` pada peran **latar** badge/dot/titik; peran **teks** sengaja dibiarkan berbeda (kontras yang disengaja). Detail + delta visual: §Delta #2.
- Slice 4/5 (adopsi konstanta sisa + arbitrase nilai divergen) **selesai & ter-commit** di `20d1959`; sisa yang dibebankan ke lane struktur (`71ccb0b`) dan utang terdokumentasi: adopsi label/batas builder opsional pasca-review `ora-8`, `lib/dummyData.ts` `#6B7280` peran lain, `FieldEditor.vue:318` (§Status).

### T11 — `lib/` murni (arsitektur + aturan 10)

- `playScanBeep` + vibrasi → `hooks/useScanFeedback.ts` (parameter WebAudio/getar **byte-identik**, satu pemanggil `useQrFeed`).
- Arah impor `lib → components` menjadi **0**: `normalizeBannerSrc` (terbukti murni) → `lib/bannerSrc.ts` (badan byte-identik); DTO `IApplicationDetail` + tipe dependennya → `types/recruitment.ts` (bentuk anggota/opsionalitas tak berubah).
- `lib/inertiaRequest.ts` → `hooks/useInertiaRequest.ts` (test dipindah utuh: 4 `it()`/6 `expect()`); `lib/` kini **bebas DOM**.
- `lib/errorMessage.ts` dipecah: **teks murni tetap di `lib`**, emisi toast → `hooks/useErrorToast.ts` + `hooks/useGlobalErrorToast.ts` (2 situs `app.js` yang berjalan di module scope dipindah ke composable di **root setup**). 76 situs diadopsi; **23 berkas test** disesuaikan mock-nya dengan jumlah `it`/`expect` **tak berubah satupun**. `vue-sonner` kini nol di `lib/`.

### T12a — Struktur

Empat komponen kerangka (Navbar/Footer/Sidebar/Topbar) pindah ke `components/layout/`; 4 halaman Auth memakai `<Head>` dengan judul H1 yang **sudah ada** (tanpa teks baru).

## Delta user-visible (disahkan)

**Tepat empat delta**, dinomori ulang berurutan dari ledger.

### #1 — Bug `EventCard` (diperbaiki atas permintaanmu) — `1b49877`

Menu aksi EventCard memakai eksklusi ref yang salah sehingga pemicu ikut terdeteksi "di luar" dan menu gagal menutup/memicu dengan benar. Perbaikan memakai `$el` + 5 jalur menu diuji (6 test baru). Ini **satu-satunya** perubahan perilaku di T5 dan sudah kamu setujui eksplisit.

### #2 — Warna latar badge kategori (peran divergen) — `0cb402a`

Latar badge/dot/label kategori yang tak terpetakan `categoryColorMap` dulu memakai dua warna untuk satu peran. Bukti terverifikasi: `EventCard.vue` pra-perubahan memuat **3 literal `#6B7280`**, dan commit `0cb402a` menghapus **5 baris ber-`#6B7280` lintas berkas**. Disatukan ke `CATEGORY_COLOR_FALLBACK = '#6B7280'` (nilai mayoritas). Delta visual: `#4F5966 → #6B7280`, dE76 Oklab `0.091` — hanya terpicu saat backend mengirim kategori di luar peta. Situs yang sudah `#6B7280` hanya berganti literal → konstanta (**nol** perubahan piksel). Peran **teks** (`EventDetail` chip muted vs kartu putih) sengaja dibiarkan berbeda karena kontrasnya memang disengaja.

### #3 — Deteksi tautan berkas `isStorageHref` — `20d1959`

Dua detektor "ini tautan berkas?" (halaman registrasi event + tampilan jawaban form builder) disatukan menjadi satu predikat murni `lib/bannerSrc.ts` `isStorageHref`. Efeknya, `pages/Dashboard/User/EventRegistration.vue:260` (lewat `isFileLink`) kini juga mengenali path relatif disk public **`storage/…`** dan **`form-uploads/…`** sebagai tautan berkas, yang sebelumnya diklasifikasi `false` (tidak dirender sebagai tautan). URL absolut tetap `true`; path root non-storage (mis. `/img/logo.png`) tetap `false`. Terpicu hanya bila data backend memuat bentuk path relatif tersebut. Dikunci test `lib/__tests__/bannerSrc.test.ts` (`describe('isStorageHref')`, 4 `it()`).

### #4 — Normalisasi `/storage/` (2 bug) — `20d1959`

`normalizeBannerSrc` disatukan di `lib/bannerSrc.ts` dan dua bug lama diperbaiki: (a) input yang sudah berawalan `storage/` dulu dipetakan menjadi `/storage/storage/<path>` (prefix dobel) — kini `storage/a.jpg → /storage/a.jpg`; (b) `blob:` dulu kehilangan skemanya di `EventBannerImage` (`/storage/blob:…`) — kini `blob:` dibiarkan apa adanya, seperti `data:`/URL absolut/path root. Seperti #3, terpicu hanya bila data backend memuat bentuk tersebut. Dikunci test `lib/__tests__/bannerSrc.test.ts` (8 `it()` normalize) + `components/modules/dashboard/__tests__/event-banner-image.test.ts` (5 `it()`).

## Non-delta (tanpa dampak user-visible)

### `TITLE_MAX` tetap 200 (keputusanmu) — nol perubahan

Bukti: backend membatasi judul `max:100` (5 FormRequest + migrasi `string(100)`), sedangkan konstanta FE `TITLE_MAX = 200` dan komentarnya menyatakan "selaras backend". Kamu memutuskan **tetap 200**; maka **tidak ada** perubahan batas ketik dan **tidak ada** perubahan operator indikator. Yang diperbaiki hanya **komentar** `lib/displayLimits.ts` agar tidak lagi mengklaim selaras backend. Temuan "indikator batas `>` tidak pernah tampil karena input sudah di-slice" dicatat sebagai item **ditunda** (bukan bug yang mengubah perilaku).

### Dead code & hook mati — tidak user-visible

`lib/eventValidationToast.ts` + `showEventValidationToast` (`8ca2674`) dan `hooks/useFormSubmissionsPage.ts` (`b3144e3`, 0 konsumen, 0 test) dihapus setelah daftarnya kamu setujui. Penghapusan hook mati sekaligus menghapus satu-satunya sisa istilah "Submission" (UI nyata konsisten memakai "Jawaban").

## `unknown` & `as` yang dipertahankan + alasan

Aturan repo: `unknown` **dilarang** sebagai tipe longgar; pemakaian di batas eksternal wajib **segera dipersempit** dan alasannya ditulis. Yang tersisa (terverifikasi per-slice, daftar lengkap ada di ledger):

| Lokasi                                                                   | Bentuk                        | Alasan                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/modules/builder/fieldMapping.ts:253,264,316,353`             | `as`                          | Kategori B: tipe deklarasi menyangkal bentuk runtime yang sudah dijaga guard; cast dipertahankan agar bentuk lama tidak berubah — **alasan tertulis di ledger** |
| `components/modules/builder/dirtyFields.ts:10`                           | `as`                          | Kategori D: batas eksternal (nilai dari DOM/serialisasi), dipersempit segera                                                                                    |
| `components/modules/auth/AuthForgotPasswordForm.vue:38`                  | `as Record<string, string[]>` | Kategori D: `error.response.data.errors` dari respons HTTP; diperlakukan sebagai batas eksternal                                                                |
| `components/modules/dashboard/FormFillParticipantEmailsSection.vue:177`  | `as`                          | Kategori D: body respons HTTP tanpa tipe dari server, dipersempit pemanggil                                                                                     |
| `components/modules/dashboard/recruitment/PeriodApplicantSection.vue:54` | `as const`                    | Kategori C: literal dipersempit untuk union tipe, bukan cast runtime                                                                                            |
| `pages/Dashboard/Recruitment/Periods/Show.vue:349`                       | `as const`                    | Kategori C: literal dipersempit untuk union tipe, bukan cast runtime                                                                                            |
| `pages/Dashboard/User/TeamInvitation.vue:152,168`                        | `as const`                    | Kategori C: literal dipersempit untuk union tipe, bukan cast runtime                                                                                            |
| `pages/OpenRecruitment/Apply.vue:296`                                    | `as const`                    | Kategori C: literal dipersempit untuk union tipe, bukan cast runtime                                                                                            |
| `hooks/useRespondentDraft.ts:153`                                        | `as T`                        | Kategori D: hasil `JSON.parse` dari `localStorage`; bentuk snapshot ditentukan pemanggil (dipersempit)                                                          |
| `lib/chartTheme.ts:22`                                                   | `as FontSpec['weight']`       | Kategori C: keterbatasan tipe chart.js (`FontSpec['weight']` hanya `number`/label, sementara CSS menerima `'600'`) — bukan batas eksternal                      |
| `hooks/useInertiaRequest.ts:53`                                          | `body: unknown`               | Kategori D: body respons HTTP (`res.json()`), disempitkan predikat objek                                                                                        |
| `hooks/useErrorToast.ts:50` (`showHttpErrorToast(body?)`)                | `unknown`                     | Kategori D: body respons HTTP, dipersempit `parseApiErrorMessage`; **alasan 2 baris** di doc fungsi                                                             |

Nomor baris di atas adalah posisi saat dokumen disusun (HEAD akhir `eba04ce`) dan dapat bergeser oleh perubahan berikutnya. Kebijakan T5: kategori **A** (`as unknown as`) dan **G** (`any`) wajib **0** → terbukti 0; kategori **B** (menyangkal tipe) diperbaiki; kategori **C** (`as const` — literal sempit, bukan cast runtime) wajar dipertahankan; kategori **D** (batas eksternal nyata) boleh bertahan + alasan satu baris.

## Verifikasi

Gerbang per-commit (dijalankan tiap langkah; `lint`+`typecheck` untuk setiap commit, `test` penuh pada commit yang menyentuh perilaku/test):

```
npx prettier --check <berkas berubah>     # selalu hijau
npm run typecheck   (vue-tsc --noEmit)   # 0 error
npm run lint        (eslint)             # 0 error
npm test            (vitest)             # 75 berkas / 503 test hijau (gerbang final, pohon tenang)
```

Verifikasi mandiri orchestrator atas gelombang T11 (bukan hanya laporan lane):

- `diff` badan `normalizeBannerSrc` lama vs baru → **kosong (byte-identik)**.
- `diff` daftar anggota `IApplicationDetail` lama vs baru → **kosong**.
- `grep "from '@/components" resources/js/lib` → **kosong**; `lib/` bebas DOM & `vue-sonner`.
- Literal emitor toast (durasi `14_000`/`6000`/`4000+`, `toast.error` ×8, `toast.success` ×1, peta status 401–503, seluruh teks Indonesia) → **hitungan identik** lama vs `useErrorToast.ts`.
- Diff tervonis tiap commit dicek **0** `as`/`any`/`!`/supresi baru dan **0** berkas di luar scope.
- Test yang dipindah tetap 4 `it()`/6 `expect()`; total test tidak pernah turun: baseline **50 berkas / 330 test** → 71/473 → 74/501 (`dcda688`) → 74/501 (`71ccb0b`) → **75 berkas / 503 test** (`eba04ce`).
- T3-sisa (`eba04ce`): 3 non-null assertion template pra-eksisting dihapus (`FormFillParticipantEmailsSection.vue` `shortDate` kini `string | undefined`), dikunci test penjaga `components/modules/dashboard/__tests__/form-fill-participant-emails-section.test.ts`.

Reviewer independen: T5 builder di-review `@oracle` dengan **differential fuzz 14 kelas input → 0 mismatch**; S6 di-review `@oracle` (**0 teks berubah, 0 test dilemahkan**, 1 delta diterima).

**Gerbang terintegrasi akhir (R16)** dijalankan di pohon sunyi: `typecheck` 0 · `lint` 0 · **75 berkas / 503 test** · `prettier --check` bersih (kode) — lihat §Status.

## Yang sengaja TIDAK diubah + utang yang dicatat

- **`oklch(0.18 0.018 255)`** (`chartTheme.tooltipBg` vs `RegistrationChart.pointHoverBorderColor`): peran berbeda → menyatukan justru meng-couple tooltip dengan ring titik.
- **Ellipsis Unicode vs ASCII**: `Menyimpan…`, `Mengirim…`, `Memproses…` (1 karakter) sengaja tidak disamakan dengan varian `...` (3 titik) — keduanya tampil sah dan menyatukannya = delta teks tanpa manfaat.
- **Mismatch `webp`**: backend periode mengizinkan `webp` sementara picker FE melarangnya. Sesuai keputusan #8 (konservatif), **tidak** diubah — dilaporkan sebagai temuan untuk keputusan terpisah.
- **Indikator batas judul `>`** yang tidak pernah tampil: dicatat, tidak diubah (keputusan #7).
- **`lib/dummyData.ts`**: masih memuat peringatan deprecasi + `categoryColorMap`/`statusColorMap`, termasuk `#6B7280` untuk peran lain (`closed`/`draft`, baris 397/400) yang sengaja tidak disatukan; menariknya ke modul produksi adalah refactor terpisah.
- **Temuan `@oracle` (ora-5) yang tidak diperbaiki**: `isPlainObject`/`isRecord` yang tidak sepenuhnya sound, dan `noUncheckedIndexedAccess` masih off — dicatat sebagai utang repo, bukan regresi tiket ini.
- **Item opsional pasca-review `ora-8` (tidak dikerjakan, dicatat + alasan)**: indireksi tipis `readChoiceField` (`optionImage.ts`), alokasi loop `fieldTypeConfig` + divergensi kunci prototipe (`constructor`/`__proto__`) yang bisa ditutup `Object.prototype.hasOwnProperty.call`, dan celah test karakterisasi (`rules.in`, `''`, level komponen).
- **Utang/sisa terdokumentasi (final)**: god function di `<script setup>` `.vue` (`pages/Dashboard/Profile.vue` `saveAllChanges`; `pages/Dashboard/Events/Forms/Show.vue` `syncFieldsFromProps`/`requestSaveAll`/`submitSubmissionReview` — butuh test penjaga mount) dan agregat `hooks/useFormFillPage.ts` (god composable belum pecah); `types/designSystem.ts` orphan; `lib/dummyData.ts` `#6B7280` peran lain; `FieldEditor.vue:318` (literal `1200 x 900` belum diadopsi); utang `ui/**` (4× `ariaInvalidClass`, varian DFORM-39 di `button/index.ts`, wrapper `DatePicker.vue`; `ui/spinner/Spinner.vue` = pola Shadcn, cukup catatan).

## Status pengerjaan & sisa

**Status: selesai — menunggu review (Jira: In Review).** Seluruh 14 tugas mendarat; sisa hanya item yang sengaja ditunda / di luar cakupan:

- **Selesai & ter-commit:** T1, T2, T3, T4, T5, T6/T7/T8, T9, T10, T11, T12, T13, T14 — termasuk T3-sisa (`eba04ce`) dan seluruh lane struktur (`71ccb0b`).
- **Sisa terdokumentasi (tidak dikerjakan di tiket ini):** god function `.vue` `Profile.vue`/`Forms/Show.vue` (T10 sisa), agregat `hooks/useFormFillPage.ts` (T14 sisa), item opsional pasca-review `ora-8`, utang `ui/**` (4× `ariaInvalidClass`, varian DFORM-39, wrapper `DatePicker.vue`), `types/designSystem.ts` orphan, `lib/dummyData.ts` `#6B7280` peran lain, `FieldEditor.vue:318`.
- **Gerbang terintegrasi final (pohon tenang):** `typecheck` 0 · `lint` 0 · **75 berkas / 503 test** · `prettier --check` bersih (kode).
- Dokumen ini selesai pada finalisasi (tabel 50 commit + gerbang akhir + status); penutupan **Done** oleh manusia.

## Catatan untuk tim

- Sumber kebenaran akhir tetap **diff Git + status Jira DFORM-46**; dokumen ini ringkasan.
- Selama tiket ini berjalan, `main` juga memuat commit **DFORM-47/48/49** (developer paralel). Beberapa berkas sempat "kotor" karena itu; setiap commit di atas **hanya** menyertakan berkas milik slice-nya, dan setiap sinyal gerbang merah yang berasal dari lane lain **diatribusikan**, bukan ditambal.
- `resources/js/actions/**` dan `resources/js/wayfinder/**` adalah berkas generated (gitignored) — tidak pernah diedit di tiket ini.
- `components/ui/**` (Shadcn-Vue asli) tidak diubah sepanjang tiket kecuali utang historis yang dicatat (4× `@/lib/ariaInvalidClass`, varian DFORM-39 di `button/index.ts`, wrapper `DatePicker.vue`); komponen kustom dipindahkan keluar `ui/**` → `core/**` di `71ccb0b`.
