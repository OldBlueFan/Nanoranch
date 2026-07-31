<?php
/**
 * Boston Begins — server-side renderer.
 *
 * Renders the complete semantic document from boston-guide.json, so the guide
 * is fully readable (and printable) with JavaScript disabled. js/app.js
 * decorates this DOM — tabs, filters, saved state, the live map — without
 * re-rendering any content. Editorial text lives in the JSON only.
 */

declare(strict_types=1);

function bb_e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function bb_guide(): array
{
    static $guide = null;
    if ($guide === null) {
        $guide = json_decode((string) file_get_contents(dirname(__DIR__) . '/boston-guide.json'), true);
    }
    return $guide;
}

function bb_dest(string $id): ?array
{
    foreach (bb_guide()['destinations'] as $d) {
        if ($d['id'] === $id) {
            return $d;
        }
    }
    return null;
}

/** before | during | after, relative to the trip dates (America/New_York). */
function bb_trip_state(): array
{
    $meta  = bb_guide()['meta'];
    $tz    = new DateTimeZone('America/New_York');
    $today = new DateTimeImmutable('today', $tz);
    $start = new DateTimeImmutable($meta['dates']['start'], $tz);
    $end   = new DateTimeImmutable($meta['dates']['end'], $tz);
    if ($today < $start) {
        return ['phase' => 'before', 'days' => (int) $today->diff($start)->format('%a')];
    }
    if ($today > $end) {
        return ['phase' => 'after', 'days' => 0];
    }
    return ['phase' => 'during', 'days' => (int) $today->diff($start)->format('%a') + 1];
}

function bb_maps_links(array $d): array
{
    $q  = rawurlencode($d['name'] . ', Boston area');
    $ll = $d['latitude'] . ',' . $d['longitude'];
    return [
        'apple'  => $d['appleMapsUrl'] ?: "https://maps.apple.com/?q={$q}&ll={$ll}",
        'google' => $d['googleMapsUrl'] ?: "https://www.google.com/maps/search/?api=1&query={$ll}",
    ];
}

function bb_ext_link(string $url, string $label, string $class = ''): string
{
    return '<a class="ext ' . $class . '" href="' . bb_e($url) . '" target="_blank" rel="noopener" '
         . 'aria-label="' . bb_e($label) . ' (opens in new window)">' . bb_e($label)
         . '<svg aria-hidden="true" viewBox="0 0 12 12" class="ext-arrow"><path d="M3.5 1.5h7v7M10.5 1.5 1.5 10.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
}

function bb_duration_label(array $d): string
{
    $min = $d['durationMinutes']['min'];
    $max = $d['durationMinutes']['max'];
    $fmt = static function (int $m): string {
        if ($m < 60) return $m . ' min';
        $h = intdiv($m, 60); $r = $m % 60;
        return $r ? ($h . '.' . (int) round($r / 60 * 10) . ' hr') : ($h . ' hr');
    };
    return $fmt($min) . '–' . $fmt($max);
}

/** Time-available bucket used by the filters. */
function bb_time_bucket(array $d): string
{
    $max = $d['durationMinutes']['max'];
    if (in_array('evening', $d['bestTime'], true) && $d['durationMinutes']['min'] >= 120) return 'evening';
    if ($max <= 90)  return 'short';
    if ($max <= 180) return 'medium';
    return 'half-day';
}

// ─── Fragments ──────────────────────────────────────────────────────────────

function bb_footprints(): string
{
    return '<svg class="footprints" aria-hidden="true" viewBox="0 0 64 14"><g fill="currentColor" opacity=".55"><ellipse cx="6" cy="9" rx="4" ry="3.2"/><circle cx="3.4" cy="4.6" r="1.3"/><circle cx="6.4" cy="3.8" r="1.3"/><circle cx="9.2" cy="4.9" r="1.2"/><g opacity=".7"><ellipse cx="34" cy="6" rx="4" ry="3.2"/><circle cx="31.4" cy="1.8" r="1.3"/><circle cx="34.4" cy="1" r="1.3"/><circle cx="37.2" cy="2.1" r="1.2"/></g><g opacity=".4"><ellipse cx="58" cy="10" rx="4" ry="3.2"/><circle cx="55.4" cy="5.8" r="1.3"/><circle cx="58.4" cy="5" r="1.3"/><circle cx="61.2" cy="6.1" r="1.2"/></g></g></svg>';
}

