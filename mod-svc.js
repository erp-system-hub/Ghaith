/* =====================================================================
   دليل الخدمات (تكويد الخدمات) — تابان:
   • المشتريات ← «دليل الخدمات» (p_svc): خدمات الشراء SVP-xxxx مربوطة بحساب مصروف
   • المبيعات  ← «دليل الخدمات» (s_svc): خدمات البيع SVS-xxxx مربوطة بحساب إيراد
   الحساب يُحدَّد هنا مرة واحدة (بيانات أساسية)، ولا يظهر في الفواتير ولا الإيصالات ولا المطبوعات.
   ===================================================================== */
(()=>{
const KINDS={
  p:{tab:'p_svc',title:'دليل الخدمات (المشتريات)',list:'listSvcP',save:'saveSvcP',del:'delSvcP',pre:'SVP',accLbl:'حساب المصروف',
     canW:()=>is('admin','procurement','finance')||['admin','manager','accountant'].includes((D.acc||{}).role),
     isMgr:()=>is('admin','finance')||['admin','manager'].includes((D.acc||{}).role),
     note:'كل خدمة شراء لها كود ثابت (SVP) وحساب مصروف مربوط بها. عند اختيار الخدمة في فاتورة المشتريات يُقيَّد المبلغ على هذا الحساب تلقائيًا دون أن يظهر في الفاتورة. الخدمة المستخدمة في فواتير تُوقَف ولا تُحذف.'},
  s:{tab:'s_svc',title:'دليل الخدمات (المبيعات)',list:'listSvcS',save:'saveSvcS',del:'delSvcS',seed:'seedSvcS',pre:'SVS',accLbl:'حساب الإيراد',
     canW:()=>['admin','officer','manager'].includes((D.sal||{}).role),
     isMgr:()=>['admin','manager'].includes((D.sal||{}).role),
     seedTxt:'استيراد الخدمات من الأصناف',seedMsg:'استُوردت {n} خدمة من دليل الأصناف',
     note:'كل خدمة بيع لها كود ثابت (SVS) وحساب إيراد مربوط بها، وسعر افتراضي اختياري يظهر عند اختيارها في فاتورة المبيعات. الحساب لا يظهر في الفاتورة ولا في المطبوع.'}
};
const ST={p:{T:null,l:0,ts:0,err:'',q:''},s:{T:null,l:0,ts:0,err:'',q:''}};
const rr=()=>{if(['p_svc','s_svc'].includes(view))render()};
const load=(k,force)=>{const S=ST[k];if(force)S.T=null;if(!S.l&&(!S.T||Date.now()-S.ts>15000)){S.l=1;S.err='';api(KINDS[k].list).then(j=>{S.T=j;S.ts=Date.now();S.l=0;rr()}).catch(e=>{S.l=0;S.err=e.message;rr()})}return S.T};
const mut=async(k,a,d,msg)=>{const j=await run(a,d,msg);ST[k].T=null;window.dispatchEvent(new Event('svc-changed'));rr();return j};
const badge=(t,ok)=>`<span class="st" style="background:${ok?'#1e7a46':'#777'};color:#fff">${esc(t)}</span>`;

const mod=(M,tab,title)=>{const o=M.nav;M.nav=()=>{const r=o().filter(n=>n[0]!==tab);const i=r.findIndex(n=>n[0]==={p_svc:'p_inv',s_svc:'s_rep'}[tab]);
  if(i<0)r.push([tab,title]);else if(tab==='p_svc')r.splice(i+1,0,[tab,title]);else r.splice(i,0,[tab,title]);return r}};
if(MODS.proc)mod(MODS.proc,'p_svc','دليل الخدمات');
if(MODS.sal)mod(MODS.sal,'s_svc','دليل الخدمات');

const view_=k=>{
  const K=KINDS[k],S=ST[k],T=load(k);
  if(S.err)return head(K.title)+`<div class="box" style="color:#c0392b">${esc(S.err)} <button class="b s" data-a="svre" data-i="${k}">إعادة المحاولة</button></div>`;
  if(!T)return head(K.title)+'<div class="box mu">جارٍ التحميل…</div>';
  const L=T.list;
  const bad=T.list.filter(x=>x.active&&!x.accOk).length;
  return head(K.title,K.canW()?'nsv':'','+ خدمة',K.seed&&K.isMgr()?`<button class="b o" data-a="svseed" data-i="${k}">${K.seedTxt}</button>`:'').replace(/data-a="nsv" data-i=""/,`data-a="nsv" data-i="${k}:"`)
   +`<div class="cards"><div class="card"><div class="mu">عدد الخدمات</div><b>${T.list.length}</b></div><div class="card"><div class="mu">فعّالة</div><b>${T.list.filter(x=>x.active).length}</b></div>${bad?`<div class="card"><div class="mu" style="color:#b3261e">خدمات حسابها غير صالح</div><b style="color:#b3261e">${bad}</b></div>`:''}</div>`
   +`<div class="box">${tbl(['الكود','الخدمة','الوحدة','السعر الافتراضي',K.accLbl,'عدد الفواتير','الحالة',''],L.map(x=>[esc(x.code),esc(x.name),esc(x.unit),x.price?f(x.price):'—',esc(x.accName)+(x.accOk?'':' <span style="color:#b3261e">(غير صالح)</span>'),x.used,badge(x.active?'فعّال':'موقوف',x.active),K.canW()?btn('nsv',k+':'+x.id,'تعديل','o')+(x.used?'':btn('dsv',k+':'+x.id,'حذف','r')):'']))}</div>`
   +`<p class="mu">${K.note}</p>`};
V.p_svc=()=>view_('p');
V.s_svc=()=>view_('s');
A.svre=k=>{ST[k].err='';ST[k].T=null;rr()};
A.nsv=async a=>{const [k,i]=String(a).split(':'),K=KINDS[k];if(!K||!K.canW())return;try{ST[k].T=await api(K.list);ST[k].ts=Date.now()}catch(e){toast(e.message,1);return}const T=ST[k].T;
  const x=i?T.list.find(z=>z.id==i):{active:true,unit:'خدمة'};if(!x)return;
  mdl(i?'تعديل خدمة '+x.code:'خدمة جديدة (الكود تلقائي '+K.pre+'-xxxx)',
   fld('اسم الخدمة','name',x.name||'','text','full')+fld('وحدة القياس','unit',x.unit||'خدمة')+fld('السعر الافتراضي (اختياري)','price',x.price||'','number')
   +sel(K.accLbl+' (من دليل الحسابات)','acc',[['','— اختر —']].concat(T.accs.map(a=>[a.id,a.name])),x.acc||'','full')
   +(i?sel('الحالة','active',[['true','فعّال'],['false','موقوف']],String(x.active!==false)):'')+fld('ملاحظات','note',x.note||'','text','full'),
   ()=>{const o=rd();if(!o.name.trim()){toast('أدخل اسم الخدمة',1);return false}if(!o.acc){toast('اختر '+K.accLbl,1);return false}if(i){o.id=i;o.ver=x.ver}return mut(k,K.save,o,'تم حفظ الخدمة').then(r=>r!==false)})};
A.dsv=a=>{const [k,i]=String(a).split(':');if(confirm('حذف الخدمة؟'))mut(k,KINDS[k].del,{id:i},'تم الحذف')};
A.svseed=async k=>{const K=KINDS[k],j=await mut(k,K.seed,{},'');if(j&&j!==false)toast(K.seedMsg.replace('{n}',j.n))};
})();
