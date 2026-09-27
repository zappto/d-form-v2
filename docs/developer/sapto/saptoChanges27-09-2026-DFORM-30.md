# Sapto Changes — 27 September 2026 (DFORM-30 Mx-D)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-17.md`](./saptoChanges27-09-2026-DFORM-17.md) (DFORM-17 M13). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-30** — `[Mx-D] Hapus MiniCalendar dummy, satu EventCalendar data nyata` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4 — "Sprint 2: ekstraksi hooks"). Umbrella itu dipecah jadi 10 Task top-level **DFORM-30..DFORM-39**; DFORM-30 adalah cluster **D**. Bukan god commit: 1 commit atomik (9 file, +150/−193).

## Ringkasan (TL;DR)

`MiniCalendar.vue` dummy dihapus (155 baris; `dummyEvents`, tanpa props). `pages/Dashboard/Index.vue` kini me-render **tepat satu** `EventCalendar` berisi data nyata via prop `calendarEvents`; section duplikat "Linimasa acara" — yang me-render `<EventCalendar />` kedua tanpa prop (kosong) — dihapus. Agar kalender punya data, `HomeController` admin sekarang mengirim `calendarEvents` dari seluruh event non-deleted (`href` → `dashboard.events.show`). Bentuk 6-key kalender dipusatkan di helper baru `EventService::eventToCalendarArray(Event, string $href)`, yang juga menggantikan peta duplikat di `MemberDashboardController` (output tidak berubah). Tipe global `ICalendarEvent` ditambahkan; `EventCalendar.vue` memakainya. Aturan 10–14 dipatuhi (satu sumber kebenaran bentuk kalender, tanpa duplikasi tipe/peta).

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 15:27 | `14075ac` | zappto | DFORM-30 | feat(dashboard): satu EventCalendar data nyata, hapus MiniCalendar dummy (9 file, +150/−193) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `14075ac8ae039037ca4e2b03c25e96ff8420e85b` @ `1790497647 +0700` (15:27 WIB); commit di-amend (hash sebelum amend `9c8b29d`).

## Per-commit

#### `14075ac` feat(dashboard,DFORM-30): satu EventCalendar data nyata, hapus MiniCalendar dummy

- Apa:
    - **Frontend**: `resources/js/components/modules/dashboard/MiniCalendar.vue` dihapus (155 baris; dummy statis `dummyEvents`, tanpa props). `pages/Dashboard/Index.vue` — hapus import `MiniCalendar` + `<MiniCalendar />`; tambah prop `calendarEvents: ICalendarEvent[] | undefined`; slot kalender kini `<EventCalendar :events="calendarEvents" />`; section duplikat **"Linimasa acara"** (yang me-render `<EventCalendar />` kedua, kosong) dihapus → halaman me-render tepat satu kalender.
    - **Backend**: `app/Http/Controllers/Dashboard/HomeController.php` kini mengirim `calendarEvents` — map seluruh event non-deleted (`Event::query()->whereNull('deleted_at')`) lewat helper, `href` = `route('dashboard.events.show', ['event' => $e])`. `app/Services/Event/EventService.php` — helper publik baru `eventToCalendarArray(Event $event, string $href)` = satu sumber bentuk 6 key (`id`, `title`, `start_date`, `end_date`, `category`, `href`). `app/Http/Controllers/Dashboard/User/MemberDashboardController.php` direfaktor memakai helper yang sama (peta 6-key duplikat dihapus; output tidak berubah — `href` tetap `route('dashboard.user.events.show', ['event_segment' => $event->slug], false)`).
    - **Types**: `resources/js/types/event.d.ts` — tambah global `interface ICalendarEvent` (`id`, `title`, `start_date`, `end_date`, `category`, `location?`, `href`). `resources/js/components/modules/dashboard/EventCalendar.vue` — `interface CalendarEvent` lokal dihapus, ganti global `ICalendarEvent`; alias lokal di-rename `CalendarEventWithEnd` → `TCalendarEventWithEnd` (prefix `T`).
