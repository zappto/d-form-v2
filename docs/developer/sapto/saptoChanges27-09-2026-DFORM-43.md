# Sapto Changes — 27 September 2026 (DFORM-43 Skeleton)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-38.md`](./saptoChanges27-09-2026-DFORM-38.md) (DFORM-38 Mx-J) dan DFORM-39. Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-43** — `[Skeleton] Dedup keluarga skeleton yang benar-benar terduplikasi`. Ini follow-up keluarga skeleton inline yang dicatat DFORM-38 sebagai follow-up terbuka (`.form-card-skeleton`, `.period-card-skeleton`, dst.), tetapi dipersempit oleh recon ke keluarga yang **benar-benar** terduplikasi lintas halaman. Basis commit: `87ecb1b` (F0 DFORM-42). Bukan god commit: 3 commit atomik.

Di sini tidak ada acceptance spec verbatim dari `docs/big-changes/**`; kriteria seleksi mengikuti Aturan 6 & 14 AGENTS.md (dedup hanya bila ada duplikasi nyata) dan keputusan DFORM-38 (satu kartu, tanpa props).

## Ringkasan (TL;DR)

Recon menemukan **54 marker / 80 situs / 30 file** skeleton inline. Dari jumlah itu hanya **3 keluarga lintas halaman**, dan hanya **satu** yang markup-nya identik — `kpi-skeleton` (2 bar sama persis). Karena itu cakupan ticket dipersempit ke **hanya keluarga `kpi-skeleton`**: satu komponen `components/modules/dashboard/KpiCardSkeleton.vue` — **satu kartu, tanpa props** (pola DFORM-38) — lalu 3 halaman memakainya. Keluarga `hero-skeleton` (8/13/1 bar) dan `form-card-skeleton` (10/4 bar) **tidak** diangkat karena markup berbeda antar situs → butuh props, bertentangan dengan keputusan DFORM-38. 47 marker lain hanya punya **1 situs** → tidak layak diekstrak (Aturan 14/YAGNI).

Delta satu-satunya: **`Dashboard/Index.vue` berubah dari `shadow-sm` ke `shadow-xs`** (mengikuti komponen; `Laporan.vue` & `User/Index.vue` memang sudah `shadow-xs`). Jumlah kartu, `:key`, kelas grid, `v-if`/`v-else`, `aria-busy`/`aria-label`, dan blok `<KpiCard>` nyata tidak berubah.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 19:38 | `114848b` | zappto | DFORM-43 | feat(skeleton): `KpiCardSkeleton` satu kartu (F0) |
| 19:43 | `a4d4ee1` | zappto | DFORM-43 | style(skeleton): rapikan `KpiCardSkeleton` agar lolos `prettier --check` |
| 19:43 | `20b6235` | zappto | DFORM-43 | refactor(skeleton): 3 halaman pakai `KpiCardSkeleton` (K) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `87ecb1b` → `114848b` → … → `a4d4ee1` → `20b6235` (HEAD). Epoch `1790512709` (F0) dan `1790513020` (style & K) `+0700` → 19:38 & 19:43 WIB. Persis satu baris per commit; author `zappto`.

## Per-commit

#### `114848b` feat(skeleton,DFORM-43): KpiCardSkeleton satu kartu (F0)

- Apa: komponen baru `resources/js/components/modules/dashboard/KpiCardSkeleton.vue` (11 baris) — **satu kartu placeholder tanpa props**; root ber-marker `kpi-skeleton` dengan `border-border/70 rounded-2xl border p-4 shadow-xs`, dan **2 bar `Skeleton`** (`h-3 w-1/2` label + `mt-2 h-7 w-1/3` angka). Jumlah kartu dan grid tetap milik pemanggil.
- Test baru `resources/js/components/modules/dashboard/__tests__/kpi-card-skeleton.test.ts` (17 baris, 1 tes / 3 asersi): root memuat kelas `kpi-skeleton`, ada **2** `[data-slot="skeleton"]`, dan `wrapper.props()` = `{}` (tanpa props).
- Jira: DFORM-43.

#### `a4d4ee1` style(skeleton,DFORM-43): rapikan KpiCardSkeleton agar lolos prettier --check

- Apa: perbaikan format file F0 (kelas root diurutkan kanonik plugin `prettier-plugin-tailwindcss`). File F0 sempat **tertinggal merah** saat verifikasi orchestrator → dirapikan. Tidak ada perubahan kelas/himpunan, hanya urutan dan format.
- Jira: DFORM-43.

#### `20b6235` refactor(skeleton,DFORM-43): 3 halaman pakai KpiCardSkeleton (K)

- Apa: 3 halaman mengganti markup kartu KPI inline dengan komponen:
    - `pages/Dashboard/Index.vue:63` → `<KpiCardSkeleton v-for="n in 4" :key="\`kpi-${n}\`" />` (grid skeleton `sm:grid-cols-2 xl:grid-cols-4`, `aria-busy="true"`, `aria-label="Memuat ringkasan"`).
    - `pages/Dashboard/Events/Laporan.vue:76` → `<KpiCardSkeleton v-for="n in 3" :key="\`kpi-${n}\`" />` (grid `sm:grid-cols-3`, `aria-label="Memuat ringkasan laporan"`).
    - `pages/Dashboard/User/Index.vue:69` → `<KpiCardSkeleton v-for="n in 3" :key="\`kpi-${n}\`" />` (grid `sm:grid-cols-3`, `aria-label="Memuat ringkasan dasbor"`).
- Di ketiga halaman: import komponen ditambah; **import `Skeleton` tetap** karena masih dipakai keluarga skeleton lain (kartu/modul/form/hero di halaman yang sama). Jumlah kartu (4/3/3), `:key`, kelas grid, `v-if`/`v-else`, `aria-busy`/`aria-label`, dan blok `<KpiCard>` nyata **tidak berubah**.
- Jira: DFORM-43.

