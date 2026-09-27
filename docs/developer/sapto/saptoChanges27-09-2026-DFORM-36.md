# Sapto Changes — 27 September 2026 (DFORM-36 Mx-H)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-35.md`](./saptoChanges27-09-2026-DFORM-35.md) (DFORM-35 Mx-F). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-36** — `[Mx-H] Unifikasi paginasi dashboard/tabel` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4, Mx-4 prioritas 4); DFORM-36 adalah cluster **H**. Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10:284-286. Rencana internal (gitignored): `docs/big-changes/plans/2026-09-27-DFORM-36-mx-h-pagination-plan.md`. Bukan god commit: 6 commit atomik.

## Ringkasan (TL;DR)

Paginasi dashboard/tabel kini punya satu komponen: `DataPagination` di atas primitif `ui/pagination` (reka `PaginationRoot`), hanya memiliki elemen **nav** — tanpa Card, pembungkus, teks range, limit selector, atau router. Dua mode: **bernomor** (window reka + `PaginationItem`/`PaginationEllipsis`, prev/next `ChevronLeft/Right` berlabel `hidden sm:block`) dan **kompak** (`numbers=false`, prev/next + First/Last opsional, fragment multi-root tanpa pembungkus). Lima call-site dimigrasikan (P1, P3 ×2, P4); **P2 (`FormSubmissionsPagination`) sengaja dibiarkan** (D10).

Temuan penting H1: `showEdges` reka berdefault `false` (`node_modules/reka-ui/dist/Pagination/PaginationRoot.js:39-43`), sehingga `PaginationEllipsis` yang sudah ditulis di P1 (`Users/Index.vue:321`, `MyInterviews/Index.vue:814`) **tidak pernah render** — dead code sebelum ticket ini. Prop `edges` (H1b) menghidupkan cabang itu. Cakupan akhir: **7 file, +557/−185**; suite penuh **52 file / 374 tes** lolos; `ui/pagination` kini hanya dipakai `DataPagination.vue`.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 17:59 | `fa4767a` | zappto | DFORM-36 | feat(pagination): `DataPagination` di atas `ui/pagination` (Mx-H H1) |
| 18:04 | `dc42b06` | zappto | DFORM-36 | feat(pagination): prop `edges` + aria-label Indonesia prev/next (Mx-H H1b) |
| 18:05 | `2817dd9` | zappto | DFORM-36 | refactor(pagination): Users/MyInterviews pakai `DataPagination` (Mx-H H2) |
| 18:16 | `15ae36a` | zappto | DFORM-36 | refactor(pagination): `pageCount` jujur + nav content-width berlabel (Mx-H H1c) |
| 18:19 | `caaa069` | zappto | DFORM-36 | refactor(pagination): Events/Recruitment pakai `DataPagination` kompak (Mx-H H3) |
| 18:19 | `3f24940` | zappto | DFORM-36 | refactor(pagination): `PeriodApplicantSection` pakai `DataPagination` (Mx-H H4) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `fa4767a` → `dc42b06` → `2817dd9` → `15ae36a` → `caaa069` → `3f24940`, @ `1790506766..1790507999 +0700` (17:59–18:19 WIB).

## Per-commit

#### `fa4767a` feat(pagination,DFORM-36): DataPagination di atas ui/pagination (Mx-H H1)

- Apa: **`components/modules/dashboard/DataPagination.vue`** (baru, 141 baris) + `__tests__/data-pagination.test.ts` (18 tes). Satu navigasi halaman di atas `ui/pagination` (reka `PaginationRoot`): mode bernomor (window reka, `PaginationItem` dengan `aria-label="Ke halaman N"`, `PaginationEllipsis`, prev/next `ChevronLeft/Right` + label `hidden sm:block`) dan mode kompak (`numbers=false`, prev/next + First/Last opsional, fragment multi-root tanpa pembungkus). Props `page`/`total`/`perPage`, `siblingCount=1`, `numbers=true`, `firstLast=false`, `prevLabel='Sebelumnya'`, `nextLabel='Berikutnya'`; emit `update:page`. Komponen **hanya** memiliki nav (tanpa Card/pembungkus/teks range/limit selector/router).
- Temuan H1: `showEdges` reka berdefault `false` (`PaginationRoot.js:39-43`, `utils.js:16-21`) → `PaginationEllipsis` di P1 (`Users/Index.vue:321`, `MyInterviews/Index.vue:814`) **tidak pernah render** (dead code) sebelum ticket ini.
- File (2). Test: TDD RED → GREEN 18 tes.
- Jira: DFORM-36.

#### `dc42b06` feat(pagination,DFORM-36): prop edges + aria-label Indonesia prev/next (Mx-H H1b)

