/* Novel Translation — section v3.
   Three widgets, all fed by real runs of the tool on examples/demo_book.epub:
   1. the press  — four stages, the files they produce, the exact CLI lines;
   2. the shelf  — the --batch-size flag drawn as 215 chapter spines / 13 part spines;
   3. the lab    — the marker inspector plus the validator's real fault messages.
   No external requests, no fabricated output. */
(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function el(tag, cls) { var n = document.createElement(tag); if (cls) { n.className = cls; } return n; }
  function txt(tag, cls, s) { var n = el(tag, cls); n.textContent = s; return n; }
  function pad3(n) { return String(n).padStart(3, '0'); }
  function fileFor(start, end) { return 'batch_' + pad3(start) + '_' + pad3(end) + '.txt'; }
  function unit(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  /* ================================================================
     1. THE PRESS
     ================================================================ */
  var STAGES = [
    {
      id: 'prepare',
      sub: 'EPUB \u2192 text \u2192 batches',
      cmd: 'novel-translate prepare examples/demo_book.epub -w demo_work',
      out: [
        'extracted 1 EPUB(s) -> demo_work\\combined.txt',
        'cleaned text -> demo_work\\cleaned.txt',
        'wrote 3 batch file(s), 13 part(s) -> demo_work\\batches',
        'chapters: missing=none empty=none',
        'next: translate the batch files (keep the <<<PART n>>> markers) by hand or with \'novel-translate translate\'; then run: novel-translate assemble -w demo_work'
      ],
      note: 'One command: extract \u2192 clean \u2192 split. 13 parts, five per batch file (the default batch size).'
    },
    {
      id: 'verify',
      sub: 'continuity, TOC-aware',
      cmd: 'novel-translate verify -w demo_work --strict',
      out: [
        'Missing chapters: None',
        'Empty/Suspicious chapters: None'
      ],
      note: 'A continuity report, TOC-aware \u2014 a run of bare Chapter N lines (a table of contents) can never masquerade as a chapter. --strict turns any issue into a non-zero exit; this run is clean.'
    },
    {
      id: 'translate',
      sub: 'the hand-off',
      cmd: 'novel-translate translate -w demo_work --base-url https://openrouter.ai/api/v1 --model <model> --target Ukrainian',
      note: 'The one step outside the terminal. Batches go to any chat model by hand \u2014 or through the optional stdlib-only API client. The model translates the headings and body; the marker lines must come back exactly as they went out.',
      excerpt: '<<<PART 7>>>\nChapter 6\n\nThe Fox and the Crow\nA crow sat in a tree with a piece of cheese in her beak. A fox praised her beauty and asked to hear her voice. The crow opened her beak to sing, and the cheese fell straight into the fox\u2019s mouth. Never trust a flatterer.'
    },
    {
      id: 'assemble',
      sub: 'EPUB + combined text',
      cmd: 'novel-translate assemble -w demo_work -o demo_work/demo.uk.epub',
      out: [
        'assembled 13 part(s) -> demo_work/demo.uk.epub',
        'combined text -> demo_work\\translated_full.txt'
      ],
      note: 'Translated batches + manifest \u2192 EPUB + combined text, marker-checked. Read back: title demo_book \u00b7 language uk \u00b7 14 documents (nav + 13 parts). Drop one marker anywhere and it exits 2 \u2014 the lab below replays it.'
    }
  ];

  var FILES = [
    { name: 'combined.txt', size: '3,803 B', stage: 0, depth: 1 },
    { name: 'cleaned.txt', size: '3,679 B', stage: 0, depth: 1 },
    { name: 'batches/', size: '', stage: 0, depth: 1, dir: true },
    { name: 'manifest.json', size: '1,703 B', stage: 0, depth: 2 },
    { name: 'batch_001_005.txt', size: '1,449 B', stage: 0, depth: 2 },
    { name: 'batch_006_010.txt', size: '1,381 B', stage: 0, depth: 2 },
    { name: 'batch_011_013.txt', size: '1,043 B', stage: 0, depth: 2 },
    { name: 'translated/', size: '', stage: 2, depth: 1, dir: true },
    { name: 'batch_001_005.txt', size: '1,449 B', stage: 2, depth: 2 },
    { name: 'batch_006_010.txt', size: '1,381 B', stage: 2, depth: 2 },
    { name: 'batch_011_013.txt', size: '1,043 B', stage: 2, depth: 2 },
    { name: 'demo.uk.epub', size: '8,523 B', stage: 3, depth: 1 },
    { name: 'translated_full.txt', size: '3,704 B', stage: 3, depth: 1 }
  ];

  var pressMount = document.getElementById('press-mount');
  if (pressMount) {
    var press = el('div', 'press');
    press.dataset.running = 'false';

    var top = el('div', 'press-top');
    var status = el('div', 'press-status');
    status.appendChild(el('span', 'dot'));
    var state = el('span', 'press-state'); state.textContent = 'ready';
    state.setAttribute('aria-live', 'polite');
    status.appendChild(state);
    var runBtn = el('button', 'press-run'); runBtn.type = 'button';
    var runIco = el('span', 'ico'); runIco.textContent = '\u25b6';
    var runLabel = el('span', 'run-label'); runLabel.textContent = 'Run the press';
    runBtn.appendChild(runIco); runBtn.appendChild(runLabel);
    top.appendChild(status); top.appendChild(runBtn);

    var rail = el('div', 'press-rail');
    rail.setAttribute('role', 'group');
    rail.setAttribute('aria-label', 'Pipeline stages');
    var railFill = el('span', 'rail-fill');
    railFill.setAttribute('aria-hidden', 'true');
    rail.appendChild(railFill);
    var stageBtns = [];
    STAGES.forEach(function (s, i) {
      var b = el('button', 'stage'); b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      var n = el('span', 'stage-n'); n.textContent = '0' + (i + 1);
      var name = el('span', 'stage-name'); name.textContent = s.id;
      var sub = el('span', 'stage-sub'); sub.textContent = s.sub;
      b.appendChild(n); b.appendChild(name); b.appendChild(sub);
      b.addEventListener('click', function () { stopRun(); show(i); runLabel.textContent = 'Run the press'; });
      rail.appendChild(b); stageBtns.push(b);
    });

    var grid = el('div', 'press-grid');
    var filesCol = el('aside', 'press-files');
    filesCol.appendChild(txt('p', 'press-label', 'demo_work/'));
    var tree = el('div', 'tree');
    filesCol.appendChild(tree);

    var termCol = el('div', 'press-term');
    var termBar = el('div', 'term-bar');
    var dots = el('span', 'term-dots'); dots.setAttribute('aria-hidden', 'true');
    dots.appendChild(el('i')); dots.appendChild(el('i')); dots.appendChild(el('i'));
    termBar.appendChild(dots);
    termBar.appendChild(txt('span', 'term-title', 'novel-translate \u2014 demo'));
    var copyBtn = el('button', 'term-copy'); copyBtn.type = 'button'; copyBtn.textContent = 'copy';
    termBar.appendChild(copyBtn);
    var termBody = el('div', 'term-body');
    termCol.appendChild(termBar); termCol.appendChild(termBody);

    var artCol = el('aside', 'press-art');

    grid.appendChild(filesCol); grid.appendChild(termCol); grid.appendChild(artCol);
    press.appendChild(top); press.appendChild(rail); press.appendChild(grid);
    pressMount.appendChild(press);

    var current = 0, lastShown = 0, runTimer = null, currentCmd = '';

    function setStatus(s) { state.textContent = s; }

    function buildTree() {
      tree.textContent = '';
      FILES.forEach(function (f, idx) {
        var row;
        if (f.dir) {
          row = el('div', 't-row dir d' + f.depth);
        } else {
          row = el('button', 't-row d' + f.depth);
          row.type = 'button';
          row.addEventListener('click', function () {
            stopRun(); show(f.stage); runLabel.textContent = 'Run the press';
            row.classList.add('new');
            setTimeout(function () { row.classList.remove('new'); }, 500);
          });
          row.title = 'Produced by ' + STAGES[f.stage].id;
        }
        var name = el('span', 't-name'); name.textContent = f.name;
        var size = el('span', 't-size'); size.textContent = f.size || '';
        row.appendChild(name); row.appendChild(size);
        row.dataset.stage = String(f.stage);
        row.dataset.idx = String(idx);
        tree.appendChild(row);
      });
    }

    function renderTree(stage, animate) {
      Array.prototype.forEach.call(tree.children, function (row) {
        var s = Number(row.dataset.stage);
        var on = s <= stage;
        row.classList.toggle('on', on);
        row.classList.toggle('off', !on);
        if (on && animate && s === stage) {
          row.classList.add('new');
          setTimeout(function () { row.classList.remove('new'); }, 650);
        }
      });
    }

    function renderTerm(stage) {
      termBody.textContent = '';
      var pre = el('pre');
      if (stage.cmd) {
        var cmd = el('span', 'term-cmd');
        cmd.appendChild(txt('span', 'prompt', '$ '));
        cmd.appendChild(document.createTextNode(stage.cmd));
        pre.appendChild(cmd);
        pre.appendChild(txt('span', 'term-cursor', '\u258d'));
        pre.appendChild(document.createTextNode('\n'));
        currentCmd = stage.cmd;
        copyBtn.disabled = false;
        copyBtn.textContent = 'copy';
      } else {
        currentCmd = '';
        copyBtn.disabled = true;
      }
      if (stage.out) {
        stage.out.forEach(function (line, i) {
          var l = el('span', 'term-line' + (i === 0 ? ' hl' : ''));
          l.textContent = line;
          l.style.animationDelay = (reduce ? 0 : i * 45) + 'ms';
          pre.appendChild(l);
          pre.appendChild(document.createTextNode('\n'));
        });
      }
      if (stage.excerpt) {
        var hand = el('span', 'term-handoff');
        stage.excerpt.split('\n').forEach(function (line) {
          if (line.indexOf('<<<PART') === 0) {
            hand.appendChild(txt('span', 'mk', line));
          } else {
            hand.appendChild(document.createTextNode(line));
          }
          hand.appendChild(document.createTextNode('\n'));
        });
        pre.appendChild(hand);
        pre.appendChild(document.createTextNode('\n'));
      }
      termBody.appendChild(pre);
      if (stage.note) {
        var note = el('p', 'term-note');
        note.textContent = stage.note;
        termBody.appendChild(note);
      }
    }

    function renderArt(stage) {
      artCol.textContent = '';
      if (stage.id === 'prepare') {
        artCol.appendChild(txt('p', 'art-kicker', 'manifest.json'));
        var big = el('div', 'art-big');
        big.appendChild(txt('span', 'n', '13'));
        var u = el('span', 'u');
        u.appendChild(document.createTextNode('parts'));
        u.appendChild(el('br'));
        u.appendChild(document.createTextNode('in 3 batch files'));
        big.appendChild(u);
        artCol.appendChild(big);
        var table = el('table', 'art-table');
        [['batch_001_005.txt', '1\u20135', '1,449 B'],
         ['batch_006_010.txt', '6\u201310', '1,381 B'],
         ['batch_011_013.txt', '11\u201313', '1,043 B']].forEach(function (r) {
          var tr = el('tr');
          r.forEach(function (c) { tr.appendChild(txt('td', '', c)); });
          table.appendChild(tr);
        });
        artCol.appendChild(table);
        artCol.appendChild(txt('p', 'art-note', 'chapters: missing=none \u00b7 empty=none'));
      } else if (stage.id === 'verify') {
        artCol.appendChild(txt('p', 'art-kicker', 'verify --strict'));
        var big2 = el('div', 'art-big ok');
        big2.appendChild(txt('span', 'n', '0'));
        var u2 = el('span', 'u');
        u2.appendChild(document.createTextNode('missing chapters'));
        u2.appendChild(el('br'));
        u2.appendChild(document.createTextNode('0 empty / suspicious'));
        big2.appendChild(u2);
        artCol.appendChild(big2);
        var ticks = el('div', 'ticks');
        for (var i = 1; i <= 13; i++) {
          var t = el('i'); t.textContent = '\u2713'; t.title = 'part ' + i; ticks.appendChild(t);
        }
        artCol.appendChild(ticks);
        artCol.appendChild(txt('p', 'art-note', 'TOC-aware continuity across 13 parts. --strict turns any issue into a non-zero exit; this run is clean.'));
      } else if (stage.id === 'translate') {
        artCol.appendChild(txt('p', 'art-kicker', 'batch_006_010.txt'));
        var badge = el('div', 'art-badge ok'); badge.textContent = '5 / 5 markers kept';
        artCol.appendChild(badge);
        var chips = el('div', 'mk-chips');
        [6, 7, 8, 9, 10].forEach(function (n) {
          chips.appendChild(txt('span', 'mk-chip', '<<<PART ' + n + '>>>'));
        });
        artCol.appendChild(chips);
        artCol.appendChild(txt('p', 'art-note', 'Five markers in, five out. The heading and body get translated; the marker lines come back byte-identical \u2014 translate counts them per batch and warns on drift.'));
      } else {
        artCol.appendChild(txt('p', 'art-kicker', 'demo.uk.epub'));
        var big3 = el('div', 'art-big ok');
        big3.appendChild(txt('span', 'n', '13'));
        var u3 = el('span', 'u');
        u3.appendChild(document.createTextNode('parts assembled'));
        u3.appendChild(el('br'));
        u3.appendChild(document.createTextNode('13 / 13 markers'));
        big3.appendChild(u3);
        artCol.appendChild(big3);
        var spec = el('dl', 'art-spec');
        [['file', '8,523 B'], ['language', 'uk'], ['documents', '14 (nav + 13)'], ['translated_full.txt', '3,704 B']].forEach(function (r) {
          var d = el('div');
          d.appendChild(txt('dt', '', r[0])); d.appendChild(txt('dd', '', r[1]));
          spec.appendChild(d);
        });
        artCol.appendChild(spec);
        artCol.appendChild(txt('p', 'art-note', 'Read back: title demo_book \u00b7 language uk. Drop one marker and assemble exits 2 \u2014 the lab below replays it.'));
      }
    }

    function positionFill(i) {
      var rb = rail.getBoundingClientRect();
      var sb = stageBtns[i].getBoundingClientRect();
      var p = (sb.left + sb.width / 2 - rb.left - 34) / Math.max(1, rb.width - 68);
      rail.style.setProperty('--p', String(Math.max(0, Math.min(1, p))));
    }

    function show(i) {
      current = i;
      stageBtns.forEach(function (b, j) {
        b.classList.toggle('on', j === i);
        b.classList.toggle('done', j < i);
        b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
      setStatus((press.dataset.running === 'true' ? 'running \u00b7 ' : '') + 'stage ' + (i + 1) + ' / 4 \u00b7 ' + STAGES[i].id);
      positionFill(i);
      renderTree(i, i > lastShown);
      renderTerm(STAGES[i]);
      renderArt(STAGES[i]);
      lastShown = i;
    }

    window.addEventListener('resize', function () { positionFill(current); });

    function stopRun() {
      if (runTimer) { clearTimeout(runTimer); runTimer = null; }
      press.dataset.running = 'false';
      if (runLabel.textContent === 'Running\u2026') { runLabel.textContent = 'Run the press'; }
    }

    function run() {
      stopRun();
      if (reduce) {
        show(3);
        runLabel.textContent = 'Replay';
        setStatus('complete \u00b7 13 parts assembled');
        return;
      }
      press.dataset.running = 'true';
      runLabel.textContent = 'Running\u2026';
      lastShown = -1;
      var i = 0;
      function step() {
        show(i);
        i++;
        if (i < STAGES.length) {
          runTimer = setTimeout(step, 950);
        } else {
          runTimer = setTimeout(function () {
            press.dataset.running = 'false';
            runLabel.textContent = 'Replay';
            setStatus('complete \u00b7 13 parts assembled');
            runTimer = null;
          }, 950);
        }
      }
      step();
    }

    runBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', function () {
      if (!currentCmd) { return; }
      var done = function () {
        copyBtn.textContent = 'copied';
        copyBtn.classList.add('on');
        setTimeout(function () { copyBtn.textContent = 'copy'; copyBtn.classList.remove('on'); }, 1300);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentCmd).then(done, function () { done(); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = currentCmd; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) { /* no-op */ }
        document.body.removeChild(ta); done();
      }
    });

    buildTree();
    show(0);
  }

  /* ================================================================
     2. THE BATCH SHELF
     ================================================================ */
  var shelfMount = document.getElementById('shelf-mount');
  if (shelfMount) {
    var shelf = el('div', 'shelf');
    var shelfTop = el('div', 'shelf-top');
    var shelfIntro = el('div');
    shelfIntro.appendChild(txt('p', 'art-kicker', 'the batch planner'));
    var introLine = el('p', 'shelf-read');
    introLine.appendChild(txt('span', '', 'One flag, two scales \u2014 215 real chapters and 13 demo parts.'));
    shelfIntro.appendChild(introLine);
    var sizeLabel = el('label', 'shelf-size');
    sizeLabel.appendChild(document.createTextNode('parts / batch'));
    var out = el('output', '', '5'); out.id = 'batch-out';
    sizeLabel.appendChild(out);
    shelfTop.appendChild(shelfIntro); shelfTop.appendChild(sizeLabel);

    var range = el('input', 'shelf-range');
    range.type = 'range'; range.min = '1'; range.max = '10'; range.step = '1'; range.value = '5';
    range.setAttribute('aria-label', 'Parts per batch file');

    var scale = el('div', 'shelf-scale');
    ['1', '5', '10'].forEach(function (v, i) {
      var s = el('span', v === '5' ? 'tick' : '');
      s.textContent = v === '5' ? '5 \u00b7 default' : v;
      s.style.left = (i === 0 ? '0%' : i === 1 ? '44.4%' : '100%');
      scale.appendChild(s);
    });

    var realLabel = el('div', 'shelf-row-label');
    realLabel.appendChild(txt('span', '', 'the real run \u00b7 215 chapters'));
    var realRead = el('b', '', '43 files \u00b7 last holds 5');
    realLabel.appendChild(realRead);
    var realShelf = el('div', 'shelf-row real');
    realShelf.setAttribute('role', 'group'); realShelf.setAttribute('aria-label', 'Real run batches');

    var demoLabel = el('div', 'shelf-row-label');
    demoLabel.appendChild(txt('span', '', 'the demo \u00b7 13 parts'));
    var demoRead = el('b', '', '3 files \u00b7 last holds 3');
    demoLabel.appendChild(demoRead);
    var demoShelf = el('div', 'shelf-row demo');
    demoShelf.setAttribute('role', 'group'); demoShelf.setAttribute('aria-label', 'Demo batches');

    var meta = el('p', 'shelf-meta');
    meta.textContent = 'Hover or tap a crate \u2014 every crate is one batch file.';

    shelf.appendChild(shelfTop); shelf.appendChild(range); shelf.appendChild(scale);
    shelf.appendChild(realLabel); shelf.appendChild(realShelf);
    shelf.appendChild(demoLabel); shelf.appendChild(demoShelf); shelf.appendChild(meta);
    shelfMount.appendChild(shelf);

    var DEMO_SIZES = { 'batch_001_005.txt': '1,449 B', 'batch_006_010.txt': '1,381 B', 'batch_011_013.txt': '1,043 B' };

    function batches(total, size) {
      var list = [], start = 1;
      while (start <= total) {
        var end = Math.min(start + size - 1, total);
        list.push({ start: start, end: end, count: end - start + 1 });
        start = end + 1;
      }
      return list;
    }

    function crateFor(b, demo, total) {
      var crate = el('button', 'crate');
      crate.type = 'button';
      crate.style.setProperty('--grow', String(b.count));
      crate.dataset.file = fileFor(b.start, b.end);
      crate.dataset.start = String(b.start);
      crate.dataset.end = String(b.end);
      crate.dataset.count = String(b.count);
      crate.dataset.demo = demo ? '1' : '';
      crate.setAttribute('aria-label', crate.dataset.file + ', ' + (demo ? 'parts ' : 'chapters ') + b.start + '\u2013' + b.end + ', ' + unit(b.count, demo ? 'part' : 'chapter'));
      for (var k = b.start; k <= b.end; k++) {
        var s = el('i', 'spine');
        s.style.setProperty('--h', (demo ? 28 + ((k * 7) % 7) : 20 + ((k * 7) % 9)) + 'px');
        if (demo) {
          var num = el('span', '', String(k));
          s.appendChild(num);
        }
        crate.appendChild(s);
      }
      crate.addEventListener('mouseenter', function () { showMeta(crate); });
      crate.addEventListener('focus', function () { showMeta(crate); });
      crate.addEventListener('click', function () {
        var pinned = crate.classList.contains('pin');
        Array.prototype.forEach.call(crate.parentNode.children, function (c) { c.classList.remove('pin'); });
        if (!pinned) { crate.classList.add('pin'); }
        showMeta(crate);
      });
      return crate;
    }

    function showMeta(crate) {
      var demo = crate.dataset.demo === '1';
      var file = crate.dataset.file;
      var start = crate.dataset.start, end = crate.dataset.end, count = crate.dataset.count;
      var parts = [];
      parts.push('<b>' + file + '</b>');
      parts.push((demo ? 'parts ' : 'chapters ') + start + '\u2013' + end);
      parts.push(unit(count, demo ? 'part' : 'chapter'));
      if (demo) {
        if (DEMO_SIZES[file]) { parts.push(DEMO_SIZES[file]); }
        parts.push(count + '/' + count + ' markers');
      }
      meta.innerHTML = parts.join(' \u00b7 ');
    }

    function renderShelf() {
      var n = Number(range.value);
      var real = batches(215, n);
      var demo = batches(13, n);
      out.textContent = String(n);
      realRead.textContent = real.length + ' files \u00b7 last holds ' + real[real.length - 1].count;
      demoRead.textContent = demo.length + ' files \u00b7 last holds ' + demo[demo.length - 1].count;
      range.setAttribute('aria-valuetext', n + (n === 1 ? ' part' : ' parts') + ' per batch: ' + real.length + ' real-run files, ' + demo.length + ' demo files');

      realShelf.textContent = '';
      real.forEach(function (b) { realShelf.appendChild(crateFor(b, false, 215)); });
      demoShelf.textContent = '';
      demo.forEach(function (b) { demoShelf.appendChild(crateFor(b, true, 13)); });
      meta.textContent = 'Hover or tap a crate \u2014 every crate is one batch file.';
    }

    var raf = null;
    range.addEventListener('input', function () {
      if (raf) { return; }
      raf = window.requestAnimationFrame(function () { raf = null; renderShelf(); });
    });

    renderShelf();
  }

  /* ================================================================
     3. THE MARKER LAB
     ================================================================ */
  var PARTS = [
    { n: 1, title: 'Prologue', batch: 'batch_001_005.txt', snippet: 'This is a small demonstration book for the novel-translate pipeline. It contains a prologue and twelve short fables. Prepare it, translate the batch...' },
    { n: 2, title: 'Chapter 1', batch: 'batch_001_005.txt', snippet: 'The Fox and the Grapes A hungry fox saw ripe grapes hanging high on a vine. He leapt and leapt, but could not reach them. At last he walked away and...' },
    { n: 3, title: 'Chapter 2', batch: 'batch_001_005.txt', snippet: 'The Tortoise and the Hare A hare mocked a tortoise for walking so slowly. The tortoise answered that he would win a race between them. The hare ran...' },
    { n: 4, title: 'Chapter 3', batch: 'batch_001_005.txt', snippet: 'The Lion and the Mouse A mouse ran across a sleeping lion and woke him. The lion caught the mouse, but set him free when the little creature begged...' },
    { n: 5, title: 'Chapter 4', batch: 'batch_001_005.txt', snippet: 'The North Wind and the Sun The wind and the sun argued about who was stronger. They agreed to test their strength on a traveller wearing a coat. The...' },
    { n: 6, title: 'Chapter 5', batch: 'batch_006_010.txt', snippet: 'The Crow and the Pitcher A thirsty crow found a pitcher with a little water at the bottom, out of reach of her beak. She dropped pebbles into the pi...' },
    { n: 7, title: 'Chapter 6', batch: 'batch_006_010.txt', snippet: 'The Fox and the Crow A crow sat in a tree with a piece of cheese in her beak. A fox praised her beauty and asked to hear her voice. The crow opened...' },
    { n: 8, title: 'Chapter 7', batch: 'batch_006_010.txt', snippet: 'The Ant and the Grasshopper All summer the ant stored grain while the grasshopper sang. When winter came the grasshopper had nothing to eat and begg...' },
    { n: 9, title: 'Chapter 8', batch: 'batch_006_010.txt', snippet: 'The Town Mouse and the Country Mouse A country mouse invited his cousin from town to a simple dinner of grain. The town mouse took him to a grand ho...' },
    { n: 10, title: 'Chapter 9', batch: 'batch_006_010.txt', snippet: 'The Dog and His Shadow A dog carried a piece of meat across a bridge and saw his own reflection in the water below. Thinking it was another dog with...' },
    { n: 11, title: 'Chapter 10', batch: 'batch_011_013.txt', snippet: 'The Milkmaid and Her Pail A milkmaid walked to market carrying a pail of milk on her head and planned what she would buy with the money. She would s...' },
    { n: 12, title: 'Chapter 11', batch: 'batch_011_013.txt', snippet: 'The Bear and the Two Travellers Two travellers met a bear on the road. One climbed a tree; the other fell flat and held his breath. The bear sniffed...' },
    { n: 13, title: 'Chapter 12', batch: 'batch_011_013.txt', snippet: 'The Bundle of Sticks An old man called his quarrelling sons together and showed them a bundle of sticks. No one could break the bundle, but each sti...' }
  ];

  var markerMount = document.getElementById('marker-mount');
  if (markerMount) {
    var lab = el('div', 'lab');
    var labTop = el('div', 'lab-top');
    var meter = el('div', 'lab-meter');
    var countEl = el('span', 'count', '13/13');
    meter.appendChild(countEl);
    meter.appendChild(txt('span', '', 'markers kept'));
    var bar = el('span', 'lab-bar');
    for (var bi = 1; bi <= 13; bi++) { bar.appendChild(el('i')); }
    meter.appendChild(bar);
    var faults = el('div', 'lab-faults');
    var dropBtn = el('button', 'fault'); dropBtn.type = 'button'; dropBtn.textContent = 'Drop a marker'; dropBtn.dataset.fault = 'drop';
    var dupeBtn = el('button', 'fault'); dupeBtn.type = 'button'; dupeBtn.textContent = 'Duplicate a marker'; dupeBtn.dataset.fault = 'dupe';
    dropBtn.setAttribute('aria-pressed', 'false'); dupeBtn.setAttribute('aria-pressed', 'false');
    faults.appendChild(dropBtn); faults.appendChild(dupeBtn);
    var assembleBtn = el('button', 'lab-run'); assembleBtn.type = 'button'; assembleBtn.textContent = 'Run assemble';
    labTop.appendChild(meter); labTop.appendChild(faults); labTop.appendChild(assembleBtn);

    var mi = el('div', 'mi');
    var head = el('p', 'mi-head');
    head.textContent = PARTS.length + ' parts \u00b7 3 batch files \u00b7 5 parts per batch (the default)';
    var grid = el('div', 'mi-files');
    var detail = el('div', 'mi-detail');
    detail.setAttribute('aria-live', 'polite');
    var result = el('div', 'lab-result');
    result.setAttribute('aria-live', 'polite');
    var labNote = el('p', 'lab-note');
    labNote.textContent = 'Faults are simulated in the browser \u2014 the messages are the validator\u2019s own, captured from real runs.';

    mi.appendChild(head); mi.appendChild(grid); mi.appendChild(detail);
    lab.appendChild(labTop); lab.appendChild(mi); lab.appendChild(result); lab.appendChild(labNote);
    markerMount.appendChild(lab);

    var batches = [];
    PARTS.forEach(function (p) { if (batches.indexOf(p.batch) === -1) { batches.push(p.batch); } });
    var buttonsById = {};
    var cardsByBatch = {};
    var caret = el('div', 'mi-caret');
    caret.setAttribute('aria-hidden', 'true');
    var currentPart = 1;
    var fault = null;

    batches.forEach(function (name) {
      var card = el('div', 'mi-file');
      var h = el('h4');
      h.appendChild(document.createTextNode(name));
      var badge = el('span', 'mi-badge');
      h.appendChild(badge);
      card.appendChild(h);
      PARTS.filter(function (p) { return p.batch === name; }).forEach(function (p) {
        var b = el('button', 'mi-part');
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        var num = el('span', 'mi-n'); num.textContent = String(p.n);
        var t = el('span', 'mi-t'); t.textContent = p.title;
        b.appendChild(num); b.appendChild(t);
        b.addEventListener('click', function () { select(p.n); });
        buttonsById[p.n] = b;
        card.appendChild(b);
      });
      cardsByBatch[name] = { card: card, badge: badge };
      grid.appendChild(card);
    });

    function positionCaret(n) {
      var btn = buttonsById[n];
      if (!btn) { return; }
      var b = btn.getBoundingClientRect(), d = detail.getBoundingClientRect();
      var x = b.left + b.width / 2 - d.left - 6;
      x = Math.max(10, Math.min(d.width - 22, x));
      caret.style.left = x + 'px';
    }

    function renderBadges() {
      var badCount = 0;
      batches.forEach(function (name) {
        var list = PARTS.filter(function (p) { return p.batch === name; });
        var total = list.length;
        var has = list.some(function (p) { return p.n === currentPart; });
        var delta = has && fault === 'drop' ? -1 : has && fault === 'dupe' ? 1 : 0;
        var got = total + delta;
        var badge = cardsByBatch[name].badge;
        badge.textContent = got + '/' + total;
        badge.classList.toggle('bad', got !== total);
      });
      Array.prototype.forEach.call(bar.children, function (seg, i) {
        seg.classList.toggle('bad', (i + 1) === currentPart && !!fault);
      });
      var totalParts = PARTS.length;
      if (fault === 'drop') { countEl.textContent = (totalParts - 1) + '/' + totalParts; }
      else if (fault === 'dupe') { countEl.textContent = (totalParts + 1) + '/' + totalParts; }
      else { countEl.textContent = totalParts + '/' + totalParts; }
      return badCount;
    }

    function renderDetail() {
      var p = PARTS[currentPart - 1];
      var activeBtn = buttonsById[currentPart];
      Object.keys(buttonsById).forEach(function (k) {
        buttonsById[k].classList.toggle('on', Number(k) === currentPart);
        buttonsById[k].setAttribute('aria-pressed', Number(k) === currentPart ? 'true' : 'false');
      });
      Array.prototype.forEach.call(grid.children, function (c) {
        c.classList.toggle('on', c.contains(activeBtn));
      });
      detail.textContent = '';
      detail.appendChild(caret);
      var marker = el('div', 'mi-marker' + (fault === 'drop' ? ' struck' : ''));
      marker.appendChild(document.createTextNode('<<<PART ' + p.n + '>>>'));
      if (fault) {
        marker.appendChild(txt('span', 'mi-fault', fault === 'drop' ? 'dropped' : 'duplicated'));
      }
      detail.appendChild(marker);
      if (fault === 'dupe') {
        detail.appendChild(txt('p', 'mi-dup', '<<<PART ' + p.n + '>>>'));
      }
      detail.appendChild(txt('p', 'mi-title', p.title));
      detail.appendChild(txt('p', 'mi-snip', p.snippet));
      detail.appendChild(txt('p', 'mi-meta', 'from ' + p.batch));
      positionCaret(p.n);
    }

    function runAssemble() {
      result.textContent = '';
      var p = PARTS[currentPart - 1];
      var cmd = el('div', 'res-cmd');
      cmd.appendChild(txt('span', 'prompt', '$ '));
      cmd.appendChild(document.createTextNode('novel-translate assemble -w demo_work -o demo_work/demo.uk.epub'));
      result.appendChild(cmd);
      if (!fault) {
        var line = el('div', 'res-line');
        line.appendChild(txt('span', 'res-out', 'assembled 13 part(s) -> demo_work/demo.uk.epub'));
        line.appendChild(txt('span', 'res-exit', 'exit 0'));
        result.appendChild(line);
        var line2 = el('div', 'res-line');
        line2.appendChild(txt('span', 'res-out', 'combined text -> demo_work\\translated_full.txt'));
        result.appendChild(line2);
      } else if (fault === 'drop') {
        var bad = el('div', 'res-line');
        bad.appendChild(txt('span', 'res-out bad', 'error: missing part(s) in the translated files: [' + p.n + ']'));
        bad.appendChild(txt('span', 'res-exit bad', 'exit 2'));
        result.appendChild(bad);
      } else {
        var bad2 = el('div', 'res-line');
        bad2.appendChild(txt('span', 'res-out bad', 'error: part ' + p.n + ' appears more than once (check ' + p.batch + ')'));
        bad2.appendChild(txt('span', 'res-exit bad', 'exit 2'));
        result.appendChild(bad2);
      }
    }

    function select(n) {
      currentPart = n;
      renderDetail();
      renderBadges();
      runAssemble();
    }

    function setFault(next) {
      fault = fault === next ? null : next;
      dropBtn.classList.toggle('on', fault === 'drop');
      dupeBtn.classList.toggle('on', fault === 'dupe');
      dropBtn.setAttribute('aria-pressed', fault === 'drop' ? 'true' : 'false');
      dupeBtn.setAttribute('aria-pressed', fault === 'dupe' ? 'true' : 'false');
      renderDetail();
      renderBadges();
      runAssemble();
    }

    dropBtn.addEventListener('click', function () { setFault('drop'); });
    dupeBtn.addEventListener('click', function () { setFault('dupe'); });
    assembleBtn.addEventListener('click', runAssemble);
    window.addEventListener('resize', function () { positionCaret(currentPart); });

    select(1);
  }
})();
