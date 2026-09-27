# Sapto Changes — 27 September 2026 (DFORM-37 Mx-I)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-36.md`](./saptoChanges27-09-2026-DFORM-36.md) (DFORM-36 Mx-H). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-37** — `[Mx-I] EmptyState untuk dashboard/tabel` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4, Mx-4 prioritas 4); DFORM-37 adalah cluster **I**. Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:287` (acceptance cluster I) + konvensi Mx `:260`. Rencana internal (gitignored): `docs/big-changes/plans/2026-09-27-DFORM-37-mx-i-empty-state-plan.md`. Bukan god commit: 4 commit atomik.

Acceptance spec (verbatim): *"I: 7+ inline dashboard/tabel → `EmptyState`; landing tetap inline. Acceptance: tidak ada empty inline tersisa di dashboard/tabel (grep pola lottie/empty manual per file); suite dashboard hijau."*

## Ringkasan (TL;DR)

`EmptyState` **sudah ada** sebelum ticket ini (`components/modules/dashboard/EmptyState.vue`) dengan lottie + surface card dan 7 pemakai; jadi pekerjaan cluster I bukan membuat komponen, melainkan **memigrasikan blok empty manual** ke dalamnya. Karena mayoritas blok manual berada di dalam `Card`/`<td>` (bukan kartu tersendiri), migrasi apa adanya akan menghasilkan kartu-di-dalam-kartu; solusinya: `EmptyState` mendapat prop presentasi **`variant?: 'panel' | 'inline'`** (default `panel` = tampilan hari ini, 7 pemakai lama tidak berubah).

Cakupan disetujui: **15 situs di 12 file** (3 whole-section + 12 in-card/in-table). Jalur `panel` byte-identical (dibuktikan probe HTML render: 10/10 identik pada 5 bentuk props × dengan/tanpa slot); `inline` = teks polos tanpa surface/lottie/padding sendiri. Kendala test yang ditemukan: `lottie-web` mengambil konteks canvas 2D **saat import** dan jsdom tidak punya canvas → diatasi dengan **mock global `vue3-lottie`** di `vitest.setup.ts` (deviasi dari plan §4 yang disetujui user). Acceptance "tidak ada empty inline tersisa" **tidak** tercapai secara harfiah; tercapai untuk 15 situs yang disetujui user, sisanya dikecualikan dengan alasan eksplisit (lihat bagian Eksklusi).

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 18:38 | `f8affc8` | zappto | DFORM-37 | feat(empty-state): varian `panel`\|`inline` pada `EmptyState` + mock test merender props (Mx-I F1) |
| 18:45 | `435ab4a` | zappto | DFORM-37 | refactor(empty-state): 6 empty manual events/dashboard pakai `EmptyState` (Mx-I M2) |
| 18:46 | `101fcd3` | zappto | DFORM-37 | test: mock `vue3-lottie` global via `vitest.setup.ts` (lottie-web crash di jsdom) |
| 18:48 | `299c455` | zappto | DFORM-37 | refactor(empty-state): 9 empty manual recruitment pakai `EmptyState` (Mx-I M1) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `f8affc8` → `435ab4a` → `101fcd3` → `299c455`, @ `1790509117..1790509680 +0700` (18:38–18:48 WIB).

## Per-commit

#### `f8affc8` feat(empty-state,DFORM-37): varian panel|inline pada EmptyState + mock test merender props (Mx-I F1)

- Apa: `EmptyState` dapat `variant?: 'panel' | 'inline'` (default `panel`). Jalur `panel` byte-identical (dibuktikan dengan probe membandingkan HTML render versi HEAD vs versi baru: 10/10 identik pada 5 bentuk props × dengan/tanpa slot). `inline`: root `flex flex-col items-center justify-center text-center`, title `<p class="text-sm text-muted-foreground">`, description `<p class="mt-1 text-sm text-muted-foreground">`, slot CTA `<div class="mt-3">`; **tanpa** `app-surface`/border/lottie dan **tanpa padding sendiri** (padding tetap milik call-site).
- Unit test baru `resources/js/components/modules/dashboard/__tests__/empty-state.test.ts` (4 tes: 2 panel + 2 inline; `LocalLottie` di-stub karena lottie-web crash di jsdom).
- 7 file test yang meng-`vi.mock('EmptyState')` diperbarui agar stub-nya mendeklarasikan `props: ['title','description']` dan merendernya (sebelumnya hanya `<slot />` sehingga props dibuang dan asersi copy akan pecah begitu situs bermigrasi); 7 suite tetap 60 tes hijau, **nol asersi berubah/flip**.
- File (9, +129/−15). Test: TDD RED 4 failed → GREEN 4 passed.
- Jira: DFORM-37.

