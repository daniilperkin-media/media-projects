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
    btn.addEventListener('click', function () {
      var next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      try { localStorage.setItem('mp-theme', next); } catch (e) {}
      sync();
    });
  }
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  /* lightbox: click a figure image to zoom; click or Esc closes. Dialog semantics + focus handling.
     lbEl keeps a direct reference to the overlay so it can never be confused with a same-named node. */
  var lastFocus = null;
  var lbEl = null;
  function closeLb() {
    var lb = lbEl || document.querySelector('.lb');
    if (lb) { lb.remove(); }
    lbEl = null;
    if (lastFocus && document.contains(lastFocus)) { lastFocus.focus(); }
    lastFocus = null;
  }
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest) { return; }
    if (ev.target.closest('.lb')) { closeLb(); return; }
    var img = ev.target.closest('.shot img');
    if (!img) { return; }
    var overlay = document.createElement('div');
    overlay.className = 'lb';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.tabIndex = -1;
    var big = document.createElement('img');
    big.src = img.src; big.alt = img.alt;
    overlay.appendChild(big);
    document.body.appendChild(overlay);
    lbEl = overlay;
    lastFocus = img;
    if (!img.hasAttribute('tabindex')) { img.setAttribute('tabindex', '-1'); }
    overlay.focus();
  });
  document.addEventListener('keydown', function (ev) {
    var lb = document.querySelector('.lb');
    if (!lb) { return; }
    if (ev.key === 'Escape') { closeLb(); }
    else if (ev.key === 'Tab') { ev.preventDefault(); lb.focus(); }
  });

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
    links.forEach(function (a, i) { a.classList.toggle('on', i === current); });
    railBtns.forEach(function (b, i) { b.classList.toggle('on', i === current); });
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
