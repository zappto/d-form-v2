# Sapto Changes — 27 September 2026 (DFORM-7 M3)

Lanjutan dari [`saptoChanges27-09-2026.md`](./saptoChanges27-09-2026.md) (god-doc 1–27 September, 678 baris). File ini memakai pola yang benar ke depan: **satu tanggal, per-commit, tiap baris tertaut ke Issue** agar mudah di-track saat ada issue. Ticket Jira: **DFORM-7** — `M3: useBannerFilePicker + useObjectUrl + useChartTheme (D3, D8)` (status: In Review + komentar hasil). Bukan god commit: 3 commit atomik sesuai slice TDD.

## Ringkasan (TL;DR)

Trio banner picker disatukan ke `useBannerFilePicker` di atas `useObjectUrl` (revoke aman khusus `blob:` saat ganti/clear/unmount), tema chart disatukan ke `useChartTheme` (observer `data-theme`, disconnect saat unmount) plus `formatChartCount`/`chartTickCallback` di `lib/format.ts`. Tiga form banner dimigrasi termasuk menutup kebocoran `EventDashboardForm`; dua chart dimigrasi dengan palet/copy/tooltip identik. Aturan 10–13 dipatuhi.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 14:15 | `2a9a61d` | zappto | DFORM-7 | feat(hooks): `useObjectUrl` + lifecycle revoke aman |
| 14:15 | `530eaba` | zappto | DFORM-7 | feat(banner): `useBannerFilePicker` + migrasi Create/Edit/EventDashboardForm tutup bocor |
| 14:15 | `632b293` | zappto | DFORM-7 | feat(chart): `useChartTheme` + format chart + migrasi 2 chart |

Sumber waktu/SHA: `git show -s --format='%h %ad %an %s'` ketiga commit di atas.

## Per-commit

#### `2a9a61d` feat(hooks,DFORM-7): useObjectUrl + lifecycle revoke aman

- Apa: hook baru `resources/js/hooks/useObjectUrl.ts` (47 baris) — kelola satu object URL: `createFromFile` revoke dulu agar tak bocor, `clear` + `onBeforeUnmount` revoke, non-`blob:` tidak direvoke.
- File: `useObjectUrl.ts` + `__tests__/use-object-url.test.ts` (112 baris, 5 test: ganti/clear/unmount revoke, non-blob aman).
- Test: bagian dari vitest 4 files 25/25 passed.
- Aturan 10–13: satu tanggung jawab (satu URL), softcode `BLOB_URL_PREFIX`, nama readable, doc 1–2 baris per exported.
- Jira: DFORM-7.

#### `530eaba` feat(banner,DFORM-7): useBannerFilePicker + migrasi tutup bocor

- Apa: hook baru `resources/js/hooks/useBannerFilePicker.ts` (80 baris, `{initialUrl}`) di atas `useObjectUrl`; migrasi `Periods/Create.vue`, `Periods/Edit.vue` (initial banner tersimpan), `EventDashboardForm.vue` — menutup bocor lama (`createObjectURL` tanpa revoke) dan `clear` kembali ke URL tersimpan; template tak berubah.
- File: `useBannerFilePicker.ts` + `__tests__/use-banner-file-picker.test.ts` (139 baris, 5 test) + 3 `.vue` di atas (masing-masing −41/+~28 baris duplikat terhapus).
- Test: bagian dari vitest 25/25; `grep createObjectURL` nihil di 3 form.
- Aturan 10–13: komposisi lewat pemanggilan (bukan god function), helper kecil `isImageFile`/`asFileInput`/`extractDroppedFile` masing-masing satu tugas, doc singkat.
- Jira: DFORM-7.

#### `632b293` feat(chart,DFORM-7): useChartTheme + format + migrasi 2 chart

- Apa: hook baru `resources/js/hooks/useChartTheme.ts` (41 baris, flag `isDark` via `MutationObserver data-theme`, disconnect saat unmount) + `formatChartCount`/`chartTickCallback` di `lib/format.ts` (+11); migrasi `RegistrationChart.vue` + `CategoryChart.vue` (hapus blok observer 10 baris duplikat + variabel warna identik); palet/copy (`pengajuan`/`acara`/`Tidak ada data`) frozen.
- File: `useChartTheme.ts` + `__tests__/use-chart-theme.test.ts` (83 baris, 4 test) + `lib/format.ts` + `lib/__tests__/format.test.ts` (+18) + 2 chart.
- Test: bagian dari vitest 25/25; tooltip/tick identik terang/gelap.
- Aturan 10–13: softcode `THEME_ATTRIBUTE`/`DARK_THEME_VALUE`, doc singkat, tanpa barrel `hooks/index.ts` (jatah M4).
- Jira: DFORM-7.

## Verifikasi

- `npx vitest run` 4 files: 25/25 passed.
- `grep createObjectURL` nihil di 5 `.vue` yang disentuh; pengecualian `FormFieldAnswerDisplay.vue` (revoke se-tick) tidak disentuh.
- `npx eslint` 13 file baru/ubah bersih (dilaporkan fixer, tidak diulang).
- `git log --oneline`: `2a9a61d`, `530eaba`, `632b293` terkonfirmasi; file slice paralel lain tetap modified/untracked, tidak ikut ter-commit. Tanpa push.

## Catatan untuk tim

- Pola file ini (tabel + kolom Issue + blok per-commit) adalah pola yang diminta untuk ke depan; god-doc `saptoChanges27-09-2026.md` dibiarkan apa adanya sebagai arsip.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-7.
