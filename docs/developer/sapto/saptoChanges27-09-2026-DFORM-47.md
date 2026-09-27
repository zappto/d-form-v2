# Sapto Changes — 27 September 2026 (DFORM-47 Mx-I delta)

Penutup **delta #1** dari [`saptoChanges27-09-2026-DFORM-37.md`](./saptoChanges27-09-2026-DFORM-37.md) (Mx-I `EmptyState`). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-47** — `[recruitment] EmptyState varian dashed + ikon UserCheck untuk penugasan interviewer (delta DFORM-37)` (status: In Review). Basis: delta DFORM-37 `:66` (blok empty penugasan interviewer di `Periods/Show.vue` kehilangan kotak dashed + badge ikon `UserCheck` setelah migrasi ke `inline`). Commit F0 tiket ini: `50ed99c` (`fix(empty-state,DFORM-37): varian dashed + slot ikon pada EmptyState`, 2 file, +69/−2). Catatan kejujuran: penulis tidak punya shell, jadi urutan/parent commit tidak diverifikasi ulang (lihat bagian Verifikasi).

Ticket ini **tidak mengubah DFORM-37**: `EmptyState` mendapat varian **baru** `dashed` di samping `panel`/`inline`, dan satu call-site (`Periods/Show.vue`) kembali memakai kotak dashed + ikon seperti sebelum migrasi. Varian `panel` dan `inline` (15+ konsumen lain) tidak tersentuh.

## Ringkasan (TL;DR)

1. DFORM-37 mendokumentasikan **delta #1** (`saptoChanges27-09-2026-DFORM-37.md:66`): blok empty penugasan interviewer di `Periods/Show.vue` dimigrasikan ke varian `inline`, sehingga **kotak dashed + badge ikon `UserCheck` hilang**, judul `text-sm font-medium` → `text-sm text-muted-foreground`, deskripsi `text-xs leading-relaxed max-w-sm` → `text-sm mt-1`, sementara padding `px-4 py-8` tetap di pembungkus. Delta itu dibiarkan terbuka di DFORM-37.
2. **Keputusan user**: pulihkan lewat **varian baru di `EmptyState`** (opsi A), **bukan** markup manual di call-site; test disertakan; dibuka sebagai **tiket baru DFORM-47**.
3. `EmptyState` kini `variant?: 'panel' | 'inline' | 'dashed'` (default `panel`). `dashed` dirender `v-else-if`; `inline` tetap `v-else` → **non-breaking** untuk seluruh konsumen lama.
4. Slot opsional **`icon`** (named slot) dirender sebagai badge `size-10` di dalam kotak dashed, **hanya** bila `$slots.icon` ada; copy user-visible tidak berubah.
5. Call-site `Periods/Show.vue` (sekitar `:1005-1014`) memakai `variant="dashed"` + `<template #icon><UserCheck /></template>`. Wrapper lama `<div v-else class="px-4 py-8">` **dihapus**; padding pindah ke dalam varian (deviasi sadar, lihat Keputusan).
6. **Anomali commit (dicatat jujur)**: perubahan call-site **tidak** berada di commit DFORM-47 (`50ed99c`), melainkan terbawa commit `2d2e6dd` milik ticket **DFORM-46** dari sesi agent paralel. Detail di bagian Anomali commit.
7. Verifikasi: `vitest run` **58 file / 389 tes hijau** (baseline 386 + 3 tes baru), `eslint` exit 0, `prettier --check` bersih, `npm run typecheck` exit 0. **Belum di-eyeball di browser.**

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `50ed99c` | zappto | DFORM-47 | fix(empty-state,DFORM-37): varian `dashed` + slot ikon pada `EmptyState` |

Waktu commit tidak dicatat di brief; kolom Author diisi `zappto` (pemilik seri) dan **belum diverifikasi ulang tanpa shell**. Pesan commit menyebut `DFORM-37`, bukan `DFORM-47`, karena ini **delta** dari tiket itu (lihat Keputusan).

> **Anomali**: baris call-site (`Periods/Show.vue`) **tidak** ada di commit `50ed99c`; ia mendarat di `2d2e6dd` (`refactor(components,DFORM-46): prefix I/T pada tipe slice components (aturan 1)`) milik sesi paralel. Rincian di bagian Anomali commit.

