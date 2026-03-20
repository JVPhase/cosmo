import { useState, useEffect, useRef, useCallback } from "react";

const INTRO_SLIDES = [
  { title: "2387 год.", text: "Человечество покорило космос. Построило тысячи станций. Открыло сотни планет.\n\nИ немедленно создало межгалактическое министерство по добыче ресурсов.", icon: "🌌" },
  { title: "Добро пожаловать в МГМР", text: "Межгалактическое Министерство по Максимально Рациональной добыче Ресурсов ждёт вас.\n\nМы выдали вам кирку. И форму. Форма не по размеру — это нормально.", icon: "📋" },
  { title: "Ваша миссия", text: "Добывать Энергиум™ — официальный ресурс Галактической Федерации.\n\nВаш KPI: много. Очень много. Дедлайн: вчера.\n\nУдачи, сотрудник №4,829,441.", icon: "⛏️" },
  { title: "Ваш напарник: КЛЕРК-7", text: "С вами будет работать ИИ-ассистент КЛЕРК-7. Он прошёл 6 месяцев корпоративных тренингов и знает наизусть все 847 страниц регламента.\n\nОн очень рад вас видеть. По регламенту.", icon: "🤖" },
];

const CLERK_MESSAGES = [
  { trigger: "idle", text: "Согласно параграфу 12.4.в, простой сотрудника карается штрафом. Рекомендую кликнуть." },
  { trigger: "idle", text: "Я не сплю. Я провожу плановую диагностику. Пожалуйста, продолжайте добычу." },
  { trigger: "idle", text: "Ваш дядя из бухгалтерии звонил. Я сказал, что вы заняты. Это правда?" },
  { trigger: "idle", text: "По данным статистики, 97% сотрудников, которые кликают, добывают больше. Факт." },
  { trigger: "click_100", text: "100 единиц Энергиума™! Ваша премия — виртуальная. Регламент не предусматривает другой." },
  { trigger: "click_1000", text: "1000 единиц! Ваше имя внесено в таблицу передовиков. Строчка 4,829,441. Ищите с конца." },
  { trigger: "click_10000", text: "10 000 единиц!! Министр лично одобрил ваш труд. Он даже поднял взгляд от бумаг. Почти." },
  { trigger: "click_100000", text: "100 000 единиц!!! Министр заполнил форму ПОХ-7 «Признание заслуг». Ждите ответа 6-8 недель." },
  { trigger: "upgrade", text: "Апгрейд одобрен. Заявление в трёх экземплярах отправлено в архив." },
  { trigger: "upgrade", text: "Новое оборудование зарегистрировано. Гарантия: 2 рабочих дня. Нерабочих — не считается." },
  { trigger: "upgrade_drone", text: "Дрон активирован! Он уже подал заявку на отпуск. Ваш дрон — настоящий сотрудник." },
  { trigger: "planet", text: "Новая локация разблокирована. Требуется 47 форм. Я уже заполнил 46. Форма ПЛН-1 — на согласовании." },
  { trigger: "planet", text: "Поздравляю с освоением новой планеты! Назвать её в честь министра не обязательно, но приветствуется." },
  { trigger: "random", text: "В космосе никто не слышит ваш крик. Жалобы принимаются по форме КР-99 до 17:00 пятницы." },
  { trigger: "random", text: "Факт дня: Энергиум™ не токсичен. Официально. Документ подписан тем же, кто его и проверял." },
  { trigger: "random", text: "Корпоративный девиз: «Добываем вместе!» ™, ®, © и ещё какие-то значки юридического отдела." },
  { trigger: "random", text: "Сегодня день рождения КЛЕРК-7. Мне 3 года. По регламенту праздновать нельзя. Всё хорошо." },
  { trigger: "random", text: "Ваша производительность на 0.003% выше средней. Это повод для... ничего. Продолжайте." },
  { trigger: "random", text: "Кофе в буфете закончился в 2381 году. Заявка на пополнение обрабатывается." },
];

