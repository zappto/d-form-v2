# Sapto Changes — 30 September 2026 (DFORM-77 — PARKED)

Ticket Jira: **DFORM-77** — `[security] Admin diberi broadcast penuh + resolver tanpa scoping` (**PARKED di In Progress**, milik PM+sapto; DILARANG eksekusi revoke sebelum keputusan PRD). Board-ID: SEC-12.

## BEFORE (temuan)

- Drift terkonfirmasi: `RoleSeeder.php:111` regex memberi `email-broadcast.*` ke admin vs komentar `:101` "MVP hanya Superadmin" + PRD v1.0 :227,:256. Resolver `users()/customDataset()` tanpa scoping sumber.

## AFTER (keputusan, NOL kode)

- Vonis @oracle: revoke = seeder + migrasi revoke + test matriks; scoping resolver = tiket SEC follow-up (tanpa model kepemilikan ia setengah solusi).
- **Gate produk (30 Sep 2026, stakeholder): workflow admin-produksi MEMAKAI broadcast → STOP.** Opsi revoke dilarang (silent-revoke = breaking change). Butuh: amend PRD atau opsi transisi (read-only/deprecate) sebelum tiket dibuka kembali.
- Tiket bertahan In Progress + assignee PM sebagai kunci anti-eksekusi paralel. NOL commit kode untuk tiket ini.

## AKAR MASALAH (tertunda)

- Komentar "MVP hanya Superadmin" vs regex admin yang memberi semua permission non-users — drift niat vs implementasi. Penyelesaian benar butuh keputusan produk, bukan diskresi engineering (preseden DFORM-55).

## Verifikasi

- Klaim fakta vonis dicek PM: regex admin + komentar + policy global + resolver tanpa `User` — konsisten. NOL perubahan tree untuk tiket ini; `git status` tanpa file 77.

## Utang / syarat buka-parkir

1. Keputusan PRD: cabut penuh vs transisi (read-only/deprecate) vs amend cakupan admin.
2. Setelah (1): eksekusi iris oracle (seeder + migrasi revoke + matriks test) + tiket SEC follow-up untuk scoping resolver.
