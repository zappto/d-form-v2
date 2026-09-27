# AGENTS.md — d-form-v2

## Aturan wajib

Baca aturan lengkap sebelum menulis kode:

- `docs/rules/general.md` — git flow, conventional commits, PR, environment & security.
- `docs/rules/front-end.md` — Vue 3 Composition API, Inertia, Tailwind, struktur folder, TypeScript.
- `docs/rules/back-end.md` — Laravel 12, controller/request/model/observer/policy, storage.

### 14 aturan user (mengikat semua kode baru/pindahan)

1. Prefix `I`/`G`/`T` untuk interface, generic, type alias.
2. Utility TS (`Pick`/`Omit`/`Partial`/`Readonly`/`ReturnType`) daripada duplikasi tipe.
3. Tanpa tipe longgar (`any`/`unknown`); nilai hilang dimodelkan eksplisit (`| null`, opsi `?`).
4. Tanpa simbol `!`; pakai `?` + penanganan nullable (early return/fallback/guard).
5. Optimal & readable: hindari alokasi/serialisasi berulang di path panas.
6. Reusable & dedup: satu duplikasi → satu hook atau satu fungsi `lib/`.
7. Maksimal 2 parameter per fungsi; lebih → satu objek argumen.
8. Nama spesifik domain (`useBannerFilePicker`, `formatRupiahPrice`), bukan `useFile`/`formatDate2`.
9. Nama human-readable, bukan AI-slop.
10. Satu fungsi = satu tanggung jawab (satu alasan berubah); komposisi lewat pemanggilan; larang god function.
11. Softcoded default; wajib-softcode: magic number tersebar, string duplikat lintas file, config env. Hardcode lintas-pakai wajib beralasan tertulis satu baris.
12. Larang nama AI-slop (`foo`/`bar`/`tmp2`/`data2`, singkatan samar, suffix `-Util`/`-Helper`/`-Manager`).
13. Setiap fungsi (terutama exported) wajib doc SINGKAT 1–2 baris (apa + kapan dipakai).
14. Tanpa redundansi: satu sumber kebenaran; varian diturunkan via utility TS (`Partial<T>`, `Record<keyof T, ...>`), bukan ditulis ulang.

### Typing (front-end)

- `strict: true`; tipe eksplisit pada setiap parameter dan return.
- Dilarang `any`, `unknown`, dan `undefined` sebagai tipe longgar. Nilai hilang dimodelkan eksplisit: union dengan `null`, properti opsi `?`, atau `Partial<T>`.
- **Precedence:** untuk `unknown`, aturan ini MENANG atas `docs/rules/front-end.md` §7.1 yang membolehkannya. Tidak ada pengecualian implisit: pemakaian di batas eksternal (JSON/localStorage/response) pun harus segera dipersempit dan alasan satu baris ditulis di changelog.
- `as` hanya bila benar-benar perlu, dan alasannya ditulis di changelog.
- Tanpa trik supresi (`@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `noqa`) — perbaiki akar masalah.
- Setiap `.vue` wajib `<script setup lang="ts">`; dilarang Options API.

### Arsitektur front-end

- `.vue` UI-only: `<script setup>` hanya memanggil hooks, memetakan props ke komponen anak, mengikat event.
- `resources/js/hooks/` satu-satunya rumah logic stateful; nama `useXxx`, named export, tanpa default export di file baru.
- `resources/js/lib/` fungsi murni: tanpa `ref`/`watch`/DOM/`localStorage`/`URL.createObjectURL`.
- Factory objek kompleks bernama `createXxx` di modul builder/lib, bukan di hooks.
- Alias import tetap `@/`.
- `resources/js/components/ui/**` = Shadcn-Vue asli: **dilarang diubah**; kustomisasi lewat wrapper di `components/core/`. Pelanggaran historis (komponen kustom di dalam `ui/`) adalah utang teknis, bukan pola yang boleh diulang.
- Komponen: `core/` (reusable global), `layout/` (dipakai hanya dari `layouts/`), `module/` (spesifik fitur).
- Tindakan destruktif (hapus file/data, instal/uninstal paket) wajib tampilkan rencana + konfirmasi user dulu.

### Alur kerja agent

- Fitur/perubahan: `brainstorming` → `writing-plans` (plan disetujui user dulu) → TDD → eksekusi. Bug: `systematic-debugging` dulu.
- Commit atomik per langkah; `git add <path spesifik>`, **jangan** `git add -A`.
- Jangan pernah commit `Makefile` dan `database/seeders/UserSeeder.php`.
- Conventional commits (`feat:`/`fix:`/`refactor:`/`docs:`/`chore:`).
- Tanpa push kecuali diminta.
- Perubahan `AGENTS.md`/`SKILL.md` wajib ditampilkan dulu dan dikonfirmasi user.

### Dokumentasi perubahan

- Changelog per-tiket: `docs/developer/sapto/saptoChanges<DD-MM-YYYY>-DFORM-<N>.md` (satu file per tiket, ada kolom Issue/commit) + baris di `docs/developer/sapto/README.md`.
- Jangan menulis ulang god-doc `saptoChanges27-09-2026.md`.

### Jira

- Agent hanya memindahkan status **In Progress → In Review**; penutupan **Done** oleh manusia.

## Agent skills

### Issue tracker

Jira penuh (primer) untuk semua case ke depan. Lihat `docs/agents/issue-tracker.md`.

### Triage labels

Default sekarang (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); opsi custom Jira didokumentasikan untuk evaluasi. Lihat `docs/agents/triage-labels.md`.

### Domain docs

Single-context: satu `CONTEXT.md` + `docs/adr/` di root. Lihat `docs/agents/domain.md`.
