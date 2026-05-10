<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Team / bundle invitation link lifetime
    |--------------------------------------------------------------------------
    |
    | Invitations expire at this many days after the leader submits. Expiry is
    | evaluated when the invitee opens the confirmation URL (no scheduler).
    |
    */
    'invitation_ttl_days' => (int) env('REGISTRATION_INVITATION_TTL_DAYS', 7),

    /*
    |--------------------------------------------------------------------------
    | Email send delay (seconds between each outgoing email)
    |--------------------------------------------------------------------------
    |
    | When multiple emails are dispatched at once (e.g. N bundle invitation
    | jobs), each subsequent job is delayed by this many seconds to avoid
    | triggering per-second SMTP rate limits. Set to 0 to disable staggering.
    |
    */
    'email_send_delay_seconds' => (int) env('REGISTRATION_EMAIL_SEND_DELAY_SECONDS', 2),
];
