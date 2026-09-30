# Sapto Changes — 30 September 2026 (DFORM-78)

Ticket Jira: **DFORM-78** — `[security] Upload attachment tanpa allowlist MIME` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar/artefak) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: SEC-13.

## BEFORE (masalah + bukti)

- Request rules hanya `file|max:1536` — `.php/.phar/.svg/.html`, double-extension, nama `../`, MIME-spoof lolos ke service yang menyimpan `uuid_originalname` mentah ke disk `local` dan mencatat MIME tanpa gate. Satu-satunya mitigasi: disk tak publik.

## AFTER (fix + file)

1. Allowlist kanonik tunggal di service (`ALLOWED_EXTENSIONS` 15 + `ALLOWED_MIME_TYPES` 14): request `mimes:`+`mimetypes:` (lapis-1) + gate service lapis-2 (traversal/null-byte, ekstensi akhir, segmen-tengah executable, finfo konten vs blocklist MIME).
2. Nama SIMPAN = `uuid_` + basename ternormalisasi (`[^A-Za-z0-9._-]`→`_`, cap 200); `file_name` display utuh (dipakai `BroadcastMail->as()`); ukuran/disk/path/response + `validateInlineImages()` NOL ubah.
3. Test: unit allowlist 8 + HTTP upload 5 (serangan→422, legit→lolos, display utuh).

## AKAR MASALAH (yang diselesaikan)

- Validasi tipe nol di dua titik (request tanpa gate + service catat-tanpa-periksa) + nama klien mentah jadi path simpan. Kini defense-in-depth dua lapis + sanitasi nama.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-78 | refactor: allowlist dua lapis + normalisasi nama + test |
| — | _(docs ini)_ | PM+sapto | DFORM-78 | docs: changelog + README |

## Verifikasi PM (independen, via podman)

- Scope: 13 passed / 38 assertions; pint 4 file bersih; diff request+service direview baris-per-baris.
- Suite broadcast: 63 passed + **3 failed di `BroadcastThrottleTest` (429→302) — BUKAN scope ini**: file test UNTRACKED milik sesi lain (rate-limit work, belum commit), gagal vs kode kini; jalur attachment vs throttle tanpa irisan kode; eksperimen worktree HEAD murni tak menemukan file tersebut (tak ter-commit). Dicatat sebagai temuan, tidak disentuh, tidak memblokir tiket ini.
- `git status`: hanya 4 file tiket; bersih dari file DFORM-76/sesi lain, `Makefile`, `database/seeders/UserSeeder.php`. Frontend SKIP.

## Utang / sisa risiko

- Spoof PHP-minimal terbaca `text/plain` tetap lolos `.pdf/.txt` (diterima sadar: tak dieksekusi web, nama uuid, keluar hanya via email). Macro Office legacy diizinkan (proteksi client). Test throttle sesi lain dibiarkan untuk pemiliknya.
- Push `main`+`dev` menunggu auth pemilik.
