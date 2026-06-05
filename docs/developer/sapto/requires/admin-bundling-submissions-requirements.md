# Admin Bundling Submissions Requirements

**Versi dokumen:** 1.0  
**Tanggal:** 5 Juni 2026  
**Status:** Requirement implementasi — kontrak data bersifat proposal sampai disepakati tim backend dan frontend.

---

## 1. Metadata & audiens

| Item | Nilai |
|------|-------|
| **Audiens** | Backend Laravel, frontend Vue/Inertia, QA |
| **Area produk** | Manage forms / form submissions untuk admin |
| **Tujuan** | Mengubah konsep tampilan submission admin untuk form bertipe **bundling** agar data ditampilkan sebagai **group card**, lalu admin dapat membuka isi peserta dalam group tersebut |
| **Referensi teknis** | `form_answers.group_token`, `registration_role`, `member_confirmation_status`, `leader_form_answer_id`, `review_status` |
| **Bukan tujuan** | Mengubah model dasar satu peserta = satu `form_answer`; QR dan absensi tetap per submission individu |

---

## 2. Ringkasan kebutuhan

Pada form dengan `forms.metadata.registration_mode = bundle`, halaman admin submissions tidak lagi menampilkan semua `form_answers` sebagai card individu di level utama.

Level utama harus menampilkan **card-card group bundle**. Satu card mewakili satu bundle / group yang dihubungkan oleh `group_token`. Saat admin klik card group, sistem menampilkan seluruh user dalam group tersebut:

- leader / ketua bundle;
- anggota yang sudah menerima undangan leader;
- anggota yang sudah diundang leader tetapi belum approve / masih pending.

Anggota yang belum approve undangan tetap harus terlihat di dalam group agar admin tahu komposisi undangan leader. Namun row/card anggota tersebut bersifat **read-only locked**:

- tidak bisa dibuka detail submission-nya;
- tidak bisa di-approve / reject oleh admin;
- tidak bisa diedit / diproses aksi administratif lain;
- hanya menampilkan identitas dan status undangan.

Untuk form non-bundling, perilaku existing tetap boleh dipertahankan: submission ditampilkan sebagai daftar/card individu.

---

## 3. Definisi status dan aturan akses admin

| Kondisi submission | Tampil di group? | Bisa lihat detail? | Bisa review admin? | Catatan |
|--------------------|------------------|--------------------|--------------------|---------|
| Leader bundle | Ya | Ya | Ya, mengikuti `review_status` | Leader adalah submission utama group |
| Member `accepted` | Ya | Ya | Ya, jika `review_status` masih pending | Sudah approve undangan leader |
| Member `pending` | Ya | Tidak | Tidak | Hanya ditampilkan sebagai locked card/row |
| Member `rejected` | Opsional, default tampil sebagai inactive | Tidak | Tidak | Ditampilkan jika produk ingin audit undangan ditolak |
| Member `expired` | Opsional, default tampil sebagai inactive | Tidak | Tidak | Ditampilkan jika produk ingin audit undangan expired |

**Aturan utama:** admin hanya boleh membuka detail dan melakukan review untuk submission member bundle jika `member_confirmation_status = accepted`. Submission pending/rejected/expired tidak boleh masuk ke alur review normal.

---

## 4. Kebutuhan backend

### 4.1 Deteksi mode form

Backend harus mengirimkan informasi mode registrasi ke halaman submissions:

```ts
form: {
  id: string
  title: string
  registration_mode: 'single' | 'bundle'
}
```

Sumber nilai:

- utama: `forms.metadata.registration_mode`;
- fallback: `single` jika metadata kosong atau key tidak tersedia.

### 4.2 Response untuk form bundling

Untuk `registration_mode = bundle`, endpoint admin submissions perlu mengembalikan koleksi group, bukan hanya paginator submission individu.

Proposal props Inertia:

```ts
{
  event: { id: string; title: string }
  form: {
    id: string
    title: string
    registration_mode: 'bundle'
  }
  fields: IFormField[]
  bundleGroups: {
    data: IBundleSubmissionGroup[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    links?: Array<{ url: string | null; label: string; active: boolean }>
  }
}
```

Tipe group yang disarankan:

```ts
interface IBundleSubmissionGroup {
  group_token: string
  leader: IFormSubmission
  members: IBundleSubmissionMember[]
  total_participants: number
  accepted_count: number
  pending_count: number
  rejected_count: number
  expired_count: number
  group_review_status: 'pending' | 'partial' | 'accepted' | 'rejected'
  submitted_at: string
}

interface IBundleSubmissionMember extends IFormSubmission {
  can_open_detail: boolean
  can_review: boolean
  locked_reason?: string | null
}
```

