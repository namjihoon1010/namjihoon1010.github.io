// 360° viewer: <div class="spin" data-src="a/spin/kart-72x20/kart_{i}.webp" data-n="72" data-start="18"></div>
// Frame folders are versioned (new name per capture) because GitHub Pages caches files for 10 min.
// Direction: frame index +1 moves the near (lower) side of the model to the right, so drag right = +.
// - Sideways swipe = rotate; up/down swipe = normal page scroll (see input section below).
// - Frames are decoded before use and drawn to a canvas, so the picture always follows the finger.
document.querySelectorAll('.spin').forEach(el => {
  const n = +el.dataset.n, tpl = el.dataset.src;
  const W = +el.dataset.w || 1200, H = +el.dataset.h || 800;
  const url = i => tpl.replace('{i}', String(i).padStart(2, '0'));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', el.dataset.alt || '');
  el.prepend(cv);
  const ctx = cv.getContext('2d');
  const frames = new Array(n);                       // decoded images (or undefined)
  let pos = +el.dataset.start || 0, shown = -1, dragging = false;
  let ready = false, inView = false, introDone = false, touched = false, spinning = false;

  const draw = () => {
    const i = ((Math.round(pos) % n) + n) % n;
    let f = frames[i];
    if (!f && (touched || spinning)) { for (let d = 1; d < n && !f; d++) f = frames[(i + d) % n] || frames[(i - d + n) % n]; }  // nearest ready frame, only once it is moving
    if (f && f !== shown) { ctx.clearRect(0, 0, W, H); ctx.drawImage(f, 0, 0, W, H); shown = f; el.dataset.frame = frames.indexOf(f); }
  };
  const show = p => { pos = p; draw(); };
  const load = i => { const im = new Image(); im.src = url(i);
    return im.decode().then(() => { frames[i] = im; draw(); }).catch(() => {}); };

  // loading: first frame now; all frames once the viewer is near the screen (every other one first).
  const s0 = ((pos % n) + n) % n;
  load(s0);
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    const order = [...Array(n).keys()].sort((a, b) => (a % 2) - (b % 2));
    Promise.all(order.map(load)).then(() => { ready = true; maybeIntro(); });
  }, { rootMargin: '300px' }).observe(el);
  const loadAll = () => {};                               // everything is already requested above


  // intro: one full turn when the viewer is first really on screen (all frames decoded).
  // Speed ramps up in ~0.5 s and takes ~1.4 s to slow down, so it settles instead of stopping dead.
  new IntersectionObserver(es => { inView = es[0].intersectionRatio >= 0.6; maybeIntro(); }, { threshold: [0, 0.6] }).observe(el);
  function maybeIntro() {
    if (!ready || !inView || introDone || touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    introDone = true;
    // speed profile (one full turn): cosine ramp up to VMAX, then a longer cosine ramp down to 0
    const VMAX = 1.02 * n, TD = 1.44, TA = 2 * n / VMAX - TD;   // frames/s, decel s, accel s (~0.52 s)
    const at = t => t < TA ? VMAX * (t / 2 - TA / (2 * Math.PI) * Math.sin(Math.PI * t / TA))
      : t < TA + TD ? VMAX * TA / 2 + VMAX * ((t - TA) / 2 + TD / (2 * Math.PI) * Math.sin(Math.PI * (t - TA) / TD)) : n;
    const start = pos, t0 = performance.now(); spinning = true;
    (function f(t) { if (touched) { spinning = false; return; } const s = (t - t0) / 1000;
      show(start + at(s)); if (s < TA + TD) requestAnimationFrame(f); else { spinning = false; show(start); } })(performance.now());
  }

  // input. Touch: CSS touch-action:pan-y keeps vertical scrolling native. The first 6 px decide the
  // gesture (the browser needs ~15 px before it starts scrolling): sideways -> we take it and block
  // the scroll; up/down -> we do nothing and the page scrolls as usual. Mouse/pen: pointer events.
  const pxPerFrame = () => Math.max(4, el.clientWidth / n);   // one viewer width = one full turn
  let sx = 0, sy = 0, lx = 0, p0 = 0, vel = 0, lt = 0, raf = 0, axis = null, down = false;
  const begin = (x, y) => { cancelAnimationFrame(raf); sx = lx = x; sy = y; lt = performance.now(); vel = 0; p0 = pos;
    touched = true; el.classList.add('used'); loadAll(); };
  const turn = x => { const t = performance.now(); dragging = true; el.classList.add('drag');
    vel = (x - lx) / Math.max(1, t - lt); lx = x; lt = t; show(p0 + (x - sx) / pxPerFrame()); };
  const release = () => { dragging = false; el.classList.remove('drag');
    if (performance.now() - lt > 80) vel = 0;                 // finger stopped before lifting
    let v = vel * 16 / pxPerFrame();                          // frames per frame-time
    (function coast() { if (Math.abs(v) < 0.02) return; show(pos + v); v *= 0.93; raf = requestAnimationFrame(coast); })(); };

  let tx = 0, ty = 0;
  el.addEventListener('touchstart', e => { const t = e.touches[0]; axis = null; tx = t.clientX; ty = t.clientY; }, { passive: true });
  el.addEventListener('touchmove', e => {
    const t = e.touches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (!axis) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (axis === 'x') begin(tx, ty); }
    if (axis === 'x') { if (e.cancelable) e.preventDefault(); turn(t.clientX); }
  }, { passive: false });
  const tend = () => { if (axis === 'x') release(); axis = null; };
  el.addEventListener('touchend', tend); el.addEventListener('touchcancel', tend);

  el.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; down = true;
    try { el.setPointerCapture(e.pointerId); } catch (_) {} begin(e.clientX, e.clientY); });
  el.addEventListener('pointermove', e => { if (down) turn(e.clientX); });
  const pend = () => { if (down) { down = false; release(); } };
  el.addEventListener('pointerup', pend); el.addEventListener('pointercancel', pend);

  el.tabIndex = 0;
  el.addEventListener('keydown', e => { loadAll(); if (e.key === 'ArrowLeft') show(pos - 1); if (e.key === 'ArrowRight') show(pos + 1); });
});
