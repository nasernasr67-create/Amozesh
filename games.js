'use strict';
/* بازی‌ها، آزمایشگاه و کارگاه پایه ششم */
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const sample=(a,n)=>shuffle(a).slice(0,n);
const pick=a=>a[rnd(0,a.length-1)];
const num=n=>fa(String(n).replace('-','−').replace('.','٫'));

/* ---------- موتورهای بازی ---------- */
function finish(id,score,text){S.best['g_'+id]=Math.max(S.best['g_'+id]||0,score);save();return `<div class="card"><div class="big">🏆</div><p style="text-align:center">${text}</p><button data-a="again">دوباره بازی کن</button></div>`}
const again=()=>openGame(cur()[1],true);
const info=(l,r)=>`<div class="card row"><span class="grow">${l}</span><b>${r||''}</b></div>`;

/* انتخاب جواب: سؤال‌های پشت سر هم */
function choiceGame(make,total,help){return{
 init:()=>({n:0,score:0,item:make(),picked:null}),
 draw(G,id){
  if(G.n===total)return html(this.name,finish(id,G.score,`${fa(G.score)} جواب درست از ${fa(total)}`),{again});
  const it=G.item;
  html(this.name,info(`سؤال ${fa(G.n+1)} از ${fa(total)}`,'⭐ '+fa(G.score))+`<div class="card"><div class="mut">${help}</div><h2 style="text-align:center;font-size:22px">${it.q}</h2>${it.o.map((o,i)=>`<button class="opt alt ${G.picked!==null?(i===it.a?'ok':i===G.picked?'no':''):''}" data-a="pick" data-v="${i}">${o}</button>`).join('')}${G.picked!==null?`<p class="mut">${it.why||''}</p><button data-a="next">بعدی</button>`:''}</div>`,
  {pick:v=>{if(G.picked!==null)return;G.picked=+v;if(G.picked===it.a)G.score++;render()},next:()=>{G.n++;G.picked=null;if(G.n<total)G.item=make();render()}})}}}
const deck=list=>{let d=[];return()=>{if(!d.length)d=shuffle(list);return d.pop()}};
const tfGame=list=>{const d=deck(list);return choiceGame(()=>{const[q,v,why]=d();return{q,o:['✅ درست','❌ غلط'],a:v?0:1,why}},10,'درست است یا غلط؟')};
const sortGame=sets=>{let d=[];return choiceGame(()=>{if(!d.length)d=shuffle(sets.flatMap(([title,groups])=>Object.entries(groups).flatMap(([g,items])=>items.map(x=>({title,q:x,o:Object.keys(groups),g})))));const x=d.pop();return{q:`${x.q}<div class="mut">${x.title}</div>`,o:x.o,a:x.o.indexOf(x.g)}},12,'این مورد در کدام دسته است؟')};

/* حافظه: پیدا کردن جفت‌ها */
function memoryGame(pairs){return{
 init:()=>({cards:shuffle(sample(pairs(),6).flatMap((p,i)=>[{t:p[0],k:i},{t:p[1],k:i}])),open:[],found:[],moves:0}),
 draw(G,id){
  if(G.found.length===6)return html(this.name,finish(id,Math.max(1,30-G.moves),`همه جفت‌ها را با ${fa(G.moves)} حرکت پیدا کردی.`),{again});
  html(this.name,info('کارت‌های مربوط به هم را پیدا کن','حرکت: '+fa(G.moves))+`<div class="cards">${G.cards.map((c,i)=>{const f=G.found.includes(c.k),o=f||G.open.includes(i);return `<button class="mem ${f?'ok':o?'up':''}" data-a="flip" data-v="${i}">${o?c.t:'؟'}</button>`}).join('')}</div>`,
  {flip:v=>{const i=+v;if(G.open.length>1||G.open.includes(i)||G.found.includes(G.cards[i].k))return;G.open.push(i);
   if(G.open.length===2){G.moves++;const[a,b]=G.open;if(G.cards[a].k===G.cards[b].k){G.found.push(G.cards[a].k);G.open=[]}else setTimeout(()=>{G.open=[];redraw(G)},1100)}render()}})}}}
const redraw=G=>{if(cur()[0]==='game'&&GS===G)render()};

/* مرتب کردن مرحله‌ها */
function orderGame(list){return{
 init(){const d=shuffle(list);return{d,r:0,done:[],pool:[],wrong:0,set:true}},
 draw(G,id){
  if(G.r===G.d.length)return html(this.name,finish(id,Math.max(1,20-G.wrong),`همه را مرتب کردی! تعداد اشتباه: ${fa(G.wrong)}`),{again});
  const[title,steps]=G.d[G.r];if(G.set){G.pool=shuffle(steps);G.done=[];G.set=false}
  const all=G.done.length===steps.length;
  html(this.name,info(title,`${fa(G.r+1)} از ${fa(G.d.length)}`)+`<div class="card">${G.done.map((x,i)=>`<div class="row"><span class="num">${fa(i+1)}</span><span class="grow">${x}</span></div>`).join('')||'<span class="mut">به ترتیب از اول روی گزینه‌ها بزن.</span>'}</div>${G.pool.map((x,i)=>`<button class="opt alt" data-a="put" data-v="${i}">${x}</button>`).join('')}${all?'<button data-a="next">آفرین! بعدی</button>':''}`,
  {put:i=>{if(G.pool[i]===steps[G.done.length]){G.done.push(...G.pool.splice(+i,1))}else{G.wrong++;toast('این مرحله هنوز نوبتش نیست')}render()},next:()=>{G.r++;G.set=true;render()}})}}}

