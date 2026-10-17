# Earth & Cosmos — Master Build Brief

**Destination:** `nanoranch.org/soul/travel/`
**Version:** 1.0 · October 17, 2026
**Prepared by:** Iris, from Shims' ChatGPT brief, after inspecting the live `OldBlueFan/nanoranch` repo
**Companion files:** `photos.json` (61 curated, licensed photographs) · `pins.json` (68 geocoded map pins)

> Ten extraordinary journeys through caves, mountains, dark skies, wild coastlines, and volcanic islands.

---

## 0. How to use this package

| Step | Tool | Input | Output | Gate |
|---|---|---|---|---|
| 1 | **Claude Design** | Prompt A (§1) + `css/tokens/*.css` + 10 hero photos | 4 key frames, desktop + mobile, and a handoff bundle | Max picks a direction |
| 2 | **Claude Code**, plan mode, run **locally on the Mac Mini** | Prompt B (§2) + this file + `photos.json` + `pins.json` + the Design handoff bundle | Static microsite in `soul/travel/` on a feature branch, draft PR | Max verifies each phase on a physical phone |
| 3 | Max | Draft PR | Merge, deploy, check with `curl` | Live |

**Why run Claude Code locally:** the build has to download 61 images from Wikimedia Commons and trail geometry from OpenStreetMap. Cloud sessions with a restricted network allowlist can't reach those hosts, but the Mac Mini can.

**Where these files go in the repo:** `soul/travel/_brief/` (master, photos.json, pins.json). Add `_brief/` to the Eleventy ignores and keep it out of the deployed output.

**The repo is public.** This brief intentionally doesn't name the people or reasons behind any trip. Keep it that way, and don't commit the original ChatGPT brief.

---

## 1. Prompt A — Claude Design (paste as-is)

```
You're designing a microsite for nanoranch.org, a personal rewilding site organized around
soil, space, and soul. The microsite lives at /soul/travel/ and is titled EARTH & COSMOS:
ten journeys through caves, mountains, dark skies, wild coastlines, and volcanic islands.
It's a personal adventure list. Treat it as an atlas you want to explore, not a booking site.

BRAND — use these attached tokens exactly. Don't invent a brand guide.
- Canvas: the nanoranch dusk sky, a vertical gradient from #04030c through #0a0921, #130e30,
  #1d1240 and #241546 to #2a184a, with a cyan/violet horizon glow at the bottom. Add a subtle
  seeded star field and a grass silhouette (inks #191128 / #070510) on the horizon.
- Type: Crimson Pro (variable, with italic) for display AND body. Outfit only for tracked
  UPPERCASE labels, buttons, nav, and chips, at 0.3–0.58em letter-spacing with a matching
  text-indent.
- Only one foreground accent, gold rgba(240,200,120,.85), used for focus rings, card
  hairlines, active states, and in-card links. Labradorite fields (gold, amber, cyan, teal,
  cobalt, green) appear only as large color zones, never as confetti.
- Glass cards: gradient rgba(20,15,44,.62)→rgba(12,9,28,.55), 1px rgba(255,255,255,.14)
  border, 6px radius, 10px backdrop blur. Controls have a 2px radius.
- The mark };{ is always live type: Crimson Pro italic 480, monochrome white. Its parts
  carry meaning: the dot is a star, the comma is a sapling, and the braces are wings/birds.
- Motion is organic, never bouncy: cubic-bezier(0.22,0.9,0.3,1). Reduced motion snaps to
  final states.
- Voice: first person singular, compact poetic fragments, sentence case for prose, and
  tracked caps for wayfinding only. No emoji, no exclamation marks.
- Avoid Inter, purple gradients on white, glassmorphism clichés beyond the tokens above,
  stock "travel app" UI, and WebGL.

CREATIVE DIRECTION
Illustrated field journal meets elegant travel atlas, set on the dusk sky. The photographs
are the light source. The field-journal feel comes from detail: specimen-label hike cards,
hairline gold route marks, numbered plates, and marginal notes in Crimson Pro italic.
Avoid cream paper. The emotional arc is expanding horizons: from a cave underground (#01),
through mountains, trains and night skies, out to the Atlantic horizon (#10, the quiet finale).

DESIGN THESE FOUR FRAMES (desktop 1440 and mobile 390 each):
1. HERO + INDEX — immersive photo hero "EARTH & COSMOS / Ten extraordinary journeys", then the
   index split into "Seven weekend possibilities" (01–07) and "Three longer journeys" (08–10).
   Each numbered card has a photo, title, place, 2–3 theme chips, preferred month,
   best-weather months, a weekend-fit badge (GREEN / AMBER / RED, colorblind-safe, with
   text, never color alone), a mini locator, a star (favorite), and Yes / Maybe / Pass votes.
   Include filter chips (Caves, Steam train, Alpine, Cosmos, Birding, Volcanoes, Aurora,
   Island, Culture) and a "Dream list ↔ Friday–Sunday reality" toggle.
2. DESTINATION CHAPTER — one card expanded into a full chapter: a 6-photo filmstrip with
   credits, "why it matters", 2–4 hikes as specimen-label cards (distance, difficulty,
   caveat), a trail map panel, lodging, culture/food, Austin logistics, a day-by-day
   itinerary, and booking cautions.
3. MAP + CALENDAR — a dark zoomable map with ten star-pins and gold arcs from Austin
   (labeled as direction, not flight routes), plus a chronological Nov 2026 → Nov 2027
   season calendar that ends on the Azores.
4. MY SKY — favorites drawn as a personal constellation (each starred trip becomes a star,
   joined in number order), with the visitor's votes and a "share my shortlist" link.

Show two contrasting directions for frame 1 before refining. Bold over safe.
```

**What to attach in Claude Design:** the five files in `css/tokens/`, `assets/grass.svg`, and the 10 `hero` photos from `photos.json`. Download them from each entry's `download` URL. If the original homepage handoff bundle still exists at `~/Sites/nanoranch/design_handoff_nanoranch_homepage/design_system/`, attach that folder too. It's the design source of truth named in the repo's `CLAUDE.md`.

---

