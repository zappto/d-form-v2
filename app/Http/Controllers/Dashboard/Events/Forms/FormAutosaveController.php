<?php

namespace App\Http\Controllers\Dashboard\Events\Forms;

use App\Http\Controllers\Controller;
use App\Http\Requests\AutosaveEventFormRequest;
use App\Models\Event;
use App\Models\Form;
use Inertia\Inertia;

class FormAutosaveController extends Controller
{
    public function __invoke(AutosaveEventFormRequest $request, Event $event, Form $form)
    {
        abort_unless($form->event_id === $event->id, 404);
        $this->authorize('update', $event);

        $validated = $request->validated();

        // Kolom NOT NULL di tabel forms (lihat create_forms_table + migration
        // susulan): null dari ConvertEmptyStringsToNull ('') / clear frontend
        // tidak boleh ditulis — kalau tidak 500 (SQLSTATE 1048). Kolom nullable
        // (closed_at, success_content, banner_*, metadata) tetap boleh null.
        $nonNullable = ['title', 'description', 'visible_for'];

        $updates = [];
        foreach (['title', 'description', 'success_content', 'closed_at', 'visible_for', 'banner_url', 'banner_caption', 'metadata'] as $key) {
            if (array_key_exists($key, $validated)) {
                if ($validated[$key] === null && in_array($key, $nonNullable, true)) {
                    continue;
                }
                $updates[$key] = $validated[$key];
            }
        }

        if (array_key_exists('success_content', $updates)) {
            $updates['success_content'] = $this->normalizeSuccessContent($updates['success_content']);
        }

        if ($updates !== []) {
            $form->update($updates);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Fields have been saved',
        ]);

        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return to_route('dashboard.events.forms.show', ['event' => $event, 'form' => $form]);
    }

    private function normalizeSuccessContent(mixed $raw): ?string
    {
        if (!is_string($raw)) {
            return null;
        }

        $trimmed = trim($raw);
        if ($trimmed === '' || $trimmed === '<p></p>') {
            return null;
        }

        return $raw;
    }
}