/* ---------- ریاضی ---------- */
const speed={
 init:()=>({end:0,score:0,item:null,id:null}),
 make(){let a=rnd(2,12),b=rnd(2,12),k=rnd(0,3),q,r;
  if(k===0){q=`${a} × ${b}`;r=a*b}else if(k===1){q=`${a*b} ÷ ${a}`;r=b}else if(k===2){a=rnd(20,99);b=rnd(11,99);q=`${a} + ${b}`;r=a+b}else{a=rnd(50,150);b=rnd(11,49);q=`${a} − ${b}`;r=a-b}
  const o=new Set([r]);while(o.size<4){const x=r+pick([-10,-3,-2,-1,1,2,3,10]);if(x>=0)o.add(x)}return{q,r,o:shuffle([...o])}},
 draw(G,id){
  if(G.end&&Date.now()>=G.end){clearInterval(G.id);return html(this.name,finish(id,G.score,`امتیاز تو: ${fa(G.score)}`),{again})}
  if(!G.end)return html(this.name,`<div class="card"><p>در ۶۰ ثانیه هر چقدر می‌توانی جواب درست بده. جواب غلط یک امتیاز کم می‌کند.</p><button data-a="start">شروع</button></div>`,{start:()=>{G.end=Date.now()+60000;G.item=this.make();
   G.id=setInterval(()=>{if(cur()[0]!=='game'||GS!==G)return clearInterval(G.id);const e=$('#left');if(Date.now()>=G.end)render();else if(e)e.textContent=fa(Math.ceil((G.end-Date.now())/1000))},300);render()}});
  html(this.name,info(`⏱️ <span id="left">${fa(Math.ceil((G.end-Date.now())/1000))}</span> ثانیه`,'⭐ '+fa(G.score))+`<div class="big" dir="ltr">${fa(G.item.q)}</div><div class="grid">${G.item.o.map(o=>`<button class="tile" data-a="pick" data-v="${o}"><b>${fa(o)}</b></button>`).join('')}</div>`,
  {pick:v=>{if(+v===G.item.r)G.score++;else G.score=Math.max(0,G.score-1);G.item=this.make();render()}})}};

const frac=(a,b)=>`<span dir="ltr">${fa(a)}/${fa(b)}</span>`;
const compare=choiceGame(()=>{const k=rnd(0,2);let x,y;
 const one=()=>{if(k===0){const b=rnd(2,10),a=rnd(1,b-1);return{v:a/b,t:frac(a,b)}}if(k===1){const v=rnd(1,99)/pick([10,100]);return{v,t:num(v)}}const v=rnd(-20,10);return{v,t:`<span dir="ltr">${num(v)}</span>`}};
 x=one();do y=one();while(Math.abs(x.v-y.v)<1e-9);
 return{q:['کدام کسر بزرگ‌تر است؟','کدام عدد اعشاری بزرگ‌تر است؟','کدام عدد صحیح بزرگ‌تر است؟'][k],o:[x.t,y.t],a:x.v>y.v?0:1}},10,'عدد بزرگ‌تر را انتخاب کن');

const divide={
 init(){return this.round({r:0,score:0})},
 round(G){G.k=pick([2,3,5,9]);const yes=new Set(),no=new Set(),n=rnd(3,6);while(yes.size<n)yes.add(G.k*rnd(5,60));while(no.size<12-n){const x=rnd(11,400);if(x%G.k)no.add(x)}G.nums=shuffle([...yes,...no]);G.sel=[];G.checked=false;return G},
 draw(G,id){
  if(G.r===5)return html(this.name,finish(id,G.score,`${fa(G.score)} دور کاملاً درست از ۵ دور`),{again});
  const ok=G.nums.every((x,i)=>(x%G.k===0)===G.sel.includes(i));
  html(this.name,info(`همه عددهای بخش‌پذیر بر <b>${fa(G.k)}</b> را شکار کن 🎯`,`دور ${fa(G.r+1)} از ۵`)+`<div class="cards">${G.nums.map((x,i)=>`<button class="mem ${G.checked?(x%G.k===0?'ok':G.sel.includes(i)?'no':''):G.sel.includes(i)?'up':''}" data-a="sel" data-v="${i}">${fa(x)}</button>`).join('')}</div><p>${G.checked?(ok?'✅ عالی، همه درست بود':'❌ خانه‌های سبز جواب درست‌اند'):''}</p><button data-a="go">${G.checked?'دور بعد':'بررسی'}</button>`,
  {sel:v=>{if(G.checked)return;const i=+v;G.sel=G.sel.includes(i)?G.sel.filter(x=>x!==i):[...G.sel,i];render()},go:()=>{if(G.checked){G.r++;if(G.r<5)this.round(G)}else{G.checked=true;if(ok)G.score++}render()}})}};

