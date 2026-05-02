<?php

namespace App\Http\Controllers\Dashboard\Events\Forms;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Form;
use App\Models\FormAnswer;
use App\Models\FormField;
use App\Services\Form\RulesBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class FormSubmissionController extends Controller
{
    public function __invoke(Request $request, Event $event, Form $form): RedirectResponse
    {
        abort_unless($form->event_id === $event->id, 404);

        $user = $request->user();

        $alreadySubmitted = FormAnswer::query()
            ->where('form_id', $form->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadySubmitted) {
            Inertia::flash('toast', [
                'type'    => 'error',
                'message' => 'You have already submitted this form.',
            ]);

            return redirect()->route('dashboard.events.forms.fill', ['event' => $event, 'form' => $form]);
        }

        $fields = FormField::query()
            ->where('form_id', $form->id)
            ->orderBy('order')
            ->get(['id', 'name', 'input_type', 'metadata']);

        $rawRules  = RulesBuilder::extractRulesFromFields($fields);
        $validator = Validator::make(
            array_merge($request->all(), $request->allFiles()),
            RulesBuilder::build($rawRules)
        );

        if ($validator->fails()) {
            return redirect()
                ->route('dashboard.events.forms.fill', ['event' => $event, 'form' => $form])
                ->withErrors($validator)
                ->withInput();
        }

        $answers = [];

        foreach ($fields as $field) {
            $name = $field->name;

            if ($field->input_type === 'fileUpload') {
                $file = $request->file($name);
                if ($file !== null) {
                    $path = $file->store("form-uploads/{$form->id}", 'public');
                    $answers[$name] = $path;
                } else {
                    $answers[$name] = null;
                }
            } elseif ($field->input_type === 'checkbox') {
                $answers[$name] = $request->input($name, []);
            } else {
                $answers[$name] = $request->input($name);
            }
        }

        FormAnswer::create([
            'answers' => $answers,
            'form_id' => $form->id,
            'user_id' => (string) $user->id,
        ]);

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => 'Your registration has been submitted successfully.',
        ]);

        return redirect()->route('dashboard.events.show', ['event' => $event]);
    }
}
