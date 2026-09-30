# Sapto Changes — 30 September 2026 (DFORM-67)

Ticket Jira: **DFORM-67** — `[broadcast] Logic stateful di page Show.vue 387 baris` (In Progress + assignee saptogusty, Board-ID FE-27). Scope HANYA tiket ini: ekstraksi logika → hooks, NOL perubahan visual/perilaku. Branch: `dev` langsung, tanpa push (menunggu pemilik). PM review e2e + CI sebelum merge.

## BEFORE (masalah + bukti)

1. `resources/js/pages/Dashboard/Broadcasts/Show.vue` **384 baris**: script setup 1–219 (6 `useForm`: snapshot 88, recipient 122, content 145, attach 159, schedule 175, test 180; 2 `ref`; 4 `computed`; 0 `watch`; 15 fungsi; `router` langsung di 8 handler), template 221–384.
2. Logika inline di template: `@change="(e: Event) => { attachForm.file = (e.target as HTMLInputElement)… }"` (cast `as` di view).
3. FE test broadcast = 0 (tak ada pengunci perilaku pemisahan).

## AFTER (fix + file)

1. Tipe bersama `resources/js/hooks/useBroadcastShowTypes.ts` — `IBroadcastShowBroadcast`, `IBroadcastShowAttachment`, `IBroadcastShowDataset`, `IBroadcastShowRecipientRow`, `IBroadcastShowEventOption`, `IBroadcastShowRecipientsPage`, `IBroadcastShowDuplicateSummary`, `IBroadcastShowPreview`, `IBroadcastSnapshotManualEntry` (satu sumber kebenaran; varian prop Show diturunkan, bukan ditulis ulang).
2. 7 hooks baru (named export, 1 file 1 hook, argumen objek tunggal, doc 1–2 baris per fungsi exported):
   - `useBroadcastStatusSummary` — `isDraft`/`isScheduled`/`canCancel` + `progress` (jaga bagi-nol).
   - `useBroadcastSnapshotForm` — `selectedSources` (default softcode `DEFAULT_SNAPSHOT_SOURCES`), `manualRows`, `snapshotForm`, `generateSnapshot` (parser baris `toSnapshotManualEntry`, semantik identik), `onCsv` (guard `instanceof`, tanpa `as`).
   - `useBroadcastRecipientsPanel` — `recipientForm`, `addRecipient` (reset-on-success), `deleteRecipient`, `loadRecipients` (partial `only: ['recipients', 'duplicateSummary']`).
   - `useBroadcastContentForm` — `contentForm` (nilai awal dari broadcast), `saveContent`.
   - `useBroadcastAttachments` — `attachForm`, `uploadAttachment` (`forceFormData` + reset), `deleteAttachment`, `handleAttachmentFileInput` (pengganti inline `as` di template).
   - `useBroadcastLifecycleActions` — `scheduleForm`/`testForm`, `doSchedule`, `updateSchedule` (`patch`), `sendTest` (reset), `cancelBroadcast`, `retryFailed`, `deleteBroadcast` (guard `confirm` identik).
   - `useBroadcastPreview` — `loadPreview` (partial `only: ['preview']`).
3. `Show.vue` **384 → 230 baris** (script 219 → ~65: panggil hooks + teruskan binding; `onMounted setTopbar` + `Head` tetap). Template NOL ubah kecuali 1 baris: input lampiran kini `@change="handleAttachmentFileInput"` (diff template = 1 baris, terverifikasi via `diff`).
4. Barrel `resources/js/hooks/index.ts` + 8 baris (7 hooks + tipe, alfabetis).
5. 7 vitest baru di `resources/js/hooks/__tests__/broadcast-*.test.ts` — **28 passed**: payload terkirim, URL endpoint, flag `preserveScroll`/`preserveState`/`forceFormData`/`only`, reset-on-success, toast gagal, guard (`confirm` ya/tidak, target non-input, bagi-nol).
6. Aturan 14: prefix `I`, tanpa `any`/`unknown`/`!`, nol `as` (guard `instanceof` + `?? null`; tanpa alasan pengecualian karena tak dipakai), tanpa supresi, nama domain-spesifik, ≤2 parameter (semua hook 1 objek argumen), satu fungsi satu tanggung jawab. `ui/**`, `actions/**` (GENERATED), BE (`tests/Feature/Broadcasting/**`) tak disentuh.

## AKAR MASALAH (yang diselesaikan)

- Satu halaman menampung 6 domain form + 8 panggilan router + state UI mentah (god-page FE); tiap domain kini punya hook bernama dengan kontrak hasil eksplisit (`I…Result`), sehingga perubahan satu domain tak menyentuh domain lain dan terkunci test.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(refactor ini)_ | PM+sapto | DFORM-67 | refactor: 7 hook broadcast + tipe + Show tipis 384→230 |
| — | _(test ini)_ | PM+sapto | DFORM-67 | test: 7 vitest pengunci perilaku hook broadcast (28 passed) |
| — | _(docs ini)_ | PM+sapto | DFORM-67 | docs: changelog + README |

## Guard tabrakan (pra-kerja)

- `git status --short` + `git diff --stat` BERSIH sebelum tulis (Show.vue dan `resources/js/hooks/*` tak kotor oleh pihak lain) → lanjut. Tanpa overwrite insiden DFORM-61.

## Verifikasi

- `npm run typecheck` (`vue-tsc --noEmit`) → HIJAU (nol error; gate CI blocking).
- `npx prettier --check` 16 berkas baru (8 hook + 7 test + barrel) → HIJAU. `Show.vue` tetap warn — PRA-EKSIS (terbukti pada salinan pristine sebelum edit; gate repo sudah merah 10 berkas di `dev`, termasuk `Broadcasts/{Create,Datasets,Index}.vue` di luar scope). Template sengaja dibekukan per scope (prettier ingin sort kelas tailwind + wrap ulang = diff besar).
- `npx vitest run` 7 berkas baru → 7 files passed, 28 tests passed.
- `php artisan test tests/Feature/Broadcasting` (podman one-off `--entrypoint php`, `--add-host db/redis`; `podman exec` rusak overlay + entrypoint default gantung) → 7 PASS, 25 passed, 105 assertions (endpoint tak berubah).
- `diff` template lama vs baru → tepat 1 baris (input lampiran); `wc -l` Show.vue 384 → 230.

## Utang di luar scope

- Review e2e + CI oleh PM sebelum merge (tiket tetap In Review; Done oleh manusia).
- Gate prettier repo masih merah pra-eksis (10 berkas) — normalisasi di luar DFORM-67.
- Push `dev` menunggu auth pemilik.
