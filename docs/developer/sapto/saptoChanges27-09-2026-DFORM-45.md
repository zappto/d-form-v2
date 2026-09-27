# Sapto Changes — 27 September 2026 (DFORM-45 Chore)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-43.md`](./saptoChanges27-09-2026-DFORM-43.md). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-45** — `[Chore] Rapi-rapi penutupan seri Mx (gitignore, plan rename, komentar umbrella)`. Basis commit: `3ae95b6` (`docs(DFORM-40,DFORM-41): audit dampak UI per-file`). **Satu commit atomik** (`3cf2b09`); sisanya tindakan non-commit (gitignored plan rename + komentar Jira + evaluasi premis).

**DFORM-45 tidak mengubah kode aplikasi sama sekali** — ini murni *housekeeping repo* + catatan penutupan seri Mx. Tidak ada file `resources/**`, test, maupun config runtime yang tersentuh. Satu-satunya file repo yang berubah adalah `.gitignore` (plus file yang jadi ter-track).

## Tujuan & Ringkasan (TL;DR)

Merapikan penutupan seri Mx dan mencegah pengetahuan sesi hilang:

1. **`AGENTS.md` + `docs/agents/` jadi file repo yang ter-track** — sebelumnya hilang dari `git status` karena ter-`gitignore`, sehingga mudah terlewat dari commit.
2. **Rename plan internal** yang memakai key Jira tidak valid (`DFORM-20` → `DFORM-30` yang nyata).
3. **Komentar umbrella DFORM-18** dicatat statusnya (10 tiket cluster In Review; transisi Done sengaja ditahan).
4. **Temuan penting**: "Aturan 14" yang disusun sesi ini **tidak** ditulis ke `AGENTS.md` karena commit `72aabaf` dari luar sesi sudah lebih dulu menambahkan bagian "Aturan wajib" yang lengkap — **tidak ada file yang ditimpa**.
5. **Lima premis yang dikoreksi dengan bukti** dan karena itu **tidak dieksekusi** (satu di antaranya menjadi dasar F0 DFORM-44).

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 19:30 | `3cf2b09` | zappto | DFORM-45 | chore(repo): track `AGENTS.md` + `docs/agents` (keluarkan dari `.gitignore`) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `3ae95b6` → `3cf2b09` → `72aabaf` (…), epoch `1790512245 +0700` → 19:30 WIB. Persis satu baris per commit (hanya 1 commit ber-issue DFORM-45); author `zappto`. HEAD saat dokumen ini ditulis sudah bergerak lebih jauh (DFORM-44/46), jadi `3cf2b09` bukan HEAD.

## Per-commit

#### `3cf2b09` chore(repo,DFORM-45): track AGENTS.md + docs/agents (keluarkan dari .gitignore)

- Apa: menghapus entri `AGENTS.md` dan `docs/agents/` dari `.gitignore` (**2 baris**) sehingga keduanya menjadi file repo yang **ter-track** — sebelumnya hilang dari `git status` dan mudah terlewat. Efeknya: `AGENTS.md` + 3 dokumen di `docs/agents/` ikut ter-versi.
- Diffstat: daftar file pasti seharusnya dibaca dari `git show --stat 3cf2b09`; **penulis tidak punya shell** sehingga tidak bisa menjalankannya (lihat Verifikasi). Yang **diverifikasi langsung ke tree**: `.gitignore` saat ini **tidak lagi** memuat entri `AGENTS.md` maupun `docs/agents/`, dan file-file targetnya benar-benar ada (`AGENTS.md`; `docs/agents/domain.md`, `docs/agents/triage-labels.md`, `docs/agents/issue-tracker.md`).
- Jira: DFORM-45.

## Keputusan & koreksi

### Tindakan non-commit

