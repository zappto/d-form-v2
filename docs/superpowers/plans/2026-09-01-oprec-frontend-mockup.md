# OpenRecruitment (OpRec) Frontend Mockup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul OpenRecruitment (OpRec) sebagai frontend mockup interaktif penuh (Milestone 1–3) pada D-Form v2: landing, application form, registration number, tracking, dan staff screening — dengan dummy data via props controller.

**Architecture:** Halaman Inertia Vue baru di-route via controller dummy yang mengirim props dari `recruitmentStore` (state reactive singleton). Data seed di `dummyRecruitment.ts`. Publik tanpa auth (`LandingLayout`), staff memakai middleware `organizer` (`DashboardLayout`). Saat backend siap, controller tinggal diganti isi props — komponen Vue tetap.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Inertia.js 2, Tailwind CSS 4, shadcn-vue/reka-ui, TypeScript strict (no-`any`), Laravel 12 route + Inertia.

## Global Constraints

- Semua komponen wajib `<script setup lang="ts">` — dilarang Options API (rules FE §1, §4.1).
- Props via `defineProps<{...}>()` generic; emits via `defineEmits([...])` (rules FE §4.2–§4.3).
- Data halaman wajib dari Inertia props controller — dilarang `axios.get` di `onMounted` (rules FE §5.2).
- Setiap page pakai `<Head>` dari `@inertiajs/vue3` (rules FE §5.3).
- Dilarang `any` — gunakan `unknown`/interface (rules FE §7).
- Komponen OpRec di `components/modules/recruitment/`; dilarang mengubah `components/ui/*` (shadcn) (rules FE §2, §4).
- Bahasa UI: Indonesia.
- Nama file: .vue PascalCase, .ts camelCase (rules FE §1, §3).
- Perintah verifikasi: `npm run lint` (no-any, --max-warnings 0), `npm run build`.
- Jangan commit `.env` (rules general §4).

---

### Task 1: TypeScript types + dummy seed data

**Files:**
- Create: `resources/js/types/recruitment.d.ts`
- Create: `resources/js/lib/dummyRecruitment.ts`

**Interfaces:**
- Produces: `IRecruitmentPeriod`, `IRecruitStage`, `IRecruitDivisionId`, `IApplicant`, `IApplication`, `ICorrectionRequest`, `IRecruitmentScreening`, `IRecruitmentStore`; seed `dummyPeriods`, `dummyApplicants`, `dummyApplications`, `screeningReasons` (dipakai semua task berikut).

- [ ] **Step 1: Tulis tipe & seed**

Buat `resources/js/types/recruitment.d.ts`:

```ts
export type RecruitPeriodStatus = 'draft' | 'open' | 'closed' | 'archived';
export type RecruitStage =
    | 'submitted' | 'screening' | 'revision_required' | 'document_passed'
    | 'interview_scheduled' | 'waiting_attendance' | 'queued' | 'interviewing'
    | 'interviewed' | 'final_review' | 'accepted' | 'rejected' | 'cancelled';

export type RecruitDivisionId = 'programming' | 'creative_media' | 'network' | 'data';

export interface IRecruitmentPeriod {
    id: string;
    name: string;
    status: RecruitPeriodStatus;
    registrationStart: string;
    registrationEnd: string;
    interviewStart?: string;
    interviewEnd?: string;
    finalizationEnd?: string;
    divisions: RecruitDivisionId[];
}

export interface IApplicant {
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
    cvFile: string | null;
    portfolioType: 'url' | 'file' | null;
    portfolioUrl?: string | null;
    portfolioFile?: string | null;
    motivation: string;
    organizationExperience?: string;
    skills?: string;
}

export type RecruitScreeningDecision = 'pass' | 'revision' | 'reject';

export interface IRecruitmentScreening {
    decision: RecruitScreeningDecision;
    reason: string;
    notes?: string;
    decidedBy: string;
    decidedAt: string;
}

export interface ICorrectionRequest {
    id: string;
    applicationId: string;
    requestedBy: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    fields: string[];
    requestedAt: string;
    resolvedAt?: string;
}

export interface IApplication {
    id: string;
    periodId: string;
    registrationNumber: string;
    applicant: IApplicant;
    stage: RecruitStage;
    submittedAt: string;
    updatedAt: string;
    screening?: IRecruitmentScreening;
    correctionRequests: ICorrectionRequest[];
    revisionRound: number;
    cancellation?: { reason: string; at: string };
}

export interface IRecruitmentStore {
    periods: IRecruitmentPeriod[];
    applications: IApplication[];
}
```

- [ ] **Step 2: Buat seed**

Buat `resources/js/lib/dummyRecruitment.ts`:

```ts
import type {
    IApplication,
    IRecruitmentPeriod,
} from '@/types/recruitment';

export const dummyPeriods: IRecruitmentPeriod[] = [
    {
        id: 'period-2026',
        name: 'OpRec 2026',
        status: 'open',
        registrationStart: '2026-09-01T00:00:00+07:00',
        registrationEnd: '2026-09-30T23:59:59+07:00',
        interviewStart: '2026-10-05T08:00:00+07:00',
        interviewEnd: '2026-10-09T17:00:00+07:00',
        finalizationEnd: '2026-10-15T23:59:59+07:00',
        divisions: ['programming', 'creative_media', 'network', 'data'],
    },
];

export const screeningReasons = [
    'Data tidak lengkap',
    'Data tidak valid',
    'Dokumen tidak sesuai',
    'Dokumen tidak dapat dibaca',
    'Informasi tidak sesuai',
    'Persyaratan tidak terpenuhi',
    'Lainnya',
];

export const divisionLabels: Record<string, string> = {
    programming: 'Pemrograman',
    creative_media: 'Creative Media',
    network: 'Jaringan',
    data: 'Data',
};

export const dummyApplications: IApplication[] = [
    {
        id: 'app-0001',
        periodId: 'period-2026',
        registrationNumber: 'OPREC-2026-0001',
        applicant: {
            id: 'apl-0001',
            nim: 'A11.2026.00001',
            fullName: 'Budi Santoso',
            semester: 2,
            phone: '081234567890',
            personalEmail: 'budi@gmail.com',
            studentEmail: 'budi@students.dinus.ac.id',
            instagram: 'budi.santoso',
            primaryDivision: 'programming',
            secondaryDivision: 'data',
            cvFile: 'cv-budi.pdf',
            portfolioType: 'url',
            portfolioUrl: 'https://github.com/budi',
            motivation: 'Ingin mengembangkan skill programming di komunitas.',
            organizationExperience: 'Anggota UKM Robotika.',
            skills: 'PHP, JavaScript, Git',
        },
        stage: 'submitted',
        submittedAt: '2026-09-02T09:15:00+07:00',
        updatedAt: '2026-09-02T09:15:00+07:00',
        correctionRequests: [],
        revisionRound: 0,
    },
    {
        id: 'app-0002',
        periodId: 'period-2026',
        registrationNumber: 'OPREC-2026-0002',
        applicant: {
            id: 'apl-0002',
            nim: 'A11.2026.00002',
            fullName: 'Siti Rahma',
            semester: 3,
            phone: '082198765432',
            personalEmail: 'siti.rahma@yahoo.com',
            studentEmail: 'siti@students.dinus.ac.id',
            instagram: 'siti.rahma',
            primaryDivision: 'creative_media',
            secondaryDivision: null,
            cvFile: 'cv-siti.pdf',
            portfolioType: 'file',
            portfolioFile: 'portfolio-siti.pdf',
            motivation: 'Tertarik di bidang desain dan media kreatif.',
            organizationExperience: 'Panitia dies natalis.',
            skills: 'Figma, Illustrator',
        },
        stage: 'screening',
        submittedAt: '2026-09-03T10:00:00+07:00',
        updatedAt: '2026-09-03T10:00:00+07:00',
        correctionRequests: [],
        revisionRound: 0,
    },
];
```

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit -p tsconfig.json` — Expected: tidak ada error tipe baru (file .d.ts + .ts valid). Jika tsconfig tidak punya `noEmit`, jalankan `npm run build` dan pastikan sukses.

- [ ] **Step 4: Commit**

```bash
git add resources/js/types/recruitment.d.ts resources/js/lib/dummyRecruitment.ts
git commit -m "feat: add recruitment types and dummy seed data"
```

---

### Task 2: Recruitment store (state reactive singleton)

**Files:**
- Create: `resources/js/lib/recruitmentStore.ts`

**Interfaces:**
- Consumes: `IRecruitmentStore`, `IApplication`, `IApplicant`, `ICorrectionRequest`, `RecruitScreeningDecision` (Task 1).
- Produces: `recruitmentStore` (singleton reactive), `addApplication()`, `getApplicationByRegistrationNumber()`, `screeningDecision()`, `requestCorrection()`, `approveCorrection()`, `rejectCorrection()`, `getNextRegistrationNumber()`, `resetRecruitmentStore()`.

- [ ] **Step 1: Tulis store**

Buat `resources/js/lib/recruitmentStore.ts`:

```ts
import { reactive } from 'vue';
import type {
    IApplication,
    IApplicant,
    ICorrectionRequest,
    IRecruitmentStore,
    RecruitScreeningDecision,
    RecruitStage,
} from '@/types/recruitment';
import { dummyApplications, dummyPeriods } from './dummyRecruitment';

