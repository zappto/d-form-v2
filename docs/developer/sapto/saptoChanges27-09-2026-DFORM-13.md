# Sapto Changes — 27 September 2026 (DFORM-13 M9)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-10-12.md`](./saptoChanges27-09-2026-DFORM-10-12.md) (verifikasi DFORM-10/12). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-13** — `M9: useChartTheme` (To Do → In Progress → In Review + komentar hasil). Bukan god commit: 1 commit atomik, 1 vertical slice TDD.

Catatan cakupan: observer `isDark` + callback format (`useChartTheme`, `formatChartCount`/`chartTickCallback`) SUDAH ada dari DFORM-7 (`632b293`) dan tidak diulang. Sesi ini hanya menutup sisa: token + tooltip yang masih duplikat verbatim antar dua chart.

## Ringkasan (TL;DR)

Helper murni baru `lib/chartTheme.ts`: 8 literal oklch jadi konstanta bernama + `chartThemeTokens(isDark)` dan `baseChartTooltipOptions(tokens)`; kedua chart (`CategoryChart`, `RegistrationChart`) dimigrasi — blok token/tooltip duplikat terhapus, copy per-chart (`pengajuan`/`acara`, callbacks, `displayColors`/`boxPadding`) frozen. Test pin byte-identik menjamin chart identik terang/gelap. Aturan 10–13 lulus.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 14:42 | `5fb7bdf` | zappto | DFORM-13 | feat(chart): satukan token+tooltip via `lib/chartTheme` |

Sumber waktu/SHA: `git show -s --format='%h %ad %an %s'` commit di atas.

## Per-commit

#### `5fb7bdf` feat(chart,DFORM-13): satukan token+tooltip via lib/chartTheme

- Apa: `chartTheme.ts` (konstanta `CHART_TICK_/GRID_/TOOLTIP_BG_/TOOLTIP_FG_LIGHT/DARK` + `CHART_FONT_FAMILY`/`SIZE`/`PADDING`; `chartThemeTokens(isDark)` → `{tick, grid, tooltipBg, tooltipFg}`, `baseChartTooltipOptions(tokens)` → 7 kunci dasar; tepat 7 kunci, objek segar per panggilan). Keputusan desain: tanpa param `isDark` di tooltip (warna bervariasi per tema) — param `tokens` agar resolver token satu-satunya pemilik literal oklch; tanpa shell `ChartCard` (YAGNI untuk 2 konsumen).
- File: `lib/chartTheme.ts` + `lib/__tests__/chartTheme.test.ts` (baru, 8 test: pin byte-identik terang/gelap, komposisi rantai, non-regresi) + `CategoryChart.vue` + `RegistrationChart.vue` (masing-masing −20/+~12: blok duplikat → helper; scales pakai `chartTokens.tick/grid`).
- Test: vitest 3 files 24/24 (8 baru + 12 format + 4 hook).
- Aturan 10–13: fungsi tunggal, nol literal warna di jalur tooltip, nama domain-spesifik, doc 1–2 baris per exported. Hook, `format.ts`, chart lain tidak disentuh.
- Jira: DFORM-13.

## Verifikasi

- `npx vitest run chartTheme.test.ts + use-chart-theme.test.ts + format.test.ts`: 24/24 passed (dijalankan ulang orchestrator).
- `grep` literal token/tooltip lama: nihil duplikat antar-chart (sisa oklch di kedua file hanya palet dataset per-chart yang memang unik; `pointHoverBorderColor` di RegistrationChart:48 di luar scope blok, dibiarkan agar palet byte-identik).
- `git log --oneline`: `5fb7bdf` terkonfirmasi; `Makefile`, `useGlobalQrScanPage.ts`, `useQrCamera/useQrFeed` + test, `UserSeeder.php` milik slice paralel, tidak ikut ter-commit. Tanpa push.

## Catatan untuk tim

- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-13.
