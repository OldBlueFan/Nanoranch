# Boston Begins

A private, mobile-first family travel companion for Luna, Liam & Max —
Medford, Cambridge & Boston, August 12–14, 2026. Lives at
**nanoranch.org/space/boston/**, behind an email-whitelist access gate.

## How it works

- **Everything is served through `index.php`.** Apache (`.htaccess`) rewrites
  every request in this directory to the front controller, which checks the
  visitor's access cookie before streaming any file — HTML, JSON, images,
  scripts. Nothing in the guide is reachable without signing in.
- **The app itself is static.** All editorial content lives in
  `boston-guide.json`; `lib/render.php` renders it server-side into a complete
  semantic document, and `js/` adds tabs, filters, saved state, the map, and
  print modes on top. With JavaScript off, the whole guide is still readable
  and printable.
- **No database, no build step, no external services.** Access codes are small
  files under `private/codes/`; sessions are signed cookies; the map is
  vendored Leaflet with OpenStreetMap tiles.

## The access gate

1. A visitor enters their email. If it's on the whitelist, a 6-digit code is
   emailed from `noreply@nanoranch.org` (valid 10 minutes, 5 attempts).
2. On success they get a signed, HttpOnly cookie good for **30 days** on that
   device.
3. Anyone not on the list is told the guide is private and to contact
   **max@nanoranch.org**.

**To grant or revoke access:** add the address to `allowed_emails` — best
done in **`private/config.local.php`** on the server (create it if missing;
same array shape as `config.php`; it's gitignored, so deploys never
overwrite it):

```php
<?php
return [
    'allowed_emails' => [
        'max@nanoranch.org',
        'luna@example.com',
        'liam@example.com',
    ],
];
```

Revoking an address also kills its existing sessions (the cookie re-checks
the whitelist on every request). Session length, code expiry, attempt
limits, and sender address all follow the same pattern: defaults in
`config.php`, server overrides in `config.local.php`.

`private/secret.key` (cookie-signing secret) is generated automatically on
first use. Deleting it signs everyone out. `private/codes/` is runtime
scratch — safe to empty at any time.

## Email authentication (fixing the "failed authentication" warning)

Mail providers (Proton included) flag the code emails if they're sent by PHP
`mail()` from the web server: nanoranch.org's DNS authorizes *Proton's* mail
servers, not Dreamhost's web machines, so SPF/DKIM/DMARC fail.

**The reliable fix — send through Proton's SMTP submission** (paid-plan
feature):

1. In Proton: **Settings → All settings → Proton Mail → IMAP/SMTP →
   SMTP tokens → Generate token.** Pair it with the sending address
   (`noreply@nanoranch.org` if that exists as an address in your Proton
   account; otherwise use `max@nanoranch.org` and set `mail_from` to match).
   Copy the token immediately — it's shown once.
2. On the server, add to `private/config.local.php`:
   ```php
   'mail_from' => 'noreply@nanoranch.org',   // must match the token's address
   'smtp' => [
       'username' => 'noreply@nanoranch.org',
       'token'    => 'the-token-you-copied',
   ],
   ```
   (host/port default to `smtp.protonmail.ch:587` with STARTTLS.)
3. Request a code and confirm the warning is gone. If SMTP ever fails, the
   gate logs the reason and falls back to `mail()` so codes still arrive.

*Lighter alternative:* adding Dreamhost's outbound servers to the domain's
SPF record helps some providers, but the mail still isn't DKIM-signed, so
strict receivers (Proton, Gmail) may keep flagging it. The SMTP route is the
one that fully clears it.

## Uploading to Dreamhost

Deploying the nanoranch site normally (push `main` to the `dreamhost`
remote) ships this directory too — it's copied verbatim by Eleventy's
passthrough. Requirements on the host:

- PHP 8.x (Dreamhost shared default is fine).
- `mail()` allowed (standard on Dreamhost). For deliverability,
  `noreply@nanoranch.org` should exist as an address or alias on the domain.
- `.htaccess` rewrites enabled (default).
- The web server must be able to **write** to `private/` (it creates
  `secret.key` and `codes/`). If codes never arrive and the page reports an
  error, check directory permissions first.

No special MIME configuration is needed: because every file streams through
PHP, `index.php` sets correct types itself (including JSON).

Quick smoke test after deploying:

```sh
curl -s https://nanoranch.org/space/boston/ | grep -o '<title>[^<]*'   # login page title
curl -s -o /dev/null -w '%{http_code}\n' https://nanoranch.org/space/boston/boston-guide.json   # must be 403
```

## Local preview

```bash
cd space/boston
php -S localhost:8000 dev-router.php
```

Then visit <http://localhost:8000>. Under the built-in dev server, access
codes aren't emailed — they're printed to the `php -S` console
(`[boston-begins] access code for …: 123456`), so you can complete the
sign-in without a mail server. On the real host, codes go out via email only.

## Updating content

All copy — destinations, clusters, transit, tips, letters, sources — is in
**`boston-guide.json`**. Edit it, upload it, done; no code changes needed.

To add a destination, copy an existing object in `destinations` and adjust:

- `id` — unique slug (used in links: `#d-<id>`)
- `clusterId` — one of the `clusters` ids
- `category` — moods used by filters: `history`, `campus`, `food`,
  `waterfront`, `baseball`, `art`, `wandering`, plus free-form
- `weather` — `sunny` / `hot` / `rainy` / `flexible`
- `energy` — `easy` / `moderate` / `ambitious`
- `latitude`/`longitude` — for the map marker
- `officialUrl` + `verificationDate` — for anything time-sensitive
- `image.src` / `image.alt` — see below

Validate after editing (a stray comma is the usual culprit):

```bash
php -r 'json_decode(file_get_contents("boston-guide.json")) ?: exit("Invalid JSON\n");' && echo OK
```

## Replacing the placeholder art

Every image is currently an original SVG illustration in `assets/images/`,
named after the destination or cluster id (`public-garden.svg`,
`cluster-seaport.svg`, …). To use a real photo:

1. Save it as `assets/images/<id>.jpg` — **3:2** for destinations
   (~1200×800), **16:9** for clusters (~1600×900).
2. Update that entry's `image.src` in `boston-guide.json` (change `.svg` to
   `.jpg`) and rewrite `image.alt` to describe the actual photo.

Use licensed or family-taken photography only, and don't put the street
address in filenames.

## Saved data & privacy

- Favorites, "we did this," notes, family picks, and memory-page answers are
  stored in `localStorage` **on each device** — nothing syncs. The Saved tab
  has a **Reset local trip data** button.
- The exact home address appears nowhere in the app, its data file, its
  markup, or printed output. The map's home-base marker is generalized to the
  Tufts campus edge, labeled "Luna's Home Base — Windsor Road, Medford."
  Keep it that way when editing.

## Printing / PDF

- **Print or Save as PDF** (top bar) prints the full keepsake edition —
  cover, chapters, transit guide, letters, memory pages — via the browser's
  print dialog (choose "Save as PDF" as the destination).
- **Print our shortlist** (Saved tab) prints only saved/completed
  destinations as a compact field guide.
- Page size is US Letter; A4 works with the same margins.

## Pre-trip checklist (early August)

- [ ] Re-check the **harbor cruise** departure calendar for the chosen day and book.
- [ ] Confirm **Fenway tour** availability for Wed/Thu (concert setup may limit Friday).
- [ ] Decide on **Chris Stapleton, Fri Aug 14** — tickets via the official listing.
- [ ] Skim **MBTA alerts** for Green Line E / Red Line work.
- [ ] Glance at the **Tufts events calendar** in case a summer event was added.
- [ ] Update any `verificationDate` fields you re-verify.

## No service worker

There is intentionally no service worker: the access gate and offline caching
work against each other, and after one load the guide is a single cached page
that tolerates spotty connectivity well enough. External links (MBTA, venues)
naturally need a connection.