#### `435ab4a` refactor(empty-state,DFORM-37): 6 empty manual events/dashboard pakai EmptyState (Mx-I M2)

- Apa: 6 situs events/dashboard —
    - **panel**: `pages/Dashboard/Recruitment/Index.vue` (kartu dashed → `EmptyState` surface; `animation-name="emptyData"`) & `pages/Dashboard/Events/Forms/Show.vue` (kotak dashed + ikon `Inbox` → surface + lottie `emptyData`; judul/deskripsi jadi `title`/`description`, `animation-name="emptyData"`).
    - **inline**: `pages/Dashboard/Recruitment/ActivityLogs/Index.vue` (`title="Tidak ada activity log."`), `components/modules/dashboard/RecentEventsCard.vue`, `components/modules/dashboard/FormAnswerDetailSheet.vue`, dan `components/modules/dashboard/EventReportingFocusPanel.vue` (di dalam `TableCell` `colspan="4"`).
- File (6, +27/−33).
- Jira: DFORM-37.

#### `101fcd3` test(DFORM-37): mock vue3-lottie global via vitest.setup.ts (lottie-web crash di jsdom)

- Apa: `vitest.setup.ts` meng-mock `vue3-lottie` (`Vue3Lottie: { template: '<div />' }`) + `setupFiles: ['./vitest.setup.ts']` di `vitest.config.ts`.
- Alasan: `lottie-web` mengambil konteks canvas 2D **saat import**; jsdom tidak punya canvas → setiap suite yang meng-import komponen pemakai `EmptyState` gagal *collect* (0 tes) dengan `TypeError: Cannot set properties of null (setting 'fillStyle')` — bahkan ketika hanya varian `inline` (tanpa lottie) yang dirender.
- Ini **deviasi dari plan §4** (semula: stub `EmptyState` per file) yang **disetujui user**, dipilih karena lebih baik daripada 9 salinan blok stub. Stub per-file yang sudah ada tetap valid dan menang atas mock setup; tidak ada test yang memakai pemutar lottie asli → nol perubahan perilaku.
- File (2, +11).
- Jira: DFORM-37.

#### `299c455` refactor(empty-state,DFORM-37): 9 empty manual recruitment pakai EmptyState (Mx-I M1)

- Apa: 9 situs recruitment, semuanya **inline**: `components/modules/dashboard/recruitment/PeriodApplicantSection.vue` (di dalam `<td colspan="7">`), `pages/Dashboard/Recruitment/Queue/Show.vue` ×3 (2 paragraf + `<td colspan="4">`), `pages/Dashboard/Recruitment/InterviewSessions/Show.vue`, `components/modules/dashboard/recruitment/DivisionListSheet.vue`, `components/modules/dashboard/recruitment/PeriodReportSection.vue` ×2 (dua tempat byte-identical `title="Belum ada data."` → kini satu sumber komponen), `pages/Dashboard/Recruitment/Periods/Show.vue`.
- File (6, +32/−27).
- Jira: DFORM-37.

## Deviasi & keputusan

- **API: 2 mode** — `variant?: 'panel' | 'inline'` pada `EmptyState` (default `panel` = tampilan hari ini). Opsi `boxed` (untuk kotak dashed) **ditolak** user; karena itu `SessionQueueDrawer` ditunda.
- **Cakupan: 15 situs** di 12 file (3 whole-section + 12 in-card/in-table), dengan daftar eksklusi eksplisit (lihat bagian Eksklusi).
- **Perbaikan lottie/jsdom: mock global** (bukan 9 stub per-file) — deviasi plan §4 yang disetujui user (lihat commit infra `101fcd3`).

### Delta terukur (jujur, wajib dicatat)

