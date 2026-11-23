// 360° viewer: <div class="spin" data-src="a/spin/kart-72x20/kart_{i}.webp" data-n="72" data-start="18"></div>
// Frame folders are versioned (new name per capture) because GitHub Pages caches files for 10 min.
// Direction: frame index +1 moves the near (lower) side of the model to the right, so drag right = +.
// - All touches on the viewer are handled here (CSS touch-action:none), so the browser never
//   steals a diagonal swipe for scrolling. Sideways = rotate, up/down = we scroll the page ourselves.
// - Every frame is decoded up front and drawn to a canvas, so the picture always follows the finger.
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

  const draw = () => {
    const i = ((Math.round(pos) % n) + n) % n;
    let f = frames[i];
    if (!f && dragging) { for (let d = 1; d < n && !f; d++) f = frames[(i + d) % n] || frames[(i - d + n) % n]; }  // nearest ready frame, only while the user is turning it
    if (f && f !== shown) { ctx.clearRect(0, 0, W, H); ctx.drawImage(f, 0, 0, W, H); shown = f; el.dataset.frame = frames.indexOf(f); }
  };
  const show = p => { pos = p; draw(); };
  const load = i => { const im = new Image(); im.src = url(i);
    return im.decode().then(() => { frames[i] = im; draw(); }).catch(() => {}); };

  load(((pos % n) + n) % n);                          // first frame right away
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    const order = [...Array(n).keys()].sort((a, b) => (a % 2) - (b % 2));   // every other frame first, then the gaps
    Promise.all(order.map(load)).then(() => { ready = true; maybeIntro(); });
  }, { rootMargin: '300px' }).observe(el);


  // intro: one full turn when the viewer is first really on screen (all frames decoded).
  // Speed ramps up in ~0.5 s and takes ~1.4 s to slow down, so it settles instead of stopping dead.
  let ready = false, inView = false, introDone = false, touched = false;
  new IntersectionObserver(es => { inView = es[0].intersectionRatio >= 0.6; maybeIntro(); }, { threshold: [0, 0.6] }).observe(el);
  function maybeIntro() {
    if (!ready || !inView || introDone || touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    introDone = true;
    // speed profile (one full turn): cosine ramp up to VMAX, then a longer cosine ramp down to 0
    const VMAX = 1.02 * n, TD = 1.44, TA = 2 * n / VMAX - TD;   // frames/s, decel s, accel s (~0.52 s)
    const at = t => t < TA ? VMAX * (t / 2 - TA / (2 * Math.PI) * Math.sin(Math.PI * t / TA))
      : t < TA + TD ? VMAX * TA / 2 + VMAX * ((t - TA) / 2 + TD / (2 * Math.PI) * Math.sin(Math.PI * (t - TA) / TD)) : n;
    const start = pos, t0 = performance.now();
    (function f(t) { if (touched) return; const s = (t - t0) / 1000;
      show(start + at(s)); if (s < TA + TD) requestAnimationFrame(f); else show(start); })(performance.now());
  }

  // one handler for mouse, pen and touch
  const pxPerFrame = () => Math.max(4, el.clientWidth / n);   // one viewer width = one full turn
  let id = null, axis = null, sx = 0, sy = 0, lx = 0, ly = 0, p0 = 0, vel = 0, lt = 0, raf = 0;
  el.addEventListener('pointerdown', e => {
    if (id !== null) return;
    id = e.pointerId; try { el.setPointerCapture(id); } catch (_) {} cancelAnimationFrame(raf);
    sx = lx = e.clientX; sy = ly = e.clientY; lt = performance.now(); vel = 0; p0 = pos;
    axis = e.pointerType === 'touch' ? null : 'x';            // mouse always rotates
    touched = true; el.classList.add('used');
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!axis) { if (Math.hypot(dx, dy) < 8) return; axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; }
    const t = performance.now();
    if (axis === 'x') { dragging = true; el.classList.add('drag'); vel = (e.clientX - lx) / Math.max(1, t - lt); show(p0 + dx / pxPerFrame()); }
    else { vel = (e.clientY - ly) / Math.max(1, t - lt); window.scrollBy(0, ly - e.clientY); }
    lx = e.clientX; ly = e.clientY; lt = t;
  });
  const end = e => {
    if (e.pointerId !== id) return; id = null; dragging = false; el.classList.remove('drag');
    if (performance.now() - lt > 80) vel = 0;                 // finger stopped before lifting
    if (axis === 'x') { let v = vel * 16 / pxPerFrame();      // frames per frame-time
      (function coast() { if (Math.abs(v) < 0.02) return; show(pos + v); v *= 0.93; raf = requestAnimationFrame(coast); })(); }
    else if (axis === 'y') { let v = -vel * 16;               // page scroll momentum
      (function coast() { if (Math.abs(v) < 0.5) return; window.scrollBy(0, v); v *= 0.95; raf = requestAnimationFrame(coast); })(); }
    axis = null;
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);

  el.tabIndex = 0;
  el.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(pos - 1); if (e.key === 'ArrowRight') show(pos + 1); });
});
