# Sapto Changes — 27 September 2026

Dokumentasi perubahan lanjutan dari [`saptoChanges10-06-2026.md`](saptoChanges10-06-2026.md) (10 Juni 2026). Rentang sesi ini adalah **1–27 September 2026**, dari commit `d769e6b` sampai `affd00f` (27 September 14:15). Mencakup **mockup dan integrasi OpRec end-to-end**, **dashboard topbar & event/form builder**, **global scan (event + OpRec)**, **autosave builder & draft responden**, **redesain periode recruitment (tab, panel, drawer)**, **pengerasan backend (race check-in, rate limit, validasi)**, **migrasi hooks frontend (DFORM-8)**, serta **M3 banner/object-URL/chart (DFORM-7), storage cleanup (DFORM-19), dan closeout registrants M5 (DFORM-9)**.

> Sumber data: seluruh hash, waktu (author date), dan author pada dokumen ini diambil dari riwayat Git yang **reachable** dari HEAD (`git log d769e6b..08ca7a4`), termasuk commit kolaborator dan merge. Commit antara yang pernah di-amend/rebase dan tidak reachable tidak dicantumkan.

---

## Ringkasan (TL;DR)

| Area | Perubahan utama |
|------|-----------------|
| **OpRec frontend** | Mockup M1–M3 lengkap: tipe + dummy store, halaman publik (landing/form/submitted/tracking), halaman staff, alur revisi & correction request. |
| **Dashboard topbar** | `DashboardTopbar.vue` baru: judul halaman, search, profil/logout, breadcrumb dinamis + chevron back. |
| **Event & form builder** | Redesign form event, wizard stepper, tab Editor\|Jawaban, inline field edit, editor field via sheet, zona pesan-setelah-submit. |
| **Autosave** | `useAutosaveSync` + endpoint update JSON, lalu `useBuilderAutosave` (dirty-sync, upload-fields, guard) dan `useRespondentDraft`/`useDraftRestore` terpadu. |
| **Global scan** | Satu endpoint scan global (event + OpRec), polling sebagai pengganti SSE, filter target global, export CSV/XLSX, rate limit. |
| **OpRec form** | Form apply digerakkan DB (`OprecFormDefinition` + `OprecFormSeeder`), render via komponen Fill, error per-section inline. |
| **Recruitment detail** | Tab periode (peserta\|interview\|laporan), KPI + timeline (KPI kemudian dihapus), panel/drawer detail peserta. |
| **Route publik** | `/open-recruitment` → `/recruitment`; halaman landing digantikan kartu periode terbuka lalu form apply langsung. |
| **Backend hardening** | Race check-in 409, `UniqueConstraintViolation` helper, escape delimiter regex, normalisasi NIM, unique index per-nama. |
| **Cleanup & struktur FE** | Dead cleanup Vue/primitif/backend, migrasi folder `hooks` (DFORM-8), `lib/format.ts`, `CometSpinner` + Skeleton. |
| **Recruitment backend** | Lapisan backend modul recruitment (tabel, service, job, notifikasi) serta user management dikerjakan kolaborator (Nafunnn dkk.) dan tercatat per-commit di timeline. |

---

## Timeline Perubahan

### 1 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 09:17 | `061a44e` | zappto | docs: spec mockup OpRec frontend (M1–M3) |
| 09:21 | `c6304c9` | zappto | docs: plan implementasi mockup OpRec |
| 09:28 | `3a41e1b` | zappto | **feat:** tipe recruitment, dummy seed data, dan reactive store |
| 09:29 | `dd8c19d` | zappto | **feat:** dummy route & controller OpRec |
| 09:30 | `67a3099` | zappto | **feat:** komponen shared recruitment |
| 09:32 | `3d4644d` | zappto | **feat:** halaman publik OpRec (landing, form, submitted, tracking) |
| 09:33 | `42b6a22` | zappto | **feat:** halaman staff OpRec (dashboard, applicants, detail, corrections) |
| 09:33 | `6c22c75` | zappto | **feat:** alur revision resubmit & correction request |
| 09:35 | `f0012a4` | zappto | **feat:** dialog correction request (ganti prompt native) |
| 09:51 | `a13e16a` | zappto | **feat:** dashboard topbar (judul halaman, search, profil/logout) |
| 16:57 | `08c4cce` | zappto | chore: bersihkan lint + perbaiki test dashboard |
| 22:31 | `508919c` | zappto | **feat:** milestone 3 mockup OpRec (badge, store, halaman detail/koreksi) |
| 23:22 | `b934e45` | zappto | refactor(dashboard): topbar bersih, interaksi pasif, PageHeader → topbar |
| 23:29 | `c0997b5` | Naf'an Nur'Alim | merge: PR #77 dari zappto/main |

### 2 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 11:08 | `5ffa4af` | zappto | refactor(routes): restrukturisasi path admin & member, hapus redirect legacy |
| 11:08 | `502abd5` | zappto | **feat(events):** ekstraksi `EventCard` & `EventFilterBar` reusable |
| 11:08 | `c3c5d38` | zappto | **feat(topbar):** breadcrumb dinamis + chevron back |
| 12:09 | `b7a1373` | zappto | style(ui): sistem radius softcoded memakai utility Tailwind |
| 12:10 | `b7e9c5b` | zappto | style(ui): `rounded-lg` default di komponen & halaman |
| 12:56 | `d603e30` | zappto | style(ui): ikon container `rounded-full`, hapus `IconButton` |
| 18:15 | `09d795f` | zappto | **feat(events):** redesign form create/edit event |

### 3 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 22:18 | `567b39d` | zappto | **feat(wizard):** stepper create event + draft sync + debounce form builder |

### 4 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 15:11 | `f08a659` | zappto | **feat(forms-card):** inline edit/delete + CTA dashed + collapsible |
| 16:02 | `0fdc88e` | zappto | **feat(form-detail):** tab Editor \| Jawaban, deep-link `?tab=` |
| 16:54 | `8f6e1c9` | zappto | refactor(toolbar): Pratinjau/Save All pindah ke inline per-tab |
| 17:05 | `1da02bc` | zappto | **feat(builder,wizard):** tuning UX form builder & wizard |
| 17:06 | `3d2cd5a` | zappto | merge: `Dinus-Open-Source-Community:main` → main |

### 5 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 14:19 | `6d1d8b6` | zappto | refactor(builder): success message card jadi blok konten polos |
| 14:22 | `7bf979a` | zappto | **feat(builder):** pesan setelah submit menyatu ke single section |
| 15:22 | `cb49bdd` | zappto | revert: revert "pesan setelah submit menyatu" |
| 15:22 | `b5b328b` | zappto | revert: revert "success message card jadi blok konten polos" |
| 15:40 | `195931a` | zappto | **feat(builder):** palette confirmation item + `showSuccessZone` |
| 16:06 | `cfaba13` | zappto | **feat(builder):** zona pesan-setelah-submit di canvas tanpa toggle |
| 18:30 | `6fb2811` | zappto | **feat(forms):** halaman konfirmasi submit ala Google Forms |
| 19:42 | `99754fc` | zappto | style(builder): polish canvas (hapus header field, counter, empty state) |
| 23:12 | `478c317` | zappto | **feat(forms):** endpoint update dukung autosave JSON |
| 23:34 | `86078fa` | zappto | **feat(sync):** composable global `useAutosaveSync` optimistik + debounce |
| 23:37 | `93ec475` | zappto | refactor(wizard): autosave builder via `useAutosaveSync` |
| 23:43 | `5032c66` | zappto | **feat(forms):** autosave standalone Show via `useAutosaveSync` |
| 23:50 | `5c2b370` | zappto | fix(forms): autosave Show tidak save-redundan saat mount |

