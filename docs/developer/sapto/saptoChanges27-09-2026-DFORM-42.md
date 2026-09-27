# Sapto Changes — 27 September 2026 (DFORM-42 Field)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-39.md`](./saptoChanges27-09-2026-DFORM-39.md) (DFORM-39 Mx-KL). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-42** — `[Field] Konsolidasi idiom kelas error `aria-invalid:*` (6 primitif)`. Ini **follow-up langsung** dari DFORM-39: dokumen itu mencatat *idiom B — `aria-invalid:*`* (`ui/input/Input.vue` + 6 primitif attribute-driven) sebagai follow-up terbuka #1 di bagian "Catatan untuk tim". Basis commit: `72aabaf` (`docs(agents): aturan wajib …`). Bukan god commit: 2 commit atomik.

Di sini tidak ada acceptance spec verbatim dari `docs/big-changes/**`; motivasi tunggalnya adalah Aturan 6 & 14 AGENTS.md (satu duplikasi → satu sumber; tanpa redundansi). Aturan 11 juga disitir sebagai dasar pengecualian `resources/js/components/ui/**` (lihat Deviasi).

## Ringkasan (TL;DR)

Idiom atribut `aria-invalid:*` (mekanisme attribute-driven, berbeda dari idiom boolean `fieldInvalidClass` di DFORM-39) terduplikasi sebagai literal di **5 primitif** `components/ui/**`: `Input.vue`, `Textarea.vue`, `Checkbox.vue`, base `button/index.ts`, dan `SearchableSelect.vue`. Solusinya satu modul murni baru `resources/js/lib/ariaInvalidClass.ts` dengan **2 konstanta**:

- `ariaInvalidBorderClass` = `aria-invalid:border-destructive dark:aria-invalid:border-destructive/70`
- `ariaInvalidRingClass` = `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40`

Token yang dipindahkan **dihapus dari string aslinya** sehingga tidak ada duplikat. F0 (`87ecb1b`) membuat kontrak + test; K (`6be31f6`) memigrasikan kelima primitif. `ui/input-group/InputGroup.vue` **sengaja tidak disentuh** karena prefix selector-nya `has-[[data-slot][aria-invalid=true]]:` tidak bisa berbagi konstanta. Dampak perilaku user: **4 primitif kini mendapat `dark:aria-invalid:border-destructive/70`** (border invalid di dark mode jadi 70%, sebelumnya penuh) — delta kecil yang disetujui sadar dan **belum di-eyeball di browser**.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 19:38 | `87ecb1b` | zappto | DFORM-42 | feat(field): kontrak token `aria-invalid` (F0) |
| 19:43 | `6be31f6` | zappto | DFORM-42 | refactor(field): 5 primitif pakai token `ariaInvalidClass` (K) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `72aabaf` → `87ecb1b` → `6be31f6` (di antara commit doc/pembuka lain, lihat Catatan untuk tim). Epoch `1790512709` (F0) dan `1790513020` (K) `+0700` → 19:38 & 19:43 WIB. Persis satu baris per commit; author `zappto`.

## Per-commit

#### `87ecb1b` feat(field,DFORM-42): kontrak token aria-invalid (F0)

- Apa: modul murni baru `resources/js/lib/ariaInvalidClass.ts` (5 baris) — **2 konstanta named-export** (tanpa default export), masing-masing berdoc satu baris (Aturan 13):

    ```ts
    /** Kelas border field invalid untuk idiom attribute `aria-invalid="true"` (satu sumber untuk 5 primitif form). */
    export const ariaInvalidBorderClass = 'aria-invalid:border-destructive dark:aria-invalid:border-destructive/70';

    /** Kelas ring field invalid untuk idiom attribute `aria-invalid="true"` (satu sumber untuk 5 primitif form). */
    export const ariaInvalidRingClass = 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40';
    ```

- Test baru `resources/js/lib/__tests__/ariaInvalidClass.test.ts` (22 baris, 2 tes / 4 token): konstanta border di-`split(' ')` dan di-`toEqual(['aria-invalid:border-destructive', 'dark:aria-invalid:border-destructive/70'])`; konstanta ring → `['aria-invalid:ring-destructive/20', 'dark:aria-invalid:ring-destructive/40']`.
- Jira: DFORM-42.

#### `6be31f6` refactor(field,DFORM-42): 5 primitif pakai token ariaInvalidClass (K)

- Apa: lima primitif `components/ui/**` mengganti literal `aria-invalid:*` dengan 2 konstanta; token yang dipindahkan dihapus dari string aslinya (tanpa duplikat):
    - `ui/input/Input.vue` — literal jadi **2 argumen `cn(...)`** (baris `ariaInvalidBorderClass, ariaInvalidRingClass`). `aria-invalid:bg-red-50 dark:aria-invalid:bg-red-500/10` **tetap inline** karena pemakaian tunggal (hanya Input yang punya tint latar invalid).
    - `ui/textarea/Textarea.vue` — substring token dikeluarkan dari string panjang `cn(...)`, kini 2 argumen konstanta.
    - `ui/checkbox/Checkbox.vue` — idem (substring dikeluarkan dari string panjang).
    - `ui/button/index.ts` — base `cva` pertama berubah dari string literal jadi **template literal** (`` `… focus-visible:ring-[3px] ${ariaInvalidBorderClass} ${ariaInvalidRingClass}` ``).
    - `ui/searchable-select/SearchableSelect.vue` — `triggerClass` (computed) kini template literal `\`${ariaInvalidBorderClass} ${ariaInvalidRingClass}\``.
- `ui/input-group/InputGroup.vue` **tidak disentuh**: prefix selector `has-[[data-slot][aria-invalid=true]]:` tidak bisa berbagi konstanta (mekanisme selector, bukan kelas langsung).
- Jira: DFORM-42.

