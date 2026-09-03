<?php

namespace App\Observers;

use App\Models\Event;
use App\Models\Form;
use Illuminate\Support\Facades\Cache;

class EventObserver
{
    /**
     * Handle the Event "created" event.
     */
    public function created(Event $event): void
    {
        $this->invalidateEventListCache();
    }

    /**
     * Handle the Event "updated" event.
     */
    public function updated(Event $event): void
    {
        $this->invalidateEventListCache();
    }

    /**
     * Handle the Event "deleted" event.
     */
    public function deleted(Event $event): void
    {
        $this->invalidateEventListCache();
    }

    /**
     * Cascade soft-delete to child forms (and their fields) so an event draft
     * removal (wizard Cancel) does not leave orphaned forms behind.
     */
    public function deleting(Event $event): void
    {
        $event->forms()->withTrashed()->get()->each(function (Form $form): void {
            $form->formFields()->withTrashed()->get()->each(function ($field): void {
                $field->delete();
            });
            $form->delete();
        });
    }

    /**
     * Handle the Event "restored" event.
     */
    public function restored(Event $event): void
    {
        $event->forms()->withTrashed()->get()->each(function (Form $form): void {
            $form->formFields()->withTrashed()->get()->each(function ($field): void {
                $field->restore();
            });
            $form->restore();
        });

        $this->invalidateEventListCache();
    }

    /**
     * Handle the Event "force deleted" event.
     */
    public function forceDeleted(Event $event): void
    {
        //
    }

    private function invalidateEventListCache(): void
    {
        try {
            Cache::tags(['events'])->flush();

            return;
        } catch (\BadMethodCallException|\RuntimeException) {
            //
        }

        Cache::forever('events:list:cache:buster', (int) Cache::get('events:list:cache:buster', 0) + 1);
    }
}
