/* shared site behaviour: theme toggle, lightbox, before/after sliders,
   plus studio chrome: scroll progress, section rail, scrollspy, scroll reveals,
   KPI count-ups. Reveals/count-ups are opt-in via html.mp-anim (set by the head
   script) and disabled for prefers-reduced-motion. */
(function () {
  var html = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var animate = !reduce && html.classList.contains('mp-anim');

  /* theme toggle */
  var btn = document.getElementById('theme-toggle');
  if (btn) {
    var sync = function () { btn.textContent = html.dataset.theme === 'dark' ? 'Light theme' : 'Dark theme'; };
    sync();
    var applyTheme = function (next) {
      html.dataset.theme = next;
      try { localStorage.setItem('mp-theme', next); } catch (e) {}
      sync();
    };
    btn.addEventListener('click', function () {
      var next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      /* crossfade through the View Transitions API where available; the theme
         attribute is still set synchronously, so scripted reads never race it. */
      if (document.startViewTransition && !reduce) {
        document.startViewTransition(function () { applyTheme(next); });
      } else {
        applyTheme(next);
      }
    });
  }
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  /* ---- shared: toast + clipboard ---- */
  var toastEl = null, toastTimer = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { showToast('Copy failed'); }
    ta.remove();
  }
  function copyText(text, okMsg) {
    var done = function () { showToast(okMsg || 'Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function sectionUrl(id) { return location.href.split('#')[0] + '#' + id; }

  /* lightbox: a gallery over the images of the section you clicked. Dialog
     semantics, keyboard arrows, a counter and the figure's caption. lbEl holds a
     direct reference to the overlay; inner classes are lb-* so a component class
     can never be mistaken for the overlay (the old .lb collision lesson). */
  var lastFocus = null, lbEl = null, lbImgs = [], lbIdx = 0;
  var lbStage = null, lbCap = null, lbCount = null, lbPrev = null, lbNext = null, lbClose = null;
  function closeLb() {
    if (lbEl) { lbEl.remove(); }
    lbEl = null; lbImgs = [];
    document.body.classList.remove('lb-open');
    if (lastFocus && document.contains(lastFocus)) { lastFocus.focus(); }
    lastFocus = null;
  }
  function lbUpdate() {
    if (!lbEl || !lbImgs.length) { return; }
    var img = lbImgs[lbIdx];
    var big = lbStage.querySelector('img');
    big.src = img.src; big.alt = img.alt;
    var fig = img.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent : '';
    lbCap.hidden = !cap;
    lbCount.textContent = (lbIdx + 1) + ' / ' + lbImgs.length;
    lbPrev.disabled = lbIdx === 0;
    lbNext.disabled = lbIdx === lbImgs.length - 1;
    /* preload neighbours so the arrows feel instant */
    [lbImgs[lbIdx - 1], lbImgs[lbIdx + 1]].forEach(function (n) {
      if (n) { var p = new Image(); p.src = n.src; }
    });
  }
  function lbStep(d) {
    if (!lbEl) { return; }
    lbIdx = Math.max(0, Math.min(lbImgs.length - 1, lbIdx + d));
    lbUpdate();
  }
  function openLb(img) {
    closeLb();
    var sec = img.closest('.project');
    lbImgs = [].slice.call((sec || document).querySelectorAll('.shot img'));
    lbIdx = Math.max(0, lbImgs.indexOf(img));
    var overlay = document.createElement('div');
    overlay.className = 'lb';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.tabIndex = -1;

    lbStage = document.createElement('div'); lbStage.className = 'lb-stage';
    var big = document.createElement('img'); big.alt = ''; lbStage.appendChild(big);
    lbCap = document.createElement('p'); lbCap.className = 'lb-cap';
    lbCount = document.createElement('span'); lbCount.className = 'lb-count'; lbCount.setAttribute('aria-live', 'polite');
    lbPrev = document.createElement('button'); lbPrev.type = 'button'; lbPrev.className = 'lb-nav lb-prev'; lbPrev.setAttribute('aria-label', 'Previous image'); lbPrev.textContent = '‹';
    lbNext = document.createElement('button'); lbNext.type = 'button'; lbNext.className = 'lb-nav lb-next'; lbNext.setAttribute('aria-label', 'Next image'); lbNext.textContent = '›';
    lbClose = document.createElement('button'); lbClose.type = 'button'; lbClose.className = 'lb-close'; lbClose.setAttribute('aria-label', 'Close image preview'); lbClose.textContent = '×';

    overlay.appendChild(lbStage); overlay.appendChild(lbCap); overlay.appendChild(lbCount);
    overlay.appendChild(lbPrev); overlay.appendChild(lbNext); overlay.appendChild(lbClose);
    document.body.appendChild(overlay);
    document.body.classList.add('lb-open');
    lbEl = overlay; lastFocus = img;
    if (!img.hasAttribute('tabindex')) { img.setAttribute('tabindex', '-1'); }
    lbUpdate();
    lbClose.focus();
  }
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest) { return; }
    if (ev.target.closest('.lb')) {
      if (ev.target.closest('.lb-prev')) { lbStep(-1); return; }
      if (ev.target.closest('.lb-next')) { lbStep(1); return; }
      if (ev.target.closest('.lb-close') || ev.target.closest('.lb-stage') || ev.target === lbEl) { closeLb(); }
      return;
    }
    var img = ev.target.closest('.shot img');
    if (!img) { return; }
    openLb(img);
  });
  document.addEventListener('keydown', function (ev) {
    if (!lbEl) { return; }
    if (ev.key === 'Escape') { ev.preventDefault(); closeLb(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); lbStep(-1); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); lbStep(1); }
    else if (ev.key === 'Home') { ev.preventDefault(); lbIdx = 0; lbUpdate(); }
    else if (ev.key === 'End') { ev.preventDefault(); lbIdx = lbImgs.length - 1; lbUpdate(); }
    else if (ev.key === 'Tab') {
      ev.preventDefault();
      var focusables = [lbClose, lbPrev, lbNext].filter(function (b) { return !b.disabled; });
      var i = focusables.indexOf(document.activeElement);
      var next = ev.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : (i + 1) % focusables.length;
      focusables[next].focus();
    }
  });
  /* swipe between images on touch devices */
  var lbTouchX = null;
  document.addEventListener('touchstart', function (ev) {
    if (lbEl && ev.touches.length === 1) { lbTouchX = ev.touches[0].clientX; }
  }, { passive: true });
  document.addEventListener('touchend', function (ev) {
    if (!lbEl || lbTouchX === null) { return; }
    var dx = (ev.changedTouches[0] ? ev.changedTouches[0].clientX : lbTouchX) - lbTouchX;
    lbTouchX = null;
    if (Math.abs(dx) > 44) { lbStep(dx < 0 ? 1 : -1); }
  }, { passive: true });

  /* before/after slider: <div class="ba"><img class="a" src><img class="b" src><input type="range" value="50"></div> */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var b = ba.querySelector('img.b');
    var r = ba.querySelector('input[type="range"]');
    if (!b || !r) { return; }
    if (!r.getAttribute('aria-label')) { r.setAttribute('aria-label', 'Before/after comparison slider'); }
    var set = function () { b.style.clipPath = 'inset(0 0 0 ' + r.value + '%)'; };
    r.addEventListener('input', set);
    set();
  });

  /* ---- copy affordances: code blocks + section permalinks ---- */
  document.querySelectorAll('.card pre').forEach(function (pre) {
    var card = pre.closest('.card');
    if (!card || card.querySelector('.copy-code')) { return; }
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'copy-code'; b.textContent = 'Copy';
    b.setAttribute('aria-label', 'Copy this code block');
    b.addEventListener('click', function () {
      copyText(pre.innerText.replace(/\s+$/, ''), 'Code copied');
      b.textContent = 'Copied'; b.classList.add('on');
      setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('on'); }, 1400);
    });
    card.appendChild(b);
  });
  document.querySelectorAll('main .project[id] .p-head').forEach(function (head) {
    var h2 = head.querySelector('h2');
    var sec = head.closest('.project');
    if (!h2 || !sec) { return; }
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sec-link'; b.textContent = '#';
    b.setAttribute('aria-label', 'Copy link to ' + h2.textContent.trim());
    b.title = 'Copy link to this section';
    b.addEventListener('click', function () {
      copyText(sectionUrl(sec.id), 'Link copied');
      try { history.replaceState(null, '', '#' + sec.id); } catch (e) {}
    });
    head.insertBefore(b, h2.nextSibling);
  });

  /* ---- studio chrome: scroll progress + nav shadow + scrollspy ---- */
  var nav = document.querySelector('.topnav');
  var pbi = document.querySelector('.progressbar i');
  var links = [].slice.call(document.querySelectorAll('.topnav a[href^="#"]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });

  /* section rail (CSS shows it at >=1400px; built from the nav links so it always
     mirrors the real section list) */
  var railBtns = [];
  if (links.length >= 3) {
    var rail = document.createElement('div');
    rail.className = 'rail';
    rail.setAttribute('role', 'navigation');
    rail.setAttribute('aria-label', 'Section index');
    links.forEach(function (a, i) {
      var id = a.getAttribute('href').slice(1);
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-id', id);
      var n = document.createElement('span'); n.className = 'n'; n.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      var dot = document.createElement('span'); dot.className = 'dot';
      var lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = a.textContent.trim();
      b.appendChild(n); b.appendChild(dot); b.appendChild(lbl);
      b.addEventListener('click', function () {
        var el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      });
      rail.appendChild(b);
      railBtns.push(b);
    });
    document.body.appendChild(rail);
  }

  /* ---- command palette: Ctrl/Cmd+K or / opens a section jump list ---- */
  var palBtn = document.getElementById('palette-open');
  var palEl = null, palInput = null, palList = null, palEmpty = null;
  var palRows = [], palSel = 0, palReturnFocus = null;
  function palItems() {
    return links.map(function (a) {
      var id = a.getAttribute('href').slice(1);
      return {
        id: id,
        name: a.textContent.trim(),
        kind: a.getAttribute('data-kind') || '',
        num: a.getAttribute('data-num') || '',
        live: !a.classList.contains('dim')
      };
    });
  }
  function buildPalette() {
    if (palEl) { return; }
    palEl = document.createElement('div');
    palEl.className = 'palette'; palEl.hidden = true;
    palEl.setAttribute('role', 'dialog'); palEl.setAttribute('aria-modal', 'true'); palEl.setAttribute('aria-label', 'Jump to a project');
    var box = document.createElement('div'); box.className = 'pal-box';
    var search = document.createElement('div'); search.className = 'pal-search';
    var ico = document.createElement('span'); ico.className = 'po-ico'; ico.setAttribute('aria-hidden', 'true'); ico.textContent = '⌕';
    palInput = document.createElement('input');
    palInput.type = 'text'; palInput.placeholder = 'Jump to a project…';
    palInput.setAttribute('aria-label', 'Search projects');
    palInput.setAttribute('aria-controls', 'pal-list');
    palInput.setAttribute('aria-autocomplete', 'list');
    palInput.setAttribute('role', 'combobox');
    palInput.setAttribute('aria-haspopup', 'listbox');
    search.appendChild(ico); search.appendChild(palInput);
    palList = document.createElement('div'); palList.className = 'pal-list'; palList.id = 'pal-list';
    palList.setAttribute('role', 'listbox'); palList.setAttribute('aria-label', 'Projects');
    palEmpty = document.createElement('div'); palEmpty.className = 'pal-empty'; palEmpty.textContent = 'No section matches.'; palEmpty.hidden = true;
    palList.appendChild(palEmpty);
    var foot = document.createElement('div'); foot.className = 'pal-foot';
    foot.innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> jump</span><span><kbd>⇧↵</kbd> copy link</span><span><kbd>esc</kbd> close</span>';
    box.appendChild(search); box.appendChild(palList); box.appendChild(foot);
    palEl.appendChild(box);
    document.body.appendChild(palEl);

    palItems().forEach(function (it) {
      var row = document.createElement('div'); row.className = 'pal-row'; row.setAttribute('data-id', it.id);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pal-item';
      b.setAttribute('role', 'option'); b.setAttribute('data-id', it.id); b.setAttribute('aria-selected', 'false');
      var n = document.createElement('span'); n.className = 'pal-num'; n.textContent = it.num;
      var nm = document.createElement('span'); nm.className = 'pal-name'; nm.textContent = it.name + (it.live ? '' : ' · soon');
      var kd = document.createElement('span'); kd.className = 'pal-kind'; kd.textContent = it.kind;
      b.appendChild(n); b.appendChild(nm); b.appendChild(kd);
      b.addEventListener('click', function () { palJump(it.id); });
      var cp = document.createElement('button'); cp.type = 'button'; cp.className = 'pal-copy'; cp.textContent = '⧉';
      cp.title = 'Copy link'; cp.setAttribute('aria-label', 'Copy link to ' + it.name);
      cp.addEventListener('click', function (ev) { ev.stopPropagation(); copyText(sectionUrl(it.id), 'Link copied'); });
      row.appendChild(b); row.appendChild(cp);
      palList.appendChild(row);
      palRows.push({ row: row, item: b, id: it.id, name: it.name.toLowerCase(), kind: it.kind.toLowerCase() });
    });

    palEl.addEventListener('click', function (ev) { if (ev.target === palEl) { closePalette(); } });
    palEl.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab') { return; }
      var f = [palInput].concat([].slice.call(palEl.querySelectorAll('button'))).filter(function (el) { return !el.disabled; });
      var i = f.indexOf(document.activeElement);
      ev.preventDefault();
      var n = ev.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length;
      f[n].focus();
    });
    palInput.addEventListener('input', function () { palFilter(palInput.value); });
    palInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); palMove(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); palMove(-1); }
      else if (ev.key === 'Enter') {
        ev.preventDefault();
        var sel = palVisible()[palSel];
        if (!sel) { return; }
        if (ev.shiftKey) { copyText(sectionUrl(sel.id), 'Link copied'); }
        else { palJump(sel.id); }
      } else if (ev.key === 'Escape') { ev.preventDefault(); closePalette(); }
    });
    if (palBtn) { palBtn.setAttribute('aria-expanded', 'false'); }
  }
  function palVisible() { return palRows.filter(function (r) { return !r.row.hidden; }); }
  function palFilter(q) {
    q = (q || '').trim().toLowerCase();
    palRows.forEach(function (r) {
      r.row.hidden = !!q && r.name.indexOf(q) === -1 && r.kind.indexOf(q) === -1;
    });
    palSel = 0;
    if (palEmpty) { palEmpty.hidden = palVisible().length > 0; }
    palHighlight();
  }
  function palHighlight() {
    var vis = palVisible();
    palRows.forEach(function (r) {
      r.row.classList.remove('on');
      r.item.setAttribute('aria-selected', 'false');
    });
    if (!vis.length) { palInput.removeAttribute('aria-activedescendant'); return; }
    palSel = Math.max(0, Math.min(vis.length - 1, palSel));
    var r = vis[palSel];
    r.row.classList.add('on');
    r.item.setAttribute('aria-selected', 'true');
    if (!r.item.id) { r.item.id = 'pal-opt-' + r.id; }
    palInput.setAttribute('aria-activedescendant', r.item.id);
    var rr = r.row.getBoundingClientRect(), lr = palList.getBoundingClientRect();
    if (rr.top < lr.top) { palList.scrollTop -= (lr.top - rr.top); }
    else if (rr.bottom > lr.bottom) { palList.scrollTop += (rr.bottom - lr.bottom); }
  }
  function palMove(d) { palSel += d; palHighlight(); }
  function palJump(id) {
    var el = document.getElementById(id);
    if (!el) { return; }
    palReturnFocus = null;
    closePalette();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  function openPalette() {
    buildPalette();
    if (!palEl) { return; }
    palReturnFocus = document.activeElement;
    palEl.hidden = false;
    document.body.classList.add('pal-open');
    if (palBtn) { palBtn.setAttribute('aria-expanded', 'true'); }
    palInput.value = '';
    palFilter('');
    setTimeout(function () { palInput.focus(); }, 0);
  }
  function closePalette() {
    if (!palEl || palEl.hidden) { return; }
    palEl.hidden = true;
    document.body.classList.remove('pal-open');
    if (palBtn) { palBtn.setAttribute('aria-expanded', 'false'); }
    if (palReturnFocus && document.contains(palReturnFocus)) { palReturnFocus.focus(); }
    palReturnFocus = null;
  }
  if (palBtn) { palBtn.addEventListener('click', openPalette); }
  window.__mpOpenPalette = openPalette;
  window.__mpClosePalette = closePalette;
  document.addEventListener('keydown', function (ev) {
    var k = ev.key;
    var t = ev.target || {};
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '') || t.isContentEditable;
    if ((ev.ctrlKey || ev.metaKey) && (k === 'k' || k === 'K')) {
      ev.preventDefault();
      if (palEl && !palEl.hidden) { closePalette(); } else { openPalette(); }
    } else if (k === 'Escape' && palEl && !palEl.hidden) {
      ev.preventDefault(); closePalette();
    } else if (k === '/' && !typing && !lbEl) {
      ev.preventDefault(); openPalette();
    }
  });

  var ticking = false;
  function frame() {
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = window.scrollY || h.scrollTop || 0;
    if (pbi) { pbi.style.width = (max > 0 ? Math.min(1, y / max) : 0) * 100 + '%'; }
    if (nav) { nav.classList.toggle('scrolled', y > 8); }
    var marker = 96;
    var current = -1;
    for (var i = 0; i < sections.length; i++) {
      var el = sections[i];
      if (!el) { continue; }
      var r = el.getBoundingClientRect();
      if (r.top <= marker && r.bottom > marker) { current = i; break; }
    }
    links.forEach(function (a, i) {
      a.classList.toggle('on', i === current);
      if (i === current) { a.setAttribute('aria-current', 'location'); } else { a.removeAttribute('aria-current'); }
    });
    railBtns.forEach(function (b, i) {
      b.classList.toggle('on', i === current);
      if (i === current) { b.setAttribute('aria-current', 'true'); } else { b.removeAttribute('aria-current'); }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (sections.length) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  /* ---- scroll reveals: every section's top-level block fades in, staggered ---- */
  if (animate) {
    var targets = [];
    document.querySelectorAll('main .project').forEach(function (sec) {
      var kids = [].slice.call(sec.children).filter(function (el) { return el.tagName !== 'SCRIPT'; });
      kids.forEach(function (el, i) {
        el.classList.add('rv');
        el.style.setProperty('--rvd', Math.min(i * 55, 330) + 'ms');
        targets.push(el);
      });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px 14% 0px', threshold: 0.01 });
      targets.forEach(function (t) { io.observe(t); });
    } else {
      targets.forEach(function (t) { t.classList.add('in'); });
    }
    /* escape hatch for scripted captures: reveal everything without animation */
    window.__mpRevealAll = function () { targets.forEach(function (t) { t.classList.add('in'); }); };
  }

  /* ---- KPI count-ups: animate a leading integer; final text is byte-identical.
     Skip: non-numeric starts, decimals/grouped numbers, value <=1, data-static. ---- */
  document.querySelectorAll('.kpi b').forEach(function (b) {
    var txt = b.textContent;
    if (b.hasAttribute('data-static') || !animate) { return; }
    if (txt.indexOf('→') !== -1) { return; } /* arrow pairs like 215 → 43 stay static */
    var m = /^(\d+)([^0-9.,\/-]|$)/.exec(txt);
    if (!m) { return; }
    var n = parseInt(m[1], 10);
    if (!(n > 1) || n > 99999) { return; }
    var suffix = txt.slice(m[1].length);
    var finished = false;
    function finish() { if (!finished) { finished = true; b.textContent = txt; } }
    var t0 = null;
    function step(ts) {
      if (finished) { return; }
      if (t0 === null) { t0 = ts; }
      var p = Math.min(1, (ts - t0) / 900);
      var e = 1 - Math.pow(1 - p, 3);
      if (p < 1) { b.textContent = Math.round(n * e) + suffix; requestAnimationFrame(step); }
      else { finish(); }
    }
    b.setAttribute('data-final', txt);
    if (!('IntersectionObserver' in window)) { return; }
    var io2 = new IntersectionObserver(function (en) {
      if (en.isIntersecting) { io2.disconnect(); b.textContent = '0' + suffix; requestAnimationFrame(step); }
    }, { threshold: 0.35 });
    io2.observe(b);
    setTimeout(finish, 30000); /* safety: never leave a stale intermediate value */
  });
})();
