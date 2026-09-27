# Sapto Changes — 27 September 2026 (DFORM-38 Mx-J)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-37.md`](./saptoChanges27-09-2026-DFORM-37.md) (DFORM-37 Mx-I). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-38** — `[Mx-J] EventCardSkeleton di atas ui/skeleton` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4, prioritas 4); DFORM-38 adalah cluster **J**. Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:288` (acceptance cluster J) + konvensi Mx `:260`. Rencana internal (gitignored): `docs/big-changes/plans/2026-09-27-DFORM-38-mx-j-event-card-skeleton-plan.md`. Bukan god commit: 2 commit atomik.

Acceptance spec (verbatim): *"J: 2 halaman → `EventCardSkeleton` di atas `ui/skeleton`. Acceptance: satu definisi skeleton; suite skeleton hijau."*

## Ringkasan (TL;DR)

Sebelum ticket ini **belum ada** `EventCardSkeleton`; yang ada hanya primitif `ui/skeleton/Skeleton.vue` (+ `ui/sidebar/SidebarMenuSkeleton.vue`). "2 halaman" ternyata sudah memakai `ui/skeleton` — jadi "di atas `ui/skeleton`" sudah berlaku, dan duplikasi nyatanya adalah **markup kartu (9 bar) + root class yang identik** (bukan primitif animasi; tidak ada `animate-pulse` mentah di halaman mana pun). Solusinya: satu komponen `components/modules/dashboard/events/EventCardSkeleton.vue` — **satu kartu, tanpa props**; jumlah item (`v-for` 8/6), grid, dan `aria-*` tetap milik halaman.

Dedup, bukan restyle: `shadow` dan `h-full` (dimiliki kartu asli) **sengaja tidak** disalin (D3). Marker class `event-card-skeleton` dipertahankan di root komponen sehingga 3 test yang mem-pin tidak perlu diubah (D4). Hasil: kedua halaman tak lagi meng-import `ui/skeleton`; `event-card-skeleton` kini hanya ada di komponen + test.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 19:06 | `afc54b4` | zappto | DFORM-38 | feat(event-card-skeleton): satu definisi skeleton kartu event + unit test (Mx-J F1-F2) |
| 19:06 | `a02dcad` | zappto | DFORM-38 | refactor(event-card-skeleton): 2 halaman event pakai `EventCardSkeleton` (Mx-J F3-F4) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `afc54b4` → `a02dcad`, @ `1790510778..1790510778 +0700` (19:06 WIB).

## Per-commit

#### `afc54b4` feat(event-card-skeleton,DFORM-38): satu definisi skeleton kartu event + unit test (Mx-J F1-F2)

- Apa: komponen baru `resources/js/components/modules/dashboard/events/EventCardSkeleton.vue` (24 baris) = satu kartu placeholder dengan **9 bar `ui/skeleton`**: header badge+kebab, banner `aspect-[16/7] rounded-xl`, metrik, dua baris teks, dan footer ber-border. Root memakai marker `event-card-skeleton border-border/60 bg-card flex min-w-0 flex-col gap-3 rounded-2xl border p-4 sm:p-5`. **Tanpa props** — jumlah item dan grid diatur pemanggil.
- Test baru `resources/js/components/modules/dashboard/events/__tests__/event-card-skeleton.test.ts` (20 baris, 1 tes / 3 asersi: root ber-marker, 9 `[data-slot="skeleton"]`, bar banner `aspect-[16/7]` bergaya `rounded-xl`). Artefak TDD (D6).
- Test: TDD RED (`Failed to resolve import "../EventCardSkeleton.vue"`, 0 tes terkumpul) → GREEN (1 tes lolos).
- Jira: DFORM-38.

#### `a02dcad` refactor(event-card-skeleton,DFORM-38): 2 halaman event pakai EventCardSkeleton (Mx-J F3-F4)

