/* =====================================================================
   فواتير المشتريات (مديول المشتريات): مطابقة ثلاثية أمر التوريد ← الاستلام ← الفاتورة، وفاتورة مباشرة بأصناف مخزنية / خدمات / مصروفات
   ===================================================================== */
(()=>{
{const o=MODS.proc.nav;MODS.proc.nav=()=>{const r=o().filter(n=>n[0]!=='p_inv');if(canW())r.push(['p_inv','فواتير المشتريات']);return r}}
const AC=()=>D.acc||{};
const role=()=>AC().role;
const canW=()=>is('admin','procurement','finance')||['admin','manager','accountant'].includes(role());
const isMgr=()=>is('admin','finance')||['admin','manager'].includes(role());
const canPay=()=>(AC().payAccts||[]).length>0;
const COL={'مسودة':'#c77a00','مرحّل':'#1d5fa8','مدفوع':'#1e7a46','مقبوض':'#1e7a46','مدفوع جزئيًا':'#8a6d00','مقبوض جزئيًا':'#8a6d00','ملغي':'#777','مطابقة':'#1e7a46','فروقات':'#b3261e','كمية':'#b3261e'};
const bd=s=>`<span class="st" style="background:${COL[s]||'#777'};color:#fff">${esc(s)}</span>`;
const expAccs=()=>(AC().accounts||[]).filter(a=>a.active&&a.type==='expense');
const accO=(arr,cur,ph)=>`<option value="">${ph||'— اختر —'}</option>`+arr.map(a=>`<option value="${esc(a.id)}"${a.id==cur?' selected':''}>${esc(a.code)} · ${esc(a.name)}</option>`).join('');
const num=v=>+v||0;
const supN=id=>((AC().sups||[]).find(s=>s.id==id)||{}).name||'';
let DM=null,DMT=0;
const dimsLoad=async()=>{if(DM&&Date.now()-DMT<60000)return;DMT=Date.now();try{DM=await api('invDims')}catch(e){DM=DM||{}}};
const dopt=(k,cur)=>'<option value="">— بدون —</option>'+((DM&&DM[k])||[]).map(x=>`<option value="${esc(x.id)}"${x.id==cur?' selected':''}>${esc(x.name)}</option>`).join('');
const pOpt=cur=>'<option value="">— بدون —</option>'+(AC().projects||[]).filter(p=>p.active||p.id==cur).map(p=>`<option value="${esc(p.id)}"${p.id==cur?' selected':''}>${esc(p.code+' · '+p.name)}</option>`).join('');
const kvt=(a,b,c,d)=>`<div class="g"><div>${a}</div><div>${b}</div></div>`;
const P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';


/* ================= فواتير المشتريات ================= */
const PS={q:'',st:''};
V.p_inv=()=>{
  if(!AC().linked)return head('فواتير المشتريات')+'<div class="box mu">الربط المحاسبي غير مُفعَّل.</div>';
  const q=PS.q.trim(),L=(AC().pinv||[]).filter(x=>(!PS.st||x.st===PS.st)&&(!q||nz(x.no+' '+x.supNo+' '+x.supName+' '+x.poNo).includes(nz(q))));
  const me=D.user.username;
  const acts=x=>{let b=btn('vpi',x.id,'عرض / طباعة','o');
    if(canW()&&x.st==='مسودة'&&(x.by===me||isMgr()))b+=btn('npi',x.id,'تعديل','o')+btn('ppi',x.id,'ترحيل','g')+btn('dpi',x.id,'حذف','r');
    if(canPay()&&!x.po&&['مرحّل','مدفوع جزئيًا'].includes(x.st))b+=btn('ypi',x.id,'سداد','g');
    if(isMgr()&&['مرحّل','مدفوع','مدفوع جزئيًا'].includes(x.st)&&!x.paid)b+=btn('cpi',x.id,'إلغاء','r');
    return b};
  const open=(AC().invPos||[]).filter(p=>p.open);
  const cards=[['مسودات',(AC().pinv||[]).filter(x=>x.st==='مسودة').length],['استلامات بانتظار الفوترة',open.length+' أمر'],['فواتير بفروقات (مرحّلة)',(AC().pinv||[]).filter(x=>x.po&&x.match==='فروقات'&&x.st!=='مسودة'&&x.st!=='ملغي').length]];
  return head('فواتير المشتريات',canW()?'npi':'','+ فاتورة مشتريات',`<select onchange="piF('st',this.value)"><option value="">كل الحالات</option>${['مسودة','مرحّل','مدفوع جزئيًا','مدفوع','ملغي'].map(s=>`<option${PS.st===s?' selected':''}>${s}</option>`).join('')}</select>`)
   +`<div class="cards">${cards.map(c=>`<div class="card"><div class="mu">${c[0]}</div><b>${c[1]}</b></div>`).join('')}</div>`
   +`<div class="box">${tbl(['الرقم','التاريخ','المورد','رقم فاتورة المورد','أمر التوريد','الإجمالي','المطابقة','فروق على المورد','الحالة',''],L.map(x=>[esc(x.no),esc(x.date),esc(x.supName),esc(x.supNo),esc(x.poNo)||'<span class="mu">مباشرة</span>',f(x.total),(x.po?bd(x.match):'<span class="mu">—</span>'),x.po?f(x.dPrice+x.dVat+x.extra):'—',bd(x.st),acts(x)]))}</div>
   <p class="mu">الدورة: أمر توريد ← استلام مخزني (يقيّد المورد بسعر الأمر) ← <b>فاتورة المورد</b> تُطابَق على المستلم، ولا يُكرَّر القيد: يُرحَّل فقط فرق السعر والضريبة والبنود الإضافية (كالشحن) على حساب المورد. الفاتورة المباشرة بلا أمر توريد: بنودها صنف مخزني (يدخل المخزن المحدد عند الترحيل بقيمته بعد الخصم) أو خدمة أو مصروف، ولكل بند كمية وسعر وبيان وخصم.</p>`;
};
window.piF=(k,v)=>{PS[k]=v;render()};
const piFind=i=>(AC().pinv||[]).find(x=>x.id==i);

// واجهة بنود الفاتورة
const KD=[['s','صنف مخزني'],['v','خدمة'],['x','مصروف']];
const kdL=k=>(KD.find(z=>z[0]===k)||KD[2])[1];
const itO=cur=>'<option value="">— اختر الصنف —</option>'+((DM&&DM.items)||[]).map(i=>`<option value="${esc(i.id)}"${i.id==cur?' selected':''}>${esc(i.name)}${i.unit?' ('+esc(i.unit)+')':''}</option>`).join('');
const whO=cur=>[['','— اختر المخزن —']].concat(((DM&&DM.whs)||[]).map(w=>[w.id,w.name]));
const piLines=(po,old)=>{
  if(!po)return '';
  const m={};(old||[]).filter(l=>l.k==='po').forEach(l=>m[l.pl]=l);
  return `<div class="full" style="overflow-x:auto"><table id="pil"><thead><tr><th>البند</th><th>المستلم</th><th>سبق فوترته</th><th>المتاح للفوترة</th><th>كمية الفاتورة</th><th>سعر الأمر</th><th>سعر فاتورة المورد</th><th>الخصم</th></tr></thead><tbody>`
   +po.lines.map(l=>{const o=m[l.pl],left=Math.max(0,r2(l.left+(o&&old?0:0)));
     return `<tr data-pl="${l.pl}"><td>${esc(l.d)}<br><small class="mu">${esc(l.u)}</small></td><td>${l.rec}</td><td>${l.inv}</td><td>${left}</td><td><input class="pq" type="number" min="0" step="any" value="${o?o.q:left||''}" style="width:90px"></td><td>${f(l.p)}</td><td><input class="pp" type="number" min="0" step="any" value="${o?o.p:l.p}" style="width:100px"></td><td><input class="pd" type="number" min="0" step="any" value="${o&&o.disc?o.disc:''}" placeholder="0" style="width:90px" title="خصم على إجمالي البند"></td></tr>`}).join('')
   +`</tbody></table></div>`;
};
/* بند غير مرتبط بأمر توريد: النوع (صنف مخزني / خدمة / مصروف) ثم الصنف أو حساب المصروف، الكمية، السعر، البيان والخصم متجاوران، والصافي */
const accPh=(k,po)=>k==='v'||po?'— مصروف الخدمات (افتراضي) —':'— اختر حساب المصروف —';
const exRow=(x={},po)=>{
  const k=x.k||'x',q=x.q??1,p=x.p??(x.amt??''),dsc=x.disc||'';
  const kinds=KD.filter(z=>!(po&&z[0]==='s'));
  return `<tr class="pr"><td><select class="xk" style="min-width:120px">${kinds.map(z=>`<option value="${z[0]}"${z[0]===k?' selected':''}>${z[1]}</option>`).join('')}</select></td>`
   +`<td><select class="xi" style="min-width:210px;${k==='s'?'':'display:none'}">${itO(x.item)}</select><select class="xc" style="min-width:210px;${k==='s'?'display:none':''}">${accO(expAccs(),x.acc,accPh(k,po))}</select></td>`
   +`<td><input class="xq" type="number" min="0" step="any" value="${esc(String(q))}" style="width:80px" title="الكمية"></td>`
   +`<td><input class="xp" type="number" step="any" value="${esc(String(p))}" style="width:100px" title="سعر الوحدة (قبل الضريبة)"></td>`
   +`<td><input class="xd" value="${esc(x.d||'')}" placeholder="البيان" style="min-width:170px"></td>`
   +`<td><input class="xs" type="number" min="0" step="any" value="${dsc?esc(String(dsc)):''}" placeholder="0" style="width:90px" title="الخصم على إجمالي البند"></td>`
   +`<td class="xn" style="white-space:nowrap">0.00</td>`
   +`<td><button type="button" class="b s r" onclick="this.closest('tr').remove();piCalc()">×</button></td></tr>`};
const pixBox=(po,rows)=>`<div class="full"><b>${po?'بنود إضافية (شحن، رسوم، خدمات...)':'بنود الفاتورة (صنف مخزني / خدمة / مصروف)'}</b><div style="overflow-x:auto"><table id="pix"><thead><tr><th>النوع</th><th>${po?'حساب المصروف':'الصنف / حساب المصروف'}</th><th>الكمية</th><th>سعر الوحدة</th><th>البيان</th><th>الخصم</th><th>الصافي</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><button type="button" class="b o s" onclick="$('#pix tbody').insertAdjacentHTML('beforeend',window.exRowH());piCalc()">+ بند</button></div>`;
const piGet=()=>{
  const lines=[];
  $$('#pil tbody tr').forEach(r=>{const q=+r.querySelector('.pq').value||0;if(q>0)lines.push({k:'po',pl:+r.dataset.pl,q,p:r.querySelector('.pp').value,disc:+r.querySelector('.pd').value||0})});
  $$('#pix tbody tr').forEach(r=>{const k=r.querySelector('.xk').value,q=r.querySelector('.xq').value,p=r.querySelector('.xp').value,d=r.querySelector('.xd').value.trim(),sd=+r.querySelector('.xs').value||0,it=r.querySelector('.xi').value,ac=r.querySelector('.xc').value;
    if(!(+p||d||sd||(k==='s'&&it)))return;
    const o={k,d,q:q===''?1:+q,p:p===''?0:+p,disc:sd};if(k==='s')o.item=it;else o.acc=ac||undefined;lines.push(o)});
  return lines;
};
window.piKind=tr=>{const k=tr.querySelector('.xk').value,po=!!$('#pil'),i=tr.querySelector('.xi'),c=tr.querySelector('.xc');
  i.style.display=k==='s'?'':'none';c.style.display=k==='s'?'none':'';
  if(c.options.length)c.options[0].text=accPh(k,po)};
window.piCalc=()=>{const e=$('#pit');if(!e)return;const poId=(($('#m [name=po]')||{}).value)||'',po=(AC().invPos||[]).find(p=>p.id==poId);
  let sub=0,dp=0,ex=0,disc=0,stock=0;
  $$('#pil tbody tr').forEach(r=>{const q=+r.querySelector('.pq').value||0,p=+r.querySelector('.pp').value||0,d=+r.querySelector('.pd').value||0,l=po&&po.lines[+r.dataset.pl];if(l){const n=q*p-d;sub+=n;dp+=n-q*l.p;disc+=d}});
  $$('#pix tbody tr').forEach(r=>{const k=r.querySelector('.xk').value,q=r.querySelector('.xq').value,p=+r.querySelector('.xp').value||0,d=+r.querySelector('.xs').value||0,n=(q===''?1:+q||0)*p-d;
    r.querySelector('.xn').textContent=f(r2(n));ex+=n;sub+=n;disc+=d;if(k==='s')stock+=n});
  const wb=$('#m .pi-wh');if(wb)wb.hidden=!($$('#pix tbody tr .xk').some(s=>s.value==='s'));
  const vp=po?po.vat:(+($('#m [name=vat]')||{}).value||0),vi=$('#m [name=vatAmt]');
  const auto=r2(sub*vp/100);if(vi&&vi.dataset.auto!=='0')vi.value=auto;
  const va=vi&&vi.value!==''?+vi.value:auto;
  e.innerHTML=`الإجمالي قبل الضريبة (بعد الخصم): <b>${f(r2(sub))}</b>${disc?' — إجمالي الخصومات: <b>'+f(r2(disc))+'</b>':''}${stock?' — منها أصناف مخزنية: <b>'+f(r2(stock))+'</b>':''} — الضريبة: <b>${f(va)}</b> — إجمالي الفاتورة: <b>${f(r2(sub+va))}</b>`+(po?`<br>فرق السعر عن أمر التوريد: <b style="color:${Math.abs(dp)>0.004?'#b3261e':'inherit'}">${f(dp)}</b> — بنود إضافية: <b>${f(ex)}</b>`:'');
};
dlg.addEventListener('input',e=>{if(e.target&&e.target.closest&&e.target.closest('#pil,#pix')||e.target&&e.target.name==='vat')piCalc();if(e.target&&e.target.name==='vatAmt')e.target.dataset.auto='0'});
dlg.addEventListener('change',e=>{if(e.target&&e.target.name==='po'&&$('#pibody'))piMode();if(e.target&&e.target.classList&&e.target.classList.contains('xk')){piKind(e.target.closest('tr'));piCalc()}});
const piMode=()=>{const poId=($('#m [name=po]')||{}).value,po=(AC().invPos||[]).find(p=>p.id==poId),b=$('#pibody');if(!b)return;
  $('#m .pi-sup').hidden=!!po;$('#m .pi-vat').hidden=!!po;
  if(po){const s=$('#m [name=sup]');if(s)s.value=po.sup}
  b.innerHTML=(po?piLines(po,null):'')+pixBox(!!po,po?'':exRow({},0));
  piCalc()};
window.exRowH=()=>exRow({},!!$('#pil'));
A.npi=async i=>{if(!canW())return;await dimsLoad();const x=i?piFind(i):{date:today(),items:[]};if(i&&!x)return;
  const pos=(AC().invPos||[]).filter(p=>p.open||p.id==x.po);
  mdl(i?'تعديل فاتورة مشتريات '+x.no:'فاتورة مشتريات جديدة',
   sel('أمر التوريد (مطابقة ثلاثية)','po',[['','— فاتورة مباشرة بلا أمر توريد (صنف مخزني / خدمة / مصروف) —']].concat(pos.map(p=>[p.id,p.no+' — '+p.supName])),x.po||'','full')
   +`<div class="pi-sup full"${x.po?' hidden':''}>${sel('المورد','sup',[['','— اختر المورد —']].concat((AC().sups||[]).map(s=>[s.id,s.name])),x.sup||'')}</div>`
   +fld('رقم فاتورة المورد','supNo',x.supNo||'')+fld('تاريخ فاتورة المورد','supDate',x.supDate||today(),'date')+fld('تاريخ القيد','date',x.date,'date')+fld('تاريخ الاستحقاق','due',x.due||'','date')
   +`<div class="pi-vat"${x.po?' hidden':''}>${fld('نسبة الضريبة %','vat',x.vat??14,'number')}</div>`
   +`<div class="pi-wh full" hidden>${sel('المخزن (تدخله الأصناف المخزنية عند الترحيل)','wh',whO(),x.wh||'')}</div>`
   +`<div id="pibody" class="full"></div>`
   +fld('ضريبة الفاتورة الفعلية (من فاتورة المورد)','vatAmt',x.id?x.vatAmt:'','number')+`<div class="full" id="pit"></div>`+fld('ملاحظات','note',x.note||'','ta','full'),
   ()=>{const o=rd(),it=piGet();if(!o.supNo.trim()){toast('أدخل رقم فاتورة المورد',1);return false}if(!it.length){toast('أدخل كمية مفوترة أو بندًا واحدًا على الأقل',1);return false}
    if(!o.po&&!o.sup){toast('اختر المورد',1);return false}
    if(it.some(l=>l.k==='s'&&!l.item)){toast('اختر الصنف المخزني لكل بند من نوع «صنف مخزني»',1);return false}
    if(it.some(l=>l.k==='s')&&!o.wh){toast('اختر المخزن الذي تدخله الأصناف',1);return false}
    return run('savePinv',{id:i||undefined,ver:x.ver,po:o.po||undefined,sup:o.sup,supNo:o.supNo,supDate:o.supDate,date:o.date,due:o.due,vat:o.vat,vatAmt:o.vatAmt,wh:o.wh||undefined,note:o.note,items:it},'تم حفظ الفاتورة كمسودة').then(r=>r!==false)});
  piMode();
  if(i){const b=$('#pibody');if(x.po){const po=(AC().invPos||[]).find(p=>p.id==x.po);b.innerHTML=piLines(po,x.items)+pixBox(true,x.items.filter(l=>l.k!=='po').map(l=>exRow(l,1)).join(''))}
   else $('#pix tbody').innerHTML=x.items.map(l=>exRow(l,0)).join('')||exRow({},0);
   const vi=$('#m [name=vatAmt]');if(vi)vi.dataset.auto='0';piCalc()}
};
A.dpi=i=>{if(confirm('حذف مسودة الفاتورة؟'))run('delPinv',{id:i},'تم الحذف')};
A.ppi=i=>{const x=piFind(i);if(!x)return;
  mdl('ترحيل فاتورة المشتريات '+x.no,kv('المورد',x.supName)+kv('رقم فاتورة المورد',x.supNo)+kv('الإجمالي',f(x.total))+kv('المطابقة',x.match)
   +(x.po?`<div class="full">فرق السعر: <b>${f(x.dPrice)}</b> — فرق الضريبة: <b>${f(x.dVat)}</b> — بنود إضافية: <b>${f(x.extra)}</b><br><small class="mu">تُرحَّل هذه الفروق فقط على حساب المورد (قيد الاستلام قائم ولا يتكرر).${x.match==='مطابقة'?' الفاتورة مطابقة تمامًا فلن يُنشأ قيد.':''}</small></div>`:`<div class="full mu">فاتورة مباشرة: مدين ${x.items.some(l=>l.k==='s')?'المخزون (للأصناف المخزنية، وتدخل '+esc(x.whName||'المخزن')+') و':''}المصروف + الضريبة، دائن المورد.</div>`),
   ()=>run('postPinv',{id:i,ver:x.ver},'تم ترحيل الفاتورة').then(r=>r!==false),'ترحيل')};
A.cpi=i=>{const x=piFind(i);mdl('إلغاء فاتورة المشتريات '+x.no,fld('سبب الإلغاء (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب السبب',1);return false}return run('cancelPinv',{id:i,ver:x.ver,reason:r},'تم الإلغاء').then(z=>z!==false)},'تأكيد الإلغاء')};
A.ypi=i=>{const x=piFind(i);const left=r2(x.total-x.paid);
  mdl('سداد فاتورة '+x.no,kv('المورد',x.supName)+kv('المتبقي',f(left))+sel('الدفع من','acc',AC().payAccts.map(a=>[a.id,a.code+' · '+a.name+' (رصيد '+f(a.bal)+')']))+fld('التاريخ','date',today(),'date')+fld('المبلغ','amount',left,'number')+fld('المرجع','ref'),
   ()=>{const o=rd();if(!(+o.amount>0)){toast('أدخل المبلغ',1);return false}return run('payPinv',{id:i,acc:o.acc,date:o.date,amount:+o.amount,ref:o.ref},'تم تسجيل السداد').then(r=>r!==false)})};
