/* Novel Translation — interactive replay of the demo round trip + marker inspector.
   Every command, output line and text below is verbatim from real runs of the
   tool on examples/demo_book.epub (Windows capture; see HANDOFF.md in the draft). */
(function () {
  'use strict';

  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

  /* ---------- 1. the round trip, replayed ---------- */
  var stages = [
    { id: 'prepare', blocks: [
      { t: 'cmd', s: 'novel-translate prepare examples/demo_book.epub -w demo_work' },
      { t: 'out', s: 'extracted 1 EPUB(s) -> demo_work\\combined.txt\ncleaned text -> demo_work\\cleaned.txt\nwrote 3 batch file(s), 13 part(s) -> demo_work\\batches\nchapters: missing=none empty=none\nnext: translate the batch files (keep the <<<PART n>>> markers) by hand or with \'novel-translate translate\'; then run: novel-translate assemble -w demo_work' },
      { t: 'note', s: 'One command: extract \u2192 clean \u2192 split. 13 parts, five per batch file (the default batch size).' }
    ]},
    { id: 'verify', blocks: [
      { t: 'cmd', s: 'novel-translate verify -w demo_work --strict' },
      { t: 'out', s: 'Missing chapters: None\nEmpty/Suspicious chapters: None' },
      { t: 'note', s: 'Continuity report, TOC-aware \u2014 a run of bare Chapter N lines (a table of contents) can never masquerade as a chapter. --strict turns any issue into a non-zero exit; this run is clean.' }
    ]},
    { id: 'translate', blocks: [
      { t: 'note', s: 'The one step outside the terminal. Batches go to any chat model by hand \u2014 or through the optional stdlib-only API client:' },
      { t: 'out', s: '<<<PART 7>>>\nChapter 6\n\nThe Fox and the Crow\nA crow sat in a tree with a piece of cheese in her beak. A fox praised her beauty and asked to hear her voice. ...\n\n\u2192 save back as demo_work/translated/batch_006_010.txt \u2014 markers untouched' },
      { t: 'cmd', s: 'novel-translate translate -w demo_work --base-url https://openrouter.ai/api/v1 --model <model> --target Ukrainian' },
      { t: 'note', s: 'Batches are sized to fit one session comfortably. Headings get translated too \u2014 the marker lines are the link; translate counts them per batch and warns when a model drifts.' }
    ]},
    { id: 'assemble', blocks: [
      { t: 'cmd', s: 'novel-translate assemble -w demo_work -o demo_work/demo.epub' },
      { t: 'out', s: 'assembled 13 part(s) -> demo_work/demo.epub\ncombined text -> demo_work\\translated_full.txt' },
      { t: 'note', s: 'Translated batches + manifest \u2192 EPUB + combined text, marker-checked. Read back: title demo_book \u00b7 language uk \u00b7 14 documents (nav + 13 parts). Drop one marker anywhere and it exits 2 \u2014 replayed in the card below.' }
    ]}
  ];

  var rt = document.getElementById('roundtrip-mount');
  if (rt) {
    var wrap = el('div', 'rt');
    var tabs = el('div', 'rt-tabs');
    var panel = el('div', 'rt-panel');
    var buttons = [];
    stages.forEach(function (stage, i) {
      var b = el('button', 'rt-tab');
      b.type = 'button';
      var num = el('span', 'rt-n'); num.textContent = String(i + 1);
      var name = el('span', 'rt-name'); name.textContent = 'novel-translate ' + stage.id;
      b.appendChild(num); b.appendChild(name);
      b.addEventListener('click', function () { show(i); });
      tabs.appendChild(b);
      buttons.push(b);
    });
    function show(i) {
      buttons.forEach(function (b, j) {
        b.classList.toggle('on', i === j);
        b.setAttribute('aria-pressed', i === j ? 'true' : 'false');
      });
      panel.textContent = '';
      stages[i].blocks.forEach(function (blk) {
        if (blk.t === 'cmd') {
          var c = el('div', 'rt-cmd');
          var p = el('span', 'rt-prompt'); p.textContent = '$ ';
          c.appendChild(p);
          c.appendChild(document.createTextNode(blk.s));
          panel.appendChild(c);
        } else if (blk.t === 'out') {
          var pre = el('pre', 'rt-out');
          pre.textContent = blk.s;
          panel.appendChild(pre);
        } else {
          var n = el('p', 'rt-note');
          n.textContent = blk.s;
          panel.appendChild(n);
        }
      });
    }
    wrap.appendChild(tabs);
    wrap.appendChild(panel);
    rt.appendChild(wrap);
    show(0);
  }

  /* ---------- 2. the marker inspector ---------- */
  var parts = [
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

  var mk = document.getElementById('marker-mount');
  if (mk) {
    var miWrap = el('div', 'mi');
    var head = el('p', 'mi-head');
    var batches = [];
    parts.forEach(function (p) { if (batches.indexOf(p.batch) === -1) batches.push(p.batch); });
    head.textContent = parts.length + ' parts \u00b7 ' + batches.length + ' batch files \u00b7 5 parts per batch (the default)';
    var grid = el('div', 'mi-files');
    var detail = el('div', 'mi-detail');
    detail.setAttribute('aria-live', 'polite');
    var buttonsById = {};
    var caret = el('div', 'mi-caret');
    caret.setAttribute('aria-hidden', 'true');

    batches.forEach(function (name) {
      var card = el('div', 'mi-file');
      var h = el('h4'); h.textContent = name;
      card.appendChild(h);
      parts.filter(function (p) { return p.batch === name; }).forEach(function (p) {
        var b = el('button', 'mi-part');
        b.type = 'button';
        var num = el('span', 'mi-n'); num.textContent = String(p.n);
        var t = el('span', 'mi-t'); t.textContent = p.title;
        b.appendChild(num); b.appendChild(t);
        b.addEventListener('click', function () { select(p.n); });
        buttonsById[p.n] = b;
        card.appendChild(b);
      });
      grid.appendChild(card);
    });

    var lastN = 1;
    function positionCaret(n) {
      var btn = buttonsById[n];
      if (!btn) { return; }
      var b = btn.getBoundingClientRect(), d = detail.getBoundingClientRect();
      var x = b.left + b.width / 2 - d.left - 6;
      x = Math.max(10, Math.min(d.width - 22, x));
      caret.style.left = x + 'px';
    }

    function select(n) {
      lastN = n;
      var p = parts[n - 1];
      var activeBtn = buttonsById[n];
      Object.keys(buttonsById).forEach(function (k) {
        buttonsById[k].classList.toggle('on', Number(k) === n);
      });
      Array.prototype.forEach.call(grid.children, function (c) {
        c.classList.toggle('on', c.contains(activeBtn));
      });
      detail.textContent = '';
      detail.appendChild(caret);
      var marker = el('div', 'mi-marker'); marker.textContent = '<<<PART ' + p.n + '>>>';
      var title = el('p', 'mi-title'); title.textContent = p.title;
      var snip = el('p', 'mi-snip'); snip.textContent = p.snippet;
      var meta = el('p', 'mi-meta'); meta.textContent = 'from ' + p.batch;
      detail.appendChild(marker); detail.appendChild(title); detail.appendChild(snip); detail.appendChild(meta);
      positionCaret(n);
    }

    window.addEventListener('resize', function () { positionCaret(lastN); });

    miWrap.appendChild(head);
    miWrap.appendChild(grid);
    miWrap.appendChild(detail);
    mk.appendChild(miWrap);
    select(1);
  }
})();
