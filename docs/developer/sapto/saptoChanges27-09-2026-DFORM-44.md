# Sapto Changes — 27 September 2026 (DFORM-44 Chore)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-43.md`](./saptoChanges27-09-2026-DFORM-43.md). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-44** — `[Chore] Normalisasi prettier repo-wide + gate anti-regresi`. Basis commit: `20b6235` (`refactor(skeleton,DFORM-43): 3 halaman pakai KpiCardSkeleton (K)`). F0 + gate + 4 batch sapuan = **6 commit atomik**; HEAD saat dokumen ini ditulis `8e25a41` (batch 4).

**DFORM-44 tidak mengubah perilaku aplikasi.** Seluruh perubahan batch adalah **reformat mekanis** (whitespace + urutan kelas Tailwind) tanpa perubahan logika, markup, atau prop; sisanya 2 perubahan konfigurasi/CI. Yang perlu dibaca dari dokumen ini adalah *urutan kerja*, *keputusan scope*, dan *gate anti-regresi* yang ditinggalkan.

## Tujuan & Ringkasan (TL;DR)

1. **Pratinjau awal bikin kaget**: `npx prettier --check "resources/js/**/*.{vue,ts}"` = **404 file merah**; setelah `tailwindStylesheet` ditambahkan justru **411** (urutan kanonik `prettier-plugin-tailwindcss` v4 lebih ketat). Dua sebab sekaligus: (a) mayoritas file punya urutan kelas yang beda dari kanonik plugin 0.7.1; (b) sebagian file memang belum pernah diformat.
2. **F0 (`770bfd1`)** menambahkan `"tailwindStylesheet": "./resources/css/app.css"` ke `.prettierrc` — **wajib lebih dulu**, karena tanpa opsi itu plugin memakai urutan kelas *fallback* dan sapuan berisiko harus diulang.
3. **Gate anti-regresi (`e7df201`)**: workflow formatting dijadikan **blocking** (hapus `continue-on-error`) + scope disempitkan ke js/css, plus `.githooks/pre-commit` **nol-dependensi** untuk lokal.
4. **Sapuan 4 batch = 412 file**: `components/ui` 167, `components/modules` 108, `pages` 72, core-js 65.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 19:44 | `770bfd1` | zappto | DFORM-44 | chore(prettier): `tailwindStylesheet` agar plugin sadar Tailwind v4 (F0) |
| 19:48 | `e7df201` | zappto | DFORM-44 | chore(ci): gate format blocking + pre-commit nol-dependensi |
| 19:52 | `1c45c1d` | zappto | DFORM-44 | style(ui): sapuan prettier batch 1 — `components/ui` (167 file) |
| 19:52 | `896415b` | zappto | DFORM-44 | style(modules): sapuan prettier batch 2 — `components/modules` (108 file) |
| 19:52 | `56c5865` | zappto | DFORM-44 | style(pages): sapuan prettier batch 3 — `pages` (72 file) |
| 19:55 | `8e25a41` | zappto | DFORM-44 | style(core-js): sapuan prettier batch 4 — lib/hooks/types/layouts/css (65 file) |

Sumber SHA/waktu: reflog `.git/logs/HEAD` (epoch `+0700`). Enam commit DFORM-44 **tidak seluruhnya berurutan**: di antaranya terselip commit ticket lain (DFORM-46 doc `4fd2909`/`ded16c8`, changelog DFORM-42 `d39bfd2`, DFORM-43 `7ffad14`, DFORM-45 `530ac69`) — jadi `770bfd1` bukan parent langsung `e7df201`. `8e25a41` = HEAD.

## Per-commit

#### `770bfd1` chore(prettier,DFORM-44): tailwindStylesheet agar plugin sadar Tailwind v4 (F0)