## 2. Prompt B — Claude Code (paste as-is, in plan mode)

```
Read soul/travel/_brief/EARTH-COSMOS-MASTER.md in full, then CLAUDE.md at the repo root.
If I've placed a Claude Design handoff bundle in soul/travel/_brief/design/, treat it as the
visual reference and the master brief as the content and behavior spec. When they conflict,
the brief wins on honesty, data, and accessibility, and the design wins on look.

Build the Earth & Cosmos microsite at /soul/travel/ as described in the brief. Work on a new
branch `claude/soul-travel-earth-cosmos`. Never push to the `dreamhost` remote. Open a draft PR.

Before writing code, produce a plan covering:
 1. Which pipeline actually serves production: static index.html per CLAUDE.md, or Eleventy
    per .eleventy.js / index.njk. Verify, don't assume, and tell me what you found.
 2. How you'll render content so it's readable without JavaScript (brief §13).
 3. The image pipeline (brief §12) and the trail-geometry pipeline (brief §7).
 4. Every place you'd touch outside soul/travel/ (expected: .eleventy.js ignores/passthrough
    and the SOUL card in js/main.js). Wait for my OK on those.
 5. Open questions. List them; don't guess.

Then build in the phases in brief §15 and stop at each acceptance gate. At every gate, list
what you verified yourself versus what I must verify on my phone. Your self-reports are
claims; I confirm them.

Hard rules: vanilla JS, no framework, no CDN scripts (vendor Leaflet from
space/boston/vendor/leaflet). Import the existing tokens; don't redefine them. No invented
coordinates, routes, prices, flight times, trail statuses, or availability. Every photo is
credited with author, license, and a link. Weekend-fit verdicts are never softened.
```

---

## 3. What changed from Shims' brief (Iris's corrections and decisions)

1. **Costa Rica nonstop corrected.** AUS's Oct 2, 2026 release says the Southwest LIR nonstop runs **twice weekly, Saturdays and Sundays only, June 3 – August 2, 2027**, as a seasonal summer route. It doesn't serve a March trip at all, and it can't support a Friday departure. The RED verdict stands, and the logistics copy now says why.
2. **Indian Lodge has reopened.** Texas Parks & Wildlife's Indian Lodge reopened in May 2025 after its renovation. I dropped "if operational" and kept "verify availability".
3. **Removed personal identifiers from the handoff.** The public repo will hold this brief, so it doesn't name any companion or reason a place was chosen. The no-references rule still stands.
4. **The visual direction now matches the actual brand.** The repo's dusk sky, labradorite, gold accent, and Crimson Pro + Outfit (`css/tokens/`) are the source of truth. They replace any earlier palette notes. "Field journal" becomes texture and detail, not a cream paper theme.
5. **The repo is vanilla JavaScript.** `CLAUDE.md` says no external JS dependencies, so the motion is CSS plus vanilla JS. Leaflet is reused from the vendored copy in `space/boston/`. GSAP only comes in if Max explicitly OKs it, and then it's vendored, never loaded from a CDN.
6. **Votes are local.** The cookie approach Max asked for means each visitor sees only their own votes. Aggregate tallies would need a backend; a Phase-2 PHP option matching the Boston precedent is in §8. It's out of scope for v1.
7. **Placement is deliberate.** Boston Begins lives under `/space/`, and this one goes under `/soul/` because that's Max's call. Adding it makes four SOUL cards on the homepage instead of three, so check that layout.
8. **Photo captions are honest about location.** The Keys kayak photo is from Curry Hammock (Middle Keys), the aurora is captioned "Iceland" (no specific coast), and the Rincón crater photo shows the summit, where access has been restricted in recent years. It's used for scenery, not as a hike promise, so verify access before writing any summit copy.
9. **Repo inconsistency to resolve first.** `CLAUDE.md` describes a static `index.html` with no build, while `.eleventy.js`, `index.njk`, and `_includes/base.njk` describe an Eleventy site with an older nav and an extra font. Claude Code must confirm which one is live before integrating.

---

## 4. Non-negotiables

- **Travel honesty.** Weekend fit is measured as Friday-morning departure from Austin and Sunday-evening return.
  - **GREEN:** a meaningful Saturday hike, plus partial Friday and Sunday experiences, is realistic.
  - **AMBER:** works only with carefully aligned flights or fewer activities.
  - **RED:** not a satisfying two-night trip. Keep it for the story, and recommend 3–4 nights.
  - **Mont-Mégantic and Costa Rica are RED.** Never market them as easy weekends.
- **No fabrication.** That means no prices, flight times, room availability, trail status, or invented sample departures. A nominal nonstop isn't proof that its operating days fit the trip.
- **No personal subtext.** There are no references to companions, romantic intent, custody schedules, or why any place was chosen. The Azores is the quiet finale, never overexplained and never winked at.
- **Real photography only,** credited with author, license, and a link to the source. No AI imagery stands in for a real place.
- **Geography is real.** Pins come from geocoded data (`pins.json`). Routes come only from OpenStreetMap or official sources, with attribution. If no verified route exists, use a trailhead pin plus a link to the official map.
- **Accessibility is WCAG 2.2 AA,** per the repo `CLAUDE.md` (§14).

---

## 5. Brand system (from the live repo — import, don't copy)

