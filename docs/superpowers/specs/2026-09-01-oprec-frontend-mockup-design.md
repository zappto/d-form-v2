# Design Spec — OpenRecruitment (OpRec) Module: Frontend Mockup (Milestone 1–3)

**Tanggal:** 2026-09-01
**Status:** Draft untuk review
**Lampiran PRD:** [`docs/PRD — DOSCOM OpenRecruitment (OpRec).md`](../PRD%20—%20DOSCOM%20OpenRecruitment%20(OpRec).md)
**Lampiran Flow:** [`docs/recruitment_flow_documentation.md`](../recruitment_flow_documentation.md)

---

## 1. Ringkasan

Membangun **modul OpenRecruitment (OpRec)** pada aplikasi D-Form v2 sebagai **frontend mockup ber-alur interaktif penuh**, mencakup **Milestone 1–3** PRD:

- Recruitment Period + Division + Landing Page (M1/M2)
- Application Form + Registration Number + Confirmation + Tracking (M2)
- Staff Screening: Pass / Revision Required / Reject + Correction Request (M3)

Keputusan utama: **frontend-only, dummy data, alur interaktif penuh**, mengikuti **design system dan struktur folder existing**, dan data disuplai **via props controller** (pola Inertia produksi) agar mudah di-swap ke backend nyata.

## 2. Lingkup

### 2.1 Dalam scope (frontend-only, dummy)

- Landing page publik `/open-recruitment`.
- Application form publik (personal info + division preference + dokumen) dengan validasi klien.
- Submit → confirmation screen + **registration number**.
- **Applicant tracking** (tanpa akun) via registration number.
- **Staff dashboard** (role admin) — daftar applicant, detail, screening (pass/revision/reject), correction requests.
- Alur interaktif: submit applicant → muncul di daftar staff → staff screening → tracking applicant terupdate.

### 2.2 Luar scope (sesi ini)

- Backend nyata (migrasi, model, controller logika, storage file, email sungguhan).
- Interview scheduling, attendance, queue, evaluation, final selection (Milestone 4+).
- Applicant akun/login, RBAC internal nyata.
- Upload file sungguhan (dummy file name/type saja).
- Feedback, reporting, audit trail.

## 3. Keputusan desain (hasil brainstorming)

| Aspek | Keputusan | Alasan |
|---|---|---|
| Scope | M1–3, frontend-only | PRD besar; backend & interview menyusul |
| Sumber data | Props via controller (dummy) | Pola Inertia produksi, mudah swap backend |
| Interaktivitas | Alur penuh via module singleton reactive | Demo nyata tanpa backend |
| Role internal | Admin saja | Ringan; RBAC nyata nanti |
| Bahasa | Bahasa Indonesia | Konsisten UI existing |
| Visual | Design system existing (shadcn-vue/Tailwind) | Konsisten, tanpa custom mahal |
| Dummy state | `recruitmentStore.ts` reactive module singleton | Tanpa dependency baru (Pinia) |

## 4. Arsitektur & struktur file

### 4.1 Struktur frontend (baru)

```
resources/js/
├── lib/
│   ├── dummyRecruitment.ts      # seed data: periods, divisions, applicants, screening reasons
│   └── recruitmentStore.ts      # state reactive singleton (submit → staff → tracking)
├── types/
│   └── recruitment.d.ts         # IRecruitmentPeriod, IApplicant, IApplication, dll
├── utils/composables/
│   ├── useRecruitmentTracking.ts    # logika tracking applicant
│   └── useRecruitmentScreening.ts   # logika screening staff
├── pages/
│   ├── OpenRecruitment.vue               # landing /open-recruitment
│   ├── OpenRecruitmentForm.vue           # application form
│   ├── OpenRecruitmentSubmitted.vue      # confirmation + registration number
│   ├── ApplicationTracking.vue           # tracking by registration number
│   └── Dashboard/Recruitment/
│       ├── Index.vue                # staff dashboard (ganti coming-soon)
│       ├── Applicants.vue           # daftar applicant
│       ├── ApplicantDetail.vue      # detail + screening action
│       └── CorrectionRequests.vue   # daftar correction request (staff)
└── components/modules/recruitment/
    ├── RecruitLandingHero.vue
    ├── RecruitTimelineSection.vue
    ├── RecruitDivisionCard.vue
    ├── RecruitApplicationFormFields.vue
    ├── RecruitTrackingTimeline.vue
    ├── RecruitStatusBadge.vue
    ├── RecruitApplicantTable.vue
    └── RecruitScreeningPanel.vue
```

### 4.2 Routes (baru, mengikuti `routes/web/*.php` auto-require)

File: `routes/web/recruitment.php` (public) dan rute staff di `routes/web/admin/index.php` (atau file admin terpisah `routes/web/admin/recruitment.php`).

**Public (tanpa auth):**

