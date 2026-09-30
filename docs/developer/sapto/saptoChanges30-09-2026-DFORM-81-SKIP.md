# Sapto Changes — 30 September 2026 (DFORM-81 — SKIP)

Ticket Jira: **DFORM-81** — `[security] UserSeeder password default tanpa gate prod` (To Do → In Progress → In Review; Done oleh manusia). Tiket diklaim paten lalu di-SKIP atas instruksi stakeholder ("skip dan langsung in review"). Branch: `dev`, tanpa push. Board-ID: SEC-16.

## BEFORE (temuan, tanpa eksekusi)

- `UserSeeder.php`: password default hardcoded (`admin password`, `superadmin password`, `password` ×5 member); hanya `admin2` di-gate `local`. `DatabaseSeeder` sudah: lewati UserSeeder bila kelas absen + seed dummy hanya non-prod.

## AFTER (keputusan, NOL kode)

- SKIP eksekusi atas instruksi stakeholder. Konflik yang mendasari (teridentifikasi saat triase, belum diputus): rekomendasi tiket (gate isProduction + kredensial env di `UserSeeder.php`) vs aturan repo "jangan pernah commit `database/seeders/UserSeeder.php`".
- NOL file diubah untuk tiket ini. Keputusan final bentuk perbaikan (pengecualian commit vs worktree-only vs docs-only) ditunda ke stakeholder di luar tiket.

## AKAR MASALAH (tertunda)

- Seeder dev membawa kredensial default tanpa gate produksi; hanya sebagian kecil yang di-gate `local`. Perbaikan benar menyentuh file yang dilarang-commit — butuh keputusan aturan dulu.

## Verifikasi

- `git status`: NOL file tiket ini (scope seeders bersih, tak tersentuh). Backend/frontend gates N/A (nol perubahan).

## Utang

- Buka kembali bila diputus: bentuk eksekusi + nasib aturan larangan-commit.