Link these, in order, from the microsite: `/css/tokens/fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `motion.css`. Microsite-only additions go in `soul/travel/travel.css` as new custom properties prefixed `--ec-`. Prefer the existing tokens.

| Role | Token(s) | Notes |
|---|---|---|
| Canvas | `--gradient-dusk`, `--glow-horizon`, `--sky-0…5` | Always a vertical gradient |
| Stars | `--star`, `--star-glow` | Seeded LCG field, per homepage precedent |
| Horizon | `/assets/grass.svg`, `--ink-grass`, `--ink-grass-back` | Grass silhouette line |
| Text | `--text-primary`, `--text-body`, `--text-soft`, `--text-dim` (min for small text) | `--text-dim` ≈ 4.5:1 floor |
| Accent | `--accent-gold*`, `--focus-ring`, `--glow-gold` | The only foreground accent |
| Color fields | `--lab-*` | Large zones only, e.g. a chapter's ambient wash |
| Surfaces | `--surface-card-gradient`, `--border-card`, `--blur-card`, `--radius-card` | Glass cards |
| Type | `--font-display` (Crimson Pro), `--font-caps` (Outfit) | Outfit only for tracked caps |
| Motion | `--ease-organic`, `--ease-flight`, `--dur-*`, `nrFadeUp`, `nrTwinkle` | Global reduced-motion rule already exists |
| Layout | `--breakpoint-narrow: 700px`, `--hit-min: 44px`, `--pad-page-x` | Mobile-first |

**Weekend-fit badges** need three new tokens. Derive them from the existing palette, and always pair them with text and a shape.

- `--ec-fit-green`, from `--lab-green`, shown as a filled dot.
- `--ec-fit-amber`, from `--lab-amber`, shown as a half dot.
- `--ec-fit-red`, a new warm red. Check it for ≥ 3:1 contrast against the card surface. It's shown as a ring.

**The external-link arrow** (11px) is the brand's only icon. Theme chips are text only. Glyph accents may borrow the mark's parts: `•` for Cosmos themes, `,` for Earth themes, and `{ }` for Birding.

---

## 6. Experience design

### 6.1 Page structure

1. **Hero:** "EARTH & COSMOS / Ten extraordinary journeys", plus one line of invitation. Use full-bleed photography. Default to `fort-davis-mcdonald-01` (Milky Way over the Davis Mountains, the home-state sky). An optional slow crossfade through the ten heroes respects reduced motion.
2. **Index,** split into "Seven weekend possibilities" (01–07) and "Three longer journeys" (08–10).
3. **Destination chapters.** Each card expands in place into a chapter with its own URL hash: `#d-<id>`.
4. **Map:** all ten destinations, then drill-down.
5. **Season calendar:** Nov 2026 → Nov 2027.
6. **Future trail journeys sidebar,** covering hut-to-hut (§10.12).
7. **My sky:** the visitor's favorites constellation and their votes.
8. **Credits:** every photo, the map data, and sources.

### 6.2 Signature interactions (the fun)

- **The horizon descent and ascent.** The index scrolls along the arc of the story. Card #01 sits *below* the grass silhouette, in deep earth tones made from `--sky-0` plus `--lab-fracture`. As the visitor scrolls, the canvas rises through the dusk gradient, the star field thickens at the Cosmos destinations (#04, #05, #08), and #10 lands on the open horizon glow. Build it with CSS custom properties driven by a scroll-progress variable and IntersectionObserver. No canvas, no WebGL.
- **The Earth ↔ Cosmos lens.** A two-ended control echoes the mark: the comma (sapling) on the Earth side and the dot (star) on the Cosmos side. Sliding it re-weights emphasis. Earth-leaning trips (caves, volcanoes, forests, coasts) or Cosmos-leaning ones (observatories, aurora, dark sky) come forward, and the others dim to 60% opacity. **Numbering never changes.** Each destination carries an `earthCosmos` score from 0 to 1 in the data (defaults in §10).
- **Dream list ↔ Friday–Sunday reality.** In reality mode, RED cards dim and get stamped "3–4 NIGHTS", AMBER cards show their condition line, and the strict-weekend substitutions (§11.2) slide in as ghost cards labeled "Reality swap for #05". The originals are never silently replaced.
- **The field-journal chapter.** Opening a card unfolds a chapter: a 6-photo filmstrip (keyboard-scrollable, with credits on each frame), hikes as specimen labels (name, distance, difficulty, duration, caveat), and a trail map panel.
- **Pin to my sky.** Starring a trip lights a star in a personal constellation. Its position comes from the destination's real longitude and latitude, projected onto a small sky panel. Stars connect in trip-number order with hairline gold. "Share my shortlist" encodes the picks in the URL (`#picks=01,04,10`), with no backend.
- **New-moon markers.** The calendar marks approximate new moons, computed client-side with a standard synodic-month algorithm and labeled "approximate". That matters for #04 and #05, where the brief says to book near a new moon.

### 6.3 Filters

The filter chips are Caves, Steam train, Alpine, Cosmos, Birding, Volcanoes, Aurora, Island, and Culture.

- Use multi-select OR logic. Show a live count with `aria-live="polite"`.
- Original numbering is always preserved.
- Empty state: "Nothing matches — clear a filter."

---

## 7. Maps

- **Library:** Leaflet, copied from `space/boston/vendor/leaflet/` into `soul/travel/vendor/leaflet/`. Lazy-load it when the map scrolls into view or a chapter opens. Follow the Boston fallback pattern: if tiles fail, markers and links still work.
- **Tiles:** use a dark basemap that sits on the dusk palette, such as CARTO `dark_all` or `dark_nolabels`, with the required attribution, and fall back to OSM standard tiles. Confirm the provider's terms for a personal site. Never strip attribution.
- **Overview map:** ten star-shaped pins at each destination's primary point, plus Austin. Arcs from AUS are great-circle curves labeled "direction from Austin — not a flight route". Geocode AUS itself; it isn't in `pins.json`.
- **Destination map:** every pin for that destination from `pins.json`, styled by `kind` (airport, trailhead, viewpoint, lodging, culture, town, observatory).
- **Pin confidence:** pins marked `approximate` or `unresolved` in `pins.json` must be fixed or hidden before launch. There are 7 of them, listed in §16.
- **Trail lines:** fetch real trail geometry from the OpenStreetMap Overpass API **once, at build time**. Store it as static `data/trails.geojson`, with OSM way and relation IDs and a retrieval date. Draw a hike's line only when an OSM route clearly matches the hike name. Otherwise show the trailhead pin and a "View official trail map ↗" link. Label every line "Route: © OpenStreetMap contributors — verify with the park". Known starting point: Echo Canyon Trail is OSM `way/182115793`.
- **Mini locators** on index cards are static inline SVGs (country/region outline plus a dot), not live maps, for performance.

---

## 8. Favorites and votes (cookie)

**Behavior**