function bb_jumbo_mark(string $class = 'jumbo-mark'): string
{
    return '<svg class="' . $class . '" viewBox="0 0 120 84" aria-hidden="true">'
         . '<path fill="currentColor" fill-rule="evenodd" d="M14 70 C10 66 9 58 11 50 C12 44 14 38 14 32 C15 20 24 10 38 8 C48 6 52 8 58 8 C74 6 94 10 100 24 C105 32 105 44 99 52 L99 73 L86 73 L86 60 C76 63 60 63 52 60 L52 73 L39 73 L39 56 C32 52 28 46 27 38 C25 46 23 56 20 64 C18 70 16 72 14 70 Z '
         . 'M46 19 C58 13 69 21 68 32 C67 43 57 49 48 44 C40 39 39 25 46 19 Z '
         . 'M29 21 a2.7 2.7 0 1 0 .01 0 Z"/></svg>';
}

function bb_jumbo_tip(string $text): string
{
    return '<aside class="jumbo-tip"><span class="jumbo-tip-icon">' . bb_jumbo_mark('jumbo-mark sm') . '</span>'
         . '<div><strong class="jumbo-tip-label">Jumbo Tip</strong><p>' . bb_e($text) . '</p></div></aside>';
}

function bb_transit_card(array $from): string
{
    $est = $from['estimatedMinutes'];
    return '<div class="transit-mini"><svg aria-hidden="true" viewBox="0 0 16 16" class="ti"><path d="M4 2.5h8a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 12 11.5H4A1.5 1.5 0 0 1 2.5 10V4A1.5 1.5 0 0 1 4 2.5Z M2.5 6.5h11 M5 13.5l-1 1.5 M11 13.5l1 1.5 M5.5 9 h.01 M10.5 9 h.01" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
         . '<div><p class="transit-mini-route">' . bb_e($from['summary']) . '</p>'
         . '<p class="transit-mini-meta">From home base · ' . bb_e($from['primaryMode']) . ' · est. '
         . $est['min'] . '–' . $est['max'] . ' min</p></div></div>';
}

function bb_destination_card(array $d): string
{
    $g      = bb_guide();
    $maps   = bb_maps_links($d);
    $cats   = implode(' ', $d['category']);
    $bucket = bb_time_bucket($d);
    $times  = implode(' ', $d['bestTime']);
    $wx     = implode(' ', $d['weather']);

    $io = ['outdoor' => 'Outdoor', 'indoor' => 'Indoor', 'mixed' => 'In & out'][$d['indoorOutdoor']] ?? $d['indoorOutdoor'];
    $energy = ucfirst($d['energy']);

    $html  = '<article class="dest" id="d-' . bb_e($d['id']) . '" data-id="' . bb_e($d['id']) . '"'
           . ' data-cluster="' . bb_e($d['clusterId']) . '" data-cats="' . bb_e($cats) . '"'
           . ' data-weather="' . bb_e($wx) . '" data-energy="' . bb_e($d['energy']) . '"'
           . ' data-besttime="' . bb_e($times) . '" data-time="' . $bucket . '">';

    $html .= '<figure class="dest-media"><img src="' . bb_e($d['image']['src']) . '" alt="' . bb_e($d['image']['alt']) . '" loading="lazy" width="600" height="400"></figure>';

    $html .= '<div class="dest-body">';
    $html .= '<header class="dest-head"><h4 class="dest-name">' . bb_e($d['name']) . '</h4>'
           . '<div class="dest-actions" data-actions hidden></div></header>';
    $html .= '<p class="dest-summary">' . bb_e($d['summary']) . '</p>';

    $html .= '<ul class="dest-meta" aria-label="At a glance">'
           . '<li>' . bb_duration_label($d) . '</li>'
           . '<li>' . $energy . '</li>'
           . '<li>' . $io . '</li>'
           . '</ul>';

    $html .= '<details class="dest-more"><summary><span>Details &amp; getting there</span></summary><div class="dest-detail">';
    $html .= '<p class="dest-why"><strong>Why go:</strong> ' . bb_e($d['whyGo']) . '</p>';
    $html .= bb_transit_card($d['fromHomeBase']);

    if (!empty($d['jumboTip'])) {
        $html .= bb_jumbo_tip($d['jumboTip']);
    }

    if (!empty($d['pairWith'])) {
        $html .= '<div class="pair-trail"><span class="pair-label">' . bb_footprints() . ' Pairs with</span><ul>';
        foreach ($d['pairWith'] as $pid) {
            if ($p = bb_dest($pid)) {
                $html .= '<li><a href="#d-' . bb_e($pid) . '">' . bb_e($p['name']) . '</a></li>';
            }
        }
        $html .= '</ul></div>';
    }

    $html .= '<div class="dest-links">';
    if (!empty($d['officialUrl'])) {
        $html .= bb_ext_link($d['officialUrl'], 'Official site', 'link-official');
    }
    $html .= bb_ext_link($maps['apple'], 'Apple Maps') . bb_ext_link($maps['google'], 'Google Maps');
    $html .= '</div>';

    if (!empty($d['verificationDate'])) {
        $html .= '<p class="verified">Details verified ' . bb_e($d['verificationDate']) . ' — confirm same-day via the official link.</p>';
    }

    $html .= '<div class="dest-note" data-note-slot hidden></div>';
    $html .= '</div></details>';
    $html .= '</div></article>';
    return $html;
}

