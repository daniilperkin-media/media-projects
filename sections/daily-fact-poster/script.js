/* Daily Fact Poster — section behaviour.
   1. The rundown: replay the verified 55.0 s run (real log timings) on a scrubber.
   2. The carousel: advance the four real cards at the export's 2.5 s cadence,
      with a measured layout-spec overlay.
   3. Run modes: show what each CLI mode actually builds, posts and records.
   Everything is progressive: without JS the markup still reads. */
(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var root = document.getElementById('daily-fact-poster');
  if (!root) { return; }

  /* ── 1. the rundown ─────────────────────────────────────────────────── */
  var desk = document.getElementById('dfp-rundown');
  if (desk) {
    var STAGES = [
      { id: 'history', start: 0,  end: 0,  meta: '0.0 s · instant' },
      { id: 'script',  start: 0,  end: 4,  meta: '4.0 s · GPT-4o-mini' },
      { id: 'imagery', start: 4,  end: 39, meta: '35.0 s · 4 renders' },
      { id: 'video',   start: 39, end: 40, meta: '1.0 s · FFmpeg' },
      { id: 'caption', start: 40, end: 40, meta: '0.0 s · instant' },
      { id: 'publish', start: 40, end: 55, meta: '15.0 s · inbox' }
    ];
    var TOTAL = 55;
    var steps = [].slice.call(desk.querySelectorAll('.dfp-step'));
    var panels = [].slice.call(desk.querySelectorAll('.dfp-panel'));
    var kicker = document.getElementById('dfp-mon-kicker');
    var metaEl = document.getElementById('dfp-mon-meta');
    var clock = document.getElementById('dfp-clock');
    var scrub = document.getElementById('dfp-scrub');
    var playBtn = document.getElementById('dfp-play');
    var t = 0, playing = false, forced = null, raf = null, last = 0;

    function stageAt(sec) {
      if (sec <= 0) { return 'history'; }
      if (sec < 4) { return 'script'; }
      if (sec < 39) { return 'imagery'; }
      if (sec < 40) { return 'video'; }
      return 'publish';
    }
    function stageById(id) {
      for (var i = 0; i < STAGES.length; i++) { if (STAGES[i].id === id) { return STAGES[i]; } }
      return STAGES[0];
    }
    function fmt(sec) {
      var m = Math.floor(sec / 60), s = sec - m * 60;
      return ('0' + m).slice(-2) + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
    }
    function render() {
      var active = forced || stageAt(t);
      var stage = stageById(active);
      for (var i = 0; i < steps.length; i++) {
        var st = stageById(steps[i].getAttribute('data-stage'));
        steps[i].classList.toggle('on', st.id === active);
        steps[i].classList.toggle('done', t >= st.end && st.id !== active);
      }
      for (var j = 0; j < panels.length; j++) {
        panels[j].classList.toggle('on', panels[j].getAttribute('data-panel') === active);
      }
      kicker.textContent = 'STAGE ' + ('0' + (STAGES.indexOf(stage) + 1)).slice(-2) + ' · ' + stage.id.toUpperCase();
      metaEl.textContent = stage.meta;
      clock.textContent = fmt(t);
      scrub.value = String(t);
      playBtn.setAttribute('aria-label', playing ? 'Pause the rundown replay' : (t >= TOTAL ? 'Replay the rundown' : 'Play the rundown at eight times speed'));
      playBtn.innerHTML = playing ? '<span aria-hidden="true">&#10074;&#10074;</span> Pause' : (t >= TOTAL ? '<span aria-hidden="true">&#8635;</span> Replay' : '<span aria-hidden="true">&#9654;</span> Play 8&times;');
    }
    function stop() {
      playing = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    function tick(ts) {
      if (!playing) { return; }
      if (!last) { last = ts; }
      var dt = Math.min(0.25, (ts - last) / 1000);
      last = ts;
      t = Math.min(TOTAL, t + dt * 8);
      forced = null;
      render();
      if (t >= TOTAL) { stop(); render(); return; }
      raf = requestAnimationFrame(tick);
    }
    function play() {
      if (reduce) {
        /* no animated replay for reduced-motion users: step to the next stage */
        var order = STAGES.map(function (s) { return s.end; });
        var next = TOTAL;
        for (var i = 0; i < order.length; i++) { if (order[i] > t + 0.01) { next = order[i]; break; } }
        t = next; forced = null; render();
        return;
      }
      if (t >= TOTAL) { t = 0; }
      playing = true; last = 0; render();
      raf = requestAnimationFrame(tick);
    }
    playBtn.addEventListener('click', function () { if (playing) { stop(); render(); } else { play(); } });
    scrub.addEventListener('input', function () { stop(); t = parseFloat(scrub.value) || 0; forced = null; render(); });
    for (var s = 0; s < steps.length; s++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          stop();
          t = parseFloat(btn.getAttribute('data-at')) || 0;
          forced = btn.getAttribute('data-stage');
          render();
        });
      })(steps[s]);
    }
    render();
  }

  /* ── 2. the carousel + spec overlay ────────────────────────────────── */
  var phone = document.getElementById('dfp-phone');
  var statusEl = document.getElementById('dfp-status');
  if (phone) {
    var imgs = phone.querySelectorAll('img');
    var dots = root.querySelectorAll('.dfp-dots button');
    var rail = root.querySelectorAll('.dfp-rail button');
    var LABELS = ['Slide 1 of 4 — title card', 'Slide 2 of 4 — fact slide, the extremes', 'Slide 3 of 4 — fact slide, the ISS', 'Slide 4 of 4 — closing call to action'];
    var i = 0;
    var timer = null;

    function show(n) {
      i = (n + imgs.length) % imgs.length;
      for (var k = 0; k < imgs.length; k++) {
        imgs[k].classList.toggle('on', k === i);
        if (dots[k]) { dots[k].classList.toggle('on', k === i); }
        if (rail.length === imgs.length) { rail[k].classList.toggle('on', k === i); }
      }
      if (statusEl) { statusEl.textContent = LABELS[i]; }
    }
    function stopCarousel() { if (timer) { clearInterval(timer); timer = null; } }
    function startCarousel() {
      stopCarousel();
      if (reduce) { return; }
      timer = setInterval(function () { show(i + 1); }, 2500);
    }
    function bind(btns) {
      for (var k = 0; k < btns.length; k++) {
        (function (n) {
          btns[n].addEventListener('click', function () { show(n); startCarousel(); });
        })(k);
      }
    }

    bind(dots);
    if (rail.length === imgs.length) { bind(rail); }
    show(0);
    if (!reduce) {
      startCarousel();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { startCarousel(); } else { stopCarousel(); } });
        }, { threshold: 0.2 }).observe(phone);
      }
    }

    var specBtn = document.getElementById('dfp-specbtn');
    if (specBtn) {
      specBtn.addEventListener('click', function () {
        var on = phone.classList.toggle('specs');
        specBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        specBtn.textContent = on ? 'Hide layout specs' : 'Show layout specs';
      });
    }
  }

  /* ── 3. run-mode simulator ─────────────────────────────────────────── */
  var modesEl = document.getElementById('dfp-modes');
  if (modesEl) {
    var MODES = {
      dry: {
        cmd: 'python main.py --dry-run', build: true, post: false, hist: false, clip: true,
        note: 'Full pipeline, nothing posted — and the run returns before history is written, so the topic stays available for a real run.'
      },
      local: {
        cmd: 'python main.py --no-tiktok', build: true, post: false, hist: true, clip: true,
        note: 'Builds everything and skips TikTok entirely; the topic is still recorded, so the next run will not repeat it.'
      },
      post: {
        cmd: 'python main.py', build: true, post: true, hist: true, clip: true,
        note: 'Generates and posts. Draft-to-inbox is the default delivery; Direct Post is the fallback and, while the client is unaudited, only reaches a private account.'
      }
    };
    var segs = [].slice.call(modesEl.querySelectorAll('.dfp-seg button'));
    var cmdEl = document.getElementById('dfp-cmd');
    var noteEl = document.getElementById('dfp-modenote');
    var rows = [].slice.call(modesEl.querySelectorAll('.dfp-matrix li'));

    function setMode(id) {
      var m = MODES[id] || MODES.dry;
      for (var i2 = 0; i2 < segs.length; i2++) { segs[i2].classList.toggle('on', segs[i2].getAttribute('data-mode') === id); }
      cmdEl.textContent = m.cmd;
      noteEl.textContent = m.note;
      for (var j = 0; j < rows.length; j++) {
        var k = rows[j].getAttribute('data-k');
        var yes = !!m[k];
        rows[j].classList.toggle('yes', yes);
        rows[j].classList.toggle('no', !yes);
        rows[j].querySelector('b').textContent = yes ? 'yes' : 'no';
      }
    }
    for (var q = 0; q < segs.length; q++) {
      (function (btn) {
        btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
      })(segs[q]);
    }
    setMode('dry');
  }
})();
