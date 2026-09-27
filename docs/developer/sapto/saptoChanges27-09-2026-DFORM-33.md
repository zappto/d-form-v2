# Sapto Changes — 27 September 2026 (DFORM-33 Mx-A)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-32.md`](./saptoChanges27-09-2026-DFORM-32.md) (DFORM-32 Mx-G). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-33** — `[Mx-A] Satu select: SearchableSelect, buang SimpleSelect/StyledSelect` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4); umbrella dipecah jadi 10 Task top-level **DFORM-30..DFORM-39**, dan DFORM-33 adalah cluster **A** — cluster terbesar Mx. **Bukan god commit**: 7 commit atomik sesuai gelombang rencana (`docs/big-changes/plans/2026-09-27-DFORM-33-mx-a-trio-select-plan.md`).

## Ringkasan (TL;DR)

Tiga komponen select disatukan menjadi **satu**: `SearchableSelect`. Fase 0 memperkuat pemenang (prop `required`/`invalid`, opsi `imageSrc` thumbnail, avatar jadi opt-in via `initials` eksplisit) plus **test select pertama** di repo. Lalu `SimpleSelect` (33 tag / 17 file) dimigrasi bergelombang (W1 OpenRecruitment → W2 `pages/Dashboard` → W3 `components/modules/dashboard` → W3b builder), `simple-select/*` **dihapus**; FormFill pindah dari `StyledSelect` → `SearchableSelect` dengan semantik nilai = label, lalu `styled-select/*` **dihapus**. Acceptance **grep-zero** tercapai: `SimpleSelect`/`simple-select`/`StyledSelect`/`styled-select` nihil di `resources/js`. Empat pemakai `SearchableSelect` lama tidak perlu berubah.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 15:59 | `964a54b` | zappto | DFORM-33 | feat(searchable-select): paritas `required`/`invalid` + `imageSrc` + avatar opsional (Mx-A F0) |
| 16:00 | `d204e03` | zappto | DFORM-33 | refactor(select): W1 OpenRecruitment pakai `SearchableSelect` (Mx-A) |
| 16:00 | `22b5844` | zappto | DFORM-33 | refactor(select): W2 `pages/Dashboard` pakai `SearchableSelect` (Mx-A) |
| 16:00 | `baea906` | zappto | DFORM-33 | refactor(select): W3 `components/dashboard` pakai `SearchableSelect` (Mx-A) |
| 16:02 | `813a6a1` | zappto | DFORM-33 | refactor(select): W3b builder pakai `SearchableSelect` (Mx-A) |
| 16:02 | `c84ae9d` | zappto | DFORM-33 | refactor(select): hapus komponen `simple-select` (Mx-A F2) |
| 16:04 | `2126ccd` | zappto | DFORM-33 | refactor(select): F2a FormFill pakai `SearchableSelect`, hapus `styled-select` (Mx-A) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — ketujuh SHA berurutan `964a54b` → `d204e03` → `22b5844` → `baea906` → `813a6a1` → `c84ae9d` → `2126ccd`, @ `1790499555..1790499859 +0700` (15:59–16:04 WIB).

## Skala perubahan

- **Sebelum**: `SimpleSelect` **33 tag / 17 file**; `SearchableSelect` **5 tag / 4 file** (semua sudah pakai `initials`); `StyledSelect` **1 file**. Tidak ada unit test untuk ketiganya.
- **Sesudah**: hanya `SearchableSelect` (18 file dimigrasi + 4 pemakai lama), `simple-select/*` dan `styled-select/*` dihapus. `pages/Dashboard/Recruitment/Periods/Show.vue` sudah memakai `SearchableSelect` → tidak disentuh.

## Per-commit

#### `964a54b` feat(searchable-select,DFORM-33): paritas required/invalid + imageSrc + avatar opsional (Mx-A F0)

