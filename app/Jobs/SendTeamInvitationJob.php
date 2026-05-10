<?php

namespace App\Jobs;

use App\Jobs\Concerns\AppliesOutgoingEmailDelay;
use App\Enums\EmailLogStatus;
use App\Enums\EmailNotificationType;
use App\Mail\TeamInvitationMail;
use App\Models\EmailLog;
use App\Models\FormAnswer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTeamInvitationJob implements ShouldQueue
{
    use AppliesOutgoingEmailDelay;
    use Queueable;

    public function __construct(
        public string $formAnswerId,
    ) {
    }

    public function handle(): void
    {
        $submission = FormAnswer::query()
            ->with(['form.event', 'user', 'teamLeaderSubmission.user'])
            ->find($this->formAnswerId);

        if ($submission === null) {
            Log::warning('[SendTeamInvitationJob] FormAnswer not found.', [
                'form_answer_id' => $this->formAnswerId,
            ]);

            return;
        }

        $user = $submission->user;
        if ($user === null) {
            return;
        }

        $event = $submission->form->event;

        if ($user->email === '') {
            EmailLog::query()->create([
                'form_answer_id' => $submission->id,
                'event_id' => $event->id,
                'user_id' => $user->id,
                'recipient_email' => '',
                'status' => EmailLogStatus::Failed,
                'notification_type' => EmailNotificationType::TeamInvitation,
                'error_message' => 'User has no email address configured.',
                'sent_at' => null,
            ]);

            Log::warning('[SendTeamInvitationJob] No recipient email.', [
                'form_answer_id' => $submission->id,
            ]);

            return;
        }

        try {
            $this->applyOutgoingEmailJitter();

            Mail::to($user->email)->send(new TeamInvitationMail($submission));

            EmailLog::query()->create([
                'form_answer_id' => $submission->id,
                'event_id' => $event->id,
                'user_id' => $user->id,
                'recipient_email' => $user->email,
                'status' => EmailLogStatus::Sent,
                'notification_type' => EmailNotificationType::TeamInvitation,
                'error_message' => null,
                'sent_at' => now(),
            ]);
        } catch (\Throwable $e) {
            EmailLog::query()->create([
                'form_answer_id' => $submission->id,
                'event_id' => $event->id,
                'user_id' => $user->id,
                'recipient_email' => $user->email,
                'status' => EmailLogStatus::Failed,
                'notification_type' => EmailNotificationType::TeamInvitation,
                'error_message' => $e->getMessage(),
                'sent_at' => null,
            ]);

            Log::error('[SendTeamInvitationJob] Email send failed.', [
                'notification_type' => EmailNotificationType::TeamInvitation->value,
                'form_answer_id' => $submission->id,
                'event_id' => $event->id,
                'recipient_email' => $user->email,
                'exception_class' => $e::class,
                'exception_message' => $e->getMessage(),
                'exception' => $e,
            ]);

            throw $e;
        }
    }
}