const state = reactive<IRecruitmentStore>({
    periods: [...dummyPeriods],
    applications: [...dummyApplications],
});

let registrationCounter = dummyApplications.length;

function nextRegistrationNumber(periodName: string): string {
    registrationCounter += 1;
    const year = new Date().getFullYear();
    return `OPREC-${year}-${String(registrationCounter).padStart(4, '0')}`;
}

function getApplicationByRegistrationNumber(regNumber: string): IApplication | undefined {
    return state.applications.find((a) => a.registrationNumber === regNumber);
}

function addApplication(applicant: IApplicant, periodId: string): IApplication {
    const period = state.periods.find((p) => p.id === periodId) ?? state.periods[0];
    const now = new Date().toISOString();
    const application: IApplication = {
        id: `app-${Date.now()}`,
        periodId,
        registrationNumber: nextRegistrationNumber(period.name),
        applicant,
        stage: 'submitted',
        submittedAt: now,
        updatedAt: now,
        correctionRequests: [],
        revisionRound: 0,
    };
    state.applications.unshift(application);
    return application;
}

function setStage(applicationId: string, stage: RecruitStage): void {
    const app = state.applications.find((a) => a.id === applicationId);
    if (app) {
        app.stage = stage;
        app.updatedAt = new Date().toISOString();
    }
}

function screeningDecision(
    applicationId: string,
    decision: RecruitScreeningDecision,
    reason: string,
    notes?: string,
): void {
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) {
        return;
    }
    app.screening = {
        decision,
        reason,
        notes,
        decidedBy: 'Admin',
        decidedAt: new Date().toISOString(),
    };
    if (decision === 'pass') {
        app.stage = 'document_passed';
    } else if (decision === 'reject') {
        app.stage = 'document_rejected';
    } else {
        app.stage = 'revision_required';
    }
    app.updatedAt = new Date().toISOString();
}

function requestCorrection(
    applicationId: string,
    reason: string,
    fields: string[],
): ICorrectionRequest {
    const app = state.applications.find((a) => a.id === applicationId);
    const request: ICorrectionRequest = {
        id: `corr-${Date.now()}`,
        applicationId,
        requestedBy: app?.applicant.fullName ?? 'Applicant',
        reason,
        status: 'pending',
        fields,
        requestedAt: new Date().toISOString(),
    };
    app?.correctionRequests.push(request);
    return request;
}

function approveCorrection(requestId: string): void {
    for (const app of state.applications) {
        const req = app.correctionRequests.find((r) => r.id === requestId);
        if (req) {
            req.status = 'approved';
            req.resolvedAt = new Date().toISOString();
            if (app.stage === 'document_passed' || app.stage === 'document_rejected') {
                app.stage = 'revision_required';
                app.updatedAt = new Date().toISOString();
            }
            return;
        }
    }
}

function rejectCorrection(requestId: string): void {
    for (const app of state.applications) {
        const req = app.correctionRequests.find((r) => r.id === requestId);
        if (req) {
            req.status = 'rejected';
            req.resolvedAt = new Date().toISOString();
            return;
        }
    }
}

function resetRecruitmentStore(): void {
    state.periods = [...dummyPeriods];
    state.applications = [...dummyApplications];
    registrationCounter = dummyApplications.length;
}

export const recruitmentStore = {
    state,
    addApplication,
    getApplicationByRegistrationNumber,
    screeningDecision,
    requestCorrection,
    approveCorrection,
    rejectCorrection,
    resetRecruitmentStore,
    nextRegistrationNumber,
};
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build` — Expected: sukses tanpa error TS.

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/recruitmentStore.ts
git commit -m "feat: add reactive recruitment store singleton"
```

---

### Task 3: Routes + controller dummy (public & staff)

**Files:**
- Create: `app/Http/Controllers/OpenRecruitmentController.php`
- Create: `app/Http/Controllers/Dashboard/Recruitment/RecruitmentStaffController.php`
- Create: `routes/web/recruitment.php`
- Modify: `routes/web/admin/index.php` (replace recruitment route closure + tambah rute staff)

**Interfaces:**
- Produces (consumed by semua task halaman):
  - `GET /open-recruitment` → `inertia('OpenRecruitment', { period, divisions, isOpen, registrationUrl })`
  - `GET /open-recruitment/apply` → `inertia('OpenRecruitmentForm', { period, divisions, submitUrl, alreadySubmitted })`
  - `GET /open-recruitment/submitted/{regNumber}` → `inertia('OpenRecruitmentSubmitted', { application })`
  - `GET /open-recruitment/tracking` → `inertia('ApplicationTracking', {})`
  - `GET /open-recruitment/tracking/{regNumber}` → `inertia('ApplicationTracking', { application | error })`
  - `GET /admin/dashboard/recruitment` → `inertia('Dashboard/Recruitment/Index', { stats })`
  - `GET /admin/dashboard/recruitment/applicants` → `inertia('Dashboard/Recruitment/Applicants', { applications })`
  - `GET /admin/dashboard/recruitment/applicants/{id}` → `inertia('Dashboard/Recruitment/ApplicantDetail', { application })`
  - `GET /admin/dashboard/recruitment/corrections` → `inertia('Dashboard/Recruitment/CorrectionRequests', { corrections })`
- Consumes: `recruitmentStore` (dari controller PHP? — lihat catatan di Task 3 Step 1).

- [ ] **Step 1: Pahami cara controller PHP mengakses store TS**

Karena frontend-only, controller dummy **tidak** membaca store TS langsung (PHP tidak bisa import TS). Pendekatan: controller mengirim props minimal statis (period/divisions dari array PHP sederhana), dan **komponen Vue membaca `recruitmentStore`** untuk data dinamis (applications). Ini tetap memenuhi "data via props" untuk data statis, dan store untuk state runtime.

- [ ] **Step 2: Buat controller publik**

Buat `app/Http/Controllers/OpenRecruitmentController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpenRecruitmentController extends Controller
{
    /** @var list<array{id:string,name:string,status:string,registrationStart:string,registrationEnd:string,divisions:list<string>}> */
    private array $periods = [
        [
            'id' => 'period-2026',
            'name' => 'OpRec 2026',
            'status' => 'open',
            'registrationStart' => '2026-09-01T00:00:00+07:00',
            'registrationEnd' => '2026-09-30T23:59:59+07:00',
            'divisions' => ['programming', 'creative_media', 'network', 'data'],
        ],
    ];

    public function index(): Response
    {
        $period = $this->periods[0];

        return Inertia::render('OpenRecruitment', [
            'period' => $period,
            'divisions' => [
                ['id' => 'programming', 'label' => 'Pemrograman', 'description' => 'Pengembangan software & web'],
                ['id' => 'creative_media', 'label' => 'Creative Media', 'description' => 'Desain, video, konten'],
                ['id' => 'network', 'label' => 'Jaringan', 'description' => 'Infrastruktur & jaringan'],
                ['id' => 'data', 'label' => 'Data', 'description' => 'Data analysis & engineering'],
            ],
            'isOpen' => $period['status'] === 'open',
            'registrationUrl' => route('open-recruitment.apply'),
        ]);
    }

    public function apply(): Response
    {
        $period = $this->periods[0];

        return Inertia::render('OpenRecruitmentForm', [
            'period' => $period,
            'divisions' => ['programming', 'creative_media', 'network', 'data'],
            'submitUrl' => route('open-recruitment.store'),
            'alreadySubmitted' => false,
        ]);
    }

    public function submitted(string $registrationNumber): Response
    {
        return Inertia::render('OpenRecruitmentSubmitted', [
            'registrationNumber' => $registrationNumber,
            'confirmationMessage' => 'Pendaftaran berhasil dikirim. Email konfirmasi telah dikirim (dummy).',
        ]);
    }
}
```

