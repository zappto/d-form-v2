# Sapto Changes — 27 September 2026 (DFORM-31 Mx-B)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-30.md`](./saptoChanges27-09-2026-DFORM-30.md) (DFORM-30 Mx-D). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-31** — `[Mx-B] Status registrasi kanonik via lib/eventShowUi.ts` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4); umbrella dipecah jadi 10 Task top-level **DFORM-30..DFORM-39**, dan DFORM-31 adalah cluster **B**. Bukan god commit: 1 commit atomik (8 file, +52/−83).

## Ringkasan (TL;DR)

Status registrasi event kini punya **satu sumber kebenaran**: helper `eventStatusUi(status)` di `lib/eventShowUi.ts` (map privat `EVENT_STATUS_UI` + interface `IEventStatusUi`) plus alias turunan global `TEventRegistrationStatus`. Lima lokasi yang sebelumnya menyalin logika label/warna sendiri-sendiri (`EventCard`, `EventHighlight`, `EventList`, `EventDetail` EN, `User/EventDetail`) kini memanggil helper itu, dan logika lokal duplikatnya **dihapus**. Konsekuensinya copy user-visible berubah: kelima lokasi disatukan ke satu label+warna kanonik (lihat tabel) — keputusan user "kanonik tunggal", menyimpang sadar dari "copy frozen" spec §260. Aturan 2/10/11/14 dipatuhi (tipe diturunkan, bukan dideklarasikan ulang; satu sumber kebenaran).

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 15:36 | `d7615d3` | zappto | DFORM-31 | refactor(events): status registrasi kanonik via `eventStatusUi` (8 file, +52/−83) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `d7615d35790d080ee8098a83b3091b6ccc1dbb12` @ `1790498214 +0700` (15:36 WIB).

## Pemetaan kanonik

Bentuk tunggal yang dipakai kelima lokasi (dipin unit test):

| status | label | tone |
|--------|-------|------|
| `not_yet_open` | Segera Dibuka | `border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-400` |
| `open` | Dibuka | `border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400` |
| `closed` | Ditutup | `border-border bg-muted/60 text-muted-foreground` |
| `full` | Penuh | `border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400` |

## Per-commit

#### `d7615d3` refactor(events,DFORM-31): status registrasi kanonik via eventStatusUi (Mx-B)

- Apa:
    - **Sumber tunggal (`lib/eventShowUi.ts`)**: helper publik baru `eventStatusUi(status: TEventRegistrationStatus): IEventStatusUi`; `interface IEventStatusUi { label; tone }`; map privat `EVENT_STATUS_UI: Record<TEventRegistrationStatus, IEventStatusUi>` untuk 4 status. Berdoc singkat satu baris ("Label + kelas badge kanonik untuk satu status registrasi").
    - **Tipe turunan (`types/event.d.ts`)**: `type TEventRegistrationStatus = IEvent['registration_status']` di dalam `declare global` — diturunkan dari `IEvent`, bukan dideklarasikan ulang (Aturan 2/14).
    - **Test pin (`lib/__tests__/eventShowUi.test.ts`, baru)**: mengunci label + tone kanonik untuk keempat status secara persis.
    - **5 adopsi** (masing-masing logika lokal duplikat **dihapus**):
        - `components/modules/dashboard/events/EventCard.vue` — `registrationUi` switch dihapus.
        - `components/modules/landing/events/EventHighlight.vue` — `statusLabel` + `statusVariant` dihapus.
        - `components/modules/landing/events/EventList.vue` — `statusLabel` + `statusVariant` dihapus (pola sama).
        - `pages/EventDetail.vue` — `registrationBadgeLabel` + `registrationTone` dihapus.
        - `pages/Dashboard/User/EventDetail.vue` — map `registrationStatusLabel` dihapus.
    - **Sengaja TIDAK disentuh**: `hooks/useDashboardEventShowPage.ts` `statusPill` (Published/Draft — concern status publikasi, bukan status registrasi) dan `lib/dummyData.ts` `statusColorMap` (warna hex untuk `review_status` pending/accepted/rejected di halaman anggota — concern berbeda).
- File (8): `lib/eventShowUi.ts` + `types/event.d.ts` + `lib/__tests__/eventShowUi.test.ts` (baru) + 5 file adopsi di atas. Total 8 file, +52/−83.
- Test: `lib/__tests__/eventShowUi.test.ts` mempin 4 label + 4 tone kanonik; suite dashboard/landing/lib hijau (lihat Verifikasi).
- Aturan 10–14: satu fungsi = satu tanggung jawab (`eventStatusUi`), map status sebagai satu sumber kebenaran (Aturan 14), magic string terpusat (Aturan 11), tipe diturunkan bukan diduplikasi (Aturan 2), helper berdoc singkat (Aturan 13), tanpa `any`.
- Jira: DFORM-31.

## Verifikasi

> Catatan kejujuran: perintah verifikasi di bawah **dieksekusi oleh orchestrator**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten commit `d7615d3` dan evidence yang dilaporkan orchestrator.

- Frontend: `npx vitest run resources/js/lib resources/js/pages/Dashboard resources/js/components/modules/dashboard resources/js/components/modules/landing` → **210 test passed (29 file test)**.
- `npx eslint` pada 8 file yang berubah → exit 0 (bersih).
- Grep simbol lama (`registrationUi`, `registrationBadgeLabel`, `registrationTone`, `registrationStatusLabel`) di 5 file adopsi → **nihil**.
- Verifikasi sumber: kelima file adopsi mengimpor `eventStatusUi` dari `@/lib/eventShowUi`; `statusPill` (`useDashboardEventShowPage.ts`) dan `statusColorMap` (`lib/dummyData.ts`) terkonfirmasi masih ada dan tidak berubah.

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10 Mx-1 cluster B (`:260`, `:265`).

- Spec §10 Mx-1 cluster B punya **dua syarat yang saling bertentangan**: `:260` "copy user-visible frozen" vs `:265` "string/warna 5 lokasi identik via satu helper" — padahal kelima lokasi itu **memang berbeda** sebelumnya. User memutuskan opsi **"kanonik tunggal"**: kelima lokasi disatukan ke satu label + satu warna.
- **Konsekuensi (dinyatakan terus terang)**: copy user-visible **berubah**. `pages/EventDetail.vue` yang semula berbahasa Inggris (Open/Full/Closed/Coming Soon) kini menampilkan label kanonik Indonesia; bentuk pendek landing/dashboard ikut berubah (mis. Buka → Dibuka, Kuota Penuh → Penuh, Pendaftaran Dibuka → Dibuka, Segera → Segera Dibuka). Karena itu §260 ("copy frozen") **dilanggar secara sadar**, dengan persetujuan user.
- Adopsi cluster B tepat 5 lokasi sesuai daftar spec (EventCard, EventList, EventHighlight, EventDetail EN, User/EventDetail); `Published`/`Draft` di `useDashboardEventShowPage.ts` tetap tidak disentuh (sesuai spec cluster B).

## Catatan untuk tim

- DFORM-31 adalah cluster **B** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; hanya cluster B yang dikerjakan di commit ini.
- Perubahan label adalah **perubahan perilaku yang disetujui**, bukan refactor murni; reviewer perlu tahu bahwa copy publik Indonesia kini seragam.
- `lib/dummyData.ts` `statusColorMap` tetap dipakai untuk warna `review_status` (pending/accepted/rejected) di halaman anggota — jangan disatukan dengan `eventStatusUi` (status registrasi event; tone badge, bukan hex).
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-31.
