# Direct messages (`/api/message.php`)

Each open card can show a **Message me about this** form (message, phone number to text back, optional name). The PHP endpoint emails it to Max and sends a Pushover alert to his phone. Nothing is stored except hashed-IP rate-limit counters.

The form only appears once `TURNSTILE_SITE_KEY` in `js/main.js` is set.

## Protection

- Origin must be `https://nanoranch.org` (or `www.`)
- Cloudflare Turnstile check (verified server-side, hostname pinned)
- Hidden honeypot field + minimum time on the form (bots get a silent fake "sent")
- Rate limits: 3 per 10 minutes and 10 per day per visitor, 60 per day overall
- Card title comes from `content/*.json`, not from the request; header values are stripped of line breaks
- Secrets live outside the web root and outside git

## Setup (once)

1. **Pushover** — install the app, buy the one-time licence, then on pushover.net note your **User Key** and **Create an Application** (name it "nanoranch") to get an **API Token**.
2. **Turnstile** — in the Cloudflare dashboard → Turnstile → Add widget for `nanoranch.org` (mode: Managed). Note the **Site Key** (public) and **Secret Key**.
3. **Secrets file on Dreamhost** — outside the web folder, next to it:

   ```sh
   ssh malloy@pdx1-shared-a2-06.dreamhost.com
   mkdir -m 700 -p ~/nanoranch-private
   nano ~/nanoranch-private/messages.php
   chmod 600 ~/nanoranch-private/messages.php
   ```

   ```php
   <?php
   return [
       'email_to'         => 'max@nanoranch.org',
       'email_from'       => 'noreply@nanoranch.org',
       'pushover_token'   => 'PASTE_API_TOKEN',
       'pushover_user'    => 'PASTE_USER_KEY',
       'turnstile_secret' => 'PASTE_TURNSTILE_SECRET',
   ];
   ```

   The endpoint looks for `<parent of the site's document root>/nanoranch-private/messages.php`. If the site's folder is `~/nanoranch.org`, that's `~/nanoranch-private/messages.php`.
4. **Site key** — put the Turnstile **Site Key** (public) in `TURNSTILE_SITE_KEY` in `js/main.js` and deploy. The form appears.

## Local testing

```sh
NANORANCH_PRIVATE=/path/to/test-private php -d sendmail_path="tee -a /tmp/mail.log" -S 127.0.0.1:8930
```

The test config can point `pushover_endpoint` / `turnstile_endpoint` at a local mock, and `allowed_origins` at the local origin.
