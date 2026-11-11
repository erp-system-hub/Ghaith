/* الإدارة ← «تنظيف نسخ الشيتات»: عرض وحذف تابات _bak_ التي أنشأتها ترقية أعمدة الشيتات (أدمن فقط) */
(()=>{
const S={T:null,l:0,err:'',sel:new Set(),init:false};
const rr=()=>{if(view==='a_cln')render()};
const load=force=>{if(force){S.T=null;S.init=false}if(!S.T&&!S.l){S.l=1;S.err='';api('listBakSheets').then(j=>{S.T=j;S.l=0;S.init=false;rr()}).catch(e=>{S.l=0;S.err=e.message;rr()})}return S.T};
if(typeof MODS!=='undefined'&&MODS.adm){const o=MODS.adm.nav;MODS.adm.nav=()=>{const r=o().filter(n=>n[0]!=='a_cln');r.push(['a_cln','تنظيف نسخ الشيتات']);return r}}
if(typeof V!=='undefined')V.a_cln=()=>{
  const T=load();
  if(S.err)return head('تنظيف نسخ الشيتات')+`<div class="box" style="color:#c0392b">${esc(S.err)} <button class="b s" data-a="clnr">إعادة المحاولة</button></div>`;
  if(!T)return head('تنظيف نسخ الشيتات')+'<div class="box mu">جارٍ التحميل…</div>';
  if(!S.init){S.sel=new Set(T.list.filter(x=>!x.suspect).map(x=>x.name));S.init=true}
  const by={};T.list.forEach(x=>by[x.base]=(by[x.base]||0)+1);
  return head('تنظيف نسخ الشيتات')
   +`<div class="cards"><div class="card"><div class="mu">عدد النسخ الاحتياطية</div><b>${T.list.length}</b></div><div class="card"><div class="mu">المحدَّد للحذف</div><b id="clnN">${S.sel.size}</b></div>${T.suspect?`<div class="card"><div class="mu" style="color:#b3261e">مشتبه بها (لا تُحذف تلقائيًا)</div><b style="color:#b3261e">${T.suspect}</b></div>`:''}</div>`
   +`<div class="box"><p class="mu">هذه نسخ ينشئها النظام قبل إعادة ترتيب أعمدة شيت عند تشغيل <code>setup()</code>. بعد التأكد من سلامة البيانات الحالية يمكن حذفها بأمان. النسخة «مشتبه» = الشيت الأصلي فيه صفوف أقل منها، فراجعها قبل حذفها. ${Object.keys(by).length?'الشيتات: '+Object.keys(by).map(k=>esc(k)+' ('+by[k]+')').join('، '):''}</p>`
   +(T.list.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="b o s" data-a="clna">تحديد الكل</button><button class="b o s" data-a="clnz">إلغاء التحديد</button><button class="b r" data-a="clnd">حذف المحدّد</button></div>`:'<p>لا توجد نسخ احتياطية للشيتات 👌</p>')
   +(T.list.length?tbl(['','النسخة','الشيت','تاريخ الإنشاء','صفوف النسخة','صفوف الشيت الحالي','ملاحظة'],T.list.map(x=>[`<input type="checkbox" class="clnc" value="${esc(x.name)}"${S.sel.has(x.name)?' checked':''} onchange="clnt(this)">`,esc(x.name),esc(x.base),esc(x.at),x.rows,x.baseRows,x.suspect?'<span style="color:#b3261e">مشتبه — راجع الشيت الأصلي</span>':'—'])):'')+`</div>`};
window.clnt=e=>{e.checked?S.sel.add(e.value):S.sel.delete(e.value);const n=$('#clnN');if(n)n.textContent=S.sel.size};
A.clnr=()=>{S.err='';load(true);rr()};
A.clna=()=>{S.sel=new Set(S.T.list.map(x=>x.name));rr()};
A.clnz=()=>{S.sel=new Set();rr()};
A.clnd=()=>{const names=[...S.sel];if(!names.length){toast('حدّد نسخة واحدة على الأقل',1);return}
  mdl('تأكيد حذف النسخ الاحتياطية',`<div class="full">سيتم حذف <b>${names.length}</b> تاب نسخ احتياطي نهائيًا. الشيتات الأصلية لا تتأثر.</div><div class="full mu" style="max-height:140px;overflow:auto">${names.map(esc).join('<br>')}</div>`,
   async()=>{let n=0,sk=0;try{for(let i=0;i<names.length;i+=100){const j=await api('delBakSheets',{names:names.slice(i,i+100)});n+=j.n;sk+=j.skipped}}catch(e){toast(e.message,1);load(true);return false}
     toast('تم حذف '+n+' نسخة'+(sk?' (تجاوز '+sk+')':''));load(true);rr();return true},'حذف نهائي')};
})();