function bb_cluster_section(array $c): string
{
    $g     = bb_guide();
    $dests = array_values(array_filter($g['destinations'], fn ($d) => $d['clusterId'] === $c['id']));

    $html  = '<section class="cluster" id="c-' . bb_e($c['id']) . '" data-cluster-id="' . bb_e($c['id']) . '">';
    $html .= '<header class="cluster-head">';
    $html .= '<figure class="cluster-art"><img src="' . bb_e($c['image']['src']) . '" alt="' . bb_e($c['image']['alt']) . '" loading="lazy" width="800" height="450"></figure>';
    $html .= '<div class="cluster-title-block">'
           . '<span class="cluster-letter" aria-hidden="true">' . bb_e($c['letter']) . '</span>'
           . '<h3 class="cluster-name">' . bb_e($c['name']) . '</h3>'
           . '<p class="cluster-character">' . bb_e($c['character']) . '</p></div>';
    $html .= '</header>';

    $html .= '<p class="cluster-editorial">' . bb_e($c['editorial']) . '</p>';

    $html .= '<dl class="cluster-facts">';
    $facts = [
        'Time to spend'  => $c['timeToSpend'],
        'Best time'      => $c['bestTime'],
        'Getting there'  => $c['transitPattern'],
        'A natural flow' => $c['suggestedFlow'],
    ];
    if (!empty($c['rainPlan'])) {
        $facts['If it rains'] = $c['rainPlan'];
    }
    if (!empty($c['foodNote'])) {
        $facts['Food & coffee'] = $c['foodNote'];
    }
    foreach ($facts as $k => $v) {
        $html .= '<div><dt>' . bb_e($k) . '</dt><dd>' . bb_e($v) . '</dd></div>';
    }
    $html .= '</dl>';

    if (!empty($c['jumboTip'])) {
        $html .= bb_jumbo_tip($c['jumboTip']);
    }
    if (!empty($c['assignment'])) {
        $html .= '<p class="cluster-assignment">' . bb_e($c['assignment']) . '</p>';
    }

    $html .= '<div class="dest-grid">';
    foreach ($dests as $d) {
        $html .= bb_destination_card($d);
    }
    $html .= '</div>';

    if (!empty($c['photoPrompts'])) {
        $html .= '<div class="photo-prompts"><h4>Photo prompts</h4><ul>';
        foreach ($c['photoPrompts'] as $p) {
            $html .= '<li>' . bb_e($p) . '</li>';
        }
        $html .= '</ul></div>';
    }

    $html .= '</section>';
    return $html;
}

// ─── Views ──────────────────────────────────────────────────────────────────

