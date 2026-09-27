# Sapto Changes — 27 September 2026 (DFORM-41)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-40.md`](./saptoChanges27-09-2026-DFORM-40.md) (DFORM-40). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-41** — `CI: gate typecheck (vue-tsc --noEmit) + hapus ignoreDeprecations "6.0" yang tak valid di TS 5.9.3` (status: In Progress → In Review oleh orchestrator). Task top-level, board **DFORM**, Sprint 4. **Bukan god commit**: 2 commit atomik + 1 commit dokumen.

## Ringkasan (TL;DR)

DFORM-40 sudah menurunkan 278 error tipe ke 0, tetapi **tidak ada satu pun gate** yang menjalankannya: `package.json` tidak punya script `typecheck` dan CI hanya punya `code_formatting.yml` (Pint + Prettier, tanpa job frontend). Ticket ini memasang gate-nya:

1. **Script + dependency**: `"typecheck": "vue-tsc --noEmit"`, dan `vue-tsc` **di-pin exact `3.3.11`** sebagai devDependency — sebelumnya `vue-tsc` **sama sekali bukan dependency**; semua pemanggilan `npx vue-tsc` sepanjang sesi menarik versi transient dari registry.
2. **Workflow CI** `.github/workflows/frontend_typecheck.yml` (`npm ci` + `npm run typecheck`, pada push/PR ke `dev`/`temp`).
3. **Temuan akar di tengah jalan**: `tsconfig.json` memuat `"ignoreDeprecations": "6.0"`, yang **hanya valid di TypeScript ≥ 6**, sementara `package.json` mem-pin `typescript ^5.9.3`. Jadi config tipe repo **ditolak toolchain-nya sendiri** (`error TS5103`), dan tak ada yang tahu karena tak ada gate. Baris itu dihapus → `vue-tsc --noEmit` **exit 0, 0 error, tanpa peringatan deprecation** di TS 5.9.3.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 16:38 | `1ac39a1` | zappto | DFORM-41 | fix(types,DFORM-41): hapus `ignoreDeprecations "6.0"` yang tak valid di TS 5.9.3 |
| 16:38 | `133dfa2` | zappto | DFORM-41 | chore(ci,DFORM-41): gate `typecheck` (`vue-tsc` 3.3.11) + script npm + workflow CI |

Sumber waktu/SHA: `git log --pretty='%h|%ad'`.

## Per-commit

#### `1ac39a1` fix(types,DFORM-41): hapus ignoreDeprecations "6.0" yang tak valid di TS 5.9.3

- Apa: hapus satu baris `"ignoreDeprecations": "6.0"` di `tsconfig.json` (−1 baris). Nilai `"6.0"` hanya dikenal TypeScript ≥ 6; dengan `typescript ^5.9.3` (terpasang 5.9.3) TypeScript menolak config-nya sendiri: `tsconfig.json(3,31): error TS5103: Invalid value for '--ignoreDeprecations'`.
- Bukti: baris ini berasal dari commit lama `3ffb301` dan **tidak dibutuhkan** — setelah dihapus, `vue-tsc --noEmit` (TS 5.9.3) exit 0, 0 error, dan **tidak ada** peringatan deprecation yang muncul, jadi menghapusnya tidak menyembunyikan apa pun (kebalikan dari menambah suppression).
- Jira: DFORM-41.

#### `133dfa2` chore(ci,DFORM-41): gate typecheck (vue-tsc 3.3.11) + script npm + workflow CI

- Apa: `package.json` — tambah script `"typecheck": "vue-tsc --noEmit"` dan devDependency `"vue-tsc": "3.3.11"` (**pin exact**). `package-lock.json` +95/−4 (pohon `vue-tsc`: `@volar/language-core|source-map|typescript`, `@vue/language-core`, `alien-signals`, `muggle-string`). Workflow baru `.github/workflows/frontend_typecheck.yml` (33 baris): job `typecheck`, `actions/checkout@v4` → `actions/setup-node@v4` (Node 20, `cache: npm`) → `npm ci` → `npm run typecheck`, dipicu `push`/`pull_request` ke `dev`/`temp` (paritas dengan `code_formatting.yml`).
- Kenapa **pin exact**, bukan `^`: output type-checker harus reproducible antara mesin lokal dan CI; rentang caret bisa memunculkan error baru tanpa perubahan kode dan memblokir PR tiba-tiba.
- Kenapa workflow **terpisah**, bukan menambah step ke `code_formatting.yml`: workflow lama bertema formatting (Pint/Prettier, keduanya `continue-on-error: true`); gate tipe justru **harus** mem-fail build.
- Jira: DFORM-41.

