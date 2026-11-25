'use strict';
const $=s=>document.querySelector(s), view=$('#view');
const APP=window.APP_NAME||'برنامه درسی من';
const DAYS=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const fa=v=>String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const en=v=>String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

const fresh=()=>({v:1,dark:false,student:'',days:[0,1,2,3,4],table:{},plans:{},tasks:[],marks:[],grades:[],grade:6,read:{},best:{}});
let S=fresh();
try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem('school')||'{}'))}catch(e){}
function save(){try{localStorage.setItem('school',JSON.stringify(S))}catch(e){toast('ذخیره‌سازی انجام نشد')}}

/* تاریخ */
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fromIso=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c,12)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const today=()=>{const d=new Date();d.setHours(12,0,0,0);return d};
const dayIdx=d=>(d.getDay()+1)%7;
const weekStart=d=>addDays(d,-dayIdx(d));
const jalali=(d,o={day:'numeric',month:'long'})=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',o).format(d);
const daysLeft=s=>Math.round((fromIso(s)-today())/864e5);
const leftText=s=>{const n=daysLeft(s);return n===0?'امروز':n===1?'فردا':n>1?fa(n)+' روز مانده':fa(-n)+' روز گذشته'};
function dateOptions(sel){let h='';for(let i=0;i<270;i++){const d=addDays(today(),i),v=iso(d);h+=`<option value="${v}" ${v===sel?'selected':''}>${jalali(d,{weekday:'long',day:'numeric',month:'long'})}</option>`}
 if(sel&&daysLeft(sel)<0)h=`<option value="${sel}" selected>${jalali(fromIso(sel))}</option>`+h;return h}

/* پنجره‌ها */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2500)}
function modal(html,onOk,okText='ذخیره'){const f=$('#sheet');f.innerHTML=html+`<div class="row"><button>${okText}</button><button type="button" class="alt" id="cancel">انصراف</button></div>`;
 $('#modal').hidden=false;$('#cancel').onclick=closeModal;
 f.onsubmit=e=>{e.preventDefault();if(onOk(Object.fromEntries(new FormData(f)))!==false){closeModal();render()}}}
function closeModal(){$('#modal').hidden=true}
const ask=(msg,yes)=>modal(`<p>${esc(msg)}</p>`,()=>{yes();save()},'بله');
const field=(label,name,val='',extra='')=>`<label>${label}<input name="${name}" value="${esc(val)}" ${extra}></label>`;

/* مسیر صفحه‌ها */
const TABS=[['today','🏠','امروز'],['table','📚','کلاسی'],['plan','🗓️','برنامه‌ریزی'],['learn','🎓','آموزش'],['calc','🧮','ماشین‌حساب'],['more','🧰','بیشتر']];
let stack=[['today']];
const cur=()=>stack[stack.length-1];
function go(...r){stack.push(r);render();scrollTo(0,0)}
function tab(t){stack=t==='today'?[['today']]:[['today'],[t]];render();scrollTo(0,0)}
function goBack(){if(!$('#modal').hidden){closeModal();return true}if(stack.length>1){stack.pop();render();return true}return false}
window.goBack=goBack;
let acts={};
function html(title,h,a={}){$('#title').textContent=title;view.innerHTML=h;acts=a}
view.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&acts[b.dataset.a])acts[b.dataset.a](b.dataset.v,b)});
function render(){
 document.body.classList.toggle('dark',S.dark);
 const[r,...args]=cur();
 PAGES[r](...args);
 $('#back').hidden=stack.length<3;
 const root=(stack[1]||stack[0])[0];
 $('#nav').innerHTML=TABS.map(t=>`<button data-t="${t[0]}" class="${t[0]===root?'on':''}"><b>${t[1]}</b>${t[2]}</button>`).join('');
}
$('#nav').onclick=e=>{const b=e.target.closest('[data-t]');if(b)tab(b.dataset.t)};
$('#back').onclick=goBack;
const PAGES={};
const empty=t=>`<div class="card mut">${t}</div>`;
const chips=(items,sel,a)=>`<div class="chips">${items.map(([v,t])=>`<button data-a="${a}" data-v="${v}" class="${String(v)===String(sel)?'on':''}">${t}</button>`).join('')}</div>`;