- **Favorite:** a toggleable star on every card and chapter.
- **Vote:** a three-way choice, "Yes", "Maybe", or "Pass", on every card. Selecting the active option again clears it. These labels are the default; Max may rename them.
- State is visible instantly, survives reloads, and is reflected in My sky and in a "★ only" filter.

**Storage**

- **Cookie:** `nr_ec`, first-party, `Path=/soul/travel`, `SameSite=Lax`, `Secure`, `Max-Age=34560000` (400 days, the browser cap).
- **Value:** a base64url-encoded JSON object, `{"v":1,"fav":["bisbee-kartchner",…],"vote":{"bisbee-kartchner":"yes",…},"t":<unix>}`. That's well under 4 KB.
- If cookies are blocked, keep state in memory and show a quiet note: "Your picks will reset when you leave — this browser is blocking cookies."
- **Copy on the page:** "Your stars and votes live only in this browser. Nothing is sent anywhere." Add a "Reset my picks" control.

**Phase 2 (only if Max asks):** aggregate tallies through a tiny PHP endpoint on Dreamhost, like `space/boston`.

- It would store anonymous counts in a JSON file outside the web root.
- Add per-IP rate limiting.
- No personal data.
- Show public counts only above a minimum threshold.

The cookie format above is already readable by PHP, so Phase 2 needs no client migration.

---

## 9. Data model

`soul/travel/data/destinations.json`. This extends Shims' type.

```ts
type Destination = {
  id: string; number: number; title: string; place: string;
  group: 'weekend' | 'extended';
  themes: Theme[];                       // drives filter chips
  earthCosmos: number;                   // 0 = earth, 1 = cosmos (lens control)
  preferredMonth: string;                // "2026-11"
  bestWeatherMonths: string[];           // ["Mar","Nov"]
  tripDays: string;                      // "2 nights" | "4 days" | "6 days"
  weekendFit: 'green' | 'amber' | 'red' | 'green-amber' | 'not-applicable';
  weekendFitNote: string;                // one honest sentence
  flightGateway: string; groundTransfer: string; logisticsNote: string;
  why: string;                           // "why it matters", 2–3 sentences
  photos: string[];                      // ids from photos.json; [0] is the hero
  pins: string;                          // key into pins.json
  hikes: { name: string; distance: string; difficulty: string; duration?: string;
           caveat?: string; kind: 'hike'|'walk'|'tour'|'paddle';
           osmId?: string; officialMapUrl?: string }[];
  lodging: { type: string; examples: string[]; verificationRequired: true };
  culture: string[];
  itinerary: { day: string; plan: string }[];
  cautions: string[];
  sources: { label: string; url: string }[];
  verifiedOn?: string;                   // ISO date of last fact check
};
type Theme = 'caves'|'steam-train'|'alpine'|'cosmos'|'birding'|'volcanoes'|'aurora'|'island'|'culture';
```

Photos and pins live in their own files (`photos.json`, `pins.json`) keyed by destination id. Don't duplicate them into `destinations.json`.

---

## 10. Destination content

Distances are approximate. The target is 2–6 mile moderate walks, not technical climbing. Verify every trail on current official pages before launch.

### 10.1 #01 The Hidden World: Bisbee + Kartchner Caverns, Arizona
`bisbee-kartchner` · weekend · themes: caves, culture · earthCosmos 0.1 · preferred Nov 2026 · best Mar, Nov · **AMBER**

- **Why:** A quirky historic mining town above one of America's carefully protected living caves.
- **Hikes**
  - Guindani Trail: ~4.2 mi loop, moderate.
  - Foothills Loop: ~2.5 mi, easy–moderate.
  - Rotunda/Throne cave tour: ~0.5 mi, ~90 min total. It's a guided tour, not a wilderness hike.
  - Chiricahua Echo Canyon Loop: ~3.3 mi, moderate. It's a separate, substantial drive, not a quick add-on.
- **Stay:** The historic Copper Queen Hotel, a Victorian inn, or a hillside casita.
- **Culture:** Queen Mine Tour, galleries, antiques, Southwestern cafés.
- **Logistics:** AUS→TUS usually connects. Rental car, ~1–2 h to the area.
- **Itinerary**
  - Fri: Cave tour if arrival time and the reservation allow; dinner in Bisbee.
  - Sat: Guindani hike, mine tour, downtown wandering.
  - Sun: Breakfast, then back to Tucson.
- **Fit note:** Flight arrival and cave reservations decide the itinerary. Move the cave to Saturday if necessary.
- **Sources:** azstateparks.com/kartchner · discoverbisbee.com

### 10.2 #02 The Iron Horse: Durango + Silverton, Colorado
`durango-silverton` · weekend · themes: steam-train, alpine · earthCosmos 0.2 · preferred Sep 2027 · best Jul–Sep · **AMBER**

- **Why:** A historic steam locomotive winding through the Animas Canyon into the San Juans.
- **Hikes**
  - Animas River Trail: choose 2–4 mi, easy.
  - Colorado Trail from Junction Creek: 2–5 mi, moderate.
  - Andrews Lake area: alpine scenery.
  - The full-day rail excursion leaves no room for a substantial Saturday hike.
- **Stay:** The Strater Hotel, a riverside cabin, or a downtown Victorian inn.
- **Culture:** The railway museum, Main Avenue, Silverton's historic streets during the layover.
- **Logistics:** AUS→DRO usually connects.
- **Itinerary**
  - Fri: River walk and dinner.
  - Sat: Full-day train round trip.
  - Sun: Short walk, breakfast, fly home.
- **Fit note:** Prioritize the train departure and the return flight. Thursday–Sunday or Friday–Monday makes the hiking worthwhile. Verify steam vs. diesel service, the seasonal schedule, and track access.
- **Source:** durangotrain.com

### 10.3 #03 The Mountain Calls: Seattle + Mount Rainier, Washington
`seattle-rainier` · weekend · themes: alpine, culture · earthCosmos 0.2 · preferred Aug 2027 · best Aug–early Sep · **GREEN/AMBER**