`can_open_detail` dan `can_review` wajib dihitung backend agar frontend tidak menebak aturan bisnis.

### 4.3 Query group bundle

Backend harus mengambil semua `form_answers` untuk form tersebut yang memiliki `group_token`, lalu mengelompokkan berdasarkan `group_token`.

Kebutuhan query:

- eager load `user:id,name,email`, `reviewer:id,name,email`;
- leader dapat ditemukan dari `registration_role = leader` atau fallback submission pertama dalam group jika data lama belum lengkap;
- member berasal dari `registration_role = member`;
- pending member **jangan difilter keluar** dari query group, berbeda dari roster peserta normal;
- urutan group default: `leader.created_at DESC` atau tanggal submission group terbaru;
- pagination berada di level group, bukan level member.

Catatan penting: scope seperti `whereListedForOrganizerParticipantRoster()` tidak boleh dipakai untuk response group bundle karena scope tersebut menyembunyikan member yang belum accepted. Halaman ini justru perlu melihat pending invitation dalam konteks group.

### 4.4 Field yang perlu dikirim per participant

Setiap participant minimal mengandung:

```ts
{
  id: string
  user: { id: string; name: string; email: string; avatar?: string | null } | null
  invited_email: string | null
  answers: Record<string, unknown>
  submitted_at: string
  review_status: 'pending' | 'accepted' | 'rejected' | null
  registration_role: 'leader' | 'member'
  member_confirmation_status: 'pending' | 'accepted' | 'rejected' | 'expired' | null
  group_token: string
  can_open_detail: boolean
  can_review: boolean
  locked_reason: string | null
}
```

Untuk member pending, backend boleh mengirim `answers` lengkap atau ringkas sesuai kebijakan privasi. Namun jika detail tidak boleh dibuka, frontend hanya wajib menampilkan identitas, email undangan, role, dan status.

### 4.5 Aturan `can_open_detail` dan `can_review`

Backend harus menetapkan:

| Role/status | `can_open_detail` | `can_review` |
|-------------|-------------------|--------------|
| Leader | `true` | `true` jika review masih pending |
| Member accepted | `true` | `true` jika review masih pending |
| Member pending | `false` | `false` |
| Member rejected | `false` | `false` |
| Member expired | `false` | `false` |

`locked_reason` contoh:

- `Menunggu anggota menerima undangan.`
- `Anggota menolak undangan.`
- `Undangan anggota sudah kedaluwarsa.`

### 4.6 Endpoint review

Endpoint review existing (`PATCH /dashboard/events/{event}/forms/{form}/submissions/{formAnswer}/review`) harus melakukan guard server-side:

- tolak review jika `registration_role = member` dan `member_confirmation_status != accepted`;
- return redirect back + toast error untuk request Inertia;
- return 403 atau 422 untuk request JSON, sesuai pola backend yang disepakati.

Frontend disabled state tidak cukup; validasi backend tetap wajib.

### 4.7 Export CSV

Jika export CSV tersedia untuk submissions:

- untuk form bundle, export tetap per peserta / per `form_answer`;
- tambahkan kolom `group_token`, `registration_role`, `member_confirmation_status`, dan `leader_email`;
- member pending/rejected/expired boleh ikut export sebagai audit, tetapi kolom review harus kosong / locked.

### 4.8 Backward compatibility

Untuk form `single` atau form lama tanpa metadata:

- response `submissions` existing tetap tersedia;
- UI existing tetap bisa berjalan;
- `bundleGroups` tidak wajib dikirim.

Untuk form bundle:

- backend boleh tetap mengirim `submissions` jika masih dibutuhkan komponen lama, tetapi sumber utama UI harus `bundleGroups`.

---

## 5. Kebutuhan frontend

### 5.1 Deteksi tampilan

Halaman `Dashboard/Events/Forms/Submissions.vue` perlu membaca `form.registration_mode`.

Aturan:

- `single` atau kosong: gunakan tampilan existing card submissions individu;
- `bundle`: gunakan tampilan group cards.

### 5.2 Tampilan level utama: group cards

Untuk form bundle, level utama menampilkan grid/list card group.

Informasi minimal pada card group:

- nama leader;
- email leader;
- `group_token` singkat;
- jumlah peserta total;
- jumlah accepted / pending / rejected / expired;
- status review group ringkas;
- tanggal submit.

Interaksi:

- klik card group membuka panel/detail group;
- card harus keyboard accessible (`button`, `tabindex`, `Enter`, `Space`);
- tampilan empty state berbeda: "Belum ada group submission".

### 5.3 Detail group

Saat group card dibuka, tampilkan seluruh participant dalam group:

