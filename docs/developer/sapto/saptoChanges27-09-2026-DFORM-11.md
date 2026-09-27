# Sapto Changes — 27 September 2026 (DFORM-11 M7)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-7.md`](./saptoChanges27-09-2026-DFORM-7.md) (DFORM-7 M3). Pola yang sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue** agar mudah di-track saat ada issue. Ticket Jira: **DFORM-11** — `M7: lib/format.ts + unifikasi locale` (status: In Progress → In Review + komentar hasil). Bukan god commit: 2 commit atomik sesuai slice TDD.

Catatan cakupan: `formatBytes`/`initialsOf` sudah tersentralisasi (tidak ada duplikat inline yang valid — varian `d.code.slice(0,2)` adalah division-code, bukan inisial orang, dan sengaja tidak digabung). `lib/format.ts` tidak diubah (sudah kanonis 11 exports id-ID).

## Ringkasan (TL;DR)

Lima situs `padStart(2,'0')` inline dimigrasi ke `#${padQueueNumber(x)}` dengan kontrak helper-menang (`#-` untuk null, dipin di test baru); drift locale dibetulkan — `dummyData` en-US didelegasikan ke formatter kanonis id-ID, `EventReportingFocusPanel` `undefined` → `formatSubmissionDateTime`, `EventDetail` + `PulseCard` locale-less → `formatCountNumber`. Aturan 10–13 dipatuhi.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 14:27 | `8f71663` | zappto | DFORM-11 | feat(format): unifikasi `padQueueNumber` 5 situs + pin kontrak |
| 14:27 | `e4049e5` | zappto | DFORM-11 | fix(locale): konsisten id-ID, hapus drift en-US/undefined |

Sumber waktu/SHA: `git show -s --format='%h %ad %an %s'` kedua commit di atas.

## Per-commit

#### `8f71663` feat(format,DFORM-11): unifikasi padQueueNumber 5 situs + pin kontrak

- Apa: migrasi 5 situs inline `#${String(x).padStart(2,'0')}` ke `#${padQueueNumber(x)}`: `QueueDisplay.vue:68`, `Queue/Show.vue:223,247,272`, `MyInterviews/Show.vue:505`, `MyInterviews/Index.vue:511`, `SessionQueueDrawer.vue:54-55`.
- Kontrak: `QueueDisplay` lama pakai `?? 0` → `#00` untuk null; helper return `-` → kini `#-`. Perilaku helper-menang dipin di test baru (`'#-'` bukan `'#00'`), `MyInterviews/Index` pertahankan guard null→`''` di call-site lalu delegasi.
- File: 5 `.vue` di atas + `lib/__tests__/format.test.ts` (+9 baris describe pin cap antrean).
- Test: bagian dari vitest `format.test.ts` 12/12 passed.
- Aturan 10–13: tanpa ubah helper (komposisi lewat pemanggilan), nama domain-spesifik dipertahankan, doc 1 baris per handler yang disentuh.
- Jira: DFORM-11.

#### `e4049e5` fix(locale,DFORM-11): konsisten id-ID, hapus drift en-US/undefined

- Apa: `dummyData.ts:357-363` en-US → delegasi `formatDisplayDate`/`formatDisplayDateTime` (nol konsumen, risiko nol); `EventReportingFocusPanel.vue:47-51` hapus `formatDt` lokal (`DateTimeFormat undefined`) → `formatSubmissionDateTime` (output identik medium+short); `EventDetail.vue:304,381-382` + `EventShowRegistrationPulseCard.vue:51,53,55` `toLocaleString()` tanpa locale → `formatCountNumber`.
- File: 4 file di atas, tanpa ubah helper.
- Test: `format.test.ts` tetap 12/12; `grep en-US` dan `DateTimeFormat(undefined` nihil di file yang disentuh; `grep toLocaleString()` locale-less nihil di `EventDetail`/`PulseCard`.
- Aturan 10–13: satu sumber kebenaran locale (`lib/format.ts`), tanpa duplikasi baru, doc singkat.
- Jira: DFORM-11.

## Verifikasi

- `npx vitest run resources/js/lib/__tests__/format.test.ts`: 12/12 passed (11 existing + 1 pin baru).
- `grep padStart(2` nihil di 5 situs Slice A (sisa hanya di `lib/format.ts` kanonis dan komponen kalender/shadcn di luar scope).
- `git log --oneline`: `8f71663`, `e4049e5` terkonfirmasi; `Makefile` (modifikasi) dan `UserSeeder.php` (untracked) adalah pre-existing slice paralel, tidak ikut ter-commit. Tanpa push.

## Catatan untuk tim

- Penamaan spec `formatQueueStamp` vs implementasi `padQueueNumber`: helper yang menang (punya test + konsumen); spec yang perlu diamend, bukan rename.
- Pola file ini sama dengan DFORM-7; god-doc `saptoChanges27-09-2026.md` tetap arsip.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-11.
