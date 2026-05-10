<?php

namespace App\Jobs\Concerns;

use Illuminate\Support\Sleep;

trait AppliesOutgoingEmailDelay
{
    protected function applyOutgoingEmailJitter(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $min = (int) config('registration.email_jitter_min_seconds', 5);
        $max = (int) config('registration.email_jitter_max_seconds', 10);

        if ($min <= 0 || $max <= 0) {
            return;
        }

        if ($min > $max) {
            [$min, $max] = [$max, $min];
        }

        Sleep::for(random_int($min, $max))->seconds();
    }
}