- `.prettierrc` ditambah `"tailwindStylesheet": "./resources/css/app.css"`. **Diverifikasi langsung** ke file: opsi ini memang ada, dan `prettier-plugin-tailwindcss` terpasang di `plugins`.
- Alasan urutan: tanpa opsi ini plugin 0.7.1 memakai **urutan kelas fallback**, sehingga kelas Tailwind tersortir beda dari kanonik v4 → sapuan berisiko harus diulang. Ini prasyarat batch 1–4.
- Efek samping terukur: angka merah `--check` justru naik 404 → 411 setelah opsi ini (lihat Keputusan #1).

#### `e7df201` chore(ci,DFORM-44): gate format blocking + pre-commit nol-dependensi

- `.github/workflows/code_formatting.yml` — step **Prettier**: `continue-on-error: true` **dihapus**, sehingga gate formatting pertama kali benar-benar bisa menggagalkan build; scope disempitkan ke `npx prettier --check "resources/js/**/*.{vue,ts}" "resources/css/**/*.css"`. **Diverifikasi langsung** ke file (step `💅 Run Prettier (js/css proyek)`, baris 68–73, memuat komentar alasan DFORM-44).
- Catatan penting: step **Laravel Pint** (`./vendor/bin/pint --test`) **masih** `continue-on-error: true` (baris 54). DFORM-44 hanya mem-blocking-kan gate prettier js/css, **bukan** Pint.
- `.githooks/pre-commit` **baru** (diverifikasi langsung): skrip `/bin/sh` **nol paket baru** yang menjalankan `npx prettier --check` hanya pada berkas js/css yang di-stage (`git diff --cached --name-only --diff-filter=ACMR` + filter `^resources/(js/.*\.(ts|vue)|css/.*\.css)$`); keluar 0 bila tidak ada berkas js/css yang di-stage. Diaktifkan per klon: `git config core.hooksPath .githooks`.

#### `1c45c1d` style(ui,DFORM-44): sapuan prettier batch 1 — `components/ui` (167 file)

- Reformat mekanis seluruh `resources/js/components/ui/**`. Ini batch yang menyentuh area yang secara aturan dilarang diubah (lihat Keputusan #4).

#### `896415b` style(modules,DFORM-44): sapuan prettier batch 2 — `components/modules` (108 file)

- Reformat mekanis `resources/js/components/modules/**`.

#### `56c5865` style(pages,DFORM-44): sapuan prettier batch 3 — `pages` (72 file)

- Reformat mekanis `resources/js/pages/**`.

#### `8e25a41` style(core-js,DFORM-44): sapuan prettier batch 4 — lib/hooks/types/layouts/css (65 file)

- Reformat mekanis `resources/js/{lib,hooks,types,layouts}`, `components/{core,seo}`, dan `resources/css/app.css`.
- Rincian dari brief: lib 22, lib/__tests__ 2, hooks 16, hooks/__tests__ 6, types 8, layouts 4, components/core 3, components/seo 1, resources/css/app.css 1. **Rincian ini berjumlah 63, sedangkan pesan commit/scope menyebut 65** → 2 file tidak terperinci (lihat Verifikasi).
- Jira: DFORM-44.

## Keputusan & koreksi

1. **Baseline 404 → 411.** `npx prettier --check "resources/js/**/*.{vue,ts}"` merah pada **404 file** sebelum config diperbaiki dan **411 file** sesudahnya. Artinya bukan satu akar tunggal: (a) mayoritas file punya urutan kelas yang beda dari kanonik plugin v4; (b) sebagian file memang belum pernah diformat (mis. `Profile.vue` sempat punya `const` tanpa titik koma). **Konsekuensi desain: sapuan dijalankan SEKALI dengan config final, bukan dua kali.**
2. **Cakupan total 412 file** = 167 + 108 + 72 + 65.
3. **Scope sengaja dibatasi** ke `resources/js/**` + `resources/css/**`. User memutuskan **TIDAK** menyapu file merah lain di luar itu (docs 54, `public/lotties` 27 JSON aset animasi, `resources/views` 19 blade, `lang` 2, config root 4, dll). Akibatnya `npx prettier --check .` (seluruh repo) **tetap merah**: **111 file** merah di luar js/css. Angka repo-wide **524 file** diukur **saat sapuan batch 1 sedang berjalan**; 524 − 111 = **413** = merah js/css pada saat pengukuran itu (≈ 412 file yang akhirnya tersapu, selisih 1 file yang masih in-flight) — kedua angka konsisten, bukan kontradiksi. Karena itu perintah CI disempitkan ke glob js/css supaya gate blocking tidak merah oleh file di luar scope. **Ini keputusan sadar, bukan kelalaian** — konsekuensinya: docs/blade/aset JSON masih belum diformat dan **TIDAK digerbang**.
4. **Pengecualian tercatat terhadap larangan `ui/**`.** `AGENTS.md` melarang mengubah `resources/js/components/ui/**` (Shadcn asli). User memutuskan batch 1 **tetap** menyapu `components/ui/**` karena ini **reformat mekanis tanpa perubahan perilaku/markup**. Jumlah file batch 1 = **167** (diverifikasi `git show --name-only 1c45c1d`); angka 166 hanyalah estimasi pra-sapuan dan tidak dipakai lagi. Alasan satu baris ini dicatat sesuai aturan 11 AGENTS.md (penyimpangan lintas-pakai wajib beralasan tertulis).
5. **Risiko `twMerge` diperiksa, hasilnya nol pembalikan.** Pengurutan kelas di dalam `cn()/cva()/buttonVariants()` berpotensi membalik aturan "terakhir menang" `tailwind-merge` untuk utility berkonflik. Lane memeriksa tiap batch (ekstraksi token per-call, normalisasi `!x`→`x!`, uji sensitivitas urutan twMerge, bandingkan urutan pasangan HEAD vs worktree): **0 pembalikan pemenang konflik di keempat batch**, dan **tidak ada kelas yang hilang**. Pasangan konflik yang memang sudah ada — urutannya dipertahankan, bukan disebabkan prettier — contohnya:
    - `ui/input-group/index.ts:32` — `px-2|p-0`, `size-6|size-8`, `rounded-sm|rounded-md`
    - `ui/sidebar/index.ts:38` — `text-sm|text-xs`, `h-9|h-8`, `h-9|h-12`
    - `ui/sheet/SheetContent.vue:36` — `h-full|h-auto`, `inset-y-0|top-0`
    - `dashboard/KpiCard.vue:35,51,53`
    - `dashboard/FormParagraphContent.vue:19` — `text-sm` me-reset line-height (konflik asli)
    - `core/field/BannerPickerField.vue:62,70` — base-then-conditional yang memang sengaja

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell**, jadi tidak bisa menjalankan `prettier`, `vitest`, `eslint`, `podman`, atau `git show --stat`. Yang **sudah diverifikasi langsung ke tree**: isi `.prettierrc`, isi `.github/workflows/code_formatting.yml`, dan isi `.githooks/pre-commit`. Semua SHA/pesan/waktu commit diverifikasi dari reflog `.git/logs/HEAD`. Sisanya ditandai **"dari brief"**.

- **Config** (diverifikasi langsung): `.prettierrc` memuat `"tailwindStylesheet": "./resources/css/app.css"`; workflow Prettier tanpa `continue-on-error` dan scope-nya `resources/js/**/*.{vue,ts}` + `resources/css/**/*.css`; `.githooks/pre-commit` ada dan isinya sesuai deskripsi (filter staged js/css, nol dependensi).
- **Commit** (diverifikasi dari reflog): keenam SHA/pesan/waktu DFORM-44 seperti tabel; `8e25a41` = HEAD; urutan commit non-kontigu karena terselip commit ticket lain.
- **Dari brief (belum diverifikasi independen, tanpa shell)**: angka baseline 404/411/524, cakupan 412 file, rincian batch 4, hasil **vitest 58 file / 386 tes hijau** per batch, eslint exit 0, build container (`podman exec -w /app d_form_app npm run build`) exit 0, penutup `npx prettier --check "resources/js/**/*.{vue,ts}" "resources/css/**/*.css"` → *"All matched files use Prettier code style!"*.
- **Uji gate (dari brief)**: file probe berformat buruk **DITOLAK**; tanpa berkas js/css yang di-stage → exit 0 (lolos).
- **Tiga selisih angka — sudah diselesaikan dengan bukti git** (dilaporkan jujur dulu oleh penulis dokumen, lalu ditutup orchestrator, bukan dibiarkan menggantung):
    - (a) Rincian batch 4 = **65** file, bukan 63. Breakdown awal salah mencatat `components/core` sebagai 3 padahal **5** (`ConfirmationModal.vue`, `LocalLottie.vue`, `__tests__/ConfirmationModal.test.ts`, `button/AuthSubmitBtn.vue`, `field/BannerPickerField.vue`). Hitungan benar: lib 22 + lib/__tests__ 2 + hooks 16 + hooks/__tests__ 6 + types 8 + layouts 4 + core 5 + seo 1 + css 1 = **65** (diverifikasi `git show --name-only 8e25a41`).
    - (b) 524 (repo-wide) **bukan** dibandingkan dengan 412: 524 diukur saat sapuan berjalan, dan 524 − 111 (merah di luar js/css) = **413** = merah js/css saat itu ≈ 412 final + 1 file in-flight.
    - (c) Batch 1 = **167** file (diverifikasi `git show --name-only 1c45c1d`); "166" hanyalah estimasi pra-sapuan.
    - Hitungan per commit juga diverifikasi langsung dari git: `1c45c1d` 167, `896415b` 108, `56c5865` 72, `8e25a41` 65 → total **412**.
- **Kode aplikasi**: nol perubahan perilaku (reformat mekanis + config/CI). Tidak ada perilaku baru yang perlu diuji manual.

## Catatan untuk tim

- `npx prettier --check .` (seluruh repo) **TETAP merah**. Klaim "0 merah" **hanya** berlaku untuk glob `resources/js/**/*.{vue,ts}` + `resources/css/**/*.css`. Jangan salah membaca ini sebagai "repo sudah bersih".
- **Keterbatasan jujur**: DFORM-46 (sesi lain) menulis doc comment di `resources/js/{lib,hooks,types,components/modules/builder}/**` di tengah proses. Lane batch 4 diminta berhenti lebih dulu bila menemukan perubahan menggantung milik sesi itu (ternyata tidak ada). Kalau sesi DFORM-46 menulis lagi setelah sapuan, file-file itu bisa kembali merah — gate CI/pre-commit yang akan menangkapnya, **bukan jaminan permanen**.
- Aktifkan hook lokal sekali per klon: `git config core.hooksPath .githooks`.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-44.
