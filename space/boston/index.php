<?php
/**
 * Boston Begins — front controller.
 *
 * Every request in this directory lands here (see .htaccess). Flow:
 *   1. POST actions handle the sign-in conversation (email → code → cookie).
 *   2. ?path=… requests stream gated static assets to signed-in visitors.
 *   3. Everything else renders either the login screen or the full app.
 *
 * Works no-JS end to end: the login is a plain form, and the app itself is
 * server-rendered from boston-guide.json by lib/render.php.
 */

declare(strict_types=1);

require __DIR__ . '/lib/gate.php';

$user = gate_session_email();

// ── 1. Login conversation ───────────────────────────────────────────────────

$loginState   = 'email'; // which step of the form to show: email | code
$loginMessage = '';
$loginOk      = true;
$loginEmail   = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && gate_origin_ok()) {
    $action     = $_POST['action'] ?? '';
    $loginEmail = trim((string) ($_POST['email'] ?? ''));

    if ($action === 'signout') {
        gate_sign_out();
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    }
    if ($action === 'email') {
        [$loginOk, $loginState, $loginMessage] = gate_request_code($loginEmail);
    } elseif ($action === 'code') {
        [$loginOk, $loginState, $loginMessage] = gate_verify_code($loginEmail, (string) ($_POST['code'] ?? ''));
        if ($loginState === 'done') {
            $user = gate_session_email();
            header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
            exit;
        }
    }
}

// ── 2. Gated asset streaming ────────────────────────────────────────────────

$path = (string) ($_GET['path'] ?? '');
if ($path !== '' && rtrim($path, '/') !== '' && $path !== 'index.php') {
    bb_serve_asset($path, $user !== null);
    exit;
}

// ── 3. Page render ──────────────────────────────────────────────────────────

header('Referrer-Policy: same-origin');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');

if ($user === null) {
    bb_render_login($loginState, $loginMessage, $loginOk, $loginEmail);
    exit;
}

require __DIR__ . '/lib/render.php';
bb_render_app($user);
exit;

// ────────────────────────────────────────────────────────────────────────────

function bb_serve_asset(string $path, bool $authed): void
{
    static $mime = [
        'css'     => 'text/css; charset=UTF-8',
        'js'      => 'application/javascript; charset=UTF-8',
        'mjs'     => 'application/javascript; charset=UTF-8',
        'json'    => 'application/json; charset=UTF-8',
        'geojson' => 'application/geo+json; charset=UTF-8',
        'svg'     => 'image/svg+xml',
        'png'     => 'image/png',
        'jpg'     => 'image/jpeg',
        'jpeg'    => 'image/jpeg',
        'webp'    => 'image/webp',
        'ico'     => 'image/x-icon',
        'woff2'   => 'font/woff2',
        'map'     => 'application/json; charset=UTF-8',
        'webmanifest' => 'application/manifest+json; charset=UTF-8',
    ];

    if (!$authed) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "This guide is private.\n";
        return;
    }

    $root = __DIR__;
    $full = realpath($root . '/' . $path);
    $ext  = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    $inside    = $full !== false && str_starts_with($full, $root . DIRECTORY_SEPARATOR);
    $forbidden = !$inside
        || str_starts_with($full, $root . DIRECTORY_SEPARATOR . 'private')
        || str_starts_with($full, $root . DIRECTORY_SEPARATOR . 'lib')
        || !isset($mime[$ext]);

    if ($forbidden || !is_file($full)) {
        http_response_code($forbidden ? 403 : 404);
        header('Content-Type: text/plain; charset=UTF-8');
        echo $forbidden ? "Not available.\n" : "Not found.\n";
        return;
    }

    // CSS/JS/data must pick up new deploys immediately, so they revalidate on
    // every load (cheap 304s via ETag). Images and vendor files change rarely
    // and may cache for an hour.
    $mtime    = (int) filemtime($full);
    $etag     = '"' . $mtime . '-' . filesize($full) . '"';
    $volatile = in_array($ext, ['css', 'js', 'mjs', 'json', 'geojson', 'map', 'webmanifest'], true);

    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
    header('Cache-Control: private, ' . ($volatile ? 'no-cache' : 'max-age=3600'));
    header('X-Content-Type-Options: nosniff');

    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
    $ifModSince  = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';
    if ($ifNoneMatch === $etag || ($ifNoneMatch === '' && $ifModSince !== '' && strtotime($ifModSince) >= $mtime)) {
        http_response_code(304);
        return;
    }

    header('Content-Type: ' . $mime[$ext]);
    header('Content-Length: ' . (string) filesize($full));
    readfile($full);
}