| Method | URI | Handler (closure/controller dummy) | Page |
|---|---|---|---|
| GET | `/open-recruitment` | `inertia('OpenRecruitment')` | Landing |
| GET | `/open-recruitment/apply` | `inertia('OpenRecruitmentForm')` | Form |
| POST | `/open-recruitment/apply` | closure: simpan ke store, redirect submitted | Submit |
| GET | `/open-recruitment/tracking` | `inertia('ApplicationTracking')` | Tracking (input nomor) |
| GET | `/open-recruitment/tracking/{registrationNumber}` | `inertia('ApplicationTracking')` | Tracking hasil |

**Staff (middleware `auth` + `organizer`):**

| Method | URI | Page |
|---|---|---|
| GET | `/admin/dashboard/recruitment` | `Dashboard/Recruitment/Index` |
| GET | `/admin/dashboard/recruitment/applicants` | `Dashboard/Recruitment/Applicants` |
| GET | `/admin/dashboard/recruitment/applicants/{id}` | `Dashboard/Recruitment/ApplicantDetail` |
| GET | `/admin/dashboard/recruitment/corrections` | `Dashboard/Recruitment/CorrectionRequests` |

> Route existing `dashboard.recruitment.index` (`inertia('Dashboard/Recruitment/Index')`) tetap; hanya halaman `Index.vue` yang diganti dari "coming soon" menjadi dashboard staff.

### 4.3 Alur data

```
[Landing] ──Daftar Sekarang──▶ [ApplicationForm]
                                     │ submit (validasi klien)
                                     ▼
                            recruitmentStore.addApplication(...)   ← simpan ke singleton
                                     │
                                     ▼
                         [Submitted: registration number + email info]
                                     │
                                     ▼
                     [Tracking?registrationNumber] ◀── staff juga update status
                                     │
                                     ▼
                         [Staff Dashboard: applicants list]
                                     │ buka detail
                                     ▼
                    [ApplicantDetail: screening Pass/Revision/Reject]
                                     │
                                     ├── Pass    → status DOCUMENT_PASSED
                                     ├── Revision→ status REVISION_REQUIRED (+reason) → applicant edit → re-submit
                                     └── Reject  → status DOCUMENT_REJECTED (+reason)
```

## 5. Model data dummy (types)

```ts
// resources/js/types/recruitment.d.ts
type RecruitPeriodStatus = 'draft' | 'open' | 'closed' | 'archived';
type RecruitStage =
    | 'submitted' | 'screening' | 'revision_required' | 'document_passed'
    | 'interview_scheduled' | 'waiting_attendance' | 'queued' | 'interviewing'
    | 'interviewed' | 'final_review' | 'accepted' | 'rejected' | 'cancelled';

interface IRecruitmentPeriod {
    id: string;
    name: string;            // "OpRec 2026"
    status: RecruitPeriodStatus;
    registrationStart: string;   // ISO
    registrationEnd: string;
    interviewStart?: string;
    interviewEnd?: string;
    finalizationEnd?: string;
    divisions: string[];     // ['programming','creative_media','network','data']
}

type RecruitDivisionId = 'programming' | 'creative_media' | 'network' | 'data';

interface IApplicant {
    id: string;
    nim: string;
    fullName: string;
    semester: 1 | 2 | 3;
    phone: string;
    personalEmail: string;
    studentEmail: string;
    instagram: string;
    primaryDivision: RecruitDivisionId;
    secondaryDivision: RecruitDivisionId | null;
    cvFile: string | null;       // nama file dummy
    portfolioType: 'url' | 'file' | null;
    portfolioUrl?: string | null;
    portfolioFile?: string | null;
    motivation: string;
    organizationExperience?: string;
    skills?: string;
}

interface IApplication {
    id: string;
    periodId: string;
    registrationNumber: string;   // OPREC-2026-0001
    applicant: IApplicant;
    stage: RecruitStage;
    submittedAt: string;          // ISO
    updatedAt: string;
    screening?: {
        decision: 'pass' | 'revision' | 'reject';
        reason: string;           // internal reason
        notes?: string;
        decidedBy: string;        // "Admin"
        decidedAt: string;
    };
    correctionRequests: ICorrectionRequest[];
    revisionRound: number;
    cancellation?: { reason: string; at: string };
}

interface ICorrectionRequest {
    id: string;
    applicationId: string;
    requestedBy: string;      // applicant
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    fields: string[];         // field names yang mau dikoreksi
    requestedAt: string;
    resolvedAt?: string;
}

interface IRecruitmentStore {
    periods: IRecruitmentPeriod[];
    applications: IApplication[];
    // actions
    addApplication(...): IApplication;
    getApplicationByRegistrationNumber(n): IApplication | undefined;
    screeningDecision(applicationId, decision, reason, notes): void;
    requestCorrection(...): void;
    approveCorrection(id): void;
    rejectCorrection(id): void;
}
```

## 6. Halaman & interaksi

### 6.1 Landing `/open-recruitment` (public)