- Apa: `pages/Dashboard/Events/Index.vue` — blok baris ~205-225 → `<EventCardSkeleton v-for="n in 8" :key="`event-skeleton-${n}`" />`; `pages/Dashboard/User/Events.vue` — blok baris ~128-144 → `<EventCardSkeleton v-for="n in 6" :key="`event-${n}`" />`.
- Di kedua halaman: import komponen ditambah dan `import { Skeleton } from '@/components/ui/skeleton';` dihapus (D5).
- Grid pembungkus + `aria-busy="true"` / `aria-label="Memuat event"` **tidak berubah** (diverifikasi: `Events/Index.vue:199-206`, `User/Events.vue:127-129`).
- Diffstat (dari brief): 2 file, **+4/−40**.
- Jira: DFORM-38.

## Deviasi & keputusan

Keputusan yang disetujui user (plan D1–D7):

- **D1** — satu komponen `EventCardSkeleton.vue`, **satu kartu, tanpa props**; jumlah item/grid/`aria-*` tetap milik halaman.
- **D2** — varian rounding ikut `User/Events` (banner `rounded-xl`, badge `rounded-full`). Alasan: `Badge` basis `rounded-xl` = 12px (`components/ui/badge/index.ts:7`) dan pada bar `h-6` (24px) `rounded-full` juga 12px → identik visual dengan kartu asli; varian `Events/Index` (tanpa rounding → jatuh ke basis `rounded-md` 6px milik `Skeleton.vue`) yang menyimpang.
- **D3** — **tanpa `shadow`/`h-full`** (kartu asli `events/EventCard.vue:100` punya keduanya). J adalah dedup, bukan restyle; `h-full` juga no-op di grid (`align-items: stretch`).
- **D4** — kelas marker `event-card-skeleton` dipertahankan di root komponen → 3 test tidak perlu diubah.
- **D5** — import `Skeleton` dibuang dari kedua halaman (jadi tak terpakai).
- **D6** — satu test baru tipis (3 asersi) sebagai artefak TDD.
- **D7** — cakupan tetap 2 halaman; keluarga lain (`.form-card-skeleton`, `.period-card-skeleton`, `.queue-card-skeleton`, `.detail-card-skeleton`, `.highlight-card-skeleton`, `.event-row-skeleton`, `.applicant-row-skeleton`, …) dan halaman publik/landing/builder/`OpenRecruitment/**` **tidak** disentuh.

### Langkah & koreksi yang didokumentasikan apa adanya

1. **Koreksi angka dari brief orchestrator**: `user-area-skeleton.test.ts` ternyata berjalan **14 tes**, bukan 10. Terverifikasi di tree: file itu punya **10 `it(`** + **2 `it.each(['mine','browse'])`** (masing-masing 2 kasus) = **14 kasus uji**. Baseline 2 suite = **22 tes** (8 + 14), setelah penambahan = **23**.
2. **Komentar satu baris dipindah ke dalam root `<div>`**: dengan komentar di atas root, SFC terkompilasi jadi fragment multi-root dan `wrapper.classes()` (VTU) membaca node komentar → asersi pertama gagal. Setelah komentar pindah ke dalam root (`EventCardSkeleton.vue:7`), root menjadi satu elemen dan asersi lolos. Teks komentar tetap.
3. **Urutan kelas mengikuti `prettier-plugin-tailwindcss`** pada file baru (mis. `event-card-skeleton border-border/60 bg-card flex … rounded-2xl border …`); **himpunan kelas identik** dengan markup lama sehingga tidak ada perubahan visual.
4. `prettier --check` kedua halaman **merah sebelum dan sesudah** (dibuktikan dari versi HEAD: keduanya exit 1) → bukan debt baru; lane tidak menjalankan `--write`.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell** dan tidak bisa menjalankan `git`/`vitest`/`eslint`/build. Seluruh angka hasil perintah di bawah berasal dari brief orchestrator dan **tidak diverifikasi ulang secara independen** (ditandai "dari brief"). Yang **bisa** dan **sudah** diverifikasi langsung ke tree di HEAD adalah: isi komponen + test, markup kedua halaman, import, dan grep-grep acceptance (lihat bawah).