function bb_view_home(): string
{
    $g     = bb_guide();
    $meta  = $g['meta'];
    $state = bb_trip_state();

    $html = '<section class="view" id="home" aria-labelledby="home-title" data-view="home">';

    // Hero
    $html .= '<div class="hero">';
    $html .= '<svg class="hero-sky" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">'
           . '<path class="skyline" d="M0 108 h18 v-20 h8 v20 h14 v-34 h4 l3-8 3 8 h4 v34 h12 v-14 h10 v14 h16 v-46 h12 v46 h10 v-24 h8 l0-6 h6 v6 h8 v24 h14 v-60 h3 l2-10 2 10 h3 v60 h16 v-30 h12 v30 h10 v-42 h14 v42 h12 v-18 h10 v18 h14 v-52 h4 l3-12 3 12 h4 v52 h14 v-26 h12 v26 h10 v-38 h12 v38 h12 v-16 h10 v16 h18 v-28 h10 v28 H400 v12 H0 Z" fill="currentColor" opacity=".16"/>'
           . '<path class="mapline" d="M8 96 C 60 70, 90 110, 140 84 S 240 60, 292 88 S 360 96, 396 74" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 7"/>'
           . '<circle class="mapline-dot a" cx="8" cy="96" r="3.4" fill="currentColor"/>'
           . '<circle class="mapline-dot b" cx="396" cy="74" r="3.4" fill="currentColor"/>'
           . '</svg>';
    $html .= '<p class="hero-kicker">' . bb_e($meta['region']) . ' · ' . bb_e($meta['dates']['display']) . '</p>';
    $html .= '<h2 class="hero-title" id="home-title">' . bb_e($meta['title']) . '</h2>';
    $html .= '<p class="hero-sub">' . bb_e($meta['subtitle']) . '</p>';

    // Date-aware strip
    if ($state['phase'] === 'before') {
        $n = $state['days'];
        $html .= '<p class="trip-state" data-countdown>' . ($n === 1 ? 'One day' : $n . ' days') . ' until Boston begins.</p>';
    } elseif ($state['phase'] === 'during') {
        $html .= '<p class="trip-state" data-countdown>Day ' . $state['days'] . ' of the Boston chapter — choose today’s adventure below.</p>';
    } else {
        $html .= '<p class="trip-state" data-countdown>Remember Boston — revisit what you saved, and finish the memory page.</p>';
    }
    $html .= '</div>';

    // Trip snapshot
    $html .= '<div class="snapshot card-panel">';
    $html .= '<div class="snapshot-row"><h3 class="panel-title">Trip snapshot</h3>' . bb_footprints() . '</div>';
    $html .= '<dl class="snapshot-grid">';
    $html .= '<div><dt>Dates</dt><dd>Wed–Fri · ' . bb_e($meta['dates']['display']) . '</dd></div>';
    $html .= '<div><dt>Travelers</dt><dd>';
    foreach ($g['travelers'] as $i => $t) {
        $html .= ($i ? ' · ' : '') . '<span class="traveler">' . $t['emoji'] . ' ' . bb_e($t['name']) . '</span>';
    }
    $html .= '</dd></div>';
    $html .= '<div><dt>Home base</dt><dd>' . bb_e($g['homeBase']['label']) . '</dd></div>';
    $html .= '</dl></div>';

    // Quick moods
    $html .= '<div class="quick-moods" role="group" aria-label="Quick ideas">';
    foreach ($g['quickMoods'] as $qm) {
        $html .= '<a class="mood-chip" href="#explore" data-mood="' . bb_e($qm['id']) . '" data-match=\'' . json_encode($qm['match']) . '\'>'
               . '<span class="mood-label">' . bb_e($qm['label']) . '</span>'
               . '<span class="mood-hint">' . bb_e($qm['hint']) . '</span></a>';
    }
    $html .= '</div>';

    // Jumbo tip rotator
    $tips = $g['jumboTips'];
    $html .= '<div class="tip-rotator card-panel" data-tips=\'' . json_encode($tips, JSON_HEX_APOS) . '\'>';
    $html .= '<div class="tip-rotator-head"><span class="jumbo-tip-icon">' . bb_jumbo_mark('jumbo-mark sm') . '</span>'
           . '<strong class="jumbo-tip-label">Jumbo Tip</strong>'
           . '<button class="tip-next" type="button" data-tip-next hidden aria-label="Next tip">↻</button></div>';
    $html .= '<p class="tip-text" data-tip-text aria-live="polite">' . bb_e($tips[0]) . '</p>';
    $html .= '</div>';

    // Opening story
    $html .= '<div class="story"><h3 class="story-headline">' . bb_e($meta['openingHeadline']) . '</h3>';
    foreach ($meta['openingCopy'] as $p) {
        $html .= '<p>' . bb_e($p) . '</p>';
    }
    $html .= '<blockquote class="pull-quote">“' . bb_e($meta['pullQuote']) . '”</blockquote>';
    $html .= '<h4 class="story-sub">Trip philosophy</h4><ul class="philosophy">';
    foreach ($meta['philosophy'] as $p) {
        $html .= '<li>' . bb_e($p) . '</li>';
    }
    $html .= '</ul></div>';

    // Home base + orientation walk
    $hb = $g['homeBase'];
    $html .= '<div class="homebase card-panel" id="home-base"><h3 class="panel-title">Home base: ' . bb_e($hb['shortLabel']) . '</h3>';
    $html .= '<p>' . bb_e($hb['whyItWorks']) . '</p>';
    $html .= '<h4 class="panel-sub">The orientation walk</h4><ol class="walk-steps">';
    foreach ($hb['orientationWalk'] as $step) {
        $html .= '<li><strong>' . bb_e($step['title']) . '.</strong> ' . bb_e($step['copy']) . '</li>';
    }
    $html .= '</ol>';
    $html .= '<dl class="cluster-facts">';
    foreach ($hb['timeOptions'] as $opt) {
        $html .= '<div><dt>' . bb_e($opt['label']) . '</dt><dd>' . bb_e($opt['value']) . '</dd></div>';
    }
    $html .= '<div><dt>Best mood</dt><dd>' . bb_e($hb['bestMood']) . '</dd></div>';
    $html .= '</dl>';
    $html .= '<p class="softball-note">' . bb_e($hb['softballNote']) . '</p>';
    $html .= bb_jumbo_tip($hb['jumboTip']);
    $html .= '</div>';

    // Day chooser
    $dc = $g['dayChooser'];
    $html .= '<div class="day-chooser card-panel"><h3 class="panel-title">Choose our next adventure</h3><p>' . bb_e($dc['intro']) . '</p>';
    foreach ($dc['questions'] as $q) {
        $html .= '<h4 class="panel-sub">' . bb_e($q['q']) . '</h4><ul class="chooser-answers">';
        foreach ($q['answers'] as $a) {
            $html .= '<li><strong>' . bb_e($a['if']) . ':</strong> ' . bb_e($a['then']) . '</li>';
        }
        $html .= '</ul>';
    }
    $html .= '</div>';

    // Signature experiences
    $html .= '<div class="signatures"><h3 class="panel-title with-mark">' . bb_jumbo_mark('jumbo-mark sm') . ' Jumbo-sized ideas</h3><div class="sig-grid">';
    foreach ($g['signatureExperiences'] as $i => $sig) {
        $html .= '<article class="sig-card"><span class="sig-num">' . ($i + 1) . '</span>'
               . '<h4>' . bb_e($sig['title']) . '</h4><p>' . bb_e($sig['copy']) . '</p>'
               . '<p class="sig-meta"><strong>Ideal:</strong> ' . bb_e($sig['duration']) . ' · <strong>Pairs with:</strong> ' . bb_e($sig['pairing']) . '</p>'
               . (!empty($sig['trigger']) ? '<p class="sig-meta"><strong>Decision trigger:</strong> ' . bb_e($sig['trigger']) . '</p>' : '')
               . '<a class="sig-link" href="#d-' . bb_e($sig['destinationId']) . '">Open the listing →</a>'
               . '</article>';
    }
    $html .= '</div></div>';

    // Pairings
    $html .= '<div class="pairings"><h3 class="panel-title">If we’re already here…</h3><div class="pairing-grid">';
    foreach ($g['pairings'] as $p) {
        $html .= '<article class="pairing-card"><h4>' . bb_e($p['title']) . '</h4><p class="pairing-flow">';
        $html .= bb_e(implode('', array_map(fn ($s, $i) => ($i ? ' → ' : '') . $s, $p['flow'], array_keys($p['flow']))));
        $html .= '</p>';
        if (!empty($p['alt'])) {
            $html .= '<p class="pairing-flow alt">or: ' . bb_e(implode(' → ', $p['alt'])) . '</p>';
        }
        $html .= '<p class="pairing-best">Best for: ' . bb_e($p['bestFor']) . '</p></article>';
    }
    $html .= '</div></div>';

    // Food framework
    $ff = $g['foodFramework'];
    $html .= '<div class="food card-panel"><h3 class="panel-title">The Boston essentials — a food framework</h3><p>' . bb_e($ff['intro']) . '</p><ul class="food-list">';
    foreach ($ff['essentials'] as $f) {
        $html .= '<li><strong>' . bb_e($f['title']) . '.</strong> ' . bb_e($f['copy']) . '</li>';
    }
    $html .= '</ul><p class="food-note">' . bb_e($ff['note']) . '</p></div>';

    // Personal letters
    $html .= '<div class="letters" id="letters"><h3 class="panel-title">Three letters</h3>';
    foreach ($g['personalPages'] as $pp) {
        $html .= '<details class="letter"><summary><span>' . bb_e($pp['title']) . '</span></summary><div class="letter-body">';
        foreach ($pp['paragraphs'] as $par) {
            $html .= '<p>' . bb_e($par) . '</p>';
        }
        $html .= '</div></details>';
    }
    $html .= '</div>';

    // Save some magic
    $mp = $g['memoryPrompts'];
    $html .= '<div class="magic card-panel" id="magic"><h3 class="panel-title">' . bb_e($mp['title']) . '</h3>'
           . '<p class="magic-sub">' . bb_e($mp['subtitle']) . '</p><ul class="magic-list">';
    foreach ($mp['prompts'] as $i => $prompt) {
        $html .= '<li><label class="magic-item"><input type="checkbox" data-magic="' . $i . '"><span>' . bb_e($prompt) . '</span></label></li>';
    }
    $html .= '</ul><h4 class="panel-sub">After the trip, complete these lines</h4><dl class="after-lines">';
    foreach ($mp['afterTrip'] as $i => $line) {
        $html .= '<div class="after-line"><dt><label for="after-' . $i . '">' . bb_e($line) . '</label></dt>'
               . '<dd><textarea id="after-' . $i . '" data-after="' . $i . '" rows="1" placeholder="________________________________"></textarea></dd></div>';
    }
    $html .= '</dl></div>';

    $html .= '</section>';
    return $html;
}