/* امروز */
const periodRow=(p,i)=>`<div class="row"><span class="num">${fa(i+1)}</span><div class="grow"><b>${esc(p.s)}</b><div class="mut">${[p.f&&('از '+fa(p.f)),p.t&&('تا '+fa(p.t)),esc(p.n)].filter(Boolean).join(' ')}</div></div></div>`;
PAGES.today=()=>{
 const now=today(),di=dayIdx(now),tm=addDays(now,1),ti=dayIdx(tm);
 const list=S.table[di]||[],next=S.table[ti]||[];
 const plans=((S.plans[iso(weekStart(now))]||{})[di])||[];
 const due=S.tasks.filter(t=>!t.done).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,5);
 html(APP,`<div class="card"><h2>سلام${S.student?' '+esc(S.student):''} 👋</h2><div>${jalali(now,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div>
 <div class="card"><h2>زنگ‌های امروز</h2>${list.map(periodRow).join('')||'<div class="mut">برای امروز زنگی ثبت نشده است.</div>'}</div>
 <div class="card"><h2>برنامه‌ریزی امروز</h2>${plans.map(p=>`<div class="row ${p.done?'done':''}"><input type="checkbox" data-a="chk" data-v="${p.id}" ${p.done?'checked':''}><div class="grow">${p.time?fa(p.time)+' ، ':''}${esc(p.text)}</div></div>`).join('')||'<div class="mut">کاری برای امروز ننوشته‌ای.</div>'}</div>
 <div class="card"><h2>🎒 کیف فردا (${DAYS[ti]})</h2><div>${[...new Set(next.map(p=>p.s))].map(esc).join('، ')||'<span class="mut">فردا زنگی ثبت نشده است.</span>'}</div></div>
 <div class="card"><h2>تکلیف‌ها و امتحان‌ها</h2>${due.map(t=>`<div class="row"><div class="grow">${t.k==='exam'?'📝':'✏️'} ${esc(t.title)}</div><span class="mut">${leftText(t.d)}</span></div>`).join('')||'<div class="mut">چیزی در پیش نیست.</div>'}<button class="alt" data-a="tasks">مدیریت</button></div>`,
 {chk:id=>{const p=plans.find(x=>x.id===id);p.done=!p.done;save();render()},tasks:()=>go('tasks')});
};

/* برنامه کلاسی */
let selDay=null;
PAGES.table=()=>{
 if(selDay===null||!S.days.includes(selDay))selDay=S.days.includes(dayIdx(today()))?dayIdx(today()):S.days[0];
 const list=S.table[selDay]||(S.table[selDay]=[]);
 const edit=i=>{const p=i==null?{s:'',f:'',t:'',n:''}:list[i];
  modal(`<h3>${i==null?'زنگ جدید':'ویرایش زنگ '+fa(+i+1)} (${DAYS[selDay]})</h3>`+field('نام درس','s',p.s,'required list="subs"')+`<datalist id="subs">${['ریاضی','علوم تجربی','فارسی','نگارش','املا','مطالعات اجتماعی','هدیه‌های آسمان','قرآن','تفکر و پژوهش','کار و فناوری','هنر','ورزش'].map(x=>`<option value="${x}">`).join('')}</datalist>`+field('ساعت شروع (دلخواه)','f',p.f,'type="time"')+field('ساعت پایان (دلخواه)','t',p.t,'type="time"')+field('یادداشت، مثلاً نام معلم','n',p.n),
  v=>{if(!v.s.trim())return false;if(i==null)list.push(v);else list[i]=v;save()})};
 html('برنامه کلاسی',chips(S.days.map(d=>[d,DAYS[d]]),selDay,'day')+
 (list.map((p,i)=>`<div class="card">${periodRow(p,i)}<div class="row wrap"><button class="alt" data-a="edit" data-v="${i}">ویرایش</button><button class="alt" data-a="up" data-v="${i}" aria-label="بالا">▲</button><button class="alt" data-a="down" data-v="${i}" aria-label="پایین">▼</button><button class="del" data-a="del" data-v="${i}">حذف</button></div></div>`).join('')||empty('هنوز زنگی اضافه نشده است. هر تعداد زنگ که بخواهی می‌توانی بسازی.'))+
 `<div class="row wrap"><button data-a="add">+ افزودن زنگ</button><button class="alt" data-a="days">روزهای مدرسه</button><button class="alt" data-a="all">جدول کل هفته</button></div>`,
 {day:v=>{selDay=+v;render()},add:()=>edit(null),edit:i=>edit(+i),
  up:i=>{i=+i;if(i>0){[list[i-1],list[i]]=[list[i],list[i-1]];save();render()}},
  down:i=>{i=+i;if(i<list.length-1){[list[i+1],list[i]]=[list[i],list[i+1]];save();render()}},
  del:i=>ask('این زنگ حذف شود؟',()=>list.splice(+i,1)),
  all:()=>go('weekview'),
  days:()=>modal('<h3>کدام روزها مدرسه داری؟</h3>'+DAYS.map((d,i)=>`<label class="row"><input type="checkbox" name="d${i}" ${S.days.includes(i)?'checked':''}> ${d}</label>`).join(''),v=>{const n=DAYS.map((_,i)=>i).filter(i=>v['d'+i]);if(!n.length){toast('حداقل یک روز را انتخاب کن');return false}S.days=n;save()})});
};
PAGES.weekview=()=>{const max=Math.max(1,...S.days.map(d=>(S.table[d]||[]).length));
 html('جدول کل هفته',`<div class="card" style="overflow-x:auto"><table><tr><td><b>روز</b></td>${Array.from({length:max},(_,i)=>`<td><b>زنگ ${fa(i+1)}</b></td>`).join('')}</tr>${S.days.map(d=>`<tr><td><b>${DAYS[d]}</b></td>${Array.from({length:max},(_,i)=>`<td>${esc(((S.table[d]||[])[i]||{}).s||'-')}</td>`).join('')}</tr>`).join('')}</table></div>`)};