- **Why:** Friday pop culture in Seattle, then Saturday on a glacier-covered mountain.
- **Hikes**
  - Nisqually Vista: ~1.2 mi loop, easy.
  - Myrtle Falls via Skyline: ~1 mi.
  - Bench & Snow Lakes: ~2.5 mi, moderate, when snow-free.
  - Skyline toward Panorama Point: an optional, harder alternative.
- **Stay:** A cedar cabin near Ashford, the National Park Inn, or a mountain lodge.
- **Culture:** MoPOP, Seattle Center, coffee, and the Tacoma Museum of Glass if there's time.
- **Logistics:** An early AUS→SEA nonstop if one exists that day. It's a ~2.5–3 h drive to Ashford.
- **Itinerary**
  - Fri: MoPOP for 2–3 h, then drive to Ashford.
  - Sat: Early hike at Paradise, lakes and overlooks.
  - Sun: Short walk, late flight.
- **Fit note:** Workable with an early arrival and a late return. Summer weekend crowds and road access are the variables. Verify the 2027 park entry rules.
- **Source:** nps.gov/mora

### 10.4 #04 A Night Among the Stars: Fort Davis + McDonald Observatory, Texas
`fort-davis-mcdonald` · weekend · themes: cosmos, alpine · earthCosmos 0.9 · preferred Apr 2027 · best Mar–Apr, Oct–Nov · **AMBER**

- **Why:** Research telescopes under immense West Texas skies.
- **Hikes**
  - Indian Lodge Trail: ~1.5 mi, with climbing.
  - Skyline Drive trail segments: ~2–4 mi.
  - Fort Davis NHS overlook paths: ~1–3 mi.
  - Confirm the exact routes before publishing.
- **Stay:** Indian Lodge (reopened May 2025 after renovation; verify availability), a ranch cottage, or an adobe casita.
- **Culture:** Fort Davis National Historic Site and local cafés.
- **Logistics:** Drive ~7–8 h from Austin, or fly AUS→MAF and drive ~2.5–3 h.
- **Itinerary**
  - Fri: Travel.
  - Sat: Mountain hike, downtime, a prebooked Star Party.
  - Sun: Home.
- **Fit note:** It's a long transfer both ways, and 3 nights is better. Book the observatory event *before* lodging, ideally near a new moon. Cloud cover affects observing.
- **Source:** mcdonaldobservatory.org/visit/tickets

### 10.5 #05 The Mountain Observatory: Mont-Mégantic, Québec
`mont-megantic` · weekend · themes: cosmos, alpine · earthCosmos 0.85 · preferred Jul 2027 · best Jul–Sep · **RED, 4 days**

- **Why:** A forested Québec mountain crowned by a working astronomical observatory, inside an International Dark Sky Reserve.
- **Hikes**
  - A 2–5 mi moderate forest/summit-sector route chosen from current Sépaq maps. Summit climbs can have significant elevation gain, so don't label one easy without the trail profile.
  - Pair it with a shorter interpretive walk.
- **Stay:** A Sépaq chalet, a small auberge, or a rustic cabin.
- **Culture:** Eastern Townships villages and Québec food.
- **Logistics:** AUS→YUL (likely a connection), then ~3 h by car.
- **Itinerary**
  - Fri: Travel.
  - Sat: Hiking and an astronomy evening.
  - Sun: ASTROLab and the observatory.
  - Mon: Return.
- **Fit note:** Not a Friday–Sunday trip; plan four days minimum. Public tours are primarily in French, with limited English. The Popular Observatory evening is listed as returning in summer 2027, so confirm the program.
- **Sources:** astrolab.qc.ca (daily visits; Popular Observatory evening)

### 10.6 #06 Islands at the End of the Road: Lower Florida Keys
`lower-florida-keys` · weekend · themes: birding, island · earthCosmos 0.15 · preferred Jan 2027 · best Jan–Feb · **AMBER**

- **Why:** Mangroves, pine rockland, Key deer, birds, and turquoise water.
- **Walks and paddles**
  - Watson Trail: ~0.7 mi loop.
  - Upper Sugarloaf Trail: ~3 mi out-and-back.
  - Blue Hole observation area: a short walk.
  - Guided mangrove kayak: ~2–3 h.
  - This is ecology and paddling, not elevation hiking.
- **Stay:** A waterfront cottage, an independent island inn, or state-park camping where available.
- **Culture:** Key West galleries, seafood, Overseas Railroad history, sunset.
- **Logistics:** AUS→EYW usually connects, then ~45–60 min by car to Big Pine.
- **Itinerary**
  - Fri: Travel.
  - Sat: Refuge walks, kayak, Bahia Honda.
  - Sun: Sunrise birding, then fly home.
- **Fit note:** EYW connection timing matters. Flying into Miami adds ~3–4 h of driving and weakens a two-night trip.
- **Source:** fws.gov/refuge/national-key-deer/visit-us/trails

### 10.7 #07 Into the Living Rainforest: Rincón de la Vieja, Costa Rica
`rincon-guanacaste` · weekend · themes: volcanoes, birding · earthCosmos 0.1 · preferred Mar 2027 · best Feb–Mar · **RED, 3–4 nights**

- **Why:** Fumaroles, volcanic mud pots, tropical birds, and hot springs in dry forest.
- **Hikes**
  - Las Pailas circuit: 3 km, ~2 h, accessible to moderate.
  - Santa María sector forest and hummingbird trails: moderate.
  - Longer waterfall hikes are optional and can be strenuous.
  - A guided early-morning birding walk is strongly recommended.
- **Stay:** Hacienda Guachipelín, a forest eco-bungalow, or a rustic thermal-spring lodge.
- **Culture:** Guanacaste food and hacienda heritage.
- **Logistics:** AUS→LIR is a connection in the preferred dry season, then a lodge transfer of ~45–90 min. **The Southwest AUS–LIR nonstop runs only on Saturdays and Sundays, June 3 – August 2, 2027.** It doesn't help a March trip or a Friday departure, and June isn't peak dry season.
- **Itinerary**
  - Fri: Travel.
  - Sat: Las Pailas, birding, hot springs.
  - Sun: A limited morning before the international airport buffer.
