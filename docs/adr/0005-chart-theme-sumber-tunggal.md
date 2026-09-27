# ADR-0005 — Chart theme sumber tunggal (`lib/chartTheme.ts` + `useChartTheme`)

- **Status:** Diterima
- **Tanggal:** 27 September 2026

## Konteks

Dua chart dashboard (`CategoryChart.vue`, `RegistrationChart.vue`)
mendeklarasikan token warna oklch dan blok opsi tooltip yang identik secara
verbatim, dan masing-masing memasang `MutationObserver` pada atribut
`data-theme` sendiri. Duplikasi ini membuat perubahan palet/tooltip harus
disentuh di dua tempat dan rawan drift.

## Keputusan

Jadikan satu modul sebagai satu-satunya pemilik literal tema chart:

- **`resources/js/lib/chartTheme.ts`:** 8 literal oklch menjadi konstanta
  bernama (`CHART_TICK_*`, `CHART_GRID_*`, `CHART_TOOLTIP_BG_*`,
  `CHART_TOOLTIP_FG_*`), plus font/ukuran/padding tooltip sebagai konstanta.
  Mengekspor `chartThemeTokens(isDark) → {tick, grid, tooltipBg, tooltipFg}`
  dan `baseChartTooltipOptions(tokens)` (7 kunci dasar, objek segar per
  panggilan).
- **`resources/js/hooks/useChartTheme.ts`:** flag `isDark` reaktif dari atribut
  `data-theme` `documentElement` via `MutationObserver`, `disconnect` saat
  `onBeforeUnmount`.
- **Kedua chart dimigrasi** memakai token/hook tersebut. Copy per-chart
  (`pengajuan`/`acara`, callbacks, `displayColors`/`boxPadding`) dan palet
  dataset tetap di call-site masing-masing; sengaja tanpa shell `ChartCard`
  (YAGNI untuk dua konsumen).

## Konsekuensi

- Menambah chart baru cukup memanggil `chartThemeTokens` + `baseChartTooltipOptions`
  dan `useChartTheme`; tidak ada lagi literal oklch token di jalur tooltip.
- Palet terang/gelap terkunci byte-identik oleh test anti-drift, sehingga
  perilaku visual tidak berubah oleh refactor.
- Parameter tooltip memakai `tokens` (bukan `isDark`) agar resolver token tetap
  satu-satunya pemilik literal warna.

## Bukti

- Kode: `resources/js/lib/chartTheme.ts`,
  `resources/js/hooks/useChartTheme.ts`,
  `resources/js/components/modules/dashboard/CategoryChart.vue`,
  `resources/js/components/modules/dashboard/RegistrationChart.vue`.
- Commit: `5fb7bdf` — `feat(chart,DFORM-13): satukan token+tooltip via lib/chartTheme`.
- Test: `resources/js/lib/__tests__/chartTheme.test.ts`,
  `resources/js/hooks/__tests__/use-chart-theme.test.ts`.

## Amandemen 2026-09-27 — palet gelap dihapus (DFORM-49)

Dark mode dihapus dari aplikasi, jadi jalur gelap ADR ini tidak lagi berlaku:

- `chartThemeTokens()` kini **tanpa parameter** dan selalu mengembalikan palet terang.
- `IChartThemeTokens` tetap ada sebagai kontrak token; konstanta `CHART_*_DARK` dihapus.
- `useChartTheme` + `MutationObserver` pada `data-theme` **dihapus**; `data-theme` tidak lagi
  dibaca kode mana pun.
- Jaminan yang tetap berlaku: `chartTheme.ts` satu-satunya pemilik literal oklch token chart,
  dipin byte-identik oleh `lib/__tests__/chartTheme.test.ts`.
