# Sapto Changes — 27 September 2026 (DFORM-17 M13)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-16.md`](./saptoChanges27-09-2026-DFORM-16.md) (DFORM-16 M12). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-17** — `M13: Closeout + e2e + domain docs` — *"Hapus pola lama tersisa, e2e wizard, tulis CONTEXT.md + ADR keputusan besar. Terima: tak ada regresi, docs lengkap."* (status: In Progress; orchestrator memindahkan ke In Review + komentar hasil). Bukan god commit: 4 commit atomik sesuai slice TDD (A cleanup, B e2e ditunda, C domain docs, D ADR).

## Ringkasan (TL;DR)

Sesi closeout M13: **17 file pola lama yang sudah mati dihapus** (stub vendor Livewire, blade lama modul/core/auth, `welcome.blade.php`, `resources/js/utils/theme.js`) setelah tiap grup di-grep 0 referensi hidup; **path `composables` stale dikoreksi** ke `resources/js/hooks` di 3 dokumen (`docs/rules/front-end.md`, `docs/module/oprec/architecture.md`, `docs/laporan.md`) plus komentar mail usang di `app/Mail/ScanTestQrMail.php` (mail views tetap hidup, tidak dihapus). Dokumentasi domain ditulis: `CONTEXT.md` di root (143 baris — domain + konvensi lintas-cutting, menaut ke ADR) dan 5 ADR keputusan besar di `docs/adr/`. Slice B (e2e wizard create) **ditunda atas keputusan user** (butuh `@playwright/test` + app berjalan). Lint PASSED; build dijalankan lewat config sementara di `/tmp/opencode` karena env sesi tidak punya `php`.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 15:18 | `7d3095d` | zappto | DFORM-17 | chore(cleanup): hapus 17 file pola lama mati (17 files, 1770 deletions) |
| 15:18 | `fc7424d` | zappto | DFORM-17 | docs(cleanup): koreksi path composables stale + komentar mail (4 files, +11/-11) |
| 15:18 | `8bab8d4` | zappto | DFORM-17 | docs(domain): CONTEXT.md ringkasan domain + konvensi lintas-cutting (1 file, +143) |
| 15:18 | `af366bb` | zappto | DFORM-17 | docs(adr): 5 ADR keputusan besar (5 files, +275) |

Sumber waktu/SHA: konteks terverifikasi sesi (`git log`/reflog) — keempat commit pada 27 September 2026, 15:18 WIB.

## Per-commit

#### `7d3095d` chore(cleanup,DFORM-17): hapus pola lama mati (stub livewire, blade lama, theme.js)

- Apa — slice A, hapus 17 file pola lama (total **1770 deletions**), dikelompokkan:
    - stub vendor Livewire: `resources/views/vendor/livewire/{bootstrap,simple-bootstrap,simple-tailwind,tailwind}.blade.php` (4).
    - blade lama modul event: `resources/views/components/module/event/show/{forms,buttons,schedules}-box.blade.php` (3).
    - core layout lama: `core/navbar/dashboard-navbar.blade.php`, `core/sidebar/dashboard-sidebar.blade.php`, `core/breadcrumb/{item,link,wrapper}.blade.php` (5).
    - auth lama: `module/auth/{banners,utility-bar}.blade.php` (2).
    - lain: `utilities/theme-toggler.blade.php`, `resources/views/welcome.blade.php`, `resources/js/utils/theme.js` (3).
- Tiap grup di-grep **0 referensi hidup** sebelum dihapus; referensi silang yang ditemukan hanya di dalam himpunan hapus sendiri.
- File: 17 file dihapus (1770 deletions).
- Jira: DFORM-17.

#### `fc7424d` docs(cleanup,DFORM-17): koreksi path composables stale + komentar mail akurat

- Apa: koreksi path `composables` lama → `resources/js/hooks` di:
    - `docs/rules/front-end.md` (baris composables lama → `resources/js/hooks`, tambah baris hooks).
    - `docs/module/oprec/architecture.md` (path composables → `resources/js/hooks`).
    - `docs/laporan.md` (koreksi path `utils/composables` → hooks; menandai bagian `components.json` usang).
    - `app/Mail/ScanTestQrMail.php` (komentar stale soal mail views diperbaiki; **mail views tetap hidup, tidak dihapus**).
- File: 4 file (+11/−11).
- Jira: DFORM-17.

#### `8bab8d4` docs(domain,DFORM-17): CONTEXT.md ringkasan domain + konvensi lintas-cutting

- Apa: `CONTEXT.md` baru di root, **143 baris** — domain (form builder dinamis, autosave/dirty-sync, recruitment/OpRec, upload/storage) + konvensi lintas-cutting (hooks di `resources/js/hooks`, format kanonis id-ID di `resources/js/lib/format.ts`, alias `@/hooks` & `@/lib`, TDD vertical slice, aturan 10–13). Menaut ke 5 ADR.
- File: `CONTEXT.md` (baru, +143).
- Jira: DFORM-17.

#### `af366bb` docs(adr,DFORM-17): 5 ADR keputusan besar (autosave, dirty-sync, storage, ordering, chart theme)

- Apa: 5 ADR baru di `docs/adr/` (format: Status **Diterima** + **27 September 2026**, Konteks/Keputusan/Konsekuensi/Bukti; tiap ADR ≥1 path kode hidup + ≥1 test):
    - `0001-endpoint-autosave-parsial.md`
    - `0002-dirty-sync-diff-snapshot.md`
    - `0003-upload-to-storage-storagejanitor.md`
    - `0004-spaced-ordering.md`
    - `0005-chart-theme-sumber-tunggal.md`
- File: 5 file (baru, +275).
- Jira: DFORM-17.

## Verifikasi

- grep ulang per kelompok hapus = **0 referensi hidup**; `grep -rnE "utils/theme|from .*theme\.js" resources/js` = **0**.
- `npm run lint` **PASSED** (1 warning pre-existing di `recruitment/ApplicantDetailContent.vue`). `npm run build` **TIDAK bisa dijalankan** di env ini (`php: command not found`; plugin wayfinder butuh shell php) — bukti alternatif: `vite build` dengan config sementara di `/tmp/opencode` (setup vue/tailwind/alias identik minus plugin wayfinder/laravel) **PASSED**, 3865 modul tertransform, 16.48s.
- `npx vitest run`: **3 test GAGAL** di `resources/js/components/core/__tests__/ConfirmationModal.test.ts` — **TERBUKTI PRE-EXISTING, bukan regresi**: dijalankan di worktree bersih pada HEAD memberi 3 kegagalan identik. Sisa suite **299/302 passed**.
- Env tidak punya `php` → test PHP/Pest (Feature/Unit) **tidak bisa dijalankan** di sesi ini.
- `docs/developer/sapto/**` tidak disentuh oleh lane kode.

## Catatan untuk tim

- **Slice B (e2e wizard create: login → step-1 → klik lanjut → assert `?step=forms&draftId=`) DITUNDA** atas keputusan user; butuh `@playwright/test` + app berjalan (`make run`). `WizardStepperTest.php` (HTTP-level) sudah ada sebagai penutup sementara.
- `docs/big-changes/` **gitignored** → rujukan aturan 10–13 di `CONTEXT.md` diberi catatan eksplisit agar tidak dangling.
- Sisa stale di luar scope (**tidak disentuh**): path composables mati masih ada di `docs/laporan-codebase.md` dan `docs/05-m4-registration.md`.
- 2 file kotor milik slice lain (`Makefile`, `database/seeders/UserSeeder.php`) sengaja **TIDAK di-commit**.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-17.
