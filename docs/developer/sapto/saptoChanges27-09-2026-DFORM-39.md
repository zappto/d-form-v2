# Sapto Changes — 27 September 2026 (DFORM-39 Mx-KL)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-38.md`](./saptoChanges27-09-2026-DFORM-38.md) (DFORM-38 Mx-J). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-39** — `[Mx-KL] fieldInvalidClass + varian button` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4, prioritas 4); DFORM-39 adalah cluster **K/L** — bagian terakhir dari rentang A–L. Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:289` (acceptance cluster K/L) + konvensi Mx `:260` + Aturan 10–14 `§3.2:66-81`. Rencana internal (gitignored): `docs/big-changes/plans/2026-09-27-DFORM-39-mx-kl-field-invalid-class-button-variants-plan.md`. Basis commit: `c42b146` (`docs(sapto,DFORM-38)`). Bukan god commit: 4 commit atomik.

Acceptance spec (verbatim): *"K/L: 7 file → `fieldInvalidClass` (util murni `lib`, maksimal 2 parameter); 16 titik → varian `buttonVariants` di `ui/button`. Acceptance: grep class error ad-hoc nihil di 7 file; grep varian inline nihil di 16 titik; suite ui hijau."*

## Ringkasan (TL;DR)

Dua kanal berbeda dalam satu ticket, disatukan karena sama-sama menyentuh `BannerPickerField` dan dipagari oleh **satu kontrak bersama F0**:

1. **K — kelas field invalid ad-hoc.** Idiom conditional `border-destructive/70 bg-red-50 …` terduplikasi di **8 file** (spec bilang 7; audit recon menemukan 8 — lihat Koreksi). Solusinya satu util murni `resources/js/lib/fieldInvalidClass.ts` (7 baris): `fieldInvalidClass(invalid: boolean): string` → `''` saat valid, dan saat invalid mengembalikan **superset 6 token** kanonik. Deklarasi lokal (`const invalidSegClass`, `const dateErrorClass`, helper `errorClass`) dihapus (Aturan 14). Idiom **berbeda** `aria-invalid:*` (attribute-driven) di `ui/input/Input.vue` + 6 primitif **di luar cakupan** → follow-up.

2. **L — varian tombol destructive inline.** 16 titik memakai tone destructive dengan kelas ad-hoc (`hover:bg-destructive`, border/teks destructive) alih-alih varian. Solusinya **2 varian baru** di `ui/button/index.ts` (`destructive-ghost`, `destructive-outline`) + adopsi ke call-site; `ConfirmationModal` memakai varian `destructive` yang sudah ada; 3 native `<button>` dikonversi literal.

F0 (util + 2 varian + 2 test) sengaja dikerjakan **lebih dulu** karena keduanya **kontrak bersama**: begitu util dan varian ada, lane K (7 file) dan lane L (11 file) bisa berjalan paralel **tanpa satu file punya dua penulis**. `BannerPickerField.vue` — satu-satunya file yang memakai keduanya (K via util, L via varian) — jadi milik lane L sepenuhnya.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 19:12 | `20c89ad` | zappto | DFORM-39 | feat(field-invalid,button): util `fieldInvalidClass` + 2 varian destructive turunan (Mx-KL F0) |
| 19:13 | `8a97e8a` | zappto | DFORM-39 | refactor(button): 13 titik varian destructive inline pakai varian kanonik (Mx-L) |
| 19:14 | `b4110c4` | zappto | DFORM-39 | refactor(field-invalid): 7 file pakai `fieldInvalidClass`, 4 deklarasi lokal dihapus (Mx-K) |
| 19:17 | `acf2410` | zappto | DFORM-39 | refactor(button): 3 native button destructive dikonversi ke `Button` (Mx-L Q3) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `c42b146` → `20c89ad` → `8a97e8a` → `b4110c4` → `acf2410`, @ `1790511127..1790511432 +0700` (19:12–19:17 WIB). Persis satu baris per commit; author `zappto`.

## Per-commit

#### `20c89ad` feat(field-invalid,button,DFORM-39): util fieldInvalidClass + 2 varian destructive turunan (Mx-KL F0)

