/* =====================================================================
   الصرف المخزني لمصروف / مساعدات عينية (مديول المخازن)
   • i_kind: صرف أصناف لنوع صرف (مثل «مساعدات عينية») على مشروع/مبادرة/حدث/مستفيد
   • i_krep: تقرير الصرف حسب المشروع/المبادرة/الحدث/المستفيد/النوع/المخزن/الصنف
   • i_ktyp: أنواع الصرف (كل نوع مربوط بحساب مصروف — الحساب لا يظهر في شاشة الصرف)
   ===================================================================== */
(()=>{
const S={T:null,l:0,ts:0,err:'',TY:null,tl:0,tts:0,terr:'',R:null,rl:0,rerr:'',rq:{by:'proj',from:'',to:'',proj:'',cmp:'',event:'',ben:'',type:''}};
const TABS=['i_kind','i_krep','i_ktyp'];
const rr=()=>{if(TABS.includes(view))render()};
const badge=(t,ok)=>`<span class="st" style="background:${ok?'#1e7a46':'#777'};color:#fff">${esc(t)}</span>`;
// تحديث تلقائي: لو البيانات أقدم من 15 ثانية تُحدَّث في الخلفية (تظل القديمة معروضة) فتظهر الحسابات/المشاريع الجديدة
const load=force=>{if(force)S.T=null;if(!S.l&&(!S.T||Date.now()-S.ts>15000)){S.l=1;S.err='';api('listInk').then(j=>{S.T=j;S.ts=Date.now();S.l=0;rr()}).catch(e=>{S.l=0;S.err=e.message;rr()})}return S.T};
const loadTy=force=>{if(force)S.TY=null;if(!S.tl&&(!S.TY||Date.now()-S.tts>15000)){S.tl=1;S.terr='';api('listIssueTypes').then(j=>{S.TY=j;S.tts=Date.now();S.tl=0;rr()}).catch(e=>{S.tl=0;S.terr=e.message;rr()})}return S.TY};
const reset=()=>{S.T=null;S.TY=null;S.R=null;rr()};

// ---- التابات في قائمة المخازن
if(MODS.inv){const o=MODS.inv.nav;MODS.inv.nav=()=>{const r=o().filter(n=>!TABS.includes(n[0]));
  const a=r.findIndex(n=>n[0]==='i_iss');const add=[['i_kind','الصرف لمساعدات / مصروف'],['i_krep','تقرير الصرف المخصص']];
  if(a<0)r.push(...add);else r.splice(a+1,0,...add);
  const w=r.findIndex(n=>n[0]==='i_wh');const ty=['i_ktyp','أنواع الصرف'];if(w<0)r.push(ty);else r.splice(w+1,0,ty);return r}}

// ---- شاشة الصرف
V.i_kind=()=>{
  const T=load();
  if(S.err)return head('الصرف لمساعدات / مصروف')+`<div class="box" style="color:#c0392b">${esc(S.err)} <button class="b s" data-a="ikre">إعادة المحاولة</button></div>`;
  if(!T)return head('الصرف لمساعدات / مصروف')+'<div class="box mu">جارٍ التحميل…</div>';
  const ok=T.list.filter(x=>x.st==='مرحّل'),tot=ok.reduce((s,x)=>s+x.value,0);
  return head('الصرف لمساعدات / مصروف','nik','+ صرف جديد')
   +`<div class="cards"><div class="card"><div class="mu">عمليات صرف</div><b>${ok.length}</b></div><div class="card"><div class="mu">إجمالي القيمة</div><b>${f(tot)}</b></div></div>`
   +`<div class="box">${tbl(['الرقم','التاريخ','النوع','المخزن','المشروع','المبادرة','الحدث / القافلة','المستفيد','القيمة','الحالة',''],T.list.map(x=>[esc(x.no),esc(x.date),esc(x.typeName),esc(x.wh),esc(x.projName||'—'),esc(x.cmpName||'—'),esc(x.eventName||'—'),esc(x.benName||'—'),f(x.value),badge(x.st,x.st==='مرحّل'),x.st==='مرحّل'?btn('vik',x.id,'عرض','o')+btn('rik',x.id,'عكس','r'):btn('vik',x.id,'عرض','o')]))}</div>`
   +`<p class="mu">يُخصم المخزن بمتوسط التكلفة ويُقيَّد على حساب نوع الصرف المربوط (دون ظهوره هنا). للنوع «مساعدة» تُسجَّل مساعدة عينية للمستفيد فتظهر في تقارير المستفيدين والبرامج والأحداث، وتُحمَّل التكلفة على المشروع والمبادرة والحدث المختارين.</p>`};
A.ikre=()=>{S.err='';S.T=null;rr()};

const opt=(arr,ph)=>[['',ph]].concat(arr.map(a=>[a.id,a.name]));
const itemOpts=(T,cur)=>'<option value="">— اختر الصنف —</option>'+T.items.map(i=>`<option value="${esc(i.id)}"${i.id==cur?' selected':''}>${esc(i.name)}${i.unit?' ('+esc(i.unit)+')':''}</option>`).join('');
const rowH=()=>`<tr><td><select class="ik_i" style="min-width:230px" onchange="ikAvail()">${itemOpts(S.T,'')}</select></td><td><input class="ik_q" type="number" min="0" step="any" style="width:90px"></td><td class="ik_a mu">—</td><td><button type="button" class="b s r" onclick="this.closest('tr').remove()">×</button></td></tr>`;
window.ikRowH=rowH;
window.ikAvail=()=>{const w=($('#m [name=wh]')||{}).value;$$('#ikt tbody tr').forEach(r=>{const i=r.querySelector('.ik_i').value,q=w&&i?(S.T.stock[w+'|'+i]||0):null;r.querySelector('.ik_a').textContent=q==null?'—':'المتاح '+q})};
window.ikType=()=>{const t=S.T.types.find(z=>z.id==(($('#m [name=type]')||{}).value)),b=$('#m [name=ben]');if(b){const row=b.closest('div');if(row)row.style.display=t&&t.aid?'':'none'}};

A.nik=async()=>{try{S.T=await api('listInk');S.ts=Date.now()}catch(e){toast(e.message,1);return}const T=S.T;
  if(!T.types.length){toast('أضف نوع صرف أولًا من تاب «أنواع الصرف»',1);return}
  mdl('صرف مخزني لمساعدات / مصروف',
   sel('نوع الصرف','type',T.types.map(t=>[t.id,t.name+(t.aid?' (مساعدة لمستفيد)':'')]),T.types[0].id,'full')
   +sel('المخزن','wh',T.whs.map(w=>[w.id,w.name]),(T.whs[0]||{}).id||'')+fld('التاريخ','date',today(),'date')
   +sel('المشروع','proj',opt(T.projs,'— اختر المشروع —'),'')
   +sel('الحملة / المبادرة','cmp',opt(T.cmps,'— بدون —'),'')
   +sel('الحدث / القافلة','event',opt(T.events,'— بدون —'),'')
   +sel('البرنامج (اختياري)','prog',opt(T.progs,'— بدون —'),'')
   +(T.canBen?sel('المستفيد','ben',opt(T.bens,'— اختر المستفيد —'),'','full'):'<div class="full mu">اختيار المستفيد يحتاج صلاحية في مديول المستفيدين</div>')
   +fld('سبب / وصف الصرف (إلزامي)','note','','ta','full')
   +`<div class="full"><b>الأصناف المصروفة</b><div style="overflow-x:auto"><table id="ikt"><thead><tr><th>الصنف</th><th>الكمية</th><th>الرصيد</th><th></th></tr></thead><tbody>${rowH()}</tbody></table></div><button type="button" class="b o s" onclick="$('#ikt tbody').insertAdjacentHTML('beforeend',ikRowH())">+ صنف</button></div>`,
   ()=>{const o=rd();const t=T.types.find(z=>z.id==o.type);
     o.items=$$('#ikt tbody tr').map(r=>({item:r.querySelector('.ik_i').value,q:+r.querySelector('.ik_q').value||0})).filter(l=>l.item&&l.q>0);
     if(!o.items.length){toast('أضف صنفًا وكمية',1);return false}
     if(!(o.note||'').trim()){toast('اكتب سبب الصرف',1);return false}
     if(t&&t.aid&&!o.ben){toast('اختر المستفيد',1);return false}
     if(t&&t.aid&&!o.proj){toast('اختر المشروع',1);return false}
     if(!(t&&t.aid))delete o.ben;
     return run('postInk',o,'تم الصرف وترحيل القيد').then(z=>{if(z===false)return false;reset();return true})},'تأكيد الصرف');
  const sl=$('#m [name=type]'),sw=$('#m [name=wh]');if(sl)sl.addEventListener('change',ikType);if(sw)sw.addEventListener('change',ikAvail);ikType();ikAvail()};
A.vik=i=>{const x=S.T&&S.T.list.find(z=>z.id==i);if(!x)return;
  mdl('صرف '+x.no,kv('النوع',x.typeName)+kv('التاريخ',x.date)+kv('المخزن',x.wh)+kv('مستند المخزن',x.docNo)+kv('المشروع',x.projName||'—')+kv('المبادرة',x.cmpName||'—')+kv('الحدث / القافلة',x.eventName||'—')+kv('المستفيد',x.benName||'—')+kv('البرنامج',x.progName||'—')+kv('القيمة',f(x.value))+kv('الحالة',x.st)+kv('السبب',x.note)+kv('بواسطة',x.byName),null)};
A.rik=i=>{const x=S.T&&S.T.list.find(z=>z.id==i);if(!x)return;
  mdl('عكس صرف '+x.no,`<div class="full mu">يُعاد الرصيد للمخزن ويُعكس القيد${x.benName?' وتُلغى المساعدة العينية المسجّلة للمستفيد':''}.</div>`+fld('سبب العكس (إلزامي)','reason','','ta','full'),
   ()=>{const r=rd().reason.trim();if(!r){toast('اكتب السبب',1);return false}return run('reverseInk',{id:i,reason:r},'تم العكس').then(z=>{if(z===false)return false;reset();return true})},'تأكيد العكس')};

// ---- التقرير
const loadRep=force=>{if(force)S.R=null;if(!S.R&&!S.rl){S.rl=1;S.rerr='';api('inkRep',S.rq).then(j=>{S.R=j;S.rl=0;rr()}).catch(e=>{S.rl=0;S.rerr=e.message;rr()})}return S.R};
V.i_krep=()=>{
  const T=load(),R=T?loadRep():null;
  if(S.err||S.rerr)return head('تقرير الصرف المخصص')+`<div class="box" style="color:#c0392b">${esc(S.err||S.rerr)} <button class="b s" data-a="ikrr">إعادة المحاولة</button></div>`;
  if(!T||!R)return head('تقرير الصرف المخصص')+'<div class="box mu">جارٍ التحميل…</div>';
  const q=S.rq,o=(arr,k,ph)=>`<select onchange="ikF('${k}',this.value)"><option value="">${ph}</option>${arr.map(a=>`<option value="${esc(a.id)}"${a.id==q[k]?' selected':''}>${esc(a.name)}</option>`).join('')}</select>`;
  return head('تقرير الصرف المخصص')
   +`<div class="box" style="display:flex;gap:6px;flex-wrap:wrap;align-items:end">`
   +`<label>تجميع حسب <select onchange="ikF('by',this.value)">${R.dims.map(d=>`<option value="${d.k}"${d.k===q.by?' selected':''}>${esc(d.l)}</option>`).join('')}</select></label>`
   +`<label>من <input type="date" value="${esc(q.from)}" onchange="ikF('from',this.value)"></label><label>إلى <input type="date" value="${esc(q.to)}" onchange="ikF('to',this.value)"></label>`
   +o(T.projs,'proj','كل المشاريع')+o(T.cmps,'cmp','كل المبادرات')+o(T.events,'event','كل الأحداث')+(T.canBen?o(T.bens,'ben','كل المستفيدين'):'')+o(T.types,'type','كل الأنواع')+`</div>`
   +`<div class="cards"><div class="card"><div class="mu">عدد العمليات</div><b>${R.count}</b></div><div class="card"><div class="mu">إجمالي القيمة</div><b>${f(R.total)}</b></div></div>`
   +`<div class="box">${tbl([(R.dims.find(d=>d.k===R.by)||{}).l||'',R.by==='item'?'الكمية':'عدد العمليات','القيمة','النسبة'],R.rows.map(x=>[esc(x.label),R.by==='item'?x.qty:x.n,f(x.value),R.total?(x.value/R.total*100).toFixed(1)+'%':'—']))}</div>`
   +`<div class="box"><b>التفاصيل</b>${tbl(['الرقم','التاريخ','النوع','المشروع','المبادرة','الحدث / القافلة','المستفيد','القيمة'],R.detail.map(x=>[esc(x.no),esc(x.date),esc(x.typeName),esc(x.projName||'—'),esc(x.cmpName||'—'),esc(x.eventName||'—'),esc(x.benName||'—'),f(x.value)]))}</div>`};
window.ikF=(k,v)=>{S.rq[k]=v;S.R=null;rr()};
A.ikrr=()=>{S.err='';S.rerr='';S.T=null;S.R=null;rr()};

// ---- أنواع الصرف
V.i_ktyp=()=>{
  const T=loadTy();
  if(S.terr)return head('أنواع الصرف')+`<div class="box" style="color:#c0392b">${esc(S.terr)} <button class="b s" data-a="iktr">إعادة المحاولة</button></div>`;
  if(!T)return head('أنواع الصرف')+'<div class="box mu">جارٍ التحميل…</div>';
  return head('أنواع الصرف','nkt','+ نوع صرف')
   +`<div class="box">${tbl(['الكود','النوع','حساب المصروف','مساعدة لمستفيد','عدد العمليات','الحالة',''],T.list.map(x=>[esc(x.code),esc(x.name),esc(x.accName)+(x.accOk||!T.linked?'':' <span style="color:#b3261e">(غير صالح)</span>'),x.aid?'نعم':'لا',x.used,badge(x.active?'فعّال':'موقوف',x.active),btn('nkt',x.id,'تعديل','o')+(x.used?'':btn('dkt',x.id,'حذف','r'))]))}</div>`
   +`<p class="mu">كل نوع صرف مربوط بحساب مصروف (مثل «مساعدات عينية»)؛ يُحدَّد هنا مرة واحدة ولا يظهر في شاشة الصرف. النوع المُعلَّم «مساعدة لمستفيد» يتطلب مستفيدًا ومشروعًا ويسجّل مساعدة عينية.</p>`};
A.iktr=()=>{S.terr='';S.TY=null;rr()};
A.nkt=async i=>{try{S.TY=await api('listIssueTypes');S.tts=Date.now()}catch(e){toast(e.message,1);return}const T=S.TY;const x=i?T.list.find(z=>z.id==i):{active:true,aid:false};if(!x)return;
  mdl(i?'تعديل نوع صرف '+x.code:'نوع صرف جديد',
   fld('اسم النوع','name',x.name||'','text','full')
   +(T.linked?sel('حساب المصروف (من دليل الحسابات)','acc',[['','— اختر —']].concat(T.accs.map(a=>[a.id,a.name])),x.acc||'','full'):'')
   +sel('مساعدة لمستفيد؟','aid',[['true','نعم — يتطلب مستفيدًا ويسجّل مساعدة عينية'],['false','لا — مصروف عام']],String(!!x.aid),'full')
   +(i?sel('الحالة','active',[['true','فعّال'],['false','موقوف']],String(x.active!==false)):'')+fld('ملاحظات','note',x.note||'','text','full'),
   ()=>{const o=rd();if(!o.name.trim()){toast('أدخل الاسم',1);return false}if(T.linked&&!o.acc){toast('اختر حساب المصروف',1);return false}if(i){o.id=i;o.ver=x.ver}return run('saveIssueType',o,'تم الحفظ').then(z=>{if(z===false)return false;reset();return true})})};
A.dkt=i=>{if(confirm('حذف نوع الصرف؟'))run('delIssueType',{id:i},'تم الحذف').then(z=>{if(z!==false)reset()})};
})();
