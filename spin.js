// 360° viewer: <div class="spin" data-src="a/spin/kart_{i}.webp" data-n="36" data-start="9"></div>
// Drag (mouse) or swipe (touch) sideways to rotate, with a little momentum after release.
// Touch: the first few pixels decide the gesture. Mostly sideways -> we rotate and block page scroll;
// mostly up/down -> we let the page scroll. (Pointer events alone get cancelled by the browser's
// scroll detection on phones, which is why only one frame moved per swipe.)
document.querySelectorAll('.spin').forEach(el => {
  const n = +el.dataset.n, tpl = el.dataset.src;
  const url = i => tpl.replace('{i}', String(i).padStart(2, '0'));
  const img = new Image(); img.alt = el.dataset.alt || ''; img.draggable = false;
  img.width = +el.dataset.w || 1200; img.height = +el.dataset.h || 800;
  el.prepend(img);
  let cur = +el.dataset.start || 0, pos = cur;           // pos = fractional frame position
  const show = p => { pos = p; const i = ((Math.round(p) % n) + n) % n; if (i !== cur || !img.src) { cur = i; img.src = url(i); } };
  img.src = url(cur);

  // preload once near the screen, then one hint turn
  let touched = false;
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    let done = 0;
    for (let i = 0; i < n; i++) { const p = new Image(); p.onload = p.onerror = () => { if (++done === n) hint(); }; p.src = url(i); }
  }, { rootMargin: '300px' }).observe(el);
  function hint() {
    if (touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = pos, t0 = performance.now(), dur = 1600;
    (function f(t) { if (touched) return; const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      show(start + e * n); if (k < 1) requestAnimationFrame(f); })(t0);
  }

  // shared drag logic: x in px -> frames; momentum on release
  const pxPerFrame = () => Math.max(4, el.clientWidth / n);   // one screen width = one full turn
  let x0 = 0, p0 = 0, lastX = 0, lastT = 0, vel = 0, raf = 0;
  const begin = x => { touched = true; el.classList.add('used', 'drag'); cancelAnimationFrame(raf); x0 = lastX = x; p0 = pos; lastT = performance.now(); vel = 0; };
  const move = x => { const t = performance.now(); vel = (x - lastX) / Math.max(1, t - lastT); lastX = x; lastT = t; show(p0 + (x - x0) / pxPerFrame()); };
  const finish = () => { el.classList.remove('drag'); let v = vel * 16 / pxPerFrame();  // frames per 16 ms
    (function coast() { if (Math.abs(v) < 0.02) return; show(pos + v); v *= 0.93; raf = requestAnimationFrame(coast); })(); };

  // touch
  let axis = null, tx = 0, ty = 0;
  el.addEventListener('touchstart', e => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; axis = null; }, { passive: true });
  el.addEventListener('touchmove', e => {
    const t = e.touches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (!axis) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (axis === 'x') begin(t.clientX); }
    if (axis === 'x') { e.preventDefault(); move(t.clientX); }
  }, { passive: false });
  el.addEventListener('touchend', () => { if (axis === 'x') finish(); axis = null; });
  el.addEventListener('touchcancel', () => { if (axis === 'x') finish(); axis = null; });

  // mouse / pen
  let down = false;
  el.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; down = true; el.setPointerCapture(e.pointerId); begin(e.clientX); });
  el.addEventListener('pointermove', e => { if (down) move(e.clientX); });
  const up = () => { if (down) { down = false; finish(); } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  // keyboard
  el.tabIndex = 0;
  el.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(pos - 1); if (e.key === 'ArrowRight') show(pos + 1); });
});
