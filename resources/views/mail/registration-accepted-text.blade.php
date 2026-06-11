{{ __('Registration accepted') }} — {{ $event->title }}

{{ __('Form') }}: {{ $form->title }}

{{ __('Hello') }} {{ $recipientName }},

{{ __('Great news — your registration has been accepted. Use the QR code (HTML email) or manual code below for check-in.') }}

@if(!empty($isGuestRecipient))
{{ __('This email contains your personal check-in credentials. Do not forward or share it with others.') }}
@endif

────────────────────────
{{ __('Event details') }}

{{ __('Location') }}: {{ $event->location }}
{{ __('Event dates') }}: {{ $event->start_date->format('Y-m-d') }} — {{ $event->end_date->format('Y-m-d') }}

────────────────────────
{{ __('Manual registration code') }}: {{ $registrationCode }}

@if(!empty($showSubmissionId))
{{ __('Submission ID') }}: {{ $submission->id }}
@endif

@if(!empty($showRegistrationAction))
────────────────────────
{{ $registrationActionLabel }}:
{{ $registrationActionUrl }}
@endif

────────────────────────
{{ __('This message was sent by :app.', ['app' => config('app.name')]) }}
