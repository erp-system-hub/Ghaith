/* =====================================================================
   وضع الصيانة — شاشة «جارٍ تحديث النظام» + شريط تنبيه مسبق + تحكم المدير
   مصدران للحالة:
   1) الخادم (Maint.gs): يُفعَّل من «الإدارة ← وضع الصيانة»، ويُحجب به غير المدير فعليًا.
   2) ملف maintenance.json بجوار index.html (اختياري): يعمل حتى لو Apps Script نفسه قيد النشر.
   أثناء الصيانة تفحص الصفحة تلقائيًا، وعند الانتهاء تُعيد التحميل لتلتقط الملفات الجديدة.
   ===================================================================== */
(()=>{
const S={m:null,skew:0,shown:false,bypass:false,doneT:0,probeT:0,clockT:0,sta:null,fails:0,prevOn:false};
const $q=s=>document.querySelector(s);
const isAdm=()=>{try{return !!(D&&D.user&&D.user.role==='admin')}catch(e){return false}};
const now=()=>Date.now()+S.skew;
const mmss=ms=>{ms=Math.max(0,Math.round(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60),s=ms%60,p=n=>String(n).padStart(2,'0');return (h?h+':':'')+p(m)+':'+p(s)};
const clock=t=>new Date(t).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'});

/* ---------- الأنماط ---------- */
const css=`
#mnt{--bg1:#0b1226;--bg2:#131c3a;--tx:#e8ecf8;--mu:#9aa6c7;--card:rgba(255,255,255,.06);--bd:rgba(255,255,255,.12);--a1:#38bdf8;--a2:#6366f1;--ok:#22c55e;
 position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;overflow:auto;color:var(--tx);font-family:inherit;direction:rtl;
 background:radial-gradient(1200px 600px at 80% -10%,#1e2a5a 0%,transparent 60%),radial-gradient(900px 500px at 0% 110%,#0f3a52 0%,transparent 55%),linear-gradient(160deg,var(--bg1),var(--bg2));
 display:flex;align-items:center;justify-content:center;z-index:2147483000}
#mnt[hidden]{display:none}
@media (prefers-color-scheme:light){#mnt{--bg1:#f4f7ff;--bg2:#e7eefc;--tx:#14213d;--mu:#55627f;--card:rgba(255,255,255,.75);--bd:rgba(20,33,61,.10);
 background:radial-gradient(1100px 560px at 85% -10%,#dbe6ff 0%,transparent 60%),radial-gradient(800px 460px at 0% 110%,#d3f1ff 0%,transparent 55%),linear-gradient(160deg,var(--bg1),var(--bg2))}}
#mnt .blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.35;pointer-events:none;animation:mfloat 14s ease-in-out infinite}
#mnt .b1{width:340px;height:340px;background:var(--a2);top:-90px;left:-60px}
#mnt .b2{width:300px;height:300px;background:var(--a1);bottom:-80px;right:-40px;animation-delay:-6s}
@keyframes mfloat{50%{transform:translate(24px,-18px) scale(1.08)}}
#mnt,#mnt *{box-sizing:border-box}
#mnt .card{position:relative;width:min(560px,calc(100% - 28px));margin:24px auto;padding:34px 30px 26px;text-align:center;background:var(--card);border:1px solid var(--bd);border-radius:28px;
 backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 30px 80px rgba(2,8,30,.35)}
#mnt .ico{width:176px;height:176px;margin:-6px auto 6px;display:block;overflow:visible}
#mnt .spin{animation:mspin 14s linear infinite;transform-box:fill-box;transform-origin:center}
#mnt .spin2{animation:mspin 26s linear infinite reverse;transform-box:fill-box;transform-origin:center}
#mnt .orb{animation:mspin 9s linear infinite;transform-box:fill-box;transform-origin:center}
#mnt .pulse{animation:mpulse 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
#mnt .glow{animation:mglow 3s ease-in-out infinite}
@keyframes mspin{to{transform:rotate(360deg)}}
@keyframes mpulse{50%{transform:scale(1.14)}}
@keyframes mglow{50%{opacity:.55}}
#mnt h1{margin:6px 0 8px;font-size:clamp(22px,4.6vw,28px);font-weight:800;letter-spacing:.2px;background:linear-gradient(90deg,var(--a1),var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent}
#mnt p.m{margin:0 auto 16px;max-width:430px;color:var(--mu);line-height:1.9;font-size:15px}
#mnt .chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 18px}
#mnt .chip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;background:var(--card);border:1px solid var(--bd);font-size:13px;color:var(--tx)}
#mnt .chip svg{width:15px;height:15px}
#mnt .eta{margin:0 0 16px;font-size:14px;color:var(--mu)}
#mnt .eta b{display:inline-block;min-width:64px;font-size:22px;color:var(--tx);font-variant-numeric:tabular-nums;direction:ltr}
#mnt .bar{height:7px;border-radius:99px;background:var(--bd);overflow:hidden;margin:0 6px 14px}
#mnt .bar i{display:block;height:100%;width:38%;border-radius:99px;background:linear-gradient(90deg,var(--a1),var(--a2));animation:mind 1.7s ease-in-out infinite}
#mnt .bar.det i{animation:none;width:var(--w,5%);transition:width 1s linear}
@keyframes mind{0%{margin-inline-start:-40%}100%{margin-inline-start:102%}}
#mnt .st{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:var(--mu);margin-bottom:14px}
#mnt .dot{width:8px;height:8px;border-radius:50%;background:var(--a1);animation:mpulse 1.6s ease-in-out infinite}
#mnt .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
#mnt button{font:inherit;cursor:pointer;border-radius:12px;padding:10px 18px;border:1px solid var(--bd);background:var(--card);color:var(--tx);transition:transform .15s,box-shadow .15s}
#mnt button.pri{border:0;color:#fff;background:linear-gradient(90deg,var(--a1),var(--a2));box-shadow:0 8px 22px rgba(99,102,241,.35)}
#mnt button:hover{transform:translateY(-1px)}
#mnt .lnk{margin-top:16px;font-size:12px}
#mnt .lnk a{color:var(--mu);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
#mnt .okv{display:none}
#mnt.done .wrk{display:none}#mnt.done .okv{display:block}
#mnt.done .dot{background:var(--ok)}
@media (prefers-reduced-motion:reduce){#mnt *{animation:none!important}}
#mntb{position:fixed;top:0;left:0;right:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:9px 14px;direction:rtl;font-size:14px;
 color:#fff;background:linear-gradient(90deg,#f59e0b,#ef4444);box-shadow:0 4px 18px rgba(0,0,0,.25)}
#mntb.adm{background:linear-gradient(90deg,#4f46e5,#0ea5e9)}
#mntb[hidden]{display:none}
#mntb svg{width:18px;height:18px;flex:none}
#mntb b{font-variant-numeric:tabular-nums;direction:ltr;display:inline-block}
#mntb button{font:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.16);color:#fff;border-radius:9px;padding:3px 12px}
body.mntb{padding-top:var(--mntbh,44px)}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- الأيقونة (تروس + حلقة مدارية + شارة تحديث) ---------- */
const gear=(cx,cy,r1,r2,n,hole)=>{let d='';const s=Math.PI*2/n;for(let i=0;i<n;i++){const a=i*s;[[r1,a-s*.3],[r2,a-s*.17],[r2,a+s*.17],[r1,a+s*.3]].forEach((q,j)=>{d+=(i+j?'L':'M')+(cx+q[0]*Math.cos(q[1])).toFixed(1)+' '+(cy+q[0]*Math.sin(q[1])).toFixed(1)})}
  return d+'Z M'+(cx-hole)+' '+cy+'a'+hole+' '+hole+' 0 1 0 '+2*hole+' 0a'+hole+' '+hole+' 0 1 0 '+(-2*hole)+' 0Z'};
const ICON=`<svg class="ico" viewBox="0 0 200 200" aria-hidden="true"><defs>
 <linearGradient id="mg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#6366f1"/></linearGradient>
 <linearGradient id="mg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#14b8a6"/></linearGradient>
 <filter id="mgl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter></defs>
 <circle class="glow" cx="100" cy="100" r="58" fill="url(#mg1)" opacity=".55" filter="url(#mgl)"/>
 <g class="spin2"><circle cx="100" cy="100" r="90" fill="none" stroke="url(#mg1)" stroke-width="2.2" stroke-dasharray="3 9" stroke-linecap="round" opacity=".8"/></g>
 <g class="orb"><circle cx="100" cy="10" r="5.5" fill="#38bdf8"/><circle cx="190" cy="100" r="3.5" fill="#6366f1"/><circle cx="46" cy="178" r="4" fill="#22c55e"/></g>
 <rect x="52" y="52" width="96" height="96" rx="30" fill="url(#mg1)"/>
 <rect x="52" y="52" width="96" height="96" rx="30" fill="none" stroke="rgba(255,255,255,.35)"/>
 <g class="spin"><path d="${gear(100,100,26,34,9,11)}" fill="#fff" fill-rule="evenodd"/></g>
 <g class="pulse"><circle cx="150" cy="150" r="19" fill="url(#mg2)" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
 <path d="M150 159v-17m0 0l-7 7m7-7l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
const SHIELD='<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>';
const HAND='<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const CHECK='<svg viewBox="0 0 120 120" style="width:120px;height:120px;margin:4px auto 6px;display:block"><circle cx="60" cy="60" r="46" fill="none" stroke="#22c55e" stroke-width="6" opacity=".25"/><circle cx="60" cy="60" r="46" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-dasharray="290" stroke-dashoffset="290" style="animation:mdraw .8s ease forwards"/><path d="M38 61l16 16 29-33" fill="none" stroke="#22c55e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="80" stroke-dashoffset="80" style="animation:mdraw .6s .5s ease forwards"/></svg><style>@keyframes mdraw{to{stroke-dashoffset:0}}</style>';

/* ---------- الشاشة والشريط ---------- */
const mk=()=>{let o=$q('#mnt');if(o)return o;
  o=document.createElement('div');o.id='mnt';o.hidden=true;o.setAttribute('role','alertdialog');o.setAttribute('aria-live','polite');o.setAttribute('aria-labelledby','mnt_t');
  if('popover' in o)o.setAttribute('popover','manual');
  o.innerHTML=`<i class="blob b1"></i><i class="blob b2"></i><div class="card">
   <div class="wrk">${ICON}<h1 id="mnt_t"></h1><p class="m" id="mnt_m"></p>
    <div class="chips"><span class="chip">${SHIELD}بياناتك محفوظة بأمان</span><span class="chip">${HAND}لا حاجة لأي إجراء منك</span></div>
    <div class="eta" id="mnt_e"></div><div class="bar" id="mnt_b"><i></i></div>
    <div class="st"><span class="dot"></span><span id="mnt_s">نتحقق تلقائيًا من اكتمال التحديث…</span></div>
    <div class="btns"><button class="pri" id="mnt_r" type="button">تحقق الآن</button></div>
    <div class="lnk" id="mnt_l"><a id="mnt_a">دخول مدير النظام</a></div></div>
   <div class="okv">${CHECK}<h1>اكتمل التحديث</h1><p class="m">النظام جاهز من جديد — جارٍ إعادة التحميل بأحدث إصدار…</p></div></div>`;
  document.body.appendChild(o);
  o.querySelector('#mnt_r').onclick=()=>probe(true);
  o.querySelector('#mnt_a').onclick=()=>{S.bypass=true;hideOv()};
  return o};
const bar=()=>{let b=$q('#mntb');if(b)return b;b=document.createElement('div');b.id='mntb';b.hidden=true;b.setAttribute('role','status');document.body.appendChild(b);return b};
const WARN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
const setBar=(html,adm)=>{const b=bar();b.className=adm?'adm':'';b.innerHTML=html;b.hidden=false;document.body.classList.add('mntb');document.documentElement.style.setProperty('--mntbh',b.offsetHeight+'px')};
const hideBar=()=>{const b=$q('#mntb');if(b)b.hidden=true;document.body.classList.remove('mntb')};

const lockBg=on=>{[...document.body.children].forEach(e=>{if(e.id==='mnt'||e.id==='mntb'||e.tagName==='SCRIPT'||e.tagName==='STYLE')return;if(on)e.setAttribute('inert','');else e.removeAttribute('inert')})};
const showOv=()=>{const o=mk();
  try{if(typeof dlg!=='undefined'&&dlg.open)dlg.close()}catch(e){}
  document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close()}catch(e){}});
  o.hidden=false;o.classList.remove('done');
  try{if(o.showPopover&&!o.matches(':popover-open'))o.showPopover()}catch(e){}
  lockBg(true);S.shown=true;paint()};
