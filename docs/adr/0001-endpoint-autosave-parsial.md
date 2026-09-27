# ADR-0001 — Endpoint autosave parsial untuk header form

- **Status:** Diterima
- **Tanggal:** 27 September 2026

## Konteks

Builder form mengirim perubahan secara senyap saat pengguna mengedit, jadi
payload tidak boleh menuntut form lengkap. Endpoint `update` biasa bersifat
ketat (field `required`, `min:1`, `metadata.purpose` wajib) dan akan menolak
PATCH parsial. Dua masalah konkret muncul:

- Middleware `ConvertEmptyStringsToNull` mengubah `''` (nilai kosong dari
  frontend) menjadi `null`; menulis `null` ke kolom NOT NULL `forms`
  (`title`, `description`, `visible_for`) memicu `SQLSTATE 1048` (error 500).
- Reload setelah PATCH yang dianggap sukses bisa menampilkan nilai lama tanpa
  penjelasan ("resurrect diam-diam") bila `lastSentHeader` frontend menyimpan
  nilai blank yang sebenarnya tidak ditulis server.

## Keputusan

Sediakan endpoint PATCH khusus autosave yang menerima payload parsial:

- **Route:** `PATCH /events/{event}/forms/{form}/autosave`
  (`events.forms.autosave`) → `FormAutosaveController`.
- **Validasi longgar:** `AutosaveEventFormRequest` memakai `sometimes|nullable`
  untuk semua key header (tanpa `required`/`min:1`), sengaja tidak memakai
  ulang helper store/update ketat.
- **Normalisasi:** `prepareForValidation()` mengubah `''` menjadi `null` untuk
  `closed_at`, `banner_url`, `banner_caption`, `success_content` agar
  `nullable|date` lolos.
- **Tulis selektif:** controller hanya menulis key yang hadir di payload dan
  melewati `null` untuk kolom NOT NULL (`title`, `description`, `visible_for`);
  key `success_content` dinormalisasi (`''`/`<p></p>` → `null`).
- **Respons:** JSON `{ok: true}` untuk request XHR, redirect ke halaman form
  untuk request biasa.
- **Frontend:** `useBuilderAutosave` menghitung diff header per-key lalu
  `stripBlankRequiredKeys` (`lib/autosaveHeader.ts`) mengecualikan
  `title`/`description` yang blank; `mergeSentHeader` mempertahankan nilai
  sukses lama untuk key yang tidak terkirim. Debounce 800ms diatur oleh
  `useAutosaveSync`.

## Konsekuensi

- Payload header boleh parsial: key yang tidak dikirim tidak berubah.
- `title`/`description` blank divalidasi inline di frontend dan tidak dikirim,
  sehingga nilai server tidak ter-resurrect.
- Semantik "omission = delete" **tidak berlaku** untuk endpoint autosave ini;
  penghapusan field ditangani endpoint fields terpisah.
- Kolom nullable (`closed_at`, `success_content`, `banner_*`, `metadata`) tetap
  boleh menjadi `null`.

## Bukti

- Route: `routes/web/admin/event.php:65-66`
  (`Route::patch('/events/{event}/forms/{form}/autosave', FormAutosaveController::class)`).
- Kode: `app/Http/Controllers/Dashboard/Events/Forms/FormAutosaveController.php`,
  `app/Http/Requests/AutosaveEventFormRequest.php`.
- Frontend: `resources/js/lib/autosaveHeader.ts`,
  `resources/js/hooks/useBuilderAutosave.ts`,
  `resources/js/hooks/useAutosaveSync.ts`.
- Test: `tests/Feature/Forms/FormAutosaveTest.php`,
  `resources/js/lib/__tests__/autosaveHeader.test.ts`,
  `resources/js/hooks/__tests__/useBuilderAutosave.test.ts`.