- Apa: prop `edges?: boolean` (default `false`) diteruskan ke reka `:show-edges` → halaman pertama/terakhir + ellipsis nyata (cabang ellipsis jadi hidup). `aria-label="Halaman sebelumnya"`/`"Halaman berikutnya"` pada prev/next **berhasil menimpa** label bawaan reka (`Previous Page`/`Next Page`) lewat fallthrough attr — terbukti tes RED: `expected 'Previous Page' to be 'Halaman sebelumnya'`.
- File (1: `DataPagination.vue` + test). Test: 18 → **22**.
- Jira: DFORM-36.

#### `2817dd9` refactor(pagination,DFORM-36): Users/MyInterviews pakai DataPagination (Mx-H H2)

- Apa: P1 dimigrasikan — `pages/Dashboard/Users/Index.vue` + `pages/Dashboard/Recruitment/MyInterviews/Index.vue` (dulu byte-identical) → `<DataPagination :page :total :per-page @update:page="applyFilters">`. Gate `last_page > 1`, pembungkus, paragraf `rangeLabel` (+ fallback `v-else-if` MyInterviews) dan **opsi `router.get`** tidak disentuh; import primitif `ui/pagination` + `ChevronLeft/Right` dibuang.
- File (2). Ukuran: **−71/+9 baris**.
- Jira: DFORM-36.

#### `15ae36a` refactor(pagination,DFORM-36): pageCount jujur + nav content-width berlabel (Mx-H H1c)

- Apa: prop `pageCount?: number` otoritatif (fallback `ceil(total/perPage)`); `total`/`perPage` jadi opsional (default `0`/`1`) sehingga mode kompak tidak perlu mengirim angka palsu. Nav bernomor `class="mx-0 w-auto"` (menimpa `w-full mx-auto` bawaan `ui/pagination`) → content-width, tetap `justify-center`. `aria-label="Navigasi halaman"` pada nav (landmark yang sempat hilang dari P4).
- File (1: `DataPagination.vue` + test). Test: 22 → **28**.
- Jira: DFORM-36.

#### `caaa069` refactor(pagination,DFORM-36): Events/Recruitment pakai DataPagination kompak (Mx-H H3)

- Apa: P3 dimigrasikan — `pages/Dashboard/Events/Index.vue` (`:numbers="false" :first-last="true" :page-count="lastPage"`) + `pages/Dashboard/Recruitment/Index.vue` (`:numbers="false" :page-count="periodLastPage"`). Jumlah halaman dari `last_page` server, **bukan** dari bind palsu `:total="lastPage" :per-page="1"` (versi antara H3 yang dibatalkan karena membuat prop `total` berbohong dan rapuh saat `per_page?` opsional). Tombol berteks `Berikutnya` tetap ada + tetap memicu tepat satu `router.get` (test kritis `pages/Dashboard/__tests__/events-recruitment-skeleton.test.ts:126-132` untuk helper tombol; asersi `routerGetMock` ×1 di sekitarnya).
- File (2).
- Jira: DFORM-36.

#### `3f24940` refactor(pagination,DFORM-36): PeriodApplicantSection pakai DataPagination (Mx-H H4)

- Apa: P4 dimigrasikan — `components/modules/dashboard/recruitment/PeriodApplicantSection.vue` → `<DataPagination :edges :page :total :per-page @update:page="goToPage">` (di kode: `:edges="true"`). `visiblePages` manual (dulu `:248-265`) + item `'…'` buatan dibuang; `goToPage` dipersempit `number | string` → `number`. Limit selector `SearchableSelect` (5/10/20/50), teks range, `pagedRows`, reset halaman saat `perPage` berubah, dan clamp tidak disentuh.
- File (1).
- Jira: DFORM-36.

## Deviasi & keputusan

