/* GTA 6 Clipper — interactive replay of the per-word subtitle events.
   The five events below are verbatim from incoming/_black_render.ass (the
   script the black-frame pixel gate renders); the stage mirrors the real
   1080x1920 canvas: facecam strip 38%, subtitles at 25% from the bottom. */
(function () {
  var mount = document.getElementById('subs-mount');
  if (!mount) return;

  var events = [
    { t0: 0.50, t1: 1.00, burst: 0, word: 0, label: 'THIS',    time: '0:00.50 \u2192 0:01.00' },
    { t0: 1.00, t1: 1.50, burst: 0, word: 1, label: 'IS',      time: '0:01.00 \u2192 0:01.50' },
    { t0: 1.50, t1: 2.15, burst: 0, word: 2, label: 'INSANE!', time: '0:01.50 \u2192 0:02.15' },
    { t0: 2.20, t1: 2.70, burst: 1, word: 0, label: 'NO',      time: '0:02.20 \u2192 0:02.70' },
    { t0: 2.70, t1: 3.35, burst: 1, word: 1, label: 'WAY!',    time: '0:02.70 \u2192 0:03.35' }
  ];
  var bursts = [['THIS', 'IS', 'INSANE!'], ['NO', 'WAY!']];
  var CYCLE = 5.2;

  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

  var wrap = el('div', 'subs-wrap');
  var stage = el('div', 'subs-stage');
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'Looping replay of the burned-in per-word subtitles: THIS IS INSANE! then NO WAY!, one word highlighted per window.');

  var strip = el('div', 'subs-strip');
  var stripLbl = el('span');
  stripLbl.textContent = 'facecam strip · 38%';
  strip.appendChild(stripLbl);

  var area = el('div', 'subs-area');
  var lineSpans = [];
  var lines = [];
  bursts.forEach(function (words) {
    var line = el('p', 'subs-line');
    var spans = words.map(function (w, i) {
      var s = el('span', 'w');
      s.textContent = w;
      line.appendChild(s);
      if (i < words.length - 1) line.appendChild(document.createTextNode(' '));
      return s;
    });
    lineSpans.push(spans);
    lines.push(line);
    area.appendChild(line);
  });

  stage.appendChild(strip);
  stage.appendChild(area);

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

  wrap.appendChild(stage);
  wrap.appendChild(col);
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

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { state(1); return; } /* static frame: "THIS IS INSANE!" with IS lit */

  var start = performance.now();
  function tick(now) {
    var t = ((now - start) / 1000) % CYCLE;
    var active = -1;
    for (var i = 0; i < events.length; i++) {
      if (t >= events[i].t0 && t < events[i].t1) { active = i; }
    }
    state(active);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
