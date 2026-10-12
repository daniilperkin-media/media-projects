/* studio.js — broadcast-grade scroll choreography v2 for the media showcase.
   Adds: kinetic hero layers, pinned chapter cards (ghost number + section progress),
   clip-wipe captures with parallax, velocity-reactive ticker, pinned horizontal strips.
   Runs AFTER site.js (which owns theme/lightbox/rail/reveals). Vanilla, transform/
   opacity/clip-path only. Opt-in: bails out under prefers-reduced-motion (html.mp-anim
   is only set when motion is allowed). */
(function () {
  var html = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var animate = !reduce && html.classList.contains('mp-anim');
  if (!animate) { return; }
  var main = document.querySelector('main');
  if (!main) { return; }
  var vh = window.innerHeight;

  /* ---- kinetic hero: wrap headline chunks in scrub layers ---- */
  var hero = document.querySelector('.hero');
  var hls = [];
  if (hero) {
    var h1 = hero.querySelector('h1');
    if (h1) {
      [].slice.call(h1.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.replace(/\s+/g, '') !== '') {
          var s = document.createElement('span'); s.className = 'hl';
          n.parentNode.insertBefore(s, n); s.appendChild(n);
        } else if (n.nodeType === 1) { n.classList.add('hl'); }
      });
      hls = [].slice.call(h1.querySelectorAll('.hl'));
    }
  }

  /* ---- pinned chapter cards ---- */
  var sections = [].slice.call(main.querySelectorAll('.project'));
  var chaps = [];
  sections.forEach(function (sec, i) {
    var head = sec.querySelector('.p-head');
    if (!head) { return; }
    var chap = document.createElement('div');
    chap.className = 'chap'; chap.setAttribute('aria-hidden', 'true');
    var card = document.createElement('div'); card.className = 'card';
    var b = document.createElement('b'); b.textContent = ('0' + (i + 1)).slice(-2);
    var sp = document.createElement('span');
    var h2 = sec.querySelector('h2');
    sp.textContent = h2 ? h2.textContent : (sec.id || '');
    var bar = document.createElement('i');
    card.appendChild(b); card.appendChild(sp); card.appendChild(bar);
    chap.appendChild(card);
    head.parentNode.insertBefore(chap, head.nextSibling);
    chaps.push({ sec: sec, bar: bar });
  });

  /* ---- captures: clip wipe-in + parallax ---- */
  var shots = [];
  [].slice.call(main.querySelectorAll('figure.shot')).forEach(function (fig) {
    fig.classList.add('wipe');
    var img = fig.querySelector('img');
    if (img) { img.classList.add('px'); }
    shots.push(fig);
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 });
  shots.forEach(function (fig) { io.observe(fig); });
  window.__mpStudioRevealAll = function () { shots.forEach(function (f) { f.classList.add('in'); }); };

  /* ---- pinned horizontal strips (opt-in: only when the strip actually overflows) ---- */
  var strips = [];
  function setupStrips() {
    if (!window.matchMedia('(min-width:900px)').matches) { return; }
    [].slice.call(main.querySelectorAll('.strip')).forEach(function (strip) {
      if (strip.children.length < 3 || strip.classList.contains('hscroll')) { return; }
      strip.classList.add('hscroll');
      var track = document.createElement('div'); track.className = 'hs-track';
      while (strip.firstChild) { track.appendChild(strip.firstChild); }
      strip.appendChild(track);
      var c = strip.clientWidth, w = track.scrollWidth;
      if (w <= c + 60) { /* nothing to travel: revert to the normal grid */
        while (track.firstChild) { strip.appendChild(track.firstChild); }
        track.remove(); strip.classList.remove('hscroll');
        return;
      }
      var h = track.getBoundingClientRect().height || 200;
      var top = Math.max(72, (vh - h) / 2);
      strip.style.height = (h + (w - c)) + 'px';
      track.style.top = top + 'px';
      strips.push({ strip: strip, track: track, travel: w - c, h: h, top: top });
    });
  }
  setupStrips();

  /* ---- velocity-reactive ticker ---- */
  var tick = document.querySelector('.ticker-track');
  var baseDur = 48;
  if (tick) {
    var d = parseFloat(getComputedStyle(tick).animationDuration);
    if (d > 0) { baseDur = d; }
  }
  var speed = 0, lastY = window.scrollY || 0;

  /* ---- scroll loop ---- */
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var vel = Math.abs(y - lastY);
    lastY = y;
    speed = speed * 0.82 + vel * 0.18;

    if (hero) {
      var k = hero.querySelector('.kicker');
      var lede = hero.querySelector('.lede');
      var meta = hero.querySelector('.hero-meta');
      var g1 = hero.querySelector('.hero-bg .g1');
      var g2 = hero.querySelector('.hero-bg .g2');
      var gr = hero.querySelector('.hero-bg .grid');
      if (k) { k.style.transform = 'translate3d(0,' + (y * 0.06).toFixed(1) + 'px,0)'; }
      for (var i = 0; i < hls.length; i++) {
        hls[i].style.transform = 'translate3d(0,' + (y * (0.30 - i * 0.06)).toFixed(1) + 'px,0)';
      }
      if (lede) { lede.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)'; }
      if (meta) { meta.style.transform = 'translate3d(0,' + (y * 0.10).toFixed(1) + 'px,0)'; }
      if (g1) { g1.style.transform = 'translate3d(0,' + (y * 0.34).toFixed(1) + 'px,0)'; }
      if (g2) { g2.style.transform = 'translate3d(0,' + (y * 0.24).toFixed(1) + 'px,0)'; }
      if (gr) { gr.style.transform = 'translate3d(0,' + (y * 0.44).toFixed(1) + 'px,0)'; }
    }

    if (tick) {
      var dur = baseDur / (1 + speed * 0.22);
      dur = Math.max(baseDur * 0.22, Math.min(baseDur * 1.6, dur));
      tick.style.animationDuration = dur.toFixed(2) + 's';
    }

    for (var j = 0; j < chaps.length; j++) {
      var c = chaps[j];
      var rr = c.sec.getBoundingClientRect();
      var span = Math.max(1, rr.height - vh * 0.4);
      var pr = Math.min(1, Math.max(0, (vh * 0.4 - rr.top) / span));
      c.bar.style.setProperty('--sp', pr.toFixed(4));
    }

    for (var m = 0; m < shots.length; m++) {
      var img = shots[m].querySelector('img');
      if (!img) { continue; }
      var fr = shots[m].getBoundingClientRect();
      if (fr.bottom < -140 || fr.top > vh + 140) { continue; }
      var dlt = (fr.top + fr.height / 2 - vh / 2) / vh;
      img.style.setProperty('--px', (dlt * -16).toFixed(2) + 'px');
    }

    for (var s = 0; s < strips.length; s++) {
      var st = strips[s];
      var sr = st.strip.getBoundingClientRect();
      var sp2 = Math.min(1, Math.max(0, (st.top - sr.top) / Math.max(1, sr.height - st.h)));
      st.track.style.transform = 'translate3d(' + (-sp2 * st.travel).toFixed(1) + 'px,0,0)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      vh = window.innerHeight;
      strips.forEach(function (st) {
        st.strip.style.height = '';
        st.strip.classList.remove('hscroll');
        var track = st.strip.querySelector('.hs-track');
        if (track) {
          while (track.firstChild) { st.strip.appendChild(track.firstChild); }
          track.remove();
        }
      });
      strips = [];
      setupStrips();
      onScroll();
    }, 180);
  });
  frame();
})();