- File (9): `MiniCalendar.vue` (dihapus) + `pages/Dashboard/Index.vue` + `app/Http/Controllers/Dashboard/HomeController.php` + `app/Services/Event/EventService.php` + `app/Http/Controllers/Dashboard/User/MemberDashboardController.php` + `resources/js/types/event.d.ts` + `components/modules/dashboard/EventCalendar.vue` + `pages/Dashboard/__tests__/scan-dashboard-eventshow-skeleton.test.ts` + `tests/Feature/Dashboard/HomeDashboardCalendarTest.php` (baru). Total 9 file, +150/−193.
- Test:
    - **Frontend pin** (`scan-dashboard-eventshow-skeleton.test.ts`): stub `EventCalendar` diperbarui (mock props `events`, `data-testid="event-calendar"` + `data-count`); pin baru memastikan kalender menerima `calendarEvents` (`data-count="1"`), `mini-calendar` tidak dirender, dan teks "Linimasa acara" hilang.
    - **Backend baru** (`tests/Feature/Dashboard/HomeDashboardCalendarTest.php`, 2 test): dashboard mengekspos `calendarEvents` dari event nyata dengan `href` = `route('dashboard.events.show', $event)` plus `start_date`/`end_date`; event soft-deleted dikecualikan.
- Aturan 10–14: bentuk kalender 6-key kini satu sumber kebenaran di `EventService::eventToCalendarArray` (peta duplikat di dua controller dihapus — Aturan 14); tipe global `ICalendarEvent` menggantikan definisi lokal (tanpa duplikasi tipe); alias memakai prefix `T`; helper berdoc singkat; tanpa `any`.
- Jira: DFORM-30.

## Verifikasi

- Frontend: `npx vitest run resources/js/pages/Dashboard resources/js/components/modules/dashboard` → **25 file test, 177 test passed**.
- Backend: `podman compose exec -T app php -d memory_limit=512M vendor/bin/phpunit tests/Feature/Dashboard tests/Feature/EventManagementTest.php` → **56 test, 312 assertion OK**.
- `npx eslint` pada file TS/Vue yang berubah → exit 0 (bersih).
- Acceptance grep: `MiniCalendar` **nihil** di `resources/js` dan `tests`.
- Verifikasi sumber: `Index.vue` hanya memuat satu `<EventCalendar :events="calendarEvents" />` (baris 121) di dalam section "Aktivitas & kalender"; tidak ada lagi section "Linimasa acara".

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10 Mx-1 cluster D (`:264`).

- Spec menulis "`pages/Dashboard/Index.vue:7,121` pindah ke `EventCalendar`" → **terkonfirmasi** (import lama baris 7, render lama baris 121).
- Spec **tidak** menyebut `<EventCalendar />` kedua di `Index.vue` (baris 155 pada diff, di-render tanpa prop alias kosong) → ternyata **duplikat**; dihapus agar halaman me-render tepat satu kalender (sesuai acceptance).
- Acceptance spec "`Index.vue` me-render satu kalender data nyata" **tidak bisa dipenuhi hanya dengan menghapus MiniCalendar**: `HomeController` admin sebelumnya **tidak** mengirim data kalender (hanya `MemberDashboardController` yang mengirim `calendarEvents`) → wiring `calendarEvents` baru wajib ditambahkan.
- Aturan 10–14 (spec §3.2) dipatuhi; peta kalender 6-key yang terduplikasi di dua controller diekstrak ke satu helper `EventService` (Aturan 14, satu sumber kebenaran).
- Kriteria selesai Mx (§10) menyebut `MiniCalendar` sebagai "file kalah"; grep pasca-commit nihil di `resources/js` dan `tests`.

## Catatan untuk tim

- DFORM-30 adalah cluster **D** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; hanya cluster D yang dikerjakan di commit ini.
- `dummyEvents` tidak ikut dihapus: masih dipakai `RecentEventsCard.vue` (sumber `lib/dummyData.ts`). MiniCalendar hanyalah salah satu konsumennya.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-30.