- [ ] **Step 3: Buat controller staff**

Buat `app/Http/Controllers/Dashboard/Recruitment/RecruitmentStaffController.php`:

```php
<?php

namespace App\Http\Controllers\Dashboard\Recruitment;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class RecruitmentStaffController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard/Recruitment/Index', [
            'stats' => [
                'total' => 2,
                'pendingScreening' => 1,
                'passed' => 0,
                'revision' => 0,
                'rejected' => 0,
            ],
        ]);
    }

    public function applicants(): Response
    {
        return Inertia::render('Dashboard/Recruitment/Applicants', [
            'applications' => [],
        ]);
    }

    public function applicantDetail(string $id): Response
    {
        return Inertia::render('Dashboard/Recruitment/ApplicantDetail', [
            'application' => null,
        ]);
    }

    public function corrections(): Response
    {
        return Inertia::render('Dashboard/Recruitment/CorrectionRequests', [
            'corrections' => [],
        ]);
    }
}
```

> **Catatan:** props `applications`/`application`/`corrections` sengaja dikirim `[]`/`null` karena data dinamis dibaca dari `recruitmentStore` di komponen. Saat backend siap, controller diisi query DB dan props berisi data nyata.

- [ ] **Step 4: Buat route file publik**

Buat `routes/web/recruitment.php` (auto-require dari `routes/web.php`):

```php
<?php

use App\Http\Controllers\OpenRecruitmentController;
use Illuminate\Support\Facades\Route;

Route::get('/open-recruitment', [OpenRecruitmentController::class, 'index'])
    ->name('open-recruitment.index');

Route::get('/open-recruitment/apply', [OpenRecruitmentController::class, 'apply'])
    ->name('open-recruitment.apply');

Route::get('/open-recruitment/submitted/{registrationNumber}', [OpenRecruitmentController::class, 'submitted'])
    ->name('open-recruitment.submitted');

Route::get('/open-recruitment/tracking', function () {
    return Inertia::render('ApplicationTracking');
})->name('open-recruitment.tracking');

Route::get('/open-recruitment/tracking/{registrationNumber}', function (string $registrationNumber) {
    return Inertia::render('ApplicationTracking', [
        'registrationNumber' => $registrationNumber,
    ]);
})->name('open-recruitment.tracking.show');
```

> Pastikan `use Inertia\Inertia;` di bagian atas closure. (Tambahkan import bila perlu.)

- [ ] **Step 5: Update rute staff di admin/index.php**

Di `routes/web/admin/index.php`, ganti baris:
```php
Route::get('/recruitment', fn () => inertia('Dashboard/Recruitment/Index'))->name('dashboard.recruitment.index');
```
menjadi:
```php
Route::get('/recruitment', [RecruitmentStaffController::class, 'index'])->name('dashboard.recruitment.index');
Route::get('/recruitment/applicants', [RecruitmentStaffController::class, 'applicants'])->name('dashboard.recruitment.applicants');
Route::get('/recruitment/applicants/{id}', [RecruitmentStaffController::class, 'applicantDetail'])->name('dashboard.recruitment.applicant-detail');
Route::get('/recruitment/corrections', [RecruitmentStaffController::class, 'corrections'])->name('dashboard.recruitment.corrections');
```
Tambah import: `use App\Http\Controllers\Dashboard\Recruitment\RecruitmentStaffController;` di atas file.

- [ ] **Step 6: Verifikasi route**

Run: `php artisan route:list --path=open-recruitment` dan `php artisan route:list --path=recruitment`
Expected: semua rute di atas terdaftar dengan nama yang benar.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/OpenRecruitmentController.php app/Http/Controllers/Dashboard/Recruitment/RecruitmentStaffController.php routes/web/recruitment.php routes/web/admin/index.php
git commit -m "feat: add OpRec dummy routes and controllers"
```

---

### Task 4: Komponen modul recruitment (shared)

**Files:**
- Create: `resources/js/components/modules/recruitment/RecruitStatusBadge.vue`
- Create: `resources/js/components/modules/recruitment/RecruitTrackingTimeline.vue`
- Create: `resources/js/components/modules/recruitment/RecruitDivisionCard.vue`
- Create: `resources/js/components/modules/recruitment/RecruitApplicationFormFields.vue`
- Create: `resources/js/components/modules/recruitment/RecruitApplicantTable.vue`
- Create: `resources/js/components/modules/recruitment/RecruitScreeningPanel.vue`
- Create: `resources/js/components/modules/recruitment/RecruitLandingHero.vue`
- Create: `resources/js/components/modules/recruitment/RecruitTimelineSection.vue`

**Interfaces:**
- Consumes: types Task 1, `divisionLabels` (Task 1).
- Produces (dipakai halaman): semua komponen di atas dengan props eksplisit.

- [ ] **Step 1: RecruitStatusBadge.vue**

`resources/js/components/modules/recruitment/RecruitStatusBadge.vue` — badge status stage dengan warna per status. Gunakan `Badge` dari `components/ui/badge`:

```vue
<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import type { RecruitStage } from '@/types/recruitment';
import { computed } from 'vue';

const props = defineProps<{ stage: RecruitStage }>();

const config: Record<RecruitStage, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
    submitted: { label: 'Diajukan', variant: 'secondary' },
    screening: { label: 'Screening', variant: 'secondary' },
    revision_required: { label: 'Perlu Revisi', variant: 'outline' },
    document_passed: { label: 'Berkas Lolos', variant: 'success' },
    document_rejected: { label: 'Berkas Ditolak', variant: 'destructive' },
    interview_scheduled: { label: 'Interview Dijadwalkan', variant: 'secondary' },
    waiting_attendance: { label: 'Menunggu Kehadiran', variant: 'secondary' },
    queued: { label: 'Dalam Antrean', variant: 'secondary' },
    interviewing: { label: 'Interview Berlangsung', variant: 'secondary' },
    interviewed: { label: 'Sudah Interview', variant: 'secondary' },
    final_review: { label: 'Review Akhir', variant: 'secondary' },
    accepted: { label: 'Diterima', variant: 'success' },
    rejected: { label: 'Ditolak', variant: 'destructive' },
    cancelled: { label: 'Dibatalkan', variant: 'outline' },
};

const label = computed(() => config[props.stage].label);
const variant = computed(() => config[props.stage].variant);
</script>

<template>
    <Badge :variant="variant">{{ label }}</Badge>
</template>
```

> Jika `Badge` shadcn tidak punya variant `success`, gunakan `default` + class `bg-green-500/10 text-green-600`. Cek `components/ui/badge/index.ts` dulu.

- [ ] **Step 2: RecruitTrackingTimeline.vue**

Timeline vertikal stage → `document_passed` (M3). Props `stage: RecruitStage`:

```vue
<script setup lang="ts">
import type { RecruitStage } from '@/types/recruitment';
import { computed } from 'vue';
import { CheckCircle2, Circle, Clock } from 'lucide-vue-next';

const props = defineProps<{ stage: RecruitStage }>();

const steps: Array<{ key: RecruitStage; label: string }> = [
    { key: 'submitted', label: 'Pendaftaran dikirim' },
    { key: 'screening', label: 'Screening berkas' },
    { key: 'document_passed', label: 'Berkas lolos' },
];

