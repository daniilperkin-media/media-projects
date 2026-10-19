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
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'Looping replay of one clip\'s captions self-restyling across the six presets');

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
  var eventWrap = el('p', 'caps-event');
  var eventLabel = el('span', 'caps-event-label');
  eventLabel.textContent = 'the event, as the engine generates it';
  var eventCode = el('code', 'caps-code');
  eventWrap.appendChild(eventLabel);
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

  function stageScale() { return (stage.clientHeight || 462) / 288; } /* PlayResY 288 */

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
      curBlock = null;
      curActive = -2;
      return;
    }
    line.style.visibility = 'visible';
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

  setPreset('default');

  if (reduce) { /* static frame: "…sixth use case…" with sixth lit */
    curT = 2.1;
    render(true);
    return;
  }

  window.addEventListener('resize', function () {
    applyStage(PRESETS[curId]);
  });

  var t0 = null;
  function tick(now) {
    if (t0 === null) { t0 = now; }
    curT = ((now - t0) / 1000) % CYCLE;
    prog.style.transform = 'scaleX(' + (curT / CYCLE).toFixed(4) + ')';
    render(false);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
