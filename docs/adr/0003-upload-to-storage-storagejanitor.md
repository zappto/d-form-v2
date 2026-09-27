# ADR-0003 — Upload-to-storage terpusat & StorageJanitor

- **Status:** Diterima
- **Tanggal:** 27 September 2026

## Konteks

File upload (banner event/form, gambar opsi, avatar, dokumen rekrutmen, berkas
jawaban) menumpuk di storage karena: file lama tetap ada saat diganti, dan file
milik pemilik yang di-hard-delete tidak ikut terhapus. Selain itu gambar opsi
checkbox/radio sempat disimpan sebagai base64 inline di DB, bukan sebagai file.
Logika penghapusan juga berpotensi terduplikasi per model.

## Keputusan

Satukan keputusan hapus di satu helper, dan simpan upload sebagai path disk:

- **Helper pusat:** `App\Support\StorageJanitor` dengan kontrak
  `deletePublic(?string)`, `deleteLocal(?string)`, `deletePublicMany(array)`,
  `formAnswerPaths(mixed)`, dan `metadataImagePaths(mixed)`. Semua guard
  (lewati blank, `data:`-URI, dan URL `http(s)`; strip prefix `storage/`; cek
  `exists`) milik helper — satu sumber kebenaran.
- **Observer tipis per model** (`EventObserver`, `FormObserver`,
  `FormFieldObserver`, `FormAnswerObserver`, ...), diregistrasi lewat atribut
  `#[ObservedBy]` di model. Observer hanya tahu kolom filenya.
- **Urutan cascade:** anak di-force-delete di hook `forceDeleting` (berjalan
  sebelum baris induk terhapus, FK aman), file milik kolom sendiri dihapus di
  `forceDeleted`. Model tanpa `SoftDeletes` (`FormAnswer`) memakai hook
  `deleted` karena `forceDelete()` bawaannya hanya memanggil `delete()`.
- **Upload baru:** `FieldOperationController` menyimpan banner ke
  `forms/banners` dan gambar opsi ke `forms/options` (disk `public`); DB hanya
  menyimpan path. Gambar opsi lama yang digantikan dihapus lewat
  `StorageJanitor::deletePublic`.
- **Soft delete tidak menyentuh storage** — restore tetap utuh.

## Konsekuensi

- File yatim akibat hard-delete tidak lagi menumpuk; file lama yang terlanjur
  yatim sebelum perubahan ini di luar scope (butuh command sapu terpisah).
- `deletePublic`/`deleteLocal` idempoten dan aman terhadap nilai non-path
  (blank/`data:`/URL eksternal), sehingga observer tidak perlu guard sendiri.
- Baris DB lama ber-base64 dibiarkan apa adanya (tanpa backfill).
- FormAnswer tidak memiliki event `forceDeleted`; pembersihan file jawaban
  bergantung pada hook `deleted`.

## Bukti

- Helper: `app/Support/StorageJanitor.php`.
- Observer: `app/Observers/EventObserver.php`,
  `app/Observers/FormObserver.php`,
  `app/Observers/FormAnswerObserver.php`,
  `app/Observers/FormFieldObserver.php`; registrasi `#[ObservedBy]` di
  `app/Models/Event.php`, `app/Models/Form.php`, `app/Models/FormAnswer.php`.
- Upload & replace: `app/Http/Controllers/Dashboard/Events/Forms/FieldOperationController.php`
  (`storeBannerFile`, `storeOptionImageFiles`, `deleteReplacedOptionImages`).
- Test: `tests/Unit/StorageJanitorTest.php`,
  `tests/Feature/Forms/ForceDeleteStorageCleanupTest.php`,
  `tests/Feature/Forms/FormOptionImageUploadTest.php`.
