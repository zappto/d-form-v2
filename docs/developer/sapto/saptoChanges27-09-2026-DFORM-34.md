# Sapto Changes — 27 September 2026 (DFORM-34 Mx-C)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-33.md`](./saptoChanges27-09-2026-DFORM-33.md) (DFORM-33 Mx-A). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-34** — `[Mx-C] Satu implementasi banner di atas useBannerFilePicker/useObjectUrl` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4); umbrella dipecah jadi 10 Task top-level **DFORM-30..DFORM-39**, dan DFORM-34 adalah cluster **C**. Rencana: `docs/big-changes/plans/2026-09-27-DFORM-34-mx-c-banner-plan.md`. Bukan god commit: 4 commit atomik.

## Ringkasan (TL;DR)

Satu implementasi banner dibuat: komponen umum `BannerPickerField` di atas hook `useBannerFilePicker`/`useObjectUrl` (tanpa `createObjectURL` langsung). Tiga konsumen (`Periods/Create.vue`, `Periods/Edit.vue`, `EventDashboardForm.vue`) memakainya dan membuang ~80 baris template upload/drop/preview duplikat masing-masing, lalu `FormBuilderBannerBlock.vue` menjadi **adapter tipis** yang merender komponen itu. Hasilnya: `createObjectURL` **nihil** di keempat file cluster C, kontrak builder/autosave (`FormBannerState`) tetap utuh, dan suite frontend hijau (50 file / 330 test).

Recon membuktikan premis spec sebagian **usang**: hook sudah ada + sudah dites, ketiga konsumen sudah memakai hook, dan `EventDashboardForm` sudah punya revoke. Duplikasi nyata adalah template inline yang disalin ulang. **Deviasi yang disengaja**: komponen memakai batas global 5 MB + PNG/JPG/GIF, membuat klien lebih ketat daripada backend periods/events (10 MB, WebP) — dipilih user setelah konsekuensinya diperlihatkan (lihat bagian Deviasi).

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 16:17 | `436f7d9` | zappto | DFORM-34 | feat(banner): komponen banner umum `BannerPickerField` (Mx-C F1) |
| 16:25 | `ca8c13d` | zappto | DFORM-34 | refactor(banner): 3 konsumen pakai `BannerPickerField` (Mx-C F2) |
| 16:37 | `c2294d6` | zappto | DFORM-34 | feat(banner): emit `remove` + rekonsiliasi model `BannerPickerField` (Mx-C F3a) |
| 16:37 | `0e01e6a` | zappto | DFORM-34 | refactor(banner): `FormBuilderBannerBlock` jadi adapter tipis (Mx-C F3) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `436f7d9` → `ca8c13d` → `c2294d6` → `0e01e6a`, @ `1790500631..1790501868 +0700` (16:17–16:37 WIB).

> Catatan lane paralel: di antara commit DFORM-34, sejumlah commit **DFORM-40** (typecheck/tipe bersama) milik lane lain mendarat di repo yang sama (`86e2cb5`, `e18ff73`…`849937e`). Edit `Periods/Edit.vue` sengaja dibatasi hanya pada blok banner agar baris-baris belum-commit milik lane itu tetap utuh.

## Per-commit

#### `436f7d9` feat(banner,DFORM-34): komponen banner umum BannerPickerField (Mx-C F1)

- Apa: komponen baru `resources/js/components/core/field/BannerPickerField.vue` — dibangun di atas `useBannerFilePicker`/`useObjectUrl`, **tanpa** `createObjectURL` langsung. API: `v-model:file` (`File | null`), `initialUrl`, `variant: 'frame' | 'plain'`, `invalid`, `error`, `id`, `accept` (default `image/png,image/jpeg,image/gif`). Batas **5 MB**; prioritas preview (blob baru → `initialUrl`); badge `baru`; tombol Ganti/Hapus; input berkas tersembunyi ter-typed.
- File (3, stat +429): `BannerPickerField.vue` + `components/core/field/__tests__/BannerPickerField.test.ts` + barrel `components/core/field/index.ts`.
- Test: 8 test komponen (prioritas preview, revoke saat ganti/hapus/unmount, validasi tipe/ukuran, reset ke URL awal) — suite terarah `components/core/field` + `hooks` **11 file / 58 test** passed.
- Jira: DFORM-34.

#### `ca8c13d` refactor(banner,DFORM-34): 3 konsumen pakai BannerPickerField (Mx-C F2)

