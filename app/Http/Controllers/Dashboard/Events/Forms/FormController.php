<?php

namespace App\Http\Controllers\Dashboard\Events\Forms;

use App\Enums\EventFormVisibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventFormRequest;
use App\Http\Requests\UpdateEventFormRequest;
use App\Models\Event;
use App\Models\Form;
use App\Models\FormField;
use App\Support\FormFieldTypeMapping;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    public function index(Event $event): Response
    {
        $this->authorize('update', $event);

        $forms = $event->forms()
            ->orderBy('title')
            ->get()
            ->map(fn (Form $f) => $this->formToInertia($f))
            ->all();

        return Inertia::render('Dashboard/Events/Forms/Index', [
            'event' => $this->eventSummary($event),
            'forms' => $forms,
        ]);
    }

    public function create(Event $event): Response
    {
        $this->authorize('update', $event);

        return Inertia::render('Dashboard/Events/Forms/Create', [
            'event' => $this->eventSummary($event),
        ]);
    }

    public function store(StoreEventFormRequest $request, Event $event): RedirectResponse
    {
        $form = $event->forms()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('messages.form.create.success'),
        ]);

        return redirect()->route('dashboard.events.forms.show', ['event' => $event, 'form' => $form]);
    }

    public function show(Event $event, Form $form): Response
    {
        $this->guardFormOnEvent($event, $form);

        $form->load(['formFields' => function ($q) {
            $q->orderBy('order');
        }]);

        $fields = $form->formFields
            ->map(fn (FormField $f) => $this->formFieldToInertia($f))
            ->values()
            ->all();

        return Inertia::render('Dashboard/Events/Forms/Show', [
            'event' => $this->eventSummary($event),
            'form' => $this->formToInertia($form),
            'fields' => $fields,
            'saveFieldsUrl' => route('dashboard.events.forms.fields', ['event' => $event, 'form' => $form]),
            'updateFormUrl' => route('dashboard.events.forms.update', ['event' => $event, 'form' => $form]),
        ]);
    }

    public function edit(Event $event, Form $form): RedirectResponse
    {
        $this->guardFormOnEvent($event, $form);

        return redirect()->route('dashboard.events.forms.show', ['event' => $event, 'form' => $form]);
    }

    public function update(UpdateEventFormRequest $request, Event $event, Form $form): RedirectResponse
    {
        $this->guardFormOnEvent($event, $form);
        $form->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('messages.form.edit.success'),
        ]);

        return redirect()->route('dashboard.events.forms.show', ['event' => $event, 'form' => $form]);
    }

    public function destroy(Event $event, Form $form): RedirectResponse
    {
        $this->guardFormOnEvent($event, $form);
        $form->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('messages.form.delete.success'),
        ]);

        return redirect()->route('dashboard.events.forms.index', ['event' => $event]);
    }

    private function guardFormOnEvent(Event $event, Form $form): void
    {
        abort_unless($form->event_id === $event->id, 404);
        $this->authorize('update', $event);
    }

    private function eventSummary(Event $event): array
    {
        return [
            'id' => $event->id,
            'title' => $event->title,
        ];
    }

    private function formToInertia(Form $form): array
    {
        $closed = $form->closed_at;
        $closedStr = $closed
            ? $closed->format('Y-m-d\TH:i')
            : null;

        return [
            'id' => $form->id,
            'title' => $form->title,
            'description' => $form->description,
            'closed_at' => $closedStr,
            'visible_for' => $form->visible_for
                ? $form->visible_for->map(fn (EventFormVisibility $e) => $e->value)->values()->all()
                : [],
            'event_id' => $form->event_id,
        ];
    }

    private function formFieldToInertia(FormField $f): array
    {
        $meta = $f->metadata;
        if ($meta instanceof \Illuminate\Support\Collection) {
            $meta = $meta->all();
        } elseif (is_object($meta) && method_exists($meta, 'toArray')) {
            $meta = $meta->toArray();
        } else {
            $meta = (array) $meta;
        }

        return [
            'id' => $f->id,
            'type' => FormFieldTypeMapping::toApiType($f->input_type),
            'label' => $f->label,
            'description' => $f->description,
            'name' => $f->name,
            'order' => $f->order,
            'metadata' => $meta,
        ];
    }
}
