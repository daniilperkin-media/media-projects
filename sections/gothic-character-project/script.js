/* Gothic Character Project — section widgets.
   1) the character bible, enforced: canonical markers + a live prompt linter
   2) the sidecar inspector: real extractor verdicts, file by file
   Markers and rules are verbatim from PROMPTS.md; the extractor verdicts come
   from the committed sidecars and the gate run that built this page. */
(function () {
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ---------- 1. the character bible, enforced ---------- */
  var bibleMount = document.getElementById('bible-mount');
  if (bibleMount) {
    var NAMES = ['dante', 'maeve', 'demoness'];
    var BRANDS = ['gucci', 'nike', 'adidas', 'prada', 'chanel', 'rolex', 'apple', 'samsung', 'iphone', 'ferrari', 'porsche', 'coca-cola'];
    var NONDIEGETIC = ['soundtrack', 'score', 'ost', 'theme song', 'music cue', 'narrator'];

    var characters = [
      {
        tab: 'Dante — the man',
        markers: ['tall — ~25 cm over her', 'pale skin', 'pointed ears', 'glowing red eyes', 'messy, wavy black hair', 'black leather moto jacket', 'black v-neck', 'silver chain necklaces'],
        prompt: 'A tall pale-skinned man with pointed ears and glowing red eyes stands in the rain-wet nave of a ruined cathedral, his messy wavy black hair catching the mist; a black leather moto jacket hangs open over a black v-neck, silver chain necklaces resting against his collarbone. Water drips from the broken vaults and his boots creak softly on the flagstones.'
      },
      {
        tab: 'Maeve — the woman',
        markers: ['shorter — ~25 cm under him', 'pale skin', 'pointed ears', 'violet-left, red-right eye split', 'black lipstick', 'black lace corset', 'heavy gothic jewelry', 'botanical neck tattoos', 'stark white streaks on her right side only', 'floor-length hair'],
        prompt: 'A shorter pale-skinned woman with pointed ears and black lipstick turns toward the candlelight; her eyes hold the split — violet left, red right — and her floor-length hair, stark white streaks on her right side only over solid black, trails across the stone. A black lace corset sits under heavy gothic jewelry, botanical tattoos threading her neck. Wax hisses as the candles gutter and her chains chime faintly with the movement.'
      },
      {
        tab: 'The Demoness',
        markers: ['pale skin', 'dented black upward horns', 'massive black feathered wings', 'neat black bun', 'minimalist black silk open-back dress', 'Baphomet goat-head pentagram between the wings', 'floor-sit: crossed bare legs, hands in lap'],
        prompt: 'A pale-skinned figure sits directly on the flagstones of a dark hall, elegantly crossed bare legs tucked beneath a minimalist black silk dress that pools on the floor, hands resting in her lap; medium-length black horns with subtle dents rise from a neat, elegant bun, and massive black feathered wings spread wide — thin at the shoulder blades, erupting outward. Between them, centered on her bare upper back, a pitch-black Baphomet goat head enclosed in an inverted pentagram. A low draught moves through the hall and the silk whispers against the stone.'
      }
    ];

    var BAD_DRAFT = 'Dante — tall, pale skin, red eyes.\nMaeve — black lace dress.\nCamera: slow push-in. Epic soundtrack swells.';

    function scan(text) {
      var lower = text.toLowerCase();
      function hits(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          if (new RegExp('\\b' + esc(list[i]) + '\\b').test(lower)) { out.push(list[i]); }
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

    var promptH = el('p', 'bible-h');
    promptH.textContent = 'Composed prompt — markers only, never names';
    var promptBox = el('div', 'bible-prompt');
    right.appendChild(promptH); right.appendChild(promptBox);

    /* the lint band runs full width under both columns */
    var lintBox = el('div', 'lint');
    wrap.appendChild(lintBox);

    var toggleBtn = el('button', 'bible-btn');
    toggleBtn.type = 'button';
    wrap.appendChild(toggleBtn);

    var note = el('p', 'bible-note');
    note.textContent = 'Everything here is composed and linted in the browser; the rules are the project\u2019s own.';
    wrap.appendChild(note);

    var current = 0, bad = false, firstRender = true;
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

    function render() {
      var c = characters[current];
      tabButtons.forEach(function (b, j) { b.setAttribute('aria-pressed', j === current ? 'true' : 'false'); });
      markerBox.textContent = '';
      c.markers.forEach(function (m) {
        var s = el('span', 'm'); s.textContent = m; markerBox.appendChild(s);
      });
      var text = bad ? BAD_DRAFT : c.prompt;
      promptBox.textContent = '';
      promptBox.className = 'bible-prompt' + (bad ? ' bad' : '');
      promptBox.appendChild(document.createTextNode(text));
      toggleBtn.textContent = bad ? 'Back to the clean composition' : 'Show a violating draft';
      renderLint(text);
      swapFade(promptBox); swapFade(lintBox);
      firstRender = false;
    }

    function select(i) { current = i; bad = false; render(); }

    toggleBtn.addEventListener('click', function () { bad = !bad; render(); });

    bibleMount.appendChild(wrap);
    render();
  }

  /* ---------- 2. the sidecar inspector ---------- */
  var inspMount = document.getElementById('sidecar-mount');
  if (inspMount) {
    var FILES = [
      { name: 'Reference_Sheets/Dante_Reference.png', grp: 'recovered', side: true,
        out: ['Processing: Dante_Reference.png', '  Wrote: Dante_Reference_metadata.txt', '', '=== Raw profile type APP1 ===', 'generic profile \u00b7 6336 bytes', '49492a00\u2026  (EXIF hex \u2014 full dump in the sidecar)', '\u201cPicasa\u201d software tag \u00b7 R98 \u00b7 no GPS IFD'],
        note: 'The bust reference every Dante scene descends from \u2014 checked for location data before it was committed.' },
      { name: 'Reference_Sheets/Maeve_Bust_Reference.png', grp: 'recovered', side: true,
        out: ['Processing: Maeve_Bust_Reference.png', '  Wrote: Maeve_Bust_Reference_metadata.txt', '', '=== Raw profile type APP1 ===', 'identical profile shape \u2014 EXIF hex, 12.7 KB', '\u201cPicasa\u201d software tag \u00b7 no GPS IFD'],
        note: 'Same profile shape as the other bust reference; the manifest records it without duplicating canon.' },
      { name: 'Scenes/Scene1/Dante.png', grp: 'recovered', side: true,
        out: ['Processing: Dante.png', '  Wrote: Dante_metadata.txt', '', '=== Raw profile type APP1 ===', 'byte-identical copy of the bust reference', 'sha256 91161d32\u20262a6be1c0'],
        note: 'Scene 1 keeps its source material in the scene folder \u2014 same bytes, same sidecar, gate-checked.' },
      { name: 'Scenes/Scene1/Maeve.png', grp: 'recovered', side: true,
        out: ['Processing: Maeve.png', '  Wrote: Maeve_metadata.txt', '', '=== Raw profile type APP1 ===', 'byte-identical copy of the bust reference', 'sha256 08b27928\u2026f71ff558'],
        note: 'The other half of the same pair \u2014 byte-identity proven by hash, not by eye.' },
      { name: 'Scenes/Scene1/hf_20260522_215451_44faac83\u2026.png', grp: 'recovered', side: true,
        out: ['Processing: hf_20260522_215451_44faac83-9d51-4422-8c07-a726976a7c89.png', '  Wrote: hf_20260522_215451_44faac83-9d51-4422-8c07-a726976a7c89_metadata.txt', '', '=== hf-job-id ===', '44faac83-9d51-4422-8c07-a726976a7c89'],
        note: 'Generated 2026-05-22 21:54:51 \u2014 the whole prompt is lost; the job ID is what the PNG kept.' },
      { name: 'Scenes/Scene2/Gemini_Generated_Image_i327d2\u2026.png', grp: 'stripped', side: false,
        out: ['Processing: Gemini_Generated_Image_i327d2i327d2i327.png', '  No text metadata found.'],
        note: 'Stripped \u2014 no sidecar exists, nothing to commit; the manifest records the loss instead of guessing.' },
      { name: 'Reference_Sheets/Dante_6Panel_Sheet.png', grp: 'stripped', side: false,
        out: ['Processing: Dante_6Panel_Sheet.png', '  No text metadata found.'],
        note: 'Sheets and most scenes come back like this \u2014 15 of the tree\u2019s 20 PNGs.' },
      { name: 'Pose_Experiments/gemini_horizontal_perfected.png', grp: 'stripped', side: false,
        out: ['Processing: gemini_horizontal_perfected.png', '  No text metadata found.'],
        note: 'All six pose experiments are clean-stripped; what we know about them lives in the manifest prose.' }
    ];

    var wrap2 = el('div', 'insp');
    var list = el('div', 'insp-list');
    var detail = el('div', 'insp-detail');
    var note2 = el('p', 'insp-note');
    wrap2.appendChild(list); wrap2.appendChild(detail);

    var buttons = [];
    var head = el('div', 'grp');
    head.textContent = '20 PNGs walked \u00b7 5 wrote sidecars \u00b7 15 clean-stripped';
    list.appendChild(head);

    [['recovered', 'recovered \u2014 text metadata found'], ['stripped', 'stripped \u2014 expected, no sidecar']].forEach(function (g) {
      var h = el('div', 'grp');
      h.textContent = g[1];
      list.appendChild(h);
      FILES.forEach(function (f, i) {
        if (f.grp !== g[0]) { return; }
        var b = el('button');
        b.type = 'button';
        b.textContent = f.name;
        b.title = f.name;
        b.addEventListener('click', function () { show(i); });
        list.appendChild(b);
        buttons[i] = b;
      });
    });

    function show(i) {
      buttons.forEach(function (b, j) { if (b) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); } });
      var f = FILES[i];
      detail.textContent = '';
      f.out.forEach(function (line) {
        var span;
        if (line.indexOf('  Wrote:') === 0) { span = el('span', 'wrote'); }
        else if (line.indexOf('===') === 0) { span = el('span', 'kw'); }
        else { span = el('span'); }
        span.textContent = line;
        detail.appendChild(span);
        detail.appendChild(document.createTextNode('\n'));
      });
      var d = el('div', 'dim');
      d.textContent = '\u2014 ' + f.note;
      detail.appendChild(d);
      note2.textContent = f.side
        ? 'Sidecar committed \u00b7 LF-pinned \u00b7 byte-identical under the gate.'
        : 'No sidecar \u2014 nothing to commit, and the gate expects exactly that.';
    }

    inspMount.appendChild(wrap2);
    inspMount.appendChild(note2);
    show(0);
  }
})();
