# Sapto Changes — 27 September 2026 (DFORM-14 M10)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-13.md`](./saptoChanges27-09-2026-DFORM-13.md). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**, dikerjakan dengan vertical-slice TDD (RED→GREEN per slice). Ticket Jira: **DFORM-14** — `M10: Split QR hook 896 baris` (status: In Review + komentar hasil). Bukan god commit: 1 commit atomik (5 file, +1088/−652).

## Ringkasan (TL;DR)

`useGlobalQrScanPage.ts` 889 baris dirampingkan jadi orkestrasi murni 285 baris: kamera + siklus hidup `Html5Qrcode` pindah ke `useQrCamera` (242 baris), sedangkan submit + cooldown + polling + riwayat + id meja pindah ke `useQrFeed` (488 baris). Return-shape 32 key dipertahankan identik sehingga `Global.vue` dan `lib/qrScanUi.ts` tidak disentuh. Aturan 10–14 dipatuhi.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 14:43 | `675c6b4` | zappto | DFORM-14 | feat(qr): split `useGlobalQrScanPage` → `useQrCamera` + `useQrFeed` |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `675c6b4569d3c21d63d0b37aa6189a9f53d25c78` @ `1790495038 +0700` (14:43 WIB).

## Per-commit

#### `675c6b4` feat(qr,DFORM-14): split useGlobalQrScanPage jadi useQrCamera + useQrFeed

- Apa: `useGlobalQrScanPage.ts` 889 → 285 baris (orkestrasi: pilih target, filter riwayat, KPI, hero, submit manual — menyusun `useQrCamera` + `useQrFeed`); hook baru `useQrCamera.ts` (242 baris) — daftar kamera + siklus hidup `Html5Qrcode`, fps 10 (`CAMERA_FRAME_RATE`), qrbox responsif selebar viewfinder, pause/resume shutter, `stop` + `clear` saat unmount; hook baru `useQrFeed.ts` (488 baris) — submit + `SCAN_COOLDOWN_MS` 2000, polling `FEED_POLL_MS` 2000 dengan `FEED_POLL_TIMEOUT_MS` 8000, riwayat + dedup feed, id meja via `DESK_STORAGE_KEY` (sessionStorage).
- File: `useGlobalQrScanPage.ts` (→ 285 baris) + `useQrCamera.ts` (baru, 242 baris) + `useQrFeed.ts` (baru, 488 baris) + `__tests__/use-qr-camera.test.ts` (167 baris) + `__tests__/use-qr-feed.test.ts` (143 baris). Total 5 file, +1088/−652.
- Test: vitest 5/5 (2 kamera + 3 feed): fps 10 + qrbox responsif; unmount stop+clear; id meja persisten via sessionStorage; cooldown 2000 menahan hasil ganda; poll interval 2000 / timeout 8000. TDD vertical slice (kamera, feed) RED→GREEN per slice.
- Aturan 10–14: satu tanggung jawab per hook/fungsi, konstanta bernama (`CAMERA_FRAME_RATE`, `SCAN_COOLDOWN_MS`, `FEED_POLL_MS`, `FEED_POLL_TIMEOUT_MS`, `DESK_STORAGE_KEY`), nama readable, doc 1–2 baris, tanpa duplikasi. `Global.vue` & `lib/qrScanUi.ts` tidak disentuh (return-shape 32 key identik).
- Jira: DFORM-14.

## Verifikasi

- `npx vitest run`: 5/5 test di 2 file baru passed (2 kamera + 3 feed).
- `npx eslint`: 5 file baru/ubah bersih (tidak diulang).
- `tsc --noEmit` terblokir isu pre-existing `tsconfig.json` (`TS5103 ignoreDeprecations`); tidak disentuh, bukan regresi slice ini.
- Return-shape `useGlobalQrScanPage` 32 key terverifikasi identik (diff key-set); `Global.vue` dan `lib/qrScanUi.ts` tidak tersentuh.
- `git log --oneline`: `675c6b4` terkonfirmasi; file slice paralel lain tetap modified/untracked, tidak ikut ter-commit. Tanpa push.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.

## Catatan untuk tim

- Ticket DFORM-14 menyebut 896 baris, sedangkan ukuran hook saat dikerjakan 889 baris — konsisten dengan stat commit (+1088/−652). Angka commit (889 → 285) yang dipakai di dokumen ini.
- Pola file ini (tabel + kolom Issue + blok per-commit) tetap dipakai ke depan.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-14.