- Apa (kontrak bersama, dikerjakan orchestrator sebelum lane):
    - **Util baru** `resources/js/lib/fieldInvalidClass.ts` (7 baris) — named export, tanpa default export, satu fungsi satu parameter (patuh konvensi Mx `:260` + Aturan 7 "maksimal 2 parameter"):

      ```ts
      const FIELD_INVALID_CLASS =
          'border-destructive/70 bg-red-50 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-red-500/10 dark:focus-visible:border-destructive/70';

      /** Kelas field invalid kanonik (border/ring destructive + latar merah); string kosong bila valid. */
      export function fieldInvalidClass(invalid: boolean): string {
          return invalid ? FIELD_INVALID_CLASS : '';
      }
      ```
    - **2 varian baru** di `resources/js/components/ui/button/index.ts:24-27` (mengikuti gaya varian `destructive` yang sudah ada):

      | Varian | Definisi kanonik |
      |---|---|
      | `destructive` (sudah ada, `:22-23`) | `border-destructive/10 bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40` |
      | `destructive-ghost` (**baru**) | `border-transparent bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40` |
      | `destructive-outline` (**baru**) | `border-destructive/30 bg-background text-destructive shadow-xs hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive` |

    - **2 test baru** sebagai artefak TDD:
        - `resources/js/lib/__tests__/fieldInvalidClass.test.ts` (18 baris, 2 tes / 5 asersi): `true` memuat `border-destructive/70` + `bg-red-50` + `focus-visible:border-destructive` + `dark:focus-visible:border-destructive/70`; `false` → `''`.
        - `resources/js/components/ui/button/__tests__/ButtonVariants.test.ts` (21 baris, 2 tes / 6 asersi): `destructive-ghost` memuat `text-destructive` + `hover:bg-destructive/10` + `shadow-none`; `destructive-outline` memuat `border-destructive/30` + `hover:border-destructive/40` + `hover:bg-destructive/10`.
- Diffstat (dari brief): **4 file, +50/−0**.
- Test (dari brief): TDD RED dulu (import util belum ada + varian belum terdefinisi) → GREEN **4/4**.
- Jira: DFORM-39.

#### `8a97e8a` refactor(button,DFORM-39): 13 titik varian destructive inline pakai varian kanonik (Mx-L)

- Apa: **13 titik** tone destructive inline → varian kanonik, di 11 file:
    - `<Button variant="ghost">` + tone destructive → **`destructive-ghost`** (7 titik): `pages/Dashboard/Users/Index.vue:276`, `pages/Dashboard/Recruitment/Index.vue:418`, `pages/Dashboard/Events/Forms/Show.vue:809`, `components/core/field/BannerPickerField.vue:213` & `:238`, `components/modules/dashboard/DashboardTopbar.vue:214`, `components/modules/builder/FormBuilderCanvasBuildView.vue:440`.
    - `<Button variant="outline">` + border/teks destructive → **`destructive-outline`** (5 titik): `pages/Dashboard/Events/Forms/Index.vue:227`, `pages/Dashboard/Events/Create.vue:295` & `:315`, `components/modules/dashboard/FormAnswerDetailSheet.vue:208`, `components/modules/dashboard/EventShowAsideRail.vue:203`.
    - `components/core/ConfirmationModal.vue:44` → varian `destructive` kanonik (yang sudah ada).
- Opasitas border kelompok outline **diseragamkan** ke `/30` + `hover:border-destructive/40` + `hover:bg-destructive/10` (penting: `/20`, `/25`, `/35` dan hover `/5` lama hilang).
- File yang sama sekaligus membawa sisi K `BannerPickerField` (`:65,:73` pakai `fieldInvalidClass`) — file ini satu pemilik (lane L).
- Diffstat (dari brief): **11 file, +20/−36**.
- Jira: DFORM-39.

#### `b4110c4` refactor(field-invalid,DFORM-39): 7 file pakai fieldInvalidClass, 4 deklarasi lokal dihapus (Mx-K)