const order: RecruitStage[] = ['submitted', 'screening', 'document_passed'];
const currentIndex = computed(() => {
    const idx = order.indexOf(props.stage);
    return idx === -1 ? order.length - 1 : idx;
});
</script>

<template>
    <ol class="space-y-4">
        <li v-for="(step, i) in steps" :key="step.key" class="flex items-start gap-3">
            <component
                :is="i < currentIndex ? CheckCircle2 : i === currentIndex ? Clock : Circle"
                class="mt-0.5 h-5 w-5"
                :class="i <= currentIndex ? 'text-primary' : 'text-muted-foreground'"
            />
            <div>
                <p class="text-sm font-medium" :class="i <= currentIndex ? '' : 'text-muted-foreground'">
                    {{ step.label }}
                </p>
                <p v-if="i === currentIndex" class="text-xs text-muted-foreground">Tahap saat ini</p>
            </div>
        </li>
    </ol>
</template>
```

- [ ] **Step 3: RecruitDivisionCard.vue**

Card divisi. Props `{ id: string; label: string; description: string }`:

```vue
<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';

defineProps<{ id: string; label: string; description: string }>();
</script>

<template>
    <Card class="rounded-2xl">
        <CardContent class="p-5">
            <h3 class="font-semibold">{{ label }}</h3>
            <p class="text-muted-foreground mt-1 text-sm">{{ description }}</p>
        </CardContent>
    </Card>
</template>
```

- [ ] **Step 4: RecruitApplicationFormFields.vue**

Form fields (dummy) untuk application form. Emits `submit` dengan payload applicant. Props `{ divisions: RecruitDivisionId[] }`. Gunakan `Input`, `Label`, `Textarea`, `Select` dari `components/ui`:

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { IApplicant, RecruitDivisionId } from '@/types/recruitment';

const props = defineProps<{ divisions: RecruitDivisionId[] }>();
const emit = defineEmits<{ submit: [applicant: IApplicant] }>();

const form = reactive<{
    fullName: string; nim: string; semester: string; phone: string;
    personalEmail: string; studentEmail: string; instagram: string;
    primaryDivision: RecruitDivisionId | ''; secondaryDivision: RecruitDivisionId | '';
    motivation: string; organizationExperience: string; skills: string;
}>({
    fullName: '', nim: '', semester: '', phone: '', personalEmail: '', studentEmail: '',
    instagram: '', primaryDivision: '', secondaryDivision: '', motivation: '',
    organizationExperience: '', skills: '',
});

const divisionOptions: Array<{ id: RecruitDivisionId; label: string }> = [
    { id: 'programming', label: 'Pemrograman' },
    { id: 'creative_media', label: 'Creative Media' },
    { id: 'network', label: 'Jaringan' },
    { id: 'data', label: 'Data' },
];

function handleSubmit(): void {
    const applicant: IApplicant = {
        id: `apl-${Date.now()}`,
        nim: form.nim,
        fullName: form.fullName,
        semester: Number(form.semester) as 1 | 2 | 3,
        phone: form.phone,
        personalEmail: form.personalEmail,
        studentEmail: form.studentEmail,
        instagram: form.instagram,
        primaryDivision: form.primaryDivision as RecruitDivisionId,
        secondaryDivision: (form.secondaryDivision || null) as RecruitDivisionId | null,
        cvFile: 'cv-dummy.pdf',
        portfolioType: 'url',
        portfolioUrl: '',
        motivation: form.motivation,
        organizationExperience: form.organizationExperience,
        skills: form.skills,
    };
    emit('submit', applicant);
}
</script>

<template>
    <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Data Pribadi -->
        <section class="space-y-4">
            <h2 class="text-lg font-semibold">Data Pribadi</h2>
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                    <Label for="fullName">Nama Lengkap</Label>
                    <Input id="fullName" v-model="form.fullName" required />
                </div>
                <div class="space-y-2">
                    <Label for="nim">NIM</Label>
                    <Input id="nim" v-model="form.nim" required />
                </div>
                <div class="space-y-2">
                    <Label for="semester">Semester</Label>
                    <Input id="semester" v-model="form.semester" type="number" min="1" max="3" required />
                </div>
                <div class="space-y-2">
                    <Label for="phone">No. WhatsApp</Label>
                    <Input id="phone" v-model="form.phone" type="tel" required />
                </div>
                <div class="space-y-2">
                    <Label for="personalEmail">Email Pribadi</Label>
                    <Input id="personalEmail" v-model="form.personalEmail" type="email" required />
                </div>
                <div class="space-y-2">
                    <Label for="studentEmail">Email Mahasiswa</Label>
                    <Input id="studentEmail" v-model="form.studentEmail" type="email" required />
                </div>
                <div class="space-y-2 sm:col-span-2">
                    <Label for="instagram">Username Instagram</Label>
                    <Input id="instagram" v-model="form.instagram" required />
                </div>
            </div>
        </section>

        <!-- Data Pendaftaran -->
        <section class="space-y-4">
            <h2 class="text-lg font-semibold">Data Pendaftaran</h2>
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                    <Label>Divisi Utama</Label>
                    <Select v-model="form.primaryDivision">
                        <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="d in divisionOptions" :key="d.id" :value="d.id">
                                {{ d.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Divisi Kedua (opsional)</Label>
                    <Select v-model="form.secondaryDivision">
                        <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="d in divisionOptions" :key="d.id" :value="d.id">
                                {{ d.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2 sm:col-span-2">
                    <Label for="motivation">Motivasi</Label>
                    <Textarea id="motivation" v-model="form.motivation" required />
                </div>
                <div class="space-y-2">
                    <Label for="org">Pengalaman Organisasi</Label>
                    <Textarea id="org" v-model="form.organizationExperience" />
                </div>
                <div class="space-y-2">
                    <Label for="skills">Keahlian</Label>
                    <Textarea id="skills" v-model="form.skills" />
                </div>
            </div>
        </section>

        <!-- Dokumen (dummy) -->
        <section class="space-y-4">
            <h2 class="text-lg font-semibold">Dokumen</h2>
            <p class="text-muted-foreground text-sm">
                Upload CV (PDF) dan portfolio (URL atau PDF) — simulasi, file dummy digunakan.
            </p>
            <Button type="submit">Kirim Pendaftaran</Button>
        </section>
    </form>
</template>
```

> Catatan: `Select v-model` memakai reka-ui pattern; pastikan import path `@/components/ui/select` sesuai (cek file yang ada). Kalau `Label`/`Textarea` path beda, sesuaikan dengan `components/ui/`.

- [ ] **Step 5: RecruitApplicantTable.vue**

Tabel daftar applicant (staff). Props `{ applications: IApplication[] }`. Gunakan `Table` shadcn:

```vue
<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RecruitStatusBadge from './RecruitStatusBadge.vue';
import { divisionLabels } from '@/lib/dummyRecruitment';
import type { IApplication } from '@/types/recruitment';

defineProps<{ applications: IApplication[] }>();
</script>

<template>
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>No. Pendaftaran</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIM</TableHead>
                <TableHead>Divisi Utama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tgl Submit</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-for="app in applications" :key="app.id">
                <TableCell>{{ app.registrationNumber }}</TableCell>
                <TableCell>{{ app.applicant.fullName }}</TableCell>
                <TableCell>{{ app.applicant.nim }}</TableCell>
                <TableCell>{{ divisionLabels[app.applicant.primaryDivision] ?? app.applicant.primaryDivision }}</TableCell>
                <TableCell><RecruitStatusBadge :stage="app.stage" /></TableCell>
                <TableCell>{{ new Date(app.submittedAt).toLocaleDateString('id-ID') }}</TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>
```

- [ ] **Step 6: RecruitScreeningPanel.vue**

Panel screening (pass/revision/reject). Props `{ application: IApplication }`; emits `decision`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { screeningReasons } from '@/lib/dummyRecruitment';
import type { IApplication, RecruitScreeningDecision } from '@/types/recruitment';

const props = defineProps<{ application: IApplication }>();
const emit = defineEmits<{ decision: [decision: RecruitScreeningDecision, reason: string, notes: string] }>();