- Hero dengan judul program, CTA "Daftar Sekarang" → `/open-recruitment/apply` (hanya aktif jika ada periode `open`).
- Timeline seleksi (dari periode).
- Division cards (4 divisi: Programming, Creative Media, Network, Data) dengan deskripsi.
- Syarat & ketentuan (eligibility: semester 1–3).
- Gunakan `LandingLayout` (Navbar + Footer) atau pola `Event.vue`.

### 6.2 Application Form `/open-recruitment/apply` (public)

- Form multi-section: **Data Pribadi** (nama, NIM, semester, telepon, email pribadi, email student, Instagram) + **Data Pendaftaran** (primary/secondary division, motivasi, pengalaman, keahlian) + **Dokumen** (CV file dummy, portfolio URL/file).
- Validasi klien: required, NIM format, semester 1–3, email valid, phone format, secondary ≠ primary, CV type pdf.
- Tombol submit → `recruitmentStore.addApplication(...)` → redirect ke `/open-recruitment/submitted/{regNumber}`.

### 6.3 Submitted `/open-recruitment/submitted/{regNumber}` (public)

- Confirmation screen: "Pendaftaran Berhasil", registration number (copyable), ringkasan data, info email konfirmasi (dummy), CTA ke tracking.

### 6.4 Tracking `/open-recruitment/tracking` + `/tracking/{regNumber}` (public)

- Halaman input registration number.
- Jika nomor ditemukan: tampilkan status timeline (`RecruitTrackingTimeline`), stage saat ini, jadwal interview (placeholder kosong di M3), hasil.
- Jika tidak ditemukan: pesan error.
- Nomor dicari di `recruitmentStore`.

### 6.5 Staff Dashboard `/admin/dashboard/recruitment` (admin)

- Ganti halaman coming-soon `Index.vue`.
- KPI ringkas: Total Applicants, Pending Screening, Passed Screening, Revision Required, Rejected (dari store).
- Tautan ke: Applicants, Correction Requests.

### 6.6 Applicants `/admin/dashboard/recruitment/applicants` (admin)

- Tabel applicant (NIM, nama, divisi, stage, submit date) + filter status/divisi + search.
- Klik baris → detail.

### 6.7 Applicant Detail `/admin/dashboard/recruitment/applicants/{id}` (admin)

- Data applicant lengkap + dokumen (dummy).
- `RecruitScreeningPanel`: tombol Pass / Revision Required / Reject; untuk Revision & Reject wajib pilih reason (dropdown) + notes opsional.
- History/activity ringkas (submitted → screening decision).
- Correction requests terkait + status.

### 6.8 Correction Requests `/admin/dashboard/recruitment/corrections` (admin)

- Daftar correction request (pending/approved/rejected).
- Approve / Reject dengan aksi.

## 7. Status lifecycle & transisi (dummy)

```
submitted ─▶ screening ──┬─▶ document_passed   (Pass)
                         ├─▶ revision_required ─▶ (applicant edit) ─▶ screening
                         └─▶ document_rejected  (Reject)
```
- `revision_required` memungkinkan applicant membuka kembali form (edit) → re-submit → kembali ke `screening`, `revisionRound` bertambah.
- `document_passed` = ujung M3 (interview stage placeholder untuk M4).

## 8. Notification & dummy email

- Pada submit → toast/notification "Email konfirmasi terkirim (dummy)".
- Pada screening decision → status tracking applicant berubah; email dummy ditandai di UI.
- Tidak ada email sungguhan di sesi ini.

## 9. Error handling & edge cases (dummy)

- NIM sudah terdaftar pada periode yang sama → tolak ("Sudah mendaftar").
- Registration number tidak ditemukan di tracking → pesan jelas.
- Periode tidak `open` → CTA landing disabled / form ditolak.
- Secondary division sama dengan primary → validasi error.
- File CV bukan PDF → error klien.
- Applicant cancel → status `cancelled` (opsional, M3).

## 10. Testing

Frontend-only mockup → verifikasi dengan:

- `npm run lint` (ESLint, no-any, --max-warnings 0).
- `npm run build` (Vite build) — memastikan TS/type valid.
- Manual smoke di browser:
  - Submit applicant → muncul di staff applicants.
  - Screening pass/revision/reject → status tracking terupdate.
  - Revision → applicant edit & re-submit → kembali ke screening.
  - Correction request → approve/reject.

## 11. Out of scope (eksplisit)

- Backend real (migrasi/model/service), storage, email sungguhan.
- Milestone 4+ (interview, attendance, queue, evaluation, final selection).
- RBAC internal nyata (Staff/Interviewer/Admin terpisah).
- Feedback, reporting, audit trail, multi-period real.

## 12. Catatan transisi ke backend (nanti)

- Store dummy → controller/service + migrasi `recruitments` domain.
- Props controller tinggal mengganti isi (shape tipe sudah sesuai).
- `recruitmentStore` dibuang, data dari DB.
- Halaman/komponen Vue tetap dipakai.
