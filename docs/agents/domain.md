# Domain docs — single-context

Repo ini single-context (satu app Laravel + Inertia/Vue, bukan monorepo).

- `CONTEXT.md` di root: ringkasan domain (form builder, autosave, recruitment,
  upload) + konvensi lintas-cutting. Belum ada — buat saat dibutuhkan pertama.
- `docs/adr/` di root: Architecture Decision Records per keputusan besar
  (mis. endpoint autosave parsial, dirty-sync, upload-to-storage). Format:
  `docs/adr/NNNN-judul.md` (Status, Konteks, Keputusan, Konsekuensi).

Aturan konsumen (agen):
- Baca `CONTEXT.md` (bila ada) sebelum mengubah lintas-domain.
- Tulis ADR baru untuk setiap perubahan arsitektur, bukan sekadar komentar kode.