const decision = ref<RecruitScreeningDecision | ''>('');
const reason = ref('');
const notes = ref('');

function submit(): void {
    if (!decision.value || (decision.value !== 'pass' && !reason.value)) {
        return;
    }
    emit('decision', decision.value, reason.value, notes.value);
}
</script>

<template>
    <div class="space-y-4 rounded-xl border p-4">
        <h3 class="font-semibold">Keputusan Screening</h3>

        <div class="flex gap-2">
            <Button
                variant="default"
                :class="decision === 'pass' ? 'ring-2 ring-primary' : ''"
                @click="decision = 'pass'"
            >
                Pass
            </Button>
            <Button
                variant="outline"
                :class="decision === 'revision' ? 'ring-2 ring-amber-500' : ''"
                @click="decision = 'revision'"
            >
                Revision Required
            </Button>
            <Button
                variant="destructive"
                :class="decision === 'reject' ? 'ring-2 ring-destructive' : ''"
                @click="decision = 'reject'"
            >
                Reject
            </Button>
        </div>

        <div v-if="decision && decision !== 'pass'" class="space-y-3">
            <div class="space-y-2">
                <Label>Alasan</Label>
                <Select v-model="reason">
                    <SelectTrigger><SelectValue placeholder="Pilih alasan" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="r in screeningReasons" :key="r" :value="r">{{ r }}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div class="space-y-2">
                <Label for="notes">Catatan (opsional)</Label>
                <Textarea id="notes" v-model="notes" />
            </div>
        </div>

        <Button
            type="button"
            :disabled="!decision || (decision !== 'pass' && !reason)"
            @click="submit"
        >
            Simpan Keputusan
        </Button>
    </div>
</template>
```

- [ ] **Step 7: RecruitLandingHero.vue + RecruitTimelineSection.vue**

`RecruitLandingHero.vue` — hero landing dengan CTA. Props `{ periodName: string; isOpen: boolean; registrationUrl: string }`. Gunakan `Button` as `Link` (`as-child`):

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/vue3';

const props = defineProps<{
    periodName: string;
    isOpen: boolean;
    registrationUrl: string;
}>();
</script>

<template>
    <section class="mx-auto max-w-4xl px-6 py-20 text-center">
        <p class="text-primary text-sm font-semibold uppercase tracking-wider">
            {{ periodName }}
        </p>
        <h1 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Bergabunglah dengan DOSCOM
        </h1>
        <p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            Ikuti Open Recruitment DOSCOM dan kembangkan skill bersama komunitas.
        </p>
        <div class="mt-8">
            <Button :disabled="!isOpen" @click="router.visit(props.registrationUrl)">
                {{ isOpen ? 'Daftar Sekarang' : 'Pendaftaran Ditutup' }}
            </Button>
        </div>
    </section>
</template>
```

`RecruitTimelineSection.vue` — timeline seleksi statis (props `{ period }` ringkas):

```vue
<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';

const props = defineProps<{
    period: { registrationStart: string; registrationEnd: string; interviewStart?: string; interviewEnd?: string };
}>();

const items = [
    { label: 'Pendaftaran', start: props.period.registrationStart, end: props.period.registrationEnd },
    { label: 'Interview', start: props.period.interviewStart ?? '', end: props.period.interviewEnd ?? '' },
];
</script>

<template>
    <section class="mx-auto max-w-5xl px-6 py-12">
        <h2 class="text-2xl font-bold">Timeline Seleksi</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <Card v-for="item in items" :key="item.label" class="rounded-2xl">
                <CardContent class="p-5">
                    <h3 class="font-semibold">{{ item.label }}</h3>
                    <p class="text-muted-foreground text-sm">
                        {{ new Date(item.start).toLocaleDateString('id-ID') }}
                        {{ item.end ? `– ${new Date(item.end).toLocaleDateString('id-ID')}` : '' }}
                    </p>
                </CardContent>
            </Card>
        </div>
    </section>
</template>
```

- [ ] **Step 8: Verifikasi**

Run: `npm run build` — Expected: sukses (semua komponen valid). Cek import path komponen ui yang benar (`Badge`, `Select`, `Textarea`, `Label`, `Table`) sesuai yang ada di `components/ui/`.

- [ ] **Step 9: Commit**

```bash
git add resources/js/components/modules/recruitment/
git commit -m "feat: add recruitment shared components"
```

---

### Task 5: Halaman publik (landing, form, submitted, tracking)

**Files:**
- Create: `resources/js/pages/OpenRecruitment.vue`
- Create: `resources/js/pages/OpenRecruitmentForm.vue`
- Create: `resources/js/pages/OpenRecruitmentSubmitted.vue`
- Create: `resources/js/pages/ApplicationTracking.vue`

**Interfaces:**
- Consumes: props dari Task 3 controller; komponen Task 4; `recruitmentStore` (Task 2).
- Produces: halaman publik lengkap.

- [ ] **Step 1: OpenRecruitment.vue (landing)**

```vue
<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import LandingLayout from '@/layouts/LandingLayout.vue';
import RecruitLandingHero from '@/components/modules/recruitment/RecruitLandingHero.vue';
import RecruitTimelineSection from '@/components/modules/recruitment/RecruitTimelineSection.vue';
import RecruitDivisionCard from '@/components/modules/recruitment/RecruitDivisionCard.vue';
import type { IRecruitmentPeriod } from '@/types/recruitment';

defineOptions({ layout: LandingLayout });

const props = defineProps<{
    period: IRecruitmentPeriod;
    divisions: Array<{ id: string; label: string; description: string }>;
    isOpen: boolean;
    registrationUrl: string;
}>();
</script>

<template>
    <Head title="Open Recruitment DOSCOM" />

    <RecruitLandingHero
        :period-name="period.name"
        :is-open="isOpen"
        :registration-url="registrationUrl"
    />

    <section class="mx-auto max-w-5xl px-6 py-12">
        <h2 class="text-2xl font-bold">Divisi Tersedia</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <RecruitDivisionCard
                v-for="d in divisions"
                :key="d.id"
                :id="d.id"
                :label="d.label"
                :description="d.description"
            />
        </div>
    </section>

    <RecruitTimelineSection :period="period" />
</template>
```

- [ ] **Step 2: OpenRecruitmentForm.vue**

```vue
<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import LandingLayout from '@/layouts/LandingLayout.vue';
import { Card, CardContent } from '@/components/ui/card';
import RecruitApplicationFormFields from '@/components/modules/recruitment/RecruitApplicationFormFields.vue';
import { recruitmentStore } from '@/lib/recruitmentStore';
import type { IApplicant, IRecruitmentPeriod } from '@/types/recruitment';

defineOptions({ layout: LandingLayout });

const props = defineProps<{
    period: IRecruitmentPeriod;
    divisions: string[];
    submitUrl: string;
    alreadySubmitted: boolean;
}>();

function handleSubmit(applicant: IApplicant): void {
    const application = recruitmentStore.addApplication(applicant, props.period.id);
    router.visit(`/open-recruitment/submitted/${application.registrationNumber}`);
}
</script>

<template>
    <Head title="Daftar Open Recruitment" />

    <div class="mx-auto max-w-3xl px-6 py-12">
        <h1 class="text-3xl font-bold">Form Pendaftaran</h1>
        <p class="text-muted-foreground mt-2">
            Periode: {{ period.name }} · Tutup: {{ new Date(period.registrationEnd).toLocaleDateString('id-ID') }}
        </p>

        <Card class="mt-8 rounded-2xl">
            <CardContent class="p-6">
                <RecruitApplicationFormFields :divisions="divisions as RecruitDivisionId[]" @submit="handleSubmit" />
            </CardContent>
        </Card>
    </div>
</template>
```

> **Catatan TS:** `divisions` dari server bertipe `string[]`; komponen form butuh `RecruitDivisionId[]`. Gunakan `divisions as RecruitDivisionId[]` (bukan `as any` — rules FE §7 no-any) dan import type `RecruitDivisionId`. Deklarasi prop halaman: `divisions: RecruitDivisionId[]`.

- [ ] **Step 2b: Perbaiki type (no-any)**

