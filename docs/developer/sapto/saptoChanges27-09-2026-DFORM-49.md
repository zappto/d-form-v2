# Sapto Changes — 27 September 2026 (DFORM-49)

Penutup **utang teknis dark mode** dari seri Mx. Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-49** — `[frontend] Hapus sisa dark mode (mekanisme + kelas dark: di file aplikasi)` (status Jira saat dokumen disusun: **In Progress**; transisi ke In Review dilakukan setelah acceptance A1–A9 diverifikasi). Cakupan: menghapus **mesin** tema gelap (token gelap `resources/css/app.css`, jalur baca `data-theme` via `useChartTheme`, `color-scheme`) dan **63 kelas `dark:`** di 24 file aplikasi, tanpa menyentuh `resources/js/components/ui/**` (Shadcn). Basis bukti: baseline `9f8e373` — **62 file / 404 tes hijau**. Enam commit atomik DFORM-49; HEAD saat dokumen ini difinalkan `73c43a8` (dua commit DFORM-46 sesi agent paralel setelah `58afebd` — `014dc66` & `73c43a8` — bukan bagian tiket ini). Spec & plan lokal (`docs/superpowers/**`, gitignored) tidak dijadikan rujukan tunggal — dokumen ini mandiri.

**DFORM-49 menghapus fitur, bukan memperbaikinya.** Tidak ada lagi satu pun jalur yang bisa memunculkan tampilan gelap pada file aplikasi: pengguna OS dark, `data-theme="dark"` yang disuntik manual, maupun `<html class="dark">` semuanya tidak berpengaruh. Satu-satunya sisa yang **sengaja dibiarkan** adalah 6 kelas `dark:` di `components/ui/**` (inert karena gerbang mati) dan baris gerbang `@custom-variant dark` di `app.css:28`.

## Ringkasan (TL;DR)

1. **Mesin dihapus (Task 2, `83e2c01`)**: blok token gelap `resources/css/app.css:139-182` (`[data-theme='dark'], .dark { … }`) hilang; `resources/views/app.blade.php:7` memaksa `color-scheme` ke `light`; aturan `[data-theme='dark']` di `<style scoped>` `EventDashboardForm.vue` hilang (aturan terangnya tetap).
2. **Gerbang mati dipertahankan (keputusan inti).** Baris `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` di `app.css:28` **tidak dihapus**, hanya diberi komentar 4 baris. Alasan: di Tailwind v4 varian `dark:` default-nya **media-based** (`prefers-color-scheme`); bila baris itu dihapus, **6 kelas `dark:` di `components/ui/**`** (Shadcn, dilarang diubah) hidup kembali untuk pengguna OS dark. Dengan gerbang ini, `dark:` hanya aktif bila ada atribut `data-theme="dark"` — dan tokennya sudah tidak ada, jadi inert.
3. **Jalur tema chart dihapus (Task 1, `417571a`)**: `chartThemeTokens()` kini **tanpa parameter** dan selalu palet terang; `resources/js/hooks/useChartTheme.ts` + test-nya (4 tes) **dihapus**; `hooks/index.ts` mencabut ekspornya.
4. **63 kelas `dark:` disapu** = **2** (dua chart, Task 1) + **25** (`components/**`, Task 3 `6691d1a`, 11 file) + **36** (`pages/**`+`lib/**`+test, Task 4 `58afebd`, 11 file). Cabang **terang** selalu dipertahankan; tidak ada nilai terang yang berubah.
5. **Guard test pindah lokasi (Task 2 → `fcd8bff` + `29f410a`)**: dari `resources/js/lib/__tests__/` ke `resources/css/__tests__/darkModeGate.test.ts` (4 tes, termasuk satu penjaga anti-lulus-palsu). File lama dihapus.
6. **`ui/**` tidak disentuh** (non-goal). `grep` final: kode aplikasi (luar `ui/**`, luar test) `dark:` = **0**; `components/ui/**` tetap **6**; literal `dark:` di guard test JS = **9 baris**.
7. Verifikasi (diukur orchestrator di HEAD `73c43a8`): suite penuh **63 file / 420 tes hijau**, `typecheck` **0 error**, `eslint`/`prettier` bersih, `npm run build` **exit 0** di container podman `d_form_app`. Bukti end-to-end: CSS hasil build produksi **0 blok `prefers-color-scheme`** dan utilitas `dark:` hanya di scope `[data-theme=dark]`.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 20:44 | `83e2c01` | zappto | DFORM-49 | fix(css,DFORM-49): matikan mesin dark mode (hapus token gelap, color-scheme terang, gerbang mati dipin test) |
| 20:46 | `417571a` | zappto | DFORM-49 | refactor(chart,DFORM-49): buang jalur tema gelap (`chartThemeTokens` tanpa `isDark`, hapus `useChartTheme`) |
| 20:47 | `fcd8bff` | zappto | DFORM-49 | fix(test,DFORM-49): pindahkan guard dark mode ke luar skop tipe frontend + penjaga anti-lulus-palsu |
| 20:47 | `29f410a` | zappto | DFORM-49 | fix(test,DFORM-49): hapus guard test lama (versi `?raw`) yang tersisa dari commit sebelumnya |
| 20:50 | `6691d1a` | zappto | DFORM-49 | refactor(components,DFORM-49): sapu kelas `dark:` di komponen aplikasi |
| 20:50 | `58afebd` | zappto | DFORM-49 | refactor(pages,lib,DFORM-49): sapu kelas `dark:` di pages/lib + guard test ketiadaan varian gelap |

