<?php

namespace App\Mail;

use App\Models\FormAnswer;
use App\Models\User;
use App\Services\Registration\RegistrationNotificationMailData;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationRejectedMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public FormAnswer $submission,
        public bool $forInvitationSelfDeclined = false,
        public bool $forTeammateDeclinedLeaderNotice = false,
        public ?User $greetingUser = null,
        /** Optional note from invitee (email only; never persisted on the submission). */
        public ?string $declineReason = null,
    ) {
        $this->submission->loadMissing(['form.event', 'user']);
    }

    public function envelope(): Envelope
    {
        $event = $this->submission->form->event;

        if ($this->forInvitationSelfDeclined) {
            return new Envelope(
                subject: __('Invitation update: :title', ['title' => $event->title]),
            );
        }

        return new Envelope(
            subject: __('Registration update: :title', ['title' => $event->title]),
        );
    }

    public function content(): Content
    {
        $mailData = app(RegistrationNotificationMailData::class)
            ->shared($this->submission, $this->greetingUser);

        return new Content(
            html: 'mail.registration-rejected',
            text: 'mail.registration-rejected-text',
            with: array_merge($mailData, [
                'forInvitationSelfDeclined' => $this->forInvitationSelfDeclined,
                'forTeammateDeclinedLeaderNotice' => $this->forTeammateDeclinedLeaderNotice,
                'declineReason' => $this->declineReason,
            ]),
        );
    }
}