function bb_render_login(string $state, string $message, bool $ok, string $email): void
{
    $contact  = gate_config()['contact'];
    $emailAttr = htmlspecialchars($email, ENT_QUOTES);
    $msgHtml   = $message !== '' ? $message : ''; // messages are composed server-side, already safe
    $msgClass  = $ok ? 'note' : 'note note--error';
    ?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Boston Begins · Private guide</title>
<style>
  :root {
    --sky: #7DB7E8; --blue: #2E5D86; --ink: #263238; --parchment: #F6F1E7;
    --gold: #D7A84B; --card: #FFFFFF; --line: rgba(46,93,134,.18);
    --err: #9B4A3F;
  }
  @media (prefers-color-scheme: dark) {
    :root { --parchment:#1A2229; --card:#232E37; --ink:#E9EDF0; --blue:#9CC4E4;
            --line:rgba(156,196,228,.22); --err:#E4A69C; }
  }
  * { box-sizing: border-box; margin: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    min-height: 100vh; min-height: 100svh;
    display: grid; place-items: center;
    background:
      radial-gradient(120% 90% at 50% -10%, rgba(125,183,232,.35), transparent 60%),
      var(--parchment);
    color: var(--ink);
    font: 17px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    padding: 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  main { width: 100%; max-width: 420px; }
  .mark { display: block; margin: 0 auto 18px; width: 72px; height: auto; }
  h1 {
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    font-weight: 600; font-size: 34px; letter-spacing: .01em;
    text-align: center; color: var(--blue);
  }
  .sub { text-align: center; font-size: 14.5px; opacity: .75; margin: 6px 0 26px; }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: 18px;
    padding: 26px 22px; box-shadow: 0 12px 40px -18px rgba(38,50,56,.35);
  }
  label { display: block; font-size: 13px; font-weight: 600; letter-spacing: .04em;
          text-transform: uppercase; color: var(--blue); margin-bottom: 8px; }
  input {
    width: 100%; font: inherit; color: inherit;
    padding: 13px 14px; border-radius: 12px; border: 1.5px solid var(--line);
    background: transparent; margin-bottom: 14px;
  }
  input:focus-visible { outline: 3px solid var(--sky); outline-offset: 1px; border-color: var(--blue); }
  input.code { letter-spacing: .45em; text-align: center; font-size: 24px;
               font-variant-numeric: tabular-nums; }
  button {
    width: 100%; font: inherit; font-weight: 650; letter-spacing: .01em;
    padding: 13px 16px; border: 0; border-radius: 12px; cursor: pointer;
    background: var(--blue); color: #fff;
  }
  @media (prefers-color-scheme: dark) { button { color: #16202A; } }
  button:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
  .note { margin: 0 0 16px; font-size: 15px; padding: 12px 14px; border-radius: 12px;
          background: rgba(125,183,232,.16); border: 1px solid var(--line); }
  .note--error { background: rgba(155,74,63,.10); border-color: rgba(155,74,63,.35); color: var(--err); }
  .alt { margin-top: 14px; text-align: center; font-size: 14px; }
  .alt a, .foot a { color: var(--blue); }
  .foot { margin-top: 26px; text-align: center; font-size: 13px; opacity: .7; }
</style>
</head>
<body>
<main>
  <svg class="mark" viewBox="0 0 120 84" role="img" aria-label="Small elephant emblem" style="color:var(--blue)">
    <path fill="currentColor" fill-rule="evenodd" d="M14 70 C10 66 9 58 11 50 C12 44 14 38 14 32 C15 20 24 10 38 8 C48 6 52 8 58 8 C74 6 94 10 100 24 C105 32 105 44 99 52 L99 73 L86 73 L86 60 C76 63 60 63 52 60 L52 73 L39 73 L39 56 C32 52 28 46 27 38 C25 46 23 56 20 64 C18 70 16 72 14 70 Z M46 19 C58 13 69 21 68 32 C67 43 57 49 48 44 C40 39 39 25 46 19 Z M29 21 a2.7 2.7 0 1 0 .01 0 Z"/>
  </svg>
  <h1>Boston Begins</h1>
  <p class="sub">A private family field guide · Luna, Liam &amp; Max</p>
  <div class="card">
    <?php if ($msgHtml !== ''): ?><p class="<?= $msgClass ?>" role="status"><?= $msgHtml ?></p><?php endif; ?>
    <?php if ($state === 'code'): ?>
      <form method="post" action="">
        <input type="hidden" name="action" value="code">
        <input type="hidden" name="email" value="<?= $emailAttr ?>">
        <label for="code">Enter your 6-digit code</label>
        <input class="code" id="code" name="code" inputmode="numeric" autocomplete="one-time-code"
               pattern="[0-9]{6}" maxlength="6" required autofocus placeholder="••••••">
        <button type="submit">Open the guide</button>
      </form>
      <form method="post" action="" class="alt">
        <input type="hidden" name="action" value="email">
        <input type="hidden" name="email" value="<?= $emailAttr ?>">
        <p>Didn’t get it? <button type="submit" style="all:unset;cursor:pointer;color:var(--blue);text-decoration:underline;font-weight:600">Send a new code</button></p>
      </form>
    <?php else: ?>
      <form method="post" action="">
        <input type="hidden" name="action" value="email">
        <label for="email">Your email address</label>
        <input type="email" id="email" name="email" autocomplete="email" required
               value="<?= $emailAttr ?>" placeholder="you@example.com" autofocus>
        <button type="submit">Email me an access code</button>
      </form>
    <?php endif; ?>
  </div>
  <p class="foot">This guide is for invited family &amp; friends.<br>
     Need access? Write to <a href="mailto:<?= htmlspecialchars($contact, ENT_QUOTES) ?>"><?= htmlspecialchars($contact) ?></a>.</p>
</main>
</body>
</html>
<?php
}