/* برنامه‌ریزی هفتگی */
let weekOff=0;
PAGES.plan=()=>{
 const start=addDays(weekStart(today()),weekOff*7),key=iso(start),w=S.plans[key]||{};
 const all=Object.values(w).flat(),done=all.filter(p=>p.done).length;
 const find=v=>{const[d,id]=v.split(':');return[d,w[d].findIndex(p=>p.id===id)]};
 const edit=(d,i)=>{const p=i==null?{text:'',time:'',day:d}:w[d][i];
  modal('<h3>کار برنامه</h3>'+field('چه کاری؟','text',p.text,'required')+`<label>روز<select name="day">${DAYS.map((n,j)=>`<option value="${j}" ${j==d?'selected':''}>${n}</option>`).join('')}</select></label>`+field('ساعت (دلخواه)','time',p.time,'type="time"'),
  v=>{if(!v.text.trim())return false;const wk=S.plans[key]||(S.plans[key]={});const item={id:p.id||uid(),text:v.text,time:v.time,done:!!p.done};
   if(i!=null&&v.day==d)wk[d][i]=item;else{if(i!=null)wk[d].splice(i,1);(wk[v.day]||(wk[v.day]=[])).push(item)}save()})};
 html('برنامه‌ریزی هفتگی',`<div class="card"><div class="row"><button class="alt" data-a="prev">قبلی</button><div class="grow" style="text-align:center"><b>${weekOff===0?'این هفته':weekOff===1?'هفته بعد':weekOff===-1?'هفته قبل':'هفته'}</b><div class="mut">${jalali(start)} تا ${jalali(addDays(start,6))}</div></div><button class="alt" data-a="next">بعدی</button></div>
 <progress style="width:100%" max="${all.length||1}" value="${done}"></progress><div class="mut">${fa(done)} از ${fa(all.length)} کار انجام شده</div></div>`+
 DAYS.map((n,d)=>`<div class="card"><div class="row"><h2 class="grow">${n} <span class="mut">${jalali(addDays(start,d))}</span></h2><button class="alt" data-a="add" data-v="${d}">+</button></div>${(w[d]||[]).map(p=>`<div class="row ${p.done?'done':''}"><input type="checkbox" data-a="chk" data-v="${d}:${p.id}" ${p.done?'checked':''}><div class="grow">${p.time?fa(p.time)+' ، ':''}${esc(p.text)}</div><button class="del" data-a="edit" data-v="${d}:${p.id}">✎</button><button class="del" data-a="del" data-v="${d}:${p.id}">✕</button></div>`).join('')}</div>`).join('')+
 `<button data-a="copy">کپی برنامه هفته قبل</button>`,
 {prev:()=>{weekOff--;render()},next:()=>{weekOff++;render()},add:d=>edit(d,null),
  edit:v=>{const[d,i]=find(v);edit(d,i)},
  chk:v=>{const[d,i]=find(v);w[d][i].done=!w[d][i].done;save();render()},
  del:v=>{const[d,i]=find(v);ask('این کار حذف شود؟',()=>w[d].splice(i,1))},
  copy:()=>{const p=S.plans[iso(addDays(start,-7))];if(!p||!Object.values(p).flat().length)return toast('هفته قبل برنامه‌ای ندارد');
   ask('کارهای هفته قبل به این هفته اضافه شوند؟',()=>{const wk=S.plans[key]||(S.plans[key]={});for(const d in p){wk[d]=wk[d]||[];for(const x of p[d])if(!wk[d].some(y=>y.text===x.text&&y.time===x.time))wk[d].push({...x,id:uid(),done:false})}})}});
};