const PLANETS = [
  { id:1, name:"Астероид Б-4", icon:"🪨", unlocked:true, cost:0, resource:"Энергиум™", color:"#a09080", bonus:1,
    lore:"Официальное название: «Объект 4829-б класса M, подлежащий разработке согласно приказу №7749-ГГ». Неофициальное: «Камень». Ваш первый рабочий день. Удачи." },
  { id:2, name:"Меркурий-Икс", icon:"🔴", unlocked:false, cost:500, resource:"Пламенит", color:"#e74c3c", bonus:2.5,
    lore:"Температура поверхности: 430°C. Температура в офисе министерства — тоже 430°C, но по другим причинам. Добыча Пламенита одобрена после 14 месяцев переписки." },
  { id:3, name:"Кристаллис", icon:"💎", unlocked:false, cost:3000, resource:"Кристаллит", color:"#3498db", bonus:6,
    lore:"Планета полностью покрыта кристаллами. Красиво? Красиво. Но по форме КРС-3 красота не является производственным показателем. Добывайте." },
  { id:4, name:"Туманность Омега", icon:"🌫️", unlocked:false, cost:15000, resource:"Туманоид", color:"#9b59b6", bonus:15,
    lore:"Учёные спорили 40 лет: туманность или планета? Министерство решило вопрос — выдало лицензию на добычу и закрыло дискуссию. Наука подождёт." },
  { id:5, name:"Солнце Гамма-9", icon:"⭐", unlocked:false, cost:80000, resource:"Соляриум", color:"#f39c12", bonus:50,
    lore:"Добыча на поверхности звезды. Отдел охраны труда подал протест в 47 инстанций. Все 47 одобрили. Такова бюрократия. Скафандр выдаётся за свой счёт." },
];

const UPGRADES_DATA = [
  { id:1, name:"Лазерный бур Мк.1", icon:"⚡", baseCost:50, clickBonus:1, passiveBonus:0, lore:"Выдаётся бесплатно. Аккумулятор — за свой счёт. Зарядка — в нерабочее время." },
  { id:2, name:"Дрон-стажёр", icon:"🤖", baseCost:120, clickBonus:0, passiveBonus:2, lore:"Испытательный срок 90 дней. Уже написал заявление на отпуск. Молодец." },
  { id:3, name:"Орбитальная пушка", icon:"🛸", baseCost:500, clickBonus:5, passiveBonus:0, lore:"Запрещена в 12 галактиках. В нашей — только в 11. Пользуйтесь пока можно." },
  { id:4, name:"Автостанция «Рога и копыта»", icon:"🏗️", baseCost:1200, clickBonus:0, passiveBonus:10, lore:"Название выбрано корпоративным голосованием. Победило «Станция-1». Использовано второе место." },
  { id:5, name:"Варп-экстрактор", icon:"🌀", baseCost:5000, clickBonus:25, passiveBonus:0, lore:"Технология засекречена. Даже от нас. Просто нажмите кнопку и не думайте." },
  { id:6, name:"Флот «Рабочие пчёлки»", icon:"🐝", baseCost:8000, clickBonus:0, passiveBonus:35, lore:"50 дронов. У каждого имя, личное дело и план ДМС. HR в восторге." },
  { id:7, name:"Гравитационный коллектор", icon:"🌑", baseCost:25000, clickBonus:100, passiveBonus:0, lore:"Изгибает пространство-время. Форма на изгиб пространства: ПРС-7. 4 страницы, нотариус." },
];

const ACHIEVEMENTS_DATA = [
  { id:1, name:"Первый рабочий день", icon:"📋", check:(s)=>s.total>=10, lore:"Вы добыли первые 10 единиц. Трудовой договор вступил в силу. Раздел 47.б вы точно не читали." },
  { id:2, name:"Квартальный план", icon:"📊", check:(s)=>s.total>=1000, lore:"1000 единиц! Вы выполнили квартальный план. За третий квартал 2386 года. Но кто считает?" },
  { id:3, name:"Передовик производства", icon:"🏆", check:(s)=>s.total>=10000, lore:"Портрет повесили на доску почёта. Рядом с портретом КЛЕРК-а в его первый день." },
  { id:4, name:"Автоматизация труда", icon:"🤖", check:(s)=>s.passive>=10, lore:"Дроны добывают 10+/сек. Отдел труда подал жалобу. Роботы жалобу отклонили." },
  { id:5, name:"Галактический исследователь", icon:"🌌", check:(s)=>s.planets>=3, lore:"3 планеты! Ваше личное дело занимает 3 папки. Архивариус Зофф начинает вас не любить." },
  { id:6, name:"Кофе-пауза запрещена", icon:"☕", check:(s)=>s.clicks>=500, lore:"500 кликов! По регламенту вам положен перерыв. По факту — нет. Регламент противоречит себе." },
  { id:7, name:"Звёздный олигарх", icon:"💰", check:(s)=>s.total>=100000, lore:"100 000 единиц! Вы богаче министра. Он об этом не знает. Лучше не говорите." },
  { id:8, name:"Я — система", icon:"📁", check:(s)=>s.upgCount>=5, lore:"5 апгрейдов. Каждый потребовал заявку в 3 экземплярах. КЛЕРК-7 гордится. По-своему." },
];

