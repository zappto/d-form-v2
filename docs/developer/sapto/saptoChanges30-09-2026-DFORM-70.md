# Sapto Changes — 30 September 2026 (DFORM-70)

Ticket Jira: **DFORM-70** — `[broadcast] Duplikasi sumber dataset + magic sample` (In Progress + assignee saptogusty; Done oleh manusia). Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: FE-30.

## BEFORE (masalah + bukti)

1. `useBroadcastSnapshotForm.ts:10`: `DEFAULT_SNAPSHOT_SOURCES = ['users']` — default FE satu-satunya, literal lokal.
2. `Broadcasts/Show.vue:106`: checklist hardcoded `['event_participants', 'recruitment_applicants', 'users']` — duplikat kanonik tanpa `custom`.
3. `Broadcasts/Show.vue:113`: placeholder sample `Nafan` — magic string di template.
4. `Broadcasts/Create.vue:75,79`: `max="3600"` ganda (delay_min/max) — angka duplikat; kanonik BE `StoreBroadcastRequest.php:25-26` (`max:3600`).
5. Kanonik sumber: `EmailDatasetSourceType.php:7-10` (4 nilai); belum ada modul broadcast di `resources/js/lib/`.

## AFTER (fix + file)

1. `resources/js/lib/broadcastDataset.ts` (baru, murni — tanpa ref/watch/DOM; doc 1–2 baris per export): `TBroadcastDatasetSource` (union 4 nilai enum BE) + `BROADCAST_DATASET_SOURCES` (4 nilai) + `BROADCAST_SNAPSHOT_SOURCE_OPTIONS` (turunan: kanonik minus `custom` — `custom` butuh id dataset yang tak dikirim kartu snapshot, resolver mengabaikannya tanpa id) + `DEFAULT_BROADCAST_SNAPSHOT_SOURCES` (turunan: filter `users`) + `BROADCAST_DELAY_MAX_SECONDS = 3600` + `BROADCAST_MANUAL_SAMPLE_NAME = 'Nafan'`.
2. `useBroadcastSnapshotForm.ts`: hapus konstanta lokal, impor default turunan — nilai runtime `['users']` identik.
3. `Show.vue`: checklist `v-for` opsi turunan (urutan + isi identik: 3 item, tanpa `custom` — NOL checkbox baru); placeholder via `manualSamplePlaceholder` dari konstanta (`\n` == `&#10;` semula) — render identik.
4. `Create.vue`: 2× `max="3600"` → `:max="BROADCAST_DELAY_MAX_SECONDS"` — render `max="3600"` identik.
5. Test: `lib/__tests__/broadcast-dataset.test.ts` (baru, 5 kasus kunci nilai) + `broadcast-snapshot-form.test.ts:60,62` ke impor konstanta (setup dari sumber; ekspektasi payload wire :69 tetap literal sebagai kunci perilaku; data parse manual :74,78 tetap literal — data uji parser, sama alasannya dengan `broadcast-recipients-panel.test.ts:54-55` yang tak tersentuh).

## AKAR MASALAH (yang diselesaikan)

- Satu kebenaran backend (enum + `max:3600`) disalin sebagai literal di 4 titik FE. Kini satu modul lib; turunan (`filter`) menjaga urutan/isi runtime identik tanpa literal ganda.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(refactor ini)_ | PM+sapto | DFORM-70 | refactor: satu sumber dataset broadcast lib + 3 konsumen + test |
| — | _(docs ini)_ | PM+sapto | DFORM-70 | docs: changelog + README |

## Verifikasi PM (independen)

- `npm run typecheck` (vue-tsc --noEmit): exit 0.
- `npx prettier --check` 6 file tersentuh: hijau (termasuk `--write` atas drift format pra-ada di Show.vue/Create.vue warisan rewrite DFORM-67 — semicolon, urut kelas tailwind, rewrap; diaudit per-hunk: render identik, satu-satunya teks berubah spasi contoh `v-pre` `{{name}}`→`{{ name }}` yang keduanya valid per `BroadcastPersonalization.php:46`).
- `npx vitest run`: TERHALANG env (bukan kode) — `Cannot find module @rollup/rollup-linux-x64-gnu`; hanya `rollup-linux-x64-musl` di `node_modules` (sesi paralel) — TAK diperbaiki (butuh konfirmasi pemilik).
- `git status`: hanya file tiket (lib + test baru, hook + test, 2 .vue, docs ini + README); `package-lock.json` milik sesi lain + `Makefile`/`UserSeeder.php`/`.env`/`AGENTS.md` TAK tersentuh; backend NOL sentuh; tanpa push/merge/Jira.

## Utang di luar scope

- Vitest butuh perbaikan env oleh pemilik (`npm i` ulang / node_modules musl-vs-gnu) sebelum suite hijau dapat diklaim.
- Bila `custom` kelak harus selectable di kartu snapshot, perlu picker dataset-id (resolver butuh `id`) — tiket tersendiri, bukan sekadar membuka filter. Push `main`+`dev` menunggu auth pemilik.
