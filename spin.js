// 360° viewer: <div class="spin" data-src="a/spin/kart_{i}.webp" data-n="24"></div>
// Drag/swipe sideways to rotate. Images load lazily when the viewer nears the screen.
document.querySelectorAll('.spin').forEach(el => {
  const n = +el.dataset.n, tpl = el.dataset.src;
  const url = i => tpl.replace('{i}', String(i).padStart(2, '0'));
  const img = new Image(); img.alt = el.dataset.alt || ''; img.draggable = false;
  img.width = +el.dataset.w || 1200; img.height = +el.dataset.h || 800;
  el.prepend(img);
  const frames = []; let cur = +el.dataset.start || 0, loaded = false;
  const show = i => { cur = (i % n + n) % n; img.src = url(cur); };
  show(cur);
  // preload all frames once visible, then spin one turn as a hint
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting || loaded) return; loaded = true; io.disconnect();
    let done = 0;
    for (let i = 0; i < n; i++) { const p = new Image(); p.onload = () => { if (++done === n) hint(); }; p.src = url(i); frames.push(p); }
  }, { rootMargin: '300px' }).observe(el);
  let hinted = false, touched = false;
  function hint() {
    if (hinted || touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return; hinted = true;
    let k = 0; const t = setInterval(() => { if (touched || ++k > n) return clearInterval(t); show(cur + 1); }, 60);
  }
  // drag
  let x0 = null, i0 = 0;
  const step = () => Math.max(6, el.clientWidth / (n * 1.2));
  el.addEventListener('pointerdown', e => { touched = true; el.classList.add('used'); x0 = e.clientX; i0 = cur; el.setPointerCapture(e.pointerId); el.classList.add('drag'); });
  el.addEventListener('pointermove', e => { if (x0 === null) return; show(i0 - Math.round((e.clientX - x0) / step())); });
  const end = () => { x0 = null; el.classList.remove('drag'); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  // keyboard
  el.tabIndex = 0;
  el.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(cur + 1); if (e.key === 'ArrowRight') show(cur - 1); });
});
