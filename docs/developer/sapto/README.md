# Dokumentasi developer — Sapto

Folder ini berisi catatan perubahan dan desain yang dikerjakan oleh **Sapto** pada branch/sesi pengembangan dashboard & UI terkait.

## Isi folder

| File | Deskripsi |
|------|-----------|
| [saptoChanges27-09-2026.md](./saptoChanges27-09-2026.md) | OpRec end-to-end, dashboard topbar, builder & autosave, global scan, redesain periode recruitment, migrasi hooks (god-doc 1–27 Sept, arsip) |
| [saptoChanges27-09-2026-DFORM-7.md](./saptoChanges27-09-2026-DFORM-7.md) | DFORM-7 M3: `useObjectUrl` + `useBannerFilePicker` + `useChartTheme` — pola per-tanggal per-commit (3 commit atomik) |
| [saptoChanges10-06-2026.md](./saptoChanges10-06-2026.md) | Bundle submissions, member dashboard, reusable routes, re-registrasi, password reset |
| [saptoChanges04-05-2026.md](./saptoChanges04-05-2026.md) | Konsolidasi M1–M4, hapus Livewire/Filament, publik event dari DB |
| [saptoChanges19-04-2026.md](./saptoChanges19-04-2026.md) | Dashboard admin, halaman event, landing navbar, data seed, Docker dev |

## Cara membaca (untuk tim)

1. Buka changelog **terbaru** (`saptoChanges27-09-2026-DFORM-7.md`) untuk perubahan terakhir.
2. Entri baru memakai tabel per-tanggal per-commit dengan kolom **Issue** — cari `DFORM-*` dulu saat ada issue.
2. Bagian **Ringkasan (TL;DR)** di setiap dokumen cocok untuk sync singkat.
3. Bagian **Checklist** di akhir dokumen bisa dipakai sebelum merge atau saat onboarding anggota baru.

## Hubungan dengan dokumen lain

- Perubahan backend terkait **`registered_count`**, validasi tanggal event, dan endpoint `registration-status` dijelaskan di [nafanChanges17-04-2026.md](../nafan/nafanChanges17-04-2026.md). Desain dashboard Sapto memanfaatkan data tersebut (misalnya statistik & list event).
- Dokumen instalasi dan struktur proyek tetap mengacu ke root `docs/` (misalnya `01-installation.md`, `02-directory-structure.md`).

Jika ada pertanyaan spesifik tentang komponen UI atau alur dashboard, rujuk ke file changelog di atas atau tanyakan langsung di channel tim.
