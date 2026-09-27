# Sapto Changes — 27 September 2026 (DFORM-35 Mx-F)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-34.md`](./saptoChanges27-09-2026-DFORM-34.md) (DFORM-34 Mx-C). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-35** — `[Mx-F] Shell FormSheet di atas ui/sheet untuk 5 sheet recruitment` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4); umbrella dipecah jadi 10 Task top-level **DFORM-30..DFORM-39**, dan DFORM-35 adalah cluster **F**. Rencana: `docs/big-changes/plans/2026-09-27-DFORM-35-mx-f-formsheet-plan.md`. Bukan god commit: 3 commit atomik.

## Ringkasan (TL;DR)

Lima sheet recruitment kini berbagi satu shell: `FormSheet` di atas `ui/sheet`, dengan kelas shell dipusatkan di modul `formSheetClasses.ts` (satu sumber: lebar, overlay, header, footer). Shell sengaja hanya **3 lapis luar** (`Sheet` → `SheetContent` → header/footer opsional) — isi default dirender langsung di dalam `SheetContent` sehingga struktur `<form>` + scroll `p-4` milik call-site tidak berubah (nol risiko regresi padding). Perilaku buka/tutup tidak disentuh. `SessionQueueDrawer` (badan sheet #5) hanya diarahkan ke konstanta header/footer kanonik agar tetap bisa di-mount standalone tanpa bergantung pada `FormSheet`.

Duplikasi nyata sebelum ini: lima salinan shell inline; satu-satunya beda sah adalah token lebar (52/28/28/27 rem), overlay byte-identik, header hanya beda **urutan token** (visual sama). Hasil: string prefix kanonik (`sm:h-[calc(100%-1.5rem)]`) kini **hanya** ada di `formSheetClasses.ts` + test-nya; nol `SheetContent`/`<footer`/`sm:rounded-2xl` di kelima call-site.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 16:53 | `e86aeeb` | zappto | DFORM-35 | feat(sheet): shell `FormSheet` + modul kelas kanonik (Mx-F F1) |
| 17:00 | `39fc8b0` | zappto | DFORM-35 | refactor(sheet): 3 sheet recruitment pakai `FormSheet` (Mx-F F2) |
| 17:00 | `bf0e796` | zappto | DFORM-35 | refactor(sheet): panel+drawer pakai `FormSheet`, slot `#header` (Mx-F F3) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `e86aeeb` → `39fc8b0` → `bf0e796`, @ `1790502830..1790503218 +0700` (16:53–17:00 WIB).

## Per-commit

#### `e86aeeb` feat(sheet,DFORM-35): shell FormSheet + modul kelas kanonik (Mx-F F1)

- Apa:
    - **`formSheetClasses.ts`** (baru) — satu sumber kelas shell: `TFormSheetSize = 'default' | 'wide'`, `FORM_SHEET_WIDTH_CLASS` (`default` = `sm:w-[28rem]`, `wide` = `sm:w-[52rem]`), `formSheetContentClass(size)`, `FORM_SHEET_OVERLAY_CLASS` = `bg-black/60 backdrop-blur-sm`, `FORM_SHEET_HEADER_CLASS` = `border-border/70 shrink-0 space-y-1 border-b py-4 pl-4 pr-12 text-left`, `FORM_SHEET_FOOTER_CLASS` = `border-border/70 shrink-0 border-t p-4` (urutan token dinormalkan dari drift), plus prefix isi modul-privat diambil verbatim dari call-site.
    - **`FormSheet.vue`** (baru) — shell **3 lapis luar saja** (`Sheet` → `SheetContent` → header/footer opsional). **Sengaja tanpa** wrapper body/scroll/padding: default slot dirender langsung di dalam `SheetContent`, karena call-site #2–#4 menaruh `<form class="flex min-h-0 flex-1 flex-col">` + scroll `div.min-h-0.flex-1.overflow-y-auto.p-4` di sana dan #1 `fade-up` scroll div sendiri — wrapper akan menggandakan padding. API: `v-model:open`, props `title?`/`description?`/`size?`, slot `#header` (lihat commit 3), default slot, `#footer`. Tombol X bawaan tetap.
    - **`__tests__/form-sheet.test.ts`** (baru) — 16 test, me-mount primitif `ui/sheet` **asli** (bukan stub) agar asersi kelas bermakna; `attachTo: document.body` karena `SheetContent` teleport lewat `DialogPortal` reka-ui.
- File (3, stat +307).
- Test: TDD F1 RED (modul belum ada) → GREEN; penyempurnaan slot RED 2 failed → GREEN 16.
- Jira: DFORM-35.

#### `39fc8b0` refactor(sheet,DFORM-35): 3 sheet recruitment pakai FormSheet (Mx-F F2)

- Apa: `DivisionListSheet.vue`, `InterviewerCreateSheet.vue`, `InterviewSessionCreateSheet.vue` → `<FormSheet v-model:open="sheetOpen" title="…" description="…">` + `<template #footer>`; `Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription` dan `<footer>` literal dihapus; `<form>` + scroll div + body `p-4` verbatim (hanya re-indent). `sheetOpen` writable computed + `emit('close')` + `watch` reset + handler/validasi tiap file tidak disentuh.
- **Deviasi (dicatat)**: di dua form sheet, tombol submit semula **di dalam** `<form>`; kini berada di `SheetFooter` yang **sibling** dari form, sehingga membawa `form="interviewer-create-form"` / `form="interview-session-create-form"` dan `<form>` membawa `id` yang cocok. Ini menjaga klik-submit. Merupakan pola yang sudah ada di repo: `Periods/Create.vue:63`, `Periods/Edit.vue:147`, `Users/Create.vue:62`, `Users/Edit.vue:75`. `DivisionListSheet` tak butuh glue (footer-nya memang tidak pernah di dalam form).
- File (3).
- Test: suite terarah `recruitment` + `pages/Dashboard/Recruitment` **16 file / 119 test** setelah F1/F2/F3.
- Jira: DFORM-35.

#### `bf0e796` refactor(sheet,DFORM-35): panel+drawer pakai FormSheet, slot #header (Mx-F F3)

- Apa:
    - `ApplicantDetailPanel.vue` (sheet #1) → `<FormSheet v-model:open="sheetOpen" size="wide">`; karena header-nya **dinamis** (merender `Skeleton` saat loading, sehingga props `title`/`description` tak bisa mengekspresikannya) seluruh isi header dipindah **verbatim** ke `#header`. DOM ter-render identik.
    - `pages/Dashboard/Recruitment/MyInterviews/Show.vue` (sheet #5) → `<FormSheet v-model:open="queueDrawerOpen">`; perubahan lebar disetujui 27rem → kanonik 28rem. `queueDrawerOpen` dan trigger-nya tidak disentuh.
    - `SessionQueueDrawer.vue` (badan standalone #5) → `SheetHeader`/`SheetFooter`-nya kini memakai `FORM_SHEET_HEADER_CLASS`/`FORM_SHEET_FOOTER_CLASS` (satu sumber; footer `py-3` → kanonik `p-4`, disetujui). Tetap memakai primitif `ui/sheet` dan tetap bisa di-mount standalone (test `queue-skeleton.test.ts` me-mount-nya langsung) — **tidak** bergantung pada `FormSheet`.
    - `FormSheet.vue` + test-nya: slot `#actions` awal **diganti** `#header` (isi header penuh, dibungkus `SheetHeader` kanonik; props jadi fallback-nya, keduanya saling eksklusif). Alasan: setelah kelima call-site diketahui, `#actions` punya **nol call-site** (3 sheet sederhana pakai props) sementara #1 butuh kontrol header penuh — mengirim slot tanpa pemanggil = API mati (Aturan 14). Test diperbarui: RED 2 failed → GREEN 16.
- File (5).
- Jira: DFORM-35.

## Deviasi & keputusan

- **Lebar #5** 27rem → 28rem (`size: 'default'`), menghapus drift 1 rem tak terlihat — diperlihatkan ke user dan disetujui.
- **Footer #5** `py-3` → kanonik `p-4` (beda 4px vertikal) agar footer benar-benar satu sumber — disetujui.
- **Lokasi `FormSheet`** di `components/modules/dashboard/recruitment/`, **bukan** `components/core/`: sheet domain lain (`Sidebar`, `landing/Navbar`, `FormAnswerDetailSheet`, `FormBuilderAddFieldSheet`, `FormBuilderEditFieldSheet`) sengaja ber-shell beda (sisi/lebar/padding berbeda) tanpa duplikasi di antara mereka; generalisasi ditunda sampai muncul pemakai ke-6.
- **Urutan eksekusi**: F1, lalu F2 dan F3 **paralel** (file disjoint), lalu pass penyempurnaan slot.
- **`#actions` → `#header`** adalah koreksi sengaja di tengah jalan setelah kelima call-site dimigrasikan (menghapus slot tanpa pemanggil), **bukan** deviasi rencana.
- **Glue `form="<id>"`** pada dua form sheet: karena tombol submit kini sibling dari `<form>`, memakai asosiasi HTML standar `form`/`id` (pola lama yang sudah dipakai 4 file produksi).

## Verifikasi

> Catatan kejujuran: seluruh perintah verifikasi dan loop TDD **dieksekusi oleh orchestrator**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten ketiga commit dan evidence yang dilaporkan orchestrator.

- Full frontend suite `npx vitest run` → **51 file test / 346 test passed**.
- Scoped: `form-sheet.test.ts` **16/16**; `recruitment` + `pages/Dashboard/Recruitment` **16 file / 119 test** (setelah F1/F2/F3); `forms-periods-skeleton.test.ts` **5**, `queue-skeleton.test.ts` **17**, suite MyInterviews **4 + 5**, dan run terarah lane F3 (recruitment + Recruitment + Events) **18 file / 126 test**.
- `npx eslint` pada **8 file** yang berubah → **exit 0**.
- Acceptance grep: prefix isi kanonik (`sm:h-[calc(100%-1.5rem)]`) kini **hanya** di `formSheetClasses.ts` + test-nya; `SheetContent`, `<footer`, `sm:rounded-2xl` → **nol** di kelima call-site; `#actions` → **nol** di seluruh repo.
- Production build: `podman exec -w /app d_form_app npm run build` → `✓ built in 16.05s` (hanya warning chunk >500 kB pre-existing).
- Verifikasi sumber: kelima call-site mengimpor `FormSheet`; `SessionQueueDrawer.vue` memakai `FORM_SHEET_HEADER_CLASS`/`FORM_SHEET_FOOTER_CLASS`; `form-sheet.test.ts` memuat 16 test (2 describe).

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10 Mx-3-F (`:280`).

- Recon mengonfirmasi premis spec "belum ada wrapper" (glob/grep `FormSheet|SheetShell|SheetLayout` → nihil) dan bahwa tiap call-site menyalin shell inline; "string class shell identik di satu file" kini terpenuhi lewat `formSheetClasses.ts`.
- Recon membuktikan ketiga syarat "tidak ada perubahan perilaku buka/tutup" aman: tidak ada `SheetTrigger`/`SheetClose`/`onOpenChange` di kelima call-site (tutup lewat tombol X bawaan), dan tidak ada test yang meng-assert `emitted()`, `setProps({open})`, atau string kelas shell → risiko sentralisasi rendah.
- `queue-skeleton.test.ts` me-mount `SessionQueueDrawer` **standalone** → itu sebabnya komponen ini hanya diarahkan ke konstanta kelas bersama, bukan dilipat ke dalam `FormSheet` (menjaga mountability).
- Acceptance Mx-3-F terpenuhi: shell `FormSheet` di atas `ui/sheet`, 5 call-site memakainya, kelas shell satu sumber, perilaku buka/tutup tidak berubah, suite recruitment hijau.

## Catatan untuk tim

- DFORM-35 adalah cluster **F** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39.
- **Limitasi jujur**: jalur **klik-submit dua form sheet belum di-unit-test** (test-nya submit lewat `wrapper.find('form').trigger('submit')`). Bukti aman: asosiasi `form="<id>"` adalah HTML standar dan sudah dipakai di 4 file produksi (`Periods/Create:63`, `Periods/Edit:147`, `Users/Create:62`, `Users/Edit:75`; pola ini juga diuji di `period-submit.test.ts` via `button[form="period-form"]`). Test masa depan bisa meng-klik tombol footer.
- reka-ui mencatat warning non-fatal `DialogContent requires a DialogTitle` pada kasus test shell-saja (tanpa `title`/`description`/`#header`) — inheren pada pemakaian shell-only #5 di kasus sintetis itu; #5 nyata selalu merender `SheetTitle` milik `SessionQueueDrawer`.
- Di luar scope, tidak berubah: `Sidebar.vue`, `landing/Navbar.vue`, `FormAnswerDetailSheet.vue`, `FormBuilderAddFieldSheet.vue`, `FormBuilderEditFieldSheet.vue`.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-35.
