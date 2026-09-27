# Sapto Changes — 27 September 2026 (DFORM-16 M12, evaluasi)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-15.md`](./saptoChanges27-09-2026-DFORM-15.md) (DFORM-15 M11). Ticket Jira: **DFORM-16** — `M12: Evaluasi D9/D10 (filter-sync + polling)` (status: **In Progress**; acceptance: *keputusan tercatat + kode sesuai*). Putusan sesi ini: **D9 = TOLAK** (unifikasi error handling Inertia sudah ada dan dipakai universal) dan **D10 = ADOPSI** untuk Pattern 1 & 2 — **tetapi KODE ADOPSI D10 BELUM DIEKSEKUSI** (susulan, lihat Catatan untuk tim). Tidak ada commit kode pada sesi ini; dokumen ini mencatat keputusan + cara buktinya dikumpulkan.

## Ringkasan (TL;DR)

D9 (unifikasi error-mapping + safety net) **ditolak**: sumber tunggalnya sudah ada di `resources/js/lib/error-message.ts` (`humanizeErrorMessage`, `getFieldError`, `parseValidationErrors`, `showValidationErrorToast`, `handleInertiaFormErrors`, `showHttpErrorToast`, `showErrorToast`, `showFlashToast`) plus safety net global `router.on('invalid')` di `resources/js/app.js`, dan seluruh call-site produksi hanyalah delegasi tipis 1–5 baris. Satu-satunya duplikasi berdekatan (`submitSubmissionReview` + `readXsrfToken`) adalah orkestrasi request/CSRF, bukan error-mapping — di luar scope D9. D10 (wrapper pagination/filter/polling) **diadopsi**: Pattern 1 (`<Pagination>` server + matematika range-label identik di dua halaman) dan Pattern 2 (loop `links` ActivityLogs yang mengulang `FormSubmissionsPagination`) memang duplikat, sedangkan beberapa kandidat lain dicatat sebagai susulan yang sengaja belum dieksekusi. Adopsi D10 belum menyentuh kode apa pun di sesi ini.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | tanpa commit kode (evaluasi) | zappto | DFORM-16 | Evaluasi D9: unifikasi error handling **sudah ada** → TOLAK, tidak ada perubahan |
| — | tanpa commit kode (evaluasi) | zappto | DFORM-16 | Evaluasi D10: Pattern 1 & 2 terbukti duplikat → ADOPSI, **kode belum dieksekusi** |

Waktu kosong (`—`) karena sesi ini tidak menghasilkan commit; tidak ada SHA/waktu commit untuk dikutip.

## Per-commit

#### Tidak ada commit kode — evaluasi (alasan)

- Sesi ini murni **audit + pencatatan keputusan**, bukan implementasi. Acceptance DFORM-16 adalah *"keputusan tercatat + kode sesuai"*; bagian *"keputusan tercatat"* dipenuhi oleh dokumen ini, sedangkan *"kode sesuai"* belum ada karena D10 belum dieksekusi (susulan).
- **D9 tidak menghasilkan kode** karena hasil evaluasinya adalah penolakan: kapabilitas yang diusulkan D9 sudah terimplementasi dan dipakai.
- **D10 menghasilkan keputusan adopsi, bukan kode**: eksekusinya sengaja disusulkan dan wajib diawali pin-test (lihat Verifikasi).

**Putusan D9 = TOLAK (unifikasi sudah ada, dipakai universal).**

- Sumber tunggal error handling: `resources/js/lib/error-message.ts` — `humanizeErrorMessage` (:249), `getFieldError` (:268), `parseValidationErrors` (:278), `showValidationErrorToast` (:291), `handleInertiaFormErrors` (:320), `parseApiErrorMessage` (:327), `showHttpErrorToast` (:348), `showErrorToast` (:374), `showFlashToast` (:394). Rentang yang dievaluasi: :249–:409.
- Safety net global: `resources/js/app.js:8-19` — `router.on('invalid')` menangani 5xx dan 419 sekali untuk seluruh aplikasi.
- 27 call-site produksi `handleInertiaFormErrors(...)` semuanya delegasi tipis 1–5 baris, contoh `resources/js/hooks/useDashboardEventShowPage.ts:72` → `handleInertiaFormErrors(errors, { title: 'Gagal mengarsipkan event' })`. Tidak ada page dengan ≥2 blok error-mapping duplikat.
- Satu-satunya duplikasi nyata yang berdekatan — `submitSubmissionReview` di `resources/js/hooks/useFormSubmissionsPage.ts:155-249` vs `resources/js/pages/Dashboard/Events/Forms/Show.vue:398-468`, plus `readXsrfToken` yang terdefinisi 3× (`useFormSubmissionsPage.ts:37`, `Events/Forms/Show.vue:393`, `hooks/useBuilderAutosave.ts:224`) — adalah **orkestrasi request/CSRF, BUKAN error-mapping**. Ini di luar scope D9; dicatat sebagai temuan susulan, bukan alasan mengadopsi D9.