function bb_view_explore(): string
{
    $g = bb_guide();

    $html  = '<section class="view" id="explore" aria-labelledby="explore-title" data-view="explore">';
    $html .= '<header class="view-head"><h2 id="explore-title">Explore</h2>'
           . '<p class="view-lede">Seven natural clusters, organized by geography and mood—so a great next stop is always nearby.</p></header>';

    // Filters (decorated by JS; harmless static links without it)
    $html .= '<div class="filters" data-filters hidden>'
           . '<div class="chip-row" role="group" aria-label="Filter by mood">'
           . '<button class="chip" type="button" data-f="cat" data-v="" aria-pressed="true">Everything</button>';
    foreach (['history' => 'History', 'campus' => 'Campus', 'food' => 'Food', 'waterfront' => 'Waterfront', 'baseball' => 'Baseball', 'art' => 'Art', 'wandering' => 'Wandering'] as $v => $label) {
        $html .= '<button class="chip" type="button" data-f="cat" data-v="' . $v . '" aria-pressed="false">' . $label . '</button>';
    }
    $html .= '</div>';
    $html .= '<details class="filter-more"><summary><span>More filters</span></summary><div class="filter-panel">';
    $groups = [
        ['label' => 'Time available', 'f' => 'time', 'opts' => ['short' => 'Under 90 min', 'medium' => '2–3 hours', 'half-day' => 'Half day', 'evening' => 'Evening']],
        ['label' => 'Weather', 'f' => 'weather', 'opts' => ['sunny' => 'Sunny', 'hot' => 'Hot', 'rainy' => 'Rainy', 'flexible' => 'Flexible']],
        ['label' => 'Energy', 'f' => 'energy', 'opts' => ['easy' => 'Easy', 'moderate' => 'Moderate', 'ambitious' => 'Ambitious']],
        ['label' => 'Our list', 'f' => 'state', 'opts' => ['saved' => '♥ Saved', 'done' => '✓ We did this']],
    ];
    foreach ($groups as $grp) {
        $html .= '<fieldset class="filter-group"><legend>' . $grp['label'] . '</legend><div class="chip-row">';
        $html .= '<button class="chip sm" type="button" data-f="' . $grp['f'] . '" data-v="" aria-pressed="true">Any</button>';
        foreach ($grp['opts'] as $v => $label) {
            $html .= '<button class="chip sm" type="button" data-f="' . $grp['f'] . '" data-v="' . $v . '" aria-pressed="false">' . $label . '</button>';
        }
        $html .= '</div></fieldset>';
    }
    $html .= '<button class="chip clear" type="button" data-clear-filters>Clear all filters</button>';
    $html .= '</div></details>';
    $html .= '<p class="filter-status" data-filter-status aria-live="polite"></p>';
    $html .= '</div>';

    // Cluster quick index
    $html .= '<nav class="cluster-index" aria-label="Neighborhood clusters"><ul>';
    foreach ($g['clusters'] as $c) {
        $html .= '<li><a href="#c-' . bb_e($c['id']) . '"><span class="ci-letter">' . bb_e($c['letter']) . '</span> ' . bb_e($c['shortName']) . '</a></li>';
    }
    $html .= '</ul></nav>';

    foreach ($g['clusters'] as $c) {
        $html .= bb_cluster_section($c);
    }

    $html .= '</section>';
    return $html;
}