const hideOv=()=>{const o=$q('#mnt');if(!o)return;try{if(o.hidePopover&&o.matches(':popover-open'))o.hidePopover()}catch(e){}o.hidden=true;lockBg(false);S.shown=false};

/* ---------- الرسم الدوري (عدّاد/تقدّم) ---------- */
function paint(){
  const m=S.m;if(!m||!m.on)return;
  const t=now();
  if(S.shown){
    $q('#mnt_t').textContent=m.title||'نقوم بتحديث النظام';
    $q('#mnt_m').textContent=m.msg||'نعمل الآن على تحديث النظام لتحسين الأداء وإضافة مزايا جديدة. سنعود خلال دقائق قليلة.';
    const e=$q('#mnt_e'),b=$q('#mnt_b');
    if(m.etaAt){const left=m.etaAt-t;
      e.innerHTML=left>0?`الوقت المتبقي التقريبي<br><b>${mmss(left)}</b><div style="font-size:12px;margin-top:2px">متوقع الانتهاء الساعة ${clock(m.etaAt-S.skew)}</div>`:'نقترب من الانتهاء… شكرًا لصبرك';
      const st0=m.startAt||(m.etaAt-6e5),tot=m.etaAt-st0;b.className='bar det';b.style.setProperty('--w',Math.min(96,Math.max(4,(t-st0)/Math.max(tot,1)*100))+'%')}
    else{e.textContent='سنعود في أقرب وقت ممكن';b.className='bar';b.style.removeProperty('--w')}
    $q('#mnt_l').style.display=isAdm()||!API_URL?'none':'';
  }
}
function tickClock(){
  clearInterval(S.clockT);
  S.clockT=setInterval(()=>{const m=S.m;if(!m||!m.on){clearInterval(S.clockT);return}
    if(!m.active&&now()>=m.startAt){m.active=true;apply()}
    else if(!m.active){const left=m.startAt-now();const adm=isAdm();
      setBar(`${WARN}<span>${adm?'الصيانة مجدولة':'سيتم إيقاف النظام مؤقتًا لإجراء تحديثات'} — خلال <b>${mmss(left)}</b>${adm?'':' — يرجى حفظ عملك الآن'}</span>${adm?'<button type="button" id="mntx">إلغاء الصيانة</button>':''}`,adm);bindX()}
    else paint()},1000)}