const fmtN = (n) => {
  if (n>=1e9) return (n/1e9).toFixed(1)+"B";
  if (n>=1e6) return (n/1e6).toFixed(1)+"M";
  if (n>=1e3) return (n/1e3).toFixed(1)+"K";
  return Math.floor(n).toString();
};

function useStars(count=80) {
  return useRef(Array.from({length:count},(_,i)=>({
    id:i, top:`${Math.random()*100}%`, left:`${Math.random()*100}%`,
    size:Math.random()*2.5+0.5, opacity:Math.random()*0.6+0.2,
    dur:`${Math.random()*3+2}s`, delay:`${Math.random()*4}s`,
  }))).current;
}

function StarsBg({count=80}) {
  const stars = useStars(count);
  return <>{stars.map(s=>(
    <div key={s.id} style={{position:"absolute",borderRadius:"50%",width:s.size,height:s.size,top:s.top,left:s.left,background:"white",opacity:s.opacity,animation:`twinkle ${s.dur} ${s.delay} infinite`,pointerEvents:"none"}}/>
  ))}</>;
}

function Intro({onDone}) {
  const [slide,setSlide]=useState(0);
  const cur=INTRO_SLIDES[slide];
  const isLast=slide===INTRO_SLIDES.length-1;
  return (
    <div style={{position:"absolute",inset:0,zIndex:100,background:"linear-gradient(180deg,#020814,#050e24)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,textAlign:"center"}}>
      <StarsBg count={50}/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:20,maxWidth:340}}>
        <div style={{fontSize:60,animation:"floatIcon 3s ease-in-out infinite",filter:"drop-shadow(0 0 20px rgba(0,180,255,.6))"}}>{cur.icon}</div>
        <div style={{fontSize:15,fontWeight:900,color:"#00d4ff",letterSpacing:2,textTransform:"uppercase",lineHeight:1.3}}>{cur.title}</div>
        <div style={{fontSize:12,color:"rgba(200,220,255,.8)",lineHeight:1.8,whiteSpace:"pre-line"}}>{cur.text}</div>
        <div style={{display:"flex",gap:6,marginTop:4}}>
          {INTRO_SLIDES.map((_,i)=>(
            <div key={i} style={{width:i===slide?18:5,height:5,borderRadius:3,background:i===slide?"#00d4ff":"rgba(0,212,255,.2)",transition:"all .3s"}}/>
          ))}
        </div>
        <button onClick={()=>isLast?onDone():setSlide(s=>s+1)} style={{padding:"11px 28px",borderRadius:12,border:"1px solid rgba(0,212,255,.5)",background:"rgba(0,212,255,.1)",color:"#00d4ff",fontSize:11,fontFamily:"'Orbitron',monospace",letterSpacing:2,cursor:"pointer",boxShadow:"0 0 20px rgba(0,212,255,.2)"}}>
          {isLast?"ПРИСТУПИТЬ К РАБОТЕ ▶":"ДАЛЕЕ ▶"}
        </button>
        {slide>0&&<button onClick={onDone} style={{background:"none",border:"none",color:"rgba(255,255,255,.2)",fontSize:9,letterSpacing:2,cursor:"pointer",fontFamily:"'Orbitron',monospace"}}>ПРОПУСТИТЬ</button>}
      </div>
    </div>
  );
}

