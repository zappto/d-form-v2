# Sapto Changes — 30 September 2026 (DFORM-59)

Ticket Jira: **DFORM-59** — `[users] messages() Store vs Update nyaris identik` (In Progress; Done oleh manusia). Branch: `dev` langsung, tanpa push. Scope STRICT hanya tiket ini. Board-ID: BE-39.

## Ringkasan (TL;DR)

1. **Test kunci dulu (TDD)**: 2 test baru (`test_store_user_validation_messages_use_indonesian_text`, `test_update_user_validation_messages_use_indonesian_text`) + 2 assert lama diperketat dari `assertSessionHasErrors('role')` ke pesan `'Role tidak valid.'` — mencakup seluruh 9 pesan Store dan 8 pesan Update.
2. **Satu sumber pesan**: trait baru `App\Http\Requests\Users\Concerns\SharesUserValidationMessages::userAccountMessages()` berisi 8 pasangan bersama; `StoreUserRequest::messages()` return gabungan + `password.required`, `UpdateUserRequest::messages()` return langsung. `authorize()`/`rules()` NOL ubah.
3. **YAGNI**: trait di `Users\Concerns` (bukan `Requests\Concerns` global) — request domain lain pakai string Inggris berbeda, tidak disentuh.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | `5bcd9f0` | PM+sapto | DFORM-59 | test: kunci teks pesan validasi indonesia store dan update user |
| — | `35e3da8` | PM+sapto | DFORM-59 | refactor: satukan pesan validasi user ke trait bersama |
| — | _(docs ini)_ | PM+sapto | DFORM-59 | docs: changelog + README |

## Per-commit

#### test(DFORM-59): kunci teks pesan

- `tests/Feature/UserManagementTest.php` — satu-satunya file yang diubah: 2 test baru mengunci tiap pesan Indonesia via `assertSessionHasErrors(['field' => 'teks'])` (required 4 Store / 3 Update, format email, min 8, konfirmasi, `password.required` hanya Store, unique, `role.in`); 2 test role lama (`..._on_store`, `..._on_update`) diperketat ke pesan `'Role tidak valid.'`. Lolos sebelum refactor (karakterisasi, 18 passed) — refactor wajib tetap hijau tanpa ubah perilaku.

#### refactor(DFORM-59): trait pesan bersama

- `app/Http/Requests/Users/Concerns/SharesUserValidationMessages.php` (baru) — `userAccountMessages(): array<string,string>` berisi 8 pasangan yang sebelumnya identik di kedua request (`name/email/password.min/password.confirmed/role`, tanpa `password.required`).
- `app/Http/Requests/Users/StoreUserRequest.php` — `messages()` kini `userAccountMessages() + ['password.required' => 'Password wajib diisi.']`; `authorize()` (`users.create`) dan `rules()` (`password` required) NOL ubah.
- `app/Http/Requests/Users/UpdateUserRequest.php` — `messages()` kini `userAccountMessages()`; `authorize()` (`users.edit`), `rules()` (`password` nullable) dan `prepareForValidation()` NOL ubah.

## Keputusan

- `authorize()` beda (`users.create` vs `users.edit`) TIDAK digabung — otorisasi bukan duplikasi (1 baris alasan: Bedakan izin tulis vs ubah; menyatukan mengaburkan policy).
- Trait tinggal di `Users\Concerns`, bukan `Requests\Concerns` global (1 baris alasan: satu-satunya pemakai Store+Update; preseden global `ResolvesBroadcastSchedule` untuk lintas-domain, pesan Inggris domain lain beda string).
- `password.required` tetap milik Store saja via union `+` (1 baris alasan: Update password nullable, kunci tak bertabrakan dengan 8 kunci bersama sehingga urutan gabungan aman).
- `rules()` yang juga mirip (name/email/role identik) sengaja TAK disentuh (1 baris alasan: scope tiket ini hanya `messages()`; penyatuan rules kandidat tiket susulan).

## Verifikasi PM

- `php artisan test --filter=UserManagementTest` → **18 passed (160 assertions)** sebelum maupun sesudah refactor — PASSED.
- `./vendor/bin/pint --test` 4 file (trait + 2 request + test) → **PASS** — PASSED.
- `grep 'Nama wajib diisi.' app/Http/Requests/Users` → tinggal **1 kemunculan** (di trait); kedua request hanya panggil `userAccountMessages()` — PASSED dedup.
- `git status --short` → bersih dari file larangan (`Makefile`, `database/seeders/UserSeeder.php`, `.env`, `AGENTS.md`, file broadcast) — PASSED.
- Catatan infra: `d_form_app` crash-loop (RestartCount 12877; entrypoint `migrate` gagal `Table 'users' already exists`), `podman exec` langsung mati exit 137 — validasi dialihkan ke one-off `podman run --rm --entrypoint php` image dan volume vendor yang sama; test pakai sqlite `:memory:` (phpunit.xml) tanpa menyentuh MySQL dev; container loop TIDAK diutak-atik.

## Utang di luar scope

- `rules()` Store vs Update masih duplikat sebagian (name/email/role identik; password `required` vs `nullable`) — kandidat trait/rules bersama bila ada tiket susulan.
- Pesan validasi Inggris di domain request lain tidak disatukan (beda string, beda domain).
- Crash-loop `d_form_app` (migrations table tak sinkron dengan DB dev) ranah infra, bukan tiket ini.
- Push `dev` menunggu auth pemilik. Merge menunggu review e2e + CI.
