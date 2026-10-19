<?php
/**
 * Boston Begins — access gate.
 *
 * Email-whitelist authentication with emailed one-time codes.
 * No database: codes and rate-limit counters live as small JSON files
 * under private/codes/ (denied to the web, gitignored). Sessions are
 * stateless HMAC-signed cookies, so the code files can be wiped at
 * any time without signing anyone out.
 */

const GATE_COOKIE = 'bb_access';

function gate_root(): string
{
    return dirname(__DIR__);
}

function gate_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require gate_root() . '/private/config.php';
        // Server-only overrides (whitelist additions, SMTP token, …) live in
        // config.local.php — gitignored, so deploys never overwrite them.
        $local = gate_root() . '/private/config.local.php';
        if (is_file($local)) {
            $overrides = require $local;
            if (is_array($overrides)) {
                $config = array_replace_recursive($config, $overrides);
            }
        }
    }
    return $config;
}

/** Cookie path scoped to wherever the app is mounted (works locally too). */
function gate_cookie_path(): string
{
    $dir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/');
    return ($dir === '' ? '/' : $dir . '/');
}

/** Signing secret, generated once on first use. */
function gate_secret(): string
{
    $file = gate_root() . '/private/secret.key';
    if (!is_file($file)) {
        $secret = bin2hex(random_bytes(32));
        file_put_contents($file, $secret, LOCK_EX);
        @chmod($file, 0600);
        return $secret;
    }
    return trim((string) file_get_contents($file));
}

