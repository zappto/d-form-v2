# Sapto Changes — 30 September 2026 (DFORM-79)

Ticket Jira: **DFORM-79** — `[security] Policy tanpa scope pemilik + schedule bisa edit` (In Progress, assignee saptogusty). Branch: `dev` langsung, tanpa push. Board-ID: SEC-14.

## BEFORE (masalah + bukti)

- `app/Policies/EmailBroadcastPolicy.php`: `update = can(CREATE) || can(SCHEDULE)` (celah: pemegang SCHEDULE-only bisa edit konten via `BroadcastContentController`); `schedule/cancel/retry/delete = can(X)` tanpa cek pemilik. NOL policy yang membaca `created_by`.
- Kolom `created_by` ADA dan diisi (`BroadcastController:62`, `DatasetController:39`) tetapi tak dipakai policy/query mana pun — data pemilik exists, enforcement nol.
- `RoleSeeder:111`: role `admin` pegang SEMUA `email-broadcast.*` → admin A bisa edit/schedule/cancel/retry/delete milik admin B (lubang aktif, bukan teoritis).
- Celah SCHEDULE-edit praktis tertutup hari ini oleh gate CREATE di `SaveBroadcastContentRequest::authorize()` — tetapi implisit, tak terdokumentasi, dan tak menutup schedule/cancel/retry/delete lintas-pemilik.
- `BroadcastAuthorizationTest` mengunci perilaku kini + komentar KEPUTUSAN-PM-TERTUNDA (L14-16): keputusan ownership belum final.

## AFTER (fix + file)

1. `app/Policies/EmailBroadcastPolicy.php` — helper private baru `isOwnedBy()`: `hasRole('super-admin')` → boleh; `created_by === null` → boleh (baris legacy); `created_by === user->id` → boleh. Perbandingan strict aman: kedua sisi UUID string (`users` HasUuids, `created_by` kolom uuid).
2. `update` kini `can(CREATE) && owned` — `|| SCHEDULE` DIBUANG (penyebab "schedule bisa edit" di judul tiket). `schedule/cancel/retry/delete` kini `can(X) && owned`. `view/viewAny` SENGAJA tetap global (daftar/detail lintas-pemilik tetap terlihat — keputusan tercatat, bukan kelalaian).
3. Test baru `tests/Feature/Broadcasting/BroadcastOwnershipTest.php` (5 test, TDD merah-dulu): admin B edit konten milik A → 403; admin B schedule milik A → 403; schedule-only tanpa CREATE edit konten → 403; super-admin edit milik A → redirect; owner edit sendiri → redirect.
4. `BroadcastAuthorizationTest`: komentar KEPUTUSAN-PM-TERTUNDA diganti keputusan final DFORM-79 (3 test lama tetap hijau tanpa ubah asersi).
5. Nilai string permission TAK DIUBAH (`BroadcastPermissions`, DFORM-55 — butuh migrasi data bila diubah); `RoleSeeder`/migration tak disentuh.

## Dampak perilaku (eksplisit — siapa kehilangan akses apa)

| Aktor | Sebelum | Sesudah | Kehilangan |
|---|---|---|---|
| admin B atas milik admin A (edit konten, schedule, cancel, retry, delete) | boleh (punya permission) | **403** | semua aksi tulis lintas-pemilik |
| schedule-only (VIEW+SCHEDULE, tanpa CREATE) edit konten | 403 (via gate FormRequest, implisit) | **403** (via policy `update`, eksplisit) | tak ada (ditutup berlapis, kini terdokumentasi) |
| schedule-only schedule milik orang lain | boleh | **403** | schedule lintas-pemilik |
| owner atas milik sendiri | boleh | boleh | tak ada |
| super-admin atas milik siapa pun | boleh | boleh | tak ada |
| view/list lintas-pemilik (siapa pun ber-VIEW) | boleh | boleh | tak ada (sengaja) |

## AKAR MASALAH (yang diselesaikan)

- Policy hanya memeriksa permission global tanpa memodelkan kepemilikan, padahal `created_by` sudah ditulis di dua controller; `|| SCHEDULE` di `update` menyamakan "boleh menjadwalkan" dengan "boleh mengubah isi". Kini kepemilikan = syarat konjungtif di semua aksi tulis, view tetap global.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | _(fix ini)_ | PM+sapto | DFORM-79 | fix: scope pemilik policy broadcast + test ownership |
| — | _(docs ini)_ | PM+sapto | DFORM-79 | docs: changelog + README |

## Verifikasi PM (runtime via podman, independen)

- `artisan test --filter=BroadcastOwnershipTest` SEBELUM fix → RED (**2 failed**: admin-B-edit → 302, admin-B-schedule → 302; 3 passed) → SESUDAH fix → GREEN (**5 passed**).
- `artisan test --filter="BroadcastOwnershipTest|BroadcastAuthorizationTest"` → **8 passed (14 assertions)** — PASSED.
- `artisan test tests/Feature/Broadcasting tests/Unit/Broadcasting` → **49 passed (160 assertions)** — PASSED.
- `pint --test` 3 file diubah → **PASS (3 files)** — PASSED.
- Runtime via one-off `podman run --rm --entrypoint php|./vendor/bin/pint` image `localhost/d-form-v2_app:latest` + bind repo (sqlite `:memory:` per `phpunit.xml`, tanpa sentuh MySQL dev); container `d_form_app` TIDAK diutak-atik.
- `git status --short` awal: `package-lock.json` kotor milik pihak lain (1 baris) — TIDAK disentuh; commit hanya path spesifik.

## Utang di luar scope

- View/list tetap global: admin B bisa LIHAT (tapi tak ubah) milik admin A — bila PRD menuntut isolasi baca, kandidat tiket lanjutan (butuh scope query, bukan hanya policy).
- `created_by === null` (baris legacy) tetap bisa diubah siapa pun ber-permission — backfill owner baris lama belum diputuskan.
- Role `admin` tetap pegang semua permission broadcast (`RoleSeeder` tak disentuh); pembatasan kini di policy, bukan di role — DFORM-77 PARKED tetap berlaku (revoke admin dilarang).
- Push `dev` menunggu auth pemilik. Merge menunggu review PM + security review.