function bb_view_map(): string
{
    $g = bb_guide();

    $html  = '<section class="view" id="map" aria-labelledby="map-title" data-view="map">';
    $html .= '<header class="view-head"><h2 id="map-title">Map</h2>'
           . '<p class="view-lede">Everything in this guide, in geographic context. Tap a marker for the short story and directions.</p></header>';
    $html .= '<div class="map-shell"><div id="leaflet-map" class="leaflet-host" role="application" aria-label="Interactive map of guide destinations"></div>'
           . '<p class="map-fallback-note" data-map-note>If the map tiles don’t load, every listing below still links to Apple&nbsp;Maps and Google&nbsp;Maps.</p></div>';

    // No-JS / tiles-failed fallback: full linked list grouped by cluster.
    $html .= '<div class="map-list" data-map-list><h3 class="panel-title">All destinations</h3>';
    foreach ($g['clusters'] as $c) {
        $html .= '<h4 class="map-list-cluster">' . bb_e($c['shortName']) . '</h4><ul>';
        foreach ($g['destinations'] as $d) {
            if ($d['clusterId'] !== $c['id']) {
                continue;
            }
            $maps = bb_maps_links($d);
            $html .= '<li><a href="#d-' . bb_e($d['id']) . '">' . bb_e($d['name']) . '</a>'
                   . '<span class="map-list-links">' . bb_ext_link($maps['apple'], 'Apple') . bb_ext_link($maps['google'], 'Google') . '</span></li>';
        }
        $html .= '</ul>';
    }
    $html .= '</div></section>';
    return $html;
}