const treasure={
 init:()=>({r:0,score:0,x:rnd(0,6),y:rnd(0,6),hit:null}),
 draw(G,id){
  if(G.r===8)return html(this.name,finish(id,G.score,`${fa(G.score)} گنج از ۸ گنج پیدا شد`),{again});
  let cells='';for(let y=6;y>=0;y--){cells+=`<i>${fa(y)}</i>`;for(let x=0;x<7;x++){const t=G.hit&&x===G.x&&y===G.y,m=G.hit&&G.hit[0]===x&&G.hit[1]===y;cells+=`<button class="${t?'ok':m?'no':''}" data-a="dig" data-v="${x}:${y}">${t?'💎':m?'✖':'•'}</button>`}}
  cells+='<i></i>'+[0,1,2,3,4,5,6].map(x=>`<i>${fa(x)}</i>`).join('');
  html(this.name,info(`گنج در طول <b>${fa(G.x)}</b> و عرض <b>${fa(G.y)}</b> است`,`${fa(G.r+1)} از ۸`)+`<div class="board" style="grid-template-columns:repeat(8,1fr)">${cells}</div>${G.hit?'<button data-a="next">گنج بعدی</button>':'<p class="mut">طول از چپ به راست و عرض از پایین به بالا است.</p>'}`,
  {dig:v=>{if(G.hit)return;G.hit=v.split(':').map(Number);if(G.hit[0]===G.x&&G.hit[1]===G.y)G.score++;render()},next:()=>{G.r++;G.hit=null;G.x=rnd(0,6);G.y=rnd(0,6);render()}})}};

/* ---------- ربات برنامه‌نویس: ردیف‌ها از بالا، S شروع، G هدف، # مانع ---------- */
const MAPS=[['.....','.....','S...G','.....','.....'],['....G','.....','.....','.....','S....'],['.....','..#..','S.#.G','..#..','.....'],['S....','####.','.....','.####','....G'],['..#.G','.##..','.....','.#.#.','S#...']];
const MOVES={U:[0,-1,'⬆️'],D:[0,1,'⬇️'],L:[-1,0,'⬅️'],R:[1,0,'➡️']};
const find=(m,c)=>{for(let y=0;y<5;y++){const x=m[y].indexOf(c);if(x>=0)return[x,y]}};
const robot={
 init:()=>({lv:0,cmd:[],pos:null,msg:'',run:false,won:false}),
 draw(G,id){
  if(G.lv===MAPS.length)return html(this.name,finish(id,MAPS.length,'همه مرحله‌ها را برنامه‌نویسی کردی! 🤖'),{again});
  const m=MAPS[G.lv],pos=G.pos||find(m,'S');
  let cells='';for(let y=0;y<5;y++)for(let x=0;x<5;x++)cells+=`<span>${pos[0]===x&&pos[1]===y?'🤖':m[y][x]==='#'?'🧱':m[y][x]==='G'?'🏁':''}</span>`;
  html(this.name,info('ربات را به پرچم برسان. اول دستورها را بچین، بعد اجرا کن.',`مرحله ${fa(G.lv+1)}`)+`<div class="board bot">${cells}</div><div class="card" dir="ltr">${G.cmd.map(c=>MOVES[c][2]).join(' ')||'…'}</div><div class="row" dir="ltr">${Object.entries(MOVES).map(([k,v])=>`<button class="alt grow" data-a="add" data-v="${k}">${v[2]}</button>`).join('')}</div><p>${G.msg}</p><div class="row wrap">${G.won?'<button data-a="next">مرحله بعد</button>':'<button data-a="run">▶ اجرا</button><button class="alt" data-a="undo">حذف آخری</button><button class="del" data-a="clear">پاک کردن</button>'}</div>`,
  {add:k=>{if(G.run||G.won||G.cmd.length>=30)return;G.cmd.push(k);G.pos=null;G.msg='';render()},
   undo:()=>{if(G.run)return;G.cmd.pop();G.pos=null;render()},clear:()=>{if(G.run)return;G.cmd=[];G.pos=null;G.msg='';render()},
   run:()=>{if(G.run||!G.cmd.length)return;G.run=true;G.msg='';G.pos=find(m,'S');let i=0;
    const stop=msg=>{G.run=false;G.msg=msg;redraw(G)};
    const step=()=>{if(cur()[0]!=='game'||GS!==G){G.run=false;G.pos=null;return}
     if(i===G.cmd.length)return stop('ربات به پرچم نرسید. برنامه را اصلاح کن.');
     const[dx,dy]=MOVES[G.cmd[i++]],x=G.pos[0]+dx,y=G.pos[1]+dy;
     if(x<0||y<0||x>4||y>4||m[y][x]==='#')return stop('برخورد! دستور شماره '+fa(i)+' را بررسی کن.');
     G.pos=[x,y];if(m[y][x]==='G'){G.won=true;return stop('🎉 رسیدی!')}
     redraw(G);setTimeout(step,350)};render();setTimeout(step,350)},
   next:()=>{Object.assign(G,{lv:G.lv+1,cmd:[],pos:null,msg:'',won:false});render()}})}};