### 7 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 13:38 | `838d0eb` | zappto | style(builder): redesign kartu field canvas |
| 13:53 | `40167a9` | zappto | **feat(builder):** label & teks bantu inline di kartu field |
| 14:01 | `b338e94` | zappto | **feat(builder):** menu aksi ⋮ di kartu field |
| 14:07 | `8f93ed8` | zappto | **feat(builder):** editor field pindah ke sheet semua ukuran |
| 14:12 | `a44a6e2` | zappto | **feat(builder):** gandakan/hapus jadi tombol langsung di header kartu |
| 14:27 | `5e99877` | zappto | fix(builder): ⋮ bisa diklik (`click.stop`) + satukan scroll kanvas |
| 15:49 | `ebf8e38` | zappto | revert fix ⋮ |
| 15:50 | `8f04098` | zappto | fix(builder): ganti dropdown ⋮ dengan tombol ikon langsung |
| 16:29 | `40ca9ea` | zappto | **feat:** new ux |
| 19:19 | `54e64c5` | Naf'an Nur'Alim | merge: PR #78 dari zappto/main |
| 20:59 | `233538a` | Nafunnn | docs: modul OpRec lengkap (arsitektur, desain DB, model domain) |
| 21:53 | `15d0cc6` | Nafunnn | **feat(recruitment):** fondasi modul OpRec (enum, controller, policy, migration) |
| 22:06 | `e1a8386` | Nafunnn | **feat(recruitment):** form aplikasi + email konfirmasi + middleware periode |
| 22:21 | `446484d` | Nafunnn | **feat(recruitment):** tracking aplikasi (login, sesi, presenter, route) |
| 22:44 | `67a2de5` | Nafunnn | **feat(recruitment):** screening (enum, service, controller, notifikasi) |
| 22:59 | `4ee40d8` | Nafunnn | **feat(recruitment):** correction request (editor, gate, notifikasi staff) |

### 13 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 21:19 | `370486e` | Nafunnn | **feat(recruitment):** manajemen interview (sesi, attendance scan, final selection, email undangan) |
| 22:59 | `b9602b7` | Nafunnn | **feat(recruitment):** dashboard interview, label evaluasi ID, feedback OpRec, sidebar interviewer |

### 14 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 00:12 | `7665044` | zappto | merge: PR #79 dari Nafunnn/main |

### 15 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 00:56 | `9a8224f` | Nafunnn | refactor(recruitment): hapus email template DB-driven, token tracking, portal URL |
| 00:57 | `75ab8ee` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |
| 09:24 | `f152ad4` | zappto | merge: PR #80 dari Nafunnn/main |
| 11:24 | `91c56a9` | zappto | **feat(scan):** `GlobalScanResolver` pembeda QR OpRec vs event |
| 11:29 | `2b75790` | zappto | **feat(scan):** endpoint scan global + redirect legacy |
| 11:30 | `073c4f7` | zappto | test(scan): cover cabang recruitment |
| 11:32 | `40e0939` | zappto | **feat(scan):** SSE stream feed di tabel attendance |
| 11:33 | `c792ec9` | zappto | **feat(oprec):** Apply 3-step stepper dengan draft lokal |
| 11:38 | `1a4a560` | zappto | fix(scan): over-fetch & batch-load feed SSE |
| 11:40 | `5631a84` | zappto | **feat(scan):** perluas model UI scan (kind, title, queue, beep) |
| 11:41 | `4c9670a` | zappto | **feat(oprec):** seed form aplikasi berbasis DB |
| 11:43 | `47fa8da` | zappto | **feat(scan):** halaman & composable global scan (awalnya SSE) |
| 11:44 | `a59dfd4` | zappto | **feat(oprec):** form definition dengan divisi live |
| 11:47 | `d6cb8c6` | zappto | fix(scan): temuan review halaman scan global |
| 11:50 | `3545cf6` | zappto | **feat(scan):** panel sidebar global, route, dan menu |
| 11:59 | `1c887e9` | zappto | **feat(oprec):** validasi form aplikasi berbasis DB |
| 11:59 | `6eaa46c` | zappto | **feat(scan):** satu endpoint scan global, hapus halaman scan lama |
| 12:07 | `b8c4bd0` | zappto | **feat(oprec):** sajikan field DB ke halaman Apply |
| 15:08 | `28165bf` | zappto | **feat(oprec):** render Apply via komponen Fill |
| 15:15 | `26e25b2` | zappto | fix(scan): unwrap composable refs via `reactive` |
| 15:42 | `2faafd9` | zappto | **feat(scan):** KPI atas, filter in-card, input manual kode saja |
| 19:22 | `78c5e91` | zappto | chore(scan-test): `ScanTestSeeder` sementara + mail redirect lokal |
| 19:49 | `86b0987` | zappto | **feat(scan):** ganti SSE dengan polling feed berkursor ts |
| 19:51 | `2f2aeb5` | zappto | **feat(scan):** polling feed di halaman scan global |
| 19:56 | `d7ea02a` | zappto | fix(scan): hanya sesi dengan antrean aktif di feed |
| 20:08 | `30252da` | zappto | refactor(scan): hapus payload queue dari feed |
| 20:09 | `3aecd44` | zappto | refactor(scan): hapus panel "Sedang Diproses" |
| 20:12 | `8032814` | zappto | refactor(scan): hapus kartu langkah (LANGKAH 1/2/3) |
| 20:14 | `84b328c` | zappto | fix(oprec): emit `metadata.step` di top level agar Apply mengelompokkan field |
| 20:21 | `a8878d6` | zappto | **feat(scan):** frame kamera full-area + shutter |
| 20:26 | `dc8be6d` | zappto | fix(scan): filter hanya menyaring riwayat scan |
| 20:52 | `b277c84` | zappto | **feat(oprec):** tampilkan error field di dalam tiap section |
| 20:56 | `3748194` | zappto | **feat(scan):** endpoint export attendance (CSV + XLSX) |
| 20:56 | `2b39ee3` | zappto | **feat(scan):** filter target global + export Excel/CSV |
| 20:59 | `3e8dfa2` | zappto | chore(events): hapus prop `exports` yang tak dipakai |
| 21:15 | `c38f535` | zappto | chore(scan): hapus helper `normalizeQrCode` tak terpakai |
| 21:41 | `94362e5` | zappto | style(scan): "Ringkasan Hari Ini" jadi section polos |
| 21:46 | `125644b` | zappto | fix(scan): cegah OOM debugbar pada stream export |
| 21:54 | `15b1221` | zappto | fix: global scan |
| 22:27 | `d1d18f3` | zappto | style(sidebar): recruitment jadi sublist collapsible + ikon + spacing |