1. **`Periods/Show.vue` memakai `inline`, bukan `panel` seperti di plan**: blok empty itu `v-else` dari daftar penugasan di dalam `<Card><CardContent>` yang **juga memuat form penugasan**, sehingga `panel` akan menyarangkan `app-surface` di dalam Card (dilarang sejak awal plan). Delta: **kotak dashed + badge ikon `UserCheck` hilang**; judul `text-sm font-medium` → `text-sm text-muted-foreground`; deskripsi `text-xs leading-relaxed max-w-sm` → `text-sm mt-1`. Padding `px-4 py-8` dipertahankan di pembungkus. **Delta ini ditutup lewat tiket DFORM-47** — commit `50ed99c` menambah varian `dashed` + slot ikon pada `EmptyState` dan call-site `Periods/Show.vue` kembali ke kotak dashed + badge `UserCheck`; lihat [`saptoChanges27-09-2026-DFORM-47.md`](./saptoChanges27-09-2026-DFORM-47.md).
2. **Perataan: 5 situs berubah kiri → tengah** (`Queue/Show` ×2, `InterviewSessions/Show`, `PeriodReportSection` ×2) — itu tampilan kanonik `inline` yang disetujui; ukuran/warna teks tidak berubah.
3. **Panel M2**: `Recruitment/Index` tinggi blok ~60px → ~404px (surface + lottie), teks 14px muted → 16px bold foreground; `Events/Forms/Show` `py-20` → `py-14`, judul 18px → 16px, deskripsi `max-w-md` → `max-w-sm`, ikon 56px → lottie 180px.
4. **Inline (semua situs)**: slot CTA kosong `div.mt-3` selalu dirender → tinggi +12px (margin tidak collapse di flex column). Ini **fakta kelas/CSS**, bukan pengukuran layout (jsdom tak punya layout engine) → **perlu eyeball di browser**.
5. `animation-name="emptyData"` dipakai eksplisit di situs panel, karena `EmptyState` tidak punya default `animationName` (tanpa itu lottie tidak dirender).

## Eksklusi eksplisit

Supaya tidak terlihat "hilang diam-diam", bagian ini mencatat situs yang **sengaja tidak** dimigrasikan/ditunda beserta alasannya:

- Chart no-data (`RegistrationChart`, `CategoryChart`) → milik **cluster E**, bukan I.
- Landing/publik (harus tetap inline): `components/modules/landing/events/EventList.vue`, `EventHighlight.vue`, `pages/OpenRecruitment/{QueueDisplay,QueueIndex}.vue`, `pages/EventDetail.vue`, `pages/Docs.vue`, `pages/Error.vue`, `components/modules/auth/**`.
- Builder (domain lain): `FormPreviewDialog.vue`, `FormBuilderPalettePanel.vue`, `FormBuilderAddFieldSheet.vue`, `FormBuilderCanvasBuildView.vue`.
- Mikro-copy/status (bukan empty list): `EventCalendar.vue` (label sel hari), `ComboboxTagInput.vue` (hint panel), `ScanExportDialog.vue`, `QrScanSidebar.vue`, `TiptapRichHtml.vue`, `User/EventDetail.vue` ×2, `User/EventRegistration.vue`, `ApplicantDetailContent.vue` ×5 (fallback seksi detail), `Recruitment/Index.vue:501` (1 baris teks mikro panel antrean tindakan: `Tidak ada antrean tindakan saat ini.`).
- Ditunda (belum diputuskan/ditunggu): `SessionQueueDrawer.vue` ×2 (dua kotak dashed butuh varian `boxed` yang ditolak user), `EventShowRegistrantsPreviewCard.vue`, `pages/Dashboard/User/Index.vue` (widget + copy Inggris).

Karena itu, frasa acceptance **"tidak ada empty inline tersisa di dashboard/tabel" tidak tercapai secara harfiah** — tercapai untuk 15 situs yang disetujui user; sisanya dikecualikan dengan alasan di atas.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell** dan tidak bisa menjalankan `git`/`vitest`/`eslint`/build. Seluruh angka hasil perintah di bawah berasal dari brief orchestrator dan **tidak diverifikasi ulang secara independen** (ditandai "dari brief"). Yang **bisa** dan **sudah** diverifikasi langsung ke tree di HEAD adalah: keberadaan/isi `EmptyState.vue`, `vitest.setup.ts`, `vitest.config.ts`, jumlah tes `empty-state.test.ts`, pemakaian `EmptyState`, dan grep-grep acceptance (lihat bawah).

