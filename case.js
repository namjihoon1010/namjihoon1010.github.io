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
// months since a date, kept current: <data data-since="2026-02">9</data> (the text is the fallback)
document.querySelectorAll('[data-since]').forEach(e => {
  const [y, m, d = 1] = e.dataset.since.split('-').map(Number), n = new Date();
  const k = (n.getFullYear() - y) * 12 + n.getMonth() + 1 - m - (n.getDate() < d ? 1 : 0);
  if (k > 0) e.textContent = k;
});
// "← 돌아가기": go back if we came from this site, otherwise follow the link (home)
document.querySelectorAll('[data-back]').forEach(a => a.addEventListener('click', e => {
  if (document.referrer.includes(location.host) && history.length > 1) { e.preventDefault(); history.back(); }
}));
// Exploded view, native scrolling only (no scroll locking, so nothing shakes).
// The wrapper is one screen plus a scrub distance; inside it a full-screen sticky box holds the picture
// in the middle. While the box is pinned only the picture changes; the page around it is out of view.
// <div class="xpl" data-src="a/x/p_{i}.webp" data-n="20"><div class="xst"><div class="xin"><canvas></canvas></div></div></div>
document.querySelectorAll('.xpl').forEach(el => {
  const n = +el.dataset.n, cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const url = i => el.dataset.src.replace('{i}', String(i).padStart(2, '0'));
  const fr = [], still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = -1;
  const prog = () => { if (still) return 1; const r = el.getBoundingClientRect(), span = r.height - innerHeight;
    return Math.min(1, Math.max(0, -r.top / Math.max(1, span))); };
  const draw = () => { const i = Math.round(prog() * (n - 1)), f = fr[i] || fr.find(Boolean); if (!f || (i === shown && fr[i])) return;
    shown = fr[i] ? i : -1; cv.width = f.naturalWidth; cv.height = f.naturalHeight; ctx.drawImage(f, 0, 0); };
  new IntersectionObserver((es, io) => { if (!es[0].isIntersecting) return; io.disconnect();
    for (let i = 0; i < n; i++) { const im = new Image(); im.src = url(i); im.decode().then(() => { fr[i] = im; draw(); }).catch(() => {}); }
  }, { rootMargin: '800px' }).observe(el);
  if (still) { el.classList.add('still'); return; }
  addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
});