### 16 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 00:37 | `e79215a` | zappto | **feat(support):** helper `UniqueConstraintViolation` |
| 00:48 | `f583ed0` | zappto | fix(recruitment): kembalikan duplikat alih-alih 500 saat race check-in |
| 00:54 | `390cdb8` | zappto | refactor(scan): record attendance event sinkron, 409 saat duplikat |
| 00:58 | `848b7f1` | zappto | chore(scan): hapus controller scan per-event yatim |
| 01:01 | `9fa5f92` | zappto | fix(form): escape delimiter regex dari metadata field |
| 01:06 | `1ffae2c` | zappto | fix(oprec): normalisasi NIM + bedakan konflik unique per-indeks |
| 01:10 | `2afeed5` | zappto | fix(oprec): tentukan konflik unique via lookup DB, bukan marker pesan |
| 01:14 | `13bc8ca` | zappto | **feat(scan):** rate limit endpoint scan + batasi payload mentah |
| 01:16 | `d7de8ee` | zappto | docs(scan): catat accepted risk paparan feed lintas domain |
| 10:36 | `fc47e00` | zappto | docs(scan): arahkan halaman Docs ke global scan resolver |
| 10:44 | `0639eae` | zappto | **merge:** `fix/scan-oprec-hardening` → main |
| 10:55 | `6aa305e` | zappto | **feat(seed):** jalankan `ScanTestSeeder` dari `db:seed` |
| 10:57 | `9d07d57` | zappto | chore(seed): hapus seeder kategori/sesi mati + purge QR lama |
| 10:57 | `33b9818` | zappto | refactor(recruitment): hapus `PageHeader`, selaraskan pola events |
| 10:57 | `17e3089` | zappto | **feat(recruitment):** scope daftar applicant ke detail periode |
| 10:58 | `7ed2a49` | zappto | **feat(recruitment-ui):** selaraskan field tanggal/waktu periode dengan event |
| 10:58 | `0be8c98` | zappto | **feat(recruitment-ui):** redesign detail periode (hero, KPI, phase timeline) |
| 10:58 | `270cc9e` | zappto | chore: tambah Makefile podman dev + penyesuaian halaman scan |
| 11:05 | `8ca3aba` | zappto | **feat(seed):** digest QR ke `MAIL_TEST_REDIRECT` saat `db:seed` |
| 11:09 | `e54bfc4` | zappto | **feat(seed):** sertakan kode/nama/kind/daftar event di email digest |
| 11:35 | `a24f2fe` | zappto | refactor(recruitment-ui): hapus baris KPI dari detail periode |
| 11:35 | `8fdacf2` | zappto | fix(ui): tombol close destructive + kontras berbasis token |
| 11:35 | `4dd30e6` | zappto | **feat(recruitment):** filter semester data-driven |
| 11:52 | `1f74b47` | zappto | **feat(recruitment):** validasi tab query di detail periode |
| 11:56 | `5113f84` | zappto | **feat(recruitment):** payload tab kondisional + otorisasi per-tab |
| 11:59 | `6c5b8e6` | zappto | **feat(recruitment):** controlled query tabs di detail periode |
| 12:02 | `06a20ee` | zappto | **feat(recruitment):** section tab interview periode |
| 12:03 | `7141910` | zappto | **feat(recruitment):** section tab laporan periode |
| 12:05 | `7560060` | zappto | fix(recruitment): netralkan formula injection CSV di export laporan |
| 12:08 | `2fdfc6c` | zappto | fix(recruitment): validasi `period_id` di halaman laporan global |
| 12:14 | `7136c96` | zappto | fix(recruitment): wave review akhir query tab periode |
| 12:22 | `113fd6b` | zappto | **feat(recruitment):** hapus halaman index interview & laporan mandiri |
| 12:25 | `98d3703` | zappto | fix(recruitment): bersihkan sisa penghapusan |
| 12:32 | `52ae394` | zappto | **merge:** `feat/oprec-detail-query-tabs` (+ seed) → main |
| 13:37 | `0a1a6e7` | zappto | **merge:** branch `backup-oprec-removal` → main |

### 17–18 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 17 Sep 15:01 | `1f78806` | zappto | ref: refactor UI detail OpRec |
| 18 Sep 14:07 | `49d224d` | zappto | fix some bug |
| 18 Sep 14:27 | `e6ddbfb` | Naf'an Nur'Alim | merge: PR #81 dari zappto/main |

### 20–21 September 2026 — drain pekerjaan recruitment

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 20 Sep 16:15 | `1984812` | zappto | snapshot pekerjaan recruitment-UI (route publik, controller, panel, queue publik) |
| 20 Sep 17:28 | `d469194` | zappto | merge: `Dinus-Open-Source-Community:main` → main |
| 20 Sep 17:44 | `7a0d65d` | Nafunnn | **feat(recruitment):** divisi "Humas / Public Relations" + dokumentasi |
| 20 Sep 18:02 | `9cbdbd4` | Nafunnn | **feat(recruitment):** bukti follow Instagram + URL twibbon |
| 20 Sep 18:02 | `b6dfb4c` | Naf'an Nur'Alim | merge: PR #82 dari zappto/main |
| 20 Sep 18:14 | `d678398` | Nafunnn | merge: sinkronisasi upstream (Instagram follow & Humas) |
| 20 Sep 18:29 | `183bfb3` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |
| 20 Sep 18:35 | `aa85868` | Fadhil Riyanto | merge: PR #84 dari Nafunnn/main |
| 20 Sep 22:11 | `24f9098` | Nafunnn | **feat(recruitment):** portofolio opsional |
| 20 Sep 22:11 | `2bd00c2` | Nafunnn | merge: `main` (fork Nafunnn) |
| 20 Sep 22:14 | `031fa09` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |
| 20 Sep 22:18 | `e5ab730` | zappto | merge: PR #85 dari Nafunnn/main |
| 20 Sep 22:20 | `6534c11` | Nafunnn | fix(recruitment): divisi "Creative Media" → "Kreatif" |
| 20 Sep 22:23 | `e9b53e0` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |
| 20 Sep 22:25 | `8f57d19` | zappto | merge: PR #86 dari Nafunnn/main |
| 20 Sep 22:33 | `ea4c61b` | Nafunnn | **feat(recruitment):** loading state saat submit form |
| 20 Sep 22:33 | `473cab2` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |
| 20 Sep 22:36 | `2a6a1e7` | zappto | merge: PR #87 dari Nafunnn/main |
| 20 Sep 23:14 | `7a4bde4` | Nafunnn | **feat(recruitment):** field follow Instagram + URL twibbon pada dokumen |
| 20 Sep 23:15 | `a1bae66` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |
| 20 Sep 23:18 | `c2f4348` | zappto | merge: PR #88 dari Nafunnn/main |
| 20 Sep 23:20 | `7a85de8` | zappto | snapshot pekerjaan recruitment-UI (role seeder, index periode, test) |
| 20 Sep 23:44 | `d144365` | Naf'an Nur'Alim | merge: PR #89 dari zappto/main |
| 20 Sep 23:47 | `1c36688` | zappto | snapshot lanjutan recruitment-UI (`InterviewSessionCreateSheet`) |
| 20 Sep 23:49 | `641ccd3` | Naf'an Nur'Alim | merge: PR #90 dari zappto/main |
| 21 Sep 00:25 | `97abfa9` | zappto | snapshot lanjutan recruitment-UI (index periode, sesi, `EventCard`) |
| 21 Sep 00:26 | `0c996c4` | Naf'an Nur'Alim | merge: PR #91 dari zappto/main |
| 21 Sep 00:49 | `9c30269` | zappto | snapshot lanjutan recruitment-UI (controller sesi interview) |
| 21 Sep 00:51 | `3d42866` | zappto | merge: PR #92 dari zappto/main |

> Snapshot berpesan `gatau lagi awak ini sudah cape mending kasih referensi desain` adalah akumulasi pekerjaan UI recruitment yang sebelumnya dikerjakan tanpa commit. Pekerjaan 19 September (pindah route publik `/open-recruitment` → `/recruitment`, kartu periode terbuka menggantikan landing, migrasi test landing, relokasi tombol, redesign Track & MyInterviews) tidak memiliki commit tersendiri yang reachable, sehingga didokumentasikan sebagai isi snapshot 20–21 September tanpa hash terpisah.

