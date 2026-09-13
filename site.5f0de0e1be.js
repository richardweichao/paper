(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
    menu.textContent = open ? '收起' : '目录';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {menu.click();menu.focus();}
  });
  const toc = document.querySelector('.toc-details');
  if (toc && matchMedia('(max-width:760px)').matches) toc.open = false;
  document.querySelectorAll('.reader-toc a').forEach(a => a.addEventListener('click', () => {
    if (matchMedia('(max-width:760px)').matches) toc.open = false;
  }));
  const toast = document.querySelector('.toast');
  let toastTimer;
  function notify(message) {toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,4000);}
  document.querySelector('[data-copy-link]')?.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(location.href);notify('链接已复制，可以直接分享这篇文献。');}
    catch{notify('请复制浏览器地址栏中的网址。');}
  });
  document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
  document.querySelector('[data-expand-all]')?.addEventListener('click',()=>document.querySelectorAll('.reader details').forEach(d=>d.open=true));
  const tocLinks=[...document.querySelectorAll('.reader-toc nav a[href^="#"]')];
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){tocLinks.forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));}}},{rootMargin:'-100px 0px -60% 0px'});
    tocLinks.forEach(a=>{const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(target)observer.observe(target);});
  }
  const cards=[...document.querySelectorAll('.paper-summary')];
  const filters=['paper-search','question','track','module'].map(id=>document.getElementById(id));
  if(cards.length && filters.every(Boolean)){
    const params=new URLSearchParams(location.search);
    filters.forEach((f,i)=>{const val=params.get(['q','question','track','module'][i]);if(val!==null)f.value=val;});
    const apply=(updateUrl=true)=>{
      const [s,q,t,m]=filters.map(c=>c.value.trim().toLowerCase());const n={A:0,B:0,C:0,BACKGROUND:0};
      cards.forEach(p=>{const ok=(!s||p.dataset.search.includes(s))&&(!q||p.dataset.question.toLowerCase()===q)&&(!t||p.dataset.track.toLowerCase()===t)&&(!m||p.dataset.module.toLowerCase()===m);p.hidden=!ok;if(ok)n[p.dataset.track]++;});
      const total=Object.values(n).reduce((a,b)=>a+b,0);
      document.getElementById('paper-count').textContent=`显示 ${total} 篇：A ${n.A} / B ${n.B} / C ${n.C} / 背景 ${n.BACKGROUND}`;
      document.getElementById('empty').hidden=total!==0;
      if(updateUrl){const url=new URL(location);['q','question','track','module'].forEach((key,i)=>{if(filters[i].value)url.searchParams.set(key,filters[i].value);else url.searchParams.delete(key);});history.replaceState(null,'',url);}
    };
    filters.forEach(c=>c.addEventListener('input',()=>apply()));
    document.getElementById('reset').addEventListener('click',()=>{filters.forEach(c=>c.value='');apply();});
    apply(false);
  }
  const panel=document.getElementById('library-panel');
  if(panel){
    let library=null,limit=50,loading=false;
    const field=document.getElementById('library-search'),more=document.getElementById('library-more'),count=document.getElementById('library-count');
    const draw=()=>{
      if(!library)return;
      const q=field.value.trim().toLowerCase();const results=library.filter(r=>[r.id,r.title,r.doi,r.status,r.reason].join(' ').toLowerCase().includes(q));
      const body=document.getElementById('library-body');body.replaceChildren();
      results.slice(0,limit).forEach(r=>{const tr=document.createElement('tr');[r.id,r.title+'\nDOI: '+r.doi,r.status+'\n'+r.reason].forEach((v,i)=>{const td=document.createElement('td');td.style.whiteSpace='pre-line';if(i===0&&r.selected){const a=document.createElement('a');a.href='paper-'+r.id+'.html';a.textContent=v;td.append(a);}else td.textContent=v;tr.append(td);});body.append(tr);});
      count.textContent=`匹配 ${results.length} 条，当前显示 ${Math.min(limit,results.length)} 条`;
      more.hidden=results.length<=limit;
      document.getElementById('library-empty').hidden=results.length!==0;
    };
    const load=async()=>{
      if(library||loading)return;loading=true;count.textContent='正在加载检索记录…';more.hidden=true;
      try{const response=await fetch(panel.dataset.source);if(!response.ok)throw Error('http');library=await response.json();document.getElementById('library-error').hidden=true;draw();}
      catch{count.textContent='检索记录暂时没有加载成功。';document.getElementById('library-error').hidden=false;}
      finally{loading=false;}
    };
    panel.addEventListener('toggle',()=>{if(panel.open)load();});
    document.getElementById('library-retry').addEventListener('click',load);
    field.addEventListener('input',()=>{limit=50;draw();});more.addEventListener('click',()=>{limit+=50;draw();});
    if(panel.open)load();
  }
  let printClosed=[];
  window.addEventListener('beforeprint',()=>{printClosed=[...document.querySelectorAll('.reader details:not([open])')];printClosed.forEach(d=>d.open=true);});
  window.addEventListener('afterprint',()=>printClosed.forEach(d=>d.open=false));
  function reveal(){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    const target=id&&document.getElementById(id);if(!target)return;
    let p=target;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}
    requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));
  }
  window.addEventListener('hashchange',reveal);if(location.hash)reveal();
})();