- **RED** (dari brief): `Failed to resolve import "../EventCardSkeleton.vue"` (0 tes terkumpul). **GREEN**: 1 tes lolos.
- 3 file test terkait (dari brief): **3 file / 23 tes hijau** (8 + 14 + 1), nol tes halaman berubah/pecah. Jumlah 8 (`events-recruitment-skeleton.test.ts`) dan 14 (`user-area-skeleton.test.ts`) **diverifikasi langsung** ke tree.
- **Suite penuh** (dari brief): **54 file / 379 tes hijau** (sebelumnya 53/378).
- **Lint/format** (dari brief): `npx eslint` 4 file → **exit 0**; `prettier --check` 2 file BARU → **bersih**; 2 halaman → merah (pra-ada, lihat deviasi 4).
- **Build** (dari brief): `podman exec -w /app d_form_app npm run build` → **✓ built in 13.81s**.
- **Grep acceptance** (diverifikasi langsung ke tree):
    - `event-card-skeleton` → hanya di `EventCardSkeleton.vue:6`, test komponen `event-card-skeleton.test.ts:13`, dan test halaman `events-recruitment-skeleton.test.ts` (×3) + `user-area-skeleton.test.ts` (×1) — sesuai D4.
    - `ui/skeleton` **tidak** di-import kedua halaman (`Events/Index.vue`, `User/Events.vue` hanya meng-import `EventCardSkeleton`).
    - `<Skeleton` manual **0** di kedua halaman.
    - Jumlah bar per kartu tetap **9** (`[data-slot="skeleton"]` → 9) dan jumlah kartu tetap **8** (`Events/Index.vue:205`) / **6** (`User/Events.vue:128`).

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md:288`; konvensi Mx `:260`.

- **"di atas `ui/skeleton`" sudah berlaku sebelum ticket**: kedua halaman sudah memakai `Skeleton.vue`; duplikasi yang nyata adalah markup kartu + root class, bukan primitif animasi.
- **"2 halaman" sesuai**: satu-satunya dua tempat ber-marker `event-card-skeleton` (selain komponen) adalah `Events/Index.vue` dan `User/Events.vue`.
- **Acceptance "satu definisi skeleton" tercapai**: 9 bar kini didefinisikan sekali di `EventCardSkeleton.vue`.
- **Acceptance "suite skeleton hijau"** tercapai menurut brief (3 file/23 tes; suite penuh 54/379); **tidak diverifikasi independen** oleh penulis dokumen.
- Recon plan menyebut `user-area-skeleton.test.ts` = 10 tes; angka eksekusi yang benar adalah **14** (10 `it(` + 2 `it.each` × 2) — plan memakai hitungan deklarasi `it(`, lane memakai hitungan kasus uji.

## Catatan untuk tim

- DFORM-38 adalah cluster **J** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; posisinya di prioritas 4.
- **Follow-up terbuka**:
    1. 20+ keluarga skeleton lain (`.form-card-skeleton`, `.period-card-skeleton`, `.queue-card-skeleton`, `.detail-card-skeleton`, `.highlight-card-skeleton`, `.event-row-skeleton`, `.applicant-row-skeleton`, dst.) masih inline — kandidat ticket lanjutan, di luar J.
    2. Token animasi `--animate-shimmer` (`resources/css/app.css:17`) + `@keyframes shimmer` (`:264`) **mati** (nol pemakai — grep `animate-shimmer` di `resources/js` nihil) — kandidat pembersihan terpisah.
    3. `prettier --check` repo masih merah pada sebagian file lama (semi/urutan kelas) — debt pra-ada.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-38.