- Apa: `pages/Dashboard/Recruitment/Periods/Create.vue`, `Periods/Edit.vue`, `components/modules/dashboard/events/EventDashboardForm.vue` memakai `<BannerPickerField variant="plain" v-model:file="form.banner" :initial-url="…" :invalid/:error …/>`. Tiap konsumen membuang ~80 baris markup banner inline + seluruh wiring hook (`bannerInput`, `bannerPreview`, `isDragging`, `openBannerPicker`, `handleBannerChange`, `handleBannerDrop`, `removeBanner`), termasuk dua cast `($refs.bannerInput as HTMLInputElement)`. Copy dinormalkan: `maks 10MB` → `maks 5 MB`; klaim WebP dihapus (`PNG, JPG, atau GIF`).
- File (3, stat +41/−317).
- Test: suite terarah `pages/Dashboard/Recruitment` + `pages/Dashboard/Events` + `components/modules/dashboard` **18 file / 113 test** passed.
- Jira: DFORM-34.

#### `c2294d6` feat(banner,DFORM-34): emit remove + rekonsiliasi model BannerPickerField (Mx-C F3a)

- Apa: komponen kini meng-emit `remove` saat Hapus (diperlukan karena `defineModel` melewati emit bila nilai tak berubah, `null → null`, sehingga induk yang memegang banner **tersimpan** tak bisa mendeteksi penghapusan) dan `watch` pada model yang — saat penulis eksternal men-set-nya `null` sementara hook masih memegang berkas — memanggil `clearSelection()` dan mengarahkan ulang preview ke `initialUrl`. Loop guard: `removeFile()` mengosongkan hook **sebelum** men-null-kan model, sehingga watcher early-return.
- File (2, stat +39/−17).
- Test: TDD **RED 3 failed → GREEN 11**; 8 test yang sudah ada tidak berubah.
- Jira: DFORM-34.

#### `0e01e6a` refactor(banner,DFORM-34): FormBuilderBannerBlock jadi adapter tipis (Mx-C F3)

- Apa: `FormBuilderBannerBlock.vue` merender `BannerPickerField variant="frame"` (dengan kelas penetral chrome untuk prop `plain` milik blok — yang berarti "tanpa chrome kartu", beda makna dari `plain` komponen, sehingga komponen selalu dirender `frame`) dan mengikat `:file="pendingFile"` + `@update:file="onPickedFile"` + `@remove="clearBanner"`. Blok kehilangan `URL.createObjectURL` langsung terakhirnya, tiga panggilan `revokeBannerPreview`, `<input accept>`, markup drop/preview/footer, `isDragging`, `bannerUploadError`, dan empat import yang jadi tak terpakai. Write-through `FormBannerState` dipertahankan apa adanya untuk autosave (`bannerFile` ditulis sinkron saat pick agar `hasPendingBannerFile()` langsung true). Dua workaround interim dihapus di commit yang sama: listener DOM capture berbasis `aria-label="Hapus banner"` dan remount `:key` (keduanya digantikan emit + watcher F3a).
- File (1, stat +85/−160 pada region).
- Test: `components/core/field` **11/11** (RED 3 → GREEN); suite builder **4 file / 24 test**; set terarah lebih luas (field+builder+hooks+Events+Recruitment) **27 file / 167 test** passed.
- Jira: DFORM-34.

## Deviasi & keputusan

### Deviasi yang disengaja — batas/format banner 5 MB (dipilih user)

Fakta backend saat eksekusi:

| Konteks banner | Aturan validasi backend | Batas nyata |
|---|---|---|
| builder form banner | `FieldModifyRequest.php:49` → `sometimes\|nullable\|image\|max:5120` | **5 MB** |
| periods banner | `Store/UpdateRecruitmentPeriodRequest.php:27` → `image\|max:10240\|mimes:jpg,jpeg,png,webp` | **10 MB, WebP boleh, GIF tidak** |
| events banner | `Store/UpdateEventRequest.php:40` / `UpdateEventRequest.php:40` → `required/sometimes\|image\|max:10240` | **10 MB, rule `image` Laravel** (jpg/jpeg/png/bmp/gif/svg/webp) |

Komponen F1 mengunci batas di **5 MB + png/jpeg/gif**, sehingga memigrasikan ketiga konsumen membuat **klien lebih ketat daripada backend periods/events**. **User secara eksplisit memilih opsi "satu batas global 5 MB" setelah konsekuensinya diperlihatkan** → ini **deviasi yang disengaja, bukan bug**: copy banner di ketiga konsumen dinormalkan ke `maks. 5 MB` dan klaim WebP dihapus, sementara aturan `store/update` backend periods/events **dibiarkan apa adanya**.

