    /* ── Colour Theme Bar ── */
    (function () {
        'use strict';

        /* WCAG relative-luminance helpers */
        function lin(c) {
            c /= 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }
        function lum(hex) {
            return 0.2126 * lin(parseInt(hex.slice(1,3),16))
                 + 0.7152 * lin(parseInt(hex.slice(3,5),16))
                 + 0.0722 * lin(parseInt(hex.slice(5,7),16));
        }
        function cr(a, b) {
            var la = lum(a), lb = lum(b);
            return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
        }

        /* HSL → hex */
        function hsl(h, s, l) {
            s /= 100; l /= 100;
            var k = function (n) { return (n + h / 30) % 12; };
            var a = s * Math.min(l, 1 - l);
            var f = function (n) {
                return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            };
            return '#' + [f(0), f(8), f(4)].map(function (v) {
                return Math.round(Math.max(0, Math.min(1, v)) * 255)
                           .toString(16).padStart(2, '0');
            }).join('');
        }

        /* Lowest lightness (in 0.5 steps from 50 → 100) achieving minCR on bg */
        function findLight(bg, h, s, minCR) {
            for (var l = 50; l <= 100; l += 0.5) {
                var c = hsl(h, s, l);
                if (cr(c, bg) >= minCR) return c;
            }
            return '#ffffff';
        }

        /* ── Fixed palettes ── */

        /* Default dark — black primary, white foreground */
        var defaultVars = {
            '--black':       '#0b0b0b',
            '--grey-dark':   '#181818',
            '--text-dark':   '#a8a8a8',   /* 8.55:1 on #0b0b0b ✓ AAA  */
            '--border-dark': '#6e6e6e',   /* 3.98:1 on #0b0b0b ✓ SC 1.4.11 */
            '--hero-mid':    '#1e1e1e',
            '--nav-bg':      'rgba(11, 11, 11, 0.94)',
            '--fg':          '#f7f7f5',   /* 19:1 on #0b0b0b   ✓ AAA  */
            '--hero-fade':   'rgba(247, 247, 245, 0.2)'
        };

        /*
         * Light (inverted) — white primary, black foreground.
         * --text-dark #4d4d4d: 7.9:1 on #f7f7f5  ✓ AAA
         * --border-dark #6e6e6e: 4.8:1 on #f7f7f5 ✓ SC 1.4.11
         * --fg #0b0b0b: 19:1 on #f7f7f5            ✓ AAA
         */
        var lightVars = {
            '--black':       '#f7f7f5',
            '--grey-dark':   '#eeeeec',
            '--text-dark':   '#4d4d4d',
            '--border-dark': '#6e6e6e',
            '--hero-mid':    '#e2e2e0',
            '--nav-bg':      'rgba(247, 247, 245, 0.96)',
            '--fg':          '#0b0b0b',
            '--hero-fade':   'rgba(11, 11, 11, 0.15)'
        };

        /* ── All nine swatches: black · ROYGBIV · white ── */
        var swatches = [
            { label: 'Default dark', swatchColor: '#0b0b0b', vars: defaultVars },
            { label: 'Red',    hue: 4,   swatchS: 90,  swatchL: 46 },
            { label: 'Orange', hue: 28,  swatchS: 95,  swatchL: 50 },
            { label: 'Yellow', hue: 52,  swatchS: 100, swatchL: 52 },
            { label: 'Green',  hue: 130, swatchS: 72,  swatchL: 38 },
            { label: 'Blue',   hue: 218, swatchS: 88,  swatchL: 50 },
            { label: 'Indigo', hue: 248, swatchS: 88,  swatchL: 44 },
            { label: 'Violet', hue: 280, swatchS: 85,  swatchL: 44 },
            { label: 'Light',  swatchColor: '#f7f7f5', isLight: true, vars: lightVars }
        ];

        /* Build CSS-variable map for a ROYGBIV hue */
        function makeVars(sw) {
            var primary = hsl(sw.hue, 88, 15);   /* dark saturated primary bg  */
            var darker  = hsl(sw.hue, 88, 11);   /* about / footer bg          */
            var mid     = hsl(sw.hue, 70, 22);   /* hero gradient inner stop   */
            var textD   = findLight(primary, sw.hue, 80, 7.0);  /* AAA muted text   */
            var border  = findLight(primary, sw.hue, 60, 3.0);  /* SC 1.4.11 border */
            var rgb     = [
                parseInt(primary.slice(1,3),16),
                parseInt(primary.slice(3,5),16),
                parseInt(primary.slice(5,7),16)
            ];
            return {
                '--black':       primary,
                '--grey-dark':   darker,
                '--text-dark':   textD,
                '--border-dark': border,
                '--hero-mid':    mid,
                '--nav-bg':      'rgba(' + rgb + ', 0.94)',
                '--fg':          '#f7f7f5',   /* white fg stays correct on dark primaries */
                '--hero-fade':   'rgba(247, 247, 245, 0.2)'
            };
        }

        function applyVars(vars) {
            var root = document.documentElement;
            Object.keys(vars).forEach(function (k) {
                root.style.setProperty(k, vars[k]);
            });
        }

        /* ── Build the bar ── */
        var bar = document.querySelector('.color-bar');
        if (!bar) return;

        var activeBtn  = null;
        var defaultBtn = null;   /* reference to the black swatch — acts as "home" */

        swatches.forEach(function (sw, idx) {
            var btn = document.createElement('button');
            btn.className = 'color-swatch';
            btn.setAttribute('aria-label', sw.label + ' colour theme');
            btn.setAttribute('aria-pressed', 'false');
            btn.style.background = sw.swatchColor || hsl(sw.hue, sw.swatchS, sw.swatchL);
            if (sw.isLight) btn.setAttribute('data-light', '');

            btn.addEventListener('click', function () {
                var themeVars = sw.vars || makeVars(sw);

                if (activeBtn === btn && btn !== defaultBtn) {
                    /* Clicking the active non-default swatch resets to dark */
                    btn.setAttribute('aria-pressed', 'false');
                    defaultBtn.setAttribute('aria-pressed', 'true');
                    activeBtn = defaultBtn;
                    applyVars(defaultVars);
                } else {
                    if (activeBtn) activeBtn.setAttribute('aria-pressed', 'false');
                    btn.setAttribute('aria-pressed', 'true');
                    activeBtn = btn;
                    applyVars(themeVars);
                }
            });

            bar.appendChild(btn);

            if (idx === 0) defaultBtn = btn;
        });

        /* Start with the black swatch marked active (default state) */
        if (defaultBtn) {
            defaultBtn.setAttribute('aria-pressed', 'true');
            activeBtn = defaultBtn;
        }

        /* Arrow-key navigation within the bar (ARIA toolbar pattern) */
        bar.addEventListener('keydown', function (e) {
            var btns = Array.from(bar.querySelectorAll('.color-swatch'));
            var i = btns.indexOf(document.activeElement);
            if (i === -1) return;
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                btns[(i + 1) % btns.length].focus();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                btns[(i - 1 + btns.length) % btns.length].focus();
            }
        });
    }());

    /* ── Hash-free anchor scrolling & scroll-position reset ── */
    (function () {
        'use strict';

        /* Tell the browser not to restore the previous scroll position on
         * refresh. Supported in all modern browsers including iOS Safari 11+. */
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        /* Strip any hash already in the URL (e.g. loaded via a bookmark) so
         * the address bar is always clean and a refresh returns to the top. */
        if (location.hash) {
            history.replaceState(null, '', location.pathname + location.search);
        }

        /* iOS Safari serves pages from its back/forward cache (bfcache) and
         * won't re-run the above on a cache-restore. pageshow fires in both
         * cases and ensures the page always starts at the top. */
        window.addEventListener('pageshow', function (e) {
            window.scrollTo(0, 0);
        });

        /* Intercept every in-page anchor click and scroll without writing a
         * hash to the URL, so the page always reloads from the top. */
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var hash = a.getAttribute('href');
            if (hash === '#') return;          /* logo / back-to-top links */
            var target = document.querySelector(hash);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        });
    }());

    /* ── Hamburger Menu ── */
    (function () {
        var toggle = document.querySelector('.nav-toggle');
        var menu   = document.getElementById('mobile-menu');
        var links  = Array.from(menu.querySelectorAll('a'));

        function openMenu() {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Close navigation menu');
            menu.classList.add('is-open');
            menu.setAttribute('aria-hidden', 'false');
            document.body.classList.add('menu-open');
            links[0].focus();
        }

        function closeMenu() {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation menu');
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('menu-open');
            toggle.focus();
        }

        toggle.addEventListener('click', function () {
            menu.classList.contains('is-open') ? closeMenu() : openMenu();
        });

        /* Escape key closes the menu */
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) {
                closeMenu();
            }
        });

        /* Close when any nav link is followed */
        links.forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });

        /*
         * Focus trap (SC 2.4.3 AAA):
         * Tab cycles between the toggle button and the nav links while
         * the menu is open so keyboard focus cannot reach elements behind
         * the overlay.
         */
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' && !e.shiftKey && menu.classList.contains('is-open')) {
                e.preventDefault();
                links[0].focus();
            }
        });

        menu.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab') return;
            var first = links[0];
            var last  = links[links.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                toggle.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                toggle.focus();
            }
        });
    }());
