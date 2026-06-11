<?php

namespace App\Support;

use App\Models\Event;

final class RegistrationPortalLinks
{
    public static function registrationDetailsUrl(Event $event): string
    {
        $segment = self::eventSegment($event);

        return route('dashboard.user.events.registration', [
            'event_segment' => $segment,
        ], absolute: true);
    }

    public static function publicEventUrl(Event $event): string
    {
        return route('events.show', [
            'event' => self::eventSegment($event),
        ], absolute: true);
    }

    private static function eventSegment(Event $event): string
    {
        return $event->slug !== null && $event->slug !== ''
            ? $event->slug
            : (string) $event->getKey();
    }

    public static function teamInvitationConfirmUrl(string $token): string
    {
        return route('dashboard.user.team-invitations.show', ['token' => $token], absolute: true);
    }
}