- **F1** (dari brief): unit test RED `4 failed` → GREEN `4 passed`; 7 suite stub-diupdate tetap **60 tes** hijau (nol flip); `eslint` exit 0 (9 file).
- **M2** (dari brief): 5 suite / 40 tes hijau (termasuk `pages/Dashboard/__tests__/logs-registrants-submissions-skeleton.test.ts` yang mem-pin copy `Tidak ada activity log.` di `:422` dan `Belum ada jawaban` di `:572` — baris sudah diverifikasi di tree); `eslint` exit 0.
- **Infra** (dari brief): 9 suite recruitment yang tadinya gagal tanpa tes (`division-list-sheet` 4, `period-applicant-section` 9, `queue-actions` 6, `queue-skeleton` 17, `interview-detail-skeleton` 4, `reschedule-action` 5, `period-status-actions` 7, `period-oprec-skeleton` 14, `forms-periods-skeleton` 5 = 71 tes) → **9 file / 71 tes hijau**.
- **M1** (dari brief): sweep `pages/Dashboard` + `components/modules/dashboard` → **28 file / 225 tes hijau**. Catatan rekonsiliasi: M1 sempat menambahkan stub `EmptyState` **per file** ke 9 suite untuk mengatasi crash collect; setelah mock global mendarat, 9 suntingan test itu **direvert** (semuanya murni tambahan, 0 penghapusan) dan sweep tetap 28 file / 225 tes hijau → membuktikan stub per-file memang redundan.
- **Ticket** (dari brief): **suite penuh 53 file / 378 tes hijau**; `npx eslint` 16 file → exit 0; build `podman exec -w /app d_form_app npm run build` → **✓ built in 14.37s**.
- **Grep acceptance** (diverifikasi langsung ke tree): `import LocalLottie` di `components/modules/dashboard` + `pages/Dashboard` → **hanya** `EmptyState.vue:2`; `resources/js` punya **19 file `.vue`** memakai `<EmptyState>`; sisa teks empty di 12 file yang dimigrasikan kini hanya sebagai prop `title`/`description` (dua pengecualian sah: teks mikro `Recruitment/Index.vue:501` dan pesan toast `Queue/Show.vue:79` `Tidak ada antrean menunggu.`).
- Diverifikasi langsung: `EmptyState.vue` punya prop `variant?: 'panel' | 'inline'` default `panel` dengan jalur inline tanpa surface/lottie/padding; `empty-state.test.ts` = 4 tes; `vitest.setup.ts` meng-mock `vue3-lottie` dan `vitest.config.ts` memuat `setupFiles: ['./vitest.setup.ts']`; 6 situs M2 dan 9 situs M1 memang sudah memakai `<EmptyState>` (panel/inline sesuai deskripsi).

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:287`; konvensi Mx `:260`.

- **Pemenang sudah ada sebelum ticket**: `EmptyState.vue` + 7 pemakai. Pekerjaan cluster I karenanya migrasi, bukan pembuatan komponen.
- **Acceptance "pola lottie" sudah terpenuhi sebelum ticket**: satu-satunya `import LocalLottie` di domain dashboard + `pages/Dashboard` adalah `EmptyState.vue:2` (diverifikasi ulang sekarang — masih hanya itu). Tidak ada lottie inline.
- **Acceptance "tidak ada empty inline tersisa" tidak tercapai harfiah** — lihat bagian Eksklusi; interpretasi yang dieksekusi adalah 15 situs yang disetujui user, bukan seluruh ~30 blok recon.
- **Kendala test tak terduga**: `lottie-web` crash di jsdom **saat import** (bukan saat render) → solusinya mock global, bukan stub per komponen; ini deviasi plan yang disetujui user.
- Acceptance "suite dashboard hijau" tercapai menurut brief (53 file / 378 tes); **tidak diverifikasi independen** oleh penulis dokumen.

## Catatan untuk tim

- DFORM-37 adalah cluster **I** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; posisinya di Mx-4 prioritas 4.
- **Follow-up terbuka**:
    1. 7 file test masih punya stub `vi.mock('EmptyState')` per file (yang di F1 diperbarui agar merender props) yang kini bisa dihapus karena mock global sudah cukup (kandidat ticket infra, Aturan 14). Catatan faktual: grep di tree menunjukkan **9 file** meng-mock `EmptyState` — 7 di antaranya yang merender props, 2 lainnya stub polos (`Events/__tests__/delete-action.test.ts`, `Events/Forms/__tests__/form-delete.test.ts`) yang tidak merender props.
    2. `SessionQueueDrawer` ×2 + widget copy Inggris (`EventShowRegistrantsPreviewCard`, `User/Index`) + 5 fallback `ApplicantDetailContent` masih inline manual.
    3. Batas viewport sempit pada mode `inline` belum diuji di browser (jsdom tanpa layout engine).
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-37.