/* آموزش */
function allGrades(){const m=new Map();for(const g of [...(window.BUILTIN_GRADES||[]),...S.grades])m.set(+g.grade,g);return [...m.values()].sort((a,b)=>a.grade-b.grade)}
const gradeObj=()=>allGrades().find(g=>+g.grade===+S.grade)||allGrades()[0];
const lkey=(g,s,l)=>g.grade+'|'+g.subjects[s].name+'|'+g.subjects[s].lessons[l].title;
PAGES.learn=()=>{const g=gradeObj();
 if(!g)return html('آموزش',empty('هنوز درسی نصب نشده است.'));
 html('آموزش',chips(allGrades().map(x=>[x.grade,esc(x.title)]),g.grade,'grade')+`<p><button data-a="play">🎮 بازی و آزمایش (پایه ششم)</button></p><div class="grid">${g.subjects.map((s,i)=>{const n=s.lessons.filter((_,j)=>S.read[lkey(g,i,j)]).length;return `<button class="tile" data-a="sub" data-v="${i}"><b>${esc(s.icon||'📘')}</b>${esc(s.name)}<div class="mut">${fa(n)} از ${fa(s.lessons.length)} خوانده شده</div></button>`}).join('')}</div>
 <p class="mut">این خلاصه‌ها برای مرور هستند و جای کتاب درسی را نمی‌گیرند.</p><button class="alt" data-a="imp">افزودن یا به‌روزرسانی پایه از فایل</button>`,
 {grade:v=>{S.grade=+v;save();render()},sub:i=>go('subject',+i),play:()=>go('playroom'),imp:importGrade});
};
PAGES.subject=s=>{const g=gradeObj(),sub=g.subjects[s];
 const hub=+g.grade===6?(window.HUBS_BY_NAME||{})[sub.name]:null;
 html(sub.name,(hub?'<p><button data-a="hub">🎮 بازی‌ها و فعالیت‌ها</button></p>':'')+sub.lessons.map((l,i)=>`<div class="card row" data-a="open" data-v="${i}"><span class="num">${fa(i+1)}</span><div class="grow">${esc(l.title)}</div>${S.read[lkey(g,s,i)]?'✅':''}</div>`).join(''),{open:i=>go('lesson',s,+i),hub:()=>go('hub',hub)})};
PAGES.lesson=(s,l)=>{const g=gradeObj(),x=g.subjects[s].lessons[l],k=lkey(g,s,l),q=x.quiz||[];
 html(x.title,`<div class="card lesson">${String(x.text).split('\n').map(t=>`<p>${esc(t)}</p>`).join('')}</div>
 ${q.map((it,i)=>`<div class="card"><b>سؤال ${fa(i+1)}: ${esc(it.q)}</b>${it.options.map((o,j)=>`<button class="opt alt" data-a="ans" data-v="${i}:${j}">${esc(o)}</button>`).join('')}</div>`).join('')}
 <button data-a="read">${S.read[k]?'✅ خوانده شده':'این درس را خواندم'}</button>`,
 {ans:(v,b)=>{const[i,j]=v.split(':').map(Number),box=b.parentElement;if(box.dataset.done)return;box.dataset.done=1;
   const bs=box.querySelectorAll('.opt');b.classList.add(j===q[i].answer?'ok':'no');bs[q[i].answer].classList.add('ok')},
  read:(_,b)=>{S.read[k]=!S.read[k];save();b.textContent=S.read[k]?'✅ خوانده شده':'این درس را خواندم'}});
};
function validGrade(g){return g&&Number.isInteger(g.grade)&&typeof g.title==='string'&&Array.isArray(g.subjects)&&g.subjects.length&&g.subjects.every(s=>typeof s.name==='string'&&Array.isArray(s.lessons)&&s.lessons.every(l=>typeof l.title==='string'&&typeof l.text==='string'&&(!l.quiz||(Array.isArray(l.quiz)&&l.quiz.every(q=>typeof q.q==='string'&&Array.isArray(q.options)&&q.answer>=0&&q.answer<q.options.length)))))}
function pickFile(cb){const f=$('#file');f.value='';f.onchange=()=>{const file=f.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{let d;try{d=JSON.parse(String(r.result).replace(/^﻿/,''))}catch(e){return toast('فایل درست نیست')}cb(d)};r.readAsText(file)};f.click()}
function importGrade(){pickFile(g=>{if(!validGrade(g))return toast('ساختار فایل درس درست نیست');S.grades=S.grades.filter(x=>x.grade!==g.grade).concat(g);S.grade=g.grade;save();render();toast(g.title+' اضافه شد')})}