Sumber SHA/waktu: reflog `.git/logs/HEAD` (epoch `+0700`). Lima commit DFORM-49 **tidak kontigu**: terselip commit DFORM-46 sesi paralel `ad00b0c` (`83e2c01` → `ad00b0c` → `417571a`) dan `014dc66` setelah `58afebd`.

> **Catatan urutan (jujur).** Brief tiket menomori commit menurut Task plan (1 = chart `417571a`, 2 = css `83e2c01`), tetapi reflog Git menunjukkan **kebalikannya**: `83e2c01` (css) dibuat pukul 20:44, `417571a` (chart) pukul 20:46. Tabel di atas mengikuti **urutan Git** (first-parent), bukan nomor Task.

## Per-commit

#### `83e2c01` fix(css,DFORM-49): matikan mesin dark mode (hapus token gelap, color-scheme terang, gerbang mati dipin test)

- Apa (4 file, dari brief):
  - `resources/css/app.css` — blok `[data-theme='dark'], .dark { … }` (baris 139-182, sekitar 44 baris) **dihapus**; baris `@custom-variant dark …` diberi komentar 4 baris. **Terverifikasi di tree**: `app.css:24-28` memuat komentar gerbang + baris `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`; tidak ada lagi `[data-theme='dark']`/`.dark {`/`--background: oklch(0.16 0.012 255)`.
  - `resources/views/app.blade.php:7` — `<meta name="color-scheme" content="light" />`. **Terverifikasi di tree** (baris 6 `theme-color` dibiarkan).
  - `EventDashboardForm.vue` — aturan `[data-theme='dark'] .event-form-description-error :deep(.dform-rich-text) { … }` **dihapus**; aturan terang `.event-form-description-error :deep(.dform-rich-text) { background-color: color-mix(in srgb, var(--destructive) 5%, white); }` tetap. **Terverifikasi di tree** (baris 386-388).
  - `resources/js/lib/__tests__/darkModeGate.test.ts` — guard test awal (3 tes) dibuat di sini, lalu dipindah pada `fcd8bff`/`29f410a` (lihat di bawah).
- Jira: DFORM-49.

#### `417571a` refactor(chart,DFORM-49): buang jalur tema gelap (chartThemeTokens tanpa isDark, hapus useChartTheme)

