<?php

namespace App\Observers;

use App\Models\Event;
use App\Models\Form;
use App\Support\StorageJanitor;
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
    /**
     * Force-delete forms anak DULU supaya observer mereka jalan dan FK aman.
     * (forceDeleted sudah terlambat: baris induk terhapus duluan.)
     */
    public function forceDeleting(Event $event): void
    {
        $event->forms()->withTrashed()->get()->each(function (Form $form): void {
            $form->forceDelete();
        });
    }

    /** Hapus banner event. Anak sudah di-force-delete di forceDeleting (FK aman). */
    public function forceDeleted(Event $event): void
    {
        StorageJanitor::deletePublic($event->banner);
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
