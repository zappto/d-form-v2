# Issue tracker — Jira (primer penuh)

> STATUS: menunggu detail instance dari pemilik repo (lihat "Belum ditentukan" di bawah).
> Setelah dilengkapi, hapus blok itu. Skill `to-tickets`, `triage`, `to-spec`
> membaca/menulis ke tracker ini.

## Keputusan

- Tracker utama: **Jira** (dipakai untuk semua case ke depan).
- GitHub Issues repo `zappto/d-form-v2` **tidak** dipakai sebagai tracker kerja.

## Instance (terverifikasi 2026-09-26 via `GET /myself` → 200)

- **Host**: `https://zappin.atlassian.net` (Jira Cloud)
- **Project key**: `DFORM` (id `10000`; "SCRUM" di URL board hanyalah nama board)
- **Akses agen**: email `saptogusty@gmail.com` + API token via env var
  `JIRA_API_TOKEN` (Basic auth `email:token`, header `Accept: application/json`).
  Token TIDAK disimpan di repo/chat file — hanya environment lokal operator.
- **Issue types / workflow**: mengikuti yang ada di proyek DFORM (baca live via
  `/rest/api/3/project/DFORM` bila perlu); default alur To Do → In Progress →
  In Review → Done bila status itu ada.

## Aturan main (berlaku setelah akses ada)

1. Satu pekerjaan = satu issue, judul format `[AREA] ringkasan` (AREA: builder, autosave, upload, auth, recruitment, ...).
2. Spec/plan yang ditulis agen dilampirkan sebagai komentar atau lampiran issue, bukan badan issue.
3. Status issue digerakkan agen sesuai fase: mulai = In Progress, selesai + terverifikasi = In Review (manusia tutup ke Done).
4. Kunci proyek dan kredensial tidak pernah ditulis di repo — via environment/secret store.