/* ماشین حساب */
let expr='';
function evaluate(src){
 const s=src.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');let i=0;
 const eat=c=>s[i]===c&&++i;
 function sum(){let v=term();for(;;){if(eat('+'))v+=term();else if(eat('-'))v-=term();else return v}}
 function term(){let v=unary();for(;;){if(eat('*'))v*=unary();else if(eat('/'))v/=unary();else if(s[i]==='(')v*=unary();else return v}}
 function unary(){if(eat('-'))return -unary();if(eat('√'))return Math.sqrt(unary());return power()}
 function power(){let v=atom();if(eat('^'))v=Math.pow(v,unary());return v}
 function atom(){let v;if(eat('(')){v=sum();eat(')')}else{const m=/^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));if(!m)throw 0;i+=m[0].length;v=+m[0]}while(eat('%'))v/=100;return v}
 const v=sum();if(i<s.length||!isFinite(v))throw 0;return +v.toPrecision(12);
}
PAGES.calc=()=>{
 const keys=['C','(',')','⌫','√','^','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','00','0','.','='];
 const show=final=>{$('#expr').textContent=expr;let r='';if(expr)try{r=String(evaluate(expr))}catch(e){r=final?'عبارت نادرست است':''}$('#res').textContent=r;return r};
 html('ماشین حساب',`<div class="screen"><div id="expr"></div><div id="res"></div></div><div class="keys">${keys.map(k=>`<button data-a="k" data-v="${k}" class="${/[\d.]/.test(k)?'alt':''}">${k}</button>`).join('')}</div>`,
 {k:k=>{if(k==='C')expr='';else if(k==='⌫')expr=expr.slice(0,-1);else if(k==='='){const r=show(true);if(r&&!isNaN(r)&&!r.includes('e')){expr=r;$('#expr').textContent=expr;$('#res').textContent=''}return}else expr+=k;show()}});
 show();
};

/* بیشتر */
PAGES.more=()=>html('بیشتر',`<div class="grid">${[['tasks','✏️','تکلیف و امتحان'],['marks','⭐','ارزشیابی‌ها'],['timer','⏱️','زمان‌سنج مطالعه'],['times','✖️','جدول ضرب'],['quiz','🧠','تمرین ریاضی'],['settings','⚙️','تنظیمات و پشتیبان']].map(x=>`<button class="tile" data-a="open" data-v="${x[0]}"><b>${x[1]}</b>${x[2]}</button>`).join('')}</div>`,{open:v=>go(v)});