- **P2 tidak dimigrasikan** — `components/modules/dashboard/FormSubmissionsPagination.vue` (1 konsumen `EventReportingFocusPanel.vue:125`, bentuk data `links[]` Laravel) dibiarkan. Keputusan user: sudah satu implementasi, memaksakannya masuk = mode ber-pemakai-tunggal (persis yang diperingatkan D10).
- **P4 dimigrasikan dengan `edges`** — keputusan user; memunculkan kembali ellipsis nyata di mode bernomor.
- **Delta kanonik H4 disetujui/diperbaiki user** (terukur dengan mount nyata 200 baris/10 halaman & 141 baris/8 halaman):
    1. halaman aktif: dulu `bg-primary` + `disabled` → kini `outline bg-background`, enabled, `aria-current="page"`;
    2. prev/next: dulu outline teks → kini ghost + ikon Chevron + label `hidden sm:block` (label hilang di bawah `sm`, nama tetap lewat `aria-label`);
    3. window dekat awal: dulu `[1,2,…,10]` → kini `[1,2,3,4,5,…,10]` (`edges`);
    4. ellipsis: dulu `<span aria-hidden>…</span>` → kini `PaginationEllipsis` (ikon + `sr-only` "More pages");
    5. sr-label prev/next: `Ke halaman sebelumnya` → `Halaman sebelumnya` (label nomor tetap `Ke halaman N`);
    6. **disetujui user**: nomor non-aktif jadi ghost tanpa border `size-10` (dulu outline `h-9 px-3`);
    7. **disetujui user**: tinggi baris +4px (nomor 36→40px, prev/next `h-9`→`h-10`);
    8. nav: dulu `aria-label="Pagination"` + content-width → sempat tanpa nama + `w-full mx-auto` (meleset di baris `sm:justify-between` P4) → **diperbaiki di H1c** (content-width + `Navigasi halaman`), diverifikasi ulang di H4b (tanpa perubahan kode).
- Lain-lain: First/Last ikon-only di mode kompak kini punya `aria-label="Halaman pertama"`/`"Halaman terakhir"` (a11y, tak terlihat). Di `Recruitment/Index.vue` urutan DOM jadi `[Prev, Next, span]` (dulu `[Prev, span, Next]`; baris tetap `justify-center gap-2`).

## Verifikasi

> Catatan kejujuran: seluruh perintah verifikasi dan loop TDD **dieksekusi oleh orchestrator**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten tree di HEAD dan evidence yang dilaporkan orchestrator.

- Per lane: `data-pagination.test.ts` RED→GREEN **18 → 22 → 28** tes; `period-applicant-section.test.ts` **9**; suite MyInterviews **9** (`skeleton-foundation` 4 + `my-interviews-grade` 5); `events-recruitment-skeleton.test.ts` **8** (tombol `Berikutnya` + tepat satu `router.get`).
- **Suite penuh: 52 file / 374 tes lolos** (`npx vitest run`).
- `npx eslint` pada 7 file ticket → **exit 0**; `npx prettier --check` pada 2 file komponen → clean.
- Grep acceptance (diverifikasi langsung): pemakai `components/ui/pagination` **hanya** `DataPagination.vue`; `visiblePages` **nihil** di `resources/js`; `:per-page="1"` **nihil**; `DataPagination` dipakai **5 call-site** (`Users/Index.vue:293`, `MyInterviews/Index.vue:784`, `Events/Index.vue:276`, `Recruitment/Index.vue:437`, `PeriodApplicantSection.vue:587`) + tes.
- Build: `podman exec -w /app d_form_app npm run build` → **✓ built in 14.59s**.
- Catatan lingkungan: container `d_form_app` sempat `exited`/state improper saat verifikasi dan diperbaiki dengan `podman stop/start`; `d_form_db` `unhealthy` — keduanya pra-ada/tak terkait perubahan ini.

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10:284-286.

- Recon mengonfirmasi `showEdges` reka berdefault `false` → `PaginationEllipsis` di P1 adalah **dead code** sebelum ticket ini; prop `edges` (H1b) menghidupkan cabang ellipsis.
- Label `aria-label` Indonesia pada prev/next **menimpa** label bawaan reka lewat fallthrough attr (bukan lewat API khusus) — terbukti tes RED `expected 'Previous Page' to be 'Halaman sebelumnya'`.
- Versi antara H3 dengan `:total="lastPage" :per-page="1"` **dibatalkan**: membuat prop `total` berbohong dan rapuh saat `per_page?` opsional; diganti `:page-count` otoritatif dari `last_page` server (H1c menyediakannya).
- Acceptance Mx-H terpenuhi: satu komponen paginasi dipakai lintas dashboard/tabel, primitif hanya dipakai satu tempat, tidak ada regresi perilaku navigasi (`router.get` tetap tepat satu), suite hijau.

## Catatan untuk tim

- DFORM-36 adalah cluster **H** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; posisinya di Mx-4 prioritas 4.
- **Follow-up terbuka**:
    - (a) mode bernomor `firstLast` masih memakai label bawaan reka (`First Page`/`Last Page`) — belum ada konsumen;
    - (b) `FormSubmissionsPagination` (P2) tetap tidak dimigrasikan (D10);
    - (c) batas viewport sempit di mode kompak: di bawah ~344px baris tombol bisa melebihi lebar karena nav komponen tak punya `flex-wrap` (nav lama punya). Ini **inferensi aritmetik H4b** dan **tidak** ditindak pada ticket ini.
- Di luar scope, tidak berubah: `components/modules/builder/FormBuilderCanvasBuildView.vue:477-507`.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-36.