- **Fit note:** Not a satisfying Friday–Sunday trip; 3–4 nights is strongly recommended. Las Pailas and Santa María open on different days, so verify both. Summit/crater access has been restricted in recent years. Verify it before writing any summit copy.
- **Sources:** flyaustin.com (Oct 2, 2026 Southwest release) · sinac.go.cr

### 10.8 #08 Under the Northern Lights: Iceland South Coast
`iceland-south-coast` · extended · themes: aurora, volcanoes · earthCosmos 0.75 · preferred Oct 2027 · best Sep–Oct · **6 days**

- **Why:** Aurora attempts above a black volcanic coast, with waterfalls, basalt, and glaciers.
- **Hikes**
  - Reykjadalur geothermal valley: ~5 mi round trip, moderate, weather-dependent.
  - Skógafoss stairs plus part of the Waterfall Way: 2–5 mi, steep start.
  - Skaftafell to Svartifoss: ~2 mi round trip, moderate.
  - Glacier walking requires a professional guide.
- **Stay:** A turf-roof-inspired cottage, a farm guesthouse, or a cabin away from city lights.
- **Culture:** Reykjavík museums, geothermal bathing, seafood, design.
- **Itinerary**
  1. AUS→KEF via a hub (an overnight flight may shift the arrival).
  2. Reykjavík and a soak.
  3. South Coast waterfalls and a short hike.
  4. Black-sand beach and glacier-area trails.
  5. Flexible weather day and an aurora attempt.
  6. Return.
- **Fit note:** Allow several evenings for the aurora and never guarantee it. Early October balances darker nights against hiking access. Storms and short days are real.
- **Source:** visiticeland.com

### 10.9 #09 The Lake of Volcanoes: Lake Atitlán + Antigua, Guatemala
`atitlan-antigua` · extended · themes: volcanoes, culture, birding · earthCosmos 0.2 · preferred Feb 2027 · best Jan–Feb · **5–6 days**

- **Why:** A vast lake ringed by volcanoes and Maya communities.
- **Hikes**
  - Indian Nose sunrise: ~2–3 mi, guided, early start, steep sections.
  - Lakeside village footpaths.
  - Cerro Tzankujil nature trails.
  - Guided coffee-farm and birding walks.
  - Don't recommend unescorted remote village-to-village trails without checking current local conditions.
- **Stay:** A lakeside eco-lodge, a boat-access boutique inn, or a courtyard hotel in Antigua.
- **Culture:** Maya weaving cooperatives, markets, coffee farms, Antigua architecture and food.
- **Itinerary**
  1. AUS→GUA, then a transfer to Antigua or the lake.
  2. Lake villages.
  3. A guided hike.
  4. A relaxation or boat day.
  5. Antigua culture and cafés.
  6. Return.
- **Fit note:** The road transfer to the lake is often ~3–4+ h. The Jan–Feb dry season usually gives clearer volcano views.
- **Source:** visitguatemala.gt. Verify tour operators independently.

### 10.10 #10 Somewhere Beyond the Horizon: São Miguel, Azores
`sao-miguel-azores` · extended · themes: island, volcanoes, culture · earthCosmos 0.35 · **preferred Nov 2027** · best May–Sep · **6 days**

- **Why:** Green volcanic crater lakes, mist, thermal water, and Atlantic cliffs.
- **Hikes**
  - Vista do Rei → Sete Cidades official linear trail: ~7.5 km, 2–3 h, moderate.
  - Lagoa das Furnas loop: ~9.4 km, ~3 h, easy–moderate.
  - Serra Devassa updated route: ~9.1 km, ~3.5 h, moderate. **Don't use the outdated 4.9 km figure.**
  - Shorter scenic walks if rain or wind makes the ridgelines unpleasant.
  - Verify closures and the transport back from the linear trails.
- **Stay:** A restored stone cottage, a rural eco-lodge, a Furnas thermal hotel, or an ocean-view guesthouse.
- **Culture:** Cozido cooked in volcanic heat, pineapple plantations, tea estates, Ponta Delgada's historic center, thermal bathing.
- **Itinerary**
  1. AUS→PDL via the US East Coast or Lisbon (an overnight routing may consume a day).
  2. Sete Cidades if the weather clears.
  3. Serra Devassa and Lagoa do Fogo.
  4. Furnas lake hike and a thermal bath.
  5. Island culture and flexible rain-day plans.
  6. Return.
- **Fit note:** An inefficient flight itinerary may make 6 nights / 7 calendar days materially better.
- **Timing copy (neutral):** November is a scheduling preference around holiday time off, not a weather claim. It's cooler, wetter, and windier, with shorter days and fewer crowds. Never promise clear crater views.
- **Sources:** trails.visitazores.com (directory; Serra Devassa listing) · parquesnaturais.azores.gov.pt

### 10.11 Lodging stance (all destinations)

Most trips are base-lodge hiking, which is deliberate. Cabins, historic inns, eco-lodges, and small guesthouses are the primary lodging experience. Camping is only ever an optional variant. No specific room is claimed to be available.

### 10.12 Sidebar: Future trail journeys

Genuine hut-to-hut itineraries would be a separate 4–7 day category. These ten emphasize accessible day hikes and memorable overnight bases. Never label an adjacent hotel as hut-to-hut.

---

## 11. Calendar and the strict-weekend view

### 11.1 Season calendar (chronological; it ends on the Azores)

| Season | Month | Destination | Rationale / crowds |
|---|---|---|---|
| Fall 2026 | Nov 2026 | Bisbee + Kartchner | Pleasant desert weather. Avoid Thanksgiving and town event weekends. |
| Winter 2026–27 | Jan 2027 | Lower Florida Keys | Comfortable temperatures. Avoid the New Year rush and February holiday peaks. |
| Winter 2026–27 | Feb 2027 | Lake Atitlán + Antigua | Dry-season hiking and volcano views. Avoid major holidays. |
| Spring 2027 | Mar 2027 | Costa Rica | Drier volcanic trails. Easter week 2027 falls late March, so avoid it. |
| Spring 2027 | Apr 2027 | Fort Davis / McDonald | Mild mountain hiking. Pick clear, dark-sky Star Party dates. |
| Summer 2027 | Jul 2027 | Mont-Mégantic | Public astronomy season and forest trails. Plan **4 days**. |
| Summer 2027 | Aug 2027 | Seattle + Rainier | High-country access. Arrive at trailheads early. |
| Fall 2027 | Sep 2027 | Durango + Silverton | Alpine hiking and rail before peak fall-color demand. |
| Fall 2027 | Oct 2027 | Iceland South Coast | Aurora darkness with some hiking. Storms possible. |
| Late fall 2027 | **Nov 2027** | **Azores (finale)** | Holiday leave efficiency, fewer crowds. Wetter than the ideal hiking season. |

