# Sapto Changes — 27 September 2026 (DFORM-15 M11)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-14.md`](./saptoChanges27-09-2026-DFORM-14.md). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-15** — `M11: Rename utils/composables ke hooks` (status: In Progress; orchestrator memindahkan ke In Review + komentar hasil). Bukan god commit: 1 commit atomik, 2 file (+21/−1).

Catatan cakupan: inti rename `utils/composables` → `hooks` (~70 file, 18 rename murni) SUDAH dikerjakan commit `c3c3bfa` (DFORM-8/M4) dan tidak diulang. Sesi ini hanya menutup 2 sisa yang belum tersentuh: alias `composables` di `components.json` dan barrel aditif `resources/js/hooks/index.ts`.

## Ringkasan (TL;DR)

Rename mekanis `utils/composables` → `hooks` dituntaskan sebagai tugas terakhir M-series tanpa perubahan perilaku. Alias `composables` di `components.json` (semula `@/lib/composables`, path tidak ada) diperbaiki ke `@/hooks`; barrel aditif baru `resources/js/hooks/index.ts` (20 baris) menyatukan re-export seluruh hook agar entry `@/hooks` bisa dipakai. Test `hooks` + `lib` hijau identik baseline vs sesudah. Aturan 10–13 dipatuhi.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 14:48 | `fa546a6` | zappto | DFORM-15 | chore(hooks): alias `composables` ke `@/hooks` + barrel `hooks/index.ts` |

Sumber waktu/SHA: konteks terverifikasi sesi (`git log`/reflog) — `fa546a6` @ 27 September 2026, 14:48 WIB.

## Per-commit

#### `fa546a6` chore(hooks,DFORM-15): alias composables ke hooks + barrel aditif

- Apa: `components.json` alias `composables` diperbaiki dari `"@/lib/composables"` (path tidak ada) → `"@/hooks"` (1 baris, kini di baris 18). Barrel aditif baru `resources/js/hooks/index.ts`: 20 baris — 2 baris pembuka (baris 1 doc file, baris 2 `export { default as useAuth } from './useAuth'`) + 18 baris `export *` alfabetis dari hook lain; tanpa bentrok nama/logika.
- File: `components.json` (+1/−1) + `resources/js/hooks/index.ts` (baru, 20 baris). Total 2 file, +21/−1.
- Test: `npx vitest run resources/js/hooks/__tests__ resources/js/lib/__tests__` identik baseline vs sesudah — 13 file, 81/81 passed.
- Aturan 10–13: rename mekanis 1:1 (aturan 11 & 13 neto tidak relevan); aturan 12 lulus (nama dipertahankan, tanpa suffix generik). Nol perubahan perilaku.
- Jira: DFORM-15.

## Verifikasi

- `npx vitest run resources/js/hooks/__tests__ resources/js/lib/__tests__`: 13 file (10 hooks + 3 lib), 81/81 passed; hasil baseline vs sesudah tidak berubah.
- `grep '@/utils/composables|@/composables'` dan definisi `use*` di luar `resources/js/hooks/`: nihil.
- `vue-tsc`: tanpa error pada barrel `resources/js/hooks/index.ts`.
- `git log --oneline`: `fa546a6` terkonfirmasi. Tanpa push.

## Catatan untuk tim

- Inti duplikat: rename `utils/composables` → `hooks` sudah dikerjakan `c3c3bfa` (DFORM-8/M4, ~70 file, 18 rename murni; lihat [`saptoChanges27-09-2026.md:302`](./saptoChanges27-09-2026.md)). DFORM-15 duplikat untuk inti tersebut; sesi ini hanya menutup 2 sisa.
- `resources/js/utils/` kini tinggal `stripHtml.ts` + `theme.js` — di luar scope rename, tidak disentuh.
- Dokumen `.md` stale yang masih menyebut `composables` tidak disentuh sesi ini: `docs/laporan.md:289,433` (menyebut alias lama di `components.json:20`; di file saat ini alias berada di baris 18), `docs/rules/front-end.md:33,72`, `docs/module/oprec/architecture.md:123`, `docs/05-m4-registration.md:229`, `docs/developer/nafan/nafanChanges24-04-2026.md:79`.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-15.