PAGES.tasks=()=>{
 const edit=t=>modal('<h3>تکلیف یا امتحان</h3>'+`<label>نوع<select name="k"><option value="hw">تکلیف</option><option value="exam" ${t&&t.k==='exam'?'selected':''}>امتحان</option></select></label>`+field('عنوان، مثلاً ریاضی صفحه ۲۰','title',t?t.title:'','required')+`<label>تاریخ<select name="d">${dateOptions(t?t.d:iso(addDays(today(),1)))}</select></label>`,
  v=>{if(!v.title.trim())return false;if(t)Object.assign(t,v);else S.tasks.push({...v,id:uid(),done:false});save()});
 const list=[...S.tasks].sort((a,b)=>a.done-b.done||a.d.localeCompare(b.d)),by=id=>S.tasks.find(t=>t.id===id);
 html('تکلیف و امتحان',`<p><button data-a="add">+ افزودن</button></p>`+(list.map(t=>`<div class="card row ${t.done?'done':''}"><input type="checkbox" data-a="chk" data-v="${t.id}" ${t.done?'checked':''}><div class="grow">${t.k==='exam'?'📝':'✏️'} ${esc(t.title)}<div class="mut">${jalali(fromIso(t.d))} (${leftText(t.d)})</div></div><button class="del" data-a="edit" data-v="${t.id}">✎</button><button class="del" data-a="del" data-v="${t.id}">✕</button></div>`).join('')||empty('موردی ثبت نشده است.')),
 {add:()=>edit(),edit:id=>edit(by(id)),chk:id=>{by(id).done=!by(id).done;save();render()},del:id=>ask('حذف شود؟',()=>S.tasks=S.tasks.filter(t=>t.id!==id))});
};
PAGES.marks=()=>html('ارزشیابی‌ها',`<p><button data-a="add">+ ثبت نتیجه</button></p>`+(S.marks.map(m=>`<div class="card row"><div class="grow"><b>${esc(m.s)}</b>: ${esc(m.r)}<div class="mut">${esc(m.n)} ${jalali(fromIso(m.d))}</div></div><button class="del" data-a="del" data-v="${m.id}">✕</button></div>`).join('')||empty('نتیجه‌ای ثبت نشده است.')),
 {add:()=>modal('<h3>ثبت ارزشیابی</h3>'+field('درس','s','','required')+`<label>نتیجه<select name="r">${['خیلی خوب','خوب','قابل قبول','نیاز به تلاش بیشتر'].map(x=>`<option>${x}</option>`).join('')}</select></label>`+field('توضیح (دلخواه)','n'),v=>{if(!v.s.trim())return false;S.marks.unshift({...v,id:uid(),d:iso(today())});save()}),
  del:id=>ask('حذف شود؟',()=>S.marks=S.marks.filter(m=>m.id!==id))});