const bindX=()=>{const x=$q('#mntx');if(x)x.onclick=()=>window.maintSet(false)};

/* ---------- تطبيق الحالة ---------- */
function apply(){
  const m=S.m;
  if(!m||!m.on){ // انتهت الصيانة
    hideBar();clearInterval(S.clockT);
    if(S.shown||S.prevOn&&S.wasOv){const o=mk();o.classList.add('done');clearTimeout(S.doneT);S.doneT=setTimeout(()=>location.reload(),2200)}
    S.prevOn=false;return}
  S.prevOn=true;tickClock();
  if(m.active){
    if(isAdm()){hideOv();setBar(`${WARN}<span>وضع الصيانة مفعّل — المستخدمون محجوبون وأنت تعمل كمدير</span><button type="button" id="mntx">إنهاء الصيانة</button>`,true);bindX()}
    else if(!S.bypass){hideBar();showOv();S.wasOv=true;startProbe()}
  }else{ // تنبيه مسبق فقط
    if(S.shown)hideOv();
    const adm=isAdm();setBar(`${WARN}<span>${adm?'الصيانة مجدولة':'سيتم إيقاف النظام مؤقتًا لإجراء تحديثات'} — خلال <b>${mmss(m.startAt-now())}</b>${adm?'':' — يرجى حفظ عملك الآن'}</span>${adm?'<button type="button" id="mntx">إلغاء الصيانة</button>':''}`,adm);bindX()}
}
// يُستدعى من api() وفحص ping وpub
window.maintSync=(m,fromErr)=>{if(!m)return;
  if(m.now)S.skew=m.now-Date.now();
  if(fromErr&&!isAdm())S.bypass=false; // رفض جديد من الخادم لغير المدير يُلغي تجاوز شاشة الدخول
  S.m=m.on?m:null;
  mergeStatic();apply()};
