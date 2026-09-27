# Dokumentasi developer — Sapto

Folder ini berisi catatan perubahan dan desain yang dikerjakan oleh **Sapto** pada branch/sesi pengembangan dashboard & UI terkait.

## Isi folder

| File | Deskripsi |
|------|-----------|
| [saptoChanges27-09-2026.md](./saptoChanges27-09-2026.md) | OpRec end-to-end, dashboard topbar, builder & autosave, global scan, redesain periode recruitment, migrasi hooks (god-doc 1–27 Sept, arsip) |
| [saptoChanges27-09-2026-DFORM-7.md](./saptoChanges27-09-2026-DFORM-7.md) | DFORM-7 M3: `useObjectUrl` + `useBannerFilePicker` + `useChartTheme` — pola per-tanggal per-commit (3 commit atomik) |
| [saptoChanges27-09-2026-DFORM-11.md](./saptoChanges27-09-2026-DFORM-11.md) | DFORM-11 M7: unifikasi `padQueueNumber` + konsisten locale id-ID — pola per-tanggal per-commit (2 commit atomik) |
| [saptoChanges27-09-2026-DFORM-10-12.md](./saptoChanges27-09-2026-DFORM-10-12.md) | DFORM-10 M6 + DFORM-12 M8: verifikasi tanpa commit baru (M6 sudah, M8 duplikat DFORM-7) |
| [saptoChanges27-09-2026-DFORM-13.md](./saptoChanges27-09-2026-DFORM-13.md) | DFORM-13 M9: satukan token+tooltip chart via `lib/chartTheme` — 1 commit atomik |
| [saptoChanges27-09-2026-DFORM-14.md](./saptoChanges27-09-2026-DFORM-14.md) | DFORM-14 M10: split `useGlobalQrScanPage` → `useQrCamera` + `useQrFeed` — 1 commit atomik |
| [saptoChanges27-09-2026-DFORM-15.md](./saptoChanges27-09-2026-DFORM-15.md) | DFORM-15 M11: rename `utils/composables` → `hooks` (inti di DFORM-8) — 1 commit: alias `composables` + barrel `hooks/index.ts` |
| [saptoChanges27-09-2026-DFORM-16.md](./saptoChanges27-09-2026-DFORM-16.md) | DFORM-16 M12: evaluasi D9/D10 (filter-sync + polling) — tanpa commit kode: D9 TOLAK, D10 ADOPSI (belum dieksekusi) |
| [saptoChanges27-09-2026-DFORM-17.md](./saptoChanges27-09-2026-DFORM-17.md) | DFORM-17 M13: closeout — hapus 17 file pola lama mati + CONTEXT.md + 5 ADR; e2e wizard ditunda (4 commit atomik) |
| [saptoChanges27-09-2026-DFORM-30.md](./saptoChanges27-09-2026-DFORM-30.md) | DFORM-30 Mx-D: hapus `MiniCalendar` dummy + satu `EventCalendar` data nyata (wiring `calendarEvents` + helper `eventToCalendarArray`) — 1 commit atomik |
| [saptoChanges27-09-2026-DFORM-31.md](./saptoChanges27-09-2026-DFORM-31.md) | DFORM-31 Mx-B: status registrasi kanonik via `eventStatusUi` (5 adopsi, copy user-visible berubah) — 1 commit atomik |
| [saptoChanges27-09-2026-DFORM-32.md](./saptoChanges27-09-2026-DFORM-32.md) | DFORM-32 Mx-G: label busy aksi Tolak `Menghapus...` → `Menolak...`; spec "satu RejectApplicantDialog" dibatalkan (YAGNI, hanya 1 pemakai) — 1 commit atomik |
| [saptoChanges27-09-2026-DFORM-33.md](./saptoChanges27-09-2026-DFORM-33.md) | DFORM-33 Mx-A: satu `SearchableSelect` — F0 paritas API + test pertama, migrasi 33 tag/17 file bergelombang, hapus `simple-select` & `styled-select` (grep-zero) — 7 commit atomik |
| [saptoChanges27-09-2026-DFORM-34.md](./saptoChanges27-09-2026-DFORM-34.md) | DFORM-34 Mx-C: satu `BannerPickerField` di atas hook — 3 konsumen migrasi, `FormBuilderBannerBlock` jadi adapter tipis, `createObjectURL` nol di 4 file; deviasi sengaja batas 5 MB — 4 commit atomik |
| [saptoChanges27-09-2026-DFORM-40.md](./saptoChanges27-09-2026-DFORM-40.md) | DFORM-40: 3 test merah (duplicate Vue) + lint warning + 278→0 error `vue-tsc` dari akar tipe bersama — 7 commit atomik + dokumen |
| [saptoChanges27-09-2026-DFORM-41.md](./saptoChanges27-09-2026-DFORM-41.md) | DFORM-41: gate `typecheck` (`vue-tsc` di-pin + workflow CI) + perbaiki `ignoreDeprecations "6.0"` yang tak valid di TS 5.9.3 — 2 commit atomik + dokumen |
| [saptoChanges10-06-2026.md](./saptoChanges10-06-2026.md) | Bundle submissions, member dashboard, reusable routes, re-registrasi, password reset |
| [saptoChanges04-05-2026.md](./saptoChanges04-05-2026.md) | Konsolidasi M1–M4, hapus Livewire/Filament, publik event dari DB |
| [saptoChanges19-04-2026.md](./saptoChanges19-04-2026.md) | Dashboard admin, halaman event, landing navbar, data seed, Docker dev |

