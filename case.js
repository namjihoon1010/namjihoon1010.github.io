// reveal once
const rv=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');rv.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.rv').forEach(el=>rv.observe(el));
// videos play only while visible
const vo=new IntersectionObserver(es=>es.forEach(({target:v,isIntersecting:on})=>on?v.play().catch(()=>{}):v.pause()));
document.querySelectorAll('video').forEach(v=>{v.muted=true;vo.observe(v)});
// nav: glass after hero (or after a little scroll), light over .light blocks
const nav=document.getElementById('nav'),hero=document.getElementById('hero'),lights=[...document.querySelectorAll('.light')];
const navUpd=()=>{
 nav.classList.toggle('s',hero?hero.getBoundingClientRect().bottom<52:scrollY>20);
 nav.classList.toggle('l',lights.some(l=>{const r=l.getBoundingClientRect();return r.top<52&&r.bottom>52}));
};
addEventListener('scroll',navUpd,{passive:true});navUpd();
// "← 돌아가기": go back if we came from this site, otherwise follow the link (home)
document.querySelectorAll('[data-back]').forEach(a => a.addEventListener('click', e => {
  if (document.referrer.includes(location.host) && history.length > 1) { e.preventDefault(); history.back(); }
}));
// Exploded view: when the picture reaches the middle of the screen the page stops scrolling and the
// scroll input steps through the frames instead; at the last (or first) frame the page moves again.
// <div class="xpl" data-src="a/x/p_{i}.webp" data-n="20"><div class="xin"><canvas></canvas></div></div>
document.querySelectorAll('.xpl').forEach(el => {
  const n = +el.dataset.n, cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const url = i => el.dataset.src.replace('{i}', String(i).padStart(2, '0'));
  const fr = [], still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let p = still ? 1 : 0, shown = -1, locked = false, lastY = scrollY, ty = 0;
  const draw = () => { const i = Math.round(p * (n - 1)), f = fr[i] || fr.find(Boolean); if (!f || (i === shown && fr[i])) return;
    shown = fr[i] ? i : -1; cv.width = f.naturalWidth; cv.height = f.naturalHeight; ctx.drawImage(f, 0, 0); };
  new IntersectionObserver((es, io) => { if (!es[0].isIntersecting) return; io.disconnect();
    for (let i = 0; i < n; i++) { const im = new Image(); im.src = url(i); im.decode().then(() => { fr[i] = im; draw(); }).catch(() => {}); }
  }, { rootMargin: '600px' }).observe(el);
  if (still) return;
  const pin = () => el.getBoundingClientRect().top + scrollY - (innerHeight - el.offsetHeight) / 2;
  const hold = y => { scrollTo(0, y); lastY = y; };
  const step = d => { p = Math.min(1, Math.max(0, p + d)); draw(); if ((p >= 1 && d > 0) || (p <= 0 && d < 0)) locked = false; };
  addEventListener('scroll', () => {
    const y = scrollY, at = pin();
    if (locked) { step((y - at) / 400); if (locked) hold(at); else lastY = y; return; }
    if ((y > lastY && p < 1 && lastY < at && y >= at) || (y < lastY && p > 0 && lastY > at && y <= at)) { locked = true; hold(at); return; }
    lastY = y;
  }, { passive: true });
  addEventListener('wheel', e => { if (!locked) return; e.preventDefault(); step(e.deltaY / 400); }, { passive: false });
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', e => { if (!locked) return; e.preventDefault(); const y = e.touches[0].clientY; step((ty - y) / 300); ty = y; }, { passive: false });
});