- Apa: `SearchableSelectOption.imageSrc?: string` → render `<img>` (melestarikan thumbnail FormFill dari `StyledSelect`); prop baru `required?`/`invalid?` → atribut `required`/`aria-required`/`aria-invalid` pada trigger (paritas `SimpleSelect`); avatar hanya dirender bila `option.initials` **diberikan eksplisit** (fallback `initialsOf(label)` dijatuhkan) agar 33 select filter tidak ikut beravatar inisial; import `initialsOf` dihapus.
- File (2): `components/ui/searchable-select/SearchableSelect.vue` + `components/ui/searchable-select/__tests__/SearchableSelect.test.ts` (baru). Total +247/−4.
- Test: **14 test** (test select pertama di repo). TDD: RED **6 failed** → GREEN **14 passed**; regression run **62 passed**. Mencakup buka/pilih, filter label/sublabel, `emptyText`, `disabled`, `required`/`invalid`, avatar opt-in (trigger + baris), thumbnail `imageSrc`, dan "thumbnail menang atas initials".
- Jira: DFORM-33.

#### `d204e03` refactor(select,DFORM-33): W1 OpenRecruitment pakai SearchableSelect (Mx-A)

- Apa: migrasi `pages/OpenRecruitment/QueueDisplay.vue` (3 select filter) + `pages/OpenRecruitment/Track/Edit.vue` (3 select form, `:required`/`:invalid` dipertahankan) dari `SimpleSelect` → `SearchableSelect`; stub `SearchableSelect: true` di `Track/__tests__/track-submit.test.ts`.
- Test: vitest OpenRecruitment **2 file / 12 test** passed.
- Jira: DFORM-33.

#### `22b5844` refactor(select,DFORM-33): W2 pages/Dashboard pakai SearchableSelect (Mx-A)

- Apa: migrasi **7 konsumen** — `Scan/Global.vue`, `Users/Create.vue`, `Users/Index.vue`, `Users/Edit.vue`, `Recruitment/Index.vue`, `Recruitment/MyInterviews/Index.vue` (4 tag), `User/TeamInvitation.vue` — plus stub di **6 file test skeleton**; cast `as string` yang sudah ada dipertahankan.
- Test: vitest `pages/Dashboard` **19 file / 146 test** passed.
- Jira: DFORM-33.

#### `baea906` refactor(select,DFORM-33): W3 components/dashboard pakai SearchableSelect (Mx-A)

- Apa: migrasi **5 konsumen** — `RegistrantsToolbar.vue`, `QrScanScannerCard.vue`, `EventFilterBar.vue` (2 tag), `recruitment/ApplicantDetailContent.vue` (`:invalid` dipertahankan), `recruitment/PeriodApplicantSection.vue` (5 tag) — plus 1 stub test.
- Test: vitest `components/modules/dashboard` **6 file / 31 test** passed.
- Jira: DFORM-33.

#### `813a6a1` refactor(select,DFORM-33): W3b builder pakai SearchableSelect (Mx-A)

- Apa: migrasi `components/modules/builder/{FormPreviewDialog.vue, FormSettingsPanel.vue (3 tag), FormBuilderPalettePanel.vue (3 tag)}`; sentinel `__none__`, `:id` dinamis, dan `:model-value` terkontrol dipertahankan apa adanya.
- Test: vitest builder **4 file / 24 test** passed.
- Jira: DFORM-33.

#### `c84ae9d` refactor(select,DFORM-33): hapus komponen simple-select (Mx-A F2)

- Apa: hapus `components/ui/simple-select/{SimpleSelect.vue,index.ts}` (**145 baris**) — file kalah, dihapus paling akhir setelah W1–W3b nol pemakai.
- Bukti: tidak ada importer tersisa; full vitest suite **49 file / 319 test** passed.
- Jira: DFORM-33.

#### `2126ccd` refactor(select,DFORM-33): F2a FormFill pakai SearchableSelect, hapus styled-select (Mx-A)

- Apa: `components/modules/dashboard/FormFillFieldSlotRows.vue` pindah `StyledSelect` → `SearchableSelect`; `selectOptions` computed baru memetakan `FormFillOptionRow` → `{ value: row.label, label: row.label, imageSrc: row.type === 'image' ? row.imageSrc : undefined }` sehingga nilai jawaban tetap **label** (sama seperti `StyledSelect` lama) dan perilaku `setTextAnswer` tidak berubah. `SearchableSelect.vue`: thumbnail `imageSrc` kini `rounded-md border border-border` (thumbnail, menyamai gaya gambar FormFill), sedangkan avatar inisial tetap `rounded-full`. Hapus `components/ui/styled-select/{StyledSelect.vue,index.ts}`.
- File (5, stat commit): `FormFillFieldSlotRows.vue` + `SearchableSelect.vue` + `components/ui/styled-select/{StyledSelect.vue,index.ts}` (dihapus) + `components/ui/searchable-select/__tests__/SearchableSelect.test.ts` (assertion kelas thumbnail `rounded-md`/`border-border`). Total +21/−150.
- Jira: DFORM-33.