The open months are **Dec 2026, May 2027, and Jun 2027.** Show them as buffers, not as missing trips. Caption the calendar: "An aspirational menu, not an expectation of ten trips in thirteen months."

### 11.2 Strict Friday–Sunday reality swaps (ghost cards, clearly labeled)

- **For #05 Mont-Mégantic:** Kitt Peak + Saguaro National Park, Arizona (AUS→TUS, still connection-sensitive). It keeps the mountaintop-astronomy theme. Public programs need verification.
- **For #07 Costa Rica:** Craters of the Moon, Idaho, only if Idaho Falls flights and rental timing work. It's still AMBER, not GREEN. Otherwise, White Sands, New Mexico via El Paso.
- **#04 Fort Davis note:** for a truly short dark-sky weekend, consider Enchanted Rock State Natural Area plus a Fredericksburg cabin. It's less dramatic than McDonald Observatory and far more realistic.
- **#02 Durango** stays because the steam train is the point, but 3 nights is ideal.
- **#06 Keys** stays for biodiversity, explicitly not for strenuous hiking.

Swap cards get no photos until they're sourced and licensed the same way as the originals. Show a typographic placeholder in the meantime.

**Operational rule (shown in reality mode):** Prefer flights that land by early afternoon Friday and leave after late afternoon Sunday. Allow time for check-in, the rental car, traffic, park gates, time zones, and international buffers.

---

## 12. Photography

### 12.1 What's provided

`photos.json` contains **61 photographs**: 6 per destination, plus 7 for the Azores finale. Iris picked each one visually from Wikimedia Commons contact sheets, preferring Commons Quality/Featured images. Every one is CC0, CC BY, CC BY-SA, or public domain. **No NC/ND licenses.** Each entry has:

- `id`, `role` (hero / hike / landscape / culture / lodging / wildlife / observatory / geology / cosmos / town)
- `alt` (written, ready to use)
- `commonsPage`, `download` (`Special:FilePath?width=2400`), `original`
- `width`, `height`, `orientation`
- `author`, `license`, `licenseUrl`, `credit`, and a target `localPath`

Photo `[0]` in each destination is the hero/card image.

### 12.2 Pipeline (Claude Code, build time, local)

1. Download each `download` URL. Send a descriptive User-Agent with a contact address, per Wikimedia policy, and throttle to ~1 request/second.
2. Generate AVIF + WebP + JPEG fallbacks at 480, 960, 1600, and 2400 px widths. Panoramas (the Azores hero, Molas Pass) also get 3200 px. Strip EXIF GPS. Write the files to `soul/travel/img/<destination>/<id>-<width>.<ext>`.
3. Use `<picture>` with `srcset`/`sizes`, explicit `width`/`height` to prevent layout shift, `loading="lazy"` everywhere except the hero, and `fetchpriority="high"` on the page hero.
4. Crops are art direction, not edits. Set `object-position` per image in data. No color grading beyond a subtle uniform overlay for text legibility.
5. **Credits:** a small "© Author · License ↗" on hover/focus over each image and always visible in the chapter filmstrip, plus a full credits section. CC BY-SA images resized or cropped stay CC BY-SA.
6. Before launch, re-open each `commonsPage` and confirm the license hasn't changed.

### 12.3 Known soft spots

- The **Mont-Mégantic** hero (`mont-megantic-01`) is 2080 px wide. It's fine for cards but soft full-bleed. Use `mont-megantic-04` (the Belvédère view) for full-bleed chapter headers.
- **Lagoa do Fogo** (`sao-miguel-azores-02`) is 1920 px wide, so keep it at card or filmstrip size.
- **Kartchner** has very little licensable in-cave photography, and `bisbee-kartchner-01` is the best available. Arizona State Parks' own imagery needs permission before use.
- **Atitlán** has no strong weaving-cooperative image yet. If Max wants one, source it under the same rules.

---

## 13. Technical architecture and repo integration

```
soul/travel/
  index.html            # complete, readable content without JS
  travel.css            # imports /css/tokens/*; --ec-* additions only
  travel.js             # single IIFE, vanilla: filters, lens, toggle, chapters, cookie, map loader
  data/destinations.json  data/photos.json  data/pins.json  data/trails.geojson
  img/<destination>/…   # generated derivatives
  vendor/leaflet/       # copied from space/boston/vendor/leaflet
  _tools/               # build scripts: images, overpass, html generator (not deployed)
  _brief/               # this brief + manifests (not deployed)
```