**Putusan D10 = ADOPSI (belum dieksekusi).**

- Tidak ada wrapper `DataPagination` / hook pagination generik hari ini. Bukti duplikasi:
    - **Pattern 1 (dieksekusi):** `resources/js/pages/Dashboard/Users/Index.vue` (:87-112 kalkulasi, :299-331 template) vs `resources/js/pages/Dashboard/Recruitment/MyInterviews/Index.vue` (:244-252 `applyFilters`, :405-422 range-label, :792-825 template) — blok `<Pagination>` server + matematika range-label praktis identik, hanya beda nama prop.
    - **Pattern 2 (dieksekusi):** `resources/js/pages/Dashboard/Recruitment/ActivityLogs/Index.vue:127-139` mengulang loop `links` secara manual padahal wrapper `resources/js/components/modules/dashboard/FormSubmissionsPagination.vue` sudah ada; konsumen yang sudah memakainya: `resources/js/components/modules/dashboard/EventReportingFocusPanel.vue:125-131`.
- **Sekunder — TIDAK dieksekusi, hanya dicatat:** `usePolling` (`resources/js/hooks/useRecruitmentQueue.ts:31-77` vs `resources/js/pages/OpenRecruitment/QueueDisplay.vue:65-139`), `useFilterNavigation` (terverifikasi 4 definisi `applyFilters` lokal: `Users/Index.vue`, `ActivityLogs/Index.vue`, `Events/Index.vue`, `MyInterviews/Index.vue`), dan Group C `useSubmissionReview`.
- Pola client-side (`resources/js/components/modules/dashboard/recruitment/PeriodApplicantSection.vue`) dan custom (`resources/js/pages/Dashboard/Events/Index.vue`) **sengaja dibiarkan terpisah** — mekanisme/UX berbeda, bukan target unifikasi.
- Aturan 10–13 berlaku saat adopsi D10 dieksekusi.

## Verifikasi

Cara bukti dikumpulkan: **inventory grep** (inventaris call-site/duplikasi) + **test existing yang mengunci** perilaku hari ini. Tidak ada test baru di sesi ini.

- **D9 ter-pin test.** Test yang mengunci delegasi ke `error-message` (mem-mock `@/lib/error-message` dan meng-assert pemanggilan `handleInertiaFormErrors`): `resources/js/hooks/__tests__/dashboard-event-show-page.test.ts`, `resources/js/pages/Dashboard/Recruitment/Periods/__tests__/period-submit.test.ts`, `resources/js/pages/Dashboard/User/__tests__/team-invitation.test.ts`, `resources/js/pages/OpenRecruitment/Track/__tests__/track-submit.test.ts`, dan sejumlah test skeleton yang mem-mock `@/lib/error-message` (`user-area-skeleton`, `event-manage-skeleton`, `logs-registrants-submissions-skeleton`, `period-oprec-skeleton`, `forms-periods-skeleton`, `queue-skeleton`, `interview-detail-skeleton`, `track-feedback-skeleton`). Test-test ini menjaga agar D9 tidak "diadopsi ulang" dan merusak sumber tunggal.
- **D10 belum ter-pin.** Tidak ada test untuk `Users/Index.vue` `@update:page`, komponen `FormSubmissionsPagination`, maupun loop pagination `ActivityLogs/Index.vue`. Karena itu **adopsi D10 WAJIB diawali pin-test TDD** agar perilaku pagination/filter yang ada sekarang tidak regresi.

## Catatan untuk tim

- **Kode adopsi D10 belum dieksekusi.** DFORM-16 berstatus *In Progress*; dokumen ini dan komentar Jira adalah "keputusan tercatat", bagian "kode sesuai" menyusul di pekerjaan lanjutan.
- Urutan eksekusi D10: tulis pin-test dulu (Users `@update:page`, `FormSubmissionsPagination`, loop `ActivityLogs`), baru refactor Pattern 1 & 2. Item sekunder (`usePolling`, `useFilterNavigation`, Group C `useSubmissionReview`) diputuskan terpisah.
- Saat eksekusi, patuhi Aturan 10–13 (satu tanggung jawab per fungsi, konstanta bernama, nama readable, doc 1–2 baris per exported, tanpa duplikasi baru).
- Temuan susulan di luar D9/D10: duplikasi orkestrasi request/CSRF `submitSubmissionReview` + 3 definisi `readXsrfToken`.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-16.
