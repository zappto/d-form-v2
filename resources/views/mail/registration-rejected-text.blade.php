{{ !empty($forInvitationSelfDeclined) ? __('Invitation update') : __('Registration update') }} — {{ $event->title }}

{{ __('Form') }}: {{ $form->title }}

{{ __('Hello') }} {{ $recipientName }},

@if(!empty($forInvitationSelfDeclined))
{{ __('You have declined this registration invitation. You will not be listed as a participant for this team registration unless you are invited again.') }}
@elseif(!empty($forTeammateDeclinedLeaderNotice))
{{ __(':name has declined the registration invitation for your team. They will not be included as a participant for this submission.', ['name' => $teammateDisplayName]) }}
@if(!empty($declineReason))

{{ __('Message from your teammate') }}:
{{ $declineReason }}
@endif
@else
{{ __('Thank you for your interest. Unfortunately, we are unable to accept your registration for this event at this time.') }}
@endif

@if(!empty($showRegistrationAction))
────────────────────────
{{ $registrationActionLabel }}:
{{ $registrationActionUrl }}
@endif

────────────────────────
{{ __('This message was sent by :app.', ['app' => config('app.name')]) }}
