/* GTA 6 Clipper — interactive widgets.
   1) The per-word subtitle replay: the five events are verbatim from
      incoming/_black_render.ass (the script the black-frame pixel gate renders);
      the stage mirrors the 1080x1920 canvas: facecam 38%, subtitles at 25% from
      the bottom. 2) The judge chain: Gemini -> OpenRouter -> heuristic, with
      key-loss scenarios. */
(function () {
  'use strict';

  function el(tag, cls) { var n = document.createElement(tag); if (cls) { n.className = cls; } return n; }

  /* ---------- 1. subtitle replay ---------- */
  var mount = document.getElementById('subs-mount');
  if (mount) {
    var events = [
      { t0: 0.50, t1: 1.00, burst: 0, word: 0, label: 'THIS',    time: '0:00.50 \u2192 0:01.00' },
      { t0: 1.00, t1: 1.50, burst: 0, word: 1, label: 'IS',      time: '0:01.00 \u2192 0:01.50' },
      { t0: 1.50, t1: 2.15, burst: 0, word: 2, label: 'INSANE!', time: '0:01.50 \u2192 0:02.15' },
      { t0: 2.20, t1: 2.70, burst: 1, word: 0, label: 'NO',      time: '0:02.20 \u2192 0:02.70' },
      { t0: 2.70, t1: 3.35, burst: 1, word: 1, label: 'WAY!',    time: '0:02.70 \u2192 0:03.35' }
    ];
    var bursts = [['THIS', 'IS', 'INSANE!'], ['NO', 'WAY!']];
    var CYCLE = 5.2;

    var wrap = el('div', 'subs-wrap');
    var stage = el('div', 'subs-stage');
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', 'Looping replay of the burned-in per-word subtitles: THIS IS INSANE! then NO WAY!, one word highlighted per window.');

    var face = el('div', 'subs-face');
    var faceTag = el('span', 'subs-tag'); faceTag.textContent = 'facecam \u00b7 38%';
    var rec = el('span', 'subs-rec');
    var recDot = el('i'); recDot.setAttribute('aria-hidden', 'true');
    rec.appendChild(recDot); rec.appendChild(document.createTextNode('REC'));
    face.appendChild(faceTag); face.appendChild(rec);

    var game = el('div', 'subs-game'); game.setAttribute('aria-hidden', 'true');
    var gameTag = el('span', 'subs-tag game'); gameTag.textContent = 'gameplay slice \u00b7 1080\u00d71152';
    game.appendChild(gameTag);

    var area = el('div', 'subs-area');
    var lineSpans = [];
    var lines = [];
    bursts.forEach(function (words) {
      var line = el('p', 'subs-line');
      var spans = words.map(function (w, i) {
        var s = el('span', 'w');
        s.textContent = w;
        line.appendChild(s);
        if (i < words.length - 1) { line.appendChild(document.createTextNode(' ')); }
        return s;
      });
      lineSpans.push(spans);
      lines.push(line);
      area.appendChild(line);
    });

    var hud = el('div', 'subs-hud');
    var timeEl = el('span', 'subs-time'); timeEl.textContent = '0:00.00';
    var safe = el('button', 'subs-safe'); safe.type = 'button'; safe.textContent = 'safe area'; safe.setAttribute('aria-pressed', 'false');
    safe.addEventListener('click', function () {
      var on = stage.classList.toggle('safe');
      safe.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    hud.appendChild(timeEl); hud.appendChild(safe);

    stage.appendChild(face); stage.appendChild(game); stage.appendChild(area); stage.appendChild(hud);

    var col = el('div', 'subs-events');
    var title = el('p', 'ev-title');
    title.innerHTML = 'Dialogue events \u2014 <code>incoming/_black_render.ass</code>';
    col.appendChild(title);
    var rows = events.map(function (e) {
      var row = el('div', 'ev');
      var t = el('span', 't'); t.textContent = e.time;
      var w = el('span', 'w'); w.textContent = e.label;
      row.appendChild(t); row.appendChild(w);
      col.appendChild(row);
      return row;
    });

    wrap.appendChild(stage); wrap.appendChild(col);
    mount.appendChild(wrap);

    function state(active) {
      lines.forEach(function (l) { l.classList.remove('show'); });
      lineSpans.forEach(function (spans) { spans.forEach(function (s) { s.classList.remove('on'); }); });
      rows.forEach(function (r) { r.classList.remove('on'); });
      if (active >= 0) {
        var e = events[active];
        lines[e.burst].classList.add('show');
        lineSpans[e.burst][e.word].classList.add('on');
        rows[active].classList.add('on');
      }
    }
    function fmt(t) {
      var s = Math.floor(t);
      var cs = Math.floor((t - s) * 100);
      return '0:' + (s < 10 ? '0' : '') + s + '.' + (cs < 10 ? '0' : '') + cs;
    }

    var reduceSubs = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceSubs) {
      state(1);
      timeEl.textContent = '0:01.25';
    } else {
      var start = performance.now();
      function tick(now) {
        var t = ((now - start) / 1000) % CYCLE;
        var active = -1;
        for (var i = 0; i < events.length; i++) {
          if (t >= events[i].t0 && t < events[i].t1) { active = i; }
        }
        state(active);
        timeEl.textContent = fmt(t);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  /* ---------- 2. judge chain ---------- */
  var jm = document.getElementById('judge-mount');
  if (jm) {
    var engines = [
      { id: 'gemini', name: 'Gemini 2.5 Flash', role: 'primary', meta: 'gemini-2.5-flash \u00b7 ~1.4 s' },
      { id: 'openrouter', name: 'OpenRouter gpt-4o-mini', role: 'fallback', meta: 'openai/gpt-4o-mini \u00b7 ~1.1 s' },
      { id: 'heuristic', name: 'Heuristic scorer', role: 'last resort', meta: 'local \u00b7 zero keys \u00b7 ~0.02 s' }
    ];
    var scenarios = [
      { id: 'all', label: 'All keys armed', active: 'gemini', skipped: [], score: 87, verdict: 'POST', note: 'Gemini 2.5 Flash answers.' },
      { id: 'no-gemini', label: 'Gemini key missing', active: 'openrouter', skipped: ['gemini'], score: 81, verdict: 'POST', note: 'OpenRouter takes over.' },
      { id: 'no-keys', label: 'No API keys', active: 'heuristic', skipped: ['gemini', 'openrouter'], score: 74, verdict: 'POST', note: 'The local heuristic ships it.' }
    ];
    var cur = scenarios[0];

    var judge = el('div', 'judge');
    var controls = el('div', 'judge-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Judge chain scenario');
    var controlBtns = scenarios.map(function (s) {
      var b = el('button');
      b.type = 'button';
      b.textContent = s.label;
      b.setAttribute('data-scenario', s.id);
      b.addEventListener('click', function () { setScenario(s); });
      controls.appendChild(b);
      return b;
    });

    var body = el('div', 'judge-body');
    var chain = el('div', 'judge-chain');
    var cards = {};
    engines.forEach(function (e, i) {
      var card = el('div', 'judge-card');
      card.setAttribute('data-engine', e.id);
      var role = el('span', 'jc-role'); role.textContent = e.role;
      var name = el('span', 'jc-name'); name.textContent = e.name;
      var meta = el('span', 'jc-meta'); meta.textContent = e.meta;
      var stateEl = el('span', 'jc-state'); stateEl.textContent = 'standby';
      card.appendChild(role); card.appendChild(name); card.appendChild(meta); card.appendChild(stateEl);
      cards[e.id] = { card: card, state: stateEl };
      chain.appendChild(card);
      if (i < engines.length - 1) {
        var ar = el('span', 'judge-arrow');
        ar.setAttribute('aria-hidden', 'true');
        ar.textContent = '\u2192';
        chain.appendChild(ar);
      }
    });

    var verdict = el('div', 'judge-verdict');
    var ring = el('div', 'judge-ring');
    var scoreB = el('b'); scoreB.textContent = '0';
    var scoreS = el('span'); scoreS.textContent = '/100';
    ring.appendChild(scoreB); ring.appendChild(scoreS);
    var label = el('p', 'jv-label'); label.textContent = 'POST';
    var note = el('p', 'jv-note'); note.textContent = ''; note.setAttribute('aria-live', 'polite');
    verdict.appendChild(ring); verdict.appendChild(label); verdict.appendChild(note);

    body.appendChild(chain); body.appendChild(verdict);
    var foot = el('p', 'judge-foot');
    foot.textContent = 'The pipeline never blocks on a missing key \u2014 it degrades to the next judge and still writes the export.';
    judge.appendChild(controls); judge.appendChild(body); judge.appendChild(foot);
    jm.appendChild(judge);

    var reduceJudge = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animId = null;

    function setScore(n) {
      if (reduceJudge) {
        scoreB.textContent = n;
        ring.style.setProperty('--p', n);
        return;
      }
      var from = parseInt(scoreB.textContent, 10) || 0;
      var t0 = null;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      function step(ts) {
        if (t0 === null) { t0 = ts; }
        var p = Math.min(1, (ts - t0) / 700);
        var e = 1 - Math.pow(1 - p, 3);
        var v = Math.round(from + (n - from) * e);
        scoreB.textContent = v;
        ring.style.setProperty('--p', v);
        if (p < 1) {
          animId = requestAnimationFrame(step);
        } else {
          scoreB.textContent = n;
          ring.style.setProperty('--p', n);
          animId = null;
        }
      }
      animId = requestAnimationFrame(step);
    }
    function setScenario(s) {
      cur = s;
      controlBtns.forEach(function (b) {
        var on = b.getAttribute('data-scenario') === s.id;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      engines.forEach(function (e) {
        var c = cards[e.id];
        var skipped = s.skipped.indexOf(e.id) !== -1;
        var active = s.active === e.id;
        c.card.classList.toggle('on', active);
        c.card.classList.toggle('off', skipped);
        c.state.textContent = active ? 'active judge' : (skipped ? 'key missing \u00b7 skipped' : 'standby');
      });
      label.textContent = s.verdict;
      note.textContent = s.note;
      setScore(s.score);
    }
    setScenario(cur);
  }
})();