## Keputusan yang dicatat

- **Avatar opt-in** (keputusan user): avatar hanya saat `option.initials` eksplisit — mencegah avatar inisial muncul di ~33 select filter (churn visual). 4 pemakai `SearchableSelect` lama sudah mengirim `initials`, jadi tampilannya terjaga.
- **`imageSrc` ditambahkan** (keputusan user): melestarikan thumbnail opsi image FormFill yang jika tidak akan hilang saat `StyledSelect` pensiun.
- **Thumbnail vs avatar** (keputusan desain): gambar opsi FormFill adalah *thumbnail* (`rounded-md border`), bukan avatar; `rounded-full` disimpan untuk avatar sungguhan.
- **Tanpa komponen wrapper baru**: `SearchableSelect` menang sebagai superset, bukan abstraksi baru.
- **Koreksi path di tengah eksekusi**: komponen builder berada di `resources/js/components/modules/builder/**`, **bukan** `modules/dashboard/builder/**` seperti yang disiratkan berkas brief/recon awal. Terdeteksi karena lane W3 menolak menyentuh file di luar scope, lalu dikoreksi di W3b. Dicatat agar jejak dokumen akurat.

## Verifikasi

> Catatan kejujuran: seluruh perintah verifikasi dan loop TDD **dieksekusi oleh orchestrator**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten ketujuh commit dan evidence yang dilaporkan orchestrator.

- Acceptance grep-zero: `grep -rn "SimpleSelect\|simple-select\|StyledSelect\|styled-select" resources/js` → **NO matches**.
- Full frontend suite: `npx vitest run` → **49 file test / 319 test** passed (dijalankan dua kali: setelah hapus `simple-select`, dan setelah F2a).
- `npx eslint` pada setiap file yang berubah di semua gelombang → exit 0.
- Production build: `podman exec -w /app d_form_app npm run build` → `✓ built in 17.25s` (hanya warning non-blocking pre-existing: `@vueuse/core` PURE-comment, `lottie-web` eval, chunk >500 kB).
- Verifikasi sumber: `simple-select/` dan `styled-select/` absen; hanya `searchable-select/` yang tersisa; `SearchableSelect.vue` memuat `required`/`invalid`/`imageSrc` dan `optionInitials` (tanpa fallback `initialsOf`); `FormFillFieldSlotRows.vue` memetakan `value: row.label`.

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10 Mx-2-A (`:272`); rencana: `docs/big-changes/plans/2026-09-27-DFORM-33-mx-a-trio-select-plan.md`.

- Spec menyebut "**17 call-site `SimpleSelect`**"; recon menemukan **33 tag di 17 file** (satu file bisa memuat >1 tag, mis. `PeriodApplicantSection.vue` 5 tag, `MyInterviews/Index.vue` 4 tag). Angka commit (33 tag / 17 file) yang dipakai di dokumen ini.
- Spec `:272` menulis `FormFillFieldSlotRows.vue:9,218` → line numbers bergeser setelah perubahan; migrasi tetap terjadi di file yang sama (import + `<SearchableSelect>`).
- Checklist spec "verifikasi manual terpandu" tidak dapat diotomasi; diganti pin test + `npm run build` sebagai bukti tambahan (sesuai rencana).
- Tidak ada penyimpangan lain: `SearchableSelect` menjadi satu-satunya select, `simple-select/*` + `styled-select/*` dihapus, suite hijau — seluruh acceptance Mx-2-A terpenuhi.

## Catatan untuk tim

- DFORM-33 adalah cluster **A** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; cluster ini yang terbesar (7 commit).
- Konsekuensi UX yang diterima: semua select filter kini punya kotak search; varian avatar-opsional menahan churn visual (lihat Keputusan).
- Tidak ada unit test select sebelum ticket ini; `SearchableSelect.test.ts` (14 test) kini menjadi jaring regresi komponen select tunggal.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-33.