## Deviasi & keputusan

- **Opsi B (disetujui user)**: satu konstanta border versi kaya dipakai kelima primitif → 4 primitif (Textarea, Checkbox, base button, SearchableSelect) **kini mendapat `dark:aria-invalid:border-destructive/70`**; border invalid di dark mode jadi **70% dari sebelumnya penuh**. Ini delta visual kecil yang **disetujui sadar**, dan **BELUM di-eyeball di browser** (dicatat sebagai sisa verifikasi, bukan selesai).
- **Pengecualian tercatat — `resources/js/components/ui/**`**: `AGENTS.md` melarang mengubah `ui/**`, tetapi user menyetujui pengecualian ini karena **kelima primitif itulah satu-satunya sumber idiom `aria-invalid:*`** (lanjutan `20c89ad` DFORM-39 yang lebih dulu menyentuh `ui/button/index.ts`). Alasan tertulis satu baris ini memenuhi Aturan 11 AGENTS.md (hardcode/pengecualian lintas-pakai wajib beralasan tertulis).
- **`InputGroup.vue` dikecualikan** dengan alasan teknis di atas (bukan pilihan gaya) — sehingga judul "6 primitif" dihitung 5 migrasi + 1 pengecualian.

### Delta user-visible (jujur)

1. **Dark mode border invalid 4 primitif** (Textarea, Checkbox, base button, SearchableSelect): `dark:aria-invalid:border-destructive` (penuh) → `dark:aria-invalid:border-destructive/70`. Tampak hanya di **dark mode** saat field invalid. Belum di-eyeball.
2. `Input.vue` sudah memakai `/70` sebelumnya → **tidak berubah** untuk border; ring juga sama.
3. Tidak ada string copy, ukuran, atau tata letak yang berubah.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell** dan tidak bisa menjalankan `git`/`vitest`/`eslint`/build. Angka hasil perintah di bawah berasal dari brief orchestrator dan **tidak diverifikasi ulang secara independen** (ditandai "dari brief"). Yang **bisa** dan **sudah** diverifikasi langsung ke tree di HEAD (`20b6235`) adalah: isi modul + test, pemakaian konstanta di kelima primitif, `InputGroup.vue` tidak diubah, dan grep token bare (lihat bawah). SHA/waktu commit diverifikasi dari reflog `.git/logs/HEAD`.

- **Suite penuh** (dari brief): **58 file / 386 tes hijau**. Baseline pra-F0: 56 file / 383 tes (F0 menambah 1 file / 2 tes + DFORM-43 menambah 1 file / 1 tes — lihat dokumen DFORM-43). **Nol flip**.
- **eslint** (dari brief): bersih.
- **Grep acceptance (diverifikasi langsung ke tree final)**:
    - Token bare `aria-invalid:border-destructive` + `aria-invalid:ring-destructive` **hanya** tersisa di `lib/ariaInvalidClass.ts:2,5` + test `ariaInvalidClass.test.ts` (4 baris asersi) — memenuhi acceptance "grep token bare hanya tersisa di `lib/ariaInvalidClass.ts`".
    - `ariaInvalidBorderClass` / `ariaInvalidRingClass` di-import pemakai di **5 primitif** (`ui/input`, `ui/textarea`, `ui/checkbox`, `ui/button/index.ts`, `ui/searchable-select`) — cocok brief.
    - `InputGroup.vue` masih memakai `has-[[data-slot][aria-invalid=true]]:` (tidak disentuh).
- **Fakta pendukung** (boleh dikutip, dari brief): 47 binding `:aria-invalid` (7 internal primitif + 40 consumer) **tidak diubah**; tidak ada test yang mem-pin kelas `aria-invalid:*` (hanya attribute: `SearchableSelect.test.ts:134,143`, `BannerPickerField.test.ts:151`); Tailwind terbukti memindai file `.ts` (kelas util ada di CSS hasil build).
- **Sisa verifikasi**: eyeball 1 field invalid di **dark mode** untuk delta `/70` (belum dilakukan).

## Koreksi & temuan

- Judul ticket menyebut **"6 primitif"**, tetapi migrasi nyatanya **5**; primitif ke-6 (`ui/input-group/InputGroup.vue`) **tidak bisa** ikut karena selector `has-[[data-slot][aria-invalid=true]]:` tidak bisa memakai konstanta kelas — dicatat sebagai pengecualian, bukan terlewat.
- Varian `bg-red-50` tetap inline di `Input.vue`: pemakaian **tunggal**, jadi tidak ada duplikat yang perlu diangkat (Aturan 14 tidak menuntut abstraksi atas satu pemakai).
- Tidak ada test yang mem-pin kelas `aria-invalid:*` → nol flip dapat dibenarkan tanpa menyentuh test.

## Catatan untuk tim

- DFORM-42 adalah **lanjutan follow-up DFORM-39** (idiom B). Dengan selesainya ticket ini, idiom error field punya **dua sumber kanonik** yang eksplisit berbeda mekanisme: `lib/fieldInvalidClass.ts` (boolean) dan `lib/ariaInvalidClass.ts` (attribute).
- Commit DFORM-42 **terinterleaved** dengan commit doc/pembuka lain di rentang yang sama (`3cf2b09` track AGENTS.md, `72aabaf` aturan wajib, `1091a0f` front-end.md §7.1, `7680d67` pengecualian builder) dan dengan DFORM-43. Dokumen ini hanya mendaftar commit ber-issue DFORM-42; commit doc/di antaranya tidak dihitung.
- **Perlu eyeball di browser**: delta dark mode `/70` (Delta #1).
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-42.
