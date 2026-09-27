# Sapto Changes — 27 September 2026 (DFORM-46)

Tiket Jira: **DFORM-46** — kepatuhan `resources/` terhadap **14 aturan user** + aturan typing/arsitektur (status: In Progress → target **In Review**).
Rencana yang disetujui: [`docs/big-changes/plans/2026-09-27-DFORM-46-rule-compliance-plan.md`](../../big-changes/plans/2026-09-27-DFORM-46-rule-compliance-plan.md) (14 tugas, 5 fase).
Ledger eksekusi + seluruh keputusan/paritas: `.superpowers/sdd/2026-09-27-DFORM-46-rule-compliance-plan/ledger.md`.

Pola: **satu tiket, satu berkas changelog, tabel per-commit dengan kolom Issue**, eksekusi **subagent-driven TDD vertical slice**, commit **atomik** per langkah (`git add <path spesifik>`, tidak pernah `git add -A`), tanpa push. Tabel di bawah hanya memuat commit ber-`DFORM-46`; commit tiket lain (DFORM-47/48/49) yang berselang-seling di `main` sengaja tidak dihitung.

## Ringkasan (TL;DR)

- **45 commit atomik**, 555 perubahan berkas, **+4286 / −2774**.
- Aturan 1 (prefix `I`/`G`/`T`): seragam di seluruh `resources/js` (5 commit per-slice + residual).
- Aturan 2/14 (utility TS, tanpa redundansi): `IPaginator<GItem>`, `Partial<T>`/`Record<keyof T, …>`, satu `stripHtmlToText`, satu predikat file-upload, satu sumber teks field.
- Aturan 3 (tipe longgar): **`any` = 0** dan **`as unknown as` = 0** di produksi; `unknown` hanya di **batas eksternal** (respons HTTP/parser) dan selalu dipersempit lewat guard predikat. Termasuk seluruh berkas test (mock bertipe konkret).
- Aturan 4 (`!` & supresi): **0** `@ts-ignore`/`@ts-expect-error`/`eslint-disable`/`noqa` dan **0** non-null assertion di luar `components/ui/**`.
- Aturan 5/6/7 (optimal, dedup, ≤2 parameter): satu token/alur review, modul `lib/` bersama, objek argumen untuk fungsi >2 parameter.
- Aturan 10–12: god function & nama ambigu dipetakan (lihat §Status); konstanta bernama menggantikan magic value (`CHART_FONT_FAMILY`, `AUTOSAVE_DEBOUNCE_MS`, `CATEGORY_COLOR_FALLBACK`, dst.).
- Aturan 13: doc 1–2 baris pada **77 fungsi exported** (T1) + seluruh ekspor baru.
- Arsitektur: `lib/` **bebas DOM** dan **bebas `vue-sonner`**; efek UI (suara/getar, toast, Inertia request) pindah ke `hooks/`; arah impor `lib → components` = **0**.
- Gerbang terakhir: `typecheck` 0 · `lint` 0 · **71 berkas / 473 test** · `prettier --check` bersih (naik dari baseline 459 test, tidak ada test yang dihapus/di-`skip`).
- **Delta user-visible: 3** — dirinci di §Delta user-visible (satu di antaranya perbaikan bug EventCard yang kamu minta).

## Pemetaan tugas → status

| Tugas    | Isi                                                             | Status                                                   |
| -------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| T1       | Doc 1–2 baris tiap fungsi exported (aturan 13)                  | **selesai** (`4fd2909`, `ded16c8`)                       |
| T2       | Prefix `I`/`G`/`T` (aturan 1)                                   | **selesai** (6 commit)                                   |
| T3       | Hapus `!` + supresi (aturan 4)                                  | **selesai** (4 commit)                                   |
| T4       | Hapus `any`/`unknown` longgar di produksi **+ test** (aturan 3) | **selesai** (12 commit)                                  |
| T5       | Guard predikat ganti `as` (aturan 3)                            | **selesai** (5 commit, 37/42 situs cast dihapus)         |
| T6/T7/T8 | Dedup lintas berkas + tipe reusable (aturan 6/14)               | **selesai** (`fbed7ca`, `434d297`, `88d5528`)            |
| T9       | Magic value/teks duplikat → konstanta bernama (aturan 11)       | **sebagian** — slice 1–3 + #3 selesai; slice 4/5 lanjut  |
| T10      | God function dipisah per tanggung jawab (aturan 10)             | **menyusul** (peta sudah ada)                            |
| T11      | `lib/` murni: pindahkan efek UI ke `hooks/`                     | **selesai** (`f153c42`, `800799e`, `3006428`, `b58f2e0`) |
| T12a     | Struktur folder (`layout/`, `<Head>` Auth)                      | **selesai** (`9e49c2a`, `281d758`)                       |
| T12b     | Rename berkas bermasalah                                        | **menyusul**                                             |
| T13      | Komponen kustom keluar dari `components/ui/**`                  | **menyusul**                                             |
| T14      | Nama ambigu/AI-slop (aturan 8/12)                               | **menyusul**                                             |

