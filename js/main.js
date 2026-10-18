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
            cards: [
                { id: 'being-lori-garden', title: "'Being Lori' Memorial Pollinator Garden" },
                { id: 'ranchland-beds', title: "'Ranchland' Pollinator Beds" },
                { id: 'drip-line', title: 'Drip Line Irrigation Effort' }
            ]
        },
        space: {
            label: 'Space',
            intro: 'A modest one-story three bedroom house in the Woods of Brushy Creek neighborhood of Austin. Rewilded via talavera decor, reflective surfaces, and memorial celebration.',
            cards: [
                { id: 'boston-begins', title: 'Boston Begins', link: { label: 'Visit Boston Begins', href: '/space/boston/' } },
                { id: 'reflection-hall', title: 'Reflection Hall' },
                { id: 'being-lori-ofrenda', title: "'Being Lori' Ofrenda" }
            ]
        },
        soul: {
            label: 'Soul',
            intro: 'A life more than mid-way in an unexpected chapter. Rewilded through reflection, refraction, and resonance in frequencies of work, memory, and craft.',
            cards: [
                { id: 'bronco-benny-show', title: 'The Bronco Benny Show' },
                { id: 'immersive-memories', title: 'Immersive Memories' },
                { id: 'maxmalloy', title: 'MaxMalloy.com',
                  note: 'My hybrid professional online presence that explores the philosophy I work to bring to my work',
                  link: { label: 'Visit Now', href: 'https://maxmalloy.com', external: true } }
            ]
        }
    };

    /* Card content blocks (travel-card pattern from /soul/travel). Until real
       content lands, every block shows grey photo placeholders and DEFAULT_NOTE. */
    var DEFAULT_NOTE = 'In development — check back.';
    var PLACEHOLDER_PHOTOS = 3;

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
    var openId = null;      /* id of the open card, or null */
    var openedByUs = false; /* whether we pushed the current #<mode>/<id> history entry */
    var pendingCard = null; /* card to open once a deep-linked section reveals */
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

    /* ── Section content: travel-style cards that expand into content blocks ── */
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function findCard(id) {
        var cards = mode !== 'home' ? SECTIONS[mode].cards : [];
        for (var i = 0; i < cards.length; i++) if (cards[i].id === id) return cards[i];
        return null;
    }

    function cardHTML(c, i) {
        return '<article class="card nr-glass" id="c-' + esc(c.id) + '" data-id="' + esc(c.id) + '"' +
                ' style="animation-delay:' + (0.15 + i * 0.13).toFixed(2) + 's">' +
            '<div class="card-img" aria-hidden="true"><span class="card-ph"></span></div>' +
            '<div class="card-body">' +
                '<span class="card-hairline" aria-hidden="true"></span>' +
                '<h3 class="card-title">' + esc(c.title) + '</h3>' +
                (c.link ? '' : '<p class="card-status">In development</p>') +
            '</div>' +
            '<button type="button" class="card-expand" aria-expanded="false" aria-controls="ch-' + esc(c.id) + '">' +
                '<span class="card-expand-text">Learn more</span><span class="sr-only"> about ' + esc(c.title) + '</span></button>' +
            '<div class="card-chapter" id="ch-' + esc(c.id) + '" hidden></div>' +
        '</article>';
    }

    /* Hero photo strip (grey placeholders for now) + body copy + optional link */
    function chapterHTML(c) {
        var slides = '';
        for (var i = 0; i < PLACEHOLDER_PHOTOS; i++) {
            slides += '<figure class="filmstrip-item"><span class="filmstrip-ph" role="img" aria-label="Photo ' + (i + 1) + ' of ' + PLACEHOLDER_PHOTOS + ' (coming soon)"></span></figure>';
        }
        var link = '';
        if (c.link) {
            link = c.link.external
                ? '<a class="card-link" href="' + esc(c.link.href) + '" target="_blank" rel="noopener" aria-label="' + esc(c.link.label + ': ' + c.title) + ' (opens in new window)"><span>' + esc(c.link.label) + '</span>' + ARROW_SVG + '</a>'
                : '<a class="card-link" href="' + esc(c.link.href) + '"><span>' + esc(c.link.label) + '</span></a>';
        }
        return '<div class="filmstrip" role="region" aria-label="Photographs of ' + esc(c.title) + '" tabindex="0">' + slides + '</div>' +
            '<div class="filmstrip-controls">' +
                '<button type="button" class="filmstrip-btn" data-step="-1" aria-label="Previous photo">Prev</button>' +
                '<span class="filmstrip-count" aria-hidden="true">1 / ' + PLACEHOLDER_PHOTOS + '</span>' +
                '<button type="button" class="filmstrip-btn" data-step="1" aria-label="Next photo">Next</button>' +
            '</div>' +
            '<div class="chapter-body"><p class="chapter-text">' + esc(c.note || DEFAULT_NOTE) + '</p>' + link + '</div>';
    }

    function buildCards(section) {
        els.cardsRow.innerHTML = section.cards.map(cardHTML).join('');
    }

    function stepFilmstrip(chapter, step) {
        var strip = chapter.querySelector('.filmstrip');
        var item = strip.firstElementChild;
        var w = item.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || 0);
        strip.scrollBy({ left: step * w, behavior: reduced() ? 'auto' : 'smooth' });
    }

    function syncFilmstrip(strip) {
        var item = strip.firstElementChild;
        var w = item.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || 0);
        var n = strip.children.length;
        var at = Math.min(n - 1, Math.round(strip.scrollLeft / w));
        var chapter = strip.parentNode;
        chapter.querySelector('.filmstrip-count').textContent = (at + 1) + ' / ' + n;
        chapter.querySelector('[data-step="-1"]').disabled = at === 0;
        chapter.querySelector('[data-step="1"]').disabled = at === n - 1;
    }

    function setOpen(id, open) {
        var card = document.getElementById('c-' + id);
        if (!card) return;
        var ch = document.getElementById('ch-' + id);
        if (open && !ch.innerHTML) {
            ch.innerHTML = chapterHTML(findCard(id));
            var strip = ch.querySelector('.filmstrip');
            strip.addEventListener('scroll', function () { syncFilmstrip(strip); }, { passive: true });
        }
        ch.hidden = !open;
        card.classList.toggle('is-open', open);
        var btn = card.querySelector('.card-expand');
        btn.setAttribute('aria-expanded', String(open));
        btn.querySelector('.card-expand-text').textContent = open ? 'Close' : 'Learn more';
        if (open) syncFilmstrip(ch.querySelector('.filmstrip'));
    }

    /* Open cards live in the URL (#soil/<id>) so Back closes them and blocks are linkable */
    function openCard(id, push) {
        if (!findCard(id)) return;
        if (openId && openId !== id) setOpen(openId, false);
        openId = id;
        setOpen(id, true);
        document.body.classList.add('is-reading');
        if (push && openedByUs) {
            /* switching cards: one history entry, so Back never reopens the previous card */
            history.replaceState(null, '', '#' + mode + '/' + id);
        } else if (push) {
            history.pushState(null, '', '#' + mode + '/' + id);
            openedByUs = true;
        }
        /* A deep-linked card may still be rising in; measure once it lands */
        var card = document.getElementById('c-' + id);
        var scroll = function () { card.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); };
        if (card.getAnimations && card.getAnimations().length) card.addEventListener('animationend', scroll, { once: true });
        else scroll();
    }

    function closeCard(fromUser) {
        if (!openId) return;
        var id = openId;
        openId = null;
        setOpen(id, false);
        document.body.classList.remove('is-reading');
        if (fromUser) {
            if (openedByUs) history.back();
            else history.replaceState(null, '', location.pathname + location.search);
            document.getElementById('c-' + id).querySelector('.card-expand').focus();
        }
        openedByUs = false;
    }

    /* Changing mode: drop any open card and its hash without animating
       (pendingCard survives so a deep link can still open its card) */
    function resetCards() {
        openId = null;
        openedByUs = false;
        document.body.classList.remove('is-reading');
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    }

    function parseHash() {
        var m = /^#(soil|space|soul)(?:\/([\w-]+))?$/.exec(location.hash);
        return m ? { mode: m[1], card: m[2] || null } : null;
    }

    function syncFromHash() {
        var h = parseHash();
        if (h && h.mode !== mode) {
            pendingCard = h.card;
            go(h.mode);
        } else if (h && h.card && h.card !== openId) {
            openCard(h.card, false);
            openedByUs = false;
        } else if ((!h || !h.card) && openId) {
            closeCard(false);
        }
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
        if (pendingCard) {
            var id = pendingCard;
            pendingCard = null;
            if (findCard(id)) {
                history.replaceState(null, '', '#' + target + '/' + id);
                openCard(id, false);
            }
        }
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
        resetCards();

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
        pendingCard = null;
        resetCards();
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

    /* Card clicks: expand toggles, photo strip steps */
    els.cardsRow.addEventListener('click', function (e) {
        var t = e.target.closest('button');
        if (!t) return;
        var card = t.closest('.card');
        if (t.classList.contains('card-expand')) {
            if (openId === card.dataset.id) closeCard(true);
            else openCard(card.dataset.id, true);
        } else if (t.dataset.step) {
            stepFilmstrip(t.closest('.card-chapter'), parseInt(t.dataset.step, 10));
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && openId) closeCard(true);
    });
    window.addEventListener('popstate', syncFromHash);

    /* Deep links from subpages (e.g. /#soul, /#soil/drip-line): enter that section
       once fonts settle (so the mark flight measures correctly), then open the card */
    var deep = parseHash();
    if (deep) {
        history.replaceState(null, '', location.pathname + location.search);
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
            pendingCard = deep.card;
            go(deep.mode);
        });
    }

})();