- **Trade-off**: pengguna tidak lagi bisa mengunggah banner WebP atau 5–10 MB ke periods/events meskipun API menerimanya.
- **Saran tindak lanjut**: selaraskan aturan backend ke 5 MB + mimes, **atau** parameterkan komponen dengan `maxBytes`/`accept` per konteks.
- **Sudah dikerjakan sebagian (DFORM-48)**: batas **ukuran** backend event & periode diselaraskan ke 5 MB (`max:5120`) lewat commit `97bf512`; daftar **mimes/format belum** diselaraskan. Lihat [`saptoChanges27-09-2026-DFORM-48.md`](./saptoChanges27-09-2026-DFORM-48.md).

### Deviasi/limitasi lain

- **`EventDashboardForm` `:error`**: mengirim `:error="fieldError('banner')"` (bukan `form.errors.banner` mentah), karena pesan backend form ini berbahasa Inggris dan `fieldError` men-humanize-nya ke Indonesia seperti field saudaranya — mempertahankan perilaku yang ada.
- **Limitasi F3**: `banner.bannerPreviewUrl` tak lagi bisa memuat blob, sehingga `FormPreviewDialog` menampilkan banner ter-commit (atau kosong) antara memilih berkas dan commit upload autosave.
- **Spec §260 "copy user-visible frozen"** kembali dilanggar (dengan persetujuan user) pada copy batas banner.

## Verifikasi

> Catatan kejujuran: seluruh perintah verifikasi dan loop TDD **dieksekusi oleh orchestrator**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten keempat commit dan evidence yang dilaporkan orchestrator.

- Full frontend suite `npx vitest run` → **50 file test / 330 test passed** (setelah F3). F1: `components/core/field` + `hooks` **11 file / 58 test**. F2: `pages/Dashboard/Recruitment` + `pages/Dashboard/Events` + `components/modules/dashboard` **18 file / 113 test**. F3: `components/core/field` **11/11** (RED 3 → GREEN); builder **4 file / 24 test**; set terarah (field+builder+hooks+Events+Recruitment) **27 file / 167 test**.
- `npx eslint` pada setiap file yang berubah → exit 0.
- Acceptance grep: `createObjectURL` → **NO matches** di keempat file cluster (`FormBuilderBannerBlock.vue`, `Periods/Create.vue`, `Periods/Edit.vue`, `EventDashboardForm.vue`).
- Production build: `podman exec -w /app d_form_app npm run build` → `✓ built in 26.55s` (hanya warning chunk >500 kB pre-existing).
- Verifikasi sumber: `BannerPickerField.vue` memakai `useBannerFilePicker` tanpa `createObjectURL`; ketiga konsumen mengimpor `@/components/core/field`; `FormBuilderBannerBlock.vue` hanya adapter (tanpa `createObjectURL`/`revokeBannerPreview`).

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10 Mx-2-C (`:273`), §260.

- Premis spec ("hooks to build", "`EventDashboardForm` revoke missing") **usang**: `useObjectUrl`/`useBannerFilePicker` sudah ada **dan sudah dites** (mem-pin §7.5/§7.7), ketiga konsumen sudah memakai hook, dan `EventDashboardForm` **sudah punya revoke**. Duplikasi nyata = ~80 baris template upload/drop/preview yang disalin di tiap konsumen.
- Satu-satunya `createObjectURL` langsung di keempat file adalah `FormBuilderBannerBlock.vue:61` lewat helper legacy `components/modules/builder/formBanner.ts`. **`formBanner.ts` tidak diubah**: `revokeBannerPreview` masih punya pemanggil di luar scope F3 (`formBanner.ts:221 applyBannerUploadSuccess` dan `pages/Dashboard/Events/Forms/Create.vue:64`).
- Masih ada di luar scope (bukan banner): `FieldEditor.vue:126` `createObjectURL` (preview opsi gambar), `Profile.vue:139`, `useFormFillPage.ts:302`, `FormFieldAnswerDisplay.vue:210`.
- Acceptance "satu implementasi banner" + "nol `createObjectURL` di keempat file" + "test picker/URL hijau" terpenuhi; syarat §260 "copy frozen" dilanggar sadar pada copy batas (lihat Deviasi).

## Catatan untuk tim

- DFORM-34 adalah cluster **C** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39.
- **Perilaku unggah berubah untuk periods/events** (5 MB + tanpa WebP) — ini keputusan user yang disengaja; jangan "perbaiki" tanpa menyelaraskan backend atau memparameterkan komponen.
- `FormBuilderBannerBlock` kini hanya adapter tipis; kontrak `FormBannerState`/autosave (`bannerFile`/`bannerPreviewUrl`/`bannerUrl`) tetap load-bearing dan tidak boleh diubah tanpa menelusuri builder + autosave.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-34.