## Keputusan user yang mengikat (mengubah cakupan/perilaku)

| #   | Keputusan                                                                                    | Dampak                                                      |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Bug `EventCard` **diperbaiki**                                                               | satu-satunya delta perilaku di T5 (`1b49877`), +6 test      |
| 2   | 9 nilai divergen T9 **diperbaiki** ke yang paling konsisten dengan aturan                    | melahirkan §Delta #2 dan temuan yang sengaja _tidak_ diubah |
| 3   | `components/seo/` → `core/`                                                                  | bagian T13 (menyusul)                                       |
| 4   | `lib/inertiaRequest.ts` → **`hooks/useInertiaRequest.ts`**                                   | `3006428`                                                   |
| 5   | Dead code `lib/eventValidationToast.ts` + `showEventValidationToast` **dihapus**             | `8ca2674`                                                   |
| 6   | Hook mati `hooks/useFormSubmissionsPage.ts` **dihapus** (0 konsumen, 0 test)                 | `b3144e3`                                                   |
| 7   | `TITLE_MAX` **tetap 200**, hanya komentar `lib/displayLimits.ts` yang dikoreksi              | **nol** perubahan batas ketik (lihat §Delta #3)             |
| 8   | Karena #7, kapabilitas `accept` banner **tidak dinaikkan** — hanya representasinya disatukan | mismatch `webp` dilaporkan, tidak diubah (T9 tail)          |

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

Sumber waktu/SHA: `git log --format='%h %ad %s'` + `git show --shortstat` per commit.

## Per-fase (yang sudah mendarat)

### T1 — Doc 1–2 baris (aturan 13)

77 fungsi exported di `lib/`, `types/`, `hooks/`, `builder/` diberi doc singkat (apa + kapan dipakai). Doc ditulis **tanpa** mengubah perilaku; seluruh ekspor baru di commit berikutnya juga mengikuti aturan ini.

### T2 — Prefix `I`/`G`/`T` (aturan 1)

`interface` → `I…`, `type` alias → `T…`, generic → `G…`, per slice (`types`, `lib`, `hooks`, `components`, `pages`) + residu. Murni rename simbol; import di luar slice ikut diperbarui.

### T3 — `!` dan supresi (aturan 4)

Non-null assertion dihapus lewat guard/early return; 2 supresi dihapus dengan memindahkan mutasi `answerForm` ke hook (aturan 10/14 sekaligus). Dua celah test yang ditemukan reviewer ditutup dengan commit test terpisah.

### T4 — `any`/`unknown` longgar (aturan 3)

Produksi **dan** test: `any` = 0, `as unknown as` = 0. `unknown` yang tersisa hanya di **batas eksternal** (payload respons HTTP, JSON, `localStorage`) dan selalu dipersempit segera oleh guard predikat — alasan satu baris per situs dicatat (lihat §`unknown` & `as` yang dipertahankan). Mock test memakai tipe konkret (`IMockFormState`, `TMockFormStateValue`), bukan `any`.

### T5 — Guard predikat ganti `as` (aturan 3)

37 dari 42 situs cast dihapus; 5 dipertahankan dengan alasan tertulis. Dua temuan reviewer ditutup dengan test (paritas + kasus batas). Bug `EventCard` (satu-satunya delta perilaku) diperbaiki di sini bersama 6 test penjaga.

### T6/T7/T8 — Dedup & tipe reusable (aturan 6/14)

Satu token/alur review, satu `stripHtmlToText` (+ `hasMeaningfulHtmlText`), satu predikat file-upload, `IPaginator<GItem>` untuk paginator lintas modul, `lib/htmlText.ts` + `lib/formFieldKind.ts` sebagai satu sumber kebenaran.

### T9 — Konstanta bernama (aturan 11), slice 1–3 + #3

- Slice 1: modul `lib/debounce.ts`, `lib/displayLimits.ts`, `lib/uiLabels.ts`; `CHART_FONT_FAMILY` diekspor dari `lib/chartTheme.ts`.
- Slice 2–3: 4 situs debounce → `AUTOSAVE_DEBOUNCE_MS`/`RESPONDENT_DRAFT_DEBOUNCE_MS`; 4 situs font chart → `CHART_FONT_FAMILY`; 11 situs header JSON → helper murni `lib/jsonRequest.ts` (`jsonRequestHeaders()`), +3 berkas test/6 test.
- #3 (peran warna): konstanta `CATEGORY_COLOR_FALLBACK` menggantikan campuran `#6B7280`/`var(--muted-foreground)` pada peran **latar** badge/dot/titik; peran **teks** sengaja dibiarkan berbeda (kontras yang disengaja). Detail + delta visual: §Delta #2.
- Slice 4/5 (adopsi konstanta sisa + arbitrase nilai divergen) **berjalan** — lihat §Status.

### T11 — `lib/` murni (arsitektur + aturan 10)

- `playScanBeep` + vibrasi → `hooks/useScanFeedback.ts` (parameter WebAudio/getar **byte-identik**, satu pemanggil `useQrFeed`).
- Arah impor `lib → components` menjadi **0**: `normalizeBannerSrc` (terbukti murni) → `lib/bannerSrc.ts` (badan byte-identik); DTO `IApplicationDetail` + tipe dependennya → `types/recruitment.ts` (bentuk anggota/opsionalitas tak berubah).
- `lib/inertiaRequest.ts` → `hooks/useInertiaRequest.ts` (test dipindah utuh: 4 `it()`/6 `expect()`); `lib/` kini **bebas DOM**.
- `lib/error-message.ts` dipecah: **teks murni tetap di `lib`**, emisi toast → `hooks/useErrorToast.ts` + `hooks/useGlobalErrorToast.ts` (2 situs `app.js` yang berjalan di module scope dipindah ke composable di **root setup**). 76 situs diadopsi; **23 berkas test** disesuaikan mock-nya dengan jumlah `it`/`expect` **tak berubah satupun**. `vue-sonner` kini nol di `lib/`.

### T12a — Struktur

Empat komponen kerangka (Navbar/Footer/Sidebar/Topbar) pindah ke `components/layout/`; 4 halaman Auth memakai `<Head>` dengan judul H1 yang **sudah ada** (tanpa teks baru).

## Delta user-visible (disahkan)

### #1 — Bug `EventCard` (diperbaiki atas permintaanmu) — `1b49877`

Menu aksi EventCard memakai eksklusi ref yang salah sehingga pemicu ikut terdeteksi "di luar" dan menu gagal menutup/memicu dengan benar. Perbaikan memakai `$el` + 5 jalur menu diuji (6 test baru). Ini **satu-satunya** perubahan perilaku di T5 dan sudah kamu setujui eksplisit.

### #2 — Warna latar badge kategori (peran divergen) — `0cb402a`

Latar badge/dot/label kategori yang tak terpetakan `categoryColorMap` dulu campur: **6× `#6B7280`** dan **5× `var(--muted-foreground)`** (≈`#4F5966`) — dua warna untuk satu peran. Disatukan ke `CATEGORY_COLOR_FALLBACK = '#6B7280'` (nilai mayoritas). Delta visual: `#4F5966 → #6B7280`, Δlightness `+0.091` (dE76 Oklab `0.091`) — hanya terpicu saat backend mengirim kategori di luar peta. Situs yang sudah `#6B7280` hanya berganti literal → konstanta (**nol** perubahan piksel). Peran **teks** (`EventDetail` chip muted vs kartu putih) sengaja dibiarkan berbeda karena kontrasnya memang disengaja.

### #3 — `TITLE_MAX` tetap 200 (keputusanmu) — nol perubahan

Bukti: backend membatasi judul `max:100` (5 FormRequest + migrasi `string(100)`), sedangkan konstanta FE `TITLE_MAX = 200` dan komentarnya menyatakan "selaras backend". Kamu memutuskan **tetap 200**; maka **tidak ada** perubahan batas ketik dan **tidak ada** perubahan operator indikator. Yang diperbaiki hanya **komentar** `lib/displayLimits.ts` agar tidak lagi mengklaim selaras backend. Temuan "indikator batas `>` tidak pernah tampil karena input sudah di-slice" dicatat sebagai item **ditunda** (bukan bug yang mengubah perilaku).

### #4 — Dead code & hook mati (tidak user-visible)

`lib/eventValidationToast.ts` + `showEventValidationToast` (`8ca2674`) dan `hooks/useFormSubmissionsPage.ts` (`b3144e3`, 0 konsumen, 0 test) dihapus setelah daftarnya kamu setujui. Penghapusan hook mati sekaligus menghapus satu-satunya sisa istilah "Submission" (UI nyata konsisten memakai "Jawaban").

## `unknown` & `as` yang dipertahankan + alasan

Aturan repo: `unknown` **dilarang** sebagai tipe longgar; pemakaian di batas eksternal wajib **segera dipersempit** dan alasannya ditulis. Yang tersisa (terverifikasi per-slice, daftar lengkap ada di ledger):

| Lokasi                                                                   | Bentuk                        | Alasan                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/modules/builder/fieldMapping.ts:252,260,309,346`             | `as`                          | Kategori B: tipe deklarasi menyangkal bentuk runtime yang sudah dijaga guard; cast dipertahankan agar bentuk lama tidak berubah — **alasan tertulis di ledger** |
| `components/modules/builder/dirtyFields.ts:10`                           | `as`                          | Kategori D: batas eksternal (nilai dari DOM/serialisasi), dipersempit segera                                                                                    |
| `components/modules/auth/AuthForgotPasswordForm.vue:38`                  | `as Record<string, string[]>` | Kategori D: `error.response.data.errors` dari respons HTTP; diperlakukan sebagai batas eksternal                                                                |
| `components/modules/dashboard/FormFillParticipantEmailsSection.vue:179`  | `as`                          | Kategori C/D — batas eksternal                                                                                                                                  |
| `components/modules/dashboard/recruitment/PeriodApplicantSection.vue:51` | `as`                          | Kategori C/D — batas eksternal                                                                                                                                  |
| `pages/Dashboard/Recruitment/Periods/Show.vue:351`                       | `as`                          | Kategori C/D — batas eksternal                                                                                                                                  |
| `pages/Dashboard/User/TeamInvitation.vue:149,165`                        | `as`                          | Kategori C/D — batas eksternal                                                                                                                                  |
| `pages/OpenRecruitment/Apply.vue:296`                                    | `as`                          | Kategori C/D — batas eksternal                                                                                                                                  |
| `hooks/useRespondentDraft.ts:152`                                        | `as`                          | Batas eksternal `localStorage` yang dipersempit                                                                                                                 |
| `lib/chartTheme.ts:22`                                                   | `as`                          | Batas eksternal konfigurasi chart                                                                                                                               |
| `pages/Dashboard/Events/Forms/Show.vue`                                  | `body: unknown`               | Kategori D: body respons HTTP, dipersempit `parseApiErrorMessage`                                                                                               |
| `hooks/useErrorToast.ts` (`showHttpErrorToast(body?)`)                   | `unknown`                     | Kategori D: body respons HTTP, dipersempit guard; **alasan 2 baris** di doc fungsi                                                                              |

Kebijakan T5: kategori **A** (`as unknown as`) dan **G** (`any`) wajib **0** → terbukti 0; kategori **B** (menyangkal tipe) diperbaiki; kategori **D** (batas eksternal nyata) boleh bertahan + alasan satu baris.

## Verifikasi

Gerbang per-commit (dijalankan tiap langkah; `lint`+`typecheck` untuk setiap commit, `test` penuh pada commit yang menyentuh perilaku/test):

```
npx prettier --check <berkas berubah>     # selalu hijau
npm run typecheck   (vue-tsc --noEmit)   # 0 error
npm run lint        (eslint)             # 0 error
npm test            (vitest)             # 71 berkas / 473 test hijau
```

Verifikasi mandiri orchestrator atas gelombang T11 (bukan hanya laporan lane):

- `diff` badan `normalizeBannerSrc` lama vs baru → **kosong (byte-identik)**.
- `diff` daftar anggota `IApplicationDetail` lama vs baru → **kosong**.
- `grep "from '@/components" resources/js/lib` → **kosong**; `lib/` bebas DOM & `vue-sonner`.
- Literal emitor toast (durasi `14_000`/`6000`/`4000+`, `toast.error` ×8, `toast.success` ×1, peta status 401–503, seluruh teks Indonesia) → **hitungan identik** lama vs `useErrorToast.ts`.
- Diff tervonis tiap commit dicek **0** `as`/`any`/`!`/supresi baru dan **0** berkas di luar scope.
- Test yang dipindah tetap 4 `it()`/6 `expect()`; total test tidak pernah turun (459 → 473).

Reviewer independen: T5 builder di-review `@oracle` dengan **differential fuzz 14 kelas input → 0 mismatch**; S6 di-review `@oracle` (**0 teks berubah, 0 test dilemahkan**, 1 delta diterima).

**Gerbang terintegrasi akhir (R16)** dijalankan di pohon sunyi sebelum tiket ditutup — hasilnya ditulis di §Status saat finalisasi.

## Yang sengaja TIDAK diubah + utang yang dicatat

- **`oklch(0.18 0.018 255)`** (`chartTheme.tooltipBg` vs `RegistrationChart.pointHoverBorderColor`): peran berbeda → menyatukan justru meng-couple tooltip dengan ring titik.
- **Ellipsis Unicode vs ASCII**: `Menyimpan…`, `Mengirim…`, `Memproses…` (1 karakter) sengaja tidak disamakan dengan varian `...` (3 titik) — keduanya tampil sah dan menyatukannya = delta teks tanpa manfaat.
- **Mismatch `webp`**: backend periode mengizinkan `webp` sementara picker FE melarangnya. Sesuai keputusan #8 (konservatif), **tidak** diubah — dilaporkan sebagai temuan untuk keputusan terpisah.
- **Indikator batas judul `>`** yang tidak pernah tampil: dicatat, tidak diubah (keputusan #7).
- **`lib/dummyData.ts`**: masih memuat peringatan deprecasi + `categoryColorMap`/`statusColorMap`; menariknya ke modul produksi adalah refactor terpisah (di luar batas slice ini).
- **Temuan `@oracle` (ora-5) yang tidak diperbaiki**: `isPlainObject`/`isRecord` yang tidak sepenuhnya sound, dan `noUncheckedIndexedAccess` masih off — dicatat sebagai utang repo, bukan regresi tiket ini.
- **Utang struktural yang belum dikerjakan**: T10 (god function; `useQrFeed.submitScan` 166 baris butuh test penjaga dulu), T12b (3 rename berkas), T13 (5 komponen kustom di dalam `components/ui/**` + `components/ui/button/index.ts` varian DFORM-39 + wrapper `DatePicker.vue`; `ui/spinner/Spinner.vue` = pola Shadcn, cukup catatan), T14 (nama ambigu; `obs` di 11 berkas landing; loop counter `i/j/k` tidak dinamai ulang), dan sisa literal `#6B7280` di `pages/Dashboard/User/Index.vue:138` + `EventDetail.vue:260` (peran latar yang sama, dilaporkan `@designer` untuk lane pemilik).

## Status pengerjaan & sisa

- **Selesai & ter-commit:** T1, T2, T3, T4, T5, T6/T7/T8, T11, T12a, T9 slice 1–3 + #3, penghapusan dead code, seluruh test penjaga.
- **Berjalan:** T9 slice 4–5 (adopsi konstanta + arbitrase nilai divergen: `per_page`, konstanta polling per-domain, dedup representasi MIME tanpa menaikkan kapabilitas, konstanta password-match, koreksi komentar `displayLimits`, penyatuan helper `/storage/` + 2 bug normalisasi terbukti).
- **Menyusul (berurutan, karena berkas bentrok):** struktur (T12b rename + T13 `ui/**` + `SCAN_STATUS_THEME` keluar dari `lib/`) → T9 sisa → T10 + T14 → gerbang terintegrasi akhir → status Jira **In Review**.
- Dokumen ini diperbarui pada finalisasi (tabel commit + gerbang akhir + status).

## Catatan untuk tim

- Sumber kebenaran akhir tetap **diff Git + status Jira DFORM-46**; dokumen ini ringkasan.
- Selama tiket ini berjalan, `main` juga memuat commit **DFORM-47/48/49** (developer paralel). Beberapa berkas sempat "kotor" karena itu; setiap commit di atas **hanya** menyertakan berkas milik slice-nya, dan setiap sinyal gerbang merah yang berasal dari lane lain **diatribusikan**, bukan ditambal.
- `resources/js/actions/**` dan `resources/js/wayfinder/**` adalah berkas generated (gitignored) — tidak pernah diedit di tiket ini.
- `components/ui/**` (Shadcn-Vue asli) **tidak diubah** sepanjang tiket; pelanggaran historis (komponen kustom di dalamnya) dibukukan sebagai T13.