Pastikan import `RecruitDivisionId` dan deklarasi prop halaman `divisions: RecruitDivisionId[]`. (Sudah diterapkan di Step 1 — verifikasi tidak ada `as any` tersisa.)

- [ ] **Step 3: OpenRecruitmentSubmitted.vue**

```vue
<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import LandingLayout from '@/layouts/LandingLayout.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-vue-next';
import { router } from '@inertiajs/vue3';

defineOptions({ layout: LandingLayout });

const props = defineProps<{
    registrationNumber: string;
    confirmationMessage: string;
}>();
</script>

<template>
    <Head title="Pendaftaran Berhasil" />

    <div class="mx-auto max-w-2xl px-6 py-16 text-center">
        <CheckCircle2 class="text-primary mx-auto h-16 w-16" />
        <h1 class="mt-6 text-3xl font-bold">Pendaftaran Berhasil</h1>
        <p class="text-muted-foreground mt-2">{{ confirmationMessage }}</p>

        <Card class="mx-auto mt-8 max-w-md rounded-2xl">
            <CardContent class="p-6">
                <p class="text-muted-foreground text-sm">Nomor Pendaftaran Anda</p>
                <p class="mt-1 text-2xl font-bold tracking-wide">{{ registrationNumber }}</p>
                <Button class="mt-4" @click="router.visit(`/open-recruitment/tracking/${registrationNumber}`)">
                    Lacak Status
                </Button>
            </CardContent>
        </Card>
    </div>
</template>
```

- [ ] **Step 4: ApplicationTracking.vue**

```vue
<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import LandingLayout from '@/layouts/LandingLayout.vue';
import { ref, computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import RecruitTrackingTimeline from '@/components/modules/recruitment/RecruitTrackingTimeline.vue';
import RecruitStatusBadge from '@/components/modules/recruitment/RecruitStatusBadge.vue';
import { recruitmentStore } from '@/lib/recruitmentStore';
import { divisionLabels } from '@/lib/dummyRecruitment';
import type { IApplication } from '@/types/recruitment';

defineOptions({ layout: LandingLayout });

const props = defineProps<{ registrationNumber?: string }>();

const search = ref(props.registrationNumber ?? '');
const application = computed<IApplication | undefined>(() =>
    search.value
        ? recruitmentStore.getApplicationByRegistrationNumber(search.value.trim())
        : undefined,
);

function track(): void {
    if (search.value.trim()) {
        router.get(`/open-recruitment/tracking/${search.value.trim()}`);
    }
}
</script>

<template>
    <Head title="Lacak Pendaftaran" />

    <div class="mx-auto max-w-2xl px-6 py-12">
        <h1 class="text-3xl font-bold">Lacak Pendaftaran</h1>
        <p class="text-muted-foreground mt-2">Masukkan nomor pendaftaran untuk melihat status.</p>

        <div class="mt-6 flex gap-2">
            <Input v-model="search" placeholder="OPREC-2026-0001" @keyup.enter="track" />
            <Button @click="track">Lacak</Button>
        </div>

        <div v-if="application" class="mt-8 space-y-6">
            <Card class="rounded-2xl">
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold">{{ application.applicant.fullName }}</p>
                            <p class="text-muted-foreground text-sm">{{ application.registrationNumber }}</p>
                            <p class="text-muted-foreground text-sm">
                                {{ divisionLabels[application.applicant.primaryDivision] }}
                            </p>
                        </div>
                        <RecruitStatusBadge :stage="application.stage" />
                    </div>
                </CardContent>
            </Card>

            <RecruitTrackingTimeline :stage="application.stage" />

            <div v-if="application.screening" class="rounded-xl border p-4 text-sm">
                <p class="font-medium">Keputusan Screening</p>
                <p class="text-muted-foreground mt-1">
                    {{ application.screening.decision === 'pass' ? 'Berkas Anda lolos seleksi administrasi.' :
                       application.screening.decision === 'revision' ? 'Perlu perbaikan data.' :
                       'Pendaftaran Anda tidak lolos seleksi administrasi.' }}
                </p>
            </div>
        </div>

        <div v-else-if="props.registrationNumber" class="mt-8 rounded-xl border border-destructive/50 p-4 text-sm text-destructive">
            Nomor pendaftaran tidak ditemukan. Periksa kembali.
        </div>
    </div>
</template>
```

- [ ] **Step 5: Verifikasi**

Run: `npm run build` — Expected: sukses. Kemudian `php artisan serve` + buka `/open-recruitment`, `/open-recruitment/apply`, submit, dan tracking untuk smoke test manual.

- [ ] **Step 6: Commit**

```bash
git add resources/js/pages/OpenRecruitment.vue resources/js/pages/OpenRecruitmentForm.vue resources/js/pages/OpenRecruitmentSubmitted.vue resources/js/pages/ApplicationTracking.vue
git commit -m "feat: add OpRec public pages (landing, form, submitted, tracking)"
```

---

### Task 6: Halaman staff (dashboard, applicants, detail, corrections)

**Files:**
- Modify: `resources/js/pages/Dashboard/Recruitment/Index.vue`
- Create: `resources/js/pages/Dashboard/Recruitment/Applicants.vue`
- Create: `resources/js/pages/Dashboard/Recruitment/ApplicantDetail.vue`
- Create: `resources/js/pages/Dashboard/Recruitment/CorrectionRequests.vue`
- Modify: `resources/js/components/modules/dashboard/DashboardSidebar.vue` (tambah link Recruitment jika belum ada)

**Interfaces:**
- Consumes: props Task 3 staff; komponen Task 4; `recruitmentStore` (Task 2).
- Produces: staff dashboard lengkap + sidebar link.

- [ ] **Step 1: Dashboard/Recruitment/Index.vue (ganti coming-soon)**

```vue
<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/vue3';
import { computed } from 'vue';
import { recruitmentStore } from '@/lib/recruitmentStore';

defineOptions({ layout: DashboardLayout });

const props = defineProps<{
    stats: { total: number; pendingScreening: number; passed: number; revision: number; rejected: number };
}>();

// Data dinamis dari store (dummy) — menimpa props statis
const live = computed(() => {
    const apps = recruitmentStore.state.applications;
    return {
        total: apps.length,
        pendingScreening: apps.filter((a) => a.stage === 'screening' || a.stage === 'submitted').length,
        passed: apps.filter((a) => a.stage === 'document_passed').length,
        revision: apps.filter((a) => a.stage === 'revision_required').length,
        rejected: apps.filter((a) => a.stage === 'document_rejected' || a.stage === 'rejected').length,
    };
});

const kpis = computed(() => [
    { label: 'Total Applicant', value: live.value.total },
    { label: 'Menunggu Screening', value: live.value.pendingScreening },
    { label: 'Berkas Lolos', value: live.value.passed },
    { label: 'Perlu Revisi', value: live.value.revision },
    { label: 'Ditolak', value: live.value.rejected },
]);
</script>

<template>
    <Head title="Recruitment — Dashboard" />

    <div class="flex flex-col gap-8">
        <PageHeader
            title="Rekrutmen"
            subtitle="Kelola proses Open Recruitment DOSCOM."
        />

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card v-for="kpi in kpis" :key="kpi.label" class="rounded-2xl">
                <CardContent class="p-5">
                    <p class="text-muted-foreground text-sm">{{ kpi.label }}</p>
                    <p class="mt-1 text-3xl font-bold">{{ kpi.value }}</p>
                </CardContent>
            </Card>
        </div>

        <div class="flex flex-wrap gap-3">
            <Button @click="router.visit('/admin/dashboard/recruitment/applicants')">
                Daftar Applicant
            </Button>
            <Button variant="outline" @click="router.visit('/admin/dashboard/recruitment/corrections')">
                Correction Requests
            </Button>
        </div>
    </div>
</template>
```

- [ ] **Step 2: Dashboard/Recruitment/Applicants.vue**