window.maintShow=window.maintSync;

/* ---------- ملف maintenance.json (طبقة GitHub) ---------- */
async function staticFlag(){try{const r=await fetch('maintenance.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return null;const j=await r.json();
  if(!j||!j.on)return null;const eta=j.eta?Date.parse(j.eta):0;return {on:true,active:true,title:j.title||'',msg:j.msg||'',startAt:0,etaAt:isFinite(eta)?eta:0,now:Date.now(),stat:true}}catch(e){return null}}
function mergeStatic(){if(S.sta&&(!S.m||!S.m.on)){S.m=S.sta}else if(S.sta&&S.m&&S.m.on&&!S.m.etaAt&&S.sta.etaAt){S.m.etaAt=S.sta.etaAt}}

/* ---------- الفحص أثناء الصيانة ---------- */
function startProbe(){clearTimeout(S.probeT);S.probeT=setTimeout(()=>probe(false),18000+Math.random()*6000)}
async function probe(manual){
  if(!S.shown&&!manual)return;
  const s=$q('#mnt_s');let srv=null,ok=false;
  if(manual&&s)s.textContent='جارٍ التحقق…';
  try{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'pub'})});const j=await r.json();if(j&&j.ok){srv=j.maint||{on:false};ok=true}}catch(e){}
  S.sta=await staticFlag();
  if(!ok){S.fails++;if(s)s.textContent='نعيد الاتصال بالخادم أثناء اكتمال التحديث…'}
  else{S.fails=0;if(s)s.textContent='نتحقق تلقائيًا من اكتمال التحديث…';
    if(srv.now)S.skew=srv.now-Date.now();
    const eff=(srv.on&&srv.active)?srv:(S.sta||{on:false});
    S.m=eff.on?eff:null;apply()}
  if(S.shown)startProbe();
}

