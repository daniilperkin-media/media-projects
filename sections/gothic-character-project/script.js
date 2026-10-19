/* Gothic Character Project — section widgets.
   1) the character bible, enforced: canonical markers + an editable prompt with a live linter
   2) the gate: a replay of the five checks, step by step
   3) the archive: every PNG the extractor walks, with real verdicts and facts
   Markers and rules are verbatim from PROMPTS.md; extractor verdicts and file facts
   come from the committed sidecars, the manifests and the PNG headers. */
(function () {
  function el(tag, cls) { var n = document.createElement(tag); if (cls) { n.className = cls; } return n; }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function fmtBytes(b) {
    if (b >= 1000000) { return (b / 1000000).toFixed(1) + ' MB'; }
    return Math.round(b / 1000) + ' KB';
  }
  function reduceMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }

  /* ---------- 1. the character bible, enforced ---------- */
  var bibleMount = document.getElementById('bible-mount');
  if (bibleMount) {
    var NAMES = ['dante', 'maeve', 'demoness'];
    var BRANDS = ['gucci', 'nike', 'adidas', 'prada', 'chanel', 'rolex', 'apple', 'samsung', 'iphone', 'ferrari', 'porsche', 'coca-cola'];
    var NONDIEGETIC = ['soundtrack', 'score', 'ost', 'theme song', 'music cue', 'narrator'];

    var characters = [
      {
        tab: 'Dante — the man',
        markers: [
          { label: 'tall — ~25 cm over her', re: /tall/, add: 'tall' },
          { label: 'pale skin', re: /pale[- ]skinn?ed|pale skin/, add: 'pale skin' },
          { label: 'pointed ears', re: /pointed ears/, add: 'pointed ears' },
          { label: 'glowing red eyes', re: /glowing red eyes/, add: 'glowing red eyes' },
          { label: 'messy, wavy black hair', re: /messy[, ]+wavy black hair/, add: 'messy, wavy black hair' },
          { label: 'black leather moto jacket', re: /black leather moto jacket/, add: 'a black leather moto jacket' },
          { label: 'black v-neck', re: /black v-neck/, add: 'a black v-neck' },
          { label: 'silver chain necklaces', re: /silver chain necklaces/, add: 'silver chain necklaces' }
        ],
        prompt: 'A tall pale-skinned man with pointed ears and glowing red eyes stands in the rain-wet nave of a ruined cathedral, his messy wavy black hair catching the mist; a black leather moto jacket hangs open over a black v-neck, silver chain necklaces resting against his collarbone. Water drips from the broken vaults and his boots creak softly on the flagstones.'
      },
      {
        tab: 'Maeve — the woman',
        markers: [
          { label: 'shorter — ~25 cm under him', re: /shorter/, add: 'shorter' },
          { label: 'pale skin', re: /pale[- ]skinn?ed|pale skin/, add: 'pale skin' },
          { label: 'pointed ears', re: /pointed ears/, add: 'pointed ears' },
          { label: 'violet-left, red-right eye split', re: /violet left, red right|violet-left.*red-right/, add: 'the violet-left, red-right eye split' },
          { label: 'black lipstick', re: /black lipstick/, add: 'black lipstick' },
          { label: 'black lace corset', re: /black lace corset/, add: 'a black lace corset' },
          { label: 'heavy gothic jewelry', re: /heavy gothic jewelry/, add: 'heavy gothic jewelry' },
          { label: 'botanical neck tattoos', re: /botanical (neck )?tattoos/, add: 'botanical neck tattoos' },
          { label: 'stark white streaks on her right side only', re: /white streaks on her right side only/, add: 'stark white streaks on her right side only' },
          { label: 'floor-length hair', re: /floor-length hair/, add: 'floor-length hair' }
        ],
        prompt: 'A shorter pale-skinned woman with pointed ears and black lipstick turns toward the candlelight; her eyes hold the split — violet left, red right — and her floor-length hair, stark white streaks on her right side only over solid black, trails across the stone. A black lace corset sits under heavy gothic jewelry, botanical tattoos threading her neck. Wax hisses as the candles gutter and her chains chime faintly with the movement.'
      },
      {
        tab: 'The Demoness',
        markers: [
          { label: 'pale skin', re: /pale[- ]skinn?ed|pale skin/, add: 'pale skin' },
          { label: 'dented black upward horns', re: /black horns with subtle dents|dented black/, add: 'dented black upward horns' },
          { label: 'massive black feathered wings', re: /massive black feathered wings/, add: 'massive black feathered wings' },
          { label: 'neat black bun', re: /neat,? elegant bun|neat black bun/, add: 'a neat black bun' },
          { label: 'minimalist black silk open-back dress', re: /minimalist black silk (open-back )?dress/, add: 'a minimalist black silk open-back dress' },
          { label: 'Baphomet goat-head pentagram between the wings', re: /Baphomet goat head enclosed in an inverted pentagram/, add: 'the Baphomet goat-head pentagram between the wings' },
          { label: 'floor-sit: crossed bare legs, hands in lap', re: /crossed bare legs|hands resting in her lap/, add: 'crossed bare legs, hands in the lap' }
        ],
        prompt: 'A pale-skinned figure sits directly on the flagstones of a dark hall, elegantly crossed bare legs tucked beneath a minimalist black silk dress that pools on the floor, hands resting in her lap; medium-length black horns with subtle dents rise from a neat, elegant bun, and massive black feathered wings spread wide — thin at the shoulder blades, erupting outward. Between them, centered on her bare upper back, a pitch-black Baphomet goat head enclosed in an inverted pentagram. A low draught moves through the hall and the silk whispers against the stone.'
      }
    ];

    var BAD_DRAFT = 'Dante — tall, pale skin, red eyes.\nMaeve — black lace dress.\nCamera: slow push-in. Epic soundtrack swells.';

    function scan(text) {
      var lower = text.toLowerCase();
      function hits(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          if (new RegExp('\\b' + escRe(list[i]) + '\\b').test(lower)) { out.push(list[i]); }
        }
        return out;
      }
      function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
      var nameHits = hits(NAMES).map(cap);
      var brandHits = hits(BRANDS).map(cap);
      var struct = [];
      if (text.indexOf('\n') !== -1) { struct.push('multiple lines'); }
      if (/(^|\n)\s*(\d+[.)]|[-•*])\s/.test(text)) { struct.push('list markers'); }
      if (text.indexOf('`') !== -1) { struct.push('code ticks'); }
      if (/(^|\n)\s*[A-Za-z][A-Za-z ]{0,24}:/.test(text)) { struct.push('label-style line'); }
      var audioHits = hits(NONDIEGETIC);
      var flags = nameHits.length + brandHits.length + struct.length + audioHits.length;
      return { nameHits: nameHits, brandHits: brandHits, struct: struct, audioHits: audioHits, flags: flags };
    }

    var wrap = el('div', 'bible');
    var left = el('div');
    var right = el('div');
    wrap.appendChild(left); wrap.appendChild(right);

    var tabs = el('div', 'bible-tabs');
    var tabButtons = [];
    characters.forEach(function (c, i) {
      var b = el('button');
      b.type = 'button';
      b.textContent = c.tab;
      b.addEventListener('click', function () { select(i); });
      tabs.appendChild(b);
      tabButtons.push(b);
    });
    left.appendChild(tabs);

    var markerH = el('p', 'bible-h');
    markerH.textContent = 'Canonical markers — PROMPTS.md';
    var markerBox = el('div', 'bible-markers');
    left.appendChild(markerH); left.appendChild(markerBox);

    var cover = el('div', 'bible-cover');
    var coverBar = el('span', 'bar');
    var coverFill = el('i');
    var coverNum = el('span', 'num');
    coverBar.appendChild(coverFill);
    cover.appendChild(coverBar); cover.appendChild(coverNum);
    left.appendChild(cover);

    var promptH = el('p', 'bible-h');
    promptH.textContent = 'Composed prompt — markers only, never names';
    var editor = el('textarea', 'bible-edit');
    editor.setAttribute('aria-label', 'Composed prompt — edit to re-run the lint');
    editor.spellcheck = false;
    right.appendChild(promptH); right.appendChild(editor);

    var meta = el('div', 'bible-meta');
    var metaWords = el('span');
    var metaRules = el('span');
    metaRules.textContent = '4 rules · live';
    meta.appendChild(metaWords); meta.appendChild(metaRules);
    right.appendChild(meta);

    var tools = el('div', 'bible-tools');
    var resetBtn = el('button'); resetBtn.type = 'button'; resetBtn.textContent = 'Reset to composed';
    var badBtn = el('button'); badBtn.type = 'button';
    var copyBtn = el('button', 'primary'); copyBtn.type = 'button'; copyBtn.textContent = 'Copy prompt';
    tools.appendChild(resetBtn); tools.appendChild(badBtn); tools.appendChild(copyBtn);
    right.appendChild(tools);

    /* the lint band runs full width under both columns */
    var lintBox = el('div', 'lint');
    wrap.appendChild(lintBox);

    var note = el('p', 'bible-note');
    note.textContent = 'Everything here is composed and linted in the browser; the rules are the project\u2019s own.';
    wrap.appendChild(note);

    var current = 0, bad = false, firstRender = true;
    var drafts = characters.map(function () { return null; });
    var badDraft = null;

    function textOf() {
      return bad ? (badDraft === null ? BAD_DRAFT : badDraft)
        : (drafts[current] === null ? characters[current].prompt : drafts[current]);
    }

    function swapFade(node) {
      if (firstRender) { return; }
      node.classList.remove('bibfade');
      void node.offsetWidth;
      node.classList.add('bibfade');
    }

    function renderLint(text) {
      var r = scan(text);
      lintBox.textContent = '';
      function row(k, ok, msg) {
        var d = el('div', 'row');
        var kk = el('span', 'k'); kk.textContent = k;
        var v = el('span', ok ? 'ok' : 'fail');
        v.textContent = (ok ? '\u2713 ' : '\u2717 ') + msg;
        d.appendChild(kk); d.appendChild(v);
        lintBox.appendChild(d);
      }
      function cnt(n, unit) { return n + ' ' + unit + (n > 1 ? 's' : ''); }
      row('name-scan', r.nameHits.length === 0,
        r.nameHits.length === 0 ? '0 hits' : cnt(r.nameHits.length, 'hit') + ' \u2014 ' + r.nameHits.join(', '));
      row('brand-scan', r.brandHits.length === 0,
        r.brandHits.length === 0 ? '0 hits' : cnt(r.brandHits.length, 'hit') + ' \u2014 ' + r.brandHits.join(', '));
      row('structure', r.struct.length === 0,
        r.struct.length === 0 ? 'flowing prose \u2014 single paragraph' : cnt(r.struct.length, 'flag') + ' \u2014 ' + r.struct.join(', '));
      row('audio', r.audioHits.length === 0,
        r.audioHits.length === 0 ? 'diegetic only \u2014 no soundtrack language' : cnt(r.audioHits.length, 'hit') + ' \u2014 \u201c' + r.audioHits.join('\u201d, \u201c') + '\u201d');
      var v = el('div', 'verdict ' + (r.flags === 0 ? 'ok' : 'fail'));
      v.textContent = r.flags === 0
        ? 'PASS \u2014 all four prompt rules hold'
        : 'FAIL \u2014 ' + r.flags + ' flags; fix before generating';
      lintBox.appendChild(v);
    }

    function appendMarker(text, phrase) {
      var t = text.replace(/\s+$/, '');
      var end = /[.!?]$/.test(t) ? t.slice(-1) : '.';
      var body = /[.!?]$/.test(t) ? t.slice(0, -1) : t;
      body = body.replace(/[\s,;:]+$/, '');
      var sep = /[,\u2014-]$/.test(body) ? ' ' : ', ';
      return body + sep + phrase + end;
    }

    function renderMarkers(text) {
      var c = characters[current];
      markerBox.textContent = '';
      var present = 0;
      c.markers.forEach(function (m) {
        var on = m.re.test(text);
        if (on) { present++; }
        var b = el('button', 'm');
        b.type = 'button';
        b.dataset.on = on ? 'true' : 'false';
        b.textContent = m.label;
        b.title = on ? 'In the prompt — click to find it' : 'Missing — click to append it';
        b.addEventListener('click', function () {
          if (on) {
            var match = text.match(m.re);
            if (match && match.index !== undefined) {
              editor.focus();
              editor.setSelectionRange(match.index, match.index + match[0].length);
            }
          } else {
            var next = appendMarker(textOf(), m.add);
            if (bad) { badDraft = next; } else { drafts[current] = next; }
            editor.value = next;
            refresh();
            editor.focus();
          }
        });
        markerBox.appendChild(b);
      });
      coverFill.style.width = (present / c.markers.length * 100).toFixed(1) + '%';
      coverNum.textContent = present + ' / ' + c.markers.length + ' markers in prompt';
    }

    function refresh() {
      var text = textOf();
      if (editor.value !== text) { editor.value = text; }
      var words = text.trim() ? text.trim().split(/\s+/).length : 0;
      metaWords.textContent = words + ' words \u00b7 ' + text.length + ' chars';
      renderMarkers(text);
      renderLint(text);
    }

    function render() {
      tabButtons.forEach(function (b, j) { b.setAttribute('aria-pressed', j === current ? 'true' : 'false'); });
      badBtn.textContent = bad ? 'Back to the clean prompt' : 'Show a violating draft';
      editor.value = textOf();
      refresh();
      swapFade(editor); swapFade(lintBox);
      firstRender = false;
    }

    function select(i) {
      if (!bad) { drafts[current] = editor.value; }
      current = i; bad = false; badDraft = null;
      render();
    }

    editor.addEventListener('input', function () {
      if (bad) { badDraft = editor.value; } else { drafts[current] = editor.value; }
      refresh();
    });

    resetBtn.addEventListener('click', function () {
      bad = false; badDraft = null; drafts[current] = null;
      render();
      editor.focus();
    });

    badBtn.addEventListener('click', function () {
      if (!bad) { drafts[current] = editor.value; bad = true; badDraft = BAD_DRAFT; }
      else { bad = false; badDraft = null; }
      render();
    });

    copyBtn.addEventListener('click', function () {
      var text = textOf();
      function done() {
        copyBtn.textContent = 'Copied \u2713';
        copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.textContent = 'Copy prompt'; copyBtn.classList.remove('copied'); }, 1400);
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); }
        catch (e) { copyBtn.textContent = 'Copy failed'; setTimeout(function () { copyBtn.textContent = 'Copy prompt'; }, 1400); }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    });

    bibleMount.appendChild(wrap);
    render();
  }

  /* ---------- 2. the gate — a step-by-step replay ---------- */
  var gateRun = document.getElementById('gate-run');
  var gateSteps = document.getElementById('gate-steps');
  if (gateRun && gateSteps) {
    var STEPS = [
      { cmd: 'python -m compileall -q .', out: 'no syntax errors', ms: 240 },
      { cmd: 'python extract_png_metadata.py --strict', out: 'Done. Extracted metadata from 5 file(s).', ms: 380 },
      { cmd: "git diff --exit-code -- '*_metadata.txt'", out: '0 drift \u2014 committed sidecars byte-identical', ms: 280 },
      { cmd: "git ls-files --others -- '*_metadata.txt'", out: '(empty) \u2014 no uncommitted sidecars', ms: 260 },
      { cmd: 'python validate_manifests.py', out: 'Pose_Experiments: 6 PNG, 0 sidecar(s), 6 refs - OK \u00b7 Reference_Sheets: 6 PNG, 2 sidecar(s), 8 refs - OK \u00b7 Scenes: 5 PNG, 3 sidecar(s), 10 refs - OK \u00b7 All manifests consistent.', ms: 460 }
    ];
    var verdict = document.getElementById('gate-verdict');
    var running = false;
    var stepNodes = [];

    STEPS.forEach(function (s, i) {
      var li = el('li', 'gate-step');
      li.dataset.state = 'idle';
      var idx = el('span', 'gs-i'); idx.textContent = ('0' + (i + 1)).slice(-2);
      var cmd = el('code'); cmd.textContent = s.cmd;
      var st = el('span', 'gs-s'); st.textContent = 'waiting';
      var out = el('span', 'gs-o');
      li.appendChild(idx); li.appendChild(cmd); li.appendChild(st); li.appendChild(out);
      gateSteps.appendChild(li);
      stepNodes.push({ li: li, st: st, out: out });
    });

    function runGate() {
      if (running) { return; }
      running = true;
      gateRun.disabled = true;
      gateRun.textContent = 'Running\u2026';
      verdict.textContent = 'Running 5 checks\u2026';
      verdict.className = 'gate-verdict';
      stepNodes.forEach(function (n) {
        n.li.dataset.state = 'idle'; n.st.textContent = 'waiting'; n.out.textContent = '';
      });
      var i = 0;
      function next() {
        if (i >= STEPS.length) {
          running = false;
          gateRun.disabled = false;
          gateRun.textContent = 'Run again';
          verdict.textContent = 'PASS \u2014 5/5 \u00b7 the commit would ship';
          verdict.className = 'gate-verdict ok';
          return;
        }
        var n = stepNodes[i];
        n.li.dataset.state = 'run'; n.st.textContent = 'running';
        var delay = reduceMotion() ? 0 : STEPS[i].ms;
        setTimeout(function () {
          n.li.dataset.state = 'pass'; n.st.textContent = 'pass'; n.out.textContent = STEPS[i].out;
          i++;
          next();
        }, delay);
      }
      next();
    }

    gateRun.addEventListener('click', runGate);
  }

  /* ---------- 3. the archive — every PNG the extractor walks ---------- */
  var inspMount = document.getElementById('sidecar-mount');
  if (inspMount) {
    var FOLDERS = [
      ['Reference_Sheets', 'Reference sheets'],
      ['Scenes', 'Scenes'],
      ['Pose_Experiments', 'Pose experiments'],
      ['previews', 'README previews']
    ];
    var FILES = [
      { p: 'Reference_Sheets/Dante_Reference.png', b: 5355024, w: 1824, h: 2336, s: true,
        note: 'Bust reference \u2014 the sheet every Dante scene descends from. EXIF only: a Picasa software tag, no GPS.',
        out: ['Processing: Dante_Reference.png', '  Wrote: Dante_Reference_metadata.txt', '', '=== Raw profile type APP1 ===', 'generic profile \u00b7 6336 bytes', '49492a00\u2026  (EXIF hex \u2014 full dump in the sidecar)', '\u201cPicasa\u201d software tag \u00b7 R98 \u00b7 no GPS IFD'] },
      { p: 'Reference_Sheets/Dante_FullBody_Base.png', b: 5044409, w: 1824, h: 2336, s: false,
        note: 'Full-body base \u2014 the proportions sheet; no embedded metadata, prompt lost.' },
      { p: 'Reference_Sheets/Dante_6Panel_Sheet.png', b: 5590641, w: 2752, h: 1536, s: false,
        note: 'Six-panel expression and pose sheet; clean-stripped, like most sheets.' },
      { p: 'Reference_Sheets/Maeve_Bust_Reference.png', b: 5609011, w: 1536, h: 2752, s: true,
        note: 'Bust reference with the eye split and white-streak rule pinned; EXIF only, no GPS.',
        out: ['Processing: Maeve_Bust_Reference.png', '  Wrote: Maeve_Bust_Reference_metadata.txt', '', '=== Raw profile type APP1 ===', 'generic profile \u00b7 5540 bytes', '49492a00\u2026  (EXIF hex \u2014 full dump in the sidecar)', '\u201cPicasa\u201d software tag \u00b7 R98 \u00b7 no GPS IFD'] },
      { p: 'Reference_Sheets/Maeve_FullBody_Base.png', b: 4647711, w: 2048, h: 2048, s: false,
        note: 'Full-body base, square canvas; no embedded metadata.' },
      { p: 'Reference_Sheets/Maeve_6Panel_Sheet.png', b: 7368832, w: 2048, h: 2048, s: false,
        note: 'Six-panel sheet at 2048\u00b2; prompt lost.' },

      { p: 'Scenes/Scene1/Dante.png', b: 5355024, w: 1824, h: 2336, s: true,
        note: 'Scene 1 source material \u2014 byte-identical to Reference_Sheets/Dante_Reference.png (sha256 matches).',
        out: ['Processing: Dante.png', '  Wrote: Dante_metadata.txt', '', '=== Raw profile type APP1 ===', 'generic profile \u00b7 6336 bytes', 'byte-identical copy of the bust reference', 'sha256 91161d32\u20262a6be1c0'] },
      { p: 'Scenes/Scene1/Maeve.png', b: 5609011, w: 1536, h: 2752, s: true,
        note: 'The other half of the Scene 1 pair \u2014 byte-identity proven by hash, not by eye.',
        out: ['Processing: Maeve.png', '  Wrote: Maeve_metadata.txt', '', '=== Raw profile type APP1 ===', 'generic profile \u00b7 5540 bytes', 'byte-identical copy of the bust reference', 'sha256 08b27928\u2026f71ff558'] },
      { p: 'Scenes/Scene1/Gemini_Generated_Image_yyats2yyats2yyat.png', b: 6332717, w: 2754, h: 1536, s: false,
        note: 'Scene 1, Gemini take \u2014 default Gemini filename, prompt not embedded.' },
      { p: 'Scenes/Scene1/hf_20260522_215451_44faac83-9d51-4422-8c07-a726976a7c89.png', b: 9009075, w: 2752, h: 1536, s: true,
        note: 'Scene 1, HuggingFace take \u2014 the whole prompt is lost; the job ID and timestamp survived.',
        out: ['Processing: hf_20260522_215451_44faac83-9d51-4422-8c07-a726976a7c89.png', '  Wrote: hf_20260522_215451_44faac83-9d51-4422-8c07-a726976a7c89_metadata.txt', '', '=== hf-job-id ===', '44faac83-9d51-4422-8c07-a726976a7c89'] },
      { p: 'Scenes/Scene2/Gemini_Generated_Image_i327d2i327d2i327.png', b: 8628936, w: 2752, h: 1536, s: false,
        note: 'Scene 2 \u2014 default Gemini filename; the \u201c (1)\u201d re-download suffix was removed.' },

      { p: 'Pose_Experiments/dalle_horizontal_floor_sit.png', b: 1791452, w: 1672, h: 941, s: false,
        note: 'DALL-E horizontal floor-sit; manually renamed, prompt lost.' },
      { p: 'Pose_Experiments/dalle_vertical_floor_sit.png', b: 2170403, w: 1024, h: 1536, s: false,
        note: 'DALL-E vertical \u2014 one of the two takes the manifest certifies as keeping the exact floor-sit.' },
      { p: 'Pose_Experiments/demoness_chatgpt_20260604.png', b: 1888590, w: 1024, h: 1536, s: false,
        note: 'DALL-E via the ChatGPT web UI \u2014 renamed from a German-locale default filename.' },
      { p: 'Pose_Experiments/demoness_gemini_a29mwq.png', b: 1970418, w: 768, h: 1376, s: false,
        note: 'Gemini \u2014 renamed from a default filename; renders her on a throne-like chair (recorded drift).' },
      { p: 'Pose_Experiments/gemini_horizontal_perfected.png', b: 8456820, w: 2752, h: 1536, s: false,
        note: 'Gemini horizontal \u201cperfected\u201d \u2014 the selected final of the horizontal runs; exact floor-sit kept.' },
      { p: 'Pose_Experiments/gemini_vertical_floor_sit.png', b: 8056869, w: 1536, h: 2752, s: false,
        note: 'Gemini vertical floor-sit; clean-stripped.' },

      { p: 'previews/Demoness_preview.png', b: 387770, w: 640, h: 357, s: false,
        note: 'README preview \u2014 a downscaled presentation copy, not a library asset and not in a manifest.' },
      { p: 'previews/Maeve_preview.png', b: 303970, w: 320, h: 573, s: false,
        note: 'README preview \u2014 presentation only; no manifest row.' },
      { p: 'previews/Scene1_preview.png', b: 344020, w: 640, h: 357, s: false,
        note: 'README preview \u2014 presentation only; no manifest row.' }
    ];

    function folderOf(p) { return p.split('/')[0]; }
    function baseOf(p) { return p.split('/').pop(); }
    function folderLabel(f) { for (var i = 0; i < FOLDERS.length; i++) { if (FOLDERS[i][0] === f) { return FOLDERS[i][1]; } } return f; }

    var wrap2 = el('div', 'arch');
    var bar = el('div', 'arch-bar');
    var filters = el('div', 'arch-filters');
    var searchWrap = el('label', 'arch-search');
    var search = el('input');
    search.type = 'search';
    search.setAttribute('aria-label', 'Filter files by name');
    searchWrap.appendChild(search);
    bar.appendChild(filters); bar.appendChild(searchWrap);

    var counts = { all: FILES.length, library: 0, previews: 0, sidecar: 0, stripped: 0 };
    FILES.forEach(function (f) {
      if (folderOf(f.p) === 'previews') { counts.previews++; } else { counts.library++; }
      if (f.s) { counts.sidecar++; } else { counts.stripped++; }
    });
    search.placeholder = 'Filter ' + counts.all + ' files\u2026';

    var FILTERS = [
      ['all', 'All ' + counts.all], ['library', 'Library ' + counts.library], ['previews', 'Previews ' + counts.previews],
      ['sidecar', 'Sidecars ' + counts.sidecar], ['stripped', 'Stripped ' + counts.stripped]
    ];
    var filter = 'all';
    var filterButtons = [];
    FILTERS.forEach(function (f) {
      var b = el('button'); b.type = 'button'; b.textContent = f[1];
      b.setAttribute('aria-pressed', f[0] === filter ? 'true' : 'false');
      b.addEventListener('click', function () {
        filter = f[0];
        filterButtons.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        renderList();
      });
      filters.appendChild(b); filterButtons.push(b);
    });

    var body = el('div', 'arch-body');
    var list = el('div', 'arch-list');
    var detail = el('div', 'arch-detail');
    body.appendChild(list); body.appendChild(detail);

    var sum = el('p', 'arch-sum');
    var hint = el('p', 'arch-hint');
    hint.textContent = '\u2191\u2193 steps through the list \u00b7 click a row for its verdict';
    wrap2.appendChild(bar); wrap2.appendChild(body); wrap2.appendChild(sum); wrap2.appendChild(hint);

    var selected = 0;

    function matches(f) {
      if (filter === 'library' && folderOf(f.p) === 'previews') { return false; }
      if (filter === 'previews' && folderOf(f.p) !== 'previews') { return false; }
      if (filter === 'sidecar' && !f.s) { return false; }
      if (filter === 'stripped' && f.s) { return false; }
      var q = search.value.trim().toLowerCase();
      if (q && f.p.toLowerCase().indexOf(q) === -1) { return false; }
      return true;
    }

    function visibleFiles() {
      var out = [];
      FOLDERS.forEach(function (fo) {
        FILES.forEach(function (f, i) {
          if (folderOf(f.p) === fo[0] && matches(f)) { out.push(i); }
        });
      });
      return out;
    }

    function renderList() {
      var vis = visibleFiles();
      if (vis.indexOf(selected) === -1) {
        selected = vis.length ? vis[0] : -1;
      }
      list.textContent = '';
      if (!vis.length) {
        var empty = el('div', 'arch-empty');
        empty.textContent = 'No file matches \u201c' + search.value.trim() + '\u201d.';
        list.appendChild(empty);
      } else {
        var lastFolder = null;
        vis.forEach(function (i) {
          var f = FILES[i];
          var fo = folderOf(f.p);
          if (fo !== lastFolder) {
            var h = el('div', 'arch-grp');
            var shown = vis.filter(function (j) { return folderOf(FILES[j].p) === fo; }).length;
            h.textContent = folderLabel(fo) + ' \u00b7 ' + shown;
            list.appendChild(h);
            lastFolder = fo;
          }
          var b = el('button', 'arch-row');
          b.type = 'button';
          b.dataset.side = f.s ? '1' : '0';
          b.setAttribute('aria-pressed', i === selected ? 'true' : 'false');
          var dot = el('span', 'dot');
          var txt = el('span');
          var nm = el('span', 'nm'); nm.textContent = baseOf(f.p);
          var mt = el('span', 'mt'); mt.textContent = fmtBytes(f.b) + ' \u00b7 ' + f.w + '\u00d7' + f.h + (f.s ? ' \u00b7 sidecar' : '');
          txt.appendChild(nm); txt.appendChild(mt);
          b.appendChild(dot); b.appendChild(txt);
          b.addEventListener('click', function () { selected = i; renderList(); renderDetail(); });
          list.appendChild(b);
        });
      }
      renderDetail();
    }

    function renderDetail() {
      detail.textContent = '';
      if (selected < 0) { return; }
      var f = FILES[selected];
      var head = el('div', 'arch-head');
      var h4 = el('h4'); h4.textContent = f.p;
      var badge = el('span', 'arch-badge' + (f.s ? ' ok' : ''));
      badge.textContent = f.s ? 'sidecar' : (folderOf(f.p) === 'previews' ? 'preview' : 'stripped');
      head.appendChild(h4); head.appendChild(badge);

      var facts = el('dl', 'arch-facts');
      [['Folder', folderLabel(folderOf(f.p))], ['Dimensions', f.w + ' \u00d7 ' + f.h], ['Size', fmtBytes(f.b)]].forEach(function (row) {
        var d = el('div');
        var dt = el('dt'); dt.textContent = row[0];
        var dd = el('dd'); dd.textContent = row[1];
        d.appendChild(dt); d.appendChild(dd); facts.appendChild(d);
      });

      var trail = el('dl', 'arch-trail');
      [
        ['library asset', folderOf(f.p) !== 'previews' ? 'yes' : 'no \u2014 preview', folderOf(f.p) === 'previews'],
        ['manifest row', folderOf(f.p) !== 'previews' ? 'listed' : 'none', folderOf(f.p) === 'previews'],
        ['sidecar', f.s ? 'committed' : 'none', !f.s],
        ['extractor', f.s ? 'text found' : 'clean-stripped', !f.s]
      ].forEach(function (row) {
        var d = el('div');
        var dt = el('dt'); dt.textContent = row[0];
        var dd = el('dd'); if (row[2]) { dd.className = 'no'; } dd.textContent = row[1];
        d.appendChild(dt); d.appendChild(dd); trail.appendChild(d);
      });

      var out = el('div', 'arch-out');
      var lines = f.out || ['Processing: ' + baseOf(f.p), '  No text metadata found.'];
      lines.forEach(function (line) {
        var span;
        if (line.indexOf('  Wrote:') === 0) { span = el('span', 'wrote'); }
        else if (line.indexOf('===') === 0) { span = el('span', 'kw'); }
        else { span = el('span'); }
        span.textContent = line;
        out.appendChild(span);
        out.appendChild(document.createTextNode('\n'));
      });

      var note = el('p', 'arch-note');
      note.textContent = f.note;

      var foot = el('p', 'arch-note');
      foot.textContent = f.s
        ? 'Sidecar committed \u00b7 LF-pinned \u00b7 byte-identical under the gate.'
        : (folderOf(f.p) === 'previews'
          ? 'Presentation only \u2014 previews carry no manifest row and are excluded from the 17 library assets.'
          : 'No sidecar \u2014 nothing to commit, and the gate expects exactly that.');

      detail.appendChild(head); detail.appendChild(facts); detail.appendChild(trail); detail.appendChild(out);
      detail.appendChild(note); detail.appendChild(foot);
    }

    search.addEventListener('input', function () { renderList(); });

    list.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') { return; }
      var vis = visibleFiles();
      if (!vis.length) { return; }
      var at = vis.indexOf(selected);
      at = e.key === 'ArrowDown' ? Math.min(vis.length - 1, at + 1) : Math.max(0, at - 1);
      selected = vis[at];
      renderList();
      var rows = list.querySelectorAll('.arch-row');
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].getAttribute('aria-pressed') === 'true') { rows[i].focus(); break; }
      }
      e.preventDefault();
    });

    inspMount.appendChild(wrap2);
    var libBytes = 0, allBytes = 0;
    FILES.forEach(function (f) {
      allBytes += f.b;
      if (folderOf(f.p) !== 'previews') { libBytes += f.b; }
    });
    sum.textContent = FILES.length + ' files walked \u00b7 ' + counts.library + ' library PNGs + ' + counts.previews + ' previews \u00b7 '
      + counts.sidecar + ' sidecars \u00b7 ' + counts.stripped + ' clean-stripped \u00b7 '
      + fmtBytes(libBytes) + ' library / ' + fmtBytes(allBytes) + ' total';
    renderList();
  }
})();