const piHtml=(x,pr)=>{
  const dv=l=>r2((l.q||0)*(l.p||0)-(l.disc||0));
  const rows=x.items.map(l=>l.k==='po'
    ?[esc(l.d),'بند أمر توريد',l.q,f(l.pp),f(l.p),l.disc?f(l.disc):'—',f(dv(l)),f(r2(dv(l)-l.q*l.pp))]
    :[esc(l.d)+(l.k==='s'&&l.iname&&l.iname!==l.d?'<br><small class="mu">'+esc(l.iname)+'</small>':''),kdL(l.k||'x')+(x.po?' (إضافي)':''),l.q!=null?l.q:'',x.po?'':'',l.p!=null?f(l.p):'',l.disc?f(l.disc):'—',f(l.amt),'']);
  const hd=['البند / البيان','النوع','الكمية','سعر الأمر','سعر الفاتورة','الخصم','القيمة','فرق السعر'];
  const keep=x.po?[0,1,2,3,4,5,6,7]:[0,1,2,4,5,6];
  return (pr?printHead('فاتورة مشتريات'):'')+`<div class="g"><div>${P('رقم القيد الداخلي',x.no)+P('المورد',x.supName)+P('رقم فاتورة المورد',x.supNo)+P('تاريخ فاتورة المورد',x.supDate)}</div><div>${P('أمر التوريد',x.poNo||'مباشرة')+P('المخزن',x.whName)+P('التاريخ',x.date)+P('الاستحقاق',x.due)+P('الحالة',x.st)+P('المطابقة',x.match)}</div></div>`
   +tbl(keep.map(i=>hd[i]),rows.map(r=>keep.map(i=>r[i])))
   +`<p>الإجمالي قبل الضريبة (بعد الخصم): <b>${f(x.sub)}</b> — الضريبة: <b>${f(x.vatAmt)}</b> — <b>إجمالي الفاتورة: ${f(x.total)}</b></p>`
   +(x.po?`<p>الفروق المرحّلة على حساب المورد: سعر ${f(x.dPrice)} + ضريبة ${f(x.dVat)} + إضافي ${f(x.extra)}</p>`:'')+(x.note?P('ملاحظات',x.note):'')+(pr?printFoot():'')};
A.vpi=i=>{const x=piFind(i);if(!x)return;
  mdl('فاتورة مشتريات '+x.no,`<div class="full" style="overflow-x:auto">${piHtml(x,false)}</div><div class="full"><button class="b g" data-a="ppip" data-i="${esc(i)}">طباعة</button> <button class="b g" data-a="ppix" data-i="${esc(i)}">Excel</button></div>`+(typeof attBox==='function'?attBox('PINV',x.id):''),null);if(typeof attInit==='function')attInit()};
A.ppip=i=>{const x=piFind(i);if(x)docOut(piHtml(x,true),'فاتورة مشتريات '+x.no)};
A.ppix=i=>{const x=piFind(i);if(x)docOut(piHtml(x,true),'فاتورة مشتريات '+x.no,1)};

})();