- **No-JS readability.** The repo has no runtime build, so generate the full static `index.html` from the JSON with a small Node script in `_tools/`, and commit its output. JavaScript enhances from there. Content stays readable and printable with JS off, like the Boston precedent.
- **Eleventy.** If Eleventy is in the deploy path, add passthrough for `soul/travel` and ignores for `soul/travel/_tools/**` and `_brief/**`. If it isn't, make sure `_tools` and `_brief` don't deploy (`.htaccess` deny, or keep them out of the deploy tree).
- **Homepage hook (needs Max's OK).** Add "Earth & Cosmos" to the SOUL `cards` array and `CARD_HREFS` in `js/main.js`, following the `'Boston Begins': '/space/boston/'` pattern. Check the 4-card layout at desktop width and at the 700 px breakpoint.
- **Meta.** Set the title "Earth & Cosmos — nano};{ranch", an OG image derived from the hero with credit in the credits section, and the canonical URL `https://nanoranch.org/soul/travel/`.
- **Deploy.** Follow the `CLAUDE.md` deploy procedure, then verify: `curl -s https://nanoranch.org/soul/travel/ | grep -o '<title>[^<]*'`.

---

## 14. Accessibility and performance

- Use WCAG 2.2 AA throughout:
  - the gold focus ring everywhere (offset 3px, 8px inside cards)
  - small text at `--text-dim` or brighter
  - targets ≥ 44px
- Cards are `<article>`s with a real `<button aria-expanded>` that opens the chapter. Chapters get `role="region"` with a label. Move focus to the chapter heading on open, and return it on close. Esc closes the chapter.
- Toggles and filters are real `<button aria-pressed>`. The vote control is a radio group with clear labels ("Vote: Yes / Maybe / Pass for The Hidden World"). The favorite control's label says "Add The Hidden World to my sky".
- Weekend-fit badges carry text plus a shape, never color alone.
- The map has a keyboard-reachable list equivalent beneath it, with the same pins as links. Map pan and zoom don't trap focus.
- Filmstrips scroll with the arrow keys and snap. Every image has its `alt` from `photos.json`.
- `prefers-reduced-motion`: no hero crossfade and no horizon animation. The canvas jumps to its final per-section state, using the global token rule.
- **Budgets:** LCP < 2.5 s on 4G mid-range Android, CLS < 0.05, JS < 60 KB gz excluding Leaflet. Leaflet and tiles load lazily. No web fonts beyond the existing Google Fonts import.
- Test real devices: iPhone Safari and an Android Chrome phone, plus a desktop browser.

---

## 15. Build phases and acceptance gates

At every gate, Max verifies on his phone. Claude Code's reports are claims, not confirmations.

1. **Foundation.**
   - Pipeline confirmed, branch created.
   - `destinations.json` filled from §10.
   - Image pipeline run, and the static `index.html` generated with hero and index.
   - *Gate:* the page loads on a phone, tokens are visibly the nanoranch ones, the photos and credits render, and it reads with JS off.
2. **Chapters and filters.**
   - Expand-to-chapter, filmstrip, hikes, itinerary, filters, and the dream/reality toggle with ghost swaps.
   - *Gate:* keyboard-only run-through, RED/AMBER honesty intact, numbering preserved.
3. **Maps.**
   - Overview and destination maps, Overpass trail lines only where matched, and approximate pins fixed or hidden.
   - *Gate:* every pin is spot-checked against the official park map. Iris can do a second-pass review here.
4. **Delight.**
   - Horizon descent and ascent, the Earth ↔ Cosmos lens, My sky, favorites and votes, share link, new-moon markers.
   - *Gate:* the cookie survives a reload, reset works, the blocked-cookie path works, and reduced motion is verified.
5. **Integration and launch.**
   - Homepage SOUL card, meta/OG, credits page, the §16 checklist, draft PR.
   - *Gate:* real-device QA, then Max merges and deploys, and the curl check passes.

---

## 16. Pre-launch verification checklist

**Fix these 7 pins in `pins.json`**

- Queen Mine Tour: currently matched to the adjacent RV park.
- Echo Canyon trailhead parking: currently a point on the trail.
- Animas River Trail access point.
- Watson Trail trailhead.
- Upper Sugarloaf trailhead.
- Las Pailas ranger station: currently a road point.
- Santa María sector: unresolved.
- Also geocode AUS.

**Verify on current official pages**

- [ ] All trail lengths and difficulties, especially the Serra Devassa figure of 9.1 km, not 4.9.
- [ ] Operating seasons and reservations:
  - Kartchner tours
  - D&SNGRR steam vs. diesel, and the schedule
  - McDonald Star Parties
  - ASTROLab / Popular Observatory evening for 2027
  - Rincón sector open days and summit access
  - Mount Rainier 2027 entry rules
- [ ] Flight patterns by exact Friday/Sunday dates. Don't publish sample times.
- [ ] Lodging properties exist and are open. Don't claim availability.
- [ ] Every photo license re-confirmed on Commons, and credits complete.
- [ ] Map tile provider terms and attribution.
- [ ] Mobile layouts, accessibility audit, real-device QA.
- [ ] No personal subtext anywhere in copy, alt text, comments, or commit messages.
- [ ] Set `verifiedOn` for each destination.

---

## 17. Sources

**Trips and logistics**

- Austin–Bergstrom: Southwest nonstop international announcement (Oct 2, 2026) — https://www.flyaustin.com/news/southwest-airlines-announces-nonstop-international-destinations-austin-bergstrom-international
- Indian Lodge reopening (May 2025) — https://bigbendsentinel.com/2025/05/14/newly-improved-indian-lodge-and-blackbear-restaurant-reopen-to-the-public/
- Kartchner Caverns — https://azstateparks.com/kartchner/ · Bisbee — https://www.discoverbisbee.com/
- Durango & Silverton — https://www.durangotrain.com/
- Mount Rainier — https://www.nps.gov/mora/
- McDonald Observatory tickets — https://mcdonaldobservatory.org/visit/tickets/
- ASTROLab — https://www.astrolab.qc.ca/en/activity/daily-visits-astrolab-observatory/ · https://www.astrolab.qc.ca/en/activity/popular-observatory-evening/
- Key Deer Refuge trails — https://www.fws.gov/refuge/national-key-deer/visit-us/trails
- Rincón de la Vieja (SINAC) — https://sinac.go.cr/ES/ac/acg/pnrv/Paginas/default.aspx
- Visit Iceland — https://www.visiticeland.com/
- Visit Guatemala — https://visitguatemala.gt/
- Azores trails — https://trails.visitazores.com/en/find-a-trail · https://trails.visitazores.com/en/trails-azores/sao-miguel/serra-devassa · https://parquesnaturais.azores.gov.pt/en/parques/9/trilhos

**Data**

- Photographs: Wikimedia Commons (per-image credits in `photos.json`)
- Geocoding: OpenStreetMap Nominatim, © OpenStreetMap contributors, ODbL

*The emotional arc is expanding horizons. A good travel journal leaves a little room for what might happen next.*
