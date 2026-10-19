/* OpenShorts — karaoke caption replay for the media-projects site.
   Words: verbatim (original case) from output/rebuild_job4 clip 1's transcript —
   the same words the production burn used (the default-preset ASS on disk is
   170 dialogue events over 52.32 s; this replays the first 22 words / 6.48 s).
   Preset values and the caption-block rules (max_chars, 1.4 s max duration)
   mirror subtitles.py CAPTION_PRESETS / _collect_word_blocks.
   v2: the six looks are a vertical preset list; the generated event card pins
   to the stage's floor line; a hairline shows the replay loop's progress. */
(function () {
  var mount = document.getElementById('caps-mount');
  if (!mount) return;

  var words = [
    { w: 'using', s: 0, e: 0.32 },
    { w: 'cod', s: 0.32, e: 0.6 },
    { w: 'code', s: 0.6, e: 0.94 },
    { w: 'in', s: 0.94, e: 1.24 },
    { w: 'and', s: 1.24, e: 1.68 },
    { w: 'maybe', s: 1.68, e: 1.84 },
    { w: 'the', s: 1.84, e: 2.02 },
    { w: 'sixth', s: 2.02, e: 2.32 },
    { w: 'use', s: 2.32, e: 2.54 },
    { w: 'case', s: 2.54, e: 2.76 },
    { w: 'would', s: 2.76, e: 2.94 },
    { w: 'be', s: 2.94, e: 3.08 },
    { w: 'coding', s: 3.08, e: 3.36 },
    { w: 'obviously', s: 3.36, e: 3.74 },
    { w: 'right', s: 3.74, e: 4.12 },
    { w: 'so', s: 4.12, e: 4.56 },
    { w: 'depending', s: 4.56, e: 4.84 },
    { w: 'on', s: 4.84, e: 5.14 },
    { w: 'what', s: 5.14, e: 5.36 },
    { w: "i'm", s: 5.36, e: 5.66 },
    { w: 'actually', s: 5.66, e: 6.04 },
    { w: 'saying', s: 6.04, e: 6.48 }
  ];

  var PRESETS = {
    default: { font: "'Anton','Arial Black',sans-serif", weight: 400, size: 44, hl: '#FFE500', effect: 'pop', upper: true, reveal: false, maxChars: 16, border: 4, shadow: 0, base: 1 },
    hormozi: { font: "'Montserrat ExtraBold','Segoe UI',sans-serif", weight: 800, size: 44, hl: '#FFE500', effect: 'pop', upper: true, reveal: true, maxChars: 9, border: 4, shadow: 2, base: 1 },
    pill: { font: "'Montserrat ExtraBold','Segoe UI',sans-serif", weight: 800, size: 44, hl: '#7C3AED', effect: 'highlight', upper: true, reveal: false, maxChars: 9, border: 3, shadow: 0, base: 1 },
    lime: { font: "'Montserrat ExtraBold','Segoe UI',sans-serif", weight: 800, size: 44, hl: '#A3FF12', effect: 'highlight', upper: true, reveal: false, maxChars: 9, border: 3, shadow: 0, base: 1 },
    oneword: { font: "'Anton','Arial Black',sans-serif", weight: 400, size: 70, hl: '#FFFFFF', effect: 'pop', upper: true, reveal: false, maxChars: 1, border: 5, shadow: 0, base: 1 },
    clean: { font: "'Montserrat ExtraBold','Segoe UI',sans-serif", weight: 800, size: 34, hl: '#FFFFFF', effect: 'none', upper: false, reveal: false, maxChars: 12, border: 0, shadow: 2, base: 0.7 }
  };
  var ORDER = ['default', 'hormozi', 'pill', 'lime', 'oneword', 'clean'];
  var SPECS = {
    default: 'Anton 44 · pop #FFE500 · up to 16 chars per line',
    hormozi: 'Montserrat 44 · reveals words as spoken · up to 9 chars',
    pill: 'Montserrat 44 · box #7C3AED behind the active word',
    lime: 'Montserrat 44 · box #A3FF12 · black text on the box',
    oneword: 'Anton 70 · one single word at a time',
    clean: 'Montserrat 34 · sentence case · no outline, soft shadow'
  };
  var MAXDUR = 1.4, CYCLE_GAP = 1.7;
  var CYCLE = words[words.length - 1].e + CYCLE_GAP;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function luminance(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  /* the engine dims inactive words by scaling the colour, not alpha */
  function dim(hex, k) {
    var r = Math.round(parseInt(hex.slice(1, 3), 16) * k), g = Math.round(parseInt(hex.slice(3, 5), 16) * k), b = Math.round(parseInt(hex.slice(5, 7), 16) * k);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  /* #RRGGBB -> the &HBBGGRR& body ASS expects */
  function assBgr(hex) {
    return (hex.slice(5, 7) + hex.slice(3, 5) + hex.slice(1, 3)).toUpperCase();
  }
  function assTime(t) {
    var cs = Math.round(t * 100);
    var h = Math.floor(cs / 360000), m = Math.floor(cs / 6000) % 60, s = Math.floor(cs / 100) % 60, c = cs % 100;
    return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2) + '.' + ('0' + c).slice(-2);
  }
  function outlineShadow(r, shadowPx) {
    if (!r) { return shadowPx > 0 ? '0 ' + shadowPx.toFixed(1) + 'px 2px rgba(0,0,0,.6)' : 'none'; }
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.71, 0.71], [-0.71, 0.71], [0.71, -0.71], [-0.71, -0.71]];
    var parts = [];
    [1, 0.66, 0.33].forEach(function (k) {
      var d = Math.max(0.6, r * k);
      dirs.forEach(function (v) { parts.push((v[0] * d).toFixed(1) + 'px ' + (v[1] * d).toFixed(1) + 'px 0 #000'); });
    });
    return parts.join(',');
  }

  /* --- DOM --- */
  var wrap = el('div', 'caps-wrap');
  var stage = el('div', 'caps-stage');
  /* role=group, not img: the transport buttons inside must stay exposed to AT */
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Looping replay of one clip\'s captions self-restyling across the six presets, with play/pause and a scrub bar');

  var bg = el('img', 'caps-bg');
  bg.src = 'sections/openshorts/assets/captions-raw.png';
  bg.alt = '';
  var scrim = el('div', 'caps-scrim');
  var capArea = el('div', 'caps-cap');
  var line = el('p', 'caps-line');
  capArea.appendChild(line);
  var prog = el('i', 'caps-prog');
  stage.appendChild(bg);
  stage.appendChild(scrim);
  stage.appendChild(capArea);
  stage.appendChild(prog);

  /* transport: play/pause + scrub. User-driven motion stays available under
     reduced motion; only the autoplay loop is disabled there. */
  var scrub = el('div', 'caps-scrub');
  var playBtn = el('button', 'caps-play');
  playBtn.type = 'button';
  playBtn.textContent = '\u275A\u275A';
  playBtn.setAttribute('aria-label', 'Pause caption replay');
  var range = el('input');
  range.type = 'range';
  range.min = '0';
  range.max = CYCLE.toFixed(2);
  range.step = '0.01';
  range.value = '0';
  range.setAttribute('aria-label', 'Scrub the 6.48 s caption replay');
  var timeEl = el('span', 'caps-time');
  timeEl.textContent = '0:00.00';
  scrub.appendChild(playBtn);
  scrub.appendChild(range);
  scrub.appendChild(timeEl);
  stage.appendChild(scrub);

  var side = el('div', 'caps-side');
  var list = el('div', 'caps-tabs');
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', 'Caption presets');
  var tabButtons = ORDER.map(function (id) {
    var b = el('button', 'caps-tab');
    b.type = 'button';
    b.setAttribute('data-preset', id);
    var sw = el('span', 'caps-sw');
    sw.style.background = PRESETS[id].hl;
    b.style.setProperty('--sw', PRESETS[id].hl);
    var body = el('span', 'caps-body');
    var name = el('span', 'caps-name');
    name.textContent = id;
    var spec = el('span', 'caps-spec');
    spec.textContent = SPECS[id];
    body.appendChild(name);
    body.appendChild(spec);
    b.appendChild(sw);
    b.appendChild(body);
    b.addEventListener('click', function () { setPreset(id); });
    list.appendChild(b);
    return b;
  });
  var facts = el('div', 'caps-facts');
  var eventWrap = el('div', 'caps-event');
  var eventTop = el('div', 'caps-event-top');
  var eventLabel = el('span', 'caps-event-label');
  eventLabel.textContent = 'the event, as the engine generates it';
  var copyBtn = el('button', 'caps-copy');
  copyBtn.type = 'button';
  copyBtn.textContent = 'copy';
  copyBtn.setAttribute('aria-label', 'Copy the current ASS dialogue event');
  eventTop.appendChild(eventLabel);
  eventTop.appendChild(copyBtn);
  var eventCode = el('code', 'caps-code');
  eventWrap.appendChild(eventTop);
  eventWrap.appendChild(eventCode);
  facts.appendChild(eventWrap);
  side.appendChild(list);
  side.appendChild(facts);
  wrap.appendChild(stage);
  wrap.appendChild(side);
  mount.appendChild(wrap);

  /* --- state --- */
  var curId = 'default';
  var blocks = [];
  var curBlock = null;
  var curActive = -2;
  var curT = 0;
  var playing = !reduce;
  var last = null;

  function stageScale() { return (stage.clientHeight || 462) / 288; } /* PlayResY 288 */

  function fmtTime(t) {
    t = Math.max(0, Math.min(CYCLE, t));
    var m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }
  function syncScrub() {
    range.value = curT.toFixed(2);
    timeEl.textContent = fmtTime(curT);
    range.setAttribute('aria-valuetext', fmtTime(curT) + ' of ' + fmtTime(CYCLE));
  }
  function seek(t) {
    curT = Math.max(0, Math.min(CYCLE, t));
    last = null;
    prog.style.transform = 'scaleX(' + (curT / CYCLE).toFixed(4) + ')';
    render(true);
    syncScrub();
  }

  function setPreset(id) {
    curId = id;
    tabButtons.forEach(function (b, i) { b.setAttribute('aria-pressed', ORDER[i] === id ? 'true' : 'false'); });
    var p = PRESETS[id];
    applyStage(p);
    blocks = groupBlocks(p.maxChars);
    if (!reduce) { /* the caption line re-enters instead of snapping */
      line.classList.remove('swap');
      void line.offsetWidth;
      line.classList.add('swap');
    }
    render(true);
  }

  function applyStage(p) {
    var k = stageScale();
    line.style.fontFamily = p.font;
    line.style.fontWeight = p.weight;
    line.style.fontSize = (p.size * 0.85 * k).toFixed(1) + 'px';
    line.style.textTransform = p.upper ? 'uppercase' : 'none';
    line.style.color = dim('#FFFFFF', p.base); /* font_color is #FFFFFF in every preset */
    line.style.textShadow = outlineShadow(p.border * k, p.shadow * k * 0.9);
    line.style.setProperty('--hl', p.hl);
    line.style.setProperty('--hl-text', luminance(p.hl) > 0.6 ? '#000' : '#fff');
  }

  /* mirrors _collect_word_blocks: current len = sum(len(w)+1); split when
     len + len(word) > max_chars, or the block would run past 1.4 s */
  function groupBlocks(maxChars) {
    var out = [], cur = null, start = 0;
    words.forEach(function (w) {
      if (!cur) { cur = [w]; start = w.s; return; }
      var textLen = 0;
      cur.forEach(function (x) { textLen += x.w.length + 1; });
      if (textLen + w.w.length > maxChars || w.e - start > MAXDUR + 1e-9) {
        out.push({ words: cur, start: start });
        cur = [w];
        start = w.s;
      } else {
        cur.push(w);
      }
    });
    if (cur) { out.push({ words: cur, start: start }); }
    return out;
  }

  function stateAt(t) {
    if (t >= words[words.length - 1].e) { return null; }
    var i = -1;
    for (var k = 0; k < words.length; k++) { if (words[k].s <= t) { i = k; } else { break; } }
    if (i < 0) { return null; }
    for (var b = 0; b < blocks.length; b++) {
      var j = blocks[b].words.indexOf(words[i]);
      if (j > -1) {
        /* one event per word: it runs until the next word starts; the last
           word of a block holds until the block's end */
        var end = j < blocks[b].words.length - 1 ? blocks[b].words[j + 1].s : blocks[b].words[j].e;
        if (t > end + 1e-6) { return null; }
        return { b: b, i: j };
      }
    }
    return null;
  }

  function assEvent(st, p) {
    var blk = blocks[st.b];
    var tagged = blk.words.map(function (w, k) {
      var t = p.upper ? w.w.toUpperCase() : w.w;
      if (k === st.i) {
        if (p.effect === 'pop') { return '{\\c&H' + assBgr(p.hl) + '&\\fscx90\\fscy90\\t(0,110,\\fscx108\\fscy108)}' + t + '{\\r}'; }
        if (p.effect === 'highlight') { return '{\\rActive}' + t + '{\\r}'; }
        return '{\\c&H' + assBgr(p.hl) + '&}' + t + '{\\r}';
      }
      if (p.reveal && k > st.i) { return '{\\alpha&HFF&}' + t + '{\\r}'; }
      return t;
    });
    var start = st.i === 0 ? blk.words[0].s : blk.words[st.i].s;
    var end = st.i < blk.words.length - 1 ? blk.words[st.i + 1].s : blk.words[blk.words.length - 1].e;
    return 'Dialogue: 0,' + assTime(start) + ',' + assTime(end) + ',Default,,0,0,0,,' + tagged.join(' ');
  }

  function render(force) {
    var st = stateAt(curT);
    if (!st) {
      line.style.visibility = 'hidden';
      eventCode.textContent = '\u2014';
      copyBtn.disabled = true;
      curBlock = null;
      curActive = -2;
      return;
    }
    line.style.visibility = 'visible';
    copyBtn.disabled = false;
    var p = PRESETS[curId];
    var blk = blocks[st.b];
    if (force || blk !== curBlock) {
      line.textContent = '';
      blk.words.forEach(function (w) {
        var s = el('span');
        s.textContent = w.w;
        line.appendChild(s);
      });
      curBlock = blk;
      curActive = -2;
    }
    var spans = line.children;
    for (var k = 0; k < spans.length; k++) {
      var want = '';
      if (k === st.i) { want = 'on e-' + p.effect; }
      else if (p.reveal && k > st.i) { want = 'hid'; }
      if (spans[k].className !== want) { spans[k].className = want; }
    }
    curActive = st.i;
    eventCode.textContent = assEvent(st, p);
  }

  /* ---- cut list: 11 proposals across 3 real runs over one 387.374 s source ---- */
  var cutMount = document.getElementById('cut-mount');
  if (cutMount) {
    var SRC = 387.374;
    var RUNS = [
      { id: 'rebuild_gemini', note: 'Gemini', picks: [
        { s: 111, e: 146, t: 'Running AI locally (deliver pick)', file: 'local_video_clip_1.mp4' },
        { s: 29, e: 58, t: 'Defines Claude Mods (deliver pick)', file: 'local_video_clip_2.mp4' },
        { s: 80.5, e: 108.2 },
        { s: 120, e: 159 }
      ] },
      { id: 'rebuild_or', note: 'OpenRouter', picks: [
        { s: 164, e: 206, t: 'OR pick 1 (deliver)', file: 'local_video_clip_1.mp4' },
        { s: 42, e: 72 },
        { s: 73, e: 115, t: 'OR pick 3 (deliver)', file: 'local_video_clip_3.mp4' },
        { s: 120, e: 159 }
      ] },
      { id: 'rebuild_job4', note: 'the rebuild', picks: [
        { s: 210.2, e: 262.5, t: 'job4 pick 1', file: 'local_video_clip_1.mp4', caption: true },
        { s: 112, e: 148, t: 'job4 pick 2', file: 'local_video_clip_2.mp4' },
        { s: 264, e: 312, t: 'job4 pick 3', file: 'local_video_clip_3.mp4' }
      ] }
    ];
    var proposals = 0, renders = 0, renderedSec = 0;
    RUNS.forEach(function (run) {
      run.picks.forEach(function (p) {
        proposals++;
        if (p.file) { renders++; renderedSec += p.e - p.s; }
      });
    });
    function txt(tag, cls, text) { var n = el(tag, cls); n.textContent = text; return n; }
    function clock(t) {
      var m = Math.floor(t / 60), s = t - m * 60;
      return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
    }

    var card = el('div', 'cut-card');
    var head = el('div', 'cut-head');
    var headL = el('div');
    headL.appendChild(txt('p', 'cut-title', 'the source \u00b7 387.374 s \u00b7 3 runs'));
    headL.appendChild(txt('p', 'cut-sub', proposals + ' proposals \u00b7 ' + renders + ' renders \u00b7 ' + renderedSec.toFixed(1) + ' s of shorts'));
    var legend = el('div', 'cut-legend');
    var keyR = el('span', 'cut-key'); keyR.appendChild(el('i')); keyR.appendChild(document.createTextNode('rendered clip'));
    var keyG = el('span', 'cut-key ghost'); keyG.appendChild(el('i')); keyG.appendChild(document.createTextNode('proposal, not rendered'));
    legend.appendChild(keyR); legend.appendChild(keyG);
    head.appendChild(headL); head.appendChild(legend);

    var grid = el('div', 'cut-grid');
    var ruler = el('div', 'cut-ruler');
    ruler.appendChild(txt('span', 'cut-rlabel', 'run'));
    var axis = el('div', 'cut-axis');
    [0, 60, 120, 180, 240, 300, 360].forEach(function (t) {
      var tick = txt('span', 'cut-tick', Math.floor(t / 60) + ':00');
      if (t === 0) { tick.classList.add('start'); }
      tick.style.left = (t / SRC * 100).toFixed(3) + '%';
      axis.appendChild(tick);
    });
    ruler.appendChild(axis);
    grid.appendChild(ruler);

    var detail = el('div', 'cut-detail');
    detail.setAttribute('aria-live', 'polite');
    var dTitle = txt('p', 'cut-d-title', '');
    var dMeta = txt('p', 'cut-d-meta', '');
    var dFacts = txt('p', 'cut-d-facts', '');
    detail.appendChild(dTitle); detail.appendChild(dMeta); detail.appendChild(dFacts);

    var bars = [];
    function select(run, p, bar) {
      bars.forEach(function (b) { b.setAttribute('aria-pressed', b === bar ? 'true' : 'false'); });
      var dur = p.e - p.s;
      if (p.file) {
        dTitle.textContent = p.t;
        dMeta.textContent = clock(p.s) + ' \u2192 ' + clock(p.e) + '  (' + p.s.toFixed(1) + ' \u2192 ' + p.e.toFixed(1) + ' s) \u00b7 ' + dur.toFixed(1) + ' s \u00b7 ' + p.file;
        dFacts.textContent = '606\u00d71080 \u00b7 H.264 High \u00b7 yuv420p \u00b7 bt709' + (p.caption ? ' \u00b7 the clip the caption replay above uses' : '');
      } else {
        dTitle.textContent = 'proposal \u00b7 not rendered';
        dMeta.textContent = clock(p.s) + ' \u2192 ' + clock(p.e) + '  (' + p.s.toFixed(1) + ' \u2192 ' + p.e.toFixed(1) + ' s) \u00b7 ' + dur.toFixed(1) + ' s';
        dFacts.textContent = 'in ' + run.id + '/local_video_metadata.json \u00b7 no clip on disk';
      }
    }

    var defaultBar = null;
    RUNS.forEach(function (run) {
      var row = el('div', 'cut-row');
      var label = el('div', 'cut-label');
      label.appendChild(txt('b', null, run.id));
      label.appendChild(txt('span', null, run.note + ' \u00b7 ' + run.picks.filter(function (p) { return p.file; }).length + '/' + run.picks.length + ' rendered'));
      var track = el('div', 'cut-track');
      run.picks.forEach(function (p) {
        var bar = el('button', 'cut-bar' + (p.file ? '' : ' ghost'));
        bar.type = 'button';
        bar.style.left = (p.s / SRC * 100).toFixed(3) + '%';
        bar.style.width = ((p.e - p.s) / SRC * 100).toFixed(3) + '%';
        bar.setAttribute('aria-pressed', 'false');
        bar.setAttribute('aria-label', (p.file ? p.t : 'proposal, not rendered') + ' \u2014 ' + (p.e - p.s).toFixed(1) + ' s from ' + clock(p.s));
        bar.title = (p.file ? p.t : 'proposal, not rendered') + ' \u00b7 ' + clock(p.s) + '\u2013' + clock(p.e);
        bar.addEventListener('click', function () { select(run, p, bar); });
        bars.push(bar);
        track.appendChild(bar);
        if (p.caption) { defaultBar = { run: run, p: p, bar: bar }; }
      });
      row.appendChild(label); row.appendChild(track); grid.appendChild(row);
    });

    card.appendChild(head); card.appendChild(grid); card.appendChild(detail);
    cutMount.appendChild(card);
    if (defaultBar) { select(defaultBar.run, defaultBar.p, defaultBar.bar); }
  }

  setPreset('default');

  /* transport wiring */
  playBtn.addEventListener('click', function () {
    playing = !playing;
    last = null;
    playBtn.textContent = playing ? '\u275A\u275A' : '\u25B6';
    playBtn.setAttribute('aria-label', playing ? 'Pause caption replay' : 'Play caption replay');
  });
  range.addEventListener('input', function () {
    if (playing) {
      playing = false;
      playBtn.textContent = '\u25B6';
      playBtn.setAttribute('aria-label', 'Play caption replay');
    }
    seek(parseFloat(range.value));
  });
  copyBtn.addEventListener('click', function () {
    var text = eventCode.textContent;
    var done = function () {
      copyBtn.textContent = 'copied';
      setTimeout(function () { copyBtn.textContent = 'copy'; }, 1200);
    };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  });

  window.addEventListener('resize', function () { applyStage(PRESETS[curId]); });

  if (reduce) { /* static frame: "…sixth use case…" with sixth lit */
    playing = false;
    seek(2.1);
  } else {
    requestAnimationFrame(tick);
  }

  function tick(now) {
    if (playing) {
      if (last === null) { last = now; }
      curT = (curT + (now - last) / 1000) % CYCLE;
      last = now;
      prog.style.transform = 'scaleX(' + (curT / CYCLE).toFixed(4) + ')';
      render(false);
      syncScrub();
    } else {
      last = now;
    }
    requestAnimationFrame(tick);
  }
})();
