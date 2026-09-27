# ADR-0004 — Spaced ordering field (gap 1000)

- **Status:** Diterima
- **Tanggal:** 27 September 2026

## Konteks

Menyisipkan atau menggeser field di tengah daftar dengan order berurutan
(1, 2, 3, ...) memaksa menomori ulang semua baris setelah titik sisip — boros
tulisan, memperbesar diff, dan rawan balapan saat dua flush paralel mengubah
daftar yang sama.

## Keputusan

Gunakan **integer spasi (gap) 1000** untuk `order` field:

- **Alokasi murni:** `fieldMapping.ts` mengekspor `FIELD_ORDER_GAP = 1000`,
  `allocateSpacedOrder(prev, next)` (midpoint bila dua jangkar, ±gap bila satu
  ujung, `FIELD_ORDER_GAP` bila kosong), dan `allocateOrderRun(...)` untuk
  blok baris. `toBackendFields` menomori daftar baru 1000, 2000, 3000, ...
- **Diff minimal:** hanya baris yang benar-benar berubah yang ditandai kotor
  (`dirtyFields.ts`), sehingga insert tengah/depan tidak menulis ulang baris
  existing.
- **Backend:** `FieldOperationController` menulis `order` sebagai integer
  (`(int) $row['order']`) dalam satu transaksi `syncFields`, mendukung mode
  dirty-subset (lihat [ADR-0002](0002-dirty-sync-diff-snapshot.md)).
- **Anti-race 1062:** bila insert id identik memicu duplicate-key (dua flush
  paralel), controller mengulang `syncFields` sekali dengan snapshot baru —
  baris pemenang kini menjadi update, bukan 500/422.

## Konsekuensi

- `order` tidak lagi kontigu; sortir harus numerik di kedua sisi.
- Menyisipkan tak terbatas di antara dua nilai yang sama akan menghabiskan ruang
  (butuh renormalisasi kelak); pada gap 1000 ini jarang terjadi.
- Insert berulang tetap hanya mengotori baris baru, menjaga payload autosave
  kecil.

## Bukti

- Kode alokasi: `resources/js/components/modules/builder/fieldMapping.ts`
  (`FIELD_ORDER_GAP`, `allocateSpacedOrder`, `allocateOrderRun`,
  `toBackendFields`).
- Kode server: `app/Http/Controllers/Dashboard/Events/Forms/FieldOperationController.php`
  (`rowToModelAttributes` menulis `order`, `syncFields`, penanganan 1062 di
  sekitar baris 113-124 dan 132-194).
- Test: `tests/Feature/SpacedOrderSyncTest.php`,
  `resources/js/components/modules/builder/__tests__/spaced-ordering.test.ts`.
