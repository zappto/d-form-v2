# Sapto Changes — 30 September 2026 (DFORM-57)

Ticket Jira: **DFORM-57** — `[broadcast] Duplikasi hitung delay + literal queue` (To Do → In Progress → In Review; Done oleh manusia). Tiket diklaim paten sebelum eksekusi (status + assignee + komentar klaim). Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: BE-37.

## BEFORE (masalah + bukti)

1. Blok hitung delay (`$min/$max` + `random_int`) + `dispatch()->delay()->onQueue('broadcasts')` identik di `dispatch()` (l.78-90) dan `retryFailed()` (l.147-162) — diselingi logika non-identik (lock/transaksi vs reset status) yang memang milik masing-masing jalur.
2. Literal `'broadcasts'` 2x (magic string queue).

## AFTER (fix + file)

1. Konstanta `BroadcastDispatchService::QUEUE = 'broadcasts'` (nilai DIKUNCI — consumer/failed-job config di luar scope).
2. Helper private `dispatchRecipientWithDelay(string, EmailBroadcast)` — satu-satunya rumah hitung delay + kirim job; kedua situs hanya memanggil. Lock/transaksi + reset status tidak disentuh.
3. Test baru `BroadcastDispatchDelayTest` (3 test: delay 0/0, delay 5/15, retryFailed — kunci jumlah job + queue via `$job->queue`).
4. Touch-up PM: 1 literal sisa di test disamakan ke konstanta.

## AKAR MASALAH (yang diselesaikan)

- Copy-paste blok delay+dispatch ke dua jalur (kirim awal vs retry) tanpa ekstraksi + magic string queue. Diselesaikan tanpa ubah perilaku (rekalkulasi min/max per iterasi murni dari objek yang sama; 2 cast murah per iterasi diterima agar signature ≤2 param).

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-57 | refactor: satukan delay+dispatch ke helper + konstanta queue + test |
| — | _(docs ini)_ | PM+sapto | DFORM-57 | docs: changelog + README |

## Verifikasi PM

- BEFORE/AFTER grep terbukti (`random_int`/`delay_min`/`onQueue`/literal tinggal 1x di helper/const); diff PM: call-site ekuivalen (`(string)` cast dipertahankan), non-identik (lock, reset) utuh.
- `git status` → hanya service + test; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Test ikut pola broadcast mapan (RefreshDatabase + RoleSeeder + super-admin + Queue::fake).
- Frontend gates SKIP (nol `.vue`/`.ts`). **PHP_UNAVAILABLE_LOCAL**: `phpunit`/`pint` tak dijalankan — wajib hijau di CI/env ber-PHP sebelum PR `dev`→`main`.

## Utang di luar scope

- Push `main`+`dev` menunggu auth pemilik. DFORM-56 dilewati atas instruksi eksplisit (tetap To Do). Berikut urut alami: DFORM-58.
