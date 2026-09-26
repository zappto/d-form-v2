<?php

namespace App\Http\Controllers\Dashboard\Recruitment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruitment\AssignRecruitmentInterviewerRequest;
use App\Http\Requests\Recruitment\StoreRecruitmentInterviewerRequest;
use App\Http\Requests\Recruitment\UpdateRecruitmentDivisionRequest;
use App\Models\Recruitment\RecruitmentDivision;
use App\Models\Recruitment\RecruitmentInterviewerDivision;
use App\Models\User;
use App\Services\Recruitment\RecruitmentDivisionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RecruitmentDivisionController extends Controller
{
    public function __construct(
        private readonly RecruitmentDivisionService $divisionService,
    ) {
    }

    public function update(UpdateRecruitmentDivisionRequest $request, RecruitmentDivision $division): RedirectResponse
    {
        $this->authorize('update', $division);

        $this->divisionService->update($division, $request->validated());

        Inertia::flash('toast', [
            'message' => 'Divisi berhasil diperbarui.',
            'type' => 'success',
        ]);

        return redirect()->back();
    }

    public function assignInterviewer(AssignRecruitmentInterviewerRequest $request): RedirectResponse
    {
        $this->authorize('assignInterviewer', RecruitmentDivision::class);

        $validated = $request->validated();
        $division = RecruitmentDivision::query()->findOrFail($validated['recruitment_division_id']);
        $user = User::query()->findOrFail($validated['user_id']);

        $this->divisionService->assignInterviewer($division, $user);

        Inertia::flash('toast', [
            'message' => 'Interviewer berhasil ditugaskan ke divisi.',
            'type' => 'success',
        ]);

        return redirect()->back();
    }

    public function unassignInterviewer(RecruitmentInterviewerDivision $assignment): RedirectResponse
    {
        $this->authorize('assignInterviewer', RecruitmentDivision::class);

        $this->divisionService->unassignInterviewer($assignment);

        Inertia::flash('toast', [
            'message' => 'Penugasan interviewer dihapus.',
            'type' => 'success',
        ]);

        return redirect()->back();
    }

    public function storeInterviewer(StoreRecruitmentInterviewerRequest $request): RedirectResponse
    {
        $this->authorize('assignInterviewer', RecruitmentDivision::class);

        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);
            $user->assignRole('recruitment-interviewer');

            $division = RecruitmentDivision::query()->findOrFail($validated['recruitment_division_id']);

            $this->divisionService->assignInterviewer($division, $user);
        });

        Inertia::flash('toast', [
            'message' => 'Interviewer berhasil ditugaskan ke divisi.',
            'type' => 'success',
        ]);

        return redirect()->back();
    }
}
