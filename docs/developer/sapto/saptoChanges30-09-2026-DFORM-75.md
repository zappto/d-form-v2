# Sapto Changes — 30 September 2026 (DFORM-75)

Ticket Jira: **DFORM-75** — `[docs] Drift dokumen oprec merujuk model yang dibuang` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar; drift terkonfirmasi) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: TL-43, tingkat Sedang.

## BEFORE (masalah + bukti)

- Commit `9a8224f` membuang lapisan email-template (model, policy, controller, request, seeder, route, halaman, permission `recruitment.templates.*`) ganti template hardcoded — tapi 4 docs oprec masih menyajikan model yang sudah tak ada sebagai entitas/policy/seeder/rute/test aktif (database-design:360/411/418, authorization:92-94/121/137, domain-model:39, testing-strategy:176/323).

## AFTER (fix + file)

1. `authorization.md` −6: blok permission + baris matrix + baris policy mapping dihapus.
2. `database-design.md` +4/−3: §18 jadi penanda legacy + 1 baris historis (tabel masih ter-create via migration, kode tak pakai); grup migrasi + baris seeder dibersihkan.
3. `domain-model.md` −1: baris agregat Email Template dihapus (tersisa 3 baris valid).
4. `testing-strategy.md` −2: baris P-08 (gap ID disengaja, tanpa referensi luar) + checklist journey dihapus.
5. NOL sisa di 4 file kecuali 1 baris historis "dibuang di 9a8224f" (budget tiket).

## AKAR MASALAH (yang diselesaikan)

- Perubahan kode destruktif tanpa pemutakhiran dokumen: panduan menyesatkan (admin CRUD template, policy, seeder, test P-08) untuk fitur yang sudah tak ada. Kini keempat dokumen konsisten dengan kode aktual.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-75 | docs: bersihkan acuan template di 4 docs oprec |
| — | _(docs ini)_ | PM+sapto | DFORM-75 | docs: changelog + README |

## Verifikasi PM (independen)

- Grep pasca-fix di oprec: NOL sisa di 4 file kecuali 1 baris historis; diff +4/−12 sesuai klaim; struktur tabel/list utuh.
- `git status`: hanya 4 docs + changelog/README; NOL file kode; file sesi lain + `package-lock.json` tak tersentuh; bersih dari `Makefile`, `database/seeders/UserSeeder.php`. Backend/frontend gates SKIP (docs-only).

## Utang di luar scope

- Drift sama di `milestone.md`, `routes-and-pages.md`, `overview.md`, `notifications.md` — kandidat tiket lanjutan (file luar scope, dilarang sentuh). Push `main`+`dev` menunggu auth pemilik.
