<?php
/**
 * nanoranch — direct messages from a content card.
 *
 * POST JSON { section, card, message, phone, name?, website, elapsed, turnstile }
 * → emails Max and sends a Pushover alert to his phone. Nothing is stored:
 * the only files written are hashed-IP rate-limit counters.
 *
 * Secrets live OUTSIDE the web root, in <parent of document root>/nanoranch-private/messages.php
 * (see api/messages.example.php); NANORANCH_PRIVATE overrides the folder for local testing.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

const SECTIONS       = ['soil', 'space', 'soul'];
const MAX_MESSAGE    = 2000;
const MAX_NAME       = 80;
const MIN_ELAPSED_MS = 3000;          // faster than a person can type a message
const LIMIT_PER_IP   = [[3, 600], [10, 86400]];   // 3 per 10 min, 10 per day
const LIMIT_GLOBAL   = [60, 86400];                // all visitors, per day

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function fail(int $status, string $error): void
{
    respond($status, ['ok' => false, 'error' => $error]);
}

function private_dir(): string
{
    $override = getenv('NANORANCH_PRIVATE');
    if ($override) {
        return rtrim($override, '/');
    }
    return dirname(rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/')) . '/nanoranch-private';
}

function config(): array
{
    $file = private_dir() . '/messages.php';
    if (!is_file($file)) {
        error_log('[nanoranch-messages] missing config: ' . $file);
        fail(503, 'Messages are not set up yet. Please try again later.');
    }
    $cfg = require $file;
    return $cfg + [
        'email_to'           => '',
        'email_from'         => 'noreply@nanoranch.org',
        'pushover_token'     => '',
        'pushover_user'      => '',
        'turnstile_secret'   => '',
        'allowed_origins'    => ['https://nanoranch.org', 'https://www.nanoranch.org'],
        'turnstile_hostnames' => ['nanoranch.org', 'www.nanoranch.org'],
        'pushover_endpoint'  => 'https://api.pushover.net/1/messages.json',
        'turnstile_endpoint' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    ];
}

/** One-line header-safe text: no CR/LF or other control characters. */
function one_line(string $s): string
{
    return trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s));
}

function post_form(string $url, array $fields): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($fields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($raw === false || $code >= 500) {
        return null;
    }
    $json = json_decode((string) $raw, true);
    return is_array($json) ? $json + ['_http' => $code] : ['_http' => $code];
}

/** File-based sliding-window counter; returns false once a limit is hit. */
function rate_ok(string $key, array $limits): bool
{
    $dir = private_dir() . '/ratelimit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $file = $dir . '/' . hash('sha256', $key) . '.json';
    $fh = @fopen($file, 'c+');
    if (!$fh) {
        return true;   // can't count: don't lock everyone out
    }
    flock($fh, LOCK_EX);
    $now = time();
    $longest = max(array_column($limits, 1));
    $hits = json_decode((string) stream_get_contents($fh), true);
    $hits = array_values(array_filter(is_array($hits) ? $hits : [], fn ($t) => is_int($t) && $t > $now - $longest));
    foreach ($limits as [$max, $window]) {
        if (count(array_filter($hits, fn ($t) => $t > $now - $window)) >= $max) {
            flock($fh, LOCK_UN);
            fclose($fh);
            return false;
        }
    }
    $hits[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN);
    fclose($fh);
    return true;
}

/** Card title from the site's own content, so the client can't choose what the email says. */
function card_title(string $section, string $card): ?string
{
    $file = dirname(__DIR__) . '/content/' . $section . '.json';
    $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
    foreach (($data['cards'] ?? []) as $c) {
        if (($c['id'] ?? null) === $card && ($c['published'] ?? true) !== false) {
            return one_line((string) ($c['title'] ?? $card));
        }
    }
    return null;
}

function format_phone(string $digits): string
{
    if (strlen($digits) === 11 && $digits[0] === '1') {
        $digits = substr($digits, 1);
    }
    if (strlen($digits) === 10) {
        return sprintf('(%s) %s-%s', substr($digits, 0, 3), substr($digits, 3, 3), substr($digits, 6));
    }
    return '+' . $digits;
}

// ── Request ─────────────────────────────────────────────────────────────────

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'Method not allowed.');
}

$cfg = config();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origin, $cfg['allowed_origins'], true)) {
    fail(403, 'Messages can only be sent from nanoranch.org.');
}