/* ---------- داده‌های علوم ---------- */
const SCI_SORT=[['منابع انرژی',{'تجدیدپذیر':['باد','نور خورشید','آب جاری'],'تجدیدناپذیر':['نفت','گاز طبیعی','زغال‌سنگ']}],
['نقش در زنجیره غذایی',{'تولیدکننده':['درخت بلوط','علف','جلبک'],'مصرف‌کننده':['خرگوش','عقاب','روباه'],'تجزیه‌کننده':['قارچ روی چوب پوسیده','باکتری‌های خاک']}],
['نوع اثر نیرو',{'با تماس':['هل دادن میز','اصطکاک کفش با زمین','کشیدن طناب'],'بدون تماس':['گرانش زمین','کشش آهنربا از فاصله']}]];
const SCI_TF=[['پوسته ضخیم‌ترین لایه زمین است.',false,'پوسته نازک‌ترین لایه است.'],['گیاهان در فتوسنتز اکسیژن آزاد می‌کنند.',true,''],['اصطکاک همیشه مضر است.',false,'بدون اصطکاک نمی‌توانستیم راه برویم.'],['ورقه‌های زمین بسیار آهسته حرکت می‌کنند.',true,''],['انرژی می‌تواند از شکلی به شکل دیگر تبدیل شود.',true,''],['بخش بیرونی هسته زمین مایع است.',true,''],['همه میکروب‌ها بیماری‌زا هستند.',false,'بعضی میکروب‌ها سودمندند.'],['برای دیدن سلول‌های ریز از تلسکوپ استفاده می‌کنیم.',false,'میکروسکوپ مناسب است.'],['نیروی گرانش زمین بدون تماس هم اثر می‌کند.',true,''],['در آزمایش منصفانه همه چیز را با هم تغییر می‌دهیم.',false,'فقط یک عامل تغییر می‌کند.'],['نفت در چند سال دوباره ساخته می‌شود.',false,'ساخته شدن نفت میلیون‌ها سال طول می‌کشد.'],['ریشه درختان به حفظ خاک کمک می‌کند.',true,'']];
const SCI_PAIRS=()=>[['فتوسنتز','غذاسازی گیاه'],['اصطکاک','مخالف حرکت دو سطح'],['گرانش','کشش به سوی زمین'],['پوسته','لایه بیرونی زمین'],['میکروسکوپ','دیدن چیزهای ریز'],['تلسکوپ','دیدن آسمان دور'],['کلروفیل','ماده سبز برگ'],['تجزیه‌کننده','برگرداندن مواد به خاک'],['بازیافت','استفاده دوباره از مواد']];
const SCI_ORDER=[['مرحله‌های روش علمی',['مشاهده','طرح پرسش','فرضیه (حدس)','آزمایش','نتیجه‌گیری']],['لایه‌های زمین از بیرون به درون',['پوسته','گوشته','هسته بیرونی','هسته درونی']],['یک زنجیره غذایی',['علف','ملخ','قورباغه','مار','عقاب']],['ساختن کاغذ',['آماده کردن و خرد کردن چوب','ساختن خمیر','پهن کردن خمیر','فشردن','خشک کردن']]];

/* ---------- داده‌های کار و فناوری ---------- */
const TECH_SORT=[['وسیله‌های رایانه',{'ورودی':['صفحه‌کلید','موشواره','میکروفون','پویشگر (اسکنر)'],'خروجی':['نمایشگر','بلندگو','چاپگر']}],['نرم‌افزار یا سخت‌افزار؟',{'سخت‌افزار':['پردازنده','حافظه','باتری گوشی'],'نرم‌افزار':['بازی رایانه‌ای','مرورگر','اسکرچ']}],['رفتار در اینترنت',{'امن':['خبر دادن پیام مشکوک به والدین','پنهان نگه داشتن رمز از غریبه‌ها'],'ناامن':['فرستادن نشانی خانه برای ناشناس','باز کردن پیوند ناشناس']}]];
const TECH_TF=[['الگوریتم باید مرحله‌های روشن و مرتب داشته باشد.',true,''],['هوش مصنوعی هیچ‌وقت اشتباه نمی‌کند.',false,'باید پاسخ آن را بررسی کرد.'],['در روندنما، لوزی نشانه تصمیم‌گیری است.',true,''],['رمز خود را می‌توان به دوست اینترنتی ناشناس داد.',false,'رمز محرمانه است.'],['در اسکرچ می‌توان با بلوک تکرار، برنامه را کوتاه‌تر کرد.',true,''],['برای ساخت کاردستی برقی می‌توان از برق پریز استفاده کرد.',false,'برق شهر خطر مرگ دارد؛ فقط باتری کوچک.'],['با وصل مستقیم دو سر باتری، سیم می‌تواند داغ شود.',true,''],['آهنربای الکتریکی را می‌توان خاموش و روشن کرد.',true,''],['هر چه گلدان را بیشتر آب بدهیم بهتر است.',false,'آب زیاد ریشه را خراب می‌کند.'],['ماکت دقیق با مقیاس ساخته می‌شود.',true,'']];
const TECH_PAIRS=()=>[['الگوریتم','دستورهای مرحله‌ای'],['روندنما','نمایش الگوریتم با شکل'],['اسکرچ','برنامه‌نویسی بلوکی'],['اسپرایت','شخصیت در اسکرچ'],['حسگر','دریافت اطلاعات محیط'],['موتور','تولید حرکت'],['کلید','قطع و وصل مدار'],['اپ‌اینونتور','ساخت برنامه گوشی'],['جاسوزنی','جای امن سوزن']];
const TECH_ORDER=[['الگوریتم کاشت سبزی',['آماده کردن گلدان و خاک','پاشیدن بذر','پوشاندن بذر با کمی خاک','آب‌پاشی آرام','مراقبت و برداشت']],['مرحله‌های ساختن یک وسیله',['شناخت مسئله','ایده‌پردازی','کشیدن نقشه','ساختن نمونه','آزمایش و اصلاح']],['روندنمای میانگین دو عدد',['شروع','گرفتن دو عدد','جمع کردن دو عدد','تقسیم حاصل بر ۲','نمایش جواب','پایان']]];