1. **Rename plan internal** — `docs/big-changes/plans/2026-09-27-DFORM-20-mx-d-minicalendar-plan.md` → `2026-09-27-DFORM-30-mx-d-minicalendar-plan.md`, plus header/ticket line diperbaiki. Alasan: key **`DFORM-20` tidak ada di Jira**, sedangkan `DFORM-30` adalah tiket Mx-D yang nyata. **Keterbatasan:** `docs/big-changes/plans/` **gitignored**, jadi rename ini **tidak terlihat di riwayat Git** — dicatat sebagai tindakan lokal ber-alasan. Diverifikasi langsung: plan `2026-09-27-DFORM-30-mx-d-minicalendar-plan.md` ada (header `# DFORM-30 (Mx-D) — hapus MiniCalendar dummy…`, ticket line `Ticket: DFORM-30 (terkait DFORM-18, cluster D)`), dan **tidak ada** file plan ber-`DFORM-20`.
2. **Komentar umbrella DFORM-18** (id komentar Jira `10028`): **10 tiket cluster dalam status In Review**; transisi umbrella ke **Done sengaja ditahan sampai review anak-anaknya selesai**, mengikuti aturan "penutupan Done oleh manusia" (`AGENTS.md` bagian Jira: agent hanya memindahkan In Progress → In Review). **Keterbatasan:** komentar Jira tidak bisa dibaca dari tree (tanpa shell/klien Jira); dicatat apa adanya dari brief.
3. **"Aturan 14" tidak ditulis ke `AGENTS.md`** — aturan larangan kode redundan yang disusun sesi ini **tidak** dituliskan ke `AGENTS.md`, karena commit `72aabaf` (`docs(agents): aturan wajib …`) dari luar sesi sudah lebih dulu menambahkan bagian **"Aturan wajib"** yang lengkap (**63 baris**: 14 aturan user + Typing + Arsitektur FE + Alur kerja). **Tidak ada file yang ditimpa.** Diverifikasi langsung: bagian "Aturan wajib" ada di `AGENTS.md` dan memuat 14 aturan bernomor + sub-bagian Typing/Arsitektur/Alur kerja/Dokumentasi/Jira; ketiga rujukan `docs/rules/general.md`, `docs/rules/front-end.md`, `docs/rules/back-end.md` **memang ada**.

### Premis yang dikoreksi dengan bukti (semuanya TIDAK dieksekusi)

Dicatat supaya tidak terulang:

1. **`tailwindStylesheet` bukan akar tunggal 404 file merah.** Eksperimen config sementara membuat angka merah justru **naik 404 → 411**, artinya ada **dua sebab sekaligus**: config kurang opsi v4 **dan** isi file yang belum pernah disapu. Kesimpulan inilah yang menjadi dasar **F0 DFORM-44** (`770bfd1`, `chore(prettier,DFORM-44): tailwindStylesheet agar plugin sadar Tailwind v4 (F0)`) — bukan dasar penghapusan 404 merah. *(Fakta commit `770bfd1` diverifikasi dari reflog; angka 404→411 dari brief.)*
2. **DFORM-11/13/15 BUKAN duplikat.** Scope sisa di dokumennya nyata dan berbeda:
    - **DFORM-11** = verifikasi sentralisasi format (`lib/format.ts` + unifikasi locale id-ID) — dokumennya sendiri menyatakan 2 commit atomik `8f71663` + `e4049e5`.
    - **DFORM-13** = dedup token + tooltip chart (`useChartTheme`), hanya menutup sisa token/tooltip yang masih duplikat verbatim antar dua chart.
    - **DFORM-15** = alias `composables` di `components.json` + barrel aditif `hooks/index.ts`.
    Karena scope-nya nyata dan berbeda → **tidak ditutup**.
3. **Merge doc DFORM-7 vs god-doc TIDAK dijalankan.** 3 baris kembar memang ada di god-doc (`saptoChanges27-09-2026.md:309,310,312` — SHA `2a9a61d`, `530eaba`, `632b293`, identik dengan tabel di doc DFORM-7), tetapi doc DFORM-7 sendiri menyatakan god-doc **sengaja dibiarkan apa adanya sebagai arsip** (`saptoChanges27-09-2026-DFORM-7.md:56`). **Keputusan user: biarkan** — tidak ada file diubah, hanya dicatat.