$raw = file_get_contents('php://input', false, null, 0, 16384);
$in = json_decode((string) $raw, true);
if (!is_array($in)) {
    fail(400, 'Something went wrong sending that. Please try again.');
}

// Bots: a filled-in hidden field or an instant submit gets a quiet "sent"
if (trim((string) ($in['website'] ?? '')) !== '' || (int) ($in['elapsed'] ?? 0) < MIN_ELAPSED_MS) {
    respond(200, ['ok' => true]);
}

$section = (string) ($in['section'] ?? '');
$card    = (string) ($in['card'] ?? '');
$title   = in_array($section, SECTIONS, true) && preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $card)
    ? card_title($section, $card) : null;
if ($title === null) {
    fail(400, 'Something went wrong sending that. Please try again.');
}

$message = trim(str_replace("\r\n", "\n", (string) ($in['message'] ?? '')));
$name    = one_line((string) ($in['name'] ?? ''));
$digits  = preg_replace('/\D+/', '', (string) ($in['phone'] ?? ''));
$errors  = [];
if ($message === '') {
    $errors['message'] = 'Please write a message.';
} elseif (mb_strlen($message) > MAX_MESSAGE) {
    $errors['message'] = 'Please keep it under ' . MAX_MESSAGE . ' characters.';
}
if (strlen($digits) < 10 || strlen($digits) > 15) {
    $errors['phone'] = 'Please enter a phone number I can text, with area code.';
}
if (mb_strlen($name) > MAX_NAME) {
    $errors['name'] = 'Please shorten your name.';
}
if ($errors) {
    respond(422, ['ok' => false, 'error' => 'Please check the form.', 'fields' => $errors]);
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
if (!rate_ok('ip:' . $ip, LIMIT_PER_IP) || !rate_ok('global', [LIMIT_GLOBAL])) {
    fail(429, 'Too many messages just now. Please try again later.');
}

if ($cfg['turnstile_secret'] !== '') {
    $check = post_form($cfg['turnstile_endpoint'], [
        'secret'   => $cfg['turnstile_secret'],
        'response' => (string) ($in['turnstile'] ?? ''),
        'remoteip' => $ip,
    ]);
    if ($check === null) {
        fail(502, 'The spam check is unavailable right now. Please try again in a minute.');
    }
    if (empty($check['success']) || !in_array($check['hostname'] ?? '', $cfg['turnstile_hostnames'], true)) {
        fail(403, 'The spam check didn’t pass. Please try again.');
    }
}

// ── Deliver ─────────────────────────────────────────────────────────────────

$phone   = format_phone($digits);
$from    = $name !== '' ? $name : 'Someone';
$link    = 'https://nanoranch.org/#' . $section . '/' . $card;
$sent    = false;

if ($cfg['email_to'] !== '') {
    $subject = 'nanoranch message: ' . $title;
    $body    = "{$from} sent a message about “{$title}”:\n\n"
             . $message . "\n\n"
             . "Text back: {$phone}\n"
             . ($name !== '' ? "Name: {$name}\n" : '')
             . "Card: {$link}\n\n"
             . "— sent from the message form on nanoranch.org\n";
    $headers = 'From: nanoranch <' . one_line($cfg['email_from']) . ">\r\n"
             . "MIME-Version: 1.0\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n"
             . "Content-Transfer-Encoding: 8bit\r\n";
    $sent = @mail(
        one_line($cfg['email_to']),
        '=?UTF-8?B?' . base64_encode($subject) . '?=',
        $body,
        $headers,
        '-f' . one_line($cfg['email_from'])
    ) || $sent;
}

if ($cfg['pushover_token'] !== '' && $cfg['pushover_user'] !== '') {
    $push = post_form($cfg['pushover_endpoint'], [
        'token'     => $cfg['pushover_token'],
        'user'      => $cfg['pushover_user'],
        'title'     => mb_substr("{$from} · {$title}", 0, 250),
        'message'   => mb_substr($message . "\n\nText back: {$phone}", 0, 1024),
        'url'       => $link,
        'url_title' => 'Open the card',
    ]);
    $sent = (($push['status'] ?? 0) === 1) || $sent;
}

if (!$sent) {
    error_log('[nanoranch-messages] delivery failed for ' . $section . '/' . $card);
    fail(502, 'Your message couldn’t be delivered just now. Please try again later.');
}

respond(200, ['ok' => true]);
