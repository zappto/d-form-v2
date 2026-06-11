@if(!empty($showRegistrationAction))
@include('mail.partials.primary-action', [
    'url' => $registrationActionUrl,
    'label' => $registrationActionLabel,
])
@endif
