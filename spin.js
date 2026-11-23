// 360° viewer: <div class="spin" data-src="a/spin/kart_{i}.webp" data-n="36" data-start="9"></div>
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
  let pos = +el.dataset.start || 0, shown = -1;

  const draw = () => {
    const i = ((Math.round(pos) % n) + n) % n;
    let f = frames[i];
    if (!f) { for (let d = 1; d < n && !f; d++) f = frames[(i + d) % n] || frames[(i - d + n) % n]; }  // nearest ready frame
    if (f && f !== shown) { ctx.drawImage(f, 0, 0, W, H); shown = f; }
  };
  const show = p => { pos = p; draw(); };
  const load = i => { const im = new Image(); im.src = url(i);
    return im.decode().then(() => { frames[i] = im; draw(); }).catch(() => {}); };

  load(((pos % n) + n) % n);                          // first frame right away
  let touched = false;
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    Promise.all([...Array(n).keys()].map(load)).then(hint);
  }, { rootMargin: '300px' }).observe(el);
  function hint() {
    if (touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = pos, t0 = performance.now(), dur = 1600;
    (function f(t) { if (touched) return; const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      show(start + e * n); if (k < 1) requestAnimationFrame(f); })(t0);
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
    if (axis === 'x') { el.classList.add('drag'); vel = (e.clientX - lx) / Math.max(1, t - lt); show(p0 + dx / pxPerFrame()); }
    else { vel = (e.clientY - ly) / Math.max(1, t - lt); window.scrollBy(0, ly - e.clientY); }
    lx = e.clientX; ly = e.clientY; lt = t;
  });
  const end = e => {
    if (e.pointerId !== id) return; id = null; el.classList.remove('drag');
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