function bb_view_transit(): string
{
    $t = bb_guide()['transit'];

    $html  = '<section class="view" id="transit" aria-labelledby="transit-title" data-view="transit">';
    $html .= '<header class="view-head"><h2 id="transit-title">Transit</h2>'
           . '<p class="view-lede">' . bb_e($t['headline']) . '</p></header>';
    $html .= '<p class="transit-intro">' . bb_e($t['intro']) . '</p>';

    $html .= '<div class="gateways">';
    foreach ($t['gateways'] as $gw) {
        $html .= '<article class="gateway line-' . bb_e($gw['lineColor']) . '">'
               . '<header class="gateway-head"><span class="line-dot" aria-hidden="true"></span>'
               . '<div><h3>' . bb_e($gw['name']) . '</h3><p class="gateway-line">' . bb_e($gw['line']) . '</p></div></header>'
               . '<p class="gateway-walk">' . bb_e($gw['walk']) . '</p>'
               . '<h4 class="panel-sub">Best for</h4><ul class="gateway-best">';
        foreach ($gw['bestFor'] as $b) {
            $html .= '<li>' . bb_e($b) . '</li>';
        }
        $html .= '</ul>' . bb_ext_link($gw['url'], $gw['name'] . ' station info') . '</article>';
    }
    $html .= '</div>';

    $html .= '<div class="card-panel"><h3 class="panel-title">Inbound vs. outbound</h3><p>' . bb_e($t['inboundOutbound']) . '</p></div>';

    $html .= '<div class="card-panel"><h3 class="panel-title">Paying &amp; planning</h3><ul class="plain-list">';
    foreach ($t['payment'] as $p) {
        $html .= '<li>' . bb_e($p) . '</li>';
    }
    $html .= '</ul></div>';

    $html .= '<div class="card-panel"><h3 class="panel-title">Family rules of the T</h3><ol class="rules-list">';
    foreach ($t['rules'] as $r) {
        $html .= '<li><strong>' . bb_e($r['title']) . '</strong> ' . bb_e($r['copy']) . '</li>';
    }
    $html .= '</ol></div>';

    $html .= '<div class="matrix-wrap"><h3 class="panel-title">Travel-time planner from home base</h3>'
           . '<p class="matrix-note">' . bb_e($t['matrixNote']) . '</p>'
           . '<div class="table-scroll"><table class="matrix"><thead><tr><th scope="col">Destination</th><th scope="col">Best default route</th><th scope="col">Range</th><th scope="col">Notes</th></tr></thead><tbody>';
    foreach ($t['matrix'] as $row) {
        $html .= '<tr><th scope="row">' . bb_e($row['destination']) . '</th><td>' . bb_e($row['route']) . '</td>'
               . '<td class="num">' . bb_e($row['range']) . '</td><td>' . bb_e($row['note']) . '</td></tr>';
    }
    $html .= '</tbody></table></div></div>';

    $html .= '<div class="transit-links"><h3 class="panel-title">Live links</h3><div class="dest-links">';
    foreach ($t['links'] as $l) {
        $html .= bb_ext_link($l['url'], $l['label']);
    }
    $html .= '</div></div>';

    $html .= '<p class="verdict card-panel"><strong>No-car verdict:</strong> ' . bb_e($t['verdict']) . '</p>';
    $html .= '</section>';
    return $html;
}

function bb_view_saved(): string
{
    $html  = '<section class="view" id="saved" aria-labelledby="saved-title" data-view="saved">';
    $html .= '<header class="view-head"><h2 id="saved-title">Saved</h2>'
           . '<p class="view-lede">Favorites, finished adventures, notes, and each traveler’s pick — kept on this device.</p></header>';

    $html .= '<noscript><p class="card-panel">Saving favorites needs JavaScript. Everything in the guide is still fully readable from the other tabs.</p></noscript>';

    $html .= '<div data-saved-app hidden>';
    $html .= '<div class="saved-summary card-panel" data-saved-summary></div>';
    $html .= '<div class="saved-groups">'
           . '<section aria-labelledby="saved-h-picks"><h3 class="panel-title" id="saved-h-picks">Family picks</h3><div data-picks-list class="saved-list"></div></section>'
           . '<section aria-labelledby="saved-h-fav"><h3 class="panel-title" id="saved-h-fav">♥ Saved for the trip</h3><div data-fav-list class="saved-list"></div></section>'
           . '<section aria-labelledby="saved-h-done"><h3 class="panel-title" id="saved-h-done">✓ We did this</h3><div data-done-list class="saved-list"></div></section>'
           . '</div>';
    $html .= '<div class="saved-tools card-panel"><h3 class="panel-title">Tools</h3>'
           . '<div class="tool-row">'
           . '<button type="button" class="btn" data-print-shortlist>Print our shortlist</button>'
           . '<button type="button" class="btn" data-share-page>Share this guide</button>'
           . '<button type="button" class="btn danger" data-reset-data>Reset local trip data</button>'
           . '</div>'
           . '<p class="tools-note">Saved state lives only in this browser on this device — nothing syncs to a server. “Reset” clears favorites, completions, notes, picks, and memory-page answers.</p>'
           . '</div>';
    $html .= '</div></section>';
    return $html;
}