```vue
<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computed, ref } from 'vue';
import RecruitApplicantTable from '@/components/modules/recruitment/RecruitApplicantTable.vue';
import { recruitmentStore } from '@/lib/recruitmentStore';

defineOptions({ layout: DashboardLayout });

const props = defineProps<{ applications: unknown[] }>();

const search = ref('');
const filter = ref('all');

const apps = computed(() => recruitmentStore.state.applications);

const filtered = computed(() => {
    const q = search.value.toLowerCase();
    return apps.value.filter((a) => {
        const matchSearch =
            !q || a.applicant.fullName.toLowerCase().includes(q) || a.applicant.nim.toLowerCase().includes(q);
        const matchFilter =
            filter.value === 'all' ||
            (filter.value === 'screening' && (a.stage === 'screening' || a.stage === 'submitted')) ||
            (filter.value === 'passed' && a.stage === 'document_passed') ||
            (filter.value === 'revision' && a.stage === 'revision_required') ||
            (filter.value === 'rejected' && (a.stage === 'document_rejected' || a.stage === 'rejected'));
        return matchSearch && matchFilter;
    });
});

function openDetail(id: string): void {
    router.visit(`/admin/dashboard/recruitment/applicants/${id}`);
}
</script>

<template>
    <Head title="Applicants — Recruitment" />

    <div class="flex flex-col gap-6">
        <PageHeader title="Daftar Applicant" subtitle="Semua pendaftar OpRec." :back-href="'/admin/dashboard/recruitment'" />

        <Card class="rounded-2xl">
            <CardContent class="p-5">
                <div class="mb-4 flex flex-wrap gap-2">
                    <input
                        v-model="search"
                        placeholder="Cari nama / NIM..."
                        class="h-9 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
                    />
                    <select v-model="filter" class="h-9 rounded-md border bg-background px-3 text-sm">
                        <option value="all">Semua</option>
                        <option value="screening">Menunggu Screening</option>
                        <option value="passed">Berkas Lolos</option>
                        <option value="revision">Perlu Revisi</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>

                <RecruitApplicantTable :applications="filtered" />
                <div v-if="filtered.length === 0" class="text-muted-foreground py-8 text-center text-sm">
                    Tidak ada applicant.
                </div>
            </CardContent>
        </Card>
    </div>
</template>
```

> `props.applications` (`unknown[]`) sengaja tidak dipakai karena data dari store; tapi biarkan prop ada agar signature sesuai controller (backend-ready). Atau hapus prop — pilih satu konsisten. **Catatan plan:** buang `props.applications` dan gunakan store saja (komponen tidak perlu prop). Sesuaikan di step 2b.

- [ ] **Step 2b: Perbaiki (buang prop tak terpakai)**

Hapus `const props = defineProps<{ applications: unknown[] }>();` dan `props.` references — komponen murni baca store. (Rules: tidak ada `unknown[]`/prop mati yang membingungkan; prop dipakai hanya saat backend.)

- [ ] **Step 3: Dashboard/Recruitment/ApplicantDetail.vue**

```vue
<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computed } from 'vue';
import RecruitScreeningPanel from '@/components/modules/recruitment/RecruitScreeningPanel.vue';
import RecruitStatusBadge from '@/components/modules/recruitment/RecruitStatusBadge.vue';
import { recruitmentStore } from '@/lib/recruitmentStore';
import { divisionLabels } from '@/lib/dummyRecruitment';
import type { IApplication, RecruitScreeningDecision } from '@/types/recruitment';

defineOptions({ layout: DashboardLayout });

const props = defineProps<{ application: unknown }>();

const app = computed<IApplication | undefined>(() =>
    recruitmentStore.state.applications.find((a) => a.id === (props.application as IApplication | null)?.id)
        ?? recruitmentStore.state.applications.find((a) => a.id === (props.application as { id?: string } | null)?.id),
);

function handleDecision(decision: RecruitScreeningDecision, reason: string, notes: string): void {
    if (!app.value) {
        return;
    }
    recruitmentStore.screeningDecision(app.value.id, decision, reason, notes);
    router.reload({ only: ['application'] });
}
</script>

<template>
    <Head title="Detail Applicant — Recruitment" />

    <div class="flex flex-col gap-6">
        <PageHeader
            :title="app?.applicant.fullName ?? 'Applicant'"
            subtitle="Detail dan screening applicant."
            :back-href="'/admin/dashboard/recruitment/applicants'"
        />

        <div v-if="app" class="grid gap-6 lg:grid-cols-3">
            <Card class="rounded-2xl lg:col-span-2">
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold">{{ app.applicant.fullName }}</h2>
                        <RecruitStatusBadge :stage="app.stage" />
                    </div>
                    <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt class="text-muted-foreground">NIM</dt><dd>{{ app.applicant.nim }}</dd></div>
                        <div><dt class="text-muted-foreground">Semester</dt><dd>{{ app.applicant.semester }}</dd></div>
                        <div><dt class="text-muted-foreground">Email</dt><dd>{{ app.applicant.personalEmail }}</dd></div>
                        <div><dt class="text-muted-foreground">No. WA</dt><dd>{{ app.applicant.phone }}</dd></div>
                        <div><dt class="text-muted-foreground">Divisi Utama</dt><dd>{{ divisionLabels[app.applicant.primaryDivision] }}</dd></div>
                        <div><dt class="text-muted-foreground">Divisi Kedua</dt><dd>{{ app.applicant.secondaryDivision ? divisionLabels[app.applicant.secondaryDivision] : '—' }}</dd></div>
                        <div class="sm:col-span-2"><dt class="text-muted-foreground">Motivasi</dt><dd class="mt-1">{{ app.applicant.motivation }}</dd></div>
                    </dl>

                    <div v-if="app.screening" class="mt-6 rounded-xl border p-4 text-sm">
                        <p class="font-medium">Keputusan Screening</p>
                        <p class="text-muted-foreground mt-1">
                            {{ app.screening.decision }} · {{ app.screening.reason }}
                            <span v-if="app.screening.notes"> — {{ app.screening.notes }}</span>
                        </p>
                        <p class="text-muted-foreground mt-1 text-xs">
                            oleh {{ app.screening.decidedBy }} · {{ new Date(app.screening.decidedAt).toLocaleString('id-ID') }}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card class="rounded-2xl">
                <CardContent class="p-5">
                    <RecruitScreeningPanel :application="app" @decision="handleDecision" />
                </CardContent>
            </Card>
        </div>

        <div v-else class="rounded-xl border border-destructive/50 p-4 text-sm text-destructive">
            Applicant tidak ditemukan.
        </div>
    </div>
</template>
```

> `props.application` dari controller `null` → komponen fallback ke store. Untuk resolve id dari URL, lebih baik komponen menerima `applicationId` prop dari route, lalu cari di store. **Perbaiki di step 3b:** controller kirim `applicationId` (string), komponen cari di store.

- [ ] **Step 3b: Resolve via applicationId**

Ubah controller `applicantDetail` mengirim `['applicationId' => $id]` (bukan `application => null`), dan komponen:
```ts
const props = defineProps<{ applicationId: string }>();
const app = computed(() => recruitmentStore.state.applications.find((a) => a.id === props.applicationId));
```
`handleDecision` → setelah `screeningDecision`, cukup `router.reload({ only: ['applicationId'] })` atau biarkan reaktivitas store memperbarui UI (tidak perlu reload). Gunakan reaktivitas langsung (store reactive) — hapus `router.reload`.

- [ ] **Step 4: Dashboard/Recruitment/CorrectionRequests.vue**