/* ---------- تحكم المدير (الإدارة ← وضع الصيانة) ---------- */
window.maintSet=async(on,o={})=>{try{const j=await api('setMaint',Object.assign({on},o));window.maintSync(j);toast(on?(o.delay?'تم جدولة الصيانة وإبلاغ المستخدمين':'تم تفعيل وضع الصيانة'):'تم إنهاء الصيانة');if(view==='a_mnt')render()}catch(e){toast(e.message,1)}};
window.maintPreview=()=>{const m=S.m;S.m=m&&m.on?m:{on:true,active:true,title:(($q('#mnf [name=title]')||{}).value)||'',msg:(($q('#mnf [name=msg]')||{}).value)||'',startAt:Date.now()-6e4,etaAt:Date.now()+9e5,now:Date.now()};
  const was=S.bypass;S.bypass=false;S.prevOn=false;showOv();const o=$q('#mnt');$q('#mnt_l').style.display='none';
  const c=document.createElement('div');c.className='lnk';c.innerHTML='<a>إغلاق المعاينة</a>';c.firstChild.onclick=()=>{c.remove();hideOv();S.m=null;S.bypass=was;clearTimeout(S.probeT);apply()};o.querySelector('.btns').after(c)};
const adminNav=()=>{if(typeof MODS==='undefined'||!MODS.adm)return;const o=MODS.adm.nav;MODS.adm.nav=()=>{const r=o().filter(n=>n[0]!=='a_mnt');r.push(['a_mnt','وضع الصيانة']);return r}};
adminNav();
if(typeof V!=='undefined')V.a_mnt=()=>{
  if(!S.adm&&!S.admL){S.admL=1;api('getMaint').then(j=>{S.adm=j;S.admL=0;window.maintSync(j);if(view==='a_mnt')render()}).catch(e=>{S.admL=0;toast(e.message,1)})}
  const m=S.m&&!S.m.stat?S.m:null,on=!!(m&&m.on);
  const state=on?(m.active?`<span class="st" style="background:#ef4444;color:#fff">مفعّل الآن</span> المستخدمون محجوبون`:`<span class="st" style="background:#f59e0b;color:#fff">مجدول</span> يبدأ خلال ${mmss(m.startAt-now())}`):`<span class="st" style="background:#1e7a46;color:#fff">متوقف</span> النظام يعمل للجميع`;
  const eta=m&&m.etaAt?` · متوقع الانتهاء ${clock(m.etaAt-S.skew)}`:'';
  return head('وضع الصيانة')
   +`<div class="box"><h3>الحالة الحالية</h3><p>${state}${eta}</p></div>`
   +`<div class="box"><h3>تفعيل الصيانة</h3><p class="mu">أثناء الصيانة يرى المستخدمون شاشة «جارٍ تحديث النظام» ولا يستطيعون تسجيل الدخول أو إرسال أي عملية، بينما تعمل أنت كمدير بشكل طبيعي. عند الإنهاء تُعيد صفحاتهم التحميل تلقائيًا بأحدث إصدار.</p>
    <div class="fg" id="mnf">${fld('عنوان الشاشة (اختياري)','title','','text','full')}${fld('رسالة للمستخدمين (اختياري)','msg','','text','full')}
    ${sel('بدء الصيانة','delay',[['0','فورًا'],['2','بعد 2 دقيقة (تنبيه مسبق)'],['5','بعد 5 دقائق (تنبيه مسبق)'],['10','بعد 10 دقائق (تنبيه مسبق)'],['15','بعد 15 دقيقة (تنبيه مسبق)']],'5')}
    ${sel('المدة المتوقعة','eta',[['0','غير محددة'],['5','5 دقائق'],['10','10 دقائق'],['15','15 دقيقة'],['30','30 دقيقة'],['60','ساعة']],'15')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="b" onclick="maintSet(true,rd('#mnf'))">تفعيل الصيانة</button>
    <button class="b o" onclick="maintSet(false)"${on?'':' disabled'}>إنهاء الصيانة</button><button class="b o" onclick="maintPreview()">معاينة الشاشة</button></div></div>`
   +`<div class="box"><h3>ترتيب النشر الموصى به</h3><ol class="mu" style="line-height:2"><li>فعّل الصيانة بتنبيه مسبق 5 دقائق ليحفظ المستخدمون عملهم.</li><li>ارفع ملفات Apps Script ثم انشر نسخة جديدة (Deploy).</li><li>ارفع ملفات GitHub وانتظر اكتمال النشر.</li><li>افتح النظام كمدير وتأكد من التحديث.</li><li>اضغط «إنهاء الصيانة» — تتحدّث شاشات المستخدمين تلقائيًا.</li></ol></div>`
   +`<div class="box"><h3>طبقة GitHub (اختيارية)</h3><p class="mu">لو أردت إظهار شاشة الصيانة حتى إذا كان Apps Script نفسه قيد النشر: عدّل الملف <code>maintenance.json</code> في المستودع إلى المحتوى التالي ثم أعده إلى <code>{"on":false}</code> بعد الانتهاء. هذه الطبقة للعرض فقط؛ الحجب الفعلي للعمليات يتم من الخادم.</p>
    <pre dir="ltr" style="background:#0001;padding:10px;border-radius:8px;overflow:auto">{"on":true,"title":"نقوم بتحديث النظام","msg":"سنعود خلال دقائق","eta":"${new Date(Date.now()+15*60000).toISOString().slice(0,16)}:00Z"}</pre></div>`};

/* ---------- الإقلاع ---------- */
(async()=>{S.sta=await staticFlag();if(S.sta&&!S.m){S.m=S.sta;apply()}})();
})();