function bb_sources_section(): string
{
    $g = bb_guide();
    $html  = '<section class="sources" id="sources" aria-labelledby="sources-title">';
    $html .= '<details><summary><h2 id="sources-title">Source notes</h2></summary><div>';
    $html .= '<p class="sources-note">Verified ' . bb_e($g['meta']['verificationDate']) . '. Time-sensitive details—schedules, tickets, hours, transit—should be reconfirmed via each listing’s official link.</p><ol class="source-list">';
    foreach ($g['sources'] as $s) {
        if (!empty($s['private'])) {
            $html .= '<li value="' . (int) $s['n'] . '">Private routing reference (withheld from the published guide).</li>';
            continue;
        }
        $html .= '<li value="' . (int) $s['n'] . '">' . bb_e($s['label']) . ' — <a href="' . bb_e($s['url']) . '" target="_blank" rel="noopener" aria-label="Source ' . (int) $s['n'] . ' (opens in new window)">' . bb_e(parse_url($s['url'], PHP_URL_HOST)) . '</a></li>';
    }
    $html .= '</ol></div></details></section>';
    return $html;
}

// ─── Page ───────────────────────────────────────────────────────────────────

function bb_render_app(string $user): void
{
    $g    = bb_guide();
    $meta = $g['meta'];
    ?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F6F1E7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16202A" media="(prefers-color-scheme: dark)">
<meta name="description" content="A private family field guide to Medford, Cambridge, and Boston.">
<title><?= bb_e($meta['title']) ?> · <?= bb_e($meta['region']) ?></title>
<link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="vendor/leaflet/leaflet.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="topbar">
  <a class="brand" href="#home"><?= bb_jumbo_mark('jumbo-mark brand-mark') ?><span class="brand-name"><?= bb_e($meta['title']) ?></span></a>
  <div class="topbar-tools">
    <button type="button" class="btn print-btn" onclick="window.print()"><span class="print-label-long">Print or Save as PDF</span><span class="print-label-short" aria-hidden="true">Print / PDF</span></button>
    <form method="post" action="" class="signout-form"><input type="hidden" name="action" value="signout">
      <button type="submit" class="btn quiet" title="Signed in as <?= bb_e($user) ?>">Sign out</button></form>
  </div>
</header>

<main id="main">
<h1 class="visually-hidden"><?= bb_e($meta['title']) ?> — <?= bb_e($meta['subtitle']) ?></h1>
<?php
    echo bb_view_home();
    echo bb_view_explore();
    echo bb_view_map();
    echo bb_view_transit();
    echo bb_view_saved();
?>
</main>

<nav class="tabbar" aria-label="Primary">
  <ul>
    <li><a href="#home" data-tab="home" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5M6 10v9h4.5v-5h3v5H18v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Home</span></a></li>
    <li><a href="#explore" data-tab="explore"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 8.5-2 5-5 2 2-5Z" fill="currentColor"/></svg><span>Explore</span></a></li>
    <li><a href="#map" data-tab="map"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2Zm0 0v14m6-12v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Map</span></a></li>
    <li><a href="#transit" data-tab="transit"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 10.5h14M8.5 20.5 7 22m8.5-1.5L17 22M8.8 14.5h.01m6.4 0h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Transit</span></a></li>
    <li><a href="#saved" data-tab="saved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span>Saved</span></a></li>
  </ul>
</nav>

<footer class="site-foot">
  <?= bb_sources_section() ?>
  <p class="check-note"><strong>Check before heading out:</strong> <?= bb_e(preg_replace('/^Check before heading out:\s*/', '', $meta['footerNote'])) ?></p>
  <div class="closing">
    <p class="closing-line"><?= bb_e($meta['closingLine']) ?></p>
    <p class="closing-footer"><?= bb_e($meta['closingFooter']) ?></p>
    <?= bb_footprints() ?>
  </div>
</footer>

<div class="toast" data-toast role="status" aria-live="polite"></div>
<script type="application/json" id="bb-travelers"><?= json_encode(array_map(
    fn ($t) => ['id' => $t['id'], 'emoji' => $t['emoji'], 'pickLabel' => $t['pickLabel']],
    $g['travelers']
), JSON_UNESCAPED_UNICODE) ?></script>
<script type="module" src="js/app.js"></script>
</body>
</html>
<?php
}
