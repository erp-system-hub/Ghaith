/* =====================================================================
   الصرف — مديول واحد لكل أنواع الصرف المخزني (تاب i_iss)
   اختر «نوع الصرف» من نفس الشاشة:
     • صرف مقابل طلب صرف معتمد       • صرف مباشر لجهة / مستلم
     • أنواع الصرف المربوطة بحساب (مثل «مساعدات عينية») على مشروع/مبادرة/حدث/مستفيد
   داخل المديول: «السجل» لكل مستندات الصرف، «التقرير» بالأبعاد، «أنواع الصرف» (للمدير).
   الحساب يُحدَّد في نوع الصرف ولا يظهر في الشاشة أو المطبوع.
   ===================================================================== */
(()=>{
const S={T:null,l:0,ts:0,err:'',TY:null,tl:0,tts:0,terr:'',R:null,rl:0,rerr:'',sub:'log',rq:{by:'proj',from:'',to:'',proj:'',cmp:'',event:'',ben:'',type:''}};
const rr=()=>{if(view==='i_iss')render()};
const badge=(t,ok)=>`<span class="st" style="background:${ok?'#1e7a46':'#777'};color:#fff">${esc(t)}</span>`;
const IV=()=>D.inv||{role:'none',cost:false,wh:[],items:[],stock:[],docs:[]};
const mgr=()=>['admin','manager'].includes(IV().role);
const money=v=>v==null?'—':f(v);

// تحديث تلقائي: أقدم من 15 ثانية يُحدَّث في الخلفية (تبقى القديمة معروضة)
const load=force=>{if(force)S.T=null;if(!S.l&&(!S.T||Date.now()-S.ts>15000)){S.l=1;S.err='';api('listInk').then(j=>{S.T=j;S.ts=Date.now();S.l=0;rr()}).catch(e=>{S.l=0;S.err=e.message;rr()})}return S.T};
const loadTy=force=>{if(force)S.TY=null;if(!S.tl&&(!S.TY||Date.now()-S.tts>15000)){S.tl=1;S.terr='';api('listIssueTypes').then(j=>{S.TY=j;S.tts=Date.now();S.tl=0;rr()}).catch(e=>{S.tl=0;S.terr=e.message;rr()})}return S.TY};
const loadRep=force=>{if(force)S.R=null;if(!S.R&&!S.rl){S.rl=1;S.rerr='';api('inkRep',S.rq).then(j=>{S.R=j;S.rl=0;rr()}).catch(e=>{S.rl=0;S.rerr=e.message;rr()})}return S.R};
const reset=()=>{S.T=null;S.TY=null;S.R=null;rr()};

/* ---- التاب: الاسم «الصرف» وإخفاء التابات المنفصلة القديمة ---- */
if(MODS.inv){const o=MODS.inv.nav;MODS.inv.nav=()=>o().filter(n=>!['i_kind','i_krep','i_ktyp'].includes(n[0]))}

/* ---- أدوات مشتركة ---- */
const whName=id=>{const w=IV().wh.find(z=>z.id===id);return w?w.name:''};
const itemOf=id=>IV().items.find(z=>z.id===id)||{};
const inkMap=()=>{const m={};(S.T?S.T.list:[]).forEach(r=>{m[r.docId]=r});return m};
const kindLbl=(x,ink)=>ink?ink.typeName:(x.refId?'مقابل طلب '+(x.refNo||''):'صرف مباشر');
const docVal=x=>IV().cost?f((x.items||[]).reduce((s,l)=>s+(+l.v||0),0)):'—';
const seg=()=>{const t=[['log','سجل الصرف'],['rep','التقرير']].concat(mgr()?[['typ','أنواع الصرف']]:[]);
  return `<span style="display:inline-flex;gap:4px">${t.map(z=>`<button class="b ${S.sub===z[0]?'g':'o'} s" data-a="isub" data-i="${z[0]}">${z[1]}</button>`).join('')}</span>`};
A.isub=k=>{S.sub=k;rr()};
const top=()=>head('الصرف',S.sub==='log'?'nis':S.sub==='typ'?'nkt':'',S.sub==='typ'?'+ نوع صرف':'+ صرف جديد',seg());
const errBox=(m,a)=>top()+`<div class="box" style="color:#c0392b">${esc(m)} <button class="b s" data-a="${a}">إعادة المحاولة</button></div>`;
const wait=()=>top()+'<div class="box mu">جارٍ التحميل…</div>';
A.ikre=()=>{S.err='';S.terr='';S.rerr='';S.T=null;S.TY=null;S.R=null;rr()};

/* ---- الصفحة ---- */
V.i_iss=()=>{
  if(S.sub==='rep')return repView();
  if(S.sub==='typ'&&mgr())return typView();
  return logView()};

/* ============ سجل الصرف ============ */
const logView=()=>{
  const T=load();
  if(S.err)return errBox(S.err,'ikre');
  if(!T)return wait();
  const im=inkMap(),docs=IV().docs.filter(x=>x.type==='ISS');
  const live=docs.filter(x=>x.st==='مرحّل');
  const cnt=k=>live.filter(x=>k==='ink'?im[x.id]:k==='req'?(!im[x.id]&&x.refId):(!im[x.id]&&!x.refId)).length;
  return top()
   +`<div class="cards"><div class="card"><div class="mu">إجمالي المستندات</div><b>${live.length}</b></div><div class="card"><div class="mu">مقابل طلبات</div><b>${cnt('req')}</b></div><div class="card"><div class="mu">صرف مباشر</div><b>${cnt('dir')}</b></div><div class="card"><div class="mu">مربوط بحساب / مساعدات</div><b>${cnt('ink')}</b></div></div>`
   +`<div class="box">${tbl(['الرقم','التاريخ','نوع الصرف','المخزن','الجهة / المستفيد','المشروع','المبادرة / الحدث','القيمة','الحالة',''],docs.map(x=>{const k=im[x.id];
     return [esc(x.no),esc(x.date),esc(kindLbl(x,k)),esc(whName(x.wh)),esc(k&&k.benName?k.benName:x.party||'—'),esc((k?k.projName:x.proj)||'—'),esc(k?[k.cmpName,k.eventName].filter(Boolean).join(' / ')||'—':'—'),docVal(x),badge(x.st,x.st==='مرحّل'),
      btn('vis',x.id,'عرض','o')+btn('pis',x.id,'طباعة','o')+(x.st==='مرحّل'&&mgr()?btn('ris',x.id,'عكس','r'):'')]}))}</div>`
   +`<p class="mu">اضغط «+ صرف جديد» واختر نوع الصرف: مقابل طلب معتمد، أو مباشر، أو أحد الأنواع المربوطة بحساب (مثل المساعدات العينية). الحساب يُحدَّد في «أنواع الصرف» ولا يظهر هنا.</p>`};

const issHtml=(x,pr)=>{const k=inkMap()[x.id],cost=IV().cost;
  const rows=(x.items||[]).map(l=>{const it=itemOf(l.item);return [esc(it.code||''),esc(it.name||'؟'),esc(it.unit||''),l.q].concat(cost?[f(l.v||0)]:[])});
  return (pr?printHead('إذن صرف مخزني'):'')
   +`<div class="g"><div>${P('رقم المستند',x.no)+P('التاريخ',x.date)+P('المخزن',whName(x.wh))+P('نوع الصرف',kindLbl(x,k))+(x.refNo?P('طلب الصرف',x.refNo):'')}</div>`
   +`<div>${P('الجهة / المستلم',(k&&k.benName)||x.party)+P('المشروع',(k?k.projName:x.proj)||'—')+(k?P('المبادرة',k.cmpName||'—')+P('الحدث / القافلة',k.eventName||'—')+P('البرنامج',k.progName||'—'):'')+P('الحالة',x.st)}</div></div>`
   +tbl(['الكود','الصنف','الوحدة','الكمية'].concat(cost?['القيمة']:[]),rows)
   +(cost?`<p>إجمالي القيمة: <b>${docVal(x)}</b></p>`:'')+(x.note?P('السبب / ملاحظات',x.note):'')+(x.reason?P('سبب العكس',x.reason):'')+(pr?printFoot():'')};
const isFind=i=>IV().docs.find(z=>z.id==i);
A.vis=i=>{const x=isFind(i);if(!x)return;mdl('مستند صرف '+x.no,`<div class="full" style="overflow-x:auto">${issHtml(x,false)}</div><div class="full"><button class="b g" data-a="pis" data-i="${esc(i)}">طباعة</button></div>`,null)};
A.pis=i=>{const x=isFind(i);if(x)docOut(issHtml(x,true),'إذن صرف '+x.no)};
A.ris=i=>{const x=isFind(i);if(!x)return;const k=inkMap()[x.id];
  const act=k?'reverseInk':'reverseDoc',rid=k?k.id:i;
  revMdl('عكس صرف '+x.no,`<div class="full mu">يُعاد الرصيد للمخزن ويُعكس القيد${k&&k.benName?' وتُلغى المساعدة العينية المسجّلة للمستفيد':''}.</div>`+fld('سبب العكس (إلزامي)','reason','','ta','full'),act,{id:rid},
   o=>{const r=o.reason.trim();if(!r){toast('اكتب السبب',1);return false}return run(act,{id:rid,reason:r,revDate:o.revDate},'تم عكس الصرف').then(z=>{if(z===false)return false;reset();return true})},'تأكيد العكس')};

/* ============ صرف جديد (نوع واحد يغيّر الحقول) ============ */
const opt=(arr,ph)=>[['',ph]].concat(arr.map(a=>[a.id,a.name]));
const reqsOpen=()=>IV().docs.filter(x=>x.type==='REQ'&&['معتمد','مصروف جزئيًا'].includes(x.st));
const itemOpts=(T,cur)=>'<option value="">— اختر الصنف —</option>'+T.items.map(i=>`<option value="${esc(i.id)}"${i.id==cur?' selected':''}>${esc(i.name)}${i.unit?' ('+esc(i.unit)+')':''}</option>`).join('');
const rowH=(it,q)=>`<tr><td><select class="ik_i" style="min-width:230px" onchange="ikAvail()">${itemOpts(S.T,it)}</select></td><td><input class="ik_q" type="number" min="0" step="any" value="${q||''}" style="width:90px"></td><td class="ik_a mu">—</td><td><button type="button" class="b s r" onclick="this.closest('tr').remove()">×</button></td></tr>`;
window.ikRowH=()=>rowH('','');
window.ikAvail=()=>{const w=($('#m [name=wh]')||{}).value;$$('#ikt tbody tr').forEach(r=>{const i=r.querySelector('.ik_i').value,q=w&&i?(S.T.stock[w+'|'+i]||0):null;r.querySelector('.ik_a').textContent=q==null?'—':'المتاح '+q})};
// إظهار الحقول حسب النوع
window.ikMode=()=>{const v=($('#m [name=type]')||{}).value||'',ty=S.T.types.find(z=>'k:'+z.id===v);
  const mode=v==='req'?'req':v==='dir'?'dir':'ink';
  $$('#m [data-g]').forEach(e=>{const g=e.dataset.g.split(' ');e.style.display=(g.includes(mode)&&(!g.includes('aid')||(ty&&ty.aid)))?'':'none'})};
window.ikReq=()=>{const id=($('#m [name=reqId]')||{}).value,r=IV().docs.find(z=>z.id===id);const tb=$('#ikt tbody');if(!tb)return;
  if(!r){tb.innerHTML=rowH('','');return}
  const iss=Array.isArray(r.iss)?r.iss:[];tb.innerHTML=(r.items||[]).map((l,i)=>({item:l.item,rem:Math.round((l.q-(+iss[i]||0))*1000)/1000})).filter(z=>z.rem>0).map(z=>rowH(z.item,z.rem)).join('')||rowH('','');
  const p=$('#m [name=party]');if(p&&!p.value)p.value=r.party||'';ikAvail()};

A.nis=async()=>{
  try{S.T=await api('listInk');S.ts=Date.now()}catch(e){toast(e.message,1);return}
  const T=S.T,canIssue=['admin','manager','storekeeper'].includes(IV().role),reqs=canIssue?reqsOpen():[],canDir=mgr();
  const types=[];if(reqs.length)types.push(['req','صرف مقابل طلب صرف معتمد']);if(canDir)types.push(['dir','صرف مباشر لجهة / مستلم']);
  if(canDir)T.types.forEach(t=>types.push(['k:'+t.id,t.name+(t.aid?' (مساعدة لمستفيد)':'')]));
  if(!types.length){toast('لا يوجد طلب صرف معتمد، والصرف المباشر لمدير المخازن',1);return}
  mdl('صرف جديد',
   sel('نوع الصرف','type',types,types[0][0],'full')
   +sel('المخزن','wh',T.whs.map(w=>[w.id,w.name]),(T.whs[0]||{}).id||'')+fld('التاريخ','date',today(),'date')
   +`<div class="full" data-g="req">${sel('طلب الصرف المعتمد','reqId',[['','— اختر الطلب —']].concat(reqs.map(r=>[r.id,r.no+' — '+(r.party||'')+(r.proj?' — '+r.proj:'')])),'','full')}</div>`
   +`<div data-g="req dir">${fld('الجهة / المستلم','party','','text')}</div>`
   +`<div data-g="dir ink">${sel('المشروع','proj',opt(T.projs,'— اختر المشروع —'),'')}</div>`
   +`<div data-g="ink">${sel('الحملة / المبادرة','cmp',opt(T.cmps,'— بدون —'),'')}</div>`
   +`<div data-g="ink">${sel('الحدث / القافلة','event',opt(T.events,'— بدون —'),'')}</div>`
   +`<div data-g="ink">${sel('البرنامج (اختياري)','prog',opt(T.progs,'— بدون —'),'')}</div>`
   +`<div class="full" data-g="ink aid">${T.canBen?sel('المستفيد','ben',opt(T.bens,'— اختر المستفيد —'),'','full'):'<div class="mu">اختيار المستفيد يحتاج صلاحية في مديول المستفيدين</div>'}</div>`
   +fld('سبب / وصف الصرف','note','','ta','full')
   +`<div class="full"><b>الأصناف المصروفة</b><div style="overflow-x:auto"><table id="ikt"><thead><tr><th>الصنف</th><th>الكمية</th><th>الرصيد</th><th></th></tr></thead><tbody>${rowH('','')}</tbody></table></div><button type="button" class="b o s" onclick="$('#ikt tbody').insertAdjacentHTML('beforeend',ikRowH())">+ صنف</button></div>`,
   ()=>{const o=rd(),v=o.type,mode=v==='req'?'req':v==='dir'?'dir':'ink',ty=T.types.find(z=>'k:'+z.id===v);
     const items=$$('#ikt tbody tr').map(r=>({item:r.querySelector('.ik_i').value,q:+r.querySelector('.ik_q').value||0})).filter(l=>l.item&&l.q>0);
     if(!items.length){toast('أضف صنفًا وكمية',1);return false}
     let a,p;
     if(mode==='req'){if(!o.reqId){toast('اختر طلب الصرف',1);return false}a='postIssue';p={reqId:o.reqId,wh:o.wh,date:o.date,party:o.party,note:o.note,items}}
     else if(mode==='dir'){if(!o.party.trim()){toast('اكتب اسم المستلم / الجهة',1);return false}if(!o.note.trim()){toast('اكتب سبب الصرف',1);return false}a='postIssue';p={wh:o.wh,date:o.date,party:o.party,proj:o.proj,note:o.note,items}}
     else{if(!o.note.trim()){toast('اكتب سبب الصرف',1);return false}if(ty.aid&&!o.ben){toast('اختر المستفيد',1);return false}if(ty.aid&&!o.proj){toast('اختر المشروع',1);return false}
       a='postInk';p={type:ty.id,wh:o.wh,date:o.date,proj:o.proj,cmp:o.cmp,event:o.event,prog:o.prog,note:o.note,items};if(ty.aid)p.ben=o.ben}
     return run(a,p,'تم الصرف').then(z=>{if(z===false)return false;reset();return true})},'تأكيد الصرف');
  const sl=$('#m [name=type]'),sw=$('#m [name=wh]'),rq=$('#m [name=reqId]');
  if(sl)sl.addEventListener('change',()=>{ikMode();if(sl.value!=='req'){const tb=$('#ikt tbody');if(tb&&!$$('#ikt .ik_i').some(e=>e.value))tb.innerHTML=rowH('','')}});
  if(sw)sw.addEventListener('change',ikAvail);if(rq)rq.addEventListener('change',ikReq);ikMode();ikAvail()};

/* ============ التقرير ============ */
const repView=()=>{
  const T=load(),R=T?loadRep():null;
  if(S.err||S.rerr)return errBox(S.err||S.rerr,'ikre');
  if(!T||!R)return wait();
  const q=S.rq,o=(arr,k,ph)=>`<select onchange="ikF('${k}',this.value)"><option value="">${ph}</option>${arr.map(a=>`<option value="${esc(a.id)}"${a.id==q[k]?' selected':''}>${esc(a.name)}</option>`).join('')}</select>`;
  return top()
   +`<div class="box" style="display:flex;gap:6px;flex-wrap:wrap;align-items:end">`
   +`<label>تجميع حسب <select onchange="ikF('by',this.value)">${R.dims.map(d=>`<option value="${d.k}"${d.k===q.by?' selected':''}>${esc(d.l)}</option>`).join('')}</select></label>`
   +`<label>من <input type="date" value="${esc(q.from)}" onchange="ikF('from',this.value)"></label><label>إلى <input type="date" value="${esc(q.to)}" onchange="ikF('to',this.value)"></label>`
   +o(T.projs,'proj','كل المشاريع')+o(T.cmps,'cmp','كل المبادرات')+o(T.events,'event','كل الأحداث')+(T.canBen?o(T.bens,'ben','كل المستفيدين'):'')+o(T.types,'type','كل الأنواع')+`</div>`
   +`<div class="cards"><div class="card"><div class="mu">عدد العمليات</div><b>${R.count}</b></div><div class="card"><div class="mu">إجمالي القيمة</div><b>${f(R.total)}</b></div></div>`
   +`<div class="box">${tbl([(R.dims.find(d=>d.k===R.by)||{}).l||'',R.by==='item'?'الكمية':'عدد العمليات','القيمة','النسبة'],R.rows.map(x=>[esc(x.label),R.by==='item'?x.qty:x.n,f(x.value),R.total?(x.value/R.total*100).toFixed(1)+'%':'—']))}</div>`
   +`<div class="box"><b>التفاصيل</b>${tbl(['الرقم','التاريخ','النوع','المشروع','المبادرة','الحدث / القافلة','المستفيد','القيمة'],R.detail.map(x=>[esc(x.no),esc(x.date),esc(x.typeName),esc(x.projName||'—'),esc(x.cmpName||'—'),esc(x.eventName||'—'),esc(x.benName||'—'),f(x.value)]))}</div>`};
window.ikF=(k,v)=>{S.rq[k]=v;S.R=null;rr()};

/* ============ أنواع الصرف (للمدير) ============ */
const typView=()=>{
  const T=loadTy();
  if(S.terr)return errBox(S.terr,'ikre');
  if(!T)return wait();
  return top()
   +`<div class="box">${tbl(['الكود','النوع','حساب المصروف','مساعدة لمستفيد','عدد العمليات','الحالة',''],T.list.map(x=>[esc(x.code),esc(x.name),esc(x.accName)+(x.accOk||!T.linked?'':' <span style="color:#b3261e">(غير صالح)</span>'),x.aid?'نعم':'لا',x.used,badge(x.active?'فعّال':'موقوف',x.active),btn('nkt',x.id,'تعديل','o')+(x.used?'':btn('dkt',x.id,'حذف','r'))]))}</div>`
   +`<p class="mu">كل نوع صرف مربوط بحساب مصروف (مثل «مساعدات عينية»)؛ يُحدَّد هنا مرة واحدة ولا يظهر في شاشة الصرف. النوع المُعلَّم «مساعدة لمستفيد» يتطلب مستفيدًا ومشروعًا ويسجّل مساعدة عينية.</p>`};
A.nkt=async i=>{try{S.TY=await api('listIssueTypes');S.tts=Date.now()}catch(e){toast(e.message,1);return}const T=S.TY;const x=i?T.list.find(z=>z.id==i):{active:true,aid:false};if(!x)return;
  mdl(i?'تعديل نوع صرف '+x.code:'نوع صرف جديد',
   fld('اسم النوع','name',x.name||'','text','full')
   +(T.linked?sel('حساب المصروف (من دليل الحسابات)','acc',[['','— اختر —']].concat(T.accs.map(a=>[a.id,a.name])),x.acc||'','full'):'')
   +sel('مساعدة لمستفيد؟','aid',[['true','نعم — يتطلب مستفيدًا ويسجّل مساعدة عينية'],['false','لا — مصروف عام']],String(!!x.aid),'full')
   +(i?sel('الحالة','active',[['true','فعّال'],['false','موقوف']],String(x.active!==false)):'')+fld('ملاحظات','note',x.note||'','text','full'),
   ()=>{const o=rd();if(!o.name.trim()){toast('أدخل الاسم',1);return false}if(T.linked&&!o.acc){toast('اختر حساب المصروف',1);return false}if(i){o.id=i;o.ver=x.ver}return run('saveIssueType',o,'تم الحفظ').then(z=>{if(z===false)return false;reset();return true})})};
A.dkt=i=>{if(confirm('حذف نوع الصرف؟'))run('delIssueType',{id:i},'تم الحذف').then(z=>{if(z!==false)reset()})};
})();