## Keputusan yang dicatat

- **Tidak menaikkan TypeScript.** Alternatifnya adalah menaikkan `typescript` ke 6.x agar cocok dengan `ignoreDeprecations "6.0"`. Ditolak: faktanya **baris itulah yang tidak perlu**, dan menghapusnya membuat gate lulus 0 error di TS 5.9.3 (yang sudah di-pin) — menaikkan TypeScript berarti churn dependency (build/editor/tooling) tanpa kebutuhan nyata.
- **Gate diletakkan di CI, bukan hanya script.** Script saja tidak mencegah regresi; job CI yang mem-fail build-lah yang menjadi gate.
- **Cakupan sengaja minimal.** Job ini hanya menjalankan `typecheck`. `lint` dan `test` belum dijadikan gate CI (bisa ditambahkan menyusul) supaya perubahan ini tetap satu concern.
- **Gate diuji dulu, baru di-commit.** `npm run typecheck` dijalankan sebelum commit: exit 0 / 0 error — gate tidak "hijau karena tidak ada yang jalan".

## Verifikasi

> Catatan kejujuran: perintah verifikasi dieksekusi oleh orchestrator, bukan penulis dokumen ini.

- `npm run typecheck` → **exit 0**, **0 baris `error TS`** (dijalankan setelah `tsconfig.json` dibetulkan).
- Tanpa perbaikan tsconfig, gate **gagal** dengan `tsconfig.json(3,31): error TS5103` — dibuktikan sebelum, bukan diasumsikan.
- Reproduksi terisolasi: dengan `tsconfig.json` sementara tanpa baris tersebut dan **TypeScript 5.9.3 milik proyek** → exit 0, 0 error, tanpa peringatan deprecation (file tsconfig dipulihkan persis setelah uji; `git diff -- tsconfig.json` kosong saat itu).
- `npm run lint` → bersih. Full suite `npx vitest run` → **50 file / 330 test** passed.
- Workflow divalidasi sebagai YAML (`jobs: ['typecheck']`, `on: ['push','pull_request']`) sebelum commit.
- Scope commit dipisah: `tsconfig.json` pada commit tersendiri; `package.json` + `package-lock.json` + workflow pada commit kedua; file pekerja paralel (`Makefile`, `database/seeders/UserSeeder.php`, `BannerPickerField*`, `FormBuilderBannerBlock.vue`) **tidak ikut**.

## Dampak UI

**Nol.** Ticket ini hanya menyentuh `tsconfig.json`, `package.json`, `package-lock.json`, dan `.github/workflows/frontend_typecheck.yml` — tidak ada satu pun perubahan di `resources/js`. Tidak ada perubahan tampilan, interaksi, maupun copy. (Audit dampak UI untuk perubahan tipe DFORM-40 ada di [`saptoChanges27-09-2026-DFORM-40.md`](./saptoChanges27-09-2026-DFORM-40.md) bagian "Dampak UI".)

## Catatan untuk tim

- **Koreksi catatan DFORM-40 (penting):** seluruh verifikasi DFORM-40 dijalankan lewat `npx vue-tsc`, yang menarik `vue-tsc` **beserta TypeScript 6.0.3** ke sandbox npx — bukan toolchain proyek. Setelah gate ini memakai toolchain yang benar (**vue-tsc 3.3.11 + TypeScript 5.9.3**), hasilnya tetap **0 error**, jadi bukti DFORM-40 tetap sah; yang berubah adalah alat ukurnya kini eksplisit dan reproducible. Ini juga menjelaskan kenapa `tsconfig.json` yang invalid di TS 5.9.3 tidak pernah terdeteksi.
- **Cara menjalankan gate secara lokal:** `npm run typecheck` (bukan `npx vue-tsc`, agar memakai versi yang di-pin).
- Bila `vue-tsc` dinaikkan versinya, jalankan gate secara lokal dan perbarui dokumen ini — kenaikan versi type-checker bisa memunculkan error baru tanpa perubahan kode.
- Menyusul bila diinginkan: jadikan `lint` dan `test` gate CI juga (belum termasuk di ticket ini).
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-41.
