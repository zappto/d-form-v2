<?php

namespace App\Http\Controllers\Dashboard\Broadcasting;

use App\Http\Controllers\Controller;
use App\Http\Requests\Broadcasting\StoreCustomDatasetRequest;
use App\Models\EmailDataset;
use App\Services\Broadcasting\BroadcastDatasetResolver;
use App\Services\Broadcasting\CsvRecipientParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class BroadcastDatasetController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', \App\Models\EmailBroadcast::class);

        $datasets = EmailDataset::query()
            ->withCount('recipients')
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('Dashboard/Broadcasts/Datasets', [
            'datasets' => $datasets,
        ]);
    }

    public function store(StoreCustomDatasetRequest $request, CsvRecipientParser $recipients): RedirectResponse
    {
        $this->authorize('create', \App\Models\EmailBroadcast::class);

        $dataset = EmailDataset::query()->create([
            'name' => $request->string('name')->toString(),
            'source_type' => 'custom',
            'created_by' => $request->user()->id,
        ]);

        $rows = $request->input('manual', []);

        $uploaded = $request->file('csv_file');

        if ($uploaded instanceof UploadedFile) {
            $rows = array_merge($rows, $recipients->parse($uploaded->getContent())['valid']);
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            $dataset->recipients()->insert(array_map(fn ($r) => [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'dataset_id' => $dataset->id,
                'name' => $r['name'] ?? null,
                'email' => strtolower(trim((string) ($r['email'] ?? ''))),
                'created_at' => now(),
                'updated_at' => now(),
            ], array_filter($chunk, fn ($r) => filter_var(strtolower(trim((string) ($r['email'] ?? ''))), FILTER_VALIDATE_EMAIL) !== false)));
        }

        return redirect()->back()->with('toast', ['message' => 'Custom dataset dibuat.', 'type' => 'success']);
    }

    public function preview(Request $request, BroadcastDatasetResolver $resolver): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', \App\Models\EmailBroadcast::class);

        $type = $request->string('type')->toString();
        $eventId = $request->input('event_id');
        $periodId = $request->input('period_id');
        $datasetId = $request->input('dataset_id');

        $rows = match ($type) {
            'event_participants' => $resolver->eventParticipants($eventId ?: null),
            'recruitment_applicants' => $resolver->recruitmentApplicants($periodId ?: null),
            'users' => $resolver->users(),
            'custom' => $datasetId ? $resolver->customDataset((string) $datasetId) : [],
            default => [],
        };

        return response()->json([
            'total' => count($rows),
            'sample' => array_slice($rows, 0, 5),
        ]);
    }
}