- Apa: 7 file mengganti idiom conditional lokal dengan panggilan `fieldInvalidClass(...)`; deklarasi lokal jadi redundant dan dihapus (Aturan 14):
    - `components/ui/date-picker/SplitDateTimeField.vue:96` (ternary inline → util).
    - `components/ui/date-picker/TimeAmPmInput.vue:93,:109,:120` — `const invalidSegClass` dihapus.
    - `pages/Dashboard/Recruitment/Periods/Create.vue:132,:145,:158` — `const dateErrorClass` dihapus.
    - `pages/Dashboard/Recruitment/Periods/Edit.vue:218,:231,:244` — `const dateErrorClass` dihapus.
    - `components/modules/dashboard/recruitment/InterviewSessionCreateSheet.vue:151` — `const dateErrorClass` dihapus.
    - `components/modules/dashboard/events/EventDashboardForm.vue:460,:560,:597,:616,:683,:715` — helper `function errorClass(key)` dihapus, call-site jadi `fieldInvalidClass(Boolean(fieldError('…')))`.
    - `components/modules/dashboard/events/ComboboxTagInput.vue:232` (ternary → util).
- Diffstat (dari brief): **7 file, +25/−45**.
- Jira: DFORM-39.

#### `acf2410` refactor(button,DFORM-39): 3 native button destructive dikonversi ke Button (Mx-L Q3)

