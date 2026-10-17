# Earth & Cosmos v0: one-hour build kit

Everything for the scaled-back Pro-plan build. The content is already written (`destinations.json`), so Claude Code only builds.

**Files in this folder**

| File | What it is | Goes to |
|---|---|---|
| `START-HERE.md` | This checklist and Prompt C | `soul/travel/_brief/` |
| `EARTH-COSMOS-MASTER.md` | Full spec, for the rules and the later v1.1 | `soul/travel/_brief/` |
| `destinations.json` | All 10 trips, written and ready: hikes, itineraries, fit verdicts, calendar | `soul/travel/data/` |
| `photos.json` | 61 licensed photos with credits and alt text | `soul/travel/data/` |
| `pins.json` | 68 geocoded map pins | `soul/travel/data/` |

**Model:** Opus. Not Fable, which is billed separately on Pro. If you hit the usage limit, switch to Sonnet to finish.

---

## Step 1 — Stage the repo (2 min, Terminal on the Mac Mini)

Fix `REPO` first if your clone lives somewhere else, such as `~/Sites/nanoranch`.

```sh
REPO=~/nanoranch
SRC=~/Documents/Claude/Projects/nanoranch/earth-cosmos
cd "$REPO" && git status --short
```

If that prints changes you want to keep, stash them first: `git stash push -u -m WIP`.

```sh
git checkout main && git pull --ff-only origin main
git checkout -b claude/soul-travel-earth-cosmos
mkdir -p soul/travel/_brief soul/travel/data
cp "$SRC"/START-HERE.md "$SRC"/EARTH-COSMOS-MASTER.md soul/travel/_brief/
cp "$SRC"/destinations.json "$SRC"/photos.json "$SRC"/pins.json soul/travel/data/
claude
```

---

## Step 2 — Prompt C (plan mode, then paste)

```
Read CLAUDE.md, then from soul/travel/_brief/EARTH-COSMOS-MASTER.md read ONLY sections 4, 5,
6.3 and 8. This is a scaled-back ONE-HOUR v0. All content is already written in
soul/travel/data/destinations.json, photos.json and pins.json — use them as-is and do not
rewrite, invent or "improve" any content. Give me a short plan (≤10 bullets) and wait for my OK.

BUILD EXACTLY THIS:
1. soul/travel/index.html, travel.css, travel.js (vanilla, single IIFE). Link
   /css/tokens/fonts.css, colors.css, typography.css, spacing.css, motion.css — don't redefine
   tokens. No new fonts, no CDN scripts, no build step. travel.js fetches the three JSON files.
2. Hero: "EARTH & COSMOS / Ten extraordinary journeys" over photo fort-davis-mcdonald-01, on
   --gradient-dusk with a light seeded star field (seed 42, per CLAUDE.md).
3. Index in two groups: "Seven weekend possibilities" (group "weekend") and "Three longer
   journeys" (group "extended"). Each card: photo [0], number (01–10), title, place, theme
   chips (themeLabels), preferredMonth, bestWeatherMonths, the fit badge (fitLabels — text +
   shape, never color alone), a star toggle, and a Yes/Maybe/Pass vote group.
4. Filter chips from themeLabels: multi-select OR, live count with aria-live, numbering
   always preserved, and a "★ only" chip.
5. A card expands in place (real <button aria-expanded>, URL hash #d-<id>, Esc closes,
   focus moves to the chapter heading) into: a scroll-snap strip of its photos with credits;
   why; hikes as label cards; lodging; culture; flightGateway / groundTransfer /
   logisticsNote; weekendFitNote; itinerary; cautions; sources (external links get the
   11px arrow + "(opens in new window)").
6. One Leaflet map: copy space/boston/vendor/leaflet to soul/travel/vendor/leaflet. Use OSM
   standard tiles with attribution, lazy-loaded when scrolled into view. Show only pins whose
   confidence is "verified" or "verified-centroid". Each chapter gets a "Show on map" button
   that flies to its pins. No route lines. Add a keyboard-reachable list of the pins under
   the map.
7. Season calendar from the "calendar" array as a chronological list ending on the Azores,
   with calendarOpenMonths shown as quiet buffers and calendarCaption beneath.
8. Favorites and votes in cookie "nr_ec" exactly per brief §8, plus "Reset my picks" and
   the note "Your stars and votes live only in this browser."
9. Credits: every photo's author, license (linked) and Commons page, plus map attribution.

IMAGES: use each photo's "download" URL, swapping width to 800 for cards and keeping 2400
for the hero; use 1600 in chapters. Set width/height attributes from photos.json, use the
alt text exactly, and loading="lazy" on everything except the hero.

DO NOT BUILD: an image pipeline, trail geometry, horizon animation, Earth/Cosmos lens,
constellation, moon markers, dream/reality toggle, homepage card, or OG image.

RULES: brief §4 in full — never soften RED/AMBER, no fabricated prices, times, routes or
availability, no personal subtext. WCAG 2.2 AA: gold focus ring (--focus-ring), small text
≥ --text-dim, 44px targets, reduced motion respected. Mobile first, 700px breakpoint.
Voice: no emoji, no exclamation marks. If serving /soul/travel/ requires an .eleventy.js
change, tell me before making it.

DONE = commit to branch claude/soul-travel-earth-cosmos. Then run `python3 -m http.server
8080` from the repo root, give me http://<this Mac's LAN IP>:8080/soul/travel/ (get the IP
with `ipconfig getifaddr en0`), and list what you verified versus what I must check.
Do not deploy.
```

---

## Step 3 — Phone check (10–15 min, phone on the same Wi-Fi)

- [ ] The hero loads fast and the page reads as nanoranch: dusk sky, Crimson Pro, gold focus.
- [ ] All 10 cards show, split 7 + 3, with the correct numbering.
- [ ] Badges: #05 and #07 read RED, and #08–10 read "Longer journey".
- [ ] Filters work, the count updates, and the numbers never change.
- [ ] A card opens into its chapter, the photos swipe, credits are visible, and the back button / Esc closes it.
- [ ] Star and vote a few trips, reload, and they're still there. "Reset my picks" clears them.
- [ ] The map loads, "Show on map" flies to the right place, and there are no weird stray pins.
- [ ] The calendar ends on the Azores.
- [ ] Nothing overflows sideways on the phone.

Give one round of fixes in a single message, then stop. Everything else goes on the v1.1 list.

---

## Step 4 — Ship (5 min)

```sh
cd ~/nanoranch
git checkout main && git pull --ff-only origin main
git merge claude/soul-travel-earth-cosmos
git push origin main && git push dreamhost main
curl -s https://nanoranch.org/soul/travel/ | grep -o '<title>[^<]*'
```

If you stashed work in Step 1, bring it back with `git checkout <your branch> && git stash pop`.

`soul/travel/_brief/` deploys with the site. It contains nothing personal, but you can `git rm -r soul/travel/_brief` before merging if you'd rather it not be public.

---

## v1.1 list (later, when there's time and usage)

- Self-host the photos (AVIF/WebP pipeline).
- Fix the 7 approximate pins.
- Add OSM trail lines.
- Add the homepage SOUL card.
- Build the delight layer: horizon, Earth ↔ Cosmos lens, constellation.
- Add the dream/reality toggle and swap cards.
- Add new-moon markers.
- Run the full verification checklist (master §16).