### 23 September 2026 — bug fix form & user management

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 13:22 | `6c605d7` | Nafunnn | **feat(user-management):** CRUD user, policy, request, halaman dashboard |
| 15:24 | `0f51bee` | zappto | **fix(crit bug):** `event_id` nullable pada tabel `forms` |
| 15:26 | `20bdfa1` | Naf'an Nur'Alim | merge: PR #93 dari zappto/main |
| 17:01 | `1e106e6` | zappto | fix: bug (`FormAnswerDetailSheet`, detail form) |
| 17:06 | `eef81dd` | Naf'an Nur'Alim | merge: PR #94 dari zappto/main |
| 18:14 | `b32bb7b` | zappto | fix: bug (`FormAnswerDetailSheet`, detail form) |
| 18:18 | `087cefa` | Fadhil Riyanto | merge: PR #95 dari zappto/main |

### 24 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 16:52 | `d23f709` | Naf'an Nur'Alim | merge: `Dinus-Open-Source-Community:main` → main |

Tidak ada commit reachable pada 22 dan 25 September; pekerjaan berlanjut pada 26 September.

### 26 September 2026 — drain pekerjaan tertunda

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 12:13 | `e371995` | zappto | **feat(frontend):** `CometSpinner` loader mutasi + state `Skeleton` GET |
| 12:29 | `dc0533f` | Naf'an Nur'Alim | merge: PR #96 dari Nafunnn/main |
| 13:38 | `1661516` | Nafunnn | **feat(recruitment):** resend tracking aplikasi |
| 13:40 | `e71200f` | zappto | merge: PR #97 dari Nafunnn/main |
| 18:14 | `a95afed` | zappto | chore(frontend): matikan total Inertia progress bar |
| 18:18 | `f3fc2ad` | zappto | chore: hapus komponen/halaman/primitif Vue mati + method backend mati |
| 18:18 | `fbc2730` | zappto | perf(db): composite index untuk query `form_fields` berurutan |
| 18:18 | `317e03b` | zappto | **feat(autosave):** endpoint PATCH parsial, field nullable, sync idempoten |
| 18:18 | `3029780` | zappto | **feat(builder):** dirty-sync, status jujur, upload media ke storage, guard sync |
| 18:19 | `2266c20` | zappto | test: autosave, dirty-sync, ordering, dan upload |
| 18:21 | `d8806da` | zappto | merge: `origin/main` |
| 18:24 | `0d03f25` | zappto | chore: attendance jobs + pembaruan database seeder |
| 23:22 | `0c67f79` | zappto | **feat(draft):** `useRespondentDraft` terpadu untuk semua form responden |
| 23:22 | `14d6ea8` | zappto | **feat(builder):** hook `useBuilderAutosave` (M1) |
| 23:23 | `085f898` | zappto | merge: branch `feat/m1-builder-autosave` |
| 23:52 | `56c186b` | zappto | **feat(draft-format):** `useDraftRestore` + `lib/format.ts` (M2) |

### 27 September 2026

| Waktu | Commit | Author | Deskripsi |
|-------|--------|--------|-----------|
| 01:26 | `c3c3bfa` | zappto | **refactor(hooks):** rename `utils/composables` → `hooks` (DFORM-8) |
| 01:26 | `d9e6acc` | zappto | merge: branch `chore/hooks-rename` |
| 01:26 | `b73e7c5` | zappto | fix(docker): apply `php.ini` di image dev |
| 01:26 | `53dc21b` | zappto | chore(git): ignore spec & plan `docs/big-changes` |
| 01:56 | `d6bc15d` | zappto | revert: revert "fix(docker): apply `php.ini` di dev image" |
| 02:14 | `08ca7a4` | zappto | **refactor(autosave):** satu sumber kebenaran untuk daftar key header |
| 14:15 | `ecb4ca5` | zappto | **refactor(autosave):** narrow tipe header ke domain + hapus redundansi (Aturan 14); 25 test hijau, eslint bersih |
| 14:15 | `2a9a61d` | zappto | **feat(hooks, DFORM-7):** `useObjectUrl` + lifecycle revoke aman (lane paralel) |
| 14:15 | `530eaba` | zappto | **feat(banner, DFORM-7):** `useBannerFilePicker` + migrasi Create/Edit/`EventDashboardForm` tutup bocor (lane paralel) |
| 14:15 | `f39d8d2` | zappto | **fix(banner):** samakan batas banner form ke 5MB + 4 pesan Indonesia; test `test_banner_file_rejects_over_5mb` |
| 14:15 | `632b293` | zappto | **feat(chart, DFORM-7):** `useChartTheme` + `formatChartCount`/`chartTickCallback` + migrasi 2 chart (lane paralel) |
| 14:15 | `d890e4d` | zappto | **fix(docker):** terapkan `php.ini` prod di image dev; `upload_max_filesize` 100M, app 200, upload tests 9/9 OK |
| 14:15 | `2a60153` | zappto | **feat(storage, DFORM-19):** `StorageJanitor` + 7 observer + tutup lubang replace option image; 130 tests / 854 assertions |
| 14:15 | `affd00f` | zappto | **feat(registrants, DFORM-9):** closeout M5 + pin perilaku hook; vitest terkait 36/36, `WizardStepperTest` 9/82 |

---

## Catatan tentang kontribusi kolaborator

Sekitar **207 commit** pada rentang `d769e6b..08ca7a4` (169 non-merge, 578 file, +69.619/−9.717 baris). Distribusi penulis pada rentang ini:

| Author | Jumlah | Peran di rentang |
|--------|--------|------------------|
| zappto (= Sapto) | 171 | Dashboard/UI, builder, scan, autosave, recruitment UI, hook migration |
| Nafunnn | 19 | Backend & UI modul recruitment, user management |
| Naf'an Nur'Alim | 17 | Commit merge |
| Fadhil Riyanto | 2 | Commit merge |

