/* =====================================================================
   مديول التبرعات: لوحة التحكم، المتبرعون (أفراد / شركات / جمعيات ومؤسسات / جهات...)،
   التبرعات (نقدي وعيني) والإيصالات، الالتزامات، التواصل والمتابعة، الحملات والمبادرات، التقارير
   مرتبط بالمشاريع (دليل المشاريع)، المخازن (التبرع العيني)، والحسابات (قيد الإيراد)
   ===================================================================== */
(()=>{
const DN=()=>D.don;
const dr=()=>DN().role;
const isM=()=>['admin','manager'].includes(dr());
const canW=()=>['admin','manager','officer'].includes(dr());
const donorO=id=>DN().donors.find(x=>x.id==id)||{};
const donorN=id=>{const d=donorO(id);return d.code?d.code+' · '+d.name:'—'};
const cmpO=id=>DN().campaigns.find(x=>x.id==id)||{};
const cmpN=id=>id?(cmpO(id).code?cmpO(id).code+' · '+cmpO(id).name:'؟'):'—';
const EV=()=>(D.evt&&D.evt.list)||[];
const evO=id=>EV().find(x=>x.id==id)||{};
const evN=id=>id?(evO(id).code?evO(id).code+' · '+evO(id).name:'؟'):'—';
const evOpts=(cur,kind)=>[['',kind==='قافلة'?'— بدون قافلة —':'— بدون حدث —']].concat(EV().filter(e=>(e.st!=='مقفل'||e.id==cur)&&(!kind||(e.kind||'حدث')===kind||e.id==cur)).map(e=>[e.id,e.code+' · '+e.name]));
const hasKind=k=>EV().some(e=>(e.kind||'حدث')===k);
const evcSel=x=>(hasKind('حدث')||x.event?sel('الحدث (بازار، معرض...)','event',evOpts(x.event,'حدث'),x.event||''):'')+(hasKind('قافلة')||x.convoy?sel('القافلة','convoy',evOpts(x.convoy,'قافلة'),x.convoy||''):'');
const EST=['مخطط','جاري','منتهي'];
const isAd=()=>dr()==='admin'||D.user.role==='admin';
const TYPES=['فرد','شركة','جمعية / مؤسسة','جهة حكومية','جهة دولية / ممول','أخرى'];
const METHODS=['نقدي','تحويل بنكي','شيك','بطاقة','محفظة إلكترونية','أخرى'];
const CHANNELS=['اتصال هاتفي','واتساب','بريد إلكتروني','زيارة','اجتماع','رسالة نصية','أخرى'];
const OUTCOMES=['تم التواصل','لم يرد','وعد بالتبرع','تبرع','اعتذر','يحتاج متابعة','شكر / تقدير'];
const PREF=['هاتف','واتساب','بريد إلكتروني','زيارة'];
const CKINDS=['حملة','مبادرة','برنامج','طارئ'];
const CST=['مخطط','جاري','مغلق'];
const opt=a=>a.map(x=>[x,x]);
const yS=()=>today().slice(0,4)+'-01-01';
const ST={rep:{kind:'campaign',from:yS(),to:today(),campaign:'',proj:'',months:12,res:null},fs:''};

MODS.don={title:'التبرعات',has:()=>D.user.mods.don,nav:()=>[['d_dash','لوحة التحكم'],['d_donors','المتبرعون'],['d_don','التبرعات'],['d_plg','الالتزامات'],['d_com','التواصل والمتابعة'],['d_cmp','الحملات والمبادرات'],['d_evt','الأحداث والقوافل'],['d_chn','قنوات التحصيل'],['d_rep','التقارير']]};

/* ---------- تفقيط المبلغ بالعربية (جنيه مصري) ---------- */
const O1=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const T1=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const H1=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
function w3(n){const p=[],h=Math.floor(n/100),r=n%100;if(h)p.push(H1[h]);if(r){if(r<20)p.push(O1[r]);else{const o=r%10,t=Math.floor(r/10);p.push((o?O1[o]+' و':'')+T1[t])}}return p.join(' و')}
const SC=[['',''],['ألف','ألفان','آلاف'],['مليون','مليونان','ملايين'],['مليار','ملياران','مليارات']];
function words(n){
  if(n===0)return 'صفر';const g=[];while(n>0){g.push(n%1000);n=Math.floor(n/1000)}
  const out=[];
  for(let i=g.length-1;i>=0;i--){const v=g[i];if(!v)continue;
    if(i===0){out.push(w3(v));continue}
    const s=SC[i]||['','',''];
    if(v===1)out.push(s[0]);else if(v===2)out.push(s[1]);else if(v<=10)out.push(w3(v)+' '+s[2]);else out.push(w3(v)+' '+s[0]);
  }
  return out.join(' و');
}
const tafq=a=>{a=Math.round((+a||0)*100)/100;const i=Math.floor(a+1e-9),c=Math.round((a-i)*100);if(i>=1e12)return '';return 'فقط '+words(i)+' جنيهًا مصريًا'+(c?' و'+words(c)+' قرشًا':'')+' لا غير'};
window.tafqeet=tafq;

/* ---------- لوحة التحكم ---------- */
V.d_dash=()=>{const s=DN().sum||{month:0,year:0,all:0,cash:0,inkind:0,nMonth:0,drafts:0,donors:0,overdueN:0,overdueAmt:0,followDue:0,followToday:0,series:[],top:[],newDonors:0};
  const cd=[['تبرعات هذا الشهر (ج.م)',f(s.month)],['عدد التبرعات هذا الشهر',s.nMonth],['تبرعات هذه السنة',f(s.year)],['الإجمالي منذ البداية',f(s.all)],['منها نقدي',f(s.cash)],['منها عيني (تقديري)',f(s.inkind)],['متبرعون نشطون',s.donors],['متبرعون جدد هذا الشهر',s.newDonors],['التزامات متأخرة',s.overdueN+' ('+f(s.overdueAmt)+')'],['متابعات مستحقة',s.followDue+(s.followToday?' (اليوم '+s.followToday+')':'')]];
  if(isM())cd.push(['مسودات بانتظار الاعتماد',s.drafts],['معتمدة بانتظار تأكيد الحسابات',(s.finN||0)+' ('+f(s.finAmt||0)+')']);
  const mx=Math.max(1,...s.series.map(x=>x.v));
  const bars=`<div style="display:flex;gap:6px;align-items:flex-end;height:120px;overflow-x:auto">${s.series.map(x=>`<div style="flex:1;min-width:34px;text-align:center"><div title="${esc(x.k)}: ${f(x.v)}" style="background:var(--p);height:${Math.round(x.v/mx*90)}px;min-height:${x.v?2:0}px;border-radius:3px 3px 0 0"></div><small class="mu">${esc(x.k.slice(2))}</small></div>`).join('')}</div>`;
  const fu=DN().comms.filter(c=>c.fst==='مفتوحة'&&c.next&&c.next<=today()).sort((a,b)=>a.next<b.next?-1:1).slice(0,8);
  const dr0=DN().donations.filter(x=>x.st==='مسودة').slice(0,8);
  return `<div class="cards">${cd.map(c=>`<div class="card"><small>${c[0]}</small><h2>${c[1]}</h2></div>`).join('')}</div>
<div class="box"><h3>التبرعات آخر 12 شهرًا (ج.م)</h3>${bars}</div>
<div class="box"><h3>أكبر المتبرعين</h3>${tbl(['المتبرع','عدد التبرعات','الإجمالي'],(s.top||[]).map(x=>[esc(donorN(x.id)),x.n,f(x.total)]))}</div>
<div class="box"><h3>متابعات مستحقة</h3>${tbl(['موعد المتابعة','المتبرع','الموضوع','وسيلة'],fu.map(c=>[esc(c.next),esc(donorN(c.donor)),esc(c.subject),esc(c.channel)]))}</div>
${isM()?`<div class="box"><h3>مسودات تبرعات بانتظار الاعتماد</h3>${tbl(['الرقم','التاريخ','المتبرع','قناة التحصيل','المبلغ','سجّلها','إجراءات'],dr0.map(x=>[x.no,x.date,esc(donorN(x.donor)),x.kind==='عيني'?'عيني':esc(chN(x.chn)),f(x.amount),esc(x.byName),btn('apd',x.id,'اعتماد','g')+btn('rjd',x.id,'رفض','r')+btn('vdn',x.id,'عرض','o')]))}</div>`:''}`};

/* ---------- المتبرعون ---------- */
const typeSel=()=>`<select id="dtf" onchange="dflt()" style="width:auto"><option value="">كل الأنواع</option>${TYPES.map(t=>`<option>${esc(t)}</option>`).join('')}</select>`;
const ownSel=()=>{const st=DN().ownerStats||[];return `<select id="dof" onchange="dofc()" style="width:auto" title="المستخدم المسؤول عن المتبرع"><option value="">كل المستخدمين المسؤولين</option><option value="me">المسجلون على حسابي</option>${isM()?`<option value="none">بدون مسؤول${DN().noOwnerCount?' ('+DN().noOwnerCount+')':''}</option>`:''}${st.length?`<optgroup label="حسب الموظف">${st.map(o=>`<option value="u:${esc(o.u)}">${esc(o.n)} (${o.c})</option>`).join('')}</optgroup>`:''}</select>`};
const deptSel=()=>{const st=DN().ownerStats;if(!st)return '';const dl=D.depts||[],cnt={};let none=DN().noOwnerCount||0;
  st.forEach(o=>{const k=o.d||'';if(k)cnt[k]=(cnt[k]||0)+o.c;else none+=o.c});
  const known=dl.filter(d=>cnt[d.code]),other=Object.keys(cnt).filter(k=>!dl.some(d=>d.code===k));
  return `<select id="ddf" onchange="dofc()" style="width:auto" title="الإدارات التابع لها المستخدمون المسؤولون عن المتبرعين"><option value="">كل الإدارات</option>${known.map(d=>`<option value="${esc(d.code)}">${esc(d.name)} (${cnt[d.code]})</option>`).join('')}${other.map(k=>`<option value="${esc(k)}">${esc(k)} (${cnt[k]})</option>`).join('')}${none?`<option value="__none">بدون إدارة / بدون مسؤول (${none})</option>`:''}</select>`};
const odMap=()=>{const m={};(DN().owners||[]).forEach(o=>m[o.u]=o.d||'');(DN().ownerStats||[]).forEach(o=>{if(o.d!==undefined)m[o.u]=o.d});return m};
/* حالة شاشة المتبرعين (البحث والفلاتر): تبقى بعد إعادة الرسم، وتُصفَّر عند دخول الشاشة من جديد */
const DD={q:'',t:'',o:'',dp:'',c:'',focus:false};
const dsave=()=>{const qi=$('#v .tb input');DD.q=qi?qi.value:'';DD.t=($('#dtf')||{}).value||'';DD.o=($('#dof')||{}).value||'';DD.dp=($('#ddf')||{}).value||'';DD.c=($('#dcf')||{}).value||''};
const dcnt=()=>{const el=$('#dstat');if(!el)return;const N=DN(),rs=$$('#v tbody tr').filter(r=>r.cells.length>2),vis=rs.filter(r=>!r.hidden).length;
  el.textContent='المعروض '+vis+' من '+N.donors.length+(N.donorsTotal>N.donors.length?' (إجمالي المتبرعين '+N.donorsTotal+' — جاري تحميل الباقي…)':'')};
window.dflt=()=>{dsave();const q=nz(DD.q),t=DD.t,o=DD.o,dp=DD.dp,c=DD.c,me=(D.user||{}).username;
  $$('#v tbody tr').forEach(r=>{if(r.cells.length<3)return;const ro=r.dataset.o,rd=r.dataset.d||'',rc=r.dataset.c||'';
    r.hidden=!(nz(r.textContent).includes(q)&&(!t||(r.dataset.t||'')===t)&&(!o||(o==='me'?ro===me:(o==='none'?!ro:ro===o.slice(2))))&&(!dp||rd===(dp==='__none'?'':dp))&&(!c||(c==='soon'?(rc==='soon'||rc==='today'||rc==='late'):rc===c)))});dcnt()};
window.dofc=async()=>{const N=DN(),o=($('#dof')||{}).value||'',dp=($('#ddf')||{}).value||'';dsave();
  const key=o==='me'?(D.user||{}).username:(o==='none'?'__none':(o.startsWith('u:')?o.slice(2):''));
  if(N.donorsTruncated&&!N._all){N._of=N._of||{};const todo=[];
    if(key&&!N._of['o:'+key])todo.push(['o:'+key,{owner:key}]);
    if(dp&&!N._of['d:'+dp])todo.push(['d:'+dp,{dept:dp}]);
    if(todo.length){try{for(const [k,p] of todo){const r=await api('donSearch',p);dsMerge(r.donors||[]);N._of[k]=1}render();return}catch(er){toast(er.message,1);return}}}
  dflt()};
/* تحميل باقي المتبرعين على دفعات حتى تظهر القائمة كاملة عند اختيار «الكل» (التحميل الأول مقصوص عند DON_LIST_CAP_) */
let ldBusy=false;
const dsLoadAll=async()=>{const N=DN();if(!N.donorsTruncated||N._all||ldBusy)return;ldBusy=true;
  try{let off=0;while(off>=0){const r=await api('donSearch',{all:true,offset:off,limit:2000});dsMerge(r.donors||[]);off=(r.next==null?-1:r.next);if(view==='d_donors')dcnt()}
    N._all=1;if(view==='d_donors'){dsave();render()}}
  catch(er){toast(er.message,1)}finally{ldBusy=false}};
/* خانة البحث الواحدة: تصفية فورية على المحمَّل + بحث في الخادم (كل المتبرعين) إن كانت القائمة لم تكتمل بعد */
let dsT=0,dsSeq=0;
const dsrv=async()=>{const N=DN();if(view!=='d_donors'||!N.donorsTruncated||N._all)return;const qi=$('#v .tb input'),q=(qi?qi.value:'').trim();if(q.length<2)return;
  const my=++dsSeq;try{const r=await api('donSearch',{q,limit:100});if(my!==dsSeq||view!=='d_donors')return;const n0=N.donors.length;dsMerge(r.donors||[]);
    if(N.donors.length!==n0){dsave();DD.focus=document.activeElement===qi;render()}}catch(er){toast(er.message,1)}};
document.addEventListener('input',e=>{const t=e.target;if(view!=='d_donors'||!t||t.tagName!=='INPUT'||!t.closest||!t.closest('#v .tb'))return;clearTimeout(dsT);dsT=setTimeout(dsrv,450)});
document.addEventListener('keydown',e=>{const t=e.target;if(e.key!=='Enter'||view!=='d_donors'||!t||t.tagName!=='INPUT'||!t.closest||!t.closest('#v .tb'))return;e.preventDefault();clearTimeout(dsT);dsrv()});
window.dsa=e=>{$$('#v tbody tr:not([hidden]) .dsel').forEach(c=>c.checked=e.checked)};
A.dmv=()=>{const picked=$$('#v .dsel:checked').map(c=>c.value),L=DN().donors,ow=DN().owners||[];
  const cnt=k=>k==='__none'?L.filter(x=>!x.owner).length:L.filter(x=>x.owner===k).length;
  mdl('نقل متبرعين لموظف مسؤول',`<p class="mu full">اختر المتبرعين من الجدول (خانات الاختيار) أو انقل كل متبرعي موظف دفعة واحدة. المتبرع المنقول يُصبح خاصًا بالموظف الجديد.</p>`+sel('المتبرعون المراد نقلهم','src',[['sel','المحدّدون في الجدول ('+picked.length+')'],['__none','كل المتبرعين بدون مسؤول ('+cnt('__none')+')']].concat(ow.map(o=>[o.u,'كل متبرعي '+o.n+' ('+cnt(o.u)+')'])),picked.length?'sel':'__none','full')+sel('إلى الموظف','to',[['','بدون مسؤول (يراه الجميع)']].concat(ow.map(o=>[o.u,o.n])),'','full'),
  async()=>{const o=rd();const d={to:o.to};if(o.src==='sel'){if(!picked.length){toast('حدّد متبرعين من الجدول أولًا',1);return false}d.ids=picked}else d.from=o.src;if(!confirm('نقل المتبرعين إلى '+((ow.find(z=>z.u===o.to)||{}).n||'بدون مسؤول')+'؟'))return false;const j=await run('assignDonors',d,'تم النقل');return j!==false})};
A.ddm=async()=>{const ids=$$('#v .dsel:checked').map(c=>c.value);if(!ids.length){toast('حدّد متبرعين من الجدول أولًا',1);return}
  if(!confirm('حذف '+ids.length+' متبرع نهائيًا؟\nالمتبرعون الذين عليهم تبرعات أو التزامات أو تواصل لن يُحذفوا.'))return;
  try{const j=await api('delDonors',{ids});await load(1);toast('تم حذف '+j.n+' متبرع'+(j.skipped?' — تخطّينا '+j.skipped+' عليهم حركات':''))}catch(e){toast(e.message,1)}};
const canEd=x=>isM()||!x.owner||x.owner===(D.user||{}).username;
/* آخر تواصل / التواصل القادم لكل متبرع (من سجل التواصل) */
const commMap=()=>{const m={},t=today();DN().comms.forEach(c=>{const o=m[c.donor]=m[c.donor]||{last:null,next:''};
  if(!o.last||c.date>o.last.date)o.last=c;if(c.fst==='مفتوحة'&&c.next&&(!o.next||c.next<o.next))o.next=c.next});
  Object.values(m).forEach(o=>{o.s=o.next?(o.next<t?'late':(o.next===t?'today':'soon')):''});return m};
const lastCell=o=>o&&o.last?`<b>${esc(o.last.date)}</b><div class="mu" style="font-size:11px">${esc(o.last.channel||'')}${o.last.outcome?' — '+esc(o.last.outcome):''}</div>`:'<span class="mu">لم يُتواصل</span>';
const nextCell=o=>!o||!o.next?'<span class="mu">—</span>':(o.s==='late'?`<span class="st" style="background:#b3261e;color:#fff">متأخر ${esc(o.next)}</span>`:(o.s==='today'?`<span class="st" style="background:#c77a00;color:#fff">اليوم</span>`:esc(o.next)));
const cmSel=()=>`<select id="dcf" onchange="dflt()" style="width:auto"><option value="">كل حالات التواصل</option><option value="late">متابعة متأخرة</option><option value="today">متابعة اليوم</option><option value="soon">لديه متابعة مفتوحة</option><option value="none">لم يُتواصل معه أبدًا</option></select>`;
V.d_donors=()=>{const L=DN().donors,CM=commMap(),OD=odMap();
  const rows=L.map(x=>{const cm=CM[x.id],cs=cm?(cm.s||'ok'):'none';return `<tr data-t="${esc(x.type)}" data-o="${esc(x.owner||'')}" data-d="${esc(x.owner?(OD[x.owner]||''):'')}" data-c="${cs}">${isM()?`<td><input type="checkbox" class="dsel" value="${esc(x.id)}"></td>`:''}<td><b>${esc(x.code)}</b></td><td>${esc(x.name)}${x.dnc?' <span class="st" title="لا يُتواصل معه">لا تتصل</span>':''}</td><td>${esc(x.type)}</td><td>${esc(x.phone)}</td><td>${esc(x.email)}</td><td>${esc(x.city)}</td><td>${x.owner?esc(x.ownerName||x.owner):'<span class="mu">—</span>'}</td><td>${x.n}</td><td>${f(x.total)}</td><td>${esc(x.last)||'—'}</td><td>${lastCell(cm)}</td><td>${nextCell(cm)}</td><td>${x.pledged?f(x.pledged):'—'}</td><td>${st(x.active?'نشط':'موقوف')}</td><td>${btn('dst',x.id,'كشف حساب','o')+(canW()?btn('ndn','d:'+x.id,'+ تبرع','g')+btn('ncm',x.id,'+ تواصل','o')+(canEd(x)?btn('nd',x.id,'تعديل','o'):''):'')+(isM()?btn('dd',x.id,'حذف','r'):'')}</td></tr>`}).join('');
  queueMicrotask(()=>{if(view!=='d_donors')return;const set=(id,v)=>{const e=$(id);if(e&&v)e.value=v};set('#dtf',DD.t);set('#dof',DD.o);set('#ddf',DD.dp);set('#dcf',DD.c);
    const qi=$('#v .tb input');if(qi){qi.placeholder='بحث في كل المتبرعين: اسم / كود / هاتف / بريد / مسؤول';qi.style.width='300px';if(DD.q)qi.value=DD.q;if(DD.focus){qi.focus();try{qi.setSelectionRange(qi.value.length,qi.value.length)}catch(e){}DD.focus=false}}
    dflt();dsLoadAll()});
  return head('المتبرعون',canW()?'nd':'','+ متبرع جديد','<span id="dstat" class="mu" style="font-size:12px"></span>'+typeSel()+ownSel()+deptSel()+cmSel()+(isM()?'<button class="b o" data-a="dmv">نقل متبرعين لموظف</button><button class="b r" data-a="ddm">حذف المحدّدين</button>':''))+`<div class="box"><table><thead><tr>${(isM()?['<input type="checkbox" id="dselall" onclick="dsa(this)" title="تحديد الظاهر">']:[]).concat(['الكود','الاسم','النوع','الهاتف','البريد','المدينة','المسؤول','عدد التبرعات','إجمالي التبرعات','آخر تبرع','آخر تواصل','التواصل القادم','التزامات قائمة','الحالة','إجراءات']).map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${rows||'<tr><td colspan="16" style="text-align:center;color:var(--m)">لا توجد بيانات</td></tr>'}</tbody></table></div>`};
const nphBox=x=>`<div class="full"><label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="nph"${x.noPhone?' checked':''} style="width:auto"> متبرع بدون رقم هاتف (يُكوَّد دون رقم؛ وإلا فرقم الهاتف إلزامي)</label></div>`;
dlg.addEventListener('change',e=>{if(e.target&&e.target.id==='nph'){const on=e.target.checked;$$('#m [name=phone],#m [name=phone2]').forEach(i=>{i.disabled=on;if(on)i.value=''})}});
const donorForm=x=>fld('الاسم (الشخص / الجهة)','name',x.name,'text','full')+sel('نوع المتبرع','type',opt(TYPES),x.type||'فرد')+fld('الشخص المسؤول (للجهات)','contact',x.contact)+fld('الهاتف','phone',x.phone,'tel')+fld('هاتف آخر','phone2',x.phone2,'tel')+nphBox(x)+fld('البريد الإلكتروني','email',x.email,'email')+fld('المدينة','city',x.city)+fld('العنوان','addr',x.addr,'text','full')+fld('الرقم القومي / السجل التجاري / الرقم الضريبي','idno',x.idno)+sel('وسيلة التواصل المفضلة','channel',[['','—']].concat(opt(PREF)),x.channel||'')+fld('وسوم (مثال: كبار، رمضان)','tags',x.tags)+fld('مصدر التعرف على المتبرع','source',x.source)+sel('عدم التواصل (لا يرغب في الاتصال به)','dnc',[['false','لا'],['true','نعم: لا تتواصل معه']],x.dnc?'true':'false')+(x.id?sel('الحالة','active',[['true','نشط'],['false','موقوف']],x.active===false?'false':'true'):'')+(isM()?sel('الموظف المسؤول عن المتبرع (للتواصل معه لاحقًا)','owner',[['','بدون مسؤول (يراه الجميع)']].concat((DN().owners||[]).map(o=>[o.u,o.n])),x.id?(x.owner||''):(D.user||{}).username,'full'):(x.id?(x.ownerName?`<p class="mu full">المسؤول عن المتبرع: ${esc(x.ownerName)}</p>`:''):'<p class="mu full">سيُسجَّل هذا المتبرع على حسابك، وتتابعه أنت للتواصل لاحقًا.</p>'))+fld('ملاحظات','note',x.note,'ta','full');
A.nd=i=>{const x=i?Object.assign({},donorO(i)):{};
  mdl(i?'تعديل متبرع':'متبرع جديد',donorForm(x),async()=>{
    const o={...rd(),id:i||undefined,ver:x.ver,noPhone:!!($('#nph')||{}).checked};
    try{await api('saveDonor',o)}catch(e){
      if(/بنفس الاسم/.test(e.message)&&confirm(e.message+'\nهل هو متبرع مختلف فعلًا؟ اضغط موافق للحفظ رغم التشابه.')){try{await api('saveDonor',{...o,allowDup:true})}catch(e2){toast(e2.message,1);return false}}
      else{toast(e.message,1);return false}}
    await load(1);toast('تم حفظ المتبرع');return true})};
A.dd=i=>{if(!confirm('حذف المتبرع '+donorN(i)+'؟'))return;run('delDonor',{id:i,ver:donorO(i).ver},'تم حذف المتبرع')};

/* ---------- كشف حساب المتبرع ---------- */
let stmt=null;
const stmtHtml=(j,forPrint)=>{const d=j.donor;
  const P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';
  const dn=j.donations.map(x=>[esc(x.no),esc(x.date),esc(x.kind),f(x.amount),esc(x.kind==='عيني'?'عيني':x.method),esc(x.rcpt||'—'),esc(cmpN(x.campaign)),esc(pjl(x.proj)||'—'),esc(x.st)]);
  const pl=j.pledges.map(p=>[esc(p.no),esc(p.date),f(p.amount),f(p.coll),f(Math.max(0,p.amount-p.coll)),esc(p.due||'—'),esc(p.st)]);
  const cm=j.comms.map(c=>[esc(c.date),esc(c.channel),esc(c.outcome),esc(c.subject),esc(c.next||'—'),esc(c.fst||'')]);
  const head1=['الرقم','التاريخ','النوع','المبلغ','الوسيلة','الإيصال','الحملة','المشروع','الحالة'];
  const t1=tbl(head1,dn);
  return (forPrint?printHead('كشف حساب متبرع'):'')+`<div class="g"><div>${P('الكود',d.code)+P('الاسم',d.name)+P('النوع',d.type)}</div><div>${P('الهاتف',d.phone)+P('البريد',d.email)+P('المدينة',d.city)}</div><div>${P('الفترة',(j.from||j.to)?('من '+(j.from||'البداية')+' إلى '+(j.to||'اليوم')):'كل الفترات')+P('عدد التبرعات المعتمدة',String(j.count))+P('إجمالي التبرعات المعتمدة',f(j.total)+' ج.م')}</div><div>${P('بانتظار الاعتماد (في الفترة)',j.pendingCount?j.pendingCount+' بمبلغ '+f(j.pendingTotal)+' ج.م':'')+P('أول تبرع في الفترة',j.first)+P('آخر تبرع في الفترة',j.last)+((j.from||j.to)?P('إجمالي كل الفترات',f(j.totalAll)+' ج.م ('+j.countAll+' تبرع)'):'')}</div></div><h4>التبرعات</h4>${t1}<h4>الالتزامات</h4>${tbl(['الرقم','التاريخ','المبلغ','المحصَّل','المتبقي','الاستحقاق','الحالة'],pl)}`+(forPrint?'':`<h4>سجل التواصل</h4>${tbl(['التاريخ','الوسيلة','النتيجة','الموضوع','المتابعة','حالتها'],cm)}`)+(forPrint?printFoot():'')};
let stmtId='',stmtP={from:'',to:''};
const stmtShow=async()=>{const j=await api('donorStmt',{id:stmtId,from:stmtP.from,to:stmtP.to});stmt=j;const b=document.querySelector('#stbody');if(b)b.innerHTML=stmtHtml(j,false)};
A.dst=async i=>{stmtId=i;const y=today().slice(0,4);stmtP={from:y+'-01-01',to:today()};
  try{const j=await api('donorStmt',{id:i,from:stmtP.from,to:stmtP.to});stmt=j;
  mdl('كشف حساب: '+j.donor.name,`<div class="full db" id="stf" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">${fld('من تاريخ','sfrom',stmtP.from,'date')}${fld('إلى تاريخ','sto',stmtP.to,'date')}<button type="button" class="b" data-a="dstf">عرض الفترة</button><button type="button" class="b o" data-a="dstm" data-i="m">هذا الشهر</button><button type="button" class="b o" data-a="dstm" data-i="y">هذه السنة</button><button type="button" class="b o" data-a="dstm" data-i="a">كل الفترات</button></div><div class="full" id="stbody" style="overflow-x:auto">${stmtHtml(j,false)}</div><div class="full"><button class="b g" data-a="dstp" data-i="">طباعة</button> <button class="b g" data-a="dstx" data-i="">Excel</button> ${HR.box()}</div>`,null)}catch(e){toast(e.message,1)}};
A.dstf=async()=>{try{stmtP={from:($('#m [name=sfrom]')||{}).value||'',to:($('#m [name=sto]')||{}).value||''};await stmtShow()}catch(e){toast(e.message,1)}};
A.dstm=async i=>{const t=today();stmtP=i==='m'?{from:t.slice(0,8)+'01',to:t}:i==='y'?{from:t.slice(0,4)+'-01-01',to:t}:{from:'',to:''};
  const a=$('#m [name=sfrom]'),b=$('#m [name=sto]');if(a)a.value=stmtP.from;if(b)b.value=stmtP.to;try{await stmtShow()}catch(e){toast(e.message,1)}};
const stmtFetch=async()=>HR.on()?await api('donorStmt',{id:stmtId,from:stmtP.from,to:stmtP.to,hideRev:true}):stmt;
A.dstp=async()=>{if(!stmt)return;try{const j=await stmtFetch();docOut(stmtHtml(j,true),'كشف حساب '+j.donor.name)}catch(e){toast(e.message,1)}};
A.dstx=async()=>{if(!stmt)return;try{const j=await stmtFetch();docOut(stmtHtml(j,true),'كشف حساب '+j.donor.name,1)}catch(e){toast(e.message,1)}};

/* ---------- التبرعات ---------- */
const dbadge=x=>x==='معتمد'?'<span class="st" style="background:#dff3e6">معتمد</span>':x==='ملغي'?'<span class="st" style="background:#f6dede">ملغي</span>':st(x);
const finB=x=>x.kind==='عيني'||x.st!=='معتمد'?'—':x.fin==='بانتظار'?'<span class="st" style="background:#fff3cd">بانتظار الحسابات</span>':x.fin==='مؤكد'?'<span class="st" style="background:#dff3e6">مؤكد '+esc(x.fdate)+'</span>':'—';
const chN=i=>{const c=DN().channels.find(c=>c.id==i);return c?c.name:'—'};
/* حالة شاشة التبرعات: تبقى بعد الحفظ وإعادة الرسم (الفلاتر والتحديد)، وتُعاد للافتراضي عند دخول الشاشة من جديد */
const DF={st:'مسودة',dept:'',chn:'',q:''},DSEL=new Set(),CF={st:'مفتوحة',user:''};
{const o=window.render;window.render=function(){const pv=window.__dv;window.__dv=view;
  if(view==='d_don'&&pv!=='d_don'){DF.st='مسودة';DF.dept='';DF.chn='';DF.q='';DSEL.clear()}
  if(view==='d_donors'&&pv!=='d_donors'){DD.q='';DD.t='';DD.o='';DD.dp='';DD.c='';DD.focus=false}
  if(view==='d_com'&&pv!=='d_com'){CF.st='مفتوحة';CF.user=''}
  return o.apply(this,arguments)}}
V.d_don=()=>{const all=DN().donations,me=D.user.username;
  const canAp=x=>x.st==='مسودة'&&isM()&&(x.by!==me||dr()==='admin'||D.user.role==='admin');
  DSEL.forEach(id=>{const x=all.find(z=>z.id===id);if(!(x&&canAp(x)))DSEL.delete(id)}); // ما اعتُمد/حُذف يخرج من التحديد
  const L=all.filter(x=>!DF.st||x.st===DF.st);
  const rows=L.map(x=>{let b=btn('vdn',x.id,'عرض','o');
    if(x.st==='معتمد')b+=btn('rcp',x.id,'إيصال','g')+btn('rcpx',x.id,'Excel','g');
    if(['مسودة','مرفوض'].includes(x.st)&&canW()&&(isM()||x.by===me))b+=btn('ndn',x.id,x.st==='مرفوض'?'تعديل وإعادة إرسال':'تعديل','o')+btn('ddn',x.id,'حذف','r');
    if(canAp(x))b+=btn('apd',x.id,'اعتماد','g')+btn('rjd',x.id,'رفض','r');
    if(x.st==='معتمد'&&isM())b+=btn('cnd',x.id,'إلغاء','r');
    const ap=canAp(x),cn=x.kind==='عيني'?'':chN(x.chn);
    return `<tr data-s="${esc(x.st)}" data-d="${esc(nz(dpl(x.dept)))}" data-c="${esc(nz(cn))}">${isM()?`<td>${ap?`<input type="checkbox" class="dap" value="${esc(x.id)}" data-g="${esc(x.grp||'')}"${DSEL.has(x.id)?' checked':''} onchange="dapc(this)" title="تحديد للاعتماد">`:''}</td>`:''}<td>${esc(x.no)}${x.grp?' '+st('مقسّم'):''}</td><td>${esc(x.date)}</td><td>${esc(donorN(x.donor))}</td><td>${esc(x.kind)}${x.kind==='عيني'?'':' · '+esc(x.method)}</td><td>${x.kind==='عيني'?'—':esc(chN(x.chn))}</td><td>${f(x.amount)}</td><td>${esc(cmpN(x.campaign))}</td><td>${[x.event,x.convoy].filter(Boolean).map(evN).map(esc).join(' / ')||'—'}</td><td>${esc(pjl(x.proj))||'—'}</td><td>${esc(x.byName||'—')}</td><td>${esc(x.rcpt)||'—'}</td><td>${dbadge(x.st)}</td><td>${finB(x)}</td><td>${b}</td></tr>`}).join('');
  const so=(v,l)=>`<option value="${v}"${DF.st===v?' selected':''}>${l||v}</option>`;
  const depts=(D.depts||[]).filter(d=>d.name),chs=DN().channels||[],so2=(cur,v,l)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l||v)}</option>`;
  const sf=`<select id="dsf" onchange="dsst(this.value)" style="width:auto" title="الحالة">${so('','كل الحالات')}${so('مسودة')}${so('معتمد')}${so('مرفوض')}${so('ملغي')}</select>`
   +`<select id="ddpf" onchange="dsflt()" style="width:auto" title="الموظفون التابعون لهذه الإدارة">${so2(DF.dept,'','كل الإدارات')}${depts.map(d=>so2(DF.dept,d.name)).join('')}${so2(DF.dept,'__none','بدون إدارة')}</select>`
   +`<select id="dchf" onchange="dsflt()" style="width:auto" title="قناة التحصيل">${so2(DF.chn,'','كل القنوات')}${chs.map(c=>so2(DF.chn,c.name)).join('')}</select>`;
  const empty=DF.st==='مسودة'?'لا توجد تبرعات مسودة بانتظار الاعتماد — اختر «كل الحالات» لعرض باقي التبرعات':'لا توجد بيانات';
  queueMicrotask(()=>{if(view==='d_don')dsflt(1)}); // يطبّق البحث/الإدارة/القناة المحفوظة بعد الرسم
  return head('التبرعات',canW()?'ndn':'','+ تسجيل تبرع',sf+(isM()?'<button type="button" class="b g" data-a="dapm" id="dapmb" disabled>اعتماد المحدّدين (0)</button><button type="button" class="b r" data-a="dapr" id="daprb" disabled>رفض المحدّدين (0)</button>':''))+`<div class="box"><table><thead><tr>${(isM()?['<input type="checkbox" id="dapall" onclick="dapa(this)" title="تحديد كل المسودات الظاهرة">']:[]).concat(['الرقم','التاريخ','المتبرع','النوع / الوسيلة','قناة التحصيل','المبلغ (ج.م)','الحملة','الحدث','المشروع','الموظف المسجِّل','الإيصال','الحالة','التأكيد المالي','إجراءات']).map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${rows||'<tr><td colspan="'+(isM()?15:14)+'" style="text-align:center;color:var(--m)">'+empty+'</td></tr>'}</tbody></table></div><p class="mu">يظهر آخر 500 تبرع معتمد/ملغي وكل المسودات. التبرع العيني يُقيَّد بقيمته التقديرية.</p>`};
window.dsst=v=>{DF.st=v;render()}; // تغيير الحالة يعيد بناء القائمة (DOM أخف)؛ الإدارة والقناة والبحث تُخفي/تُظهر الصفوف فقط
window.dsflt=init=>{const qi=$('#v input[placeholder="بحث..."]');
  if(init===1){if(qi&&DF.q&&!qi.value)qi.value=DF.q}
  else{DF.q=qi?qi.value:'';DF.dept=($('#ddpf')||{}).value||'';DF.chn=($('#dchf')||{}).value||''}
  const q=nz(DF.q),d=DF.dept==='__none'?'__none':nz(DF.dept),c=nz(DF.chn);
  $$('#v tbody tr').forEach(r=>{if(r.cells.length<3)return;const rd=r.dataset.d||'';
    r.hidden=!((!q||nz(r.textContent+' '+rd).includes(q))&&(!d||(d==='__none'?rd==='':rd===d))&&(!c||(r.dataset.c||'')===c))});dapUp()};
/* ===== اعتماد جماعي لعدة تبرعات (خانات الاختيار) ===== */
const dapVis=()=>$$('#v tbody tr:not([hidden]) .dap').filter(c=>c.closest('tr').dataset.dr!=='1');
const dapSel=()=>dapVis().filter(c=>c.checked);
const dapUp=()=>{const n=dapSel().length,b=$('#dapmb'),rb=$('#daprb');if(rb){rb.disabled=!n;rb.textContent='رفض المحدّدين ('+n+')'}if(b){b.disabled=!n;b.textContent='اعتماد المحدّدين ('+n+')'}
  const all=$('#dapall');if(all){const v=dapVis();all.checked=!!v.length&&v.every(c=>c.checked);all.indeterminate=!all.checked&&v.some(c=>c.checked)}};
window.dapa=e=>{dapVis().forEach(c=>{c.checked=e.checked;e.checked?DSEL.add(c.value):DSEL.delete(c.value)});dapUp()};
window.dapc=c=>{if(c){const grp=c.dataset.g?$$('#v .dap').filter(z=>z.dataset.g===c.dataset.g):[c];grp.forEach(z=>{z.checked=c.checked;c.checked?DSEL.add(z.value):DSEL.delete(z.value)})}dapUp()}; // أجزاء التبرع المقسّم تُحدَّد معًا
document.addEventListener('change',e=>{if(e.target&&e.target.closest&&e.target.closest('.dfb'))setTimeout(dapUp,0)});
document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('.dfx'))setTimeout(dapUp,0)});
const apRes=res=>{const ok=res.filter(r=>r.ok),bad=res.filter(r=>!r.ok);
  mdl('نتيجة الاعتماد الجماعي',`<div class="full"><b style="color:var(--p)">${ok.length} تم اعتماده</b>${bad.length?` · <b style="color:#b3261e">${bad.length} تعذّر اعتماده</b>`:''}</div>`
    +(bad.length?`<div class="full" style="overflow-x:auto">${tbl(['الرقم','السبب'],bad.map(r=>[esc(r.no||'—'),esc(r.msg)]))}</div>`:'')
    +(ok.some(r=>r.pending)?`<div class="full mu">بعض التبرعات انتقلت لمرحلة اعتماد تالية (سلسلة الاعتماد) ولم تُعتمد نهائيًا بعد.</div>`:''),null)};
A.dapm=()=>{const sel=dapSel();if(!sel.length){toast('حدّد تبرعًا واحدًا على الأقل',1);return}
  const items=sel.map(c=>DN().donations.find(z=>z.id===c.value)).filter(Boolean);
  const tot=r2(items.reduce((s,x)=>s+(+x.amount||0),0));
  mdl('اعتماد '+items.length+' تبرع',`<div class="full">عدد التبرعات: <b>${items.length}</b> — الإجمالي: <b>${f(tot)}</b> ج.م</div><div class="full" style="max-height:220px;overflow:auto">${tbl(['الرقم','المتبرع','المشروع','المبلغ'],items.map(x=>[esc(x.no),esc(donorN(x.donor)),esc(pjl(x.proj))||'—',f(x.amount)]))}</div><div class="full mu">يُعتمد كل تبرع مستقلًا بنفس قواعد الاعتماد الفردي (صلاحياتك وحدّ اعتمادك وفصل المهام وسلسلة الاعتماد)، وما يتعذّر اعتماده يظهر في تقرير النتيجة مع السبب دون أن يمنع الباقي. بعد الاعتماد يصدر لكل تبرع رقم إيصال ولا يمكن تعديله.</div>`,
  async()=>{const res=[];let err='';
    try{for(let i=0;i<items.length;i+=5){toast('جاري الاعتماد '+Math.min(i+5,items.length)+' / '+items.length+' …');
      const j=await api('approveDonations',{items:items.slice(i,i+5).map(x=>({id:x.id,ver:x.ver}))});(j.res||[]).forEach(r=>res.push(r))}}
    catch(e){err=e.message}
    try{await load(1)}catch(e){}
    if(err)toast('توقّف الاعتماد: '+err+' — راجع الحالة وأعد المحاولة للمتبقي',1);else toast('انتهى الاعتماد الجماعي');
    if(res.length)setTimeout(()=>apRes(res),60);
    return true},'اعتماد الكل')};
// ===== بحث المتبرعين في الخادم (للقوائم الكبيرة) =====
const dsMerge=L=>{const m=DN().donors;L.forEach(x=>{const i=m.findIndex(z=>z.id===x.id);if(i<0)m.push(x);else m[i]=x});return L};
const dsBox=()=>DN().donorsTruncated?'<div class="full"><input id="dsq" type="search" placeholder="ابحث عن متبرع غير ظاهر في القائمة (اسم / هاتف / كود) ثم Enter" style="width:100%"></div>':'';
document.addEventListener('keydown',async e=>{
  if(e.key!=='Enter'||!e.target||e.target.id!=='dsq')return;e.preventDefault();e.stopPropagation();
  const q=e.target.value.trim();if(q.length<2){toast('اكتب حرفين على الأقل',1);return}
  try{const r=await api('donSearch',{q,limit:30});const L=dsMerge(r.donors||[]);
    const s=$('#m select[name=donor]');
    if(s){const cur=s.value;s.innerHTML=donOpts(cur).map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('');
      if(L.length===1)s.value=L[0].id;else s.value=cur;s.dispatchEvent(new Event('change',{bubbles:true}));toast(L.length?('تم العثور على '+L.length+' — اختر من القائمة'):'لا توجد نتائج',!L.length)}
    else{toast(L.length?('تم العثور على '+L.length):'لا توجد نتائج',!L.length);if(L.length)render()}
  }catch(er){toast(er.message,1)}
},true);
const donOpts=cur=>[['','— اختر المتبرع —']].concat(DN().donors.filter(d=>d.active||d.id==cur).map(d=>[d.id,d.code+' · '+d.name]));
const pledgeOpts=(donor,cur)=>[['','— بدون التزام —']].concat(DN().pledges.filter(p=>p.st==='قائم'&&(p.donor==donor)||p.id==cur).map(p=>[p.id,p.no+' — المتبقي '+f(Math.max(0,p.amount-p.coll-(p.id==cur?0:(p.held||0))))]));
const iopt=s=>'<option value="">— الصنف —</option>'+DN().items.map(i=>`<option value="${esc(i.id)}"${i.id==s?' selected':''}>${esc(i.code+' · '+i.name+' ('+i.unit+')')}</option>`).join('');
const CHS=x=>DN().channels.filter(c=>c.active||c.id==(x||{}).chn);
const irow=(x={})=>`<tr><td><select class="ik" style="min-width:200px">${iopt(x.item)}</select></td><td><input class="iq" type="number" min="0" step="any" value="${x.q||''}" style="width:90px" oninput="dcalc()"></td><td><input class="ic" type="number" min="0" step="any" value="${x.c||''}" style="width:110px" oninput="dcalc()"></td><td class="it">0.00</td><td><button type="button" class="b s r" onclick="this.closest('tr').remove();dcalc()">✕</button></td></tr>`;
window.dadd=()=>{$('#dl tbody').insertAdjacentHTML('beforeend',irow());dcalc()};
window.dcalc=()=>{let t=0;$$('#dl tbody tr').forEach(r=>{const v=r2((+r.querySelector('.iq').value||0)*(+r.querySelector('.ic').value||0));r.querySelector('.it').textContent=f(v);t+=v});const e=$('#dlt');if(e)e.innerHTML='إجمالي القيمة التقديرية: <b>'+f(r2(t))+'</b> ج.م'};
/* ===== تسجيل التبرع على أكثر من مشروع (صف لكل مشروع مثل الفواتير) ===== */
const pjOpt=(cur,L,hasEv)=>'<option value="">— '+(hasEv?'اختر مشروع الحدث/القافلة':'اختر المشروع')+' —</option>'+L.map(x=>`<option value="${esc(x.code)}"${x.code===cur?' selected':''}>${esc(x.code+' · '+x.name)}</option>`).join('');
const pjList=(cur,evs)=>{const all=PJ().filter(x=>x.active||x.code===cur);return evs&&evs.length?all.filter(x=>x.code===cur||evs.every(e=>(e.projs||[]).includes(x.code))):all};
const pjEvs=()=>['event','convoy'].map(n=>evO(($('#m [name='+n+']')||{}).value)).filter(e=>e.id);
const pjRow=(p,evs)=>{p=p||{};const cur=(pjf(p.proj)||{}).code||p.proj||'';return `<tr class="pjr"><td><select class="pjp" style="min-width:220px">${pjOpt(cur,pjList(cur,evs),evs&&evs.length)}</select></td><td><input class="pja" type="number" min="0" step="any" value="${p.amount||''}" style="width:130px"></td><td><button type="button" class="b s r" data-a="pjx">حذف</button></td></tr>`};
const pjBlock=(x,evs,edit)=>`<div class="dcash full"${x.kind==='عيني'?' hidden':''}><label>المشروعات والمبالغ (إلزامي — كل التبرعات على مشروع مكوَّد${edit?'':'؛ أضف صفًا لكل مشروع لتقسيم التبرع'})</label><div style="overflow-x:auto"><table id="pjt"><thead><tr><th>المشروع</th><th>المبلغ (ج.م)</th><th></th></tr></thead><tbody id="pjb">${(x.projs&&x.projs.length?x.projs:[{proj:x.proj,amount:x.kind==='عيني'?'':x.amount}]).map(p=>pjRow(p,evs)).join('')}</tbody><tfoot><tr><td><b>إجمالي التبرع</b></td><td><b id="pjtot">0.00</b></td><td></td></tr></tfoot></table></div>${edit?'':'<button type="button" class="b o s" data-a="pjadd">+ إضافة مشروع</button>'}</div>`;
const pjRead=()=>$$('#pjb .pjr').map(r=>({proj:r.querySelector('.pjp').value,amount:r.querySelector('.pja').value}));
window.pjTot=()=>{const t=$$('#pjb .pja').reduce((s,i)=>s+(+i.value||0),0),e=$('#pjtot');if(e)e.textContent=f(r2(t))};
A.pjadd=()=>{const b=$('#pjb');if(!b)return;b.insertAdjacentHTML('beforeend',pjRow({},pjEvs()));pjTot()};
A.pjx=()=>{const e=event&&event.target&&event.target.closest('.pjr');if(!e)return;if($$('#pjb .pjr').length<2){e.querySelector('.pjp').value='';e.querySelector('.pja').value=''}else e.remove();pjTot()};
dlg.addEventListener('input',e=>{if(e.target&&e.target.closest&&e.target.closest('#pjb'))pjTot()});
function dnToggle(){const k=($('#m [name=kind]')||{}).value,inK=k==='عيني';
  $$('#m .dcash').forEach(e=>e.hidden=inK);$$('#m .dink').forEach(e=>e.hidden=!inK);
  const cv=($('#m [name=chn]')||{}).value,ch=DN().channels.find(c=>c.id==cv);
  const m=ch?ch.method:($('#m [name=method]')||{}).value;const rr=$('#m .dref');if(rr)rr.hidden=inK||!(ch?ch.refReq:['شيك','تحويل بنكي','بطاقة','محفظة إلكترونية'].includes(m))}
function dnPledge(){const p=$('#m [name=pledge]');if(!p)return;const cur=p.value,d=($('#m [name=donor]')||{}).value;p.innerHTML=pledgeOpts(d,cur).map(o=>`<option value="${esc(o[0])}"${o[0]==cur?' selected':''}>${esc(o[1])}</option>`).join('')}
function evSync(){const evs=['event','convoy'].map(n=>evO(($('#m [name='+n+']')||{}).value)).filter(e=>e.id),p=$('#m [name=proj]'),c=$('#m [name=campaign]');
  const ev={id:evs.length?evs[0].id:'',campaign:(evs.find(e=>e.campaign)||{}).campaign};
  if(c&&ev.campaign)c.value=ev.campaign;
  if(p&&p.tagName==='SELECT'){const cur=p.value,all=PJ().filter(x=>x.active||x.code===cur),L=evs.length?all.filter(x=>evs.every(e=>(e.projs||[]).includes(x.code))):all;
    p.innerHTML='<option value="">— '+(evs.length?'اختر مشروع الحدث/القافلة':'بدون مشروع')+' —</option>'+L.map(x=>`<option value="${esc(x.code)}"${x.code===cur?' selected':''}>${esc(x.code+' · '+x.name)}</option>`).join('');
    if(cur&&!L.some(x=>x.code===cur))p.value=''}
  $$('#m .pjp').forEach(s=>{const cur=s.value;s.innerHTML=pjOpt(cur,pjList(cur,evs),evs.length);if(cur&&!pjList(cur,evs).some(x=>x.code===cur))s.value=''})}
dlg.addEventListener('change',e=>{const n=e.target&&e.target.name;if(!$('#m .dnform'))return;
  if(n==='kind'||n==='method'||n==='chn')dnToggle();
  if(n==='donor')dnPledge();
  if(n==='event'||n==='convoy')evSync();
  if(n==='campaign'){const c=cmpO(e.target.value),p=$('#m [name=proj]');if(c.proj&&p&&!p.value)p.value=c.proj;if(c.proj){const r0=$$('#pjb .pjp').find(s=>!s.value);if(r0)r0.value=(pjf(c.proj)||{}).code||c.proj}}
  if(n==='pledge'){const pl=DN().pledges.find(z=>z.id==e.target.value);if(pl){const a=$('#m [name=amount]')||$('#pjb .pja');if(a&&!a.value){a.value=r2(Math.max(0,pl.amount-pl.coll-(pl.held||0)));pjTot()}const c=$('#m [name=campaign]');if(c&&!c.value&&pl.campaign)c.value=pl.campaign}}});
let ndnPre=null,ndnCtx='';
A.ndn=i=>{
  if(!DN().donors.length&&!ndnPre){toast('أضف متبرعًا أولًا (أو استخدم زر المتبرع الجديد من شاشة المتبرعين)',1);return}
  ndnCtx=i||'';
  let x={date:today(),kind:'نقدي',method:'نقدي',items:[]};
  if(i&&i.startsWith('d:'))x.donor=i.slice(2);else if(i)x=Object.assign({},DN().donations.find(z=>z.id==i));
  if(ndnPre){x=Object.assign({},x,ndnPre.f);ndnPre=null}
  const id=(i&&!i.startsWith('d:'))?i:'';
  const inK=x.kind==='عيني';
  const useRows=PJ().length>0,evs0=[x.event,x.convoy].map(evO).filter(e=>e.id);
  const body=`<div class="dnform full"></div>`+fld('التاريخ','date',x.date,'date')+dsBox()+sel('المتبرع','donor',donOpts(x.donor),x.donor||'','full')+(canW()?`<div class="full"><button type="button" class="b s g" data-a="qd" data-i="">+ متبرع جديد (غير مسجّل)</button></div>`:'')+sel('نوع التبرع','kind',[['نقدي','نقدي (مبلغ)'],['عيني','عيني (أصناف تدخل المخزن)']],x.kind)
   +`${useRows?'':`<div class="dcash"${inK?' hidden':''}>${fld('المبلغ (ج.م)','amount',x.kind==='نقدي'?x.amount:'','number')}</div>`}<div class="dcash"${inK?' hidden':''}>${CHS(x).length?sel('قناة التحصيل','chn',[['','— اختر القناة —']].concat(CHS(x).map(c=>[c.id,c.name+' ('+c.method+')'])),x.chn||''):sel('وسيلة الدفع','method',opt(METHODS),x.method||'نقدي')}</div><div class="dcash dref" hidden>${fld('رقم الشيك / مرجع التحويل','ref',x.ref)}</div>`
   +`<div class="dink full"${inK?'':' hidden'}>${sel('المخزن المستلِم','wh',[['','— اختر المخزن —']].concat(DN().whs.map(w=>[w.id,w.name])),x.wh||'')}<label>الأصناف المتبرَّع بها (القيمة التقديرية لوحدة الصنف)</label><div style="overflow-x:auto"><table id="dl"><thead><tr><th>الصنف</th><th>الكمية</th><th>القيمة التقديرية للوحدة</th><th>الإجمالي</th><th></th></tr></thead><tbody>${(x.items||[]).map(irow).join('')}</tbody></table></div><button type="button" class="b s o" onclick="dadd()">+ صنف</button><div id="dlt" class="mu"></div></div>`
   +evcSel(x)+sel('الحملة / المبادرة','campaign',[['','— بدون —']].concat(DN().campaigns.filter(c=>c.st!=='مغلق'||c.id==x.campaign).map(c=>[c.id,c.code+' · '+c.name])),x.campaign||'')+(useRows?pjBlock(x,evs0,!!id)+`<div class="dink full"${inK?'':' hidden'}>${psl('المشروع (إلزامي — كل التبرعات على مشروع مكوَّد)',x.proj||'','','— اختر المشروع —')}</div>`:psl('المشروع (إلزامي — كل التبرعات على مشروع مكوَّد)',x.proj||'','','— اختر المشروع —'))+sel('سداد التزام قائم','pledge',pledgeOpts(x.donor,x.pledge),x.pledge||'')+fld('ملاحظات','note',x.note,'ta','full');
  mdl(id?'تعديل تبرع '+x.no:'تسجيل تبرع',body,async()=>{
    const o={...rd(),id:id||undefined,ver:x.ver};
    if(o.kind==='عيني'){o.items=$$('#dl tbody tr').map(r=>({item:r.querySelector('.ik').value,q:+r.querySelector('.iq').value||0,c:r.querySelector('.ic').value})).filter(l=>l.item||l.q||l.c);delete o.amount;delete o.method}
    else if($('#pjb')){const rows=pjRead();
      if(!rows.length){toast('أضف مشروعًا واحدًا على الأقل',1);return false}
      if(rows.some(r=>!r.proj)){toast('اختر المشروع في كل الصفوف',1);return false}
      if(rows.some(r=>!(+r.amount>0))){toast('أدخل مبلغًا أكبر من صفر في كل صف',1);return false}
      const ps=rows.map(r=>r.proj);if(new Set(ps).size<ps.length){toast('المشروع مكرر في الصفوف؛ اجمع مبلغه في صف واحد',1);return false}
      o.proj=rows[0].proj;o.amount=r2(rows.reduce((s,r)=>s+(+r.amount),0));if(!id&&rows.length>1)o.projs=rows.map(r=>({proj:r.proj,amount:+r.amount}))}
    const d=donorO(o.donor);if(d.dnc&&!confirm('هذا المتبرع محدد بأنه لا يرغب في التواصل. متابعة التسجيل؟'))return false;
    return run('saveDonation',o,o.projs?('تم حفظ التبرع كمسودة مقسّمة على '+o.projs.length+' مشروع'):'تم حفظ التبرع كمسودة').then(r=>r!==false)});
  dnToggle();dcalc();pjTot();
  if(x.event||x.convoy){const p=$('#m [name=proj]'),keep=x.proj||'',kr=$$('#pjb .pjp').map(s=>s.value);evSync();if(p&&keep)p.value=keep;$$('#pjb .pjp').forEach((s,i)=>{if(kr[i])s.value=kr[i]})}
};
A.ddn=i=>{if(confirm('حذف مسودة التبرع؟'))run('delDonation',{id:i,ver:(DN().donations.find(z=>z.id==i)||{}).ver},'تم الحذف')};
A.vdn=i=>{const x=DN().donations.find(z=>z.id==i);if(!x)return;
  const it=(x.items||[]).map((l,n)=>{const m=DN().items.find(z=>z.id==l.item)||{};return [n+1,esc(m.name||'؟'),esc(m.unit||''),q3(l.q),f(l.c),f(r2(l.q*l.c))]});
  mdl('تبرع '+x.no,kv('الرقم',x.no)+kv('التاريخ',x.date)+kv('المتبرع',donorN(x.donor))+kv('النوع',x.kind==='عيني'?'عيني':'نقدي — '+x.method)+kv('المبلغ',f(x.amount)+' ج.م')+(x.ref?kv('المرجع',x.ref):'')+kv('الحملة',cmpN(x.campaign))+(x.event?kv('الحدث',evN(x.event)):'')+(x.convoy?kv('القافلة',evN(x.convoy)):'')+kv('المشروع',pjl(x.proj))+(x.grp?kv('تبرع مقسّم على مشاريع',DN().donations.filter(z=>z.grp===x.grp).map(z=>z.no+' — '+(pjl(z.proj)||'—')+' — '+f(z.amount)+' ج.م').join('  |  ')):'')+kv('الحالة',x.st)+(x.rcpt?kv('رقم الإيصال',x.rcpt):'')+kv('سجّله',x.byName)+(x.actBy?kv('آخر إجراء بواسطة',x.actBy):'')+(x.reason?kv(x.st==='مرفوض'?'سبب الرفض':'سبب الإلغاء',x.reason):'')+(x.note?`<div class="full"><label>ملاحظات</label>${esc(x.note)}</div>`:'')+(it.length?`<div class="full" style="overflow-x:auto">${tbl(['#','الصنف','الوحدة','الكمية','قيمة الوحدة','الإجمالي'],it)}</div>`:'')+attBox('DON',x.id),null)};
A.apd=i=>{const x=DN().donations.find(z=>z.id==i);if(!x)return;
  const fin=x.kind!=='عيني'&&D.acc&&D.acc.linked;
  mdl('اعتماد التبرع '+x.no,`<div class="full">المتبرع: <b>${esc(donorN(x.donor))}</b> — المبلغ: <b>${f(x.amount)}</b> ج.م${x.kind==='عيني'?' (عيني: يُدخل الأصناف المخزن ويُقيَّد بقيمته التقديرية)':''}</div><div class="full mu">بعد الاعتماد يُصدر رقم إيصال ولا يمكن تعديل التبرع، ويمكن إلغاؤه لاحقًا بسبب.${fin?' <b>القيد المحاسبي لا يُرحَّل الآن:</b> يظهر التبرع في مديول الحسابات (تحصيل التبرعات) ليؤكد المختص وصول المبلغ إلى الخزينة / البنك فيُرحَّل القيد.':''}${x.kind==='عيني'&&D.acc&&D.acc.linked?' يُرحَّل قيد المخزون والتبرعات العينية فورًا.':''}</div>`,()=>run('approveDonation',{id:i,ver:x.ver},'تم اعتماد التبرع وإصدار الإيصال').then(r=>r!==false))};
A.rjd=i=>{const x=DN().donations.find(z=>z.id==i);if(!x)return;
  mdl('رفض التبرع '+x.no,`<div class="full">المتبرع: <b>${esc(donorN(x.donor))}</b> — المبلغ: <b>${f(x.amount)}</b> ج.م</div><div class="full mu">يعود التبرع لمن سجّله مع السبب ليعدّله ويعيد إرساله للاعتماد أو يحذفه.</div>`+fld('سبب الرفض (إلزامي)','reason','','ta','full'),
   ()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب الرفض',1);return false}return run('rejectDonation',{id:i,ver:x.ver,reason:r},'تم رفض التبرع').then(z=>z!==false)},'تأكيد الرفض')};
A.dapr=()=>{const sel=dapSel();if(!sel.length){toast('حدّد تبرعًا واحدًا على الأقل',1);return}
  const items=sel.map(c=>DN().donations.find(z=>z.id===c.value)).filter(Boolean);
  mdl('رفض '+items.length+' تبرع',`<div class="full" style="max-height:200px;overflow:auto">${tbl(['الرقم','المتبرع','المبلغ'],items.map(x=>[esc(x.no),esc(donorN(x.donor)),f(x.amount)]))}</div><div class="full mu">يُرفض كل تبرع مستقلًا بنفس السبب، وما يتعذّر رفضه يظهر في النتيجة دون أن يمنع الباقي.</div>`+fld('سبب الرفض (إلزامي)','reason','','ta','full'),
   async()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب الرفض',1);return false}
     const res=[];let err='';
     try{for(let i=0;i<items.length;i+=5){const j=await api('rejectDonations',{reason:r,items:items.slice(i,i+5).map(x=>({id:x.id,ver:x.ver}))});(j.res||[]).forEach(z=>res.push(z))}}catch(e){err=e.message}
     try{await load(1)}catch(e){}
     if(err)toast('توقّف الرفض: '+err,1);else toast('تم الرفض');
     const bad=res.filter(z=>!z.ok);if(bad.length)setTimeout(()=>mdl('تعذّر رفض بعض التبرعات',`<div class="full" style="overflow-x:auto">${tbl(['الرقم','السبب'],bad.map(z=>[esc(z.no||'—'),esc(z.msg)]))}</div>`,null),60);
     return true},'تأكيد الرفض')};
A.cnd=i=>{const x=DN().donations.find(z=>z.id==i);
  mdl('إلغاء التبرع '+x.no,`<div class="full mu">يُلغى التبرع ويُعكس قيده المحاسبي${x.kind==='عيني'?' وتُخرَج الأصناف من المخزن (إن لم تتحرك بعده)':''}.</div>`+fld('سبب الإلغاء','reason','','ta','full'),()=>run('cancelDonation',{id:i,ver:x.ver,reason:rd().reason},'تم إلغاء التبرع').then(r=>r!==false),'إلغاء التبرع')};
/* متبرع جديد سريع من داخل نموذج التبرع (يعيد المستخدم لنموذج التبرع بنفس بياناته) */
A.qd=()=>{
  const o=rd(),f0={};['date','donor','kind','amount','method','ref','chn','event','convoy','campaign','proj','pledge','note','wh'].forEach(k=>{if(o[k]!==undefined)f0[k]=o[k]});
  f0.items=$$('#dl tbody tr').map(r=>({item:r.querySelector('.ik').value,q:r.querySelector('.iq').value,c:r.querySelector('.ic').value}));
  if($('#pjb'))f0.projs=pjRead();
  const ctx=ndnCtx,id=($('#m .dnform')&&ctx&&!String(ctx).startsWith('d:')&&!String(ctx).startsWith('p:'))?ctx:'';
  const back=()=>{ndnPre={f:f0};setTimeout(()=>A.ndn(ctx),0)};
  mdl('متبرع جديد (سريع)',fld('الاسم (الشخص / الجهة)','name','','text','full')+sel('نوع المتبرع','type',opt(TYPES),'فرد')+fld('الهاتف','phone','','tel')+nphBox({})+fld('البريد الإلكتروني','email','','email')+fld('المدينة','city')+`<div class="full"><button type="button" class="b s o" data-a="qdb" data-i="">↩ رجوع للتبرع دون حفظ</button></div>`,async()=>{
    const d={...rd(),noPhone:!!($('#nph')||{}).checked};let r;
    try{r=await api('saveDonor',d)}catch(e){
      if(/بنفس الاسم/.test(e.message)&&confirm(e.message+'\nهل هو متبرع مختلف فعلًا؟ اضغط موافق للحفظ رغم التشابه.')){try{r=await api('saveDonor',{...d,allowDup:true})}catch(e2){toast(e2.message,1);return false}}
      else{toast(e.message,1);return false}}
    f0.donor=r.id;back();toast('تم حفظ المتبرع '+r.code);return true},'حفظ والعودة للتبرع');
  A.qdb=()=>{dlg.close();back()};
};
/* إيصال التبرع */
const rcpHtml=x=>{const P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';const d=donorO(x.donor);
  const it=(x.items||[]).map((l,n)=>{const m=DN().items.find(z=>z.id==l.item)||{};return [n+1,esc(m.name||'؟'),esc(m.unit||''),q3(l.q),f(l.c),f(r2(l.q*l.c))]});
  return printHead('إيصال تبرع '+(x.kind==='عيني'?'عيني':'نقدي'))+`<div class="g"><div>${P('رقم الإيصال',x.rcpt)+P('رقم التبرع',x.no)+P('التاريخ',x.date)}</div><div>${P('المتبرع',d.name)+P('النوع',d.type)+P('الهاتف',d.phone)}</div><div>${P('وسيلة الدفع',x.kind==='عيني'?'تبرع عيني':x.method)+P('المرجع',x.ref)}</div><div>${P('الحملة / المبادرة',x.campaign?cmpN(x.campaign):'')+P('الحدث / القافلة',x.event?evN(x.event):'')+P('المشروع',pjl(x.proj))}</div></div>`
   +(it.length?tbl(['#','الصنف','الوحدة','الكمية','القيمة التقديرية للوحدة','الإجمالي'],it):'')
   +`<div class="tt"><p><span>المبلغ${x.kind==='عيني'?' (القيمة التقديرية)':''}</span><span>${f(x.amount)}</span></p></div><p><b>المبلغ كتابةً:</b> ${esc(tafq(x.amount))}</p>`+(x.note?`<p><b>ملاحظات:</b> ${esc(x.note)}</p>`:'')+(S().donNote?`<p>${esc(S().donNote)}</p>`:'')+`<div class="sg"><div>أعدّه<br>${esc(x.byName)}</div><div>أمين الصندوق / المعتمد<br>${esc(x.actBy||'')}</div><div>توقيع المتبرع</div></div>`+printFoot()};
A.rcp=(i,xl)=>{const x=DN().donations.find(z=>z.id==i);if(x)docOut(rcpHtml(x),'إيصال '+x.rcpt,xl)};
A.rcpx=i=>A.rcp(i,1);

/* ---------- الالتزامات ---------- */
V.d_plg=()=>{const L=DN().pledges;
  return head('الالتزامات (وعود التبرع)',canW()?'npl':'','+ التزام جديد')+`<div class="box">${tbl(['الرقم','التاريخ','المتبرع','الحملة','الحدث','المشروع','المبلغ','المحصَّل','المتبقي','الاستحقاق','الحالة','إجراءات'],L.map(p=>{const left=Math.max(0,r2(p.amount-p.coll)),late=p.st==='قائم'&&p.due&&p.due<today();
    return [esc(p.no),esc(p.date),esc(donorN(p.donor)),esc(cmpN(p.campaign)),[p.event,p.convoy].filter(Boolean).map(evN).map(esc).join(' / ')||'—',esc(pjl(p.proj))||'—',f(p.amount),f(p.coll),f(left),esc(p.due)||'—'+'',st(p.st)+(late?' <span class="st" style="background:#f6dede">متأخر</span>':''),
      (p.st==='قائم'&&canW()?btn('ndn','p:'+p.id,'تسجيل تحصيل','g')+btn('npl',p.id,'تعديل','o'):'')+(p.st==='قائم'&&isM()?btn('cpl',p.id,'شطب','r'):'')]}))}</div><p class="mu">الالتزام وعد غير مُقيَّد محاسبيًا؛ يُقيَّد الإيراد عند اعتماد التبرع الفعلي المرتبط به. الشطب بعد تحصيل جزئي يحوّله إلى «مشطوب».</p>`};
const _ndn=A.ndn;A.ndn=i=>{if(i&&String(i).startsWith('p:')){const p=DN().pledges.find(z=>z.id==String(i).slice(2));if(!p)return;_ndn('d:'+p.donor);setTimeout(()=>{const set=(n,v)=>{const e=$('#m [name='+n+']');if(e&&v)e.value=v};dnPledge();set('pledge',p.id);set('event',p.event);set('convoy',p.convoy);if(p.event||p.convoy)evSync();set('campaign',p.campaign);set('amount',r2(Math.max(0,p.amount-p.coll-(p.held||0))));const pj=$('#m [name=proj]');if(pj&&p.proj)pj.value=p.proj;const ra=$('#pjb .pja'),rp=$('#pjb .pjp');if(ra&&!ra.value){const v=r2(Math.max(0,p.amount-p.coll-(p.held||0)));if(v)ra.value=v}if(rp&&!rp.value&&p.proj)rp.value=(pjf(p.proj)||{}).code||p.proj;pjTot()},0);return}_ndn(i)};
A.npl=i=>{const x=i?Object.assign({},DN().pledges.find(z=>z.id==i)):{date:today()};
  mdl(i?'تعديل التزام '+x.no:'التزام جديد','<div class="dnform full"></div>'+fld('تاريخ الالتزام','date',x.date,'date')+dsBox()+sel('المتبرع','donor',donOpts(x.donor),x.donor||'','full')+fld('المبلغ الملتزم به (ج.م)','amount',x.amount,'number')+fld('تاريخ الاستحقاق','due',x.due||'','date')+evcSel(x)+sel('الحملة / المبادرة','campaign',[['','— بدون —']].concat(DN().campaigns.map(c=>[c.id,c.code+' · '+c.name])),x.campaign||'')+psl('المشروع',x.proj||'')+fld('ملاحظات','note',x.note,'ta','full'),
  ()=>run('savePledge',{...rd(),id:i||undefined,ver:x.ver},'تم حفظ الالتزام').then(r=>r!==false))};
A.cpl=i=>{const x=DN().pledges.find(z=>z.id==i);mdl('شطب الالتزام '+x.no,fld('سبب الشطب','reason','','ta','full'),()=>run('cancelPledge',{id:i,ver:x.ver,reason:rd().reason},'تم شطب الالتزام').then(r=>r!==false),'شطب')};

/* ---------- التواصل والمتابعة ---------- */
V.d_com=()=>{const me=D.user.username,all=DN().comms,users={};
  all.forEach(c=>{if(c.by)users[c.by]=c.byName||c.by});
  if(CF.user&&!users[CF.user])CF.user='';
  const L=all.filter(c=>(!CF.st||(CF.st==='__none'?!c.fst:c.fst===CF.st))&&(!CF.user||c.by===CF.user));
  const so=(cur,v,l)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l||v)}</option>`;
  const sf=`<select id="cmsf" onchange="cmst()" style="width:auto" title="حالة التواصل">${so(CF.st,'','كل الحالات')}${so(CF.st,'مفتوحة')}${so(CF.st,'تمت')}${so(CF.st,'__none','بدون متابعة')}</select>`
   +`<select id="cmuf" onchange="cmst()" style="width:auto" title="المستخدم الذي سجّل التواصل">${so(CF.user,'','كل المستخدمين')}${Object.keys(users).sort((a,b)=>users[a].localeCompare(users[b],'ar')).map(k=>so(CF.user,k,users[k])).join('')}</select>`;
  return head('التواصل والمتابعة',canW()?'ncm':'','+ تسجيل تواصل',sf)+`<div class="box">${tbl(['التاريخ','المتبرع','الوسيلة','النتيجة','الموضوع','ملاحظات','موعد المتابعة','حالتها','سجّله','إجراءات'],L.map(c=>{const late=c.fst==='مفتوحة'&&c.next&&c.next<today();
    return [esc(c.date),esc(donorN(c.donor)),esc(c.channel),esc(c.outcome),esc(c.subject),esc(c.notes),esc(c.next)||'—',st(c.fst||'—')+(late?' <span class="st" style="background:#f6dede">متأخرة</span>':''),esc(c.byName),
      (c.fst==='مفتوحة'&&canW()?btn('dcm',c.id,'تمت المتابعة','g'):'')+(canW()&&(isM()||c.by===me)?btn('ncm','c:'+c.id,'تعديل','o')+btn('xcm',c.id,'حذف','r'):'')]}))}</div>`};
window.cmst=()=>{const qi=$('#v input[placeholder="بحث..."]'),qv=qi?qi.value:'';CF.st=($('#cmsf')||{}).value||'';CF.user=($('#cmuf')||{}).value||'';render();
  const q2=$('#v input[placeholder="بحث..."]');if(q2&&qv){q2.value=qv;flt(q2)}};
A.ncm=i=>{const edit=i&&String(i).startsWith('c:'),x=edit?Object.assign({},DN().comms.find(z=>z.id==String(i).slice(2))):{date:today(),donor:i||''};
  const d=donorO(x.donor);
  mdl(edit?'تعديل سجل تواصل':'تسجيل تواصل',(d.dnc?'<div class="full" style="color:#a11">⚠ هذا المتبرع لا يرغب في التواصل معه.</div>':'')+fld('التاريخ','date',x.date,'date')+dsBox()+sel('المتبرع','donor',donOpts(x.donor),x.donor||'','full')+sel('وسيلة التواصل','channel',opt(CHANNELS),x.channel||'اتصال هاتفي')+sel('النتيجة','outcome',opt(OUTCOMES),x.outcome||'تم التواصل')+fld('الموضوع','subject',x.subject,'text','full')+fld('تفاصيل / ملاحظات','notes',x.notes,'ta','full')+fld('موعد المتابعة القادمة (اختياري)','next',x.next||'','date'),
  ()=>run('saveComm',{...rd(),id:edit?x.id:undefined,ver:x.ver},'تم حفظ سجل التواصل').then(r=>r!==false))};
A.dcm=i=>run('doneComm',{id:i,ver:(DN().comms.find(z=>z.id==i)||{}).ver},'تم إنهاء المتابعة');
A.xcm=i=>{if(confirm('حذف سجل التواصل؟'))run('delComm',{id:i,ver:(DN().comms.find(z=>z.id==i)||{}).ver},'تم الحذف')};

/* ---------- محرر المشروعات المكوّنة (مستهدف تبرعات + مخطط مصروفات لكل مشروع) ---------- */
const plRow=(p={})=>`<tr class="plr"><td><select class="plp"><option value="">— اختر مشروعًا —</option>${PJ().filter(x=>x.active||x.code===p.code).map(x=>`<option value="${esc(x.code)}"${x.code===p.code?' selected':''}>${esc(x.code+' · '+x.name)}</option>`).join('')}</select></td><td><input type="number" class="pld" min="0" step="any" value="${p.don||''}" style="width:120px"></td><td><input type="number" class="ple" min="0" step="any" value="${p.exp||''}" style="width:120px"></td><td><button type="button" class="b r s" data-a="plx">حذف</button></td></tr>`;
const plEd=(plans,hint)=>`<div class="full"><label>المشروعات المكوّنة — لكل مشروع مستهدف تبرعات ومخطط مصروفات</label><div style="overflow-x:auto"><table><thead><tr><th>المشروع</th><th>مستهدف التبرعات</th><th>مخطط المصروفات</th><th></th></tr></thead><tbody id="plb">${(plans||[]).map(plRow).join('')}</tbody><tfoot><tr><td><b>الإجمالي (المستهدف)</b></td><td><b id="plt1">0</b></td><td><b id="plt2">0</b></td><td></td></tr></tfoot></table></div><button type="button" class="b o s" data-a="pladd">+ إضافة مشروع</button><div class="mu" style="margin-top:4px">${hint||''}</div></div>`;
const plRead=()=>$$('#plb .plr').map(r=>({proj:r.querySelector('.plp').value,don:r.querySelector('.pld').value,exp:r.querySelector('.ple').value})).filter(x=>x.proj||x.don||x.exp);
const plTot=()=>{if(!$('#plb'))return;let a=0,b=0,n=0;$$('#plb .plr').forEach(r=>{a+=+r.querySelector('.pld').value||0;b+=+r.querySelector('.ple').value||0;if(r.querySelector('.plp').value)n++});
  $('#plt1').textContent=f(r2(a));$('#plt2').textContent=f(r2(b));const t=$('#m [name=target]');if(t){t.disabled=n>0;if(n>0)t.value=r2(a)||''}};
A.pladd=()=>{$('#plb').insertAdjacentHTML('beforeend',plRow());plTot()};
A.plx=()=>{const e=event&&event.target&&event.target.closest('.plr');if(e){e.remove();plTot()}};
dlg.addEventListener('input',e=>{if(e.target&&e.target.closest&&e.target.closest('#plb'))plTot()});
dlg.addEventListener('change',e=>{if(e.target&&e.target.closest&&e.target.closest('#plb'))plTot()});
/* ---------- الحملات والمبادرات ---------- */
const cmpV=coding=>{const L=DN().campaigns;
  return head(coding?'تكويد الحملات والمبادرات':'الحملات والمبادرات — تقارير',coding&&isM()?'ncp':'','+ حملة / مبادرة')+`<div class="box">${tbl(['الكود','الاسم','النوع','المشروعات','من','إلى','المستهدف','المحصَّل','النسبة','مخطط المصروفات','عدد التبرعات','الحالة','إجراءات'],L.map(c=>{const pct=c.target>0?Math.min(100,Math.round(c.raised/c.target*1000)/10):null;
    return [`<b>${esc(c.code)}</b>`,esc(c.name),esc(c.kind),((c.plans||[]).length?esc(c.plans.map(p=>p.code).join('، ')):(esc(pjl(c.proj))||'—')),esc(c.start)||'—',esc(c.end)||'—',c.target?f(c.target):'—',f(c.raised),pct==null?'—':`<div style="background:#eee;border-radius:4px;min-width:90px"><div style="background:var(--p);color:#fff;font-size:11px;padding:1px 4px;border-radius:4px;width:${pct}%;min-width:30px">${pct}%</div></div>`,c.expPlan?f(c.expPlan):'—',c.n,st(c.st),btn('vcp',c.id,coding?'المشروعات والمنفَّذ':'تقرير الحملة','g')+(coding&&isM()?btn('ncp',c.id,'تعديل','o'):'')]}))}</div><p class="mu">الحملة / المبادرة تتكوّن من مشروعات؛ مستهدفها الإجمالي = مجموع مستهدفات مشروعاتها، ولكل مشروع مخطط مصروفات. زر «المشروعات والمنفَّذ» يقارن المخطط بالمحصَّل والمنصرف فعليًا.</p>`};
if(MODS.adm){const _an=MODS.adm.nav;MODS.adm.nav=()=>_an().concat([['a_cmp','الحملات والمبادرات'],['a_evt','الأحداث والقوافل']])}
V.d_cmp=()=>cmpV(false);V.a_cmp=()=>cmpV(true);
A.ncp=i=>{const x=i?Object.assign({},cmpO(i)):{st:'جاري',kind:'حملة'};
  mdl(i?'تعديل '+x.name:'حملة / مبادرة جديدة',fld('الاسم','name',x.name,'text','full')+sel('النوع','kind',opt(CKINDS),x.kind)+sel('الحالة','st',opt(CST),x.st)+fld('المبلغ المستهدف الإجمالي (ج.م) — يُحسب تلقائيًا عند إضافة مشروعات','target',x.target||'','number')+fld('من','start',x.start||'','date')+fld('إلى','end',x.end||'','date')+plEd(x.plans&&x.plans.length?x.plans:(x.proj?[{code:x.proj,don:x.target||0,exp:0}]:[]),'مثال: حملة «بيت دافي» مستهدفها 100 = مشروع ظلال 50 + مشروع دفء 50، وكذلك مخطط المصروفات.')+fld('الوصف','descr',x.descr,'ta','full'),
  ()=>run('saveCampaign',{...rd(),target:undefined,...(plRead().length?{}:{target:rd().target}),plans:plRead(),id:i||undefined,ver:x.ver},'تم حفظ الحملة').then(r=>r!==false));plTot()};

const cpBar=(a,b)=>evBar(a,b);
A.vcp=async i=>{try{const r=await api('campRep',{id:i}),c=r.campaign,S=r.sum;
  mdl(c.code+' · '+c.name,`<div class="cards full">${[['المستهدف',f(S.planDon||c.target)],['المحصَّل',f(r.total)],['مخطط المصروفات',f(S.planExp)],['المنصرف',S.spent==null?'—':f(S.spent)]].map(x=>`<div class="card"><small>${x[0]}</small><h3>${x[1]}</h3></div>`).join('')}</div>`
   +`<div class="full" style="overflow-x:auto">${tbl(['المشروع','مستهدف التبرعات','المحصَّل','النسبة','مخطط المصروفات','المنصرف','النسبة'],r.rows.map(p=>[esc(p.code+' · '+p.name),f(p.planDon),f(p.raised),cpBar(p.raised,p.planDon),f(p.planExp),p.spent==null?'—':f(p.spent),p.spent==null?'—':cpBar(p.spent,p.planExp)]).concat(r.rows.length?[[`<b>الإجمالي</b>`,`<b>${f(S.planDon)}</b>`,`<b>${f(S.raised)}</b>`,cpBar(S.raised,S.planDon),`<b>${f(S.planExp)}</b>`,S.spent==null?'—':`<b>${f(S.spent)}</b>`,S.spent==null?'—':cpBar(S.spent,S.planExp)]]:[]))}</div>`
   +(r.undistN?`<div class="full" style="color:#a11">⚠ ${r.undistN} تبرعات (${f(r.undist)} ج.م) على هذه الحملة بدون مشروع ضمن مشروعاتها</div>`:'')
   +`<div class="full mu">المنصرف = مصروفات كل مشروع خلال فترة الحملة${c.start||c.end?' ('+esc(c.start||'…')+' ← '+esc(c.end||'…')+')':''}. المشروع المشترك بين حملتين يظهر مصروفه فيهما.</div>`,null)}catch(e){toast(e.message,1)}};
/* ---------- الأحداث والقوافل (حملة ← حدث ← مشاريع) ---------- */
const evBar=(a,b)=>{const p=b>0?Math.min(100,Math.round(a/b*1000)/10):null;return p==null?'—':`<div style="background:#eee;border-radius:4px;min-width:90px"><div style="background:var(--p);color:#fff;font-size:11px;padding:1px 4px;border-radius:4px;width:${p}%;min-width:30px">${p}%</div></div>`};
const evtV=coding=>{const L=EV();
  return head(coding?'تكويد الأحداث والقوافل':'الأحداث والقوافل — تقارير',coding&&canW()?'nev':'','+ حدث / قافلة')+`<div class="box">${tbl(['الكود','النوع','الاسم','الحملة','المكان','الفترة','المستهدف','المحصَّل','النسبة','المصروف','الحالة','إجراءات'],L.map(e=>{const s=e.sum||{};
    return [`<b>${esc(e.code)}</b>`,esc(e.kind||'حدث'),esc(e.name),esc(cmpN(e.campaign)),esc(e.place)||'—',esc(e.start)+' ← '+esc(e.end),e.target?f(e.target):'—',s.raised==null?'—':f(s.raised),s.raised==null?'—':evBar(s.raised,e.target),s.spent==null?'—':f(s.spent),st(e.st)+((s.warn||[]).length?' <span title="'+esc(s.warn.join(' | '))+'">⚠</span>':''),
    btn('vev',e.id,'لوحة '+(e.kind||'الحدث'),'g')+(coding&&canW()&&e.st!=='مقفل'?btn('nev',e.id,'تعديل','o'):'')+(coding&&isM()&&e.st==='منتهي'?btn('cev',e.id,'إقفال','r'):'')+(coding&&isAd()&&e.st==='مقفل'?btn('revEv',e.id,'إعادة فتح','o'):'')+(coding&&isM()&&e.st!=='مقفل'?btn('dev',e.id,'حذف','r'):'')]}))}</div><p class="mu">الحدث (قافلة / فعالية) يتبع حملة ويضم مشروعًا أو أكثر؛ المتبرع يحدد المشروع عند التبرع، والموازنات تبقى على مستوى المشروع. المصروف يُحسب من مصروفات مشاريع الحدث خلال فترته. المشروع المشترك بين حدثين متداخلين يظهر مصروفه في الحدثين.</p>`};
V.d_evt=()=>evtV(false);V.a_evt=()=>evtV(true);
A.nev=i=>{const x=i?Object.assign({},evO(i)):{st:'مخطط',projs:[]};
  const pj=PJ().filter(p=>p.active||(x.projs||[]).includes(p.code));
  mdl(i?'تعديل '+x.name:'تكويد حدث / قافلة جديدة',sel('نوع التكويد','kind',opt(['حدث','قافلة']),x.kind||'حدث')+fld('الاسم (مثال: قافلة وصل)','name',x.name,'text','full')+sel('الحملة / المبادرة','campaign',[['','— بدون —']].concat(DN().campaigns.map(c=>[c.id,c.code+' · '+c.name])),x.campaign||'','full')+fld('المكان','place',x.place)+fld('المسؤول','owner',x.owner)+fld('من','start',x.start||'','date')+fld('إلى','end',x.end||'','date')+fld('المبلغ المستهدف (ج.م)','target',x.target||'','number')+sel('الحالة','st',opt(EST),EST.includes(x.st)?x.st:'مخطط')
   +plEd(x.plans&&x.plans.length?x.plans:(x.projs||[]).map(c=>({code:c,don:0,exp:0})),'المشروع قد يخدم أكثر من حدث. مستهدف الحدث = مجموع مستهدفات مشروعاته.')+fld('ملاحظات','note',x.note,'ta','full'),
  ()=>run('saveEvent',{...rd(),target:undefined,...(plRead().length?{}:{target:rd().target}),plans:plRead(),id:i||undefined,ver:x.ver},'تم حفظ الحدث').then(r=>r!==false));plTot()};
A.dev=i=>{const x=evO(i);if(confirm('حذف الحدث '+x.name+'؟'))run('delEvent',{id:i,ver:x.ver},'تم حذف الحدث')};
A.cev=i=>{const x=evO(i);mdl('إقفال '+x.name,'<div class="full mu">الإقفال يمنع أي تبرع أو التزام جديد على الحدث. لا يمكن الإقفال مع وجود مسودات أو تأكيد مالي معلّق أو التزامات قائمة أو تبرعات بلا مشروع. وحدها الإدارة تعيد الفتح.</div>',()=>run('closeEvent',{id:i,ver:x.ver},'تم إقفال الحدث').then(r=>r!==false),'إقفال')};
A.revEv=i=>{const x=evO(i);mdl('إعادة فتح '+x.name,fld('سبب إعادة الفتح','reason','','ta','full'),()=>run('reopenEvent',{id:i,ver:x.ver,reason:rd().reason},'تمت إعادة فتح الحدث').then(r=>r!==false),'إعادة فتح')};
const evDash=(e,s)=>{s=s||{};
  const cd=[['المحصَّل',f(s.raised||0)],['نقدي',f(s.cash||0)],['عيني',f(s.inkind||0)],['عدد التبرعات',s.n||0],['عدد المتبرعين',s.donors||0],['المصروف',s.spent==null?'—':f(s.spent)],['المستهدف',e.target?f(e.target):'—'],['مستفيدون',s.beneficiaries||0]];
  return (s.warn||[]).map(w=>`<div class="full" style="color:#a11">⚠ ${esc(w)}</div>`).join('')+`<div class="cards full">${cd.map(c=>`<div class="card"><small>${c[0]}</small><h3>${c[1]}</h3></div>`).join('')}</div>`
   +`<div class="full" style="overflow-x:auto">${tbl(['المشروع','مستهدف التبرعات','المحصَّل','مخطط المصروفات','المصروف','الموازنة','المتاح','مشترك مع'],(s.projs||[]).map(p=>[esc(p.code+' · '+p.name),p.planDon?f(p.planDon):'—',f(p.raised),p.planExp?f(p.planExp):'—',f(p.spent),p.budget==null?'—':f(p.budget),p.left==null?'—':f(p.left),esc((p.shared||[]).join('، '))||'—']))}</div>`};
A.vev=i=>{const e=evO(i);if(!e.id)return;
  mdl(e.code+' · '+e.name,kv('الحملة',cmpN(e.campaign))+kv('الحالة',e.st)+kv('المكان',e.place)+kv('المسؤول',e.owner)+kv('الفترة',e.start+' ← '+e.end)+(e.note?`<div class="full"><label>ملاحظات</label>${esc(e.note)}</div>`:'')+evDash(e,e.sum)+`<div class="full"><button type="button" class="b s g" data-a="evr" data-i="${esc(e.id)}">تقرير ختامي (طباعة)</button></div>`,null)};
A.evr=async i=>{try{const r=await api('eventRep',{id:i}),e=r.event,s=r.sum||{};
  const g=(h,L)=>tbl([h,'الإجمالي','عدد التبرعات','عدد المتبرعين'],L.map(x=>[esc(x.label),f(x.total),x.n,x.donors]));
  docOut(printHead('التقرير الختامي — '+e.name)+`<p>الكود: ${esc(e.code)} — الحملة: ${esc(e.campaignName)||'—'} — المكان: ${esc(e.place)||'—'} — الفترة: ${esc(e.start)} إلى ${esc(e.end)} — الحالة: ${esc(e.st)}</p>`
   +tbl(['المستهدف','المحصَّل','نقدي','عيني','المصروف','المستفيدون'],[[e.target?f(e.target):'—',f(s.raised||0),f(s.cash||0),f(s.inkind||0),s.spent==null?'—':f(s.spent),s.beneficiaries||0]])
   +'<h3>المشاريع</h3>'+tbl(['المشروع','المحصَّل','المصروف','الموازنة'],(s.projs||[]).map(p=>[esc(p.code+' · '+p.name),f(p.raised),f(p.spent),p.budget==null?'—':f(p.budget)]))
   +'<h3>حسب نوع المتبرع</h3>'+g('النوع',r.byType)+'<h3>حسب وسيلة الدفع</h3>'+g('الوسيلة',r.byMethod)+'<h3>شهريًا</h3>'+g('الشهر',r.byMonth)
   +`<p class="mu">أُعد في ${esc(r.generated)}</p>`+printFoot(),'تقرير '+e.code)}catch(x){toast(x.message,1)}};

/* ---------- قنوات التحصيل ---------- */
const provName=id=>{const p=(DN().provSups||[]).find(z=>z.id==id);return p?p.name:'—'};
const accName=id=>{const a=(DN().cashAccts||[]).find(z=>z.id==id);return a?a.code+' · '+a.name:(id?'؟':'—')};
V.d_chn=()=>{const L=DN().channels,used={};DN().donations.forEach(x=>{if(x.chn)used[x.chn]=(used[x.chn]||0)+1});
  return head('قنوات التحصيل',isM()?'nch':'','+ قناة جديدة')+`<div class="box">${tbl(['الكود','القناة','الوسيلة','طبيعة التحصيل','حساب الخزينة / البنك','مقدم الخدمة (وسيط)','المرجع إلزامي','عدد التبرعات','الحالة','إجراءات'],L.map(c=>[`<b>${esc(c.code)}</b>`,esc(c.name),esc(c.method),c.prov?'عبر وسيط (مستحق عليه)':'مباشر',isM()?esc(accName(c.acc)):'—',esc(provName(c.prov)),c.refReq?'نعم':'لا',used[c.id]||0,st(c.active?'نشطة':'موقوفة'),isM()?btn('nch',c.id,'تعديل','o')+btn('dch',c.id,'حذف','r'):'']))}</div><p class="mu">القناة تحدد وسيلة الدفع وحساب الخزينة / البنك المقترح عند تأكيد التحصيل في الحسابات. بعد تعريف قناة نشطة واحدة على الأقل يصبح اختيار القناة إلزاميًا في التبرع النقدي.</p>`};
A.nch=i=>{const x=i?Object.assign({},DN().channels.find(z=>z.id==i)):{method:'نقدي',active:true};const linked=D.acc&&D.acc.linked;
  mdl(i?'تعديل قناة '+x.name:'قناة تحصيل جديدة','<div class="chform"></div>'+fld('اسم القناة (مثال: إنستاباي، البنك الأهلي)','name',x.name,'text','full')+sel('وسيلة الدفع','method',opt(METHODS),x.method)+(linked?sel('حساب الخزينة / البنك (للتحصيل المباشر، أو حساب التوريد الافتراضي للوسيط)','acc',[['','— بدون (يختاره المحاسب عند التأكيد) —']].concat((DN().cashAccts||[]).map(a=>[a.id,a.code+' · '+a.name])),x.acc||'','full'):'<div class="full mu">الحسابات غير مفعّلة: يمكن ربط القناة بحساب بعد تفعيلها.</div>')+(isM()?sel('طبيعة التحصيل','via',[['direct','مباشر: يدخل الخزينة / البنك'],['prov','عبر وسيط (مقدم خدمة): مستحق عليه حتى يورّد المبلغ']],x.prov?'prov':'direct','full')+'<div class="chp full"'+(x.prov?'':' hidden')+'>'+sel('مقدم الخدمة (المورد)','prov',[['','— اختر —']].concat((DN().provSups||[]).map(p=>[p.id,p.name])),x.prov||'','full')+fld('أو أنشئ مقدم خدمة جديدًا (اسمه)','provNew','','text','full')+'</div><div class="full mu">عند الربط بمقدم خدمة تُحمَّل تبرعات القناة على حساب وسيط «مستحقات لدى المقدم» ولا تدخل البنك إلا بعد تسجيل التسوية (توريد المقدم للبنك) من تاب «تحصيل التبرعات» في الحسابات، وتُسجَّل عمولته. الحساب المختار أعلاه يُستخدم كحساب التوريد الافتراضي عند التسوية.</div>':'')+sel('المرجع (رقم العملية) إلزامي في التبرع؟','refReq',[['false','لا'],['true','نعم']],x.refReq?'true':'false')+fld('ملاحظات','note',x.note,'ta','full')+(i?sel('الحالة','active',[['true','نشطة'],['false','موقوفة']],x.active?'true':'false'):''),
  ()=>run('saveChannel',{...rd(),id:i||undefined,ver:x.ver},'تم حفظ القناة').then(r=>r!==false))};
dlg.addEventListener('change',e=>{if(e.target&&e.target.name==='via'&&$('#m .chform')){const b=$('#m .chp');if(b)b.hidden=e.target.value!=='prov'}});
A.dch=i=>{const x=DN().channels.find(z=>z.id==i);if(confirm('حذف القناة '+x.name+'؟'))run('delChannel',{id:i,ver:x.ver},'تم حذف القناة')};

/* ---------- التقارير (متعددة الأبعاد) ---------- */
const RK=[['pivot','تحليل التبرعات (أبعاد متعددة)'],['register','سجل التبرعات التفصيلي'],['pending','التبرعات بانتظار الاعتماد'],['campaign','الحملات مقابل المستهدف'],['top','أكبر المتبرعين'],['lapsed','متبرعون منقطعون'],['pledges','تقادم الالتزامات'],['funding','تمويل المشاريع مقابل المصروفات']];
const STS=[['','المعتمد + بانتظار الاعتماد'],['معتمد','المعتمد فقط'],['مسودة','بانتظار الاعتماد فقط'],['ملغي','الملغي فقط'],['all','الكل بما فيه الملغي']];
const stBadge=s=>s==='بانتظار الاعتماد'?'<span class="st" style="background:#fff3cd;color:#7a5b00">بانتظار الاعتماد</span>':s==='معتمد'?'<span class="st" style="background:#dff3e6;color:#1e7a46">معتمد</span>':'<span class="st" style="background:#f5d6d3;color:#b3261e">'+esc(s)+'</span>';
const RP={kind:'pivot',dim:'month',dim2:'',from:yS(),to:today(),campaign:'',proj:'',event:'',convoy:'',dept:'',by:'',st:'',kindF:'',method:'',chn:'',months:12,res:null,meta:null,ml:0};
const needMeta=()=>{if(!RP.meta&&!RP.ml){RP.ml=1;api('donRepMeta').then(j=>{RP.meta=j;RP.ml=0;if(view==='d_rep')render()}).catch(()=>{RP.ml=0;RP.meta={dims:[],depts:[],recorders:[],methods:[],channels:[]};if(view==='d_rep')render()})}return RP.meta};
const repTable=r=>{if(!r)return '<p class="mu">اختر التقرير والفلاتر ثم اضغط «عرض».</p>';const k=r.kind,R=r.rows||[];
  const tot=(key)=>f(R.reduce((s,x)=>s+(+x[key]||0),0));
  if(k==='pivot'){const T=r.totals,two=!!r.dim2,showC=(r.st||[]).includes('ملغي');
    const hd=[r.dimL,'العدد','معتمد','بانتظار الاعتماد'].concat(showC?['ملغي']:[]).concat(['الإجمالي (معتمد + معلّق)','عيني منه','عدد المتبرعين','متوسط التبرع','النسبة']);
    const row=(x,sub)=>[sub?'<span class="mu">↳ </span>'+esc(x.label):'<b>'+esc(x.label)+'</b>',x.n,f(x.approved),x.pending?`<span style="color:#7a5b00">${f(x.pending)}</span>`:'0.00'].concat(showC?[f(x.cancelled)]:[]).concat([`<b>${f(x.total)}</b>`,f(x.inkind),x.donors,f(x.avg),sub?'':(x.share+'%')]);
    const out=[];R.forEach(x=>{out.push(row(x,false));if(two)(x.subs||[]).forEach(z=>out.push(row(z,true)))});
    out.push(['<b>الإجمالي</b>',T.n,'<b>'+f(T.approved)+'</b>','<b>'+f(T.pending)+'</b>'].concat(showC?[f(T.cancelled)]:[]).concat(['<b>'+f(T.total)+'</b>',f(T.inkind),T.donors,f(T.avg),'100%']));
    return (two?`<p class="mu">البُعد الأول: <b>${esc(r.dimL)}</b> — البعد الثاني: <b>${esc(r.dim2L)}</b></p>`:'')+tbl(hd,out)}
  if(k==='register'){const T=r.totals;
    return `<div class="cards"><div class="card"><div class="mu">عدد التبرعات</div><b>${T.n}</b></div><div class="card"><div class="mu">معتمد</div><b>${f(T.approved)}</b></div><div class="card"><div class="mu">بانتظار الاعتماد</div><b>${f(T.pending)}</b></div>${T.cancelled?`<div class="card"><div class="mu">ملغي</div><b>${f(T.cancelled)}</b></div>`:''}</div>`+(r.truncated?'<p class="mu">عُرض أحدث 3000 تبرع فقط — ضيّق الفلاتر.</p>':'')
     +tbl(['الرقم','التاريخ','المتبرع','النوع / الوسيلة','قناة التحصيل','المبلغ','الحملة','المشروع','الموظف المسجِّل','الإدارة','المعتمِد','الحالة','التأكيد المالي','الإيصال'],R.map(x=>[esc(x.no),esc(x.date),esc(x.donor),esc(x.kind==='عيني'?'عيني':x.method),esc(x.chn||'—'),f(x.amount),esc(x.campaign||'—'),esc(x.proj||'—'),esc(x.recorder),esc(x.dept),esc(x.approver||'—'),stBadge(x.st),esc(x.fin),esc(x.rcpt||'—')]))}
  if(k==='campaign')return tbl(['الحملة','النوع','الحالة','المستهدف','المحصَّل','بانتظار الاعتماد','عيني منه','عدد التبرعات','عدد المتبرعين','النسبة','المتبقي'],R.map(x=>[esc(x.label),esc(x.kind),esc(x.st),x.target?f(x.target):'—',f(x.total),x.pend?`<span style="color:#7a5b00">${f(x.pend)}</span>`:'0.00',f(x.inkind),x.n,x.donors,x.pct==null?'—':x.pct+'%',x.left==null?'—':f(x.left)]));
  if(['type','method','channel','month','restr','event','convoy'].includes(k))return tbl([{event:'الحدث',convoy:'القافلة',type:'نوع المتبرع',method:'الوسيلة',channel:'القناة',month:'الشهر',restr:'التخصيص'}[k],'الإجمالي','عيني منه','عدد التبرعات','عدد المتبرعين'],R.map(x=>[esc(x.label),f(x.total),f(x.inkind),x.n,x.donors]).concat([['<b>الإجمالي</b>','<b>'+tot('total')+'</b>',tot('inkind'),R.reduce((s,x)=>s+x.n,0),'']]));
  if(k==='top')return tbl(['#','المتبرع','النوع','الإجمالي (معتمد)','عدد التبرعات'],R.map((x,n)=>[n+1,esc(x.label),esc(x.type),f(x.total),x.n]));
  if(k==='lapsed')return `<p class="mu">متبرعون نشطون لم يتبرعوا منذ ${r.months} شهرًا أو أكثر.</p>`+tbl(['المتبرع','النوع','الهاتف','البريد','آخر تبرع','إجمالي ما تبرع','عدد التبرعات','ملاحظة'],R.map(x=>[esc(x.label),esc(x.type),esc(x.phone),esc(x.email),esc(x.last),f(x.total),x.n,x.dnc?'لا يُتواصل معه':'']));
  if(k==='pledges')return tbl(['الالتزام','المتبرع','الهاتف','المبلغ','المحصَّل','المتبقي','الاستحقاق','التأخير (يوم)','الفئة'],R.map(x=>[esc(x.no),esc(x.label),esc(x.phone),f(x.amount),f(x.coll),f(x.left),esc(x.due),x.age||'—',esc(x.bucket)]));
  if(k==='funding')return (r.linked?'':'<p class="mu">الحسابات غير مفعّلة: يظهر إجمالي التبرعات فقط دون المصروفات.</p>')+tbl(['المشروع','الممول','التبرعات المعتمدة','بانتظار الاعتماد','المصروفات (من الحسابات)','الصافي'],R.map(x=>[esc(x.label),esc(x.funder),f(x.total),x.pend?`<span style="color:#7a5b00">${f(x.pend)}</span>`:'0.00',x.exp==null?'—':f(x.exp),x.net==null?'—':f(x.net)]));
  return ''};
const pendTable=r=>{const T=r.totals;return `<div class="cards"><div class="card"><div class="mu">عدد التبرعات المعلّقة</div><b>${T.n}</b></div><div class="card"><div class="mu">إجمالي المعلّق</div><b>${f(T.pending)}</b></div></div>`+tbl(['الرقم','تاريخ التبرع','عمره (يوم)','المتبرع','قناة التحصيل','المبلغ','المشروع','الحملة','الموظف المسجِّل','الإدارة'],r.rows.map(x=>[esc(x.no),esc(x.date),x.age>7?`<b style="color:#b3261e">${x.age}</b>`:x.age,esc(x.donor),esc(x.chn||'—'),f(x.amount),esc(x.proj||'—'),esc(x.campaign||'—'),esc(x.recorder),esc(x.dept)]))};
const repBody=r=>!r?repTable(null):(r.kind==='register'&&RP.kind==='pending')?pendTable(r):repTable(r);
const dimSel=(l,n,v,none)=>sel(l,n,(none?[['',none]]:[]).concat(((RP.meta||{}).dims||[]).map(d=>[d.k,d.l])),v);
V.d_rep=()=>{const M=needMeta(),s=RP;
  const piv=s.kind==='pivot',det=['pivot','register','pending'].includes(s.kind);
  return `<div class="tb"><h2>التقارير</h2></div><div class="box"><div class="db" id="drf">${sel('التقرير','kind',RK,s.kind)}${piv?dimSel('التجميع حسب (البعد الأول)','dim',s.dim)+dimSel('ثم حسب (بعد ثانٍ اختياري)','dim2',s.dim2,'— بدون —'):''}${fld('من','from',s.from,'date')}${fld('إلى','to',s.to,'date')}${sel('الحملة','campaign',[['','الكل']].concat(DN().campaigns.map(c=>[c.id,c.code+' · '+c.name])),s.campaign)}${PJ().length?sel('المشروع','proj',[['','الكل']].concat(PJ().map(p=>[p.code,p.code+' · '+p.name])),s.proj):''}${det&&s.kind!=='pending'?sel('الحالة','st',STS,s.st):''}${det&&M?sel('الإدارة (للموظف المسجِّل)','dept',[['','الكل']].concat(M.depts.map(d=>[d.code,d.name])),s.dept)+sel('الموظف المسجِّل','by',[['','الكل']].concat(M.recorders.map(d=>[d.un,d.name])),s.by)+sel('نقدي / عيني','kindF',[['','الكل'],['نقدي','نقدي'],['عيني','عيني']],s.kindF)+sel('وسيلة الدفع','method',[['','الكل']].concat(M.methods.map(m=>[m,m])),s.method)+sel('قناة التحصيل','chn',[['','الكل']].concat(M.channels.map(c=>[c.id,c.name])),s.chn):''}${s.kind==='lapsed'?fld('مدة الانقطاع (شهر)','months',s.months,'number'):''}</div><button class="b" data-a="drRun">عرض</button> <button class="b o" data-a="drPr">طباعة</button> <button class="b g" data-a="xl">تصدير Excel</button></div><div class="box" id="drr">${repBody(s.res)}</div>${piv||s.kind==='register'?'<p class="mu">«الإدارة» = إدارة الموظف الذي سجّل التبرع. التبرعات بانتظار الاعتماد تظهر بعمود مستقل ولا تُحسب ضمن «المعتمد» حتى اعتمادها.</p>':''}`};
A.drRun=async()=>{const o=rd('#drf');Object.assign(RP,o,{months:+o.months||RP.months||12});return A.drRun2()};
document.addEventListener('change',e=>{if(e.target&&e.target.matches&&e.target.matches('#drf [name=kind]')){Object.assign(RP,rd('#drf'));RP.res=null;render()}});
A.drRun2=async()=>{const s=RP,kind=s.kind;
  try{let j;
    if(kind==='pivot')j=await api('donPivot',{...s,dim2:s.dim2||''});
    else if(kind==='register'||kind==='pending')j=await api('donRegister',{...s,pending:kind==='pending'});
    else j=await api('donRep',{kind,from:s.from,to:s.to,campaign:s.campaign,proj:s.proj,months:+s.months||12});
    s.res=j;const t=$('#drr');if(t)t.innerHTML=repBody(j)}catch(e){toast(e.message,1)}};
A.drPr=()=>{const s=RP;if(!s.res){toast('اعرض التقرير أولًا',1);return}
  docOut(printHead((RK.find(k=>k[0]===s.kind)||[])[1]||'تقرير')+`<p>الفترة: ${esc(s.from)} إلى ${esc(s.to)}</p>`+repBody(s.res)+printFoot())};
})();
