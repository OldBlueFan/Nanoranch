<?php
/**
 * Local-preview router for PHP's built-in server. Mirrors what .htaccess
 * does on Apache: every request flows through index.php's gate.
 *
 *   cd space/boston
 *   php -S localhost:8000 dev-router.php
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$rel = ltrim($uri, '/');

if ($rel !== '' && $rel !== 'index.php') {
    $_GET['path'] = $rel;
}

require __DIR__ . '/index.php';