function gate_normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function gate_email_is_valid(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function gate_email_is_allowed(string $email): bool
{
    $allowed = array_map('gate_normalize_email', gate_config()['allowed_emails']);
    return in_array(gate_normalize_email($email), $allowed, true);
}

// ── Session cookie ──────────────────────────────────────────────────────────

function gate_sign(string $payload): string
{
    return hash_hmac('sha256', $payload, gate_secret());
}

function gate_issue_session(string $email): void
{
    $expires = time() + gate_config()['session_days'] * 86400;
    $payload = bin2hex(gate_normalize_email($email)) . '.' . $expires;
    $value   = $payload . '.' . gate_sign($payload);
    setcookie(GATE_COOKIE, $value, [
        'expires'  => $expires,
        'path'     => gate_cookie_path(),
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    // Make the session visible to the rest of this request too.
    $_COOKIE[GATE_COOKIE] = $value;
}

/** Returns the signed-in email, or null. */
function gate_session_email(): ?string
{
    $raw = $_COOKIE[GATE_COOKIE] ?? '';
    if (!is_string($raw) || substr_count($raw, '.') !== 2) {
        return null;
    }
    [$hexEmail, $expires, $sig] = explode('.', $raw);
    if (!ctype_xdigit($hexEmail) || strlen($hexEmail) % 2 !== 0 || !ctype_digit($expires)) {
        return null;
    }
    if ((int) $expires < time()) {
        return null;
    }
    if (!hash_equals(gate_sign($hexEmail . '.' . $expires), $sig)) {
        return null;
    }
    $email = (string) hex2bin($hexEmail);
    // A revoked address stops working even with a live cookie.
    return gate_email_is_allowed($email) ? $email : null;
}

function gate_sign_out(): void
{
    setcookie(GATE_COOKIE, '', [
        'expires'  => time() - 3600,
        'path'     => gate_cookie_path(),
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    unset($_COOKIE[GATE_COOKIE]);
}

// ── Code store (file-based) ─────────────────────────────────────────────────

function gate_store_path(string $kind, string $key): string
{
    return gate_root() . '/private/codes/' . $kind . '-' . hash('sha256', $key) . '.json';
}

function gate_store_read(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $data = json_decode((string) file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function gate_store_write(string $file, array $data): void
{
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    file_put_contents($file, json_encode($data), LOCK_EX);
}

// ── Requesting a code ───────────────────────────────────────────────────────

/**
 * Handles an email submission.
 * Returns [ok(bool), state('code'|'email'), message(string)].
 */
function gate_request_code(string $email): array
{
    $cfg   = gate_config();
    $email = gate_normalize_email($email);

    if (!gate_email_is_valid($email)) {
        return [false, 'email', 'That doesn’t look like an email address — try again?'];
    }

    // Per-IP daily ceiling (cheap abuse brake).
    $ip     = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ipFile = gate_store_path('ip', $ip . '-' . date('Y-m-d'));
    $ipData = gate_store_read($ipFile);
    if (($ipData['count'] ?? 0) >= $cfg['max_ip_per_day']) {
        return [false, 'email', 'Too many requests from this connection today. Please try again tomorrow.'];
    }
    gate_store_write($ipFile, ['count' => ($ipData['count'] ?? 0) + 1]);

    if (!gate_email_is_allowed($email)) {
        return [false, 'email',
            'This guide is private. That address isn’t on the guest list — '
            . 'contact ' . $cfg['contact'] . ' for access.'];
    }

    $file = gate_store_path('code', $email);
    $data = gate_store_read($file);
    $now  = time();

    if (($data['last_sent'] ?? 0) > $now - $cfg['resend_seconds']) {
        return [true, 'code', 'A code was just sent — give it a minute to arrive, then enter it below.'];
    }
    if (date('Y-m-d', (int) ($data['day'] ?? 0)) === date('Y-m-d') // same day
        && ($data['sent_today'] ?? 0) >= $cfg['max_codes_per_day']) {
        return [false, 'email', 'That address has requested a lot of codes today. Please try again tomorrow.'];
    }

    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $sameDay = date('Y-m-d', (int) ($data['day'] ?? 0)) === date('Y-m-d');
    gate_store_write($file, [
        'hash'       => password_hash($code, PASSWORD_DEFAULT),
        'expires'    => $now + $cfg['code_ttl_minutes'] * 60,
        'attempts'   => 0,
        'last_sent'  => $now,
        'day'        => $now,
        'sent_today' => ($sameDay ? ($data['sent_today'] ?? 0) : 0) + 1,
    ]);

    gate_send_code_email($email, $code);

    return [true, 'code',
        'Check your email — a 6-digit code is on its way to ' . htmlspecialchars($email, ENT_QUOTES) . '. '
        . 'It’s good for ' . $cfg['code_ttl_minutes'] . ' minutes.'];
}

function gate_send_code_email(string $email, string $code): bool
{
    $cfg     = gate_config();
    $minutes = $cfg['code_ttl_minutes'];
    $subject = 'Your Boston Begins access code: ' . $code;
    $body    = "Your access code for Boston Begins:\n\n"
             . "    {$code}\n\n"
             . "Enter it on the page where you requested it. "
             . "The code expires in {$minutes} minutes.\n\n"
             . "If you didn’t request this, you can ignore this email.\n\n"
             . "— Boston Begins · a family field guide\n";
    $headers = 'From: ' . $cfg['mail_from_name'] . ' <' . $cfg['mail_from'] . ">\r\n"
             . 'Reply-To: ' . $cfg['contact'] . "\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n";

    // Local preview (php -S): mail() rarely delivers, so echo the code to the
    // server console instead. Never happens under Apache in production.
    if (PHP_SAPI === 'cli-server') {
        error_log("[boston-begins] access code for {$email}: {$code}");
        return true;
    }

    // Preferred: authenticated SMTP submission (e.g. Proton), so the mail
    // passes SPF/DKIM/DMARC instead of going out unauthenticated from the
    // web server. Falls back to mail() so codes still arrive if SMTP is
    // unconfigured or unreachable.
    $smtp = $cfg['smtp'] ?? null;
    if (is_array($smtp) && !empty($smtp['username']) && !empty($smtp['token'])) {
        if (gate_smtp_send($smtp, $cfg['mail_from'], $cfg['mail_from_name'], $email, $subject, $body)) {
            return true;
        }
        error_log('[boston-begins] SMTP send failed; falling back to mail()');
    }
    return @mail($email, $subject, $body, $headers, '-f' . $cfg['mail_from']);
}

/**
 * Minimal dependency-free SMTP submission client (STARTTLS + AUTH LOGIN).
 * Designed for Proton (smtp.protonmail.ch:587) but works with any
 * standards-following relay. Returns false (and error_logs why) on any
 * unexpected server reply.
 */
function gate_smtp_send(array $smtp, string $from, string $fromName, string $to, string $subject, string $body): bool
{
    $host     = $smtp['host'] ?? 'smtp.protonmail.ch';
    $port     = (int) ($smtp['port'] ?? 587);
    $starttls = $smtp['starttls'] ?? true;

    $errno = 0;
    $errstr = '';
    $fp = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 10);
    if (!$fp) {
        error_log("[boston-begins] SMTP connect to {$host}:{$port} failed: {$errstr}");
        return false;
    }
    stream_set_timeout($fp, 10);

    $read = static function () use ($fp): array {
        $text = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $text .= $line;
            if (strlen($line) < 4 || $line[3] !== '-') {
                break; // final line of a (possibly multiline) reply
            }
        }
        return [(int) substr($text, 0, 3), trim($text)];
    };
    $cmd = static function (string $c, array $okCodes, bool $secret = false) use ($fp, $read): bool {
        fwrite($fp, $c . "\r\n");
        [$code, $text] = $read();
        if (!in_array($code, $okCodes, true)) {
            error_log('[boston-begins] SMTP rejected ' . ($secret ? '<credential>' : "'{$c}'") . ": {$text}");
            return false;
        }
        return true;
    };
    $fail = static function () use ($fp): bool {
        @fwrite($fp, "QUIT\r\n");
        @fclose($fp);
        return false;
    };

    [$code] = $read();
    if ($code !== 220) {
        return $fail();
    }
    $hello = 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost');
    if (!$cmd($hello, [250])) {
        return $fail();
    }
    if ($starttls) {
        if (!$cmd('STARTTLS', [220])) {
            return $fail();
        }
        if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            error_log('[boston-begins] SMTP STARTTLS negotiation failed');
            return $fail();
        }
        if (!$cmd($hello, [250])) {
            return $fail();
        }
    }
    if (!$cmd('AUTH LOGIN', [334])
        || !$cmd(base64_encode($smtp['username']), [334], true)
        || !$cmd(base64_encode($smtp['token']), [235], true)) {
        return $fail();
    }
    if (!$cmd("MAIL FROM:<{$from}>", [250]) || !$cmd("RCPT TO:<{$to}>", [250, 251]) || !$cmd('DATA', [354])) {
        return $fail();
    }

    $domain = substr(strrchr($from, '@') ?: '@localhost', 1);
    $data = "From: {$fromName} <{$from}>\r\n"
          . "To: <{$to}>\r\n"
          . "Subject: {$subject}\r\n"
          . 'Date: ' . date(DATE_RFC2822) . "\r\n"
          . 'Message-ID: <' . bin2hex(random_bytes(12)) . "@{$domain}>\r\n"
          . "MIME-Version: 1.0\r\n"
          . "Content-Type: text/plain; charset=UTF-8\r\n"
          . "Content-Transfer-Encoding: 8bit\r\n"
          . "\r\n" . $body;
    $data = preg_replace('/\r?\n/', "\r\n", $data);
    $data = preg_replace('/^\./m', '..', $data); // dot-stuffing

    fwrite($fp, $data . "\r\n.\r\n");
    [$code, $text] = $read();
    if ($code !== 250) {
        error_log("[boston-begins] SMTP rejected message: {$text}");
        return $fail();
    }
    @fwrite($fp, "QUIT\r\n");
    @fclose($fp);
    return true;
}

// ── Verifying a code ────────────────────────────────────────────────────────

/**
 * Handles a code submission.
 * Returns [ok(bool), state('done'|'code'|'email'), message(string)].
 */
function gate_verify_code(string $email, string $code): array
{
    $cfg   = gate_config();
    $email = gate_normalize_email($email);
    $code  = preg_replace('/\D+/', '', $code);

    if (!gate_email_is_allowed($email)) {
        return [false, 'email', 'Start by entering your email address.'];
    }

    $file = gate_store_path('code', $email);
    $data = gate_store_read($file);

    if (empty($data['hash']) || ($data['expires'] ?? 0) < time()) {
        return [false, 'email', 'That code has expired. Enter your email to get a fresh one.'];
    }
    if (($data['attempts'] ?? 0) >= $cfg['max_attempts']) {
        @unlink($file);
        return [false, 'email', 'Too many tries. Enter your email to get a fresh code.'];
    }

    $data['attempts'] = ($data['attempts'] ?? 0) + 1;
    gate_store_write($file, $data);

    if (strlen($code) !== 6 || !password_verify($code, $data['hash'])) {
        $left = $cfg['max_attempts'] - $data['attempts'];
        return [false, 'code', $left > 0
            ? 'That code didn’t match — check the digits and try again.'
            : 'Too many tries. Enter your email to get a fresh code.'];
    }

    @unlink($file);
    gate_issue_session($email);
    return [true, 'done', 'Welcome in.'];
}

// ── Light cross-origin guard for the login POSTs ────────────────────────────

function gate_origin_ok(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return true; // same-origin form posts often omit Origin
    }
    $host = parse_url($origin, PHP_URL_HOST);
    return $host === ($_SERVER['HTTP_HOST'] ? parse_url('http://' . $_SERVER['HTTP_HOST'], PHP_URL_HOST) : null)
        || $host === ($_SERVER['SERVER_NAME'] ?? null);
}
