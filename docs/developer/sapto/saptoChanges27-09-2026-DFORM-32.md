# Sapto Changes — 27 September 2026 (DFORM-32 Mx-G)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-31.md`](./saptoChanges27-09-2026-DFORM-31.md) (DFORM-31 Mx-B). Pola sama: **satu tanggal, per-commit, tiap baris tertaut ke Issue**. Ticket Jira: **DFORM-32** — `[Mx-G] Satu RejectApplicantDialog + perbaikan label aksi Menolak...` (status: In Progress → In Review oleh orchestrator). Ini Task top-level (type Task), child dari umbrella **DFORM-18** (`Mx: unifikasi komponen redundan (A-L)`, board DFORM, Sprint 4); umbrella dipecah jadi 10 Task top-level **DFORM-30..DFORM-39**, dan DFORM-32 adalah cluster **G**. Bukan god commit: 1 commit atomik (4 file, +11/−11).

## Ringkasan (TL;DR)

Label busy aksi **Tolak** yang sebelumnya salah memakai copy aksi hapus `'Menghapus...'` kini menjadi `'Menolak...'` di dua alur recruitment: submit tolak di `PeriodApplicantSection.vue` dan aksi tolak-permintaan-koreksi di `ApplicantDetailContent.vue`. Label idle tetap (`'Tolak applicant'` dan `'Tolak'`). Dua test yang relevan diperbarui ekspektasi labelnya (judul, header comment, finder helper, `toContain('Menolak...')`), sementara assertion perilaku (POST url, `disabled`, `aria-busy="true"`, spinner `[role="status"]`) tidak berubah.

**Amandemen scope (disetujui user)**: premis spec bahwa ada **dua** dialog tolak yang keduanya salah label `Menghapus...` **terbukti tidak akurat**. Hanya satu dialog tolak nyata (`PeriodApplicantSection.vue`); alur tolak applicant di `ApplicantDetailContent.vue` berstruktur berbeda dan tidak memuat `Menghapus...`. Karena membuat `RejectApplicantDialog` bersama untuk satu pemakai melanggar YAGNI (Aturan 14), user memilih opsi **"hanya perbaiki copy"** — tanpa komponen baru. Acceptance "grep `Menghapus...` nihil di kedua file recruitment" tetap terpenuhi di level sumber.

## Timeline Perubahan

### 27 September 2026

| Waktu | Commit | Author | Issue | Deskripsi |
|-------|--------|--------|-------|-----------|
| 15:51 | `f040fe6` | zappto | DFORM-32 | fix(recruitment): label busy aksi Tolak `Menghapus...` → `Menolak...` (4 file, +11/−11) |

Sumber waktu/SHA: reflog `.git/logs/HEAD` — `f040fe6c5daf084162b5813ebd8b12fb24c5e2b7` @ `1790499109 +0700` (15:51 WIB).

## Per-commit

#### `f040fe6` fix(recruitment,DFORM-32): label busy aksi Tolak 'Menghapus...' → 'Menolak...' (Mx-G)

- Apa:
    - **`components/modules/dashboard/recruitment/PeriodApplicantSection.vue`**: label sibuk tombol submit tolak `'Menghapus...'` → `'Menolak...'`; label idle tetap `'Tolak applicant'`.
    - **`components/modules/dashboard/recruitment/ApplicantDetailContent.vue`**: label sibuk tombol tolak-permintaan-koreksi `'Menghapus...'` → `'Menolak...'`; label idle tetap `'Tolak'` (`rejectCorrection`).
    - **Test diperbarui** (ekspektasi label saja):
        - `__tests__/period-applicant-section.test.ts` — header comment, finder helper (`'Tolak applicant'` / `'Menolak...'`), dan `expect(btn.text()).toContain('Menolak...')`.
        - `__tests__/applicant-detail-corrections.test.ts` — header comment, `correctionButton(wrapper, 'Tolak', 'Menolak...')`, dan `expect(btn.text()).toContain('Menolak...')`.
    - **Sengaja TIDAK disentuh**: `components/core/ConfirmationModal.vue` — `'Menghapus...'` di `:49` tetap, karena memang melayani aksi DELETE sungguhan (variant `destructive`) — preseden yang benar. Tidak ada komponen `RejectApplicantDialog` baru yang dibuat.
- File (4): 2 sumber recruitment di atas + 2 test di atas. Total 4 file, +11/−11.
- Test: assertion perilaku tidak berubah (POST url `screening.reject`/reject-correction, `disabled`, `aria-busy="true"`, spinner `[role="status"]`); hanya ekspektasi label yang berubah. TDD RED (2 gagal selagi sumber masih `Menghapus...`) → GREEN setelah fix sumber (lihat Verifikasi).
- Aturan 10–14: tidak ada kode/tipe/variabel redundant ditambah — perubahan murni perbaikan copy (Aturan 14, YAGNI); tidak memaksakan komponen bersama untuk satu pemakai.
- Jira: DFORM-32.

