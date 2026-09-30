# Sapto Changes — 30 September 2026 (DFORM-54)

Ticket Jira: **DFORM-54** — `[broadcast] Dua request recipient identik + scheduledAt disalin` (To Do → In Progress → In Review; Done oleh manusia). Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Scope STRICT hanya tiket ini. Board-ID: BE-34.

## BEFORE (masalah + bukti)

1. `StoreBroadcastRecipientRequest.php:9-20` identik kata-per-kata dengan `UpdateBroadcastRecipientRequest.php:9-20` (authorize `email-broadcast.create` + rules name/email yang sama, tanpa messages()/attributes di keduanya). Ubah validasi = ubah 2 file.
2. `scheduledAt()` (gabung schedule_date + schedule_time → Carbon) disalin di `StoreBroadcastRequest.php:27-33` dan `UpdateBroadcastScheduleRequest.php:23-29` — isi identik, hanya FQCN vs import.

## AFTER (fix + file)

1. **Satu request netral** `SaveBroadcastRecipientRequest` (nama ikut preseden `SaveBroadcastContentRequest` di modul sama); 2 file lama DIHAPUS; `BroadcastRecipientController::store/update` type-hint request baru. Rules store/update kini mustahil divergen.
2. **Satu trait** `App\Http\Requests\Concerns\ResolvesBroadcastSchedule::scheduledAt()` (ikut konvensi trait Concerns yang ada); dipakai `StoreBroadcastRequest` + `UpdateBroadcastScheduleRequest`; 2 method duplikat dihapus. Rules masing-masing (store kaya name/delay/event) tetap utuh.
3. **Test baru** `BroadcastRecipientValidationTest` (8 test via HTTP: store/update valid+invalid, schedule valid+invalid, refleksi satu request + satu trait).

## AKAR MASALAH (yang diselesaikan)

- Store & update recipient lahir sebagai copy-paste scaffolding per-aksi tanpa ekstraksi; `scheduledAt()` disalin karena kebutuhan gabung tanggal+jam muncul di dua request tanpa trait bersama. Diselesaikan: satu sumber kebenaran rules recipient (ubah cukup 1 file) + satu definisi `scheduledAt()`.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-54 | refactor: satu request recipient + trait schedule + test |
| — | _(docs ini)_ | PM+sapto | DFORM-54 | docs: changelog + README |

## Verifikasi PM

- BEFORE dibuktikan grep (2 definisi `scheduledAt` identik; rules identik); AFTER: `function scheduledAt` → 1 (trait), refs request lama repo-wide → NOL, refs baru → 6 file sah.
- Diff PM: controller hanya ganti type-hint; rules schedule utuh; `Carbon` import vs `\Carbon\` ekuivalen.
- `git status` → hanya file tiket (M controller, M 2 request jadwal, D 2 request lama, A request+trait+test); bersih dari `Makefile`, `database/seeders/UserSeeder.php`.
- Test ikut pola `EmailBroadcastFlowTest` (RefreshDatabase + RoleSeeder + super-admin + route HTTP).
- Frontend gates SKIP (nol `.vue`/`.ts`). **PHP_UNAVAILABLE_LOCAL**: `phpunit`/`pint` tak dijalankan — wajib hijau di CI/env ber-PHP sebelum PR `dev`→`main`.

## Utang di luar scope

- Push `main`+`dev` menunggu auth pemilik. Berikut urut: DFORM-55.
