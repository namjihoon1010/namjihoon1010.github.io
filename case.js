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
