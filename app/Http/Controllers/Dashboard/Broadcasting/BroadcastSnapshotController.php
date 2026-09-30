<?php

namespace App\Http\Controllers\Dashboard\Broadcasting;

use App\Http\Controllers\Controller;
use App\Http\Requests\Broadcasting\GenerateSnapshotRequest;
use App\Models\EmailBroadcast;
use App\Services\Broadcasting\BroadcastSnapshotService;
use App\Services\Broadcasting\CsvRecipientParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;

class BroadcastSnapshotController extends Controller
{
    public function __invoke(
        GenerateSnapshotRequest $request,
        EmailBroadcast $broadcast,
        BroadcastSnapshotService $snapshots,
        CsvRecipientParser $recipients,
    ): RedirectResponse {
        $this->authorize('update', $broadcast);

        $snapshots->assertEditable($broadcast);

        $datasets = $request->input('datasets', []);
        $manual = $request->input('manual', []);
        $uploaded = $request->file('csv_file');
        $csvRows = $uploaded instanceof UploadedFile ? $recipients->parse($uploaded->getContent()) : ['valid' => [], 'invalid' => []];

        $invalidCsv = $csvRows['invalid'] ?? [];

        $summary = $snapshots->generate($broadcast, $datasets, array_merge($manual, $csvRows['valid'] ?? []));

        $message = 'Snapshot dibuat: '.$summary['total'].' recipient.';
        if ($summary['duplicates'] > 0) {
            $message .= ' '.$summary['duplicates'].' duplikat terdeteksi (tidak dihapus otomatis).';
        }
        if ($invalidCsv !== []) {
            $message .= ' '.count($invalidCsv).' baris CSV invalid dilewati.';
        }

        return redirect()->back()->with('toast', ['message' => $message, 'type' => $summary['duplicates'] > 0 ? 'warning' : 'success']);
    }
}