- Apa (7 file, 2 dihapus, dari brief):
  - `resources/js/lib/chartTheme.ts` — 4 konstanta gelap (`CHART_TICK_DARK`, `CHART_GRID_DARK`, `CHART_TOOLTIP_BG_DARK`, `CHART_TOOLTIP_FG_DARK`) dihapus; `chartThemeTokens(isDark)` → `chartThemeTokens()` tanpa parameter. **Terverifikasi di tree**: signature `export function chartThemeTokens(): IChartThemeTokens` mengembalikan 4 konstanta `*_LIGHT`.
  - `resources/js/lib/__tests__/chartTheme.test.ts` — jadi palet tunggal (menghapus palet gelap dari ekspektasi).
  - `CategoryChart.vue` / `RegistrationChart.vue` — import `useChartTheme` + `const { isDark }` dihapus; `:key="String(isDark)"` dibuang (baris dataset memakai cabang terang saja); ` dark:ring-white/[0.06]` disapu (2 dari 63 token).
  - `resources/js/hooks/useChartTheme.ts` — **dihapus** (`git rm`). **Terverifikasi**: file tidak ada.
  - `resources/js/hooks/__tests__/use-chart-theme.test.ts` — **dihapus** (4 tes). **Terverifikasi**: file tidak ada.
  - `resources/js/hooks/index.ts` — cabut `export * from './useChartTheme'`. **Terverifikasi**: barrel tidak lagi memuat `useChartTheme` (celah daftar file plan; lihat Keputusan).
- Jira: DFORM-49.

#### `fcd8bff` fix(test,DFORM-49): pindahkan guard dark mode ke luar skop tipe frontend + penjaga anti-lulus-palsu

- Apa: `resources/css/__tests__/darkModeGate.test.ts` **baru** — 4 tes. **Terverifikasi di tree**:
  1. `membaca sumber yang benar (penjaga anti-lulus-palsu)` — assert `appCss.length > 1000`, memuat `@theme inline {`, dan blade memuat `<html lang=`.
  2. `mempertahankan @custom-variant dark yang scope ke atribut`.
  3. `tidak lagi mendefinisikan token gelap` — negatif terhadap `[data-theme='dark']`, `.dark {`, dan literal `--background: oklch(0.16 0.012 255)`.
  4. `memaksa color-scheme terang di blade`.