## Cara membaca (untuk tim)

1. Buka changelog **terbaru** (`saptoChanges27-09-2026-DFORM-41.md`) untuk perubahan terakhir. Catatan: DFORM-41 — gate `typecheck` (`vue-tsc` di-pin + workflow CI) sekaligus perbaikan `tsconfig.json` yang tak valid di TypeScript 5.9.3. Dokumen sebelumnya `saptoChanges27-09-2026-DFORM-40.md` (perbaikan kualitas: 3 test merah akibat duplicate Vue, lint warning, 278→0 error `vue-tsc`), `saptoChanges27-09-2026-DFORM-33.md` (Mx-A — satu `SearchableSelect`; 7 commit atomik), `saptoChanges27-09-2026-DFORM-34.md` (Mx-C — satu `BannerPickerField`; deviasi sengaja batas 5 MB), `saptoChanges27-09-2026-DFORM-32.md` (Mx-G: label busy aksi Tolak `Menolak...`), `saptoChanges27-09-2026-DFORM-31.md` (Mx-B: status registrasi kanonik via `eventStatusUi`), `saptoChanges27-09-2026-DFORM-30.md` (Mx-D: hapus `MiniCalendar` dummy + satu `EventCalendar` data nyata), dan `saptoChanges27-09-2026-DFORM-17.md` (pembersihan pola lama, `CONTEXT.md`, 5 ADR; slice e2e wizard ditunda).
2. Entri baru memakai tabel per-tanggal per-commit dengan kolom **Issue** — cari `DFORM-*` dulu saat ada issue.
3. Bagian **Ringkasan (TL;DR)** di setiap dokumen cocok untuk sync singkat.
4. Bagian **Checklist** di akhir dokumen bisa dipakai sebelum merge atau saat onboarding anggota baru.

## Hubungan dengan dokumen lain

- Perubahan backend terkait **`registered_count`**, validasi tanggal event, dan endpoint `registration-status` dijelaskan di [nafanChanges17-04-2026.md](../nafan/nafanChanges17-04-2026.md). Desain dashboard Sapto memanfaatkan data tersebut (misalnya statistik & list event).
- Dokumen instalasi dan struktur proyek tetap mengacu ke root `docs/` (misalnya `01-installation.md`, `02-directory-structure.md`).

Jika ada pertanyaan spesifik tentang komponen UI atau alur dashboard, rujuk ke file changelog di atas atau tanyakan langsung di channel tim.