const T={end:0,left:25*60,min:25,id:null};
const clock=n=>fa(String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'));
function tick(){if(T.end){T.left=Math.max(0,Math.round((T.end-Date.now())/1000));if(!T.left){T.end=0;clearInterval(T.id);if(navigator.vibrate)navigator.vibrate([500,200,500]);toast('وقت تمام شد 🎉')}}const e=$('#clock');if(e)e.textContent=clock(T.left)}
PAGES.timer=()=>html('زمان‌سنج مطالعه',`<div class="card"><div class="big" id="clock">${clock(T.left)}</div>${chips([5,15,25,45].map(m=>[m,fa(m)+' دقیقه']),T.min,'set')}<div class="row"><button data-a="start">${T.end?'توقف':'شروع'}</button><button class="alt" data-a="reset">از اول</button></div><p class="mut">برای شنیدن پایان زمان، برنامه را باز نگه دار؛ هنگام پایان گوشی می‌لرزد.</p></div>`,
 {set:m=>{clearInterval(T.id);T.min=+m;T.left=m*60;T.end=0;render()},start:()=>{clearInterval(T.id);if(T.end){tick();T.end=0}else{if(!T.left)T.left=T.min*60;T.end=Date.now()+T.left*1000;T.id=setInterval(tick,500)}render()},reset:()=>{clearInterval(T.id);T.end=0;T.left=T.min*60;render()}});

let tn=2;
PAGES.times=()=>html('جدول ضرب',chips(Array.from({length:12},(_,i)=>[i+1,fa(i+1)]),tn,'n')+`<div class="card"><table>${Array.from({length:10},(_,i)=>`<tr><td>${fa(tn)} × ${fa(i+1)}</td><td><b>${fa(tn*(i+1))}</b></td></tr>`).join('')}</table></div>`,{n:v=>{tn=+v;render()}});

const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const gcd=(a,b)=>b?gcd(b,a%b):a;
const KINDS={mul:'ضرب و تقسیم',pct:'درصد',frac:'ساده کردن کسر',dec:'اعداد اعشاری'};
function makeQ(k){
 if(k==='mul'){const a=rnd(2,12),b=rnd(2,25);return Math.random()<.5?{q:`${a} × ${b}`,a:String(a*b)}:{q:`${a*b} ÷ ${a}`,a:String(b)}}
 if(k==='pct'){const p=[10,20,25,50,75][rnd(0,4)],n=rnd(1,20)*20;return{q:`${p}% از ${n}`,a:String(p*n/100),rtl:1}}
 if(k==='dec'){const a=rnd(11,99),b=rnd(11,99);return{q:`${a/10} + ${b/10}`,a:String((a+b)/10)}}
 let a,b;do{b=rnd(3,12);a=rnd(1,b-1)}while(gcd(a,b)>1);const m=rnd(2,8);return{q:`${a*m}/${b*m}`,a:`${a}/${b}`}
}
let Q=null;
PAGES.quiz=()=>{
 const start=k=>{Q={k,n:0,score:0,item:makeQ(k),msg:''};render()};
 if(!Q)return html('تمرین ریاضی',`<div class="grid">${Object.entries(KINDS).map(([k,n])=>`<button class="tile" data-a="s" data-v="${k}">${n}<div class="mut">بهترین: ${fa(S.best[k]||0)} از ۱۰</div></button>`).join('')}</div>`,{s:start});
 if(Q.n===10)return html('نتیجه',`<div class="card"><div class="big">${fa(Q.score)} از ۱۰</div><p>${esc(Q.msg)}</p><p>${Q.score>=8?'عالی بود! 🌟':'آفرین که تمرین کردی. دوباره امتحان کن 💪'}</p><button data-a="again">انتخاب تمرین</button></div>`,{again:()=>{Q=null;render()}});
 html(KINDS[Q.k],`<div class="card"><div class="mut">سؤال ${fa(Q.n+1)} از ۱۰</div><div class="big" dir="${Q.item.rtl?'rtl':'ltr'}">${fa(Q.item.q)}</div><input id="ans" dir="ltr" inputmode="${Q.k==='frac'?'text':'decimal'}" placeholder="${Q.k==='frac'?'مثلاً 2/3':'جواب'}" autocomplete="off"><button data-a="ok">ثبت جواب</button><p>${esc(Q.msg)}</p><button class="del" data-a="quit">پایان تمرین</button></div>`,
 {ok:()=>{let v=en($('#ans').value).replace(/[٫]/g,'.').replace(/\s/g,'');if(!v)return;const right=Q.k==='frac'?v===Q.item.a:Math.abs(Number(v)-Number(Q.item.a))<1e-9;
   Q.score+=right?1:0;Q.msg=right?'✅ درست بود':'❌ جواب درست: '+fa(Q.item.a);Q.n++;if(Q.n===10){S.best[Q.k]=Math.max(S.best[Q.k]||0,Q.score);save()}else Q.item=makeQ(Q.k);render()},
  quit:()=>{Q=null;render()}});
};

function exportData(){const data=JSON.stringify(S),name='school-backup-'+iso(today())+'.json';
 if(window.Android)return Android.saveFile(name,data);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;a.click()}
window.onSaved=ok=>toast(ok?'فایل پشتیبان ذخیره شد':'ذخیره انجام نشد');
PAGES.settings=()=>html('تنظیمات و پشتیبان',`<div class="card"><h2>نام دانش‌آموز</h2>${esc(S.student)||'<span class="mut">ثبت نشده</span>'}<br><button class="alt" data-a="name">تغییر نام</button></div>
 <div class="card"><h2>ظاهر</h2><button class="alt" data-a="dark">${S.dark?'☀️ حالت روشن':'🌙 حالت تاریک'}</button></div>
 <div class="card"><h2>پشتیبان‌گیری</h2><p class="mut">گاهی پشتیبان بگیر. با حذف برنامه، اطلاعات پاک می‌شود.</p><div class="row wrap"><button data-a="exp">ذخیره پشتیبان</button><button class="alt" data-a="res">بازیابی</button></div></div>
 <div class="card"><h2>پایه‌های اضافه‌شده</h2>${S.grades.map(g=>`<div class="row"><div class="grow">${esc(g.title)}</div><button class="del" data-a="rm" data-v="${g.grade}">حذف</button></div>`).join('')||'<span class="mut">موردی نیست.</span>'}</div>`,
 {name:()=>modal(field('نام','n',S.student),v=>{S.student=v.n.trim();save()}),dark:()=>{S.dark=!S.dark;save();render()},exp:exportData,
  res:()=>pickFile(d=>{if(!d||d.v!==1||!Array.isArray(d.days)||!d.days.length||!Array.isArray(d.tasks))return toast('این فایل پشتیبان نیست');ask('اطلاعات فعلی با پشتیبان جایگزین شود؟',()=>S=Object.assign(fresh(),d))}),
  rm:g=>ask('این پایه حذف شود؟',()=>S.grades=S.grades.filter(x=>x.grade!==+g))});
render();
