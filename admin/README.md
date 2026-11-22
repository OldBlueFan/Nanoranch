# Content editor (`/admin/`)

[Sveltia CMS](https://github.com/sveltia/sveltia-cms) edits `content/soil.json`, `content/space.json` and `content/soul.json` and uploads media to `media/`. Saving commits straight to `main` on GitHub; the **Deploy to Dreamhost** action then publishes it to nanoranch.org within about a minute.

There is no server-side login: the page can only change content when signed in with a GitHub token that has write access to this repo.

## Signing in

1. **Create a token** (once per year): GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Resource owner: `OldBlueFan`. Repository access: **Only select repositories** → `Nanoranch`
   - Repository permissions: **Contents → Read and write** (Metadata read-only is added automatically). Nothing else.
   - Expiration: up to a year. Store the token in your password manager.
2. Go to **nanoranch.org/admin/** → **Sign In Using Access Token** → paste the token.
3. **Phone:** once signed in on a computer, use **Sign In with Mobile** in the account menu and scan the QR code with your phone — no token typing on the phone.

If a token leaks, delete it on that same GitHub page; it stops working immediately. Every edit is a git commit, so any change can be reverted.

## Card fields

| Field | Notes |
|---|---|
| Link name (`id`) | Card's address, e.g. `drip-line` → `nanoranch.org/#soil/drip-line`. Don't change it once shared. |
| Title / Status line | Status is the optional italic line under the title. |
| Show on the site | Off = hidden draft. |
| Card thumbnail | Optional; defaults to the first photo. |
| Photos and video | Photos are converted to WebP, max 2000px, in the browser before upload. Videos: paste a YouTube/Vimeo link (preferred) or upload a clip under 25 MB. |
| Text | Bold, italic, links, two heading sizes, quotes, lists. Empty = "In development — check back." |
| Button link | Optional button at the end; full web addresses open in a new window. |

## Upgrading Sveltia

`index.html` pins an exact version with an integrity hash, so the browser refuses any other file. To upgrade:

```sh
npm pack @sveltia/cms@<version> && tar xzf sveltia-cms-<version>.tgz
echo "sha384-$(openssl dgst -sha384 -binary package/dist/sveltia-cms.js | openssl base64 -A)"
```

Put the new version in the script URL and the printed hash in `integrity`. Validate `config.yml` against `package/schema/sveltia-cms.json` before shipping.
