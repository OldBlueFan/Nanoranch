<?php
/**
 * Boston Begins — private gate configuration.
 *
 * This file is served to no one: the directory is denied by private/.htaccess
 * and the front controller refuses to stream anything under private/.
 *
 * To grant someone access, add their email address to 'allowed_emails'
 * (lowercase, one per line) and upload this file. Nothing else to do —
 * they can request a code immediately.
 */
return [
    // Who may request an access code.
    'allowed_emails' => [
        'max@nanoranch.org',
        // 'luna@example.com',
        // 'liam@example.com',
    ],

    // Where access-code emails come from. Should exist as a real address
    // or alias on the domain so mail providers accept it.
    'mail_from'      => 'noreply@nanoranch.org',
    'mail_from_name' => 'Boston Begins',

    // Shown to visitors whose address is not on the list.
    'contact'        => 'max@nanoranch.org',

    // Session + code policy.
    'session_days'      => 30,   // how long a verified device stays signed in
    'code_ttl_minutes'  => 10,   // access codes expire after this
    'max_attempts'      => 5,    // wrong guesses before the code is invalidated
    'resend_seconds'    => 60,   // minimum wait between code emails per address
    'max_codes_per_day' => 12,   // per address, resets daily
    'max_ip_per_day'    => 60,   // total code requests per IP per day
];
