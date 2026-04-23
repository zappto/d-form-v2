<?php

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\Form;
use App\Services\Event\EventService;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Dashboard\HomeController as DashboardHomeController;

Route::middleware('auth')->get('/admin', fn () => to_route('dashboard.home'));

Route::middleware('auth')->get('/dashboard', DashboardHomeController::class)->name('dashboard.home');

Route::middleware('auth')->get('/dashboard/profile', fn () => inertia('Dashboard/Profile'))->name('dashboard.profile');

Route::middleware('auth')->prefix('/dashboard/user')->name('dashboard.user.')->group(function () {
    Route::get('/events', function (EventService $eventService) {
        $events = Event::query()
            ->where('status', EventStatus::Published)
            ->orderByDesc('start_date')
            ->get()
            ->map(fn (Event $e) => $eventService->eventToInertiaArray($e))
            ->values()
            ->all();

        return inertia('Dashboard/User/Events', [
            'events' => $events,
        ]);
    })->name('events');

    Route::get('/events/{event}', function (Event $event, EventService $eventService) {
        return inertia('Dashboard/User/EventDetail', [
            'event' => $eventService->eventToInertiaArray($event),
        ]);
    })->name('events.show');

    Route::get('/events/{event}/register', function (Event $event, EventService $eventService) {
        $forms = Form::where('event_id', $event->id)->orderBy('title')->get();
        return inertia('Dashboard/User/EventRegister', [
            'event' => $eventService->eventToInertiaArray($event),
            'forms' => $forms,
        ]);
    })->name('events.register');
});

Route::middleware('auth')->prefix('/dashboard/events/{event}')->name('dashboard.events.')->group(function () {
    Route::get('/scan', fn () => inertia('Dashboard/Events/Scan'))->name('scan');
    Route::get('/forms', fn () => inertia('Dashboard/Events/Forms/Index'))->name('forms.index');
    Route::get('/forms/create', fn () => inertia('Dashboard/Events/Forms/Create'))->name('forms.create');
    Route::get('/registrants', fn () => inertia('Dashboard/Events/Registrants'))->name('registrants');
});
