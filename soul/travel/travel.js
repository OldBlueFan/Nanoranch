/* Earth & Cosmos — travel.js
   Vanilla, single IIFE. Fetches the three data files and renders the index,
   chapters, map, calendar, picks and credits. Content comes from data/*.json as-is. */
(function () {
    'use strict';

    var BASE = new URL('.', document.currentScript.src).href;
    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var COOKIE = 'nr_ec';
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var SHOWN_PIN = { 'verified': true, 'verified-centroid': true };
    var KIND_LABELS = { tour: 'Tour', walk: 'Walk', paddle: 'Paddle' };

    var data = {};          // destinations.json
    var photos = {};        // id → [photo]
    var photoById = {};     // photo id → photo
    var pins = {};          // destination id → [pin]
    var byId = {};          // destination id → destination
    var activeThemes = {};  // theme key → true
    var starOnly = false;
    var openId = null;
    var openedByUs = false; // whether we pushed the current #d- history entry
    var state = { v: 1, fav: [], vote: {}, t: 0 };
    var cookiesWork = true;

    var $ = function (id) { return document.getElementById(id); };

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function pad2(n) { return (n < 10 ? '0' : '') + n; }

    function monthLabel(ym) {
        var p = String(ym).split('-');
        return MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
    }

    function sized(url, width) { return url.replace(/([?&]width=)\d+/, '$1' + width); }

    /* External link: 11px arrow + "(opens in new window)" label */
    function ext(url, text, cls) {
        return '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' +
            ' aria-label="' + esc(text) + ' (opens in new window)">' + esc(text) +
            '<span class="ec-ext-arrow" aria-hidden="true"></span></a>';
    }

    function shownPins(id) {
        return (pins[id] || []).filter(function (p) { return SHOWN_PIN[p.confidence]; });
    }

    /* ── Stars (seeded LCG, seed 42 — homepage recipe, lighter field) ────── */

    function lcg(seed) {
        var s = seed >>> 0;
        return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function buildStars() {
        var rnd = lcg(42);
        var html = '';
        for (var i = 0; i < 90; i++) {
            var big = rnd() < 0.12;
            var size = big ? 2.4 + rnd() * 1.4 : 0.8 + rnd() * 1.4;
            var left = (rnd() * 100).toFixed(2);
            var top = (rnd() * 100).toFixed(2);
            var alpha = (0.35 + rnd() * 0.65).toFixed(2);
            var dur = (2.5 + rnd() * 4.5).toFixed(1);
            var delay = (rnd() * 6).toFixed(1);
            html += '<span class="ec-star" style="left:' + left + '%;top:' + top + '%;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;background:rgba(255,250,240,' + alpha + ');' +
                (big ? 'box-shadow:0 0 6px 1px rgba(255,248,230,.5);' : 'box-shadow:none;') +
                'animation:nrTwinkle ' + dur + 's ease-in-out ' + delay + 's infinite"></span>';
        }
        document.querySelector('.ec-stars').innerHTML = html;
    }

    /* ── Picks: cookie "nr_ec" (brief §8) ────────────────────────────────── */

    function b64urlEncode(str) {
        return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function b64urlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return decodeURIComponent(escape(atob(str)));
    }

    function readCookie() {
        var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'));
        return m ? m[1] : null;
    }

    function loadPicks() {
        var raw = readCookie();
        if (!raw) return;
        try {
            var obj = JSON.parse(b64urlDecode(raw));
            if (obj && obj.v === 1) {
                state.fav = Array.isArray(obj.fav) ? obj.fav.filter(function (id) { return byId[id]; }) : [];
                state.vote = {};
                Object.keys(obj.vote || {}).forEach(function (id) {
                    if (byId[id] && /^(yes|maybe|pass)$/.test(obj.vote[id])) state.vote[id] = obj.vote[id];
                });
                state.t = obj.t || 0;
            }
        } catch (e) { /* unreadable cookie: start fresh */ }
    }

    function savePicks() {
        state.t = Math.floor(Date.now() / 1000);
        var value = b64urlEncode(JSON.stringify(state));
        try {
            document.cookie = COOKIE + '=' + value + '; Path=/soul/travel; SameSite=Lax; Secure; Max-Age=34560000';
        } catch (e) { /* blocked */ }
        cookiesWork = readCookie() === value;
        $('ec-cookie-warn').hidden = cookiesWork;
    }

    function isFav(id) { return state.fav.indexOf(id) !== -1; }

    function toggleFav(id) {
        if (isFav(id)) state.fav = state.fav.filter(function (x) { return x !== id; });
        else state.fav.push(id);
        savePicks();
        syncPicks(id);
        if (starOnly) applyFilters();
    }

    function setVote(id, choice) {
        if (state.vote[id] === choice) delete state.vote[id];
        else state.vote[id] = choice;
        savePicks();
        syncPicks(id);
    }

    function syncPicks(id) {
        var card = $('d-' + id);
        if (!card) return;
        var fav = isFav(id);
        var star = card.querySelector('.ec-star-btn');
        star.setAttribute('aria-pressed', String(fav));
        star.querySelector('.ec-star-btn__glyph').textContent = fav ? '★' : '☆';
        Array.prototype.forEach.call(card.querySelectorAll('.ec-vote__btn'), function (b) {
            b.setAttribute('aria-pressed', String(state.vote[id] === b.dataset.vote));
        });
    }

    function resetPicks() {
        state.fav = [];
        state.vote = {};
        try {
            document.cookie = COOKIE + '=; Path=/soul/travel; SameSite=Lax; Secure; Max-Age=0';
        } catch (e) { /* blocked */ }
        data.destinations.forEach(function (d) { syncPicks(d.id); });
        applyFilters();
    }

    /* ── Cards & chapters ────────────────────────────────────────────────── */

    function fitBadge(d) {
        return '<p class="ec-fit ec-fit--' + esc(d.weekendFit) + '"><span class="ec-fit__shape" aria-hidden="true"></span>' +
            esc(data.fitLabels[d.weekendFit]) + '</p>';
    }

    function cardHTML(d) {
        var num = pad2(d.number);
        var hero = photoById[d.photos[0]];
        var title = esc(d.title);
        return '<article class="ec-card" id="d-' + esc(d.id) + '" data-id="' + esc(d.id) + '">' +
            '<div class="ec-card__img-wrap">' +
                '<img src="' + esc(sized(hero.download, 800)) + '" alt="' + esc(hero.alt) + '" width="' + hero.width + '" height="' + hero.height + '" loading="lazy" decoding="async">' +
                '<span class="ec-card__number" aria-hidden="true">' + num + '</span>' +
            '</div>' +
            '<div class="ec-card__body">' +
                '<h3 class="ec-card__title"><span class="ec-sr">' + num + ' </span>' + title + '</h3>' +
                '<p class="ec-card__place">' + esc(d.place) + '</p>' +
                '<ul class="ec-card__themes" aria-label="Themes">' + d.themes.map(function (t) {
                    return '<li class="ec-theme-chip">' + esc(data.themeLabels[t]) + '</li>';
                }).join('') + '</ul>' +
                '<p class="ec-card__months">Preferred <strong>' + esc(monthLabel(d.preferredMonth)) + '</strong> · Best weather <strong>' +
                    esc(d.bestWeatherMonths.join(', ')) + '</strong></p>' +
                fitBadge(d) +
                '<div class="ec-card__actions">' +
                    '<button type="button" class="ec-star-btn" aria-pressed="false" aria-label="Star ' + title + '">' +
                        '<span class="ec-star-btn__glyph" aria-hidden="true">☆</span></button>' +
                    '<div class="ec-vote" role="group" aria-label="Your vote for ' + title + '">' +
                        ['yes', 'maybe', 'pass'].map(function (v) {
                            return '<button type="button" class="ec-vote__btn" data-vote="' + v + '" aria-pressed="false">' +
                                v.charAt(0).toUpperCase() + v.slice(1) + '</button>';
                        }).join('') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="ec-card__expand" aria-expanded="false" aria-controls="ch-' + esc(d.id) + '">' +
                '<span class="ec-card__expand-text">Open the journey</span></button>' +
            '<div class="ec-chapter" id="ch-' + esc(d.id) + '" hidden></div>' +
        '</article>';
    }

    function section(label, body) {
        return '<section class="ec-chapter__section"><h5 class="ec-chapter__label">' + label + '</h5>' + body + '</section>';
    }

    function textList(items, cls) {
        return '<ul class="' + (cls || 'ec-chapter__list') + '">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    }

    function chapterHTML(d) {
        var html = '<div class="ec-chapter__header"><div>' +
            '<h4 class="ec-chapter__heading" tabindex="-1">' + pad2(d.number) + ' — ' + esc(d.title) + '</h4>' +
            '<p class="ec-chapter__place">' + esc(d.place) + '</p></div>' +
            (shownPins(d.id).length ? '<button type="button" class="ec-chapter__map-btn" data-map="' + esc(d.id) + '">Show on map</button>' : '') +
            '</div>';

        html += '<div class="ec-filmstrip" role="region" aria-label="Photographs of ' + esc(d.title) + '" tabindex="0">' +
            d.photos.map(function (pid) {
                var p = photoById[pid];
                return '<figure class="ec-filmstrip__item">' +
                    '<img src="' + esc(sized(p.download, 1600)) + '" alt="' + esc(p.alt) + '" width="' + p.width + '" height="' + p.height + '" loading="lazy" decoding="async">' +
                    '<figcaption class="ec-filmstrip__credit">' + esc(p.author) + ' · ' + ext(p.licenseUrl, p.license) + ' · ' + ext(p.commonsPage, 'Wikimedia Commons') + '</figcaption>' +
                '</figure>';
            }).join('') + '</div>';

        html += section('Why go', '<p class="ec-chapter__text">' + esc(d.why) + '</p>');

        html += section('Hikes', '<div class="ec-hikes">' + d.hikes.map(function (h) {
            var meta = [h.distance, h.difficulty, h.duration].filter(Boolean).map(esc).join(' · ');
            return '<div class="ec-hike">' +
                '<p class="ec-hike__name">' + esc(h.name) + (KIND_LABELS[h.kind] ? '<span class="ec-hike__kind">' + KIND_LABELS[h.kind] + '</span>' : '') + '</p>' +
                '<p class="ec-hike__meta">' + meta + '</p>' +
                (h.caveat ? '<p class="ec-hike__caveat">' + esc(h.caveat) + '</p>' : '') +
                (h.officialMapUrl ? ext(h.officialMapUrl, 'Official map', 'ec-hike__link') : '') +
            '</div>';
        }).join('') + '</div>');

        html += section('Lodging', '<p class="ec-chapter__text">' + esc(d.lodging.type) + '</p>' +
            textList(d.lodging.examples) +
            (d.lodging.verificationRequired ? '<p class="ec-chapter__text ec-hike__caveat">Examples only — verify directly before booking.</p>' : ''));

        html += section('Culture', textList(d.culture, 'ec-culture-list'));

        html += section('Getting there',
            '<p class="ec-chapter__text"><strong>Fly:</strong> ' + esc(d.flightGateway) + '</p>' +
            '<p class="ec-chapter__text"><strong>Ground:</strong> ' + esc(d.groundTransfer) + '</p>' +
            '<p class="ec-chapter__text">' + esc(d.logisticsNote) + '</p>');

        html += section('Weekend fit', fitBadge(d) +
            '<p class="ec-chapter__text"><strong>Trip length:</strong> ' + esc(d.tripDays) + '</p>' +
            '<p class="ec-chapter__text">' + esc(d.weekendFitNote) + '</p>');

        html += section('Itinerary', '<ol class="ec-itinerary">' + d.itinerary.map(function (i) {
            return '<li><span class="ec-itinerary__day">' + esc(i.day) + '</span>' + esc(i.plan) + '</li>';
        }).join('') + '</ol>');

        html += section('Cautions', textList(d.cautions, 'ec-cautions'));

        html += section('Sources', '<ul class="ec-sources">' + d.sources.map(function (s) {
            return '<li>' + ext(s.url, s.label) + '</li>';
        }).join('') + '</ul>');

        return html;
    }

    function renderCards() {
        ['weekend', 'extended'].forEach(function (group) {
            $('ec-cards-' + group).innerHTML = data.destinations
                .filter(function (d) { return d.group === group; })
                .sort(function (a, b) { return a.number - b.number; })
                .map(cardHTML).join('');
        });
        data.destinations.forEach(function (d) { syncPicks(d.id); });

        document.addEventListener('click', function (e) {
            var t = e.target.closest('button');
            if (!t) return;
            var card = t.closest('.ec-card');
            if (t.classList.contains('ec-star-btn')) toggleFav(card.dataset.id);
            else if (t.classList.contains('ec-vote__btn')) setVote(card.dataset.id, t.dataset.vote);
            else if (t.classList.contains('ec-card__expand')) {
                if (openId === card.dataset.id) closeChapter(true);
                else openChapter(card.dataset.id, true);
            } else if (t.dataset.map) showOnMap(t.dataset.map);
        });
    }

    /* ── Chapter open / close (hash #d-<id>, Esc, back button) ───────────── */

    function setOpen(id, open) {
        var card = $('d-' + id);
        if (!card) return;
        var ch = $('ch-' + id);
        if (open && !ch.innerHTML) ch.innerHTML = chapterHTML(byId[id]);
        ch.hidden = !open;
        card.classList.toggle('ec-card--open', open);
        var btn = card.querySelector('.ec-card__expand');
        btn.setAttribute('aria-expanded', String(open));
        btn.querySelector('.ec-card__expand-text').textContent = open ? 'Close the journey' : 'Open the journey';
    }

    function openChapter(id, push) {
        if (!byId[id]) return;
        if (openId && openId !== id) setOpen(openId, false);
        openId = id;
        setOpen(id, true);
        if (push) {
            history.pushState({ ec: id }, '', '#d-' + id);
            openedByUs = true;
        }
        var heading = $('ch-' + id).querySelector('.ec-chapter__heading');
        $('d-' + id).scrollIntoView({ block: 'start', behavior: REDUCED ? 'auto' : 'smooth' });
        heading.focus({ preventScroll: true });
    }

    function closeChapter(fromUser) {
        if (!openId) return;
        var id = openId;
        openId = null;
        setOpen(id, false);
        if (fromUser) {
            if (openedByUs) history.back();
            else history.replaceState(null, '', location.pathname + location.search);
        }
        openedByUs = false;
        $('d-' + id).querySelector('.ec-card__expand').focus();
    }

    function syncFromHash(e) {
        var m = location.hash.match(/^#d-(.+)$/);
        var id = m && byId[m[1]] ? m[1] : null;
        if (id && id !== openId) {
            openChapter(id, false);
            openedByUs = !!e; // an in-page link added a history entry; a cold load did not
        }
        else if (!id && openId) closeChapter(false);
    }

    /* ── Filters (multi-select OR, ★ only, numbering preserved) ──────────── */

    function renderFilters() {
        var html = Object.keys(data.themeLabels).map(function (k) {
            return '<button type="button" class="ec-chip" data-theme="' + esc(k) + '" aria-pressed="false">' + esc(data.themeLabels[k]) + '</button>';
        }).join('');
        html += '<button type="button" class="ec-chip" data-star="1" aria-pressed="false">★ only</button>';
        var wrap = $('ec-filter-chips');
        wrap.setAttribute('role', 'group');
        wrap.setAttribute('aria-label', 'Filter by theme');
        wrap.innerHTML = html;
        wrap.addEventListener('click', function (e) {
            var b = e.target.closest('.ec-chip');
            if (!b) return;
            var on = b.getAttribute('aria-pressed') !== 'true';
            b.setAttribute('aria-pressed', String(on));
            if (b.dataset.star) starOnly = on;
            else if (on) activeThemes[b.dataset.theme] = true;
            else delete activeThemes[b.dataset.theme];
            applyFilters();
        });
    }

    function applyFilters() {
        var themes = Object.keys(activeThemes);
        var shown = 0;
        var perGroup = { weekend: 0, extended: 0 };
        data.destinations.forEach(function (d) {
            var ok = (!themes.length || d.themes.some(function (t) { return activeThemes[t]; })) &&
                (!starOnly || isFav(d.id));
            $('d-' + d.id).hidden = !ok;
            if (ok) { shown++; perGroup[d.group]++; }
        });
        $('ec-section-weekend').hidden = !perGroup.weekend;
        $('ec-section-extended').hidden = !perGroup.extended;
        $('ec-filter-empty').hidden = shown > 0;
        var total = data.destinations.length;
        $('ec-filter-count').textContent = shown === total
            ? 'Showing all ' + total + ' journeys'
            : 'Showing ' + shown + ' of ' + total + ' journeys';
    }

    /* ── Map (Leaflet, lazy-loaded on scroll) ────────────────────────────── */

    var map = null;
    var markers = {};       // destination id → [marker]
    var mapReady = null;

    function loadLeaflet() {
        return new Promise(function (resolve, reject) {
            var css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = BASE + 'vendor/leaflet/leaflet.css';
            document.head.appendChild(css);
            var s = document.createElement('script');
            s.src = BASE + 'vendor/leaflet/leaflet.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function ensureMap() {
        if (mapReady) return mapReady;
        mapReady = loadLeaflet().then(function () {
            var L = window.L;
            map = L.map('ec-map', { scrollWheelZoom: false, zoomAnimation: !REDUCED, fadeAnimation: !REDUCED, markerZoomAnimation: !REDUCED });
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            }).addTo(map);
            var all = [];
            data.destinations.forEach(function (d) {
                markers[d.id] = shownPins(d.id).map(function (p) {
                    var m = L.circleMarker([p.lat, p.lon], {
                        radius: 7, weight: 2, color: '#fff', fillColor: 'rgb(240, 200, 120)', fillOpacity: 0.9
                    }).bindPopup('<strong>' + esc(p.name) + '</strong><br>' + pad2(d.number) + ' — ' + esc(d.title));
                    m.addTo(map);
                    all.push([p.lat, p.lon]);
                    return m;
                });
            });
            map.fitBounds(all, { padding: [24, 24] });
        }, function () {
            $('ec-map').innerHTML = '<p class="ec-map__placeholder">The map could not load.</p>';
            throw new Error('Leaflet failed to load');
        });
        return mapReady;
    }

    function revealMap() {
        $('ec-map').scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    }

    function showOnMap(id) {
        ensureMap().then(function () {
            revealMap();
            var pts = markers[id].map(function (m) { return m.getLatLng(); });
            var opts = { padding: [40, 40], maxZoom: 12 };
            if (REDUCED) map.fitBounds(pts, opts);
            else map.flyToBounds(pts, opts);
        });
    }

    function showPin(id, i) {
        ensureMap().then(function () {
            revealMap();
            var m = markers[id][i];
            if (REDUCED) map.setView(m.getLatLng(), 13);
            else map.flyTo(m.getLatLng(), 13);
            m.openPopup();
        });
    }

    function renderMapList() {
        var list = $('ec-map-list');
        list.innerHTML = data.destinations.map(function (d) {
            var ps = shownPins(d.id);
            if (!ps.length) return '';
            return '<div class="ec-map-list__group"><h3 class="ec-map-list__dest">' + pad2(d.number) + ' ' + esc(d.title) + '</h3>' +
                '<ul class="ec-map-list__pins">' + ps.map(function (p, i) {
                    return '<li><button type="button" data-pin="' + esc(d.id) + '" data-i="' + i + '">' + esc(p.name) +
                        ' <span class="ec-map-list__kind">(' + esc(p.kind) + ')</span></button></li>';
                }).join('') + '</ul></div>';
        }).join('');
        list.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-pin]');
            if (b) showPin(b.dataset.pin, parseInt(b.dataset.i, 10));
        });

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { io.disconnect(); ensureMap(); }
            }, { rootMargin: '300px 0px' });
            io.observe($('ec-map'));
        } else {
            ensureMap();
        }
    }

    /* ── Season calendar (chronological, ends on the Azores) ─────────────── */

    function renderCalendar() {
        var items = data.calendar.map(function (c) { return { month: c.month, c: c }; })
            .concat(data.calendarOpenMonths.map(function (m) { return { month: m, c: null }; }))
            .sort(function (a, b) { return a.month < b.month ? -1 : a.month > b.month ? 1 : 0; });
        $('ec-calendar').innerHTML = items.map(function (it) {
            var month = '<span class="ec-calendar__month">' + esc(monthLabel(it.month)) + '</span>';
            if (!it.c) {
                return '<li class="ec-calendar__item ec-calendar__item--buffer">' + month +
                    '<span class="ec-calendar__dest">Open</span></li>';
            }
            var d = byId[it.c.id];
            return '<li class="ec-calendar__item">' + month +
                '<span class="ec-calendar__dest"><a href="#d-' + esc(d.id) + '"><strong>' + esc(d.title) + '</strong></a> — ' + esc(d.place) +
                '<span class="ec-calendar__season">' + esc(it.c.season) + '</span>' +
                '<span class="ec-calendar__note">' + esc(it.c.note) + '</span></span></li>';
        }).join('');
        $('ec-calendar-caption').textContent = data.calendarCaption;
    }

    /* ── Credits ─────────────────────────────────────────────────────────── */

    function renderCredits() {
        $('ec-credits').innerHTML = data.destinations.map(function (d) {
            return '<div class="ec-credits__group"><h3 class="ec-credits__dest-name">' + pad2(d.number) + ' ' + esc(d.title) + '</h3>' +
                '<ul class="ec-credits__list">' + d.photos.map(function (pid) {
                    var p = photoById[pid];
                    return '<li>' + esc(p.commonsFile) + ' — ' + esc(p.author) + ', ' + ext(p.licenseUrl, p.license) + ', ' + ext(p.commonsPage, 'Commons page') + '</li>';
                }).join('') + '</ul></div>';
        }).join('');
    }

    /* ── Boot ────────────────────────────────────────────────────────────── */

    function getJSON(name) {
        return fetch(BASE + 'data/' + name).then(function (r) {
            if (!r.ok) throw new Error(name + ' ' + r.status);
            return r.json();
        });
    }

    buildStars();

    Promise.all([getJSON('destinations.json'), getJSON('photos.json'), getJSON('pins.json')]).then(function (res) {
        data = res[0];
        photos = res[1].photos;
        pins = res[2].pins;
        Object.keys(photos).forEach(function (k) { photos[k].forEach(function (p) { photoById[p.id] = p; }); });
        data.destinations.forEach(function (d) { byId[d.id] = d; });

        loadPicks();
        renderFilters();
        renderCards();
        applyFilters();
        renderMapList();
        renderCalendar();
        renderCredits();

        $('ec-reset-picks').addEventListener('click', resetPicks);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && openId) closeChapter(true);
        });
        window.addEventListener('popstate', syncFromHash);
        window.addEventListener('hashchange', syncFromHash);
        syncFromHash();
    }).catch(function (err) {
        $('ec-filter-count').textContent = 'The journeys could not load. Please try again later.';
        if (window.console) console.error(err);
    });
})();
