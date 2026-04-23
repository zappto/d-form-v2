<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EventRegistrationStatus;
use App\Enums\EventStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\Event\EventService;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly EventService $eventService,
    ) {}

    public function __invoke(): Response
    {
        $allEvents = Event::query()->whereNull('deleted_at')->get();

        $recentEvents = $allEvents
            ->sortByDesc('created_at')
            ->take(5)
            ->map(fn (Event $e) => $this->eventService->eventToInertiaArray($e))
            ->values()
            ->all();

        $total = $allEvents->count();
        $closed = $allEvents->filter(
            fn (Event $e) => $this->eventService->registrationStatus($e) === EventRegistrationStatus::Closed
        )->count();

        $stats = [
            'totalEvents' => $total,
            'activeEvents' => $allEvents->where('status', EventStatus::Published)->count(),
            'totalRegistrants' => (int) $allEvents->sum('registered_count'),
            'completionRate' => $total > 0 ? (int) round(($closed / $total) * 100) : 0,
        ];

        return inertia('Dashboard/Index', [
            'recentEvents' => $recentEvents,
            'stats' => $stats,
        ]);
    }
}