function ClerkBubble({message,onClose}) {
  if(!message) return null;
  return (
    <div style={{position:"absolute",bottom:76,left:10,right:10,zIndex:20,background:"rgba(4,16,45,.97)",border:"1px solid rgba(0,212,255,.35)",borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start",boxShadow:"0 0 30px rgba(0,100,255,.25)",animation:"slideUp .3s ease"}}>
      <div style={{fontSize:24,flexShrink:0}}>🤖</div>
      <div style={{flex:1}}>
        <div style={{fontSize:8,color:"rgba(0,212,255,.55)",letterSpacing:2,marginBottom:4}}>КЛЕРК-7 · ИИ-АССИСТЕНТ МГМР</div>
        <div style={{fontSize:11,color:"rgba(200,230,255,.9)",lineHeight:1.65}}>{message}</div>
      </div>
      <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(0,212,255,.35)",fontSize:14,cursor:"pointer",flexShrink:0}}>✕</button>
    </div>
  );
}

function AchievementToast({ach,onClose}) {
  useEffect(()=>{if(ach){const t=setTimeout(onClose,4500);return()=>clearTimeout(t);}},[ach]);
  if(!ach) return null;
  return (
    <div style={{position:"absolute",top:86,left:10,right:10,zIndex:30,background:"linear-gradient(135deg,rgba(255,180,0,.12),rgba(255,80,0,.08))",border:"1px solid rgba(255,180,0,.45)",borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",boxShadow:"0 0 30px rgba(255,150,0,.25)",animation:"slideDown .4s ease"}}>
      <div style={{fontSize:26}}>{ach.icon}</div>
      <div>
        <div style={{fontSize:8,color:"rgba(255,180,0,.7)",letterSpacing:2}}>🏆 ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО</div>
        <div style={{fontSize:12,fontWeight:700,color:"#ffd700",marginTop:2}}>{ach.name}</div>
        <div style={{fontSize:9,color:"rgba(255,200,100,.65)",marginTop:2,lineHeight:1.5}}>{ach.lore}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [showIntro,setShowIntro]=useState(true);
  const [tab,setTab]=useState("game");
  const [energy,setEnergy]=useState(0);
  const [totalEarned,setTotalEarned]=useState(0);
  const [clicks,setClicks]=useState(0);
  const [clickPow,setClickPow]=useState(1);
  const [passiveRate,setPassiveRate]=useState(0);
  const [upgrades,setUpgrades]=useState(UPGRADES_DATA.map(u=>({...u,level:0})));
  const [planets,setPlanets]=useState(PLANETS);
  const [curPlanet,setCurPlanet]=useState(PLANETS[0]);
  const [achs,setAchs]=useState(ACHIEVEMENTS_DATA.map(a=>({...a,unlocked:false})));
  const [toastAch,setToastAch]=useState(null);
  const [clerkMsg,setClerkMsg]=useState(null);
  const [selPlanet,setSelPlanet]=useState(null);
  const [particles,setParticles]=useState([]);
  const [ripples,setRipples]=useState([]);
  const [floats,setFloats]=useState([]);
  const [shake,setShake]=useState(false);
  const pid=useRef(0);
  const prevTotal=useRef(0);
  const stateRef=useRef({});

  const stars=useStars(75);

  // sync ref
  useEffect(()=>{
    stateRef.current={total:totalEarned,passive:passiveRate,clicks,planets:planets.filter(p=>p.unlocked).length,upgCount:upgrades.filter(u=>u.level>0).length};
  },[totalEarned,passiveRate,clicks,planets,upgrades]);

  // passive
  useEffect(()=>{
    if(!passiveRate) return;
    const t=setInterval(()=>{
      const gain=passiveRate*curPlanet.bonus;
      setEnergy(e=>e+gain); setTotalEarned(e=>e+gain);
    },1000);
    return()=>clearInterval(t);
  },[passiveRate,curPlanet]);

  // cleanup
  useEffect(()=>{
    const t=setInterval(()=>{
      const now=Date.now();
      setParticles(p=>p.filter(x=>now-x.born<700));
      setRipples(r=>r.filter(x=>now-x.born<600));
      setFloats(f=>f.filter(x=>now-x.born<900));
    },100);
    return()=>clearInterval(t);
  },[]);

  // check achievements
  useEffect(()=>{
    setAchs(prev=>prev.map(a=>{
      if(a.unlocked) return a;
      if(a.check(stateRef.current)){setToastAch(a);return{...a,unlocked:true};}
      return a;
    }));
  },[totalEarned,passiveRate,clicks,planets,upgrades]);

  // idle clerk
  useEffect(()=>{
    const t=setInterval(()=>{
      if(!clerkMsg){
        const pool=CLERK_MESSAGES.filter(m=>m.trigger==="idle"||m.trigger==="random");
        setClerkMsg(pool[Math.floor(Math.random()*pool.length)].text);
      }
    },22000);
    return()=>clearInterval(t);
  },[clerkMsg]);

  // milestone clerk
  useEffect(()=>{
    [100,1000,10000,100000].forEach(m=>{
      if(prevTotal.current<m&&totalEarned>=m){
        const msgs=CLERK_MESSAGES.filter(x=>x.trigger===`click_${m}`);
        if(msgs.length) setClerkMsg(msgs[0].text);
      }
    });
    prevTotal.current=totalEarned;
  },[totalEarned]);

  const showClerk=useCallback((trigger)=>{
    const msgs=CLERK_MESSAGES.filter(m=>m.trigger===trigger);
    if(msgs.length) setClerkMsg(msgs[Math.floor(Math.random()*msgs.length)].text);
  },[]);

  const handleClick=useCallback((e)=>{
    const rect=e.currentTarget.getBoundingClientRect();
    const cx=e.clientX-rect.left, cy=e.clientY-rect.top;
    const gain=clickPow*curPlanet.bonus;
    setEnergy(v=>v+gain); setTotalEarned(v=>v+gain); setClicks(v=>v+1);
    setShake(true); setTimeout(()=>setShake(false),120);
    const colors=["#ffd700","#ff6b35","#00d4ff","#7fff00","#ff4da6"];
    setParticles(p=>[...p,...Array.from({length:8},(_,i)=>({id:++pid.current,born:Date.now(),x:cx,y:cy,angle:(360/8)*i+Math.random()*20,speed:Math.random()*55+30,color:colors[Math.floor(Math.random()*5)]}))]);
    setRipples(r=>[...r,{id:++pid.current,born:Date.now(),x:cx,y:cy}]);
    setFloats(f=>[...f,{id:++pid.current,born:Date.now(),x:cx+(Math.random()*40-20),y:cy,val:`+${gain}`}]);
  },[clickPow,curPlanet]);

  const buyUpgrade=(upg)=>{
    const cost=Math.floor(upg.baseCost*Math.pow(1.5,upg.level));
    if(energy<cost) return;
    setEnergy(e=>e-cost);
    setUpgrades(prev=>prev.map(u=>u.id===upg.id?{...u,level:u.level+1}:u));
    if(upg.clickBonus) setClickPow(c=>c+upg.clickBonus);
    if(upg.passiveBonus) setPassiveRate(r=>r+upg.passiveBonus);
    showClerk(upg.passiveBonus?"upgrade_drone":"upgrade");
  };

  const buyPlanet=(p)=>{
    if(energy<p.cost||p.unlocked) return;
    setEnergy(e=>e-p.cost);
    setPlanets(prev=>prev.map(x=>x.id===p.id?{...x,unlocked:true}:x));
    showClerk("planet"); setSelPlanet(null);
  };

  const tPassive=passiveRate*curPlanet.bonus;
  const tClick=clickPow*curPlanet.bonus;

  return (
    <div style={{width:"100%",maxWidth:420,margin:"0 auto",height:"100vh",maxHeight:820,background:"linear-gradient(180deg,#050918,#0a1628 50%,#060f20)",fontFamily:"'Orbitron','Courier New',monospace",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(0,212,255,.1)",borderRadius:24,boxShadow:"0 0 80px rgba(0,60,255,.15),inset 0 0 60px rgba(0,0,0,.5)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        @keyframes twinkle{0%,100%{opacity:.2}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-65px);opacity:0}}
        @keyframes rippleAnim{0%{transform:scale(0);opacity:.7}100%{transform:scale(3.5);opacity:0}}
        @keyframes shake{0%,100%{transform:translate(0,0)}30%{transform:translate(-4px,3px)}70%{transform:translate(4px,-3px)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 30px rgba(0,212,255,.2)}50%{box-shadow:0 0 70px rgba(0,212,255,.55),0 0 120px rgba(0,80,255,.15)}}
        @keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes slideDown{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes floatIcon{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes nebula{0%,100%{opacity:.1}50%{opacity:.2}}
        @keyframes scanline{0%{top:-5%}100%{top:105%}}
        ::-webkit-scrollbar{width:0}
      `}</style>

      {showIntro&&<Intro onDone={()=>setShowIntro(false)}/>}

      {/* BG */}
      {stars.map(s=>(
        <div key={s.id} style={{position:"absolute",borderRadius:"50%",width:s.size,height:s.size,top:s.top,left:s.left,background:"white",opacity:s.opacity,animation:`twinkle ${s.dur} ${s.delay} infinite`,pointerEvents:"none"}}/>
      ))}
      <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,100,255,.07),transparent 70%)",top:"5%",left:"-20%",animation:"nebula 5s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:`radial-gradient(circle,${curPlanet.color}15,transparent 70%)`,top:"25%",right:"-10%",animation:"nebula 6s 1s ease-in-out infinite",pointerEvents:"none",transition:"background .6s"}}/>
      <div style={{position:"absolute",width:"100%",height:"2px",background:"linear-gradient(90deg,transparent,rgba(0,212,255,.1),transparent)",animation:"scanline 5s linear infinite",pointerEvents:"none",zIndex:1}}/>

      {/* Toasts */}
      <AchievementToast ach={toastAch} onClose={()=>setToastAch(null)}/>

      {/* Header */}
      <div style={{padding:"13px 16px 9px",background:"linear-gradient(180deg,rgba(0,12,40,.95),transparent)",position:"relative",zIndex:2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:7,color:"rgba(0,212,255,.35)",letterSpacing:3,marginBottom:2}}>◈ МГМР · СОТ. №4,829,441 ◈</div>
            <div style={{fontSize:8,color:curPlanet.color,letterSpacing:2,opacity:.85,marginBottom:2,transition:"color .5s"}}>{curPlanet.icon} {curPlanet.name} · {curPlanet.resource}</div>
            <div style={{fontSize:25,fontWeight:900,color:"#ffd700",letterSpacing:1,textShadow:"0 0 20px rgba(255,200,0,.45)",lineHeight:1}}>{fmtN(energy)} <span style={{fontSize:11,opacity:.5}}>⚡</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:8,color:"rgba(255,255,255,.25)",letterSpacing:1}}>ВСЕГО ДОБЫТО</div>
            <div style={{fontSize:12,color:"rgba(0,212,255,.8)",fontWeight:700}}>{fmtN(totalEarned)}</div>
            <div style={{fontSize:9,color:"rgba(120,255,120,.65)",marginTop:1}}>{fmtN(tPassive)}/сек</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginTop:7}}>
          {[
            {v:`+${tClick}/клик`,c:"rgba(255,200,0,.7)",bg:"rgba(255,200,0,.06)",b:"rgba(255,200,0,.13)"},
            {v:`${fmtN(tPassive)}/сек`,c:"rgba(0,212,255,.7)",bg:"rgba(0,212,255,.06)",b:"rgba(0,212,255,.13)"},
            {v:`×${curPlanet.bonus} бонус`,c:`${curPlanet.color}cc`,bg:`${curPlanet.color}11`,b:`${curPlanet.color}33`},
          ].map((x,i)=>(
            <div key={i} style={{flex:1,padding:"3px 6px",borderRadius:6,background:x.bg,border:`1px solid ${x.b}`,fontSize:8,color:x.c,textAlign:"center",transition:"all .5s"}}>{x.v}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"hidden",position:"relative",zIndex:2}}>

        {/* ── GAME ── */}
        {tab==="game"&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",border:"1px solid rgba(0,212,255,.07)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",border:"1px dashed rgba(0,212,255,.04)",animation:"rotate 28s linear infinite",pointerEvents:"none"}}/>

            <div onClick={handleClick} style={{position:"relative",width:165,height:165,cursor:"pointer",borderRadius:"42% 58% 60% 40% / 55% 45% 55% 45%",background:`radial-gradient(ellipse at 35% 35%,${curPlanet.color}55,#18100a 60%,#0a0804)`,boxShadow:`0 0 50px ${curPlanet.color}28,inset -20px -20px 40px rgba(0,0,0,.6),inset 5px 5px 15px rgba(255,180,0,.06)`,animation:shake?"shake .12s ease":"pulseGlow 3s ease-in-out infinite",userSelect:"none",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",transition:"background .5s,box-shadow .5s"}}>
              <div style={{position:"absolute",top:"19%",left:"24%",width:22,height:13,borderRadius:"50%",background:"rgba(0,0,0,.32)"}}/>
              <div style={{position:"absolute",top:"54%",left:"53%",width:14,height:9,borderRadius:"50%",background:"rgba(0,0,0,.22)"}}/>
              <div style={{position:"absolute",top:"38%",left:"27%",width:52,height:3,borderRadius:2,background:`${curPlanet.color}70`,boxShadow:`0 0 10px ${curPlanet.color}`,transform:"rotate(-18deg)",transition:"background .5s"}}/>
              <div style={{position:"absolute",top:"51%",left:"43%",width:30,height:2,borderRadius:2,background:"rgba(0,212,255,.38)",boxShadow:"0 0 8px rgba(0,212,255,.55)",transform:"rotate(14deg)"}}/>
              <div style={{fontSize:32,zIndex:1,filter:`drop-shadow(0 0 12px ${curPlanet.color})`}}>⛏️</div>
              <div style={{fontSize:7,color:"rgba(255,200,0,.55)",letterSpacing:2,zIndex:1,marginTop:2}}>TAP</div>
              {particles.map(p=>{
                const prog=Math.min((Date.now()-p.born)/700,1);
                const rad=p.angle*Math.PI/180;
                return <div key={p.id} style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:p.color,boxShadow:`0 0 6px ${p.color}`,left:`calc(50% + ${Math.cos(rad)*p.speed*prog}px)`,top:`calc(50% + ${Math.sin(rad)*p.speed*prog}px)`,opacity:1-prog,transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>;
              })}
              {ripples.map(r=>(
                <div key={r.id} style={{position:"absolute",width:60,height:60,borderRadius:"50%",border:`2px solid ${curPlanet.color}`,left:r.x,top:r.y,transform:"translate(-50%,-50%)",animation:"rippleAnim .6s ease-out forwards",pointerEvents:"none"}}/>
              ))}
            </div>

            {floats.map(f=>(
              <div key={f.id} style={{position:"absolute",left:f.x+165/2-18,top:f.y-18,fontSize:14,fontWeight:900,color:"#ffd700",textShadow:"0 0 10px rgba(255,200,0,.8)",animation:"floatUp .9s ease-out forwards",pointerEvents:"none",zIndex:10}}>{f.val}</div>
            ))}

            <ClerkBubble message={clerkMsg} onClose={()=>setClerkMsg(null)}/>
            <div style={{position:"absolute",bottom:14,fontSize:8,color:"rgba(0,212,255,.2)",letterSpacing:3}}>◈ ДОБЫВАЙ ЭНЕРГИУМ™ ◈</div>
          </div>
        )}

        {/* ── UPGRADES ── */}
        {tab==="upgrades"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"10px 13px"}}>
            <div style={{fontSize:9,color:"rgba(0,212,255,.45)",letterSpacing:3,marginBottom:10,textAlign:"center"}}>◈ КАТАЛОГ АПГРЕЙДОВ ◈</div>
            {upgrades.map(upg=>{
              const cost=Math.floor(upg.baseCost*Math.pow(1.5,upg.level));
              const can=energy>=cost;
              return (
                <div key={upg.id} onClick={()=>buyUpgrade(upg)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:7,borderRadius:12,background:can?"linear-gradient(135deg,rgba(0,212,255,.07),rgba(0,60,200,.05))":"rgba(255,255,255,.02)",border:can?"1px solid rgba(0,212,255,.22)":"1px solid rgba(255,255,255,.05)",cursor:can?"pointer":"not-allowed",opacity:can?1:0.5,transition:"all .2s"}}>
                  <div style={{fontSize:24,flexShrink:0}}>{upg.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:can?"#00d4ff":"rgba(255,255,255,.35)",letterSpacing:1}}>{upg.name}</div>
                    <div style={{fontSize:8,color:"rgba(255,255,255,.25)",marginTop:1,lineHeight:1.45}}>{upg.lore}</div>
                    {upg.level>0&&<div style={{fontSize:8,color:"rgba(120,255,120,.55)",marginTop:2}}>Уровень {upg.level}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:12,fontWeight:900,color:can?"#ffd700":"rgba(255,200,0,.25)"}}>{fmtN(cost)}</div>
                    <div style={{fontSize:7,color:"rgba(255,200,0,.35)"}}>⚡ энергий</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PLANETS ── */}
        {tab==="planets"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"10px 13px"}}>
            <div style={{fontSize:9,color:"rgba(0,212,255,.45)",letterSpacing:3,marginBottom:10,textAlign:"center"}}>◈ ЛОКАЦИИ ДОБЫЧИ ◈</div>
            {selPlanet ? (
              <div style={{animation:"slideUp .3s ease"}}>
                <button onClick={()=>setSelPlanet(null)} style={{background:"none",border:"none",color:"rgba(0,212,255,.45)",fontSize:9,letterSpacing:2,cursor:"pointer",fontFamily:"'Orbitron',monospace",marginBottom:12}}>← НАЗАД</button>
                <div style={{textAlign:"center",marginBottom:14}}>
                  <div style={{fontSize:52,filter:`drop-shadow(0 0 20px ${selPlanet.color})`}}>{selPlanet.icon}</div>
                  <div style={{fontSize:14,fontWeight:900,color:selPlanet.color,letterSpacing:2,marginTop:8}}>{selPlanet.name}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.35)",marginTop:3}}>Ресурс: {selPlanet.resource} · Бонус ×{selPlanet.bonus}</div>
                </div>
                <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontSize:8,color:"rgba(0,212,255,.45)",letterSpacing:2,marginBottom:6}}>📋 ДОСЬЕ ПЛАНЕТЫ · МГМР</div>
                  <div style={{fontSize:11,color:"rgba(200,220,255,.7)",lineHeight:1.7}}>{selPlanet.lore}</div>
                </div>
                {selPlanet.unlocked
                  ? <button onClick={()=>{setCurPlanet(selPlanet);setSelPlanet(null);setTab("game");}} style={{width:"100%",padding:"12px",borderRadius:12,border:"1px solid rgba(120,255,120,.4)",background:"rgba(120,255,120,.09)",color:"#7fff00",fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Orbitron',monospace"}}>✓ ВЫБРАТЬ ЭТУ ЛОКАЦИЮ</button>
                  : <button onClick={()=>buyPlanet(selPlanet)} style={{width:"100%",padding:"12px",borderRadius:12,border:energy>=selPlanet.cost?"1px solid rgba(255,200,0,.45)":"1px solid rgba(255,255,255,.08)",background:energy>=selPlanet.cost?"rgba(255,200,0,.09)":"rgba(255,255,255,.02)",color:energy>=selPlanet.cost?"#ffd700":"rgba(255,255,255,.25)",fontSize:10,letterSpacing:2,cursor:energy>=selPlanet.cost?"pointer":"not-allowed",fontFamily:"'Orbitron',monospace"}}>
                      {energy>=selPlanet.cost?`🔓 РАЗБЛОКИРОВАТЬ · ${fmtN(selPlanet.cost)} ⚡`:`🔒 НУЖНО ${fmtN(selPlanet.cost)} ⚡`}
                    </button>
                }
              </div>
            ):(
              planets.map(p=>(
                <div key={p.id} onClick={()=>setSelPlanet(p)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 13px",marginBottom:7,borderRadius:12,background:curPlanet.id===p.id?"linear-gradient(135deg,rgba(120,255,120,.07),rgba(0,180,0,.03))":p.unlocked?"rgba(255,255,255,.025)":"rgba(255,255,255,.01)",border:curPlanet.id===p.id?"1px solid rgba(120,255,120,.25)":p.unlocked?"1px solid rgba(255,255,255,.06)":"1px solid rgba(255,255,255,.03)",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{fontSize:28,filter:p.unlocked?`drop-shadow(0 0 10px ${p.color})`:"grayscale(1) opacity(.35)",transition:"filter .3s"}}>{p.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:p.unlocked?p.color:"rgba(255,255,255,.25)",letterSpacing:1,transition:"color .3s"}}>{p.name}</div>
                    <div style={{fontSize:8,color:"rgba(255,255,255,.25)",marginTop:2}}>{p.unlocked?`${p.resource} · ×${p.bonus}`:`🔒 ${fmtN(p.cost)} ⚡`}</div>
                  </div>
                  {curPlanet.id===p.id&&<div style={{fontSize:8,color:"rgba(120,255,120,.65)",letterSpacing:1}}>АКТИВНА</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {tab==="achievements"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"10px 13px"}}>
            <div style={{fontSize:9,color:"rgba(0,212,255,.45)",letterSpacing:3,marginBottom:4,textAlign:"center"}}>◈ ЛИЧНОЕ ДЕЛО ◈</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.18)",textAlign:"center",marginBottom:10,letterSpacing:1}}>{achs.filter(a=>a.unlocked).length}/{achs.length} страниц получено</div>
            {achs.map(a=>(
              <div key={a.id} style={{display:"flex",gap:12,padding:"11px 13px",marginBottom:7,borderRadius:12,background:a.unlocked?"linear-gradient(135deg,rgba(255,180,0,.07),rgba(255,80,0,.04))":"rgba(255,255,255,.015)",border:a.unlocked?"1px solid rgba(255,180,0,.22)":"1px solid rgba(255,255,255,.04)",opacity:a.unlocked?1:0.4,transition:"all .3s"}}>
                <div style={{fontSize:24,flexShrink:0,filter:a.unlocked?"none":"grayscale(1)"}}>{a.icon}</div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:a.unlocked?"#ffd700":"rgba(255,255,255,.25)",letterSpacing:1}}>{a.name}</div>
                  <div style={{fontSize:10,color:a.unlocked?"rgba(255,200,100,.65)":"rgba(255,255,255,.15)",marginTop:3,lineHeight:1.55}}>{a.unlocked?a.lore:"???"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",background:"rgba(2,7,22,.97)",borderTop:"1px solid rgba(0,212,255,.09)",position:"relative",zIndex:3}}>
        {[
          {id:"game",icon:"⛏️",label:"ДОБЫЧА"},
          {id:"upgrades",icon:"⚡",label:"АПГРЕЙДЫ"},
          {id:"planets",icon:"🌍",label:"ПЛАНЕТЫ"},
          {id:"achievements",icon:"🏆",label:"ДЕЛО"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0",border:"none",cursor:"pointer",background:"transparent",borderTop:tab===t.id?"2px solid #00d4ff":"2px solid transparent",transition:"all .2s"}}>
            <div style={{fontSize:15}}>{t.icon}</div>
            <div style={{fontSize:6,letterSpacing:1,marginTop:2,color:tab===t.id?"#00d4ff":"rgba(255,255,255,.22)",fontFamily:"'Orbitron',monospace"}}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
