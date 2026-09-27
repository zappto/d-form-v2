# Sapto Changes — 27 September 2026 (DFORM-10 M6 + DFORM-12 M8, verifikasi)

Lanjutan dari [`saptoChanges27-09-2026-DFORM-11.md`](./saptoChanges27-09-2026-DFORM-11.md) (DFORM-11 M7). Berbeda dari file sebelumnya: **tidak ada commit baru** — ini verifikasi bahwa kedua ticket yang sudah berstatus Done di Jira memang terimplementasi dan dinilai terhadap aturan 10–13. Pola sama: per-tanggal, per-ticket tertaut ke Issue.

## Ringkasan (TL;DR)

| Ticket | Scope | Putusan |
|--------|-------|---------|
| DFORM-10 M6 `useDraftRestore` | Satukan 6 salinan restore draft responden jadi satu hook | **SUDAH** — 6 konsumen, key kompatibel, test hijau; deviasi kecil aturan 11/13 di `useRespondentDraft.ts` |
| DFORM-12 M8 `useBannerFilePicker` + `useObjectUrl` | Satukan trio banner picker + tutup bocor | **SUDAH (duplikat DFORM-7)** — persis slice banner DFORM-7 (`2a9a61d`/`530eaba`); sisa M3 penuh (builder/Profile/Fill/FieldEditor) di luar scope trio |

## Timeline verifikasi

### 27 September 2026

| Waktu | Aktivitas | Author | Issue | Hasil |
|-------|-----------|--------|-------|-------|
| 14:30 | Verifikasi implementasi + kepatuhan 10–13, vitest 6 files 31/31 | zappto | DFORM-10 | SUDAH, 2 deviasi kecil |
| 14:30 | Verifikasi duplikasi terhadap DFORM-7 + sisa M3 | zappto | DFORM-12 | SUDAH (duplikat), SEBAGIAN bila M8 = M3 penuh |

## Per-ticket

#### DFORM-10 M6: useDraftRestore — SUDAH

- Implementasi: `useRespondentDraft.ts` (lifecycle draft localStorage + `restore()` toleran + `clear`) + `useDraftRestore.ts` (orkestrasi tipis: restore saat `onMounted`, cancel saat `onBeforeUnmount`, `savedTimeLabel`).
- 6 konsumen: `Apply.vue:179`, `useFormFillPage.ts:165`, `TeamInvitation.vue:100`, `Track/Edit.vue:79`, `Track/Show.vue:147`, `OpRecFeedbackForm.vue:48`.
- Key kompatibel: `oprec-apply-draft-v1` legacy terbaca (test compat), plus `dform:track-edit`, `dform:track-correction`, `dform:track-feedback`, `dform:invite:<formId>`, `props.draftKey`.
- Commit (tidak ada yang menyebut DFORM-10 — traceability gap): `0c67f79` (unified useRespondentDraft), `56c186b` + merge `09a3c51` (useDraftRestore, M2), `c3c3bfa` (rename hooks, DFORM-8). Namespace: spec menyebut deliverable ini M2, ticket menyebut M6.
- Kepatuhan 10–13: 10 lulus, 12 lulus; **11 sebagian** (`?? 800` duplikat `RESPONDENT_DRAFT_DEBOUNCE_MS = 800` — magic number tersebar); **13 gagal di `useRespondentDraft.ts`** (doc 6/8 baris, interface tanpa doc).
- Test: `useRespondentDraft` 5 + `use-draft-restore` 4 + `op-rec-feedback-form` 4 + `team-invitation` 8, hijau.

#### DFORM-12 M8: useBannerFilePicker + useObjectUrl — SUDAH (duplikat DFORM-7)

- Implementasi identik DFORM-7: `useObjectUrl.ts` + `useBannerFilePicker.ts`, konsumen trio `Create.vue:32`, `Edit.vue:62`, `EventDashboardForm.vue:252`, test 5+5 hijau.
- Commit: `2a9a61d`, `530eaba` (keduanya berlabel DFORM-7); tidak ada commit/file menyebut DFORM-12.
- Kepatuhan 10–13: lulus 4/4 pada kedua hook.
- Sisa bila M8 dimaksudkan menutup M3 penuh (di luar scope trio tertulis): `FormBuilderBannerBlock.vue:61`, `Profile.vue:139`, `useFormFillPage.ts:302`, `FieldEditor.vue:126` masih `createObjectURL` manual (`FormFieldAnswerDisplay` se-tick sengaja dikecualikan).

## Verifikasi

- `npx vitest run` 6 files terkait: 31/31 passed (dijalankan saat verifikasi).
- Tidak ada perubahan kode pada sesi ini — murni audit + dokumen.

## Tindak lanjut yang disarankan (belum dikerjakan)

1. Satukan `800` debounce ke satu konstanta bersama (aturan 11).
2. Pendekkan doc `useRespondentDraft` ke 1–2 baris + doc interface (aturan 13).
3. Putuskan: DFORM-12 ditutup sebagai duplikat DFORM-7, atau dibuka scope lanjutan untuk sisa M3 (builder/Profile/Fill/FieldEditor).
4. Tautkan commit ke ticket di Jira (komentar ini sudah ditambahkan ke kedua ticket).