- Apa: 3 native `<button>` destructive → `<Button variant="destructive-ghost">` secara **literal** (keputusan user final, lihat Q3): `components/modules/dashboard/events/EventCard.vue:182-189`, `components/modules/dashboard/DashboardTopbar.vue:179-187`, `components/modules/builder/FieldEditor.vue:386-396`.
- Dikerjakan **setelah** lane L selesai karena `DashboardTopbar.vue` dipakai bersama (menghindari dua penulis pada satu file).
- Koreksi reviewer: `cursor-pointer` (kedua item menu) dan `select-none` (item topbar) **dikembalikan** karena hilang saat konversi — itu bukan bagian dari delta bentuk yang disetujui user (lihat Delta #7).
- Diffstat (dari brief): **3 file, +14/−9**.
- Jira: DFORM-39.

**Total DFORM-39** (dari brief): **24 file, +109/−90**.

## Deviasi & keputusan

Keputusan user lewat dua ronde tanya-jawab (plan §3). Ditulis apa adanya, termasuk rekomendasi orchestrator yang **ditolak**.

- **Q1 — cakupan K: 8 file** idiom conditional (`SplitDateTimeField`, `TimeAmPmInput`, `Periods/Create`, `Periods/Edit`, `InterviewSessionCreateSheet`, `EventDashboardForm`, `ComboboxTagInput`, `BannerPickerField`). `ui/input/Input.vue` memakai idiom **berbeda** (`aria-invalid:*`, attribute-driven, bukan boolean) → **di luar cakupan**, dicatat sebagai follow-up. Spec & recon menyebut 7 file; setelah audit ternyata 8 (BannerPickerField memakai dua idiom sekaligus).
- **Q2 — tone `destructive-ghost`: satu varian, merah saat diam** (`text-destructive`), **tanpa** varian muted. Konsekuensi yang **disetujui user**: 3 situs muted-at-rest (`BannerPickerField:215,240`, `DashboardTopbar:216`) + ikon `FieldEditor:388` menjadi **merah permanen**, bukan hanya saat hover. Ini delta user-visible (lihat Delta #1).
- **Q3 — 3 native `<button>`: konversi literal.** User awalnya memilih konversi. Orchestrator membaca kode, menemukan **2 dari 3 adalah item menu** (`DashboardTopbar:181` sejajar item `Link` "Profil" bergaya `rounded-sm px-2 py-1.5 text-sm`; `EventCard:184` sejajar item menu native lain bergaya `px-2 py-1.5 text-sm`), lalu melaporkan bahwa konversi literal membuat item itu berbeda tinggi/radius/bobot font dari tetangganya. **Ditanya ulang, user tetap memilih konversi literal** → implementasi = literal, delta diukur & dilaporkan (Delta #4).
- Rekomendasi yang **diterima tanpa pertanyaan**:
    - Opasitas border `destructive-outline` **diseragamkan** ke `/30` + `hover:border-destructive/40` + `hover:bg-destructive/10`.
    - `ConfirmationModal:44` memakai varian `destructive` **kanonik** (bukan varian baru).
    - `Events/Forms/Index:229` tetap menyimpan kelas layout (`h-11 w-full sm:h-9 text-xs`) di samping varian.

### Delta user-visible (jujur & lengkap)

1. **3 situs muted-at-rest → merah saat diam** (Q2): `BannerPickerField` ×2 ikon trash (`:213,:238`), `DashboardTopbar:214`; plus ikon `FieldEditor:387`.
2. **Opasitas outline diseragamkan**: `/20`, `/25`, `/35` → `/30`; hover border `/40` ditambah; hover bg `/5` → `/10` (`EventShowAsideRail`). Berlaku di 5 situs outline.
3. **`ConfirmationModal` BUKAN nol-delta**: border destructive `/30` → `/10` (nilai varian kanonik) + **ring fokus destructive baru**. Alasan teknis: `ui/alert-dialog/AlertDialogAction.vue:11` **tidak punya prop `variant`** — signature-nya `cn(buttonVariants(), props.class)` — jadi varian kanonik dipasok lewat `class` di `ConfirmationModal.vue:44`, tanpa menyentuh primitif `ui/alert-dialog`.
4. **Q3 (paling terlihat)**: 2 item menu naik **~32px → `h-10` 40px**, radius **0/2px → 8px** (`rounded-lg`), bobot **400/500 → 600** (`font-semibold`), padding-x **8 → 12px**, plus border 1px transparan dari basis `<Button>`. Ikon `FieldEditor` **tetap 32px** (`size-8` menimpa `size-9`) dengan radius `rounded-full`. Kedua item menu itu kini **berbeda bentuk dari tetangganya satu menu** — konsekuensi yang sudah diterima user, **perlu eyeball di browser**.
5. **State fokus** beberapa situs berubah dari `bg-destructive/*` → **ring destructive** (dari varian) = perbaikan, bukan regresi.
6. **Delta K yang wajar**: 5 situs ber-token-5 + 1 situs ber-token-3 kini mendapat **superset kanonik**, jadi bertambah `focus-visible:border-destructive` + `focus-visible:ring-destructive/20` + `dark:focus-visible:border-destructive/70` — tampak hanya saat field invalid **dan** difokus, serta di dark mode.
7. **Koreksi reviewer**: `cursor-pointer` (kedua item menu) dan `select-none` (item topbar) **dikembalikan** karena hilang saat konversi — itu bukan bagian dari delta bentuk yang disetujui user (3 item menu `EventCard` lain dan `Link` "Profil" memakai `cursor-pointer`; preflight Tailwind v4 tidak menyetel kursor untuk `<button>`).

### Langkah & koreksi yang didokumentasikan apa adanya

1. **Komentar basi dibersihkan**: `EventDashboardForm` masih menyimpan **6 baris komentar** yang menyebut helper `errorClass` (sudah dihapus) → dibersihkan bersamaan. Bukti tidak langsung: posisi `@ts-expect-error` pra-ada bergeser dari `:375` (brief) ke **`:369`** di tree final — persis −6 baris, konsisten dengan pembersihan komentar di atasnya.
2. **Literal error ketiga di `TimeAmPmInput:120`**: wrapper segmen AM/PM memakai literal error **ketiga** yang **tidak tercantum di brief lane** → ditemukan lane, diperbaiki orchestrator saat review. Ini sebabnya `TimeAmPmInput` punya 3 call-site util (bukan 2).
3. **`ConfirmationModal`**: contoh `:variant="…"` di brief **tidak bisa dipakai** karena `AlertDialogAction` tidak punya prop `variant` (lihat Delta #3) — diselesaikan lewat `class`.
4. Urutan kelas mengikuti `prettier-plugin-tailwindcss` pada file baru; lane **tidak** menjalankan `prettier --write`.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell** dan tidak bisa menjalankan `git`/`vitest`/`eslint`/build. Seluruh angka hasil perintah di bawah berasal dari brief orchestrator dan **tidak diverifikasi ulang secara independen** (ditandai "dari brief"). Yang **bisa** dan **sudah** diverifikasi langsung ke tree di HEAD (`acf2410`) adalah: isi util + 2 varian + 2 test, keberadaan call-site, import, bentuk 3 situs Q3, primitive `alert-dialog`, dan grep-grep acceptance (lihat bawah). SHA/waktu commit diverifikasi langsung dari reflog `.git/logs/HEAD`.

- **TDD F0** (dari brief): RED dulu (import util belum ada + varian belum terdefinisi) → GREEN 4/4.
- **Suite penuh** (dari brief): **56 file / 383 tes hijau**. Baseline sebelum F0: 54 file / 379 tes (F0 menambah 2 file / 4 tes). **Nol flip** pada test yang menyentuh titik perubahan: `ConfirmationModal.test.ts`, `BannerPickerField.test.ts`, `event-show-aside-rail.test.ts`, `form-delete.test.ts`, `delete-action.test.ts`, `mutation-button-pattern.test.ts`, `event-card-skeleton.test.ts`, `events-recruitment-skeleton.test.ts`, `user-area-skeleton.test.ts`.
- **`BannerPickerField.test.ts:150`** (diverifikasi langsung): mem-pin `wrapper.html()` memuat `border-destructive/70` → tetap lolos karena util memang memuat token itu.
- **eslint** (dari brief): exit 0 per lane (4 file F0, 11 file L, 7 file K, 3 file Q3).
- **prettier --check** (dari brief): 4 file baru F0 **bersih**; file lama yang disentuh **sudah merah PRA-ADA** (lane L 10 dari 11 merah, lane K 7/7 merah, Q3 3/3 merah) — dibuktikan lewat baseline sebelum menyunting, jadi **tidak ada file merah baru**; tidak ada `--write`.
- **build container** (dari brief): `podman exec -w /app d_form_app npm run build` → **✓ built in 16.50s**.
- **Grep acceptance (diverifikasi langsung ke tree final)**:
    - `hover:bg-destructive` → hanya `ui/button/index.ts:23,25,27` (3 definisi varian) + 2 asersi test `ButtonVariants.test.ts`; **nihil** di call-site. Memenuhi acceptance "grep varian inline nihil di 16 titik".
    - `border-destructive/70` → hanya `lib/fieldInvalidClass.ts:2` + test-nya (`fieldInvalidClass.test.ts:9,12`, `BannerPickerField.test.ts:150`) + `ui/input/Input.vue:33` (idiom `aria-invalid`, **di luar cakupan**). Memenuhi acceptance "grep class error ad-hoc nihil di 7 file" (tercapai untuk 8 file idiom conditional yang disetujui user).
    - `const dateErrorClass` / `const invalidSegClass` / `function errorClass(` → **nihil** di `resources/js`.
    - Pemakai `fieldInvalidClass` (import) = **8 file** sesuai cakupan Q1 — `BannerPickerField`, `ComboboxTagInput`, `EventDashboardForm`, `InterviewSessionCreateSheet`, `SplitDateTimeField`, `TimeAmPmInput`, `Periods/Create`, `Periods/Edit`. (Commit lane K `b4110c4` menyentuh 7 file; sisi K `BannerPickerField` ikut di commit lane L karena file itu satu pemilik.)
    - `variant="destructive-ghost"` = **10 situs** (7 ghost lama + 3 Q3). `variant="destructive-outline"` = **5 situs**.
- **`git status` akhir** (dari brief): bersih kecuali `Makefile` + `database/seeders/UserSeeder.php` (milik user, sengaja tidak disentuh) — tidak diverifikasi independen oleh penulis.

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:289` (acceptance K/L); konvensi Mx `:260` (*"prefix `I`/`G`/`T`, strict tanpa `any`/`unknown`/`!`/`as`, maksimal 2 parameter per fungsi, named export human-readable, tanpa default export di file baru, … semua fungsi baru berdoc singkat 1–2 baris (Aturan 13), tanpa kode redundant (Aturan 14)"*); Aturan 10–14 di `§3.2:77-81`. Kepatuhan yang terverifikasi: util memakai named export + `const` kelas bernama (bukan magic string tersebar, Aturan 11) + JSDoc 1 baris (Aturan 13) + satu fungsi satu parameter boolean (Aturan 7 & 10). `ui/button/index.ts` sudah ada sebelumnya sehingga varian baru mengikuti polanya (bukan file baru).

- **"7 file" → 8 file.** Recon menemukan idiom conditional `border-destructive/70` di **8 file**, bukan 7; plan menyebutnya eksplisit dan user mengesahkan cakupan 8. `ui/input/Input.vue` (idiom `aria-invalid:*`) tetap di luar karena mekanisme berbeda (attribute vs boolean).
- **"16 titik → varian `buttonVariants`"** dibagi menjadi: **13 titik** adopsi varian kanonik di commit lane L (`8a97e8a`: 7 ghost + 5 outline + 1 `ConfirmationModal`) + **3 native `<button>`** dikonversi di commit Q3 (`acf2410`). Total 16 titik. `ConfirmationModal` memakai varian **`destructive` yang sudah ada**, bukan varian baru.
- **Acceptance "grep class error ad-hoc nihil di 7 file"**: tercapai untuk 8 file cakupan; satu kemunculan sah tersisa di `ui/input/Input.vue` (di luar cakupan, dicatat sebagai follow-up).
- **Acceptance "grep varian inline nihil di 16 titik"**: tercapai — `hover:bg-destructive` hanya di definisi varian (diverifikasi langsung).
- **Acceptance "suite ui hijau"**: tercapai menurut brief (suite penuh 56 file / 383 tes); **tidak diverifikasi independen** oleh penulis dokumen. Catatan: `components/ui/**/__tests__` sebelumnya hanya 2 file / 16 tes (tidak ada test `ui/button`); F0 menambah `ButtonVariants.test.ts` sehingga suite ui bertambah.
- **Jumlah deklarasi lokal yang dihapus**: subjek commit `b4110c4` menulis *"4 deklarasi lokal dihapus"* — angka itu **kurang satu**, body commit-lah yang lengkap. Diverifikasi langsung dari diff commit (bukan dari brief): yang dihapus **5 deklarasi** = 4 `const` (`invalidSegClass` di `TimeAmPmInput`; `dateErrorClass` di `Periods/Create`, `Periods/Edit`, `InterviewSessionCreateSheet`) + 1 `function errorClass(key)` di `EventDashboardForm` — ditambah 6 baris komentar basi. Keempat nama itu **nihil** di tree final.

## Catatan untuk tim

- DFORM-39 adalah cluster **K/L** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; posisinya di prioritas 4. Ini bagian terakhir rentang A–L.
- **Follow-up terbuka (di luar cakupan ticket)**:
    1. **Idiom B — `aria-invalid:*`**: `ui/input/Input.vue` + 6 primitif ber-idiom attribute-driven (`ui/textarea`, `ui/checkbox`, `ui/button`, `ui/searchable-select`, `ui/input-group`) tetap duplikatif dengan util K; mekanismenya berbeda (attribute vs boolean) → kandidat ticket terpisah bila ingin benar-benar satu sumber.
    2. `@ts-expect-error` **pra-ada** di `EventDashboardForm:369` (set `form.errors[k]` manual) — bukan debt ticket ini.
    3. 20+ keluarga skeleton inline dari DFORM-38 (`.form-card-skeleton`, `.period-card-skeleton`, dst.) masih inline.
    4. Token `--animate-shimmer` (`resources/css/app.css:17`) + `@keyframes shimmer` (`:264`) **mati** (nol pemakai — grep `animate-shimmer` di `resources` hanya menemukan definisinya) — kandidat pembersihan terpisah.
    5. `prettier --check` repo masih merah pada sebagian file lama (semi/urutan kelas) — debt pra-ada.
- **Perlu eyeball di browser**: delta bentuk 2 item menu (Delta #4) dan 3 situs muted→merah (Delta #1); jsdom tak punya layout engine sehingga tinggi 32px→40px tidak terukur di test.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-39.
