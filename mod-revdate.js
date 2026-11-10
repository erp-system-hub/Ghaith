/* =====================================================================
   تاريخ العكس — نافذة تُطلب تلقائيًا عند أي عملية عكس/إلغاء لها أثر محاسبي أو مخزني
   • التاريخ إلزامي، والافتراضي = تاريخ العملية الأصلية (يرسله الخادم في needRevDate.def)
   • لا يسبق تاريخ العملية الأصلية ولا يتجاوز اليوم (التحقق النهائي في الخادم)
   • يعمل مع كل شاشات العكس دون تعديل كل واحدة: الخادم يطلب التاريخ، فتسأل api() ثم تُعيد الطلب
   ===================================================================== */
(()=>{
const css=`
#rvd{border:0;border-radius:18px;padding:0;width:min(420px,92vw);direction:rtl;font-family:inherit;box-shadow:0 24px 70px rgba(2,8,30,.4);color:var(--tx,#14213d);background:var(--card,#fff)}
#rvd::backdrop{background:rgba(10,15,35,.55);backdrop-filter:blur(3px)}
#rvd .in{padding:22px 22px 16px}
#rvd h3{margin:0 0 6px;font-size:18px;display:flex;align-items:center;gap:8px}
#rvd h3 svg{width:22px;height:22px;flex:none;color:#d97706}
#rvd p{margin:0 0 14px;font-size:13.5px;line-height:1.8;color:var(--mu,#55627f)}
#rvd label{display:block;font-size:13px;margin-bottom:6px;font-weight:600}
#rvd input{width:100%;box-sizing:border-box;padding:11px 12px;font:inherit;font-size:16px;border:1px solid var(--bd,#cfd6e6);border-radius:12px;background:transparent;color:inherit}
#rvd input:focus{outline:2px solid #0d6e6e;outline-offset:1px}
#rvd .hint{margin-top:8px;font-size:12px;color:var(--mu,#55627f)}
#rvd .err{color:#b3261e;font-size:12.5px;min-height:18px;margin-top:6px}
#rvd .btns{display:flex;gap:8px;justify-content:flex-start;padding:0 22px 20px}
#rvd button{font:inherit;cursor:pointer;border-radius:12px;padding:10px 20px;border:1px solid var(--bd,#cfd6e6);background:transparent;color:inherit}
#rvd button.pri{border:0;background:#0d6e6e;color:#fff}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const WARN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
window.revDateAsk=info=>new Promise(res=>{
  let d=document.getElementById('rvd');if(d)d.remove();
  d=document.createElement('dialog');d.id='rvd';
  d.innerHTML=`<div class="in"><h3>${WARN}تاريخ العكس</h3>
   <p>حدّد التاريخ الذي يُسجَّل به العكس (القيد وحركة المخزون). الافتراضي هو تاريخ العملية الأصلية.</p>
   <label for="rvd_i">تاريخ العكس</label><input id="rvd_i" type="date" min="${info.min}" max="${info.max}" value="${info.def}" required>
   <div class="hint">من ${info.min} إلى ${info.max} — لا يسبق العملية الأصلية ولا يتجاوز اليوم</div><div class="err" id="rvd_e"></div></div>
   <div class="btns"><button class="pri" type="button" id="rvd_ok">تأكيد العكس</button><button type="button" id="rvd_no">إلغاء</button></div>`;
  document.body.appendChild(d);
  const inp=d.querySelector('#rvd_i'),err=d.querySelector('#rvd_e');let done=false;
  const fin=v=>{if(done)return;done=true;try{d.close()}catch(e){}d.remove();res(v)};
  d.querySelector('#rvd_ok').onclick=()=>{const v=inp.value;
    if(!v){err.textContent='حدّد تاريخ العكس';return}
    if(v<info.min){err.textContent='لا يمكن أن يسبق تاريخ العملية الأصلية ('+info.min+')';return}
    if(v>info.max){err.textContent='لا يمكن أن يكون في المستقبل';return}
    fin(v)};
  d.querySelector('#rvd_no').onclick=()=>fin(null);
  d.addEventListener('cancel',e=>{e.preventDefault();fin(null)});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();d.querySelector('#rvd_ok').click()}});
  d.showModal();inp.focus();
});
})();