- Alasan pindah (lihat Keputusan #2): skop tipe frontend `tsconfig.json` sengaja `types: ["vite/client"]` (tanpa tipe Node), dan Vitest men-stub impor `.css` sehingga `?raw` mengembalikan string kosong → assertion negatif **lulus palsu**. Karena itu test ini jadi test sisi-Node di luar skop tipe (`resources/js/**`), di `resources/css/__tests__/`.
- Jira: DFORM-49.

#### `29f410a` fix(test,DFORM-49): hapus guard test lama (versi ?raw) yang tersisa dari commit sebelumnya

- Apa: `resources/js/lib/__tests__/darkModeGate.test.ts` (versi `?raw` di dalam skop tipe frontend) **dihapus**. **Terverifikasi**: glob `resources/js/lib/__tests__/*dark*` = kosong.
- Jira: DFORM-49.

#### `6691d1a` refactor(components,DFORM-49): sapu kelas dark: di komponen aplikasi

- Apa (11 file, 25 token, dari brief): sapuan kelas `dark:` di `resources/js/components/modules/**` + `components/modules/builder/FieldEditor.vue`. **Terverifikasi di tree**: `grep -rn 'dark:' resources/js/components/modules` = **kosong**.
- Commit **sebagian (partial staging)** untuk `FieldEditor.vue` (lihat Keputusan #6).
- Jira: DFORM-49.

#### `58afebd` refactor(pages,lib,DFORM-49): sapu kelas dark: di pages/lib + guard test ketiadaan varian gelap

- Apa (11 file, 36 token, dari brief): sapuan `dark:` di `resources/js/pages/**` + `resources/js/lib/**`, plus 3 file test diperbarui jadi **guard negatif** (bukan menghapus jaminan). **Terverifikasi di tree**:
  - `grep -rn 'dark:' resources/js/pages` = **kosong**.
  - `resources/js/lib/` bebas `dark:` kecuali **9 baris literal guard** di `__tests__/` (lihat Verifikasi).
  - `resources/js/lib/ariaInvalidClass.ts:2,5` kini `aria-invalid:border-destructive` dan `aria-invalid:ring-destructive/20` (tanpa varian gelap).
  - `resources/js/lib/fieldInvalidClass.ts:1-2` = `'border-destructive/70 bg-red-50 focus-visible:border-destructive focus-visible:ring-destructive/20'` (tanpa `dark:`).
  - `resources/js/lib/__tests__/eventShowUi.test.ts` — 3 string harapan tanpa `dark:` + tes guard `tidak lagi memuat kelas dark:` (4 assertion).
  - `resources/js/lib/__tests__/ariaInvalidClass.test.ts` — ditulis ulang: 3 tes, termasuk guard `not.toContain('dark:')`.
  - `resources/js/lib/__tests__/fieldInvalidClass.test.ts:12` — guard `expect(invalidClass).not.toContain('dark:')`.
- Jira: DFORM-49.

## Keputusan & deviasi

| # | Keputusan / deviasi | Alasan & bukti |
|---|---|---|
| 1 | **Gerbang mati dipertahankan.** `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` tinggal di `app.css:28` + komentar 4 baris; yang dihapus adalah blok token gelapnya. | Tailwind v4 `dark:` default media-based (`prefers-color-scheme`). Menghapus baris itu membuat **6 kelas `dark:` di `components/ui/**`** hidup untuk pengguna OS dark. Dipin oleh `resources/css/__tests__/darkModeGate.test.ts`. Terverifikasi di tree. |
| 2 | **Guard test pindah** dari `resources/js/lib/__tests__/` ke `resources/css/__tests__/`. | `tsconfig.json` skop frontend `types: ["vite/client"]` (tanpa tipe Node) → `import { readFileSync } from 'node:fs'` tak lolos typecheck; Vitest men-stub impor `.css` sehingga `?raw` = string kosong → assertion negatif **lulus palsu**. Solusi: test sisi-Node di luar `resources/js/**` + 1 tes "membaca sumber yang benar" sebagai penjaga anti-lulus-palsu. Terverifikasi: `tsconfig.json:12` & isi test. |
| 3 | **A1/A2 disempurnakan (kriteria "grep kosong" tidak harfiah).** Kriteria yang dipakai: `grep -rn 'dark:' resources/js --exclude-dir=ui --exclude='*.test.ts'` = 0; `grep -rn 'data-theme' resources/js --exclude='*.test.ts'` = 0. | Guard test **wajib menulis literal** `'dark:'`/`data-theme` untuk meng-assert ketiadaannya, jadi grep mentah tak mungkin nol. Sisa `data-theme` hanya di `app.css` (komentar gerbang + baris gerbang). Terverifikasi di tree. |
| 4 | **Jumlah token nyata 63**, bukan 69 seperti di judul goal plan; Task 4 = **36**, bukan 33. | 63 = 2 (dua chart, Task 1) + 25 (components, Task 3) + 36 (pages/lib/tests, Task 4). Plan sempat salah hitung 14+16+6=36 → ditulis 33; laporan lane memakai angka aktual **36**. |
| 5 | **Sinyal TDD Task 1 muncul di `npm run typecheck`, bukan vitest.** | 4× `TS2554 "Expected 1 arguments, but got 0"` — esbuild membuang tipe sehingga `chartThemeTokens(undefined)` tetap memakai cabang terang dan vitest tetap hijau. Dilaporkan apa adanya, **tidak** diklaim merah di vitest. |
| 6 | **Celah daftar file plan ditutup.** `resources/js/hooks/index.ts` ikut diubah (cabut `export * from './useChartTheme'`). | Tanpa cabut ekspor, `typecheck` gagal `TS2307` (modul sudah dihapus). File ini tidak ada di daftar file Task 1 plan. Terverifikasi: barrel tidak lagi memuat `useChartTheme`. |
| 7 | **Commit sebagian (partial staging) `FieldEditor.vue`.** Commit Task 3 hanya membawa hunk kelas `dark:` milik tiket ini (via `git apply --cached` patch tersaring). | File itu memuat kerja sesi agent paralel (migrasi `updateMeta(…, unknown)` → `TFormFieldMetadataValue`) yang belum di-commit. Kerja paralel **tidak** disapu dan tetap di worktree. |
| 8 | **`npm run build` host gagal karena environment; verifikasi build di container.** | `php` tidak terpasang di host, sedangkan plugin `@laravel/vite-plugin-wayfinder` memanggil `php artisan wayfinder:generate`. Build dijalankan di container podman `d_form_app` (node v24 + php tersedia). |
| 9 | **`ui/**` tidak disentuh** (non-goal). 6 kelas `dark:` di sana dibiarkan **inert**. | Aturan AGENTS.md melarang mengubah `resources/js/components/ui/**`. Terverifikasi: `grep 'dark:' resources/js/components/ui` = 6; commit DFORM-49 tidak menyentuh `ui/**` (klaim dari brief — `git show` tak tersedia untuk penulis). |

## Verifikasi

> **Catatan kejujuran: penulis dokumen ini tidak punya shell**, jadi tidak bisa menjalankan `npx vitest run`, `npm run typecheck`, `npx eslint`, `npx prettier`, `npm run build`, atau `git show --stat`. Semua angka suite/build bertanda **"dari brief"**. Yang **sudah diverifikasi langsung ke tree**: `chartTheme.ts`, `ariaInvalidClass.ts`, `fieldInvalidClass.ts`, guard test (`resources/css/__tests__/darkModeGate.test.ts`, `ariaInvalidClass.test.ts`, `fieldInvalidClass.test.ts`, `eventShowUi.test.ts`), `app.css`, `app.blade.php`, `EventDashboardForm.vue`, `hooks/index.ts`, `tsconfig.json`, dan hitungan grep. SHA/waktu commit dari reflog `.git/logs/HEAD`; HEAD dari `.git/refs/heads/main` (`73c43a8` saat difinalkan). Angka suite/typecheck/build di bawah **diukur orchestrator** (pemilik validasi), bukan oleh penulis dokumen.

- **Baseline (dari brief)**: `9f8e373` — **62 file / 404 tes hijau**. (Epoch reflog `9f8e373`: 20:28 WIB.)
- **Suite setelah tiket**: **63 file / 420 tes hijau**, `typecheck` **exit 0 / 0 error** (diukur orchestrator di HEAD `73c43a8`; tree juga memuat tambahan test DFORM-46 sesi paralel `qrScanPayloadTolerance.test.ts`, jadi angka ini **bukan** pembanding murni baseline).
- **Terverifikasi di tree — grep acceptance**:
  - `grep -rn 'dark:' resources/js --exclude-dir=ui --exclude='*.test.ts'` = **0** (tidak ada kecocokan).
  - `grep -rn 'data-theme' resources/js --exclude='*.test.ts'` = **0**; `data-theme` hanya di `resources/css/__tests__/darkModeGate.test.ts:28,32` (literal guard) dan `resources/css/app.css:24,28` (komentar gerbang + baris gerbang).
  - `grep -rn 'isDark|useChartTheme|_DARK' resources` = **0**.
  - `components/ui/**` = **6** kelas `dark:` (`button/index.ts:24,26`; `input-group/InputGroup.vue:29`; `input/Input.vue:36`; `input-group/InputGroupTextarea.vue:16`; `input-group/InputGroupInput.vue:16`).
  - Literal `dark:` di guard test JS = **9 baris** (`ariaInvalidClass.test.ts:17-19`, `fieldInvalidClass.test.ts:12`, `eventShowUi.test.ts:17-21`).
- **Terverifikasi di tree — kontrak**:
  - `app.css:24-28` — komentar gerbang + `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`; tanpa `[data-theme='dark']`.
  - `app.blade.php:7` — `name="color-scheme" content="light"`.
  - `chartTheme.ts:59` — `chartThemeTokens(): IChartThemeTokens` tanpa parameter; `:34-39` `IChartThemeTokens` utuh; tanpa konstanta `*_DARK`.
  - `hooks/index.ts` — tanpa `useChartTheme`; `hooks/useChartTheme.ts` & `hooks/__tests__/use-chart-theme.test.ts` **tidak ada**.
  - `EventDashboardForm.vue:386-388` — hanya aturan terang.
- **Diverifikasi orchestrator di HEAD `73c43a8`**: `417571a` = 7 file/2 dihapus; `6691d1a` = 11 file/25 token; `58afebd` = 11 file/36 token; `git show --stat` pada 6 commit DFORM-49; `resources/js/components/ui` **tak tersentuh** commit DFORM-49; `npm run typecheck` exit 0; `npx eslint` exit 0 (1 warning bukan-error: `resources/css/app.css` diabaikan eslint karena tak ada konfigurasi yang cocok); `prettier --check` bersih pada 30 file yang diubah; `npm run build` sukses di container podman `d_form_app` (CSS 228,61 kB / JS 3,35 MB, `✓ built in 23.82s`); guard `darkModeGate.test.ts` 4 test hijau.
- **Jumlah file test di tree** (dihitung penulis via glob, HEAD `014dc66`): **63 file** `*.test.ts`/`*.spec.ts` — termasuk tambahan DFORM-46 paralel, jadi **bukan** pembanding baseline.
- **Status ticket**: Jira DFORM-49 **In Progress** saat dokumen ini disusun; transisi ke **In Review** dilakukan setelah acceptance A1–A9 diverifikasi (A1/A2 versi yang disempurnakan — lihat Keputusan #3).
- **Sumber kebenaran akhir**: diff Git + status Jira DFORM-49.

## Catatan untuk tim

- **Fitur benar-benar hilang, bukan disembunyikan.** Tidak ada atribut/class/env yang bisa menghidupkan tema gelap pada file aplikasi. Satu-satunya sisa: baris gerbang `app.css:28` + 6 kelas `dark:` inert di `ui/**`.
- **Jangan hapus baris gerbang `app.css:28`.** Tanpa baris itu Tailwind v4 mengembalikan `dark:` ke `prefers-color-scheme` dan 6 kelas `ui/**` hidup untuk pengguna OS dark — regresi yang sudah dicegah; dipin `darkModeGate.test.ts`.
- **Utang sisa (eksplisit)**: 6 kelas `dark:` di `components/ui/**` dapat disapu **hanya bila kelak `ui/**` boleh diubah**; saat itu baris gerbang `app.css:28` juga bisa dituntaskan.
- **Skenario OS-dark & re-render chart ditutup dengan bukti struktural, bukan eyeball browser.** (a) CSS hasil build produksi: **0 blok `prefers-color-scheme`** dan seluruh utilitas `dark:` hanya berada di scope `[data-theme=dark]`/`[data-theme=dark] *` — dan tidak ada produsen `data-theme` di seluruh `resources/js`, `resources/views`, maupun `resources/css` (selain baris gerbang), sehingga jalur gelap tak bisa aktif dari OS dark. (b) Chart: `:key="String(isDark)"` **selalu bernilai `"false"`** karena tak ada penulis `data-theme`, jadi penghapusannya adalah no-op — re-render saat periode berganti tetap lewat perubahan prop data, bukan remount paksa. Eyeball browser manual tetap **disarankan** sebagai cek ramah pada halaman terpadat (`SecretParty`, `Dashboard/User/EventDetail`, form builder).
- `docs/superpowers/**` (spec/plan) gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-49.

## Checklist

- [x] Blok token gelap `app.css:139-182` dihapus; gerbang mati `@custom-variant dark` + komentar dipertahankan
- [x] `color-scheme` dipaksa `light` di blade; aturan gelap `EventDashboardForm.vue` hilang
- [x] `chartThemeTokens()` tanpa parameter; `useChartTheme` + testnya + ekspor barrel dihapus
- [x] 63 kelas `dark:` disapu (2 chart + 25 components + 36 pages/lib/test), cabang terang utuh
- [x] Guard test ketiadaan varian gelap (3 file test) + guard `darkModeGate.test.ts` (4 tes) + penjaga anti-lulus-palsu
- [x] `components/ui/**` tidak disentuh (6 kelas `dark:` inert)
- [x] `npm run typecheck` 0 error; suite penuh hijau **63 file / 420 tes** (diukur orchestrator, HEAD `73c43a8`)
- [x] `grep dark:` kode aplikasi (luar `ui/**`, luar test) = 0
- [x] Keputusan/deviasi tercatat jujur (gerbang mati, pindah guard test, A1/A2, 63/36 token, partial staging, build container)
- [x] Skenario OS-dark & re-render chart ditutup bukti struktural: CSS build produksi tanpa `prefers-color-scheme`; `dark:` hanya di scope `[data-theme=dark]`; `:key` chart selalu konstan sehingga penghapusannya no-op
- [ ] Eyeball browser manual OS-dark + ganti periode chart (opsional, tidak menghalangi; langkahnya ada di "Catatan untuk tim")
- [ ] Utang: 6 kelas `dark:` `ui/**` + baris gerbang `app.css:28` (hanya bila `ui/**` kelak boleh diubah)