Seluruh commit penulis di atas **reachable** dari HEAD dan tercantum per-commit (hash, waktu author, author) pada [Timeline Perubahan](#timeline-perubahan). Kontribusi kolaborator — terutama fondasi backend recruitment dan user management oleh Nafunnn — tersebar pada **7, 13, 15, 20, dan 23–26 September**. Ringkasan tematik modul recruitment ada di bagian **Backend (PHP) → Modul Recruitment**.

Migrasi bertanggal September yang menandai masuknya modul recruitment:

| Migrasi | Tabel/Perubahan |
|---------|-----------------|
| `2026_09_07_000001_create_recruitment_foundation_tables.php` | Tabel fondasi recruitment (periode, divisi, dll.) |
| `2026_09_07_000002_create_recruitment_application_tables.php` | Tabel aplikasi recruitment |
| `2026_09_07_000003_create_recruitment_interview_tables.php` | Tabel session interview & assignment |
| `2026_09_07_100000_add_recruitment_application_id_to_email_logs.php` | FK aplikasi pada `email_logs` |
| `2026_09_16_000001_add_created_by_to_recruitment_periods_table.php` | `created_by` pada periode |
| `2026_09_20_000001_add_sections_to_recruitment_screenings.php` | Kolom section pada screening |
| `2026_09_20_000002_add_banner_to_recruitment_periods.php` | Banner periode |
| `2026_09_20_000003_add_instagram_follow_and_twibbon_to_recruitment_documents.php` | Data dokumen tambahan |

---

## Backend (PHP)

### 1. Global Scan — satu endpoint untuk event & OpRec

| File | Peran |
|------|-------|
| `app/Services/Scan/GlobalScanResolver.php` (baru) | Membedakan payload QR event vs OpRec dan me-resolve target yang sesuai. |
| `app/Http/Controllers/Dashboard/Scan/GlobalScanController.php` (baru) | `show` (halaman) + `store` (POST scan). Cabang event dicatat **sinkron**: sukses `200`, duplikat `409`. |
| `app/Http/Controllers/Dashboard/Scan/GlobalScanFeedController.php` (baru) | Feed riwayat scan berbasis polling berkursor timestamp. |
| `app/Http/Controllers/Dashboard/Scan/GlobalScanExportController.php` (baru) | Export attendance `csv`/`xlsx` (pakai `openspout/openspout`), 1 file per acara. |
| `app/Services/Scan/ScanStreamFeed.php` (baru) | Query feed scan lintas tabel attendance (event + recruitment). |
| `app/Http/Requests/GlobalScanStoreRequest.php` (baru) | Validasi payload scan; field `raw` dibatasi 65535 → 4096. |
| `routes/web/admin/index.php` | Route `/admin/scan` (index/store/feed/export) dengan `throttle:scan-page`, `scan-feed`, `scan-store`, `scan-export`. |

Rate limiter dinamai di `AppServiceProvider`: `scan-page` 120/menit, `scan-feed` 240, `scan-export` 30, `scan-store` 60 (key user id dengan fallback IP). Controller scan per-event yang lama (`AttendanceScanController`, `RecruitmentAttendanceScanController`) dihapus karena sudah tidak ter-route.

### 2. Pengerasan race & konstraint → `UniqueConstraintViolation`

| File | Perubahan |
|------|-----------|
| `app/Support/Database/UniqueConstraintViolation.php` (baru) | Membedakan duplicate-key (MySQL 1062 / SQLite UNIQUE / Postgres 23505) dari pelanggaran FK/bad-null. |
| `app/Services/Recruitment/AttendanceService.php` | Check-in: pre-check `exists()` di luar transaksi dihapus; `QueryException` ditangkap di dalam `DB::transaction`, baris pesaing di-query ulang → payload duplikat `409`. |
| `app/Services/Recruitment/ApplicationSubmitter.php` / `OprecFormRequest.php` | Normalisasi NIM memakai `Str::upper(trim())`; konflik unique dibedakan lewat lookup DB (registration_number global vs `(period_id, nim)` per periode), bukan marker pesan. |

### 3. Form aplikasi OpRec digerakkan DB

| File | Peran |
|------|-------|
| `app/Services/Recruitment/OprecFormDefinition.php` (baru) | Menyusun definisi field form apply dari metadata + divisi live. |
| `app/Http/Requests/Recruitment/OprecFormRequest.php` (baru) | Validasi request apply mengikuti definisi DB; menormalisasi NIM. |
| `database/seeders/OprecFormSeeder.php` (baru) | Seed form aplikasi (field, urutan, step) agar form terisi tanpa hardcode. |
| `app/Services/Form/RulesBuilder.php` | Escape delimiter `/` pada metadata regex sebelum dibungkus `regex:/.../`. |

### 4. Autosave builder (endpoint & persistensi)

| File | Perubahan |
|------|-----------|
| `app/Http/Requests/AutosaveEventFormRequest.php` | Dukungan payload autosave JSON + PATCH parsial (field nullable, idempoten). |
| Migration `2026_09_23_000001_make_forms_event_id_nullable.php` | `forms.event_id` boleh NULL (form yang tidak terikat event, mis. OpRec). |
| Migration `2026_09_23_000002_add_sort_index_to_form_fields_table.php` | Composite index untuk query `form_fields` terurut. |
| Event form update controller | Menerima JSON autosave dan partial update tanpa menimpa field lain. |

### 5. Seeder & email lokal

| File | Peran |
|------|-------|
| `database/seeders/ScanTestSeeder.php` (baru) | 20 event registrations + 20 aplikasi OpRec + 20 interview + QR PNG; idempoten. **Seeder testing** — harus dibersihkan sebelum merge produksi. |
| `app/Mail/ScanTestQrMail.php` (baru) | Digest QR (1 email per jenis) untuk verifikasi lokal via `MAIL_TEST_REDIRECT`. |
| `database/seeders/DatabaseSeeder.php` | Mendaftarkan `ScanTestSeeder`; menghapus `EventCategorySeeder`/`EventSessionSeeder` yang mati (tabelnya tidak ada). |

### 6. Modul Recruitment (kontribusi kolaborator)

Lapisan backend recruitment dikerjakan oleh Nafunnn; commit-nya tercantum per-commit pada timeline (7, 13, 15, 20, dan 23–26 September). Cakupan yang terverifikasi ada:

- **Service** (`app/Services/Recruitment/*`): `ApplicationSubmitter`, `ScreeningService`, `CorrectionRequestService`, `InterviewSchedulingService`, `InterviewSessionService`, `MyInterviewService`, `AttendanceService`, `QueueService`, `EvaluationService`, `FinalSelectionService`, `FeedbackService`, `RecruitmentReportService`, `RecruitmentDashboardService`, `RecruitmentTrackingResendService`, `RecruitmentQrPngGenerator`, dll.
- **Controller admin** (`app/Http/Controllers/Dashboard/Recruitment/*`): period, division, application, screening, interview/MyInterviews, queue, evaluation, correction, final selection, report, activity log, dashboard.
- **Controller publik** (`app/Http/Controllers/Recruitment/*`): `ApplicationController`, `AttendanceController`, `TrackingController`, `FeedbackController`, `CorrectionRequestController`, `PublicQueueController`.
- **Job/Notifikasi**: `SendRecruitmentNotificationJob`, `RecordAttendanceJob` (email-only + idempotency guard via `EmailLog`).
- **User management** (`6c605d7`): `UserManagementController`, `UserManagementService`, `UserPolicy`, request Users, halaman `Dashboard/Users/*`, route `routes/web/admin/users.php`.

### 7. Perubahan backend lain

| File | Perubahan |
|------|-----------|
| `routes/web/admin/` & `routes/web/oprec.php` | Restrukturisasi path admin/member; route publik recruitment pindah ke prefix `/recruitment`. |
| `app/Http/Requests/Recruitment/IndexRecruitmentApplicationRequest.php` | Dihapus (endpoint `applications.index` dihilangkan). |
| `RecruitmentDivisionController::index()` | Dihapus (route GET tidak ada lagi); `use Inertia\Response` ikut dibersihkan. |
| `app/Http/Controllers/Recruitment/LandingController.php` | Dihapus (digantikan alur form apply). |

---

## Frontend (Vue / TS)

### 1. Dashboard topbar & breadcrumb

- `resources/js/components/modules/dashboard/DashboardTopbar.vue` (baru): judul halaman, search, profil/logout.
- `resources/js/hooks/useDashboardTopbar.ts` (baru): state topbar.
- `PageHeader` → topbar; breadcrumb dinamis (klik + chevron back) di `c3c5d38`.
- Restrukturisasi path admin/member di `resources/js/lib/routes.ts`.

### 2. Event & form builder

| Area | Perubahan |
|------|-----------|
| Form event | Redesign create/edit (`09d795f`); field tanggal/waktu selaras dengan periode recruitment. |
| Wizard | Stepper create event + draft sync + debounce builder (`567b39d`); diuji `WizardStepperTest`. |
| Form detail | Tab **Editor \| Jawaban** dengan deep-link `?tab=` (`0fdc88e`); toolbar Pratinjau/Save All pindah inline. |
| Kartu form | Inline edit/delete + CTA dashed + section collapsible (`f08a659`). |
| Field builder | Label & teks bantu inline, menu aksi ⋮, editor field pindah ke sheet semua ukuran, gandakan/hapus jadi tombol header (`838d0eb`…`a44a6e2`, `8f04098`). |
| Zona konfirmasi | Palette item + `showSuccessZone`, zona pesan-setelah-submit di canvas tanpa toggle (`195931a`, `cfaba13`); halaman konfirmasi submit ala Google Forms (`6fb2811`). |
| Polish | Hapus header field, rapat gap, empty state + SVG animasi, counter title/subtitle (`99754fc`). |

### 3. Autosave global & draft responden

| File | Peran |
|------|-------|
| `resources/js/hooks/useAutosaveSync.ts` (baru, `86078fa`) | Composable global optimistik + debounce; dipakai wizard builder & Show. |
| `resources/js/hooks/useBuilderAutosave.ts` (baru, `14d6ea8`) | Autosave builder: diff+flush, hydrate guard, banner/file opsi pending, `sendBeacon` unload. |
| `resources/js/lib/autosaveHeader.ts` (baru, `08ca7a4`) | Satu sumber kebenaran daftar key header (`HEADER_FIELDS`), `pickChangedFields`, `stripBlankRequiredKeys`. |
| `resources/js/hooks/useRespondentDraft.ts` (baru, `0c67f79`) | Draft lokal terpadu untuk semua form responden (debounce 800 ms, restore toleran, snapshot tanpa `File`). |
| `resources/js/hooks/useDraftRestore.ts` (baru, `56c186b`) | Pembungkus `useRespondentDraft` + label jam tersimpan. |
| `resources/js/lib/format.ts` (baru, `56c186b`) | Fungsi format tanggal/angka/Rupiah `id-ID` terpusat (perbaiki drift `en-US`/`undefined`). |

Catatan: `resources/js/components/modules/builder/*` (`autosaveGuard.ts`, `dirtyFields.ts`, `formBanner.ts`, `optionImage.ts`) tetap murni dan tidak dipindah.

### 4. Migrasi folder hooks (DFORM-8)

- `c3c3bfa`: rename `utils/composables` → `resources/js/hooks/`; seluruh import memakai alias `@/hooks/*`.
- Peta konsumen: `Create.vue` dan `Forms/Show.vue` mengonsumsi `useBuilderAutosave` + `autosaveHeader`.
- Milestone lanjutan (M3–M5: `useBannerFilePicker`, `useObjectUrl`, `useChartTheme`, `useQrCamera`, `useQrFeed`, serta Mx unifikasi komponen) **belum** diimplementasikan pada rentang ini.

### 5. Global scan UI

| File | Peran |
|------|-------|
| `resources/js/pages/Dashboard/Scan/Global.vue` (baru) | Halaman scan global (event + OpRec). |
| `resources/js/hooks/useGlobalQrScanPage.ts` (baru) | Orkestrasi kamera, feed polling, filter, ringkasan, format. |
| `resources/js/lib/qrScanUi.ts` | Model UI scan diperluas (kind, title, queue, beep). |
| `resources/js/components/modules/dashboard/ScanExportDialog.vue` | Modal multi-pilih target + unduh Excel/CSV per acara. |
| `resources/js/components/modules/dashboard/QrScanSidebar.vue` / `QrScanScannerCard.vue` | Panel sidebar + kamera full-area dengan shutter. |
| `resources/js/components/modules/dashboard/DashboardSidebar.vue` | Menu global scan; sublist recruitment collapsible. |

Perilaku: SSE digantikan polling karena worker starvation; feed memakai kursor timestamp; filter target global (KPI + hero + log) dengan default `all`.

### 6. OpRec apply via komponen Fill

- `OpenRecruitment/Apply.vue` dirender ulang memakai komponen Fill dengan stepper + draft + review (`28165bf`).
- `metadata.step` di-emit di top level agar Apply mengelompokkan field ke step yang benar (`84b328c`).
- Error field ditampilkan **di dalam section** masing-masing (border/`aria-invalid`) alih-alih dua banner atas (`b277c84`).

### 7. Recruitment periode & panel peserta

| File | Peran |
|------|-------|
| `resources/js/components/modules/dashboard/recruitment/PeriodApplicantSection.vue` (baru) | Tabel peserta + filter antrean di dalam detail periode. |
| `.../PeriodInterviewSection.vue` (baru) | Section tab interview (sesi + penilaian). |
| `.../PeriodReportSection.vue` (baru) | Section tab laporan periode. |
| `.../ApplicantDetailContent.vue` (baru) | Konten detail peserta (dipakai bersama halaman penuh & panel). |
| `.../ApplicantDetailPanel.vue` (baru) | Drawer floating detail peserta di semua breakpoint (`SheetContent` `overlayClass` aditif). |
| `.../SessionQueueDrawer.vue` (baru) | Drawer antrean read-only di MyInterviews (auto-refresh 10 s). |
| `resources/js/lib/recruitmentPeriodPhase.ts` (baru) | Logika fase periode (murni) + `scripts/check-period-phase.ts` (dev checker). |
| `resources/js/pages/Dashboard/Recruitment/Periods/Show.vue` | Hero + timeline; tab query controlled; layout 2 kolom; wiring panel/drawer. |

Tab detail periode: `?tab=peserta|interview|laporan` divalidasi, payload dikirim kondisional + otorisasi per-tab. KPI periode awalnya ditambahkan lalu **dihapus** (`a24f2fe`). Halaman `Applications/Index.vue`, `InterviewSessions/Index.vue`, dan `Reports/Index.vue` dihapus/di-rename (net-zero dalam rentang ini) karena kontennya menyatu ke tab periode.

### 8. Skeleton & spinner

- `resources/js/components/ui/comet/CometSpinner.vue` (baru) + barrel `comet/index.ts`.
- State loading GET memakai Skeleton (mis. `comet/*`, `ui/skeleton`), diuji di `resources/js/**/__tests__/*-skeleton.test.ts`.
- Inertia progress bar dimatikan total (`a95afed`).

---

## Testing

### Test baru yang terverifikasi ada

| File | Cakupan |
|------|---------|
| `tests/Feature/Scan/GlobalScanResolverTest.php` | Resolusi payload QR event vs OpRec. |
| `tests/Feature/Scan/GlobalScanTest.php` | Endpoint scan global (store, redirects, 200/409). |
| `tests/Feature/Scan/GlobalScanFeedTest.php` | Feed polling berbasis kursor. |
| `tests/Feature/Scan/GlobalScanExportTest.php` | Export attendance CSV/XLSX. |
| `tests/Feature/Scan/ScanStreamFeedTest.php` | Query feed lintas tabel attendance. |
| `tests/Unit/Support/UniqueConstraintViolationTest.php` | Diskriminasi duplicate-key vs FK/bad-null. |
| `tests/Feature/OprecFormSeederTest.php`, `OprecFormDefinitionTest.php`, `OprecApplySubmitTest.php` | Form OpRec berbasis DB, validasi, submit. |
| `tests/Feature/Recruitment/RecruitmentPeriodQueryTabsTest.php` | Validasi tab, payload kondisional, otorisasi per-tab. |
| `tests/Feature/Recruitment/RecruitmentPeriodApplicantListingTest.php` | Listing peserta di detail periode. |
| `tests/Feature/Recruitment/RecruitmentMyInterviewScopeTest.php` | Hanya peserta yang sudah regis ulang (scan QR) yang tampil. |
| `tests/Feature/Recruitment/RecruitmentAttendanceQueueTest.php` | Race check-in deterministik → 409. |
| `tests/Feature/Forms/FormAutosaveTest.php`, `FormBannerResaveTest.php`, `FormOptionImageUploadTest.php`, `FormBannerUploadTest.php` | Autosave JSON/PATCH, banner resave, upload file field opsi/banner. |
| `tests/Feature/DirtyFieldSyncTest.php`, `SpacedOrderSyncTest.php`, `tests/Feature/WizardStepperTest.php` | Dirty-sync, sinkronisasi urutan, stepper wizard. |
| `tests/Unit/Mail/ScanTestQrMailTest.php` | Digest QR lokal. |
| `tests/Unit/Form/RulesBuilderRegexTest.php` | Escape delimiter regex. |
| `resources/js/hooks/__tests__/useBuilderAutosave.test.ts`, `use-draft-restore.test.ts`, `useRespondentDraft.test.ts` | Perilaku hook autosave/draft. |
| `resources/js/lib/__tests__/format.test.ts`, `autosaveHeader.test.ts` | Format `id-ID` + key header. |
| `resources/js/components/ui/comet/__tests__/CometSpinner.test.ts` | Spinner mutasi. |

### Catatan hasil

- Suite recruitment dilaporkan hijau (mis. 140 passed / 958 assertions) pada akhir sesi; suite scan 39 passed / 183 assertions.
- Sejumlah test lama (Forms/Auth/Events/mail) gagal karena akar **pre-existing**: `Class "Livewire\Mechanisms\ExtendBlade\ExtendBlade" not found` pada `resources/views/mail/partials/card-header.blade.php` (akibat pemangkasan `composer.lock` oleh lane lain). Kegagalan ini bukan regresi perubahan di dokumen ini.
- QA kamera QR dan beberapa checklist browser ditandai **tertunda** (lingkungan headless).

---

## File Baru

| File | Tipe |
|------|------|
| `app/Services/Scan/GlobalScanResolver.php` | Backend service |
| `app/Services/Scan/ScanStreamFeed.php` | Backend service |
| `app/Http/Controllers/Dashboard/Scan/GlobalScanController.php` | Controller |
| `app/Http/Controllers/Dashboard/Scan/GlobalScanFeedController.php` | Controller |
| `app/Http/Controllers/Dashboard/Scan/GlobalScanExportController.php` | Controller |
| `app/Http/Requests/GlobalScanStoreRequest.php` | Request |
| `app/Support/Database/UniqueConstraintViolation.php` | Helper |
| `app/Services/Recruitment/OprecFormDefinition.php` | Backend service |
| `app/Http/Requests/Recruitment/OprecFormRequest.php` | Request |
| `app/Mail/ScanTestQrMail.php` | Mailable (testing) |
| `database/seeders/OprecFormSeeder.php` | Seeder |
| `database/seeders/ScanTestSeeder.php` | Seeder (testing) |
| `database/migrations/2026_09_23_000001_make_forms_event_id_nullable.php` | Migration |
| `database/migrations/2026_09_23_000002_add_sort_index_to_form_fields_table.php` | Migration |
| `resources/js/components/modules/dashboard/DashboardTopbar.vue` | Vue component |
| `resources/js/hooks/useDashboardTopbar.ts` | Hook |
| `resources/js/hooks/useAutosaveSync.ts` | Hook |
| `resources/js/hooks/useBuilderAutosave.ts` | Hook |
| `resources/js/hooks/useRespondentDraft.ts` | Hook |
| `resources/js/hooks/useDraftRestore.ts` | Hook |
| `resources/js/hooks/useGlobalQrScanPage.ts` | Hook |
| `resources/js/lib/format.ts` | Frontend utility |
| `resources/js/lib/autosaveHeader.ts` | Frontend utility |
| `resources/js/lib/recruitmentPeriodPhase.ts` | Frontend utility |
| `resources/js/components/ui/comet/CometSpinner.vue` | Vue component |
| `resources/js/pages/Dashboard/Scan/Global.vue` | Vue page |
| `resources/js/components/modules/dashboard/ScanExportDialog.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/PeriodApplicantSection.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/PeriodInterviewSection.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/PeriodReportSection.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/ApplicantDetailContent.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/ApplicantDetailPanel.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/SessionQueueDrawer.vue` | Vue component |
| `scripts/check-period-phase.ts` | Dev checker |
| `app/Http/Controllers/Dashboard/Events/Forms/FormAutosaveController.php` | Controller |
| `app/Http/Requests/AutosaveEventFormRequest.php` | Request |
| `app/Http/Controllers/Dashboard/Users/UserManagementController.php` | Controller (kolaborator) |
| `app/Services/User/UserManagementService.php` | Backend service (kolaborator) |
| `app/Policies/UserPolicy.php` | Policy (kolaborator) |
| `app/Http/Requests/Recruitment/StoreRecruitmentInterviewerRequest.php` | Request (kolaborator) |
| `app/Services/Recruitment/RecruitmentTrackingResendService.php` | Backend service (kolaborator) |
| `config/recruitment.php` | Config (kolaborator) |
| `resources/js/components/modules/dashboard/FormAnswerDetailSheet.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/InterviewerCreateSheet.vue` | Vue component (kolaborator) |
| `resources/js/components/modules/dashboard/recruitment/InterviewSessionCreateSheet.vue` | Vue component |
| `resources/js/components/modules/dashboard/recruitment/DivisionListSheet.vue` | Vue component |
| `resources/js/components/ui/searchable-select/SearchableSelect.vue` | Vue component |
| `resources/js/lib/breadcrumbs.ts` | Frontend utility |
| `resources/js/lib/recruitmentApplicantCapabilities.ts` | Frontend utility (kolaborator) |
| `resources/js/pages/Dashboard/Users/Index.vue` (+ `Create`/`Edit`/`Show`) | Vue page (kolaborator) |

> Tabel di atas adalah **kurasi** file baru ber-signal tinggi dari daftar lengkap **336 file A** pada rentang ini; daftar penuh dapat diperiksa lewat `git diff --name-status d769e6b..08ca7a4`. File recruitment seperti `InterviewerCreateSheet.vue`, `InterviewSessionCreateSheet.vue`, dan `DivisionListSheet.vue` memang muncul pada daftar **A** (baru dalam rentang ini); sebagian masuk lewat commit kolaborator yang kini tercantum di timeline.

---

## File Dihapus

| File | Alasan |
|------|--------|
| `IMPLEMENTATION_SUMMARY.md`, `MANUAL_TESTING_GUIDE.md` | Dokumen sementara di root dihapus |
| `app/Http/Controllers/Dashboard/Events/AttendanceScanController.php`, `app/Http/Requests/AttendanceScanStoreRequest.php`, `app/Services/Attendance/AttendanceScanSubmissionResolver.php` | Tidak ter-route setelah scan global |
| `app/Models/EventCategory.php`, `database/seeders/EventCategorySeeder.php`, `database/seeders/EventSessionSeeder.php` | Model/seeder mati (tabelnya tidak ada) |
| `resources/js/components/core/input/AuthInput.vue` | Dead cleanup — 0 importer |
| `resources/js/components/modules/dashboard/DashboardNavbar.vue` | Digantikan `DashboardTopbar` |
| `resources/js/components/modules/dashboard/QrScanInstructionsCard.vue` | Digantikan layout scan global |
| `resources/js/components/modules/dashboard/FormSubmissionsTableView.vue` | Tidak dipakai setelah refactor submissions |
| `resources/js/components/modules/dashboard/RegistrantDetailSheet.vue` | Dead cleanup |
| `resources/js/components/modules/dashboard/FormSubmissionsCardGridView.vue` | Dead cleanup (intra-grup `Submissions.vue`) |
| `resources/js/components/modules/dashboard/FormSubmissionsEmptyState.vue` | Dead cleanup |
| `resources/js/components/modules/dashboard/FormSubmissionDetailSheet.vue` | Dead cleanup |
| `resources/js/components/modules/dashboard/FormBundleGroupsCardGridView.vue` | Dead cleanup |
| `resources/js/components/modules/dashboard/FormBundleGroupDetailSheet.vue` | Dead cleanup |
| `resources/js/layouts/AppLayout.vue` | Dead cleanup |
| `resources/js/components/modules/auth/AuthToast.vue` | Ikutan `pages/Auth.vue` |
| `resources/js/components/ui/breadcrumb/` (6 `.vue` + `index.ts`) | Primitif mati |
| `resources/js/components/ui/native-select/` (3 `.vue` + `index.ts`) | Primitif mati |
| `resources/js/components/ui/scroll-area/ScrollArea.vue` + `index.ts` | Primitif mati |
| `resources/js/components/ui/select/` (11 `.vue` + `index.ts`) | Primitif mati (konsumen memakai `simple-select`/`styled-select`/`searchable-select`) |
| `resources/js/components/ui/dropdown-menu/` (7 file tak-terekspor) | File tak diekspor dari barrel |
| `resources/js/components/ui/date-picker/DateTimePicker.vue` | Dead cleanup |
| `resources/js/components/ui/table/TableEmpty.vue`, `TableCaption.vue` | Dead cleanup |
| `resources/js/pages/Auth.vue` | Dead cleanup |
| `resources/js/pages/FormBuilder.vue` | Halaman demo dibuang |
| `resources/js/pages/Dashboard/Events/Scan.vue` | Digantikan halaman scan global |
| `resources/js/pages/Dashboard/Events/Forms/Submissions.vue` | Digantikan tab jawaban di detail form |
| `resources/js/components/modules/builder/FormBuilderFormDetailsCard.vue` | Dead cleanup builder |
| `resources/js/components/modules/builder/FormBuilderInspectorPanel.vue` | Digantikan sheet editor field |
| `resources/js/components/modules/builder/FormBuilderValidationSummary.vue` | Dead cleanup builder |
| `resources/js/components/modules/builder/FormBuilderDemoCanvas.vue` | Ikutan halaman demo |
| `resources/js/components/modules/builder/FormBuilderDemoPaletteSidebar.vue` | Ikutan halaman demo |
| `resources/js/components/modules/builder/FormBuilderDemoPropertiesSidebar.vue` | Ikutan halaman demo |
| `resources/js/components/modules/builder/FormBannerSettings.vue` | Ikutan halaman demo |
| `resources/js/utils/composables/useFormBuilderDemoPage.ts` | Ikutan halaman demo |
| `resources/js/utils/composables/useEventQrScanPage.ts` | Digantikan hook scan global |

> Daftar di atas adalah kurasi dari **68 file D** pada rentang ini. Beberapa halaman/controller recruitment (`Applications/Index.vue`, `InterviewSessions/Index.vue`, `Reports/Index.vue`, `OpenRecruitment/Landing.vue`, `IndexRecruitmentApplicationRequest.php`, `LandingController.php`) tidak muncul pada daftar D karena dibuat lalu dihapus/di-rename di dalam rentang yang sama (net-zero), sehingga pada diff akhir terdeteksi sebagai rename — bukan penghapusan bersih.

---

## Statistik Perubahan

- **207 commit** pada rentang `d769e6b..08ca7a4` (169 non-merge).
- **578 file** berubah, **+69.619 baris** ditambahkan, **−9.717 baris** dihapus.
- Distribusi penulis: zappto 171, Nafunnn 19, Naf'an Nur'Alim 17 (merge), Fadhil Riyanto 2 (merge).
- Perhitungan `shortlog` (identitas penulis) dapat berbeda tipis dari jumlah commit `rev-list`.

---

## Perbandingan dengan [`saptoChanges10-06-2026.md`](saptoChanges10-06-2026.md)

| Aspek | 10 Juni 2026 | 27 September 2026 (sesi ini) |
|-------|--------------|------------------------------|
| Fokus | Bundle submissions, member dashboard, reusable routes | OpRec end-to-end, global scan, builder autosave, hook migration |
| Routing | Sentralisasi URL di `routes.ts` | Restrukturisasi path admin/member + route publik `/recruitment` |
| Form builder | Editor dasar | Wizard stepper, inline field edit, sheet editor, zona konfirmasi, autosave global |
| Scan | Scan per-event | Satu endpoint scan global (event + OpRec), polling, export CSV/XLSX, rate limit |
| Recruitment | Belum ada | Backend recruitment (kolaborator) + UI tab/panel periode |
| Autosave | Belum ada | `useAutosaveSync` + `useBuilderAutosave` + PATCH parsial + draft responden |
| Struktur FE | `lib/` + composables | Folder `hooks/` + `lib/format.ts` (DFORM-8) |
| Testing | 650+ baris test baru | Suite recruitment + scan + autosave + Vitest (hook/format/comet/skeleton) |

---

## Yang harus dijalankan developer setelah pull

1. **`composer install`** — ada dependency baru (`openspout/openspout`) dan `composer.lock` sudah dipangkas (Livewire/Filament dihapus).
2. **`npm install`** lalu **`npm run build`** — banyak komponen, hook, dan page baru.
3. **`php artisan migrate`** — migrasi baru: `forms.event_id` nullable, index `form_fields`, serta tabel recruitment bertanggal September bila belum ada.
4. **`php artisan optimize:clear`**
5. **`php artisan test`** — perhatikan test lama yang gagal karena isu Livewire pre-existing di partial email.
6. Jalankan **queue worker** bila memakai job attendance/email; jalankan **scheduler** bila memakai pengingat interview.
7. Untuk verifikasi lokal seeder QR: set `MAIL_TEST_REDIRECT` (atau `MAIL_MAILER=log` untuk mematikan pengiriman).
8. Scan kamera QR memerlukan origin aman (HTTPS/localhost) dan izin kamera browser.

---

## Catatan untuk Tim

- **Scan global memakai satu endpoint** (`/admin/scan`) untuk event dan OpRec; halaman scan per-event yang lama sudah dihapus. Feed memakai **polling**, bukan SSE.
- **Rate limit** scan bersifat named limiter (`scan-page`/`scan-feed`/`scan-export`/`scan-store`) — sesuaikan bila menambah route scan.
- **`autosaveHeader.ts`** adalah satu sumber kebenaran key header autosave; menambah field header baru wajib terdaftar atau gagal kompilasi.
- **Draft responden** (`useRespondentDraft`/`useDraftRestore`) mempertahankan kunci localStorage lama; jangan ubah kunci tanpa migrasi.
- **Folder hooks**: import baru memakai `@/hooks/*`. M3 banner/object-URL/chart (DFORM-7) dan M5 registrants (DFORM-9) selesai 27 September; split QR (M4) serta Mx unifikasi komponen **belum** dikerjakan.
- **`ScanTestSeeder` + `MAIL_TEST_REDIRECT`** adalah artefak testing dan harus dibersihkan sebelum merge ke produksi.
- Perubahan `docs/superpowers/**` dan `docs/big-changes/**` **tidak ikut ter-commit** karena ada di `.gitignore`.
- Changelog ini mencakup **commit sampai `affd00f`**; perubahan pada working tree yang belum di-commit tidak tercantum di sini — periksa `git status` sebelum pull/merge.

---

*Dokumen ini ditulis untuk kolaborasi tim; sumber kebenaran akhir tetap diff Git.*
