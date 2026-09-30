# Sapto Changes — 30 September 2026 (DFORM-55)

Ticket Jira: **DFORM-55** — `[broadcast] Literal permission 25x + otoritas bercabang` (To Do → In Progress → In Review; Done oleh manusia). Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Scope: broadcast + 2 middleware (swap mekanis) — di bawah. Board-ID: BE-35.

## BEFORE (masalah + bukti)

1. 24 literal `'email-broadcast.*'` tersebar (klaim tiket "25x"; grep aktual 24): 8 di Policy L12–47, 8 di 8 Requests, 2 di middleware, 6 di RoleSeeder L101–106. Ubah nama permission = ubah N file.
2. Otoritas bercabang: request jalur simpan gate `create`, controller update-path authorize policy `update` (= `create||schedule`) → AND implisit yang efeknya mensyaratkan CREATE untuk simpan.

## AFTER (fix + file)

1. **Satu sumber** `App\Support\BroadcastPermissions` (6 const VIEW/CREATE/SCHEDULE/CANCEL/RETRY/DELETE, nilai string DIKUNCI identik — ubah nilai = migrasi data, dilarang). 8 Requests + Policy + 2 middleware + RoleSeeder kini referensi konstanta; 0 literal mentah di luar 6 definisi.
2. Test: `BroadcastPermissionsTest` (guard anti-drift nilai) + `BroadcastAuthorizationTest` (3 test MENGUNCI perilaku kini: tanpa permission → redirect dashboard; hanya-VIEW → 403; super-admin → sukses). Docblock test menyatakan eksplisit: perilaku kini, bukan ideal.

## AKAR MASALAH (yang diselesaikan)

- String permission ditulis inline di tiap gate tanpa konstanta bersama; policy `update()` yang derivatif (`create||schedule`) tak terdokumentasi. Diselesaikan: referensi tunggal + nilai dikunci test.

## KEPUTUSAN PM (mismatch create-vs-update)

- **Dipilih (b) PERTAHANKAN perilaku kini (ketat)** — kedua cek tetap berjalan; TIDAK melonggarkan akses sepihak. Opsi (a) (samakan ke `update`) akan memberi role schedule-only akses tulis tanpa persetujuan produk — butuh keputusan PRD/DFORM tersendiri bila diinginkan.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-55 | refactor: konstanta permission + 2 test pengunci |
| — | _(docs ini)_ | PM+sapto | DFORM-55 | docs: changelog + README |

## Verifikasi PM

- BEFORE/AFTER grep terbukti (24→0 di luar definisi); diff PM: Policy logika identik (`create\|\|schedule` utuh), middleware swap 1-baris ekuivalen, RoleSeeder hanya referensi (password/role utuh), test asersi sesuai perilaku middleware (redirect dashboard) + request gate (403).
- Perluasan scope 2 middleware DITERIMA PM: swap mekanis nilai-identik, diperlukan untuk verifikasi nol-literal; risiko ~nihil.
- `git status` → hanya file tiket; bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Frontend gates SKIP (sisa di `global.d.ts`/test lama hanya komentar pre-existing). **PHP_UNAVAILABLE_LOCAL**: `phpunit`/`pint` tak dijalankan — wajib hijau di CI/env ber-PHP sebelum PR `dev`→`main`.

## Utang di luar scope

- Opsi (a) pelonggaran akses → butuh tiket/PRD terpisah. Push `main`+`dev` menunggu auth pemilik. Berikut urut: DFORM-56.
