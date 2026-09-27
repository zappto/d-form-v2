# ADR-0002 — Dirty-sync diff berbasis snapshot sukses terakhir

- **Status:** Diterima
- **Tanggal:** 27 September 2026

## Konteks

Mengirim seluruh daftar field dan seluruh header pada setiap perubahan boros
payload, dan flush paralel berisiko balapan. Dua risiko lain: server menafsirkan
payload penuh yang tidak memuat suatu baris sebagai "hapus baris itu", dan
hydrate dari server bisa menimpa perubahan lokal yang belum tersimpan.

## Keputusan

Sinkronisasi dikirim sebagai **diff terhadap snapshot sukses terakhir**, bukan
payload penuh:

- **Diff per-id:** `dirtyFields.ts` menyediakan `snapshotBackendFields()` dan
  `diffBackendFields(current, lastSent)`. Baris dianggap kotor bila id baru atau
  serialisasi JSON-nya berubah (termasuk `order`); id snapshot yang hilang dari
  current menjadi `deleted_ids`. Snapshot diperbarui **hanya setelah save
  sukses**.
- **Mode dirty-subset:** keberadaan key `deleted_ids` di payload menandai
  payload parsial, sehingga server (`FieldOperationController`) tidak menerapkan
  diff omission legacy (yang akan menghapus baris bersih yang tidak ikut
  terkirim). Payload penuh lama tetap didukung untuk kompatibilitas.
- **Guard hydrate:** `autosaveGuard.ts::shouldSkipHydrate()` melewati hydrate
  bila id form sama, ada snapshot bersih, dan kanvas kotor atau ada file banner
  pending.
- **Beacon unload:** `buildUnloadPayload()` mengirim field penuh + `deleted_ids`
  terkini via `navigator.sendBeacon`, atau `null` bila tidak ada perubahan.
- **Anti-race:** `useAutosaveSync` tidak pernah menjalankan save overlap —
  flush saat save in-flight hanya mengantrekan satu flush susulan (debounce
  800ms).

## Konsekuensi

- Server wajib membaca mode parsial dari kehadiran `deleted_ids`; menghilangkan
  key itu akan memicu penghapusan baris bersih.
- `JSON.stringify` per baris hanya dipakai saat flush (bukan saat mengetik)
  agar tetap murah.
- Status autosave tetap konsisten lewat guard sequence di `useAutosaveSync`.
- Perubahan yang belum sukses tidak pernah menjadi baseline diff berikutnya.

## Bukti

- Kode diff/guard: `resources/js/components/modules/builder/dirtyFields.ts`,
  `resources/js/components/modules/builder/autosaveGuard.ts`,
  `resources/js/components/modules/builder/fieldMapping.ts`.
- Hook: `resources/js/hooks/useBuilderAutosave.ts`,
  `resources/js/hooks/useAutosaveSync.ts`.
- Kode server: `app/Http/Controllers/Dashboard/Events/Forms/FieldOperationController.php`
  (`$partialMode = array_key_exists('deleted_ids', $validated)`, sekitar baris 36).
- Test: `tests/Feature/DirtyFieldSyncTest.php`,
  `resources/js/components/modules/builder/__tests__/hydrate-guard.test.ts`,
  `resources/js/hooks/__tests__/useBuilderAutosave.test.ts`.