const MATH_PAIRS=()=>[['۱/۲','۵۰٪'],['۱/۴','۰٫۲۵'],['۳/۴','۷۵٪'],['۱/۵','۰٫۲'],['۱/۱۰','۱۰٪'],['۲/۵','۰٫۴'],['۳/۱۰','۳۰٪'],['۳/۵','۰٫۶'],['۱','۱۰۰٪']].map(p=>p.map(x=>`<span dir="ltr">${x}</span>`));

const HUBS={math:{name:'ریاضی',icon:'📐',games:['speed','mmem','compare','divide','treasure']},sci:{name:'علوم تجربی',icon:'🔬',games:['ssort','smem','stf','sorder'],lab:'آزمایشگاه علوم'},tech:{name:'کار و فناوری',icon:'🛠️',games:['robot','tsort','tmem','ttf','torder'],lab:'کارگاه عملی'}};
window.HUBS_BY_NAME=Object.fromEntries(Object.entries(HUBS).map(([k,h])=>[h.name,k]));
const named=(g,name,icon)=>Object.assign(g,{name,icon});
const GAMES={speed:named(speed,'مسابقه سرعت','⚡'),mmem:named(memoryGame(MATH_PAIRS),'جفت‌های کسر و درصد','🃏'),compare:named(compare,'کدام بزرگ‌تر است؟','⚖️'),divide:named(divide,'شکار بخش‌پذیرها','🎯'),treasure:named(treasure,'گنج در مختصات','💎'),
 ssort:named(sortGame(SCI_SORT),'دسته‌بندی علمی','🧺'),smem:named(memoryGame(SCI_PAIRS),'حافظه علوم','🃏'),stf:named(tfGame(SCI_TF),'درست یا غلط','✅'),sorder:named(orderGame(SCI_ORDER),'مرتب کن','🔢'),
 robot:named(robot,'ربات برنامه‌نویس','🤖'),tsort:named(sortGame(TECH_SORT),'دسته‌بندی فناوری','🧺'),tmem:named(memoryGame(TECH_PAIRS),'حافظه فناوری','🃏'),ttf:named(tfGame(TECH_TF),'درست یا غلط ایمنی و فناوری','✅'),torder:named(orderGame(TECH_ORDER),'الگوریتم را بچین','🔢')};

let GS=null,GID=null;
function openGame(id,replace){GS=GAMES[id].init();GID=id;if(replace)render();else go('game',id)}
PAGES.game=id=>{if(GID!==id){GS=GAMES[id].init();GID=id}GAMES[id].draw(GS,id)};

