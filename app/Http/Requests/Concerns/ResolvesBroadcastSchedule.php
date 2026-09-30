<?php

namespace App\Http\Requests\Concerns;

use Carbon\Carbon;

trait ResolvesBroadcastSchedule
{
    /** Gabung schedule_date + schedule_time menjadi Carbon zona waktu aplikasi; dipakai saat create & ubah jadwal broadcast. */
    public function scheduledAt(): Carbon
    {
        return Carbon::parse(
            $this->string('schedule_date')->toString().' '.$this->string('schedule_time')->toString(),
            config('app.timezone')
        );
    }
}