## Verifikasi

> Catatan kejujuran: perintah verifikasi dan loop TDD di bawah **dieksekusi oleh orchestrator**, bukan oleh penulis dokumen ini. Penulis men-grounding isi dokumen ke konten commit `f040fe6` dan evidence yang dilaporkan orchestrator.

- Targeted: `npx vitest run .../period-applicant-section.test.ts .../applicant-detail-corrections.test.ts` → **16 test passed (2 file)**, termasuk langkah TDD **RED** (2 gagal selagi sumber masih `Menghapus...`) → **GREEN** setelah fix sumber.
- Full recruitment dir: `npx vitest run resources/js/components/modules/dashboard/recruitment` → **5 file / 28 test passed**.
- `npx eslint` pada 4 file yang berubah → exit 0 (bersih).
- Grep `Menghapus` di dua file sumber recruitment → **nihil**.
- `git diff` pada `ConfirmationModal.vue` → **kosong** (tidak tersentuh).
- Verifikasi sumber: `PeriodApplicantSection.vue:725` kini `'Menolak...'` / idle `'Tolak applicant'`; `ApplicantDetailContent.vue:1055` kini `'Menolak...'` / idle `'Tolak'`; `ConfirmationModal.vue:49` tetap `'Menghapus...'` untuk variant destructive.

## Koreksi & temuan spec

Spec: `docs/big-changes/specs/2026-09-26-vue-hooks-migration-design.md` §10 Mx-1 cluster G (`:266`, `:260`) dan `docs/big-changes/specs/2026-09-26-m1-builder-autosave-design.md` Appendix R.1 cluster G (`:150`, `:171`, `:182`).

- Spec (R.1 `:150`, §10 `:266`) menyatakan **dua** dialog tolak setara yang keduanya salah label `Menghapus...` di `PeriodApplicantSection.vue:725` dan `ApplicantDetailContent.vue:1071`, lalu menuntut satu `RejectApplicantDialog` bersama untuk 2 call-site. **Recon membuktikan premis itu salah:**
    - `PeriodApplicantSection.vue` punya dialog tolak sungguhan (select alasan + catatan + `public_message`) → POST `screening.reject`, dengan copy sibuk salah `Menghapus...` → fix copy berlaku.
    - `ApplicantDetailContent.vue` **tidak** memuat `Menghapus...` pada alur tolak applicant-nya: alur itu berstruktur **berbeda** (dialog revise/reject dua-fungsi dengan checkbox `sections`, plus konfirmasi dua langkah berlabel `Simpan keputusan` → `Konfirmasi`). Satu-satunya `Menghapus...` ada di `:1055` dan milik aksi **tolak permintaan koreksi** (idle `Tolak`), bukan tolak applicant.
    - Baris `:1071` yang dikutip spec ternyata justru label skor **"Speaking"** (blok evaluasi interviewer), bukan tombol tolak.
- Karena hanya ada **satu** dialog tolak yang layak dibagikan, mengekstrak `RejectApplicantDialog` untuk satu pemakai melanggar **YAGNI** (Aturan 14). User memilih opsi **"hanya perbaiki copy"** (tanpa komponen baru) dan mengonfirmasi label sibuk aksi tolak-koreksi juga menjadi `Menolak...`.
- **Konsekuensi**: acceptance "grep `Menghapus...` nihil di kedua file recruitment" terpenuhi di level sumber; syarat **"satu `RejectApplicantDialog` / 2 call-site"** dengan sadar **dibatalkan**, dengan persetujuan user — dicatat sebagai **amandemen spec** beserta bukti di atas.
- Preseden benar dipertahankan: `ConfirmationModal.vue:49` tetap `Menghapus...` untuk variant `destructive` (aksi hapus sungguhan); tidak ada penyimpangan.

## Catatan untuk tim

- DFORM-32 adalah cluster **G** dari umbrella DFORM-18 (Mx, cluster A–L) yang dipecah jadi 10 Task top-level DFORM-30..DFORM-39; hanya cluster G yang dikerjakan di commit ini.
- Ini perbaikan bug copy (bukan perubahan perilaku fungsional): aksi Tolak sebelumnya menampilkan kata aksi hapus. Assertion non-label tetap sama.
- Syarat spec "satu `RejectApplicantDialog`" **dibatalkan** (amandemen, persetujuan user) karena hanya ada satu pemakai; jangan buat komponen itu tanpa call-site kedua yang nyata.
- `docs/big-changes/**` tetap gitignored, tidak ikut ter-commit.
- Sumber kebenaran akhir tetap diff Git + status Jira DFORM-32.
