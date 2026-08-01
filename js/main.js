/* ============================================================
   nanoranch — homepage behavior
   Vanilla port of the state machine in nanoranch.dc.html (the
   design reference): home | soil | space | soul, plus the mark
   flight animations (FLIP: measure live rects, transition
   transform), focus management, and the scroll-in nav.
   ============================================================ */
(function () {
    'use strict';

    var STAR_COUNT = 150;
    var FLIGHT_MS = 1700;   /* --dur-flight */
    var REVEAL_MS = 950;    /* section content reveals mid-flight */
    var CLEAR_MS = 700;     /* flight clones removed after fade-out */

    var SECTIONS = {
        soil: {
            label: 'Soil',
            intro: 'A suburban yard in Austin, Texas. Rewilded via native flora, pollinators, host species, and the ecosystems being called back through intentional planting.',
            cards: ["'Being Lori' Memorial Pollinator Garden", "'Ranchland' Pollinator Beds", 'Drip Line Irrigation Effort']
        },
        space: {
            label: 'Space',
            intro: 'A modest one-story three bedroom house in the Woods of Brushy Creek neighborhood of Austin. Rewilded via talavera decor, reflective surfaces, and memorial celebration.',
            cards: ['Screen Porch', 'Reflection Hall', "'Being Lori' Ofrenda"]
        },
        soul: {
            label: 'Soul',
            intro: 'A life more than mid-way in an unexpected chapter. Rewilded through reflection, refraction, and resonance in frequencies of work, memory, and craft.',
            cards: ['The Bronco Benny Show', 'Boston Begins', 'MaxMalloy.com']
        }
    };

    var CARD_DETAILS = {
        'MaxMalloy.com': {
            note: 'My hybrid professional online presence that explores the philosophy I work to bring to my work',
            linkLabel: 'Visit Now',
            linkHref: 'https://maxmalloy.com'
        }
    };
    var DEFAULT_NOTE = 'In development — check back.';

    /* Cards that navigate directly (same window) instead of toggling a note */
    var CARD_HREFS = {
        'Boston Begins': '/space/boston/'
    };

    var ARROW_SVG = '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 1.5 H10.5 V7.5"></path><path d="M10.5 1.5 L3 9"></path></svg>';

    var els = {
        hero: document.getElementById('hero'),
        below: document.getElementById('below'),
        stars: document.getElementById('stars'),
        stone: document.getElementById('horizonStone'),
        braceL: document.getElementById('braceL'),
        braceR: document.getElementById('braceR'),
        dot: document.getElementById('markDot'),
        comma: document.getElementById('markComma'),
        soilBtn: document.getElementById('soilBtn'),
        sectionLayer: document.getElementById('sectionLayer'),
        sectionIntroInner: document.getElementById('sectionIntroInner'),
        sectionLabel: document.getElementById('sectionLabel'),
        sectionText: document.getElementById('sectionText'),
        cardsRow: document.getElementById('cardsRow'),
        flightLayer: document.getElementById('flightLayer'),
        navStrip: document.getElementById('navStrip'),
        siteNav: document.getElementById('siteNav'),
        navHome: document.getElementById('navHome')
    };

    var mode = 'home';
    var noted = null;       /* title of the open card, or null */
    var scrolled = false;
    var revealT = null, clearT = null;
    var reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    function reduced() { return reducedMq.matches; }

    /* ── Backdrop ── */

    /* Seeded LCG so the star field matches the design reference exactly */
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
        for (var i = 0; i < STAR_COUNT; i++) {
            var big = rnd() < 0.12;
            var size = big ? 2.4 + rnd() * 1.4 : 0.8 + rnd() * 1.4;
            var left = (rnd() * 100).toFixed(2);
            var top = (rnd() * 62).toFixed(2);
            var alpha = (0.35 + rnd() * 0.65).toFixed(2);
            var dur = (2.5 + rnd() * 4.5).toFixed(1);
            var delay = (rnd() * 6).toFixed(1);
            html += '<span style="left:' + left + '%;top:' + top + '%;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;background:rgba(255,250,240,' + alpha + ');' +
                (big ? 'box-shadow:0 0 6px 1px rgba(255,248,230,.5);' : '') +
                'animation:nrTwinkle ' + dur + 's ease-in-out ' + delay + 's infinite"></span>';
        }
        els.stars.innerHTML = html;
    }

    /* The labradorite's facet-flash / light-sweep animations reference page-level
       keyframes, so the SVG must be inlined (as an <img> it would render static). */
    function inlineLabradorite() {
        fetch('assets/labradorite.svg')
            .then(function (r) { return r.text(); })
            .then(function (svg) { els.stone.innerHTML = svg; })
            .catch(function () {
                /* Fallback: static stone is better than no horizon */
                els.stone.innerHTML = '<img src="assets/labradorite.svg" alt="" style="width:100%;height:clamp(240px,40vh,480px);display:block">';
            });
    }

    /* ── Nav / strip chrome ── */
    function updateChrome() {
        var navOn = scrolled || mode !== 'home';
        els.siteNav.classList.toggle('is-shown', navOn);
        els.navStrip.classList.toggle('is-hidden', navOn);
    }

    /* ── Flight (FLIP): measure hero glyphs, clone fixed, transition transform ── */
    function flyItems(target) {
        var vw = window.innerWidth, vh = window.innerHeight;
        function grab(el) {
            return { r: el.getBoundingClientRect(), fs: getComputedStyle(el).fontSize };
        }
        var out = [];
        if (target === 'soil') {
            var c = grab(els.comma), s = 0.85;
            out.push({ kind: 'glyph', char: ',', left: c.r.left, top: c.r.top, fs: c.fs, s: s,
                tx: (vw / 2 - c.r.width * s / 2) - c.r.left, ty: (vh - c.r.height * s * 0.97) - c.r.top,
                idle: 'nrSway 5.5s ease-in-out 2s infinite', origin: '50% 78%' });
        } else if (target === 'space') {
            var d = grab(els.dot), sd = 0.7;
            out.push({ kind: 'dot', left: d.r.left, top: d.r.top, w: d.r.width, h: d.r.height, s: sd,
                tx: (vw / 2 - d.r.width * sd / 2) - d.r.left, ty: 112 - d.r.top,
                idle: 'nrStarPulse 3.6s ease-in-out 2s infinite' });
        } else if (target === 'soul') {
            var a = grab(els.braceL), b = grab(els.braceR), sb = 0.5;
            var pad = Math.max(28, Math.min(56, vw * 0.035));
            out.push({ kind: 'glyph', char: '}', left: a.r.left, top: a.r.top, fs: a.fs, s: sb,
                tx: (vw - pad - a.r.width * sb) - a.r.left, ty: (vh / 2 - a.r.height * sb / 2) - a.r.top,
                idle: 'nrDriftR 6s ease-in-out 2s infinite' });
            out.push({ kind: 'glyph', char: '{', left: b.r.left, top: b.r.top, fs: b.fs, s: sb,
                tx: pad - b.r.left, ty: (vh / 2 - b.r.height * sb / 2) - b.r.top,
                idle: 'nrDriftL 6s ease-in-out 2s infinite' });
        }
        return out;
    }

    function buildFlight(items) {
        clearFlight();
        return items.map(function (f) {
            var outer = document.createElement('div');
            outer.className = 'fly';
            outer.style.left = f.left + 'px';
            outer.style.top = f.top + 'px';
            var inner = document.createElement('span');
            if (f.kind === 'dot') {
                inner.className = 'fly-dot';
                inner.style.width = f.w + 'px';
                inner.style.height = f.h + 'px';
            } else {
                inner.className = 'fly-glyph';
                inner.style.fontSize = f.fs;
                inner.style.transformOrigin = f.origin || '50% 50%';
                inner.textContent = f.char;
            }
            outer.appendChild(inner);
            els.flightLayer.appendChild(outer);
            return { outer: outer, inner: inner, item: f };
        });
    }

    function settleFlight(flights) {
        flights.forEach(function (fl) {
            fl.outer.style.transform = 'translate(' + fl.item.tx + 'px, ' + fl.item.ty + 'px) scale(' + fl.item.s + ')';
            fl.inner.style.animation = fl.item.idle;
        });
    }

    function clearFlight() {
        els.flightLayer.innerHTML = '';
    }

    /* ── Section content ── */
    function buildCards(section) {
        els.cardsRow.innerHTML = '';
        section.cards.forEach(function (title, i) {
            var card = document.createElement('div');
            card.className = 'card nr-glass';
            card.style.animationDelay = (0.15 + i * 0.13).toFixed(2) + 's';

            var tile;
            if (CARD_HREFS[title]) {
                tile = document.createElement('a');
                tile.className = 'card-toggle';
                tile.href = CARD_HREFS[title];
                tile.innerHTML = '<span class="card-hairline" aria-hidden="true"></span>' +
                    '<span class="card-title"></span>' +
                    '<span class="card-note"></span>' +
                    '<span class="card-hint">Visit</span>';
            } else {
                tile = document.createElement('button');
                tile.type = 'button';
                tile.className = 'card-toggle';
                tile.setAttribute('aria-expanded', 'false');
                tile.innerHTML = '<span class="card-hairline" aria-hidden="true"></span>' +
                    '<span class="card-title"></span>' +
                    '<span class="card-note" aria-live="polite"></span>' +
                    '<span class="card-hint">Learn more</span>';
                tile.addEventListener('click', function () {
                    noted = (noted === title) ? null : title;
                    syncCards();
                });
            }
            tile.querySelector('.card-title').textContent = title;

            card.appendChild(tile);
            card._title = title;
            els.cardsRow.appendChild(card);
        });
        syncCards();
    }

    /* Update open/closed state in place so the rise animation never restarts */
    function syncCards() {
        Array.prototype.forEach.call(els.cardsRow.children, function (card) {
            var title = card._title;
            if (CARD_HREFS[title]) return;   /* direct-link cards have no open state */
            var open = noted === title;
            var detail = CARD_DETAILS[title];
            card.classList.toggle('is-open', open);
            var btn = card.querySelector('.card-toggle');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            card.querySelector('.card-note').textContent = open ? (detail ? detail.note : DEFAULT_NOTE) : '';
            card.querySelector('.card-hint').textContent = open ? '' : 'Learn more';

            var link = card.querySelector('.card-link');
            if (open && detail && detail.linkHref) {
                if (!link) {
                    link = document.createElement('a');
                    link.className = 'card-link';
                    link.href = detail.linkHref;
                    link.target = '_blank';
                    link.rel = 'noopener';
                    link.setAttribute('aria-label', detail.linkLabel + ': ' + title + ' (opens in new window)');
                    link.innerHTML = '<span></span>' + ARROW_SVG;
                    link.querySelector('span').textContent = detail.linkLabel;
                    card.appendChild(link);
                }
            } else if (link) {
                card.removeChild(link);
            }
        });
    }

    function revealSection(target) {
        var section = SECTIONS[target];
        els.sectionLayer.setAttribute('data-mode', target);
        els.sectionLabel.textContent = section.label;
        els.sectionText.textContent = section.intro;
        buildCards(section);
        /* Restart the intro's fade-up each time the section opens */
        var inner = els.sectionIntroInner;
        inner.style.animation = 'none';
        void inner.offsetWidth;
        inner.style.animation = '';
        els.sectionLayer.hidden = false;
        focusHeading();
    }

    function focusHeading() {
        els.sectionLabel.setAttribute('tabindex', '-1');
        els.sectionLabel.focus({ preventScroll: true });
    }

    /* ── State machine ── */
    function go(target, e) {
        if (e) e.preventDefault();
        if (target === mode) return;
        clearTimeout(revealT); clearTimeout(clearT);

        var items = flyItems(target);
        window.scrollTo(0, 0);
        mode = target;
        noted = null;

        els.hero.classList.add('is-hidden');
        els.below.classList.add('is-hidden');
        els.sectionLayer.hidden = true;
        updateChrome();

        var flights = buildFlight(items);
        if (reduced()) {
            settleFlight(flights);
            revealSection(target);
        } else {
            /* Force a style flush so the settle transform transitions from
               the start position (rAF is unreliable in throttled tabs) */
            void els.flightLayer.offsetWidth;
            setTimeout(function () {
                if (mode === target) settleFlight(flights);
            }, 20);
            revealT = setTimeout(function () { revealSection(target); }, REVEAL_MS);
        }
    }

    function goHome(e) {
        if (e) e.preventDefault();
        clearTimeout(revealT); clearTimeout(clearT);
        if (mode === 'home') {
            window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
            return;
        }
        mode = 'home';
        noted = null;
        els.sectionLayer.hidden = true;
        els.hero.classList.remove('is-hidden');
        els.below.classList.remove('is-hidden');
        updateChrome();
        window.scrollTo(0, 0);

        /* Flown mark elements fade out, then are removed */
        Array.prototype.forEach.call(els.flightLayer.children, function (fl) {
            fl.classList.add('is-fading');
        });
        clearT = setTimeout(clearFlight, CLEAR_MS);

        els.soilBtn.focus({ preventScroll: true });
    }

    /* ── Wire up ── */
    buildStars();
    inlineLabradorite();

    Array.prototype.forEach.call(document.querySelectorAll('[data-go]'), function (el) {
        el.addEventListener('click', function (e) {
            go(el.getAttribute('data-go'), e);
        });
    });
    els.navHome.addEventListener('click', goHome);

    window.addEventListener('scroll', function () {
        var sc = window.scrollY > 60;
        if (sc !== scrolled) {
            scrolled = sc;
            updateChrome();
        }
    }, { passive: true });

})();
