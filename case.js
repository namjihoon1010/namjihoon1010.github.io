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
// Scroll-driven exploded view: <div class="xpl" data-src="a/x/p_{i}.webp" data-n="20"><div class="xin"><canvas></canvas></div></div>
// The wrapper is taller than the screen; while it scrolls past, the sticky canvas steps through the frames.
document.querySelectorAll('.xpl').forEach(el => {
  const n = +el.dataset.n, cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const url = i => el.dataset.src.replace('{i}', String(i).padStart(2, '0'));
  const fr = [], still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = -1;
  const draw = i => { const f = fr[i] || fr.find(Boolean); if (!f || i === cur && fr[i]) return; cur = fr[i] ? i : -1;
    cv.width = f.naturalWidth; cv.height = f.naturalHeight; ctx.drawImage(f, 0, 0); };
  const frame = () => { if (still) return n - 1; const r = el.getBoundingClientRect(), span = r.height - innerHeight;
    return Math.round(Math.min(1, Math.max(0, -r.top / Math.max(1, span))) * (n - 1)); };
  const upd = () => draw(frame());
  new IntersectionObserver((es, io) => { if (!es[0].isIntersecting) return; io.disconnect();
    for (let i = 0; i < n; i++) { const im = new Image(); im.src = url(i); im.decode().then(() => { fr[i] = im; upd(); }).catch(() => {}); }
  }, { rootMargin: '600px' }).observe(el);
  if (still) el.classList.add('still');
  addEventListener('scroll', upd, { passive: true });
});