## Verifikasi

> Catatan kejujuran: penulis dokumen ini **tidak punya shell** dan tidak bisa menjalankan `git show`/`git status`/`git log`. Karena itu **daftar file pasti `3cf2b09` dan `72aabaf` tidak diverifikasi independen** (harus dibaca dari `git show --stat`). Yang **bisa** dan **sudah** diverifikasi langsung ke tree: isi `.gitignore` saat ini, keberadaan `AGENTS.md` + `docs/agents/*` + `docs/rules/*`, isi bagian "Aturan wajib", keberadaan/header plan `DFORM-30`, ketiadaan plan `DFORM-20`, baris kembar god-doc vs doc DFORM-7, pernyataan arsip di doc DFORM-7, dan scope doc DFORM-11/13/15. Semua SHA/waktu commit diverifikasi dari reflog `.git/logs/HEAD`.

- **`3cf2b09`** (diverifikasi dari reflog): ada, pesan `chore(repo,DFORM-45): track AGENTS.md + docs/agents (keluarkan dari .gitignore)`, epoch `1790512245 +0700` (19:30).
- **`.gitignore`** (diverifikasi langsung): 59 baris, **tanpa** entri `AGENTS.md`/`docs/agents`.
- **File target ada** (diverifikasi langsung): `AGENTS.md`; `docs/agents/{domain,triage-labels,issue-tracker}.md`; `docs/rules/{general,front-end,back-end}.md`.
- **`AGENTS.md` "Aturan wajib"** (diverifikasi langsung): ada, memuat 14 aturan + Typing + Arsitektur FE + Alur kerja (bagian ini 63 baris, sebelum `## Agent skills`).
- **Plan rename** (diverifikasi langsung): `2026-09-27-DFORM-30-mx-d-minicalendar-plan.md` ada dengan header/ticket `DFORM-30`; **tidak ada** file `*DFORM-20*` di `plans/`.
- **Duplikasi god-doc** (diverifikasi langsung): `saptoChanges27-09-2026.md:309,310,312` = `2a9a61d`,`530eaba`,`632b293`, sama dengan 3 baris tabel di `saptoChanges27-09-2026-DFORM-7.md:15-17`; `-DFORM-7.md:56` menyatakan god-doc dibiarkan sebagai arsip.
- **Tidak dapat diverifikasi (keterbatasan)**: `git show --stat 3cf2b09`/`72aabaf` (tanpa shell), status tracked file, komentar Jira id `10028`, dan eksperimen 404→411.
- **Kode aplikasi**: nol perubahan. Tidak ada test/lint/build yang relevan untuk ticket ini (tidak ada kode yang berubah), jadi tidak ada angka suite yang diklaim.

## Catatan untuk tim

- **DFORM-45 menutup seri Mx dari sisi housekeeping**, bukan dari sisi fitur. Cluster A–L sudah selesai lewat DFORM-30..DFORM-39; DFORM-45 merapikan hal-hal di sekitarnya (tracking, penamaan plan, komentar umbrella).
- **Pelajaran yang sengaja dicatat**: (a) menghapus entri `.gitignore` tanpa `git add` pada file target membuat file penting tak ter-versi — pastikan file target benar-benar ikut ter-commit; (b) key Jira di nama plan harus divalidasi dulu (DFORM-20 tidak ada); (c) selalu cek apakah aturan baru sudah ditulis pihak lain (`72aabaf`) sebelum menimpa — **tidak ada file yang ditimpa** kali ini; (d) klaim "akar tunggal" harus diuji dengan eksperimen sebelum dijadikan dasar aksi (404→411).
- Rename plan dan komentar umbrella **tidak terlihat di riwayat Git** (gitignored / Jira) — dokumen ini sengaja mencatatnya agar tidak hilang.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-45.