```vue
<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computed } from 'vue';
import { recruitmentStore } from '@/lib/recruitmentStore';
import type { ICorrectionRequest } from '@/types/recruitment';

defineOptions({ layout: DashboardLayout });

const props = defineProps<{ corrections: unknown[] }>();

const requests = computed<ICorrectionRequest[]>(() =>
    recruitmentStore.state.applications.flatMap((a) => a.correctionRequests),
);

function approve(id: string): void {
    recruitmentStore.approveCorrection(id);
}
function reject(id: string): void {
    recruitmentStore.rejectCorrection(id);
}
</script>

<template>
    <Head title="Correction Requests — Recruitment" />

    <div class="flex flex-col gap-6">
        <PageHeader title="Correction Requests" subtitle="Permintaan koreksi data applicant." :back-href="'/admin/dashboard/recruitment'" />

        <div class="space-y-4">
            <Card v-for="req in requests" :key="req.id" class="rounded-2xl">
                <CardContent class="p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold">{{ req.requestedBy }}</p>
                            <p class="text-muted-foreground text-sm">{{ req.reason }}</p>
                            <p class="text-muted-foreground text-xs">
                                Field: {{ req.fields.join(', ') }} · {{ new Date(req.requestedAt).toLocaleString('id-ID') }}
                            </p>
                        </div>
                        <span class="text-sm">{{ req.status }}</span>
                    </div>
                    <div v-if="req.status === 'pending'" class="mt-3 flex gap-2">
                        <Button size="sm" @click="approve(req.id)">Approve</Button>
                        <Button size="sm" variant="destructive" @click="reject(req.id)">Reject</Button>
                    </div>
                </CardContent>
            </Card>

            <div v-if="requests.length === 0" class="text-muted-foreground py-8 text-center text-sm">
                Belum ada permintaan koreksi.
            </div>
        </div>
    </div>
</template>
```

> Sama seperti Task 6 Step 2b: buang `props.corrections` tak terpakai, baca store saja.

- [ ] **Step 5: Sidebar link**

Di `resources/js/components/modules/dashboard/DashboardSidebar.vue`, cek apakah sudah ada item "Recruitment". Jika belum, tambahkan item dengan href `routes.admin.recruitment` (sudah ada di `routes.ts`). Ikuti pola item sidebar lain (icon + label + href).

- [ ] **Step 6: Verifikasi**

Run: `npm run build`. Kemudian smoke manual:
- Buka `/admin/dashboard/recruitment` (login admin) → KPI dari store.
- Klik "Daftar Applicant" → tabel.
- Buka detail → lakukan Pass/Revision/Reject → status berubah.
- Tracking applicant (public) menampilkan status terbaru.
- Buka Correction Requests.

- [ ] **Step 7: Commit**

```bash
git add resources/js/pages/Dashboard/Recruitment/ resources/js/components/modules/dashboard/DashboardSidebar.vue
git commit -m "feat: add OpRec staff pages (dashboard, applicants, detail, corrections)"
```

---

### Task 7: Alur revision & correction end-to-end (public re-submit)

**Files:**
- Modify: `resources/js/pages/OpenRecruitmentForm.vue` (mode edit saat `revision_required`)
- Modify: `resources/js/pages/ApplicationTracking.vue` (tautan "Perbaiki Data" saat stage revision_required)
- Modify: `resources/js/lib/recruitmentStore.ts` (method `resubmitApplication`)

**Interfaces:**
- Consumes: Task 2 store, Task 5 halaman.
- Produces: alur revision: staff `revision` → applicant edit form → re-submit → stage kembali `screening`.

- [ ] **Step 1: Tambah `resubmitApplication` di store**

Di `resources/js/lib/recruitmentStore.ts`, tambah di dalam objek export:

```ts
function resubmitApplication(applicationId: string, applicant: IApplicant): void {
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) {
        return;
    }
    app.applicant = applicant;
    app.stage = 'screening';
    app.screening = undefined;
    app.revisionRound += 1;
    app.updatedAt = new Date().toISOString();
}
```

Export: tambah `resubmitApplication` ke `export const recruitmentStore = { ..., resubmitApplication }`.

- [ ] **Step 2: ApplicationTracking.vue — tombol "Perbaiki Data"**

Di dalam blok `v-if="application"`, tambah (setelah timeline, saat stage `revision_required`):

```vue
<div v-if="application.stage === 'revision_required'" class="rounded-xl border border-amber-500/50 p-4">
    <p class="text-sm">Data Anda memerlukan perbaikan. Silakan perbarui dan kirim ulang.</p>
    <Button class="mt-3" variant="outline" @click="router.visit(`/open-recruitment/apply?edit=${application.id}`)">
        Perbaiki Data
    </Button>
</div>
```

- [ ] **Step 3: OpenRecruitmentForm.vue — mode edit**

Update halaman form untuk menerima query `edit` dan me-load applicant dari store:

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import LandingLayout from '@/layouts/LandingLayout.vue';
import { Card, CardContent } from '@/components/ui/card';
import RecruitApplicationFormFields from '@/components/modules/recruitment/RecruitApplicationFormFields.vue';
import { recruitmentStore } from '@/lib/recruitmentStore';
import type { IApplicant, IRecruitmentPeriod, RecruitDivisionId } from '@/types/recruitment';

defineOptions({ layout: LandingLayout });

const props = defineProps<{ period: IRecruitmentPeriod; divisions: RecruitDivisionId[]; submitUrl: string; alreadySubmitted: boolean }>();

const editId = ref<string | null>(new URLSearchParams(window.location.search).get('edit'));
const editingApplication = computed(() =>
    editId.value ? recruitmentStore.state.applications.find((a) => a.id === editId.value) : undefined,
);

function handleSubmit(applicant: IApplicant): void {
    if (editingApplication.value) {
        recruitmentStore.resubmitApplication(editingApplication.value.id, applicant);
        router.visit(`/open-recruitment/tracking/${editingApplication.value.registrationNumber}`);
        return;
    }
    const application = recruitmentStore.addApplication(applicant, props.period.id);
    router.visit(`/open-recruitment/submitted/${application.registrationNumber}`);
}
</script>
```

> Tambah import `computed` dari vue. Form fields akan diisi nilai `editingApplication` via `initialValues` prop (perlu ekstensi `RecruitApplicationFormFields.vue` — tambahkan prop `initial?: IApplicant | null` dan set nilai awal di `reactive`).

- [ ] **Step 3b: Extend RecruitApplicationFormFields.vue dengan initial values**

Tambah prop `initial?: IApplicant | null` dan inisialisasi `form` dari `initial`:

```ts
const props = defineProps<{ divisions: RecruitDivisionId[]; initial?: IApplicant | null }>();
// inisialisasi reactive dari props.initial (atau string kosong)
```

- [ ] **Step 4: Verifikasi alur revision**

Manual: staff set `revision` → tracking applicant tampil tombol "Perbaiki Data" → klik → form terisi → submit → stage `screening` lagi. `revisionRound` bertambah.

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/recruitmentStore.ts resources/js/pages/OpenRecruitmentForm.vue resources/js/pages/ApplicationTracking.vue resources/js/components/modules/recruitment/RecruitApplicationFormFields.vue
git commit -m "feat: add revision resubmit flow for OpRec applicants"
```

---

### Task 8: Final lint + build + smoke + polish

**Files:**
- All OpRec files.

- [ ] **Step 1: ESLint**

Run: `npm run lint`
Expected: tidak ada error (no-any, --max-warnings 0). Perbaiki semua pelanggaran (hapus `as any`, prop mati, dsb).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Smoke test manual**

- Landing `/open-recruitment` (CTA aktif karena period open).
- Apply → submit → confirmation + registration number.
- Tracking by registration number.
- Staff: applicants list, detail, screening pass/revision/reject.
- Revision → applicant edit → resubmit → screening.
- Correction request → approve/reject.
- Responsive: mobile view landing & staff.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: complete OpRec frontend mockup (M1-3)"
```

---

## Self-Review

- **Spec coverage:** Semua requirement spec ter-cover: landing (Task 5), form + validasi (Task 5 + Task 4), registration number & confirmation (Task 2 store + Task 5), tracking (Task 5), staff dashboard (Task 6), applicants + detail + screening (Task 6 + Task 4), correction (Task 6), revision resubmit (Task 7). Out-of-scope (interview/backend) tidak diimplementasi.
- **Placeholder scan:** Tidak ada TBD/TODO; semua code lengkap. Catatan "perbaiki di step 2b/3b" adalah instruksi eksplisit, bukan placeholder.
- **Type consistency:** `IApplication.stage: RecruitStage`, `IRecruitmentScreening`, `RecruitScreeningDecision`, `divisionLabels` konsisten antar task. `recruitmentStore` methods names konsisten (`addApplication`, `screeningDecision`, `resubmitApplication`, `approveCorrection`, `rejectCorrection`).