- leader berada paling atas;
- member accepted setelah leader;
- member pending/rejected/expired setelah member accepted;
- setiap participant tampil sebagai card/row kecil dengan nama, email, role, status undangan, dan status review.

Participant yang boleh diproses:

- leader: bisa buka detail dan review sesuai status;
- member accepted: bisa buka detail dan review sesuai status.

Participant locked:

- member pending/rejected/expired harus tetap tampil;
- card/row memakai visual disabled atau locked;
- tombol detail tidak ditampilkan atau disabled;
- tombol accept/reject tidak ditampilkan atau disabled;
- tampilkan alasan singkat dari `locked_reason`.

### 5.4 Detail submission

`FormSubmissionDetailSheet` tetap bisa dipakai untuk participant yang `can_open_detail = true`.

Sebelum membuka detail:

```ts
if (!submission.can_open_detail) return
```

Untuk participant locked, jangan set `selectedSubmission` dan jangan buka sheet.

### 5.5 Review action

Sebelum mengirim review:

```ts
if (!submission.can_review) return
```

Tombol action juga harus disabled jika:

- `isSubmissionReviewing(submission.id)`;
- `submission.can_review === false`;
- existing helper `submissionAdminAcceptBlocked(submission)` bernilai true.

### 5.6 Tipe TypeScript

Tambahkan tipe global atau module type:

```ts
interface IBundleSubmissionGroup {
  group_token: string
  leader: IBundleSubmissionMember
  members: IBundleSubmissionMember[]
  total_participants: number
  accepted_count: number
  pending_count: number
  rejected_count: number
  expired_count: number
  group_review_status: 'pending' | 'partial' | 'accepted' | 'rejected'
  submitted_at: string
}

interface IBundleSubmissionMember extends IFormSubmission {
  invited_email?: string | null
  can_open_detail: boolean
  can_review: boolean
  locked_reason?: string | null
}
```

`IForm` atau prop form submissions perlu diperluas dengan `registration_mode?: 'single' | 'bundle'`.

### 5.7 Komponen yang disarankan

Komponen baru yang direkomendasikan:

- `FormBundleGroupsCardGridView.vue` untuk daftar group;
- `FormBundleGroupDetailSheet.vue` atau perluasan sheet existing untuk isi group;
- helper UI baru di `formSubmissionsUi.ts` untuk label `member_confirmation_status` dan status locked.

Hindari mencampur seluruh logika bundle ke komponen card existing jika membuat kondisi template terlalu kompleks.

---

## 6. Acceptance criteria

### Backend

- [ ] Endpoint submissions mengirim `form.registration_mode`.
- [ ] Untuk form bundle, response menyediakan `bundleGroups` ter-paginate di level group.
- [ ] Member pending/rejected/expired tetap muncul di dalam group dan tidak hilang karena scope roster peserta.
- [ ] Setiap participant memiliki `can_open_detail`, `can_review`, dan `locked_reason`.
- [ ] Endpoint review menolak server-side untuk member yang belum `accepted`.
- [ ] Form single tetap berjalan dengan response `submissions` existing.

### Frontend

- [ ] Form single tetap memakai tampilan submissions existing.
- [ ] Form bundle menampilkan card-card group di level utama.
- [ ] Klik card group membuka daftar leader + semua member yang diundang.
- [ ] Member pending tampil tetapi tidak bisa dibuka detailnya.
- [ ] Member pending/rejected/expired tidak memiliki aksi accept/reject admin.
- [ ] Leader dan member accepted tetap bisa dibuka detailnya dan direview sesuai `review_status`.
- [ ] Empty state, pagination, dan export tetap tersedia pada mode bundle.

### QA

- [ ] Group berisi 1 leader + 2 member accepted + 1 member pending: halaman utama menampilkan 1 group card, detail group menampilkan 4 participant.
- [ ] Admin klik member pending: detail sheet tidak terbuka.
- [ ] Admin memaksa request review member pending: backend menolak.
- [ ] Setelah member pending menerima undangan, refresh halaman membuat participant tersebut bisa dibuka detail dan bisa direview.
- [ ] Form single tidak berubah perilakunya.

---

## 7. Pertanyaan terbuka

- Apakah `max_team_size` menghitung leader atau hanya anggota tambahan? UI admin perlu menampilkan definisi yang sama dengan validasi backend.
- Apakah member `rejected` dan `expired` harus selalu tampil di detail group atau disembunyikan di balik filter "Tampilkan undangan tidak aktif"?
- Apakah detail answers untuk member pending boleh dikirim ke frontend tetapi tidak dibuka, atau backend perlu menyembunyikan answers sampai member accepted?
- Apakah review group perlu action massal, atau tetap per participant seperti model `form_answers` saat ini?