## Per-commit

#### `50ed99c` fix(empty-state,DFORM-37): varian dashed + slot ikon pada EmptyState

- Apa: `resources/js/components/modules/dashboard/EmptyState.vue` mendapat varian ketiga pada union: `variant?: 'panel' | 'inline' | 'dashed'` (default `panel`). Blok `dashed` dirender `v-else-if="variant === 'dashed'"`; blok `inline` tetap `v-else` — jadi **15+ konsumen `panel`/`inline` tidak berubah** (non-breaking).
- Markup varian `dashed` (diverifikasi langsung ke tree): container `flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-8 text-center`; badge ikon `<span v-if="$slots.icon" aria-hidden="true" class="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5"><slot name="icon" /></span>`; judul `<p class="text-sm font-medium">`; deskripsi `<p v-if="description" class="max-w-sm text-xs leading-relaxed text-muted-foreground">`; slot default (CTA) dibungkus `<div v-if="$slots.default">`. Tanpa lottie, tanpa `app-surface`.
- API ikon dipilih sebagai **named slot** (bukan prop komponen) agar konsisten dengan kontrak slot `EmptyState` yang sudah ada dan nol risiko bagi konsumen lain.
- Unit test: `resources/js/components/modules/dashboard/__tests__/empty-state.test.ts` bertambah 3 tes (menjadi **7 tes**): (a) mode `dashed` — border/padding/ikon-via-slot/tipografi; (b) tanpa slot ikon tidak merender badge; (c) varian lama tetap utuh (`panel` tetap `app-surface`, `inline` tanpa border/dashed). Diverifikasi langsung: file memang memuat describe `EmptyState — mode dashed (DFORM-37 Mx-I)`.
- File (2, +69/−2).
- Jira: DFORM-47 (pesan commit menulis `DFORM-37`).

#### `2d2e6dd` (anomali) — call-site mendarat di commit DFORM-46

- Perubahan call-site `resources/js/pages/Dashboard/Recruitment/Periods/Show.vue` (Diverifikasi langsung di tree, sekitar `:1005-1014`):
  - `<EmptyState v-else variant="dashed" title="Belum ada interviewer yang ditugaskan." description="Pilih interviewer dan divisi di atas untuk menugaskan.">` dengan `<template #icon><UserCheck /></template>`.
  - Wrapper lama `<div v-else class="px-4 py-8">` **dihapus**; padding `px-4 py-8` kini dimiliki varian `dashed`.
- **Kenapa di commit lain**: file itu ter-`git add` ulang oleh sesi agent paralel (DFORM-46, prefix `I`/`T` pada tipe slice `components`) setelah desainer menulis perubahan ini, sehingga ikut tersapu ke `2d2e6dd`. Diverifikasi lewat `git log --oneline -1 -S 'variant="dashed"' -- resources/js/pages/Dashboard/Recruitment/Periods/Show.vue` → `2d2e6dd` (dari brief, bukan verifikasi independen penulis).
- **Tidak ada konflik kode**: rename `I`/`T` dan call-site berada di area berbeda; pada commit berikutnya `6159e77` file itu juga ikut tersapu slice `pages`.
- Konsekuensi dokumentasi: jejak per-tiket DFORM-47 **tidak bersih di Git** — call-site-nya menumpang commit DFORM-46. Ini dicatat apa adanya, bukan dirapikan dengan rewrite/patch.

## Keputusan & deviasi

