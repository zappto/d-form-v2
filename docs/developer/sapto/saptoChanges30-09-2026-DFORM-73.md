# Sapto Changes — 30 September 2026 (DFORM-73)

Ticket Jira: **DFORM-73** — `[docs] Spec tracking resend PR#97 absen` (To Do → In Progress → In Review; Done oleh manusia). Tiket diverifikasi bersih sebelum klaim (To Do, tanpa assignee/komentar; spec memang absen) lalu diklaim paten. Branch: `dev` langsung, tanpa push (auth origin menunggu pemilik). Board-ID: TL-41, tingkat Rendah.

## BEFORE (masalah + bukti)

- NOL spec tracking-resend di `docs/big-changes/specs/` — invariant token/expiry + otorisasi staff jalur resend hanya hidup di kode tanpa dokumen rujukan.

## AFTER (fix + file)

1. `docs/big-changes/specs/2026-09-30-tracking-resend-design.md` (60 baris, DRAFT): alur aktor→guard→token→job; invariant token (8-char alnum, bcrypt-hash, rotasi menimpa) vs GAP tanpa-expiry/rate-limit; matriks otorisasi staff; rujuk DFORM-61/66; §6 terbuka.
2. `docs/big-changes/plans/2026-09-30-tracking-resend-plan.md` (49 baris, DRAFT): 3 task checkbox (verifikasi invariant → keputusan GAP → finalisasi); constraints docs-only.
3. **Batasan material**: `docs/big-changes/` di-gitignore (`.gitignore:60`) — stub di disk tapi TAK ter-commit; file ini + README satu-satunya artefak tracked.

## AKAR MASALAH (yang diselesaikan)

- Jalur resend (PR#97) terdokumentasi nol: token tanpa expiry + otorisasi 2-permission + beda flag UI vs policy tak tercatat di mana pun. Stub menguncinya sebagai fakta bersitasi + GAP jujur; keputusan diserahkan ke gate.

## Timeline Perubahan

### 30 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| — | — (ignored) | fixer+PM | DFORM-73 | 2 stub DRAFT di `docs/big-changes/` (tak ter-commit per `.gitignore:60`) |
| — | _(docs ini)_ | PM+sapto | DFORM-73 | docs: changelog + README (tracked) |

## Verifikasi PM (independen)

- Token generator `LENGTH=8`, huruf+digit wajib + shuffle — cocok; guard `:131-143` cocok; grep expiry/TTL/rate-limit di service+generator nihil (GAP dikonfirmasi).
- <150 baris per file; link relatif valid; pola meniru DFORM-71/72; tanpa emoji; PRD/changelog dirujuk bukan diduplikat.
- `git status`: commit ini hanya changelog + README; NOL file kode; `package-lock.json` sesi lain tak tersentuh. Backend/frontend gates SKIP (docs-only).

## Utang di luar scope

- Token 8-char tanpa expiry/rate-limit = temuan keamanan terbuka (keputusan produk). Kaitan DFORM-61 vs resend belum dipetakan. Promosi stub = gate PM berikutnya. Push `main`+`dev` menunggu auth pemilik.