/* ---------- آزمایش‌ها: عنوان، درس، وسایل، مرحله‌ها، پرسش، توضیح، ایمنی ---------- */
const E=(title,lesson,need,steps,q,why,safe='')=>({title,lesson,need,steps,q,why,safe});
const LABS={sci:[
E('حل شدن قند','زنگ علوم','دو لیوان، آب سرد و آب ولرم، دو حبه قند، ساعت',['در دو لیوان مقدار برابر آب بریز؛ یکی سرد و یکی ولرم.','هم‌زمان در هر کدام یک حبه قند بینداز و هم نزن.','زمان حل شدن هر کدام را بنویس.'],'قند در کدام زودتر حل شد؟ چه چیزهایی را ثابت نگه داشتی؟','معمولاً در آب گرم‌تر زودتر حل می‌شود. فقط دما را تغییر دادیم؛ پس آزمایش منصفانه است.'),
E('کاغذ بازیافتی','سرگذشت دفتر من و کارخانه کاغذسازی','کاغذ باطله، آب، تشت، توری، پارچه، مخلوط‌کن',['کاغذ را ریز کن و چند ساعت در آب بگذار.','بزرگ‌تر آن را با آب زیاد مخلوط کند تا خمیر شود.','خمیر را نازک روی توری پهن کن.','با پارچه آبش را بگیر و بگذار خشک شود.'],'کاغذ تو چه فرقی با کاغذ اول دارد؟','الیاف کاغذ در آب از هم جدا می‌شوند و هنگام خشک شدن دوباره به هم می‌چسبند.','مخلوط‌کن فقط به دست بزرگ‌تر.'),
E('مدل لایه‌های زمین','سفر به اعماق زمین','تخم‌مرغ آب‌پز سرد شده، بشقاب',['پوست تخم‌مرغ را کمی ترک بده.','از بزرگ‌تر بخواه آن را از وسط ببرد.','سه قسمت را با لایه‌های زمین مقایسه کن و شکلش را بکش.'],'هر قسمت را مدل کدام لایه می‌گیری؟','پوست مانند پوسته، سفیده مانند گوشته و زرده مانند هسته است. این فقط یک مدل است و اندازه و جنس لایه‌ها را دقیق نشان نمی‌دهد.','پختن و بریدن با بزرگ‌تر.'),
E('چین‌خوردن کوه','زمین پویا','دو یا سه حوله با رنگ‌های مختلف',['حوله‌ها را روی هم روی میز پهن کن.','دو طرف را آرام به سوی هم فشار بده.','تغییر شکل لایه‌ها را بکش.'],'وسط حوله‌ها چه شد؟','لایه‌ها چین خوردند و بالا آمدند. فشار ورقه‌های زمین هم در زمان بسیار طولانی می‌تواند رشته‌کوه بسازد.'),
E('اصطکاک روی سطح‌ها','ورزش و نیرو (۱)','تخته یا کتاب بزرگ، ماشین اسباب‌بازی، حوله، کاغذ، متر',['با تخته یک سطح شیب‌دار بساز.','ماشین را از یک نقطه ثابت و بدون هل دادن رها کن.','پایین شیب یک بار کاغذ و یک بار حوله پهن کن.','هر بار مسافت حرکت را اندازه بگیر؛ سه بار تکرار کن.'],'ماشین روی کدام سطح کمتر رفت؟','معمولاً روی حوله زودتر می‌ایستد، چون مقاومت در برابر حرکت آن بیشتر است.'),
E('کاغذ و مقاومت هوا','ورزش و نیرو (۲)','دو برگ کاغذ یک‌اندازه',['یک برگ را مچاله کن و دیگری را صاف نگه دار.','هر دو را هم‌زمان از یک ارتفاع رها کن.'],'کدام زودتر رسید؟ آیا وزنشان فرق داشت؟','وزن تقریباً برابر است، اما کاغذ صاف سطح بیشتری دارد و مقاومت هوا بیشتر آن را کند می‌کند.','برای رها کردن کاغذها روی صندلی نرو.'),
E('پل کاغذی','طراحی کنیم و بسازیم','دو کتاب هم‌اندازه، چند کاغذ، تعدادی سکه',['دو کتاب را با فاصله بگذار و یک کاغذ صاف رویشان قرار بده.','سکه‌ها را یکی‌یکی وسط آن بچین و بشمار.','کاغذ دیگری را بادبزنی تا کن و دوباره آزمایش کن.'],'کدام پل سکه بیشتری نگه داشت؟','تا زدن شکل کاغذ را عوض می‌کند و آن را در برابر خم شدن محکم‌تر می‌کند.'),
E('رنگ و جذب گرمای خورشید','سفر انرژی','دو لیوان یکسان، آب، کاغذ سیاه و سفید، دماسنج',['دور یک لیوان کاغذ سیاه و دور دیگری کاغذ سفید بپیچ.','آب برابر با دمای یکسان در آن‌ها بریز.','هر دو را نیم ساعت در آفتاب بگذار و دما را بسنج.'],'آب کدام گرم‌تر شد؟','سطح تیره نور بیشتری جذب می‌کند و معمولاً آب آن گرم‌تر می‌شود.','از دماسنج جیوه‌ای استفاده نکن.'),
E('ذره‌بین قطره آب','خیلی کوچک، خیلی بزرگ','طلق شفاف، قطره‌چکان یا قاشق، آب، یک نوشته ریز',['طلق را روی نوشته بگذار.','یک قطره آب روی طلق بچکان و از بالا نگاه کن.'],'حروف زیر قطره چگونه دیده می‌شوند؟','سطح خمیده قطره مانند یک عدسی ساده، نوشته را بزرگ‌تر نشان می‌دهد.'),
E('برگ و نور','شگفتی‌های برگ','گلدان سالم، تکه‌ای کاغذ آلومینیومی یا مقوای سیاه، گیره',['بخشی از یک برگ را آرام از دو طرف بپوشان؛ برگ را نکن.','گلدان را یک هفته در جای پرنور بگذار و آبیاری کن.','پوشش را بردار و دو بخش برگ را مقایسه کن.'],'آیا رنگ بخش پوشیده تغییر کرد؟','نور برای غذاسازی و ساختن ماده سبز برگ لازم است. ممکن است بخش پوشیده کم‌رنگ‌تر شود؛ مقدار تغییر در گیاهان فرق دارد.'),
E('جنگل و فرسایش خاک','جنگل برای کیست؟','دو سینی، خاک، یک تکه چمن با ریشه، آب، دو ظرف',['در یک سینی خاک خالی و در دیگری خاک با چمن بگذار.','هر دو را به یک اندازه کج کن.','آب برابر را آرام روی بالای هر کدام بریز.','رنگ آب جمع‌شده را مقایسه کن.'],'آب کدام گل‌آلودتر شد؟','ریشه‌ها و پوشش گیاهی خاک را نگه می‌دارند.','بعد از کار دست‌ها را بشوی.'),
E('فلفل و صابون','سالم بمانیم','بشقاب، آب، فلفل سیاه، مایع صابون',['در بشقاب آب بریز و کمی فلفل رویش بپاش.','نوک انگشت را به صابون بزن و وسط آب بگذار.'],'فلفل‌ها چه شدند؟','صابون کشش سطحی آب را تغییر می‌دهد و فلفل کنار می‌رود. فلفل‌ها میکروب نیستند؛ اما صابون هنگام شستن به جدا شدن آلودگی و میکروب از دست کمک می‌کند.','دست آلوده به فلفل را به چشم نزن.')],
tech:[
E('موتور الکتریکی ساده','پروژه ۱','باتری قلمی ۱٫۵ ولت، حدود یک متر سیم لاکی، دو سنجاق قفلی، آهنربا، کش، سنباده',['سیم را ۱۰ دور حلقه کن و دو سر آن را صاف از دو طرف بیرون بده.','با کمک بزرگ‌تر لاک یک سر را کامل و لاک سر دیگر را فقط از یک طرف (نیمه) سنباده بزن.','دو سنجاق را با کش به دو سر باتری ببند.','آهنربا را روی باتری بگذار و سیم‌پیچ را در حلقه سنجاق‌ها قرار بده.','با یک تلنگر آرام آن را راه بینداز.'],'اگر آهنربا را برداری چه می‌شود؟','نیروی میان سیم جریان‌دار و آهنربا سیم‌پیچ را می‌چرخاند.','با بزرگ‌تر انجام شود. سیم و باتری داغ می‌شوند؛ زود جدا کن. آهنربا را از دهان دور نگه دار. باتری قابل شارژ یا لیتیومی و برق پریز ممنوع.'),
E('پنکه دستی','پروژه ۲','موتور کوچک ۳ ولت، جاباتری دو قلمی، کلید، سیم، مقوا یا پره آماده، دسته',['جاباتری، کلید و موتور را پشت سر هم وصل کن؛ هنوز باتری نگذار.','موتور را محکم روی دسته بچسبان.','پره سبک را روی محور موتور سوار کن.','باتری بگذار و کلید را وصل کن.'],'اگر جای دو سیم موتور را عوض کنی چه می‌شود؟','جهت جریان و در نتیجه جهت چرخش موتور برعکس می‌شود.','مو و انگشت را از پره دور نگه دار. چسب حرارتی با بزرگ‌تر.'),
E('جرثقیل الکترومغناطیسی','پروژه ۳','میخ آهنی بزرگ، سیم روکش‌دار نازک، یک باتری قلمی در جاباتری، کلید فشاری، گیره کاغذ، مقوا و نخ',['سیم را ۳۰ دور منظم دور میخ بپیچ.','دو سر سیم را از راه کلید فشاری به جاباتری وصل کن.','برای میخ با مقوا و نخ یک بازوی جرثقیل بساز.','کلید را کوتاه فشار بده و گیره بردار.','دورها را ۶۰ تا کن و تعداد گیره‌ها را مقایسه کن.'],'تعداد دورها چه اثری داشت؟','در شرایط مشابه، دور بیشتر معمولاً آهنربای قوی‌تری می‌سازد.','کلید را فقط چند ثانیه نگه دار چون سیم و باتری داغ می‌شوند. برق پریز ممنوع.'),
E('توربین بادی','پروژه ۴','بطری یا مقوای محکم، کاغذ ضخیم برای پره، نی، سیخ چوبی با نوک بریده، چسب',['پایه‌ای محکم بساز و نی را افقی بالای آن بچسبان.','چهار پره هم‌اندازه ببر و به یک مرکز بچسبان.','مرکز را به سیخ وصل کن و سیخ را از نی بگذران.','با فوت یا پنکه با فاصله آزمایش کن؛ زاویه پره‌ها را تغییر بده.'],'با کدام زاویه تندتر چرخید؟','زاویه و شکل پره تعیین می‌کند باد چقدر آن را بچرخاند. این مدل برق تولید نمی‌کند؛ برای تولید برق مولد لازم است.','نوک تیز سیخ را ببرید؛ دست و صورت را از پنکه دور نگه دار.'),
E('گره مربع','مهارت ۱','دو تکه طناب با رنگ‌های متفاوت',['سر راست را روی سر چپ ببر و از زیر آن رد کن.','این بار سر چپ را روی سر راست ببر و از زیر آن رد کن.','دو سر را بکش تا گره محکم شود.'],'گره تو متقارن شده است؟','دو نیم‌گره در جهت مخالف، گره مربع می‌سازند. این گره برای بستن بسته مناسب است، نه تحمل وزن انسان.','طناب را دور بدن کسی نبند.'),
E('کوک شلال','مهارت ۲','پارچه، سوزن، نخ، قیچی',['روی پارچه یک خط راست بکش.','نخ را از سوزن رد کن و ته آن را گره بزن.','سوزن را با فاصله‌های برابر از زیر و روی پارچه رد کن.','در پایان نخ را پشت پارچه گره بزن.'],'فاصله کوک‌هایت برابر است؟','فاصله‌های برابر، دوخت را مرتب و یکنواخت می‌کند.','زیر نظر بزرگ‌تر؛ سوزن را در جاسوزنی بگذار.'),
E('کاشت سبزی','مهارت ۵','گلدان سوراخ‌دار، خاک، بذر شاهی یا تره‌تیزک، آب‌پاش',['گلدان را از خاک پر کن.','بذر را پخش کن و لایه‌ای بسیار نازک خاک رویش بریز.','با آب‌پاش خاک را مرطوب نگه دار.','هر روز قد جوانه‌ها را یادداشت کن.'],'اولین جوانه در چه روزی دیده شد؟','رطوبت و دمای مناسب جوانه‌زنی را آغاز می‌کند و پس از آن نور برای رشد لازم است.','بعد از کار با خاک دست‌ها را بشوی.'),
E('ماکت اتاق با مقیاس','مهارت ۱۱','متر، خط‌کش، مقوا، قیچی، چسب',['طول و عرض اتاقت را با متر اندازه بگیر.','هر ۱ متر را ۵ سانتی‌متر در نظر بگیر و اندازه‌ها را حساب کن.','کف و دیوارها را از مقوا ببر و بچسبان.','وسایل اصلی را هم با همان مقیاس بساز.'],'اتاق ۴ متری در ماکت چند سانتی‌متر شد؟','با مقیاس ثابت، تناسب اندازه‌ها حفظ می‌شود: ۴ متر برابر ۲۰ سانتی‌متر است.','کاتر فقط به دست بزرگ‌تر.')]};