- **Opsi A — varian baru, bukan markup manual.** User memilih memulihkan lewat `variant="dashed"` (+ slot ikon) di `EmptyState`, bukan menulis ulang kotak dashed manual di call-site. Alasan: satu sumber presentasi empty; call-site tetap deklaratif.
- **`inline` tetap `v-else`.** Varian baru disisipkan sebagai `v-else-if`, sehingga `inline` tidak berubah perilaku dan konsumen lamanya aman. Ini memang inti penyelesaian delta DFORM-37 — DFORM-37 opsi `boxed` sempat **ditolak** user (`saptoChanges27-09-2026-DFORM-37.md:60`), dan kini disetujui sebagai `dashed`.
- **Border `border-border/70`, bukan `/80` seperti markup asli.** Dipilih karena `/70` adalah idiom dashed yang sudah mapan di repo (mis. `SessionQueueDrawer.vue`, `ApplicantDetailContent.vue`, `Recruitment/Index.vue`) dan menyatu dengan border section/Card di halaman yang sama (`Show.vue`). Ini penyimpangan visual kecil yang sadar dari markup pra-migrasi.
- **Wrapper `px-4 py-8` dihapus, padding pindah ke varian.** Deviasi sadar dari brief awal: bila wrapper dipertahankan, padding akan dobel atau teks menempel border. Struktur akhir jadi sama seperti markup asli pra-migrasi.
- **Copy tidak diubah.** Judul/deskripsi identik dengan yang dikirim DFORM-37 (`Belum ada interviewer yang ditugaskan.` / `Pilih interviewer dan divisi di atas untuk menugaskan.`).
- **Commit message scoped `DFORM-37`.** Karena pekerjaan ini adalah delta dari DFORM-37, pesan commit F0 menulis `DFORM-37`. Tiket pelacaknya tetap DFORM-47.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell**, jadi tidak bisa menjalankan `git`/`vitest`/`eslint`/`prettier`/`typecheck`. Yang **sudah diverifikasi langsung ke tree**: isi `EmptyState.vue` (union varian + slot `icon` + kelas), jumlah/isi describe `empty-state.test.ts`, call-site `Show.vue:1005-1014`, dan baris delta `saptoChanges27-09-2026-DFORM-37.md:66`. Sisanya ditandai **"dari brief"**.

- **Diverifikasi langsung (tree)**:
  - `EmptyState.vue:16` — `variant?: 'panel' | 'inline' | 'dashed'` default `panel`; blok `dashed` di `:42-58` memuat `border-dashed border-border/70`, `px-4 py-8`, badge ikon via `$slots.icon`, judul `text-sm font-medium`, deskripsi `max-w-sm text-xs leading-relaxed text-muted-foreground`; blok `inline` (`v-else`, `:60-66`) tidak berubah.
  - `empty-state.test.ts` — memuat describe `EmptyState — mode dashed (DFORM-37 Mx-I)` dengan 3 tes (7 tes total di file itu).
  - `Periods/Show.vue:1005-1014` — call-site `variant="dashed"` + `#icon UserCheck`; wrapper `div` lama tidak ada lagi di sana.
  - `saptoChanges27-09-2026-DFORM-37.md:66` — Delta #1 sesuai deskripsi.
- **Dari brief (belum diverifikasi independen)**: commit F0 `50ed99c` (2 file, +69/−2) lolos hook gate lokal js/css **tanpa bypass**; `npx vitest run` → **58 file / 389 tes hijau** (baseline 386 + 3 tes baru); `npx eslint` pada 3 file → exit 0 tanpa warning; `npx prettier --check` pada 3 file → *"All matched files use Prettier code style!"* (`prettier --write` hanya pada file yang disentuh, hasil *"unchanged"*); `npm run typecheck` pada HEAD `6159e77` → exit 0, 0 error; anomali commit call-site `2d2e6dd` diverifikasi lewat `git log -S`.
- **Belum dilakukan**: **delta visual belum di-eyeball di browser** (warna border `/70`, jarak ikon–teks, padding dalam Card). jsdom tidak punya layout engine, jadi tes hanya menjamin kelas/markup, bukan tampilan.
- **Status ticket**: Jira DFORM-47 **In Review** (satu komentar spec/implementasi dilampirkan ke issue).
- **Sumber kebenaran akhir**: diff Git + status Jira DFORM-47.

## Checklist

- [x] Varian `dashed` ditambahkan tanpa mengubah `panel`/`inline`
- [x] Slot `icon` opsional (badge hanya dirender bila slot ada)
- [x] Call-site `Periods/Show.vue` kembali ke kotak dashed + `UserCheck`
- [x] Copy user-visible tidak berubah
- [x] 3 tes baru (mode dashed + regresi `panel`/`inline`); suite vitest hijau
- [x] `eslint` / `prettier --check` / `npm run typecheck` bersih
- [ ] Eyeball di browser (border `/70`, spacing ikon, padding dalam Card)
- [ ] Jejak commit call-site dirapikan bila ingin bersih per-tiket (saat ini menumpang `2d2e6dd` DFORM-46)
