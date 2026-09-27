<?php

namespace Tests\Feature\Dashboard;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeDashboardCalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function organizer(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    public function test_dashboard_exposes_calendar_events_from_real_events(): void
    {
        $event = Event::factory()->create([
            'status' => EventStatus::Published,
            'category' => 'rkt',
        ]);

        $this->actingAs($this->organizer())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Index')
                ->has('calendarEvents', 1)
                ->where('calendarEvents.0.id', $event->id)
                ->where('calendarEvents.0.title', $event->title)
                ->where('calendarEvents.0.category', 'rkt')
                ->where('calendarEvents.0.href', route('dashboard.events.show', $event))
                ->has('calendarEvents.0.start_date')
                ->has('calendarEvents.0.end_date'));
    }

    public function test_dashboard_calendar_excludes_soft_deleted_events(): void
    {
        $kept = Event::factory()->create(['status' => EventStatus::Published, 'category' => 'rkt']);
        $deleted = Event::factory()->create(['status' => EventStatus::Published, 'category' => 'rkt']);
        $deleted->delete();

        $this->actingAs($this->organizer())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Index')
                ->has('calendarEvents', 1)
                ->where('calendarEvents.0.id', $kept->id));
    }
}