## Deviasi & keputusan

- **Cakupan = hanya keluarga `kpi-skeleton`.** Dasar keputusan (dari brief/recon): 54 marker / 80 situs / 30 file; hanya 3 keluarga lintas halaman; hanya `kpi-skeleton` yang markup-nya **identik** (2 bar sama persis); **47 marker hanya punya 1 situs** → tidak layak diekstrak (Aturan 14/YAGNI).
- **`hero-skeleton` (8/13/1 bar) dan `form-card-skeleton` (10/4 bar)** beda markup antar situs → butuh props, **bertentangan dengan keputusan DFORM-38** (satu kartu, tanpa props) → tidak diangkat.
- **Shadow komponen = `shadow-xs`** (bukan `shadow-sm` milik `KpiCard` nyata, `KpiCard.vue:35`). Konsekuensi: `Dashboard/Index.vue` berubah `shadow-sm` → `shadow-xs`; `Laporan.vue` & `User/Index.vue` memang sudah `shadow-xs` sehingga tidak terlihat berubah.
- Komponen mengikuti pola DFORM-38 (`EventCardSkeleton`): satu kartu, tanpa props, marker class dipertahankan di root agar test halaman tidak perlu diubah.

### Delta user-visible (jujur)

1. **`Dashboard/Index.vue`**: bayangan kartu skeleton KPI `shadow-sm` → `shadow-xs` (lebih tipis). `Laporan.vue` & `User/Index.vue` tidak berubah (sudah `shadow-xs`). Perlu eyeball 1 halaman.
2. Jumlah kartu (4/3/3), grid, `aria-*`, dan blok `<KpiCard>` nyata tidak berubah.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell** dan tidak bisa menjalankan `git`/`vitest`/`eslint`/build. Angka hasil perintah di bawah berasal dari brief orchestrator dan **tidak diverifikasi ulang secara independen** (ditandai "dari brief"). Yang **bisa** dan **sudah** diverifikasi langsung ke tree di HEAD (`20b6235`) adalah: isi komponen + test, pemakaian di 3 halaman, kesamaan kelas root, dan grep marker (lihat bawah). SHA/waktu commit diverifikasi dari reflog `.git/logs/HEAD`.

- **Suite penuh** (dari brief): **58 file / 386 tes hijau**. Pin `.kpi-skeleton` tetap: **=4** di `pages/Dashboard/Index` (`scan-dashboard-eventshow-skeleton.test.ts:253`), **=3** di `Laporan` & **=3** di `User/Index` (`laporan-user-eventdetail-skeleton.test.ts:212,252`) — **diverifikasi langsung** ke tree.
- **eslint** (dari brief): bersih.
- **Grep marker (diverifikasi langsung ke tree final)**:
    - `kpi-skeleton` **nihil** di ketiga halaman (`pages/Dashboard/Index.vue`, `Events/Laporan.vue`, `User/Index.vue`) — literal-nya hilang karena kini memakai komponen (hasil yang benar).
    - `kpi-skeleton` tersisa hanya di: komponen `KpiCardSkeleton.vue:6` (marker), test komponen `kpi-card-skeleton.test.ts`, dan **2 file test halaman** (`scan-dashboard-eventshow-skeleton.test.ts:253`, `laporan-user-eventdetail-skeleton.test.ts:212,252`).
    - `KpiCardSkeleton` di-import tepat di **3 halaman** + test komponen; `import { Skeleton }` tetap ada di ketiga halaman.
- **Sisa verifikasi**: eyeball 1 halaman untuk delta shadow `shadow-sm` → `shadow-xs` (belum dilakukan).

## Koreksi & temuan

- **F0 tertinggal merah `prettier --check`**: komponen F0 sempat gagal format lalu dirapikan di commit terpisah (`a4d4ee1`). Ini pola yang sama seperti DFORM-39 — lane tidak menjalankan `prettier --write` pada file lama, tetapi file **baru** harus lolos; koreksi dilakukan sebagai commit atomik tersendiri.
- Recon DFORM-38 menyebut "20+ keluarga skeleton inline" sebagai follow-up; ticket ini menunjukkan bahwa dari 54 marker nyatanya **hanya 1 keluarga** (`kpi-skeleton`) yang layak diekstrak tanpa props — sisanya 1 situs atau beda markup. Ini mempersempit follow-up DFORM-38 secara jujur.
- `54 marker / 80 situs / 30 file` dan rincian bar `hero-skeleton`/`form-card-skeleton` adalah **angka recon dari brief**, tidak dihitung ulang independen oleh penulis (tanpa shell). Yang diverifikasi langsung: keberadaan marker `hero-skeleton` dan `form-card-skeleton` sebagai markup inline (bukan komponen) di tree.

## Catatan untuk tim

- Keluarga skeleton yang **masih inline** dan **tidak** masuk cakupan ini tetap kandidat ticket lanjutan: `hero-skeleton` (butuh props), `form-card-skeleton` (butuh props), `.period-card-skeleton`, `.queue-card-skeleton`, `.detail-card-skeleton`, `.highlight-card-skeleton`, `.event-row-skeleton`, `.applicant-row-skeleton`, dst. (mayoritas 1 situs).
- Commit DFORM-43 **terinterleaved** dengan commit DFORM-42 dan beberapa commit doc/aturan di rentang yang sama; dokumen ini hanya mendaftar commit ber-issue DFORM-43.
- **Perlu eyeball di browser**: delta shadow 1 halaman (Delta #1); jsdom tak punya layout engine sehingga bayangan tidak terukur di test.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-43.