PAGES.playroom=()=>html('بازی و آزمایش',`<div class="grid">${Object.entries(HUBS).map(([k,h])=>`<button class="tile" data-a="hub" data-v="${k}"><b>${h.icon}</b>${h.name}<div class="mut">${h.lab?'بازی و '+(k==='sci'?'آزمایش':'کارگاه'):'بازی‌ها'}</div></button>`).join('')}</div>`,{hub:k=>go('hub',k)});
PAGES.hub=k=>{const h=HUBS[k];html('بازی‌های '+h.name,(h.lab?`<p><button data-a="labs">🧪 ${h.lab} (${fa(LABS[k].length)} فعالیت)</button></p>`:'')+`<div class="grid">${h.games.map(id=>`<button class="tile" data-a="play" data-v="${id}"><b>${GAMES[id].icon}</b>${GAMES[id].name}<div class="mut">بهترین امتیاز: ${fa(S.best['g_'+id]||0)}</div></button>`).join('')}</div>`,{play:id=>openGame(id),labs:()=>go('labs',k)})};
const labState=(k,i)=>{S.lab=S.lab||{};const key=k+'|'+LABS[k][i].title;return S.lab[key]||(S.lab[key]={done:false,note:''})};
PAGES.labs=k=>html(HUBS[k].lab,LABS[k].map((x,i)=>`<div class="card row" data-a="open" data-v="${i}"><span class="num">${fa(i+1)}</span><div class="grow"><b>${x.title}</b><div class="mut">${x.lesson}</div></div>${labState(k,i).done?'✅':''}</div>`).join(''),{open:i=>go('lab',k,+i)});
PAGES.lab=(k,i)=>{const x=LABS[k][i],st=labState(k,i);
 html(x.title,(x.safe?`<div class="card warn">⚠️ <b>ایمنی:</b> ${x.safe}</div>`:'')+`<div class="card"><h2>وسایل لازم</h2>${x.need}</div><div class="card"><h2>مرحله‌ها</h2>${x.steps.map((s,j)=>`<div class="row" style="align-items:flex-start"><span class="num">${fa(j+1)}</span><span class="grow">${s}</span></div>`).join('')}</div><div class="card"><h2>فکر کن و بنویس</h2><p>${x.q}</p><textarea id="note" rows="4" placeholder="مشاهده من...">${esc(st.note)}</textarea><button class="alt" data-a="why">دیدن توضیح</button><p id="why" hidden>${x.why}</p></div><button data-a="done">${st.done?'✅ انجام شده':'این فعالیت را انجام دادم'}</button>`,
 {why:()=>$('#why').hidden=false,done:(_,b)=>{st.done=!st.done;save();b.textContent=st.done?'✅ انجام شده':'این فعالیت را انجام دادم'}});
 $('#note').oninput=e=>{st.note=e.target.value;save()};
};
