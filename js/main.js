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

    /* Wayfinding labels are fixed; each section's intro and cards live in
       content/<section>.json, edited through the CMS at /admin/. */
    var SECTION_LABELS = { soil: 'Soil', space: 'Space', soul: 'Soul' };
    var CONTENT = {};       /* section → { intro, cards } once loaded */

    /* A card with no body yet shows DEFAULT_NOTE; one with no media shows
       grey photo placeholders. */
    var DEFAULT_NOTE = 'In development — check back.';
    var PLACEHOLDER_PHOTOS = 3;

    /* Cloudflare Turnstile site key (public). Empty = message form hidden. */
    var TURNSTILE_SITE_KEY = '';

    var contentReady = Promise.all(Object.keys(SECTION_LABELS).map(function (key) {
        /* no-cache revalidates, so an edit shows up on the next visit */
        return fetch('content/' + key + '.json', { cache: 'no-cache' })
            .then(function (r) {
                if (!r.ok) throw new Error(key + '.json ' + r.status);
                return r.json();
            })
            .then(function (data) {
                CONTENT[key] = {
                    intro: data.intro || '',
                    cards: (data.cards || []).filter(function (c) { return c.published !== false && c.id && c.title; })
                };
            });
    }));

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
        var cards = CONTENT[mode] ? CONTENT[mode].cards : [];
        for (var i = 0; i < cards.length; i++) if (cards[i].id === id) return cards[i];
        return null;
    }

    function isExternal(href) {
        return /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?nanoranch\.org(\/|$)/i.test(href);
    }

    /* Only these URL shapes may become links or media sources */
    function safeUrl(url) {
        url = String(url || '').trim();
        return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(url) ? url : '';
    }

    function linkHTML(href, inner, plain, cls) {
        var c = cls ? ' class="' + cls + '"' : '';
        if (!isExternal(href)) return '<a' + c + ' href="' + esc(href) + '">' + inner + '</a>';
        return '<a' + c + ' href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="' + esc(plain) + ' (opens in new window)">' +
            inner + ARROW_SVG + '</a>';
    }

    /* ── Markdown (the subset the CMS editor produces: headings, bold, italic,
          links, quotes, lists, line breaks). Text is HTML-escaped before any
          markup is added, so a post can never inject its own HTML. ── */
    function inlineMd(src) {
        var stash = [];
        function keep(html) { stash.push(html); return '\u0000' + (stash.length - 1) + '\u0000'; }
        function emphasis(t) {
            return t.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*|__(?=\S)([\s\S]*?\S)__/g, function (m, a, b) { return '<strong>' + (a || b) + '</strong>'; })
                .replace(/\*(?=\S)([\s\S]*?\S)\*|(^|\W)_(?=\S)([\s\S]*?\S)_(?=\W|$)/g, function (m, a, pre, b) {
                    return a !== undefined ? '<em>' + a + '</em>' : pre + '<em>' + b + '</em>';
                })
                .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
        }
        var t = src.replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, function (m, ch) { return keep(esc(ch)); });
        t = esc(t);
        t = t.replace(/`([^`]+)`/g, function (m, code) { return keep('<code>' + code + '</code>'); });
        t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (m, text, href) {
            var url = safeUrl(href.replace(/&amp;/g, '&'));
            var inner = emphasis(text);
            return url ? keep(linkHTML(url, inner, plainText(inner))) : inner;
        });
        t = emphasis(t).replace(/(?: {2,}|\\)\n/g, '<br>').replace(/\n/g, ' ');
        return restore(t);

        /* Stashed links can hold stashed escapes, so restore until none are left */
        function restore(html) {
            var out = html.replace(/\u0000(\d+)\u0000/g, function (m, i) { return stash[+i]; });
            return out === html ? out : restore(out);
        }
        /* Tag-free, unescaped text for an aria-label (linkHTML escapes it again) */
        function plainText(html) {
            return restore(html).replace(/<[^>]+>/g, '')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
        }
    }

    function renderMd(src) {
        var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
        var html = '', para = [], list = null, quote = [];
        function flushPara() { if (para.length) { html += '<p>' + inlineMd(para.join('\n')) + '</p>'; para = []; } }
        function flushList() {
            if (list) { html += '<' + list.tag + '>' + list.items.map(function (it) { return '<li>' + inlineMd(it) + '</li>'; }).join('') + '</' + list.tag + '>'; list = null; }
        }
        function flushQuote() { if (quote.length) { html += '<blockquote>' + renderMd(quote.join('\n')) + '</blockquote>'; quote = []; } }
        function flushAll() { flushPara(); flushList(); flushQuote(); }
        lines.forEach(function (line) {
            var m;
            if (/^>/.test(line)) { flushPara(); flushList(); quote.push(line.replace(/^> ?/, '')); return; }
            flushQuote();
            if (!line.trim()) { flushPara(); flushList(); return; }
            if ((m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line))) {
                flushAll();
                /* Card titles are <h3>, so post headings start at <h4> */
                var level = Math.min(6, Math.max(4, m[1].length + 1));
                html += '<h' + level + '>' + inlineMd(m[2]) + '</h' + level + '>';
                return;
            }
            if ((m = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(line))) {
                flushPara();
                var tag = /\d/.test(m[1]) ? 'ol' : 'ul';
                if (list && list.tag !== tag) flushList();
                if (!list) list = { tag: tag, items: [] };
                list.items.push(m[2]);
                return;
            }
            if (list && /^\s+\S/.test(line)) { list.items[list.items.length - 1] += '\n' + line.trim(); return; }
            flushList();
            para.push(line);
        });
        flushAll();
        return html;
    }

    /* ── Media: images, YouTube/Vimeo (privacy-enhanced embeds), or video files ── */
    function videoEmbed(url) {
        var m;
        if ((m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url))) {
            return 'https://www.youtube-nocookie.com/embed/' + m[1];
        }
        if ((m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url))) return 'https://player.vimeo.com/video/' + m[1] + '?dnt=1';
        return '';
    }

    function slideHTML(item, i, n, title) {
        var label = (item.type === 'video' ? 'Video ' : 'Photo ') + (i + 1) + ' of ' + n;
        var caption = item.caption ? '<figcaption class="filmstrip-caption">' + esc(item.caption) + '</figcaption>' : '';
        var url = safeUrl(item.type === 'video' ? item.url : item.src);
        var frame;
        if (item.type === 'video') {
            var embed = videoEmbed(url);
            var name = esc(item.title || title) + ' (' + label.toLowerCase() + ')';
            if (embed) frame = '<iframe class="filmstrip-media" src="' + esc(embed) + '" title="' + name + '" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>';
            else if (url) frame = '<video class="filmstrip-media" src="' + esc(url) + '" controls playsinline preload="metadata" aria-label="' + name + '"></video>';
        } else if (url) {
            frame = '<img class="filmstrip-media" src="' + esc(url) + '" alt="' + esc(item.alt || '') + '" loading="lazy" decoding="async">';
        }
        if (!frame) return '';
        return '<figure class="filmstrip-item">' + frame + caption + '</figure>';
    }

    function thumbFor(c) {
        if (c.thumbnail) return safeUrl(c.thumbnail);
        var media = c.media || [];
        for (var i = 0; i < media.length; i++) if (media[i].type === 'image' && media[i].src) return safeUrl(media[i].src);
        return '';
    }

    function cardHTML(c, i) {
        var thumb = thumbFor(c);
        return '<article class="card nr-glass" id="c-' + esc(c.id) + '" data-id="' + esc(c.id) + '"' +
                ' style="animation-delay:' + (0.15 + i * 0.13).toFixed(2) + 's">' +
            /* The title names the card, so the thumbnail is decorative */
            '<div class="card-img" aria-hidden="true">' +
                (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy" decoding="async">' : '<span class="card-ph"></span>') +
            '</div>' +
            '<div class="card-body">' +
                '<span class="card-hairline" aria-hidden="true"></span>' +
                '<h3 class="card-title">' + esc(c.title) + '</h3>' +
                (c.status ? '<p class="card-status">' + esc(c.status) + '</p>' : '') +
            '</div>' +
            '<button type="button" class="card-expand" aria-expanded="false" aria-controls="ch-' + esc(c.id) + '">' +
                '<span class="card-expand-text">Learn more</span><span class="sr-only"> about ' + esc(c.title) + '</span></button>' +
            '<div class="card-chapter" id="ch-' + esc(c.id) + '" hidden></div>' +
        '</article>';
    }

    /* Hero media strip (grey placeholders until media is added) + body + optional link */
    function chapterHTML(c) {
        var media = c.media || [];
        var slides = media.map(function (item, i) { return slideHTML(item, i, media.length, c.title); }).join('');
        var n = media.length;
        if (!slides) {
            n = PLACEHOLDER_PHOTOS;
            for (var i = 0; i < n; i++) {
                slides += '<figure class="filmstrip-item"><span class="filmstrip-ph" role="img" aria-label="Photo ' + (i + 1) + ' of ' + n + ' (coming soon)"></span></figure>';
            }
        }
        var href = c.link && c.link.label && safeUrl(c.link.href);
        var link = href ? linkHTML(href, '<span>' + esc(c.link.label) + '</span>', c.link.label + ': ' + c.title, 'card-link') : '';
        var body = c.body && c.body.trim() ? renderMd(c.body) : '<p>' + esc(DEFAULT_NOTE) + '</p>';
        return '<div class="filmstrip" role="region" aria-label="Media for ' + esc(c.title) + '" tabindex="0">' + slides + '</div>' +
            (n > 1
                ? '<div class="filmstrip-controls">' +
                    '<button type="button" class="filmstrip-btn" data-step="-1" aria-label="Previous">Prev</button>' +
                    '<span class="filmstrip-count" aria-hidden="true">1 / ' + n + '</span>' +
                    '<button type="button" class="filmstrip-btn" data-step="1" aria-label="Next">Next</button>' +
                  '</div>'
                : '') +
            '<div class="chapter-body">' + body + link + '</div>' +
            messageHTML(c);
    }

    /* ── Direct messages: a note + a number to text back, sent by api/message.php.
          Hidden until TURNSTILE_SITE_KEY is set (the server requires the check). ── */
    function messageHTML(c) {
        if (!TURNSTILE_SITE_KEY) return '';
        var id = 'msg-' + esc(c.id);
        function field(name, label, input, hint) {
            return '<div class="msg-field">' +
                '<label class="msg-label" for="' + id + '-' + name + '">' + label + (hint ? ' <span class="msg-optional">' + hint + '</span>' : '') + '</label>' +
                input +
                '<p class="msg-error" id="' + id + '-' + name + '-error"></p></div>';
        }
        return '<div class="msg">' +
            '<button type="button" class="msg-toggle" aria-expanded="false" aria-controls="' + id + '">Message me about this</button>' +
            '<form class="msg-form" id="' + id + '" hidden novalidate>' +
                '<p class="msg-intro">Leave me a note and a number I can text back. I’ll only use it to reply.</p>' +
                field('message', 'Message', '<textarea class="msg-input" id="' + id + '-message" name="message" rows="4" maxlength="2000" required aria-describedby="' + id + '-message-error"></textarea>') +
                field('phone', 'Phone for my reply', '<input class="msg-input" id="' + id + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="' + id + '-phone-error">') +
                field('name', 'Name', '<input class="msg-input" id="' + id + '-name" name="name" autocomplete="name" maxlength="80" aria-describedby="' + id + '-name-error">', '(optional)') +
                /* Honeypot: invisible to people, irresistible to bots */
                '<div class="msg-hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>' +
                '<div class="msg-turnstile"></div>' +
                '<button type="submit" class="msg-send">Send</button>' +
                '<p class="msg-status" role="status"></p>' +
            '</form>' +
        '</div>';
    }

    var turnstileReady = null;
    function loadTurnstile() {
        if (!turnstileReady) {
            turnstileReady = new Promise(function (resolve, reject) {
                window.nrTurnstileLoaded = function () { resolve(window.turnstile); };
                var s = document.createElement('script');
                s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=nrTurnstileLoaded';
                s.onerror = function () { turnstileReady = null; reject(new Error('Turnstile failed to load')); };
                document.head.appendChild(s);
            });
        }
        return turnstileReady;
    }

    function setMsgStatus(form, text, isError) {
        var st = form.querySelector('.msg-status');
        st.textContent = text;
        st.classList.toggle('is-error', !!isError);
    }

    function toggleMessage(btn) {
        var form = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        form.hidden = !open;
        if (!open) return;
        form._openedAt = form._openedAt || Date.now();
        form.querySelector('textarea').focus();
        if (form._widget === undefined) {
            form._widget = null;
            loadTurnstile().then(function (ts) {
                form._widget = ts.render(form.querySelector('.msg-turnstile'), {
                    sitekey: TURNSTILE_SITE_KEY, theme: 'dark', size: 'flexible', appearance: 'interaction-only'
                });
            }, function () {
                setMsgStatus(form, 'The spam check couldn’t load. Please try again later.', true);
            });
        }
    }

    function sendMessage(form) {
        var card = form.closest('.card');
        var f = form.elements;
        form.querySelectorAll('.msg-error').forEach(function (el) { el.textContent = ''; });
        form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
        var token = form._widget != null && window.turnstile ? window.turnstile.getResponse(form._widget) : '';
        if (!token) {
            setMsgStatus(form, 'One moment — the spam check is still running. Try Send again in a few seconds.', true);
            return;
        }
        var btn = form.querySelector('.msg-send');
        btn.disabled = true;
        setMsgStatus(form, 'Sending…');
        fetch('/api/message.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section: mode, card: card.dataset.id,
                message: f.message.value, phone: f.phone.value, name: f.name.value,
                website: f.website.value, elapsed: Date.now() - form._openedAt, turnstile: token
            })
        }).then(function (r) {
            return r.json().catch(function () { return { ok: false }; });
        }).then(function (res) {
            if (res.ok) {
                form.reset();
                setMsgStatus(form, 'Sent — thank you. I’ll text you back.');
                return;
            }
            var first = null;
            Object.keys(res.fields || {}).forEach(function (name) {
                var input = f[name];
                if (!input) return;
                input.setAttribute('aria-invalid', 'true');
                document.getElementById(input.id + '-error').textContent = res.fields[name];
                first = first || input;
            });
            setMsgStatus(form, res.error || 'Your message couldn’t be sent. Please try again later.', true);
            if (first) first.focus();
        }, function () {
            setMsgStatus(form, 'Your message couldn’t be sent — check your connection and try again.', true);
        }).then(function () {
            btn.disabled = false;
            if (form._widget != null && window.turnstile) window.turnstile.reset(form._widget);   /* tokens are single-use */
        });
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
        if (!chapter.querySelector('.filmstrip-count')) return;   /* single item: no controls */
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
        els.sectionLayer.setAttribute('data-mode', target);
        els.sectionLabel.textContent = SECTION_LABELS[target];
        els.sectionText.textContent = '';
        els.cardsRow.innerHTML = '';
        /* Content normally arrives long before the 950ms reveal; wait if not */
        contentReady.then(function () {
            if (mode !== target) return;
            var section = CONTENT[target];
            els.sectionText.textContent = section.intro;
            buildCards(section);
            if (pendingCard) {
                var id = pendingCard;
                pendingCard = null;
                if (findCard(id)) {
                    history.replaceState(null, '', '#' + target + '/' + id);
                    openCard(id, false);
                }
            }
        }, function () {
            if (mode === target) els.sectionText.textContent = 'This section could not load. Please try again in a moment.';
        });
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
        } else if (t.classList.contains('msg-toggle')) {
            toggleMessage(t);
        }
    });
    els.cardsRow.addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage(e.target);
    });
    document.addEventListener('keydown', function (e) {
        /* Esc closes the card, but not while typing a message (it would lose the text) */
        if (e.key === 'Escape' && openId && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) closeCard(true);
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
