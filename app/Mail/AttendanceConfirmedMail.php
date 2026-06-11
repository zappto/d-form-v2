<?php

namespace App\Mail;

use App\Models\EventAttendance;
use App\Models\FormAnswer;
use App\Services\Registration\RegistrationNotificationMailData;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AttendanceConfirmedMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public FormAnswer $submission,
        public EventAttendance $attendance,
    ) {
    }

    public function envelope(): Envelope
    {
        $event = $this->submission->form->event;

        return new Envelope(
            subject: __('Attendance confirmed: :title', ['title' => $event->title]),
        );
    }

    public function content(): Content
    {
        $mailData = app(RegistrationNotificationMailData::class)
            ->shared($this->submission);

        return new Content(
            html: 'mail.attendance-confirmed',
            text: 'mail.attendance-confirmed-text',
            with: array_merge($mailData, [
                'attendance' => $this->attendance,
            ]),
        );
    }
}
