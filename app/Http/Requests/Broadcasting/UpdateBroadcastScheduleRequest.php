<?php

namespace App\Http\Requests\Broadcasting;

use App\Http\Requests\Concerns\ResolvesBroadcastSchedule;
use App\Support\BroadcastPermissions;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBroadcastScheduleRequest extends FormRequest
{
    use ResolvesBroadcastSchedule;

    public function authorize(): bool
    {
        return $this->user()?->can(BroadcastPermissions::SCHEDULE) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'schedule_date' => ['required', 'date_format:Y-m-d'],
            'schedule_time' => ['required', 'date_format:H:i'],
        ];
    }
}
