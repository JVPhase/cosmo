// UpgradesScreen.jsx — Upgrades tab

const UPGRADES_DATA = [
  { id:1, icon:'⚡', name:'Лазерный бур Мк.1', desc:'Выдаётся бесплатно. Аккумулятор — за свой счёт.', bonus:'+1 клик', type:'click', baseCost:50, level:3, canBuy:true },
  { id:2, icon:'🤖', name:'Дрон-стажёр', desc:'Испытательный срок 90 дней. Уже написал заявление на отпуск.', bonus:'+2 пассив', type:'passive', baseCost:120, level:1, canBuy:true },
  { id:3, icon:'🛸', name:'Орбитальная пушка', desc:'Запрещена в 12 галактиках. В нашей — только в 11.', bonus:'+5 клик', type:'click', baseCost:500, level:0, canBuy:false },
  { id:4, icon:'🏗️', name:'Автостанция «Рога и копыта»', desc:'Название выбрано корпоративным голосованием.', bonus:'+10 пассив', type:'passive', baseCost:1200, level:0, canBuy:false },
  { id:5, icon:'🌀', name:'Варп-экстрактор', desc:'Технология засекречена. Даже от нас.', bonus:'+25 клик', type:'click', baseCost:5000, level:0, canBuy:false },
  { id:6, icon:'🐝', name:'Флот «Рабочие пчёлки»', desc:'50 дронов. У каждого имя, личное дело и план ДМС.', bonus:'+35 пассив', type:'passive', baseCost:8000, level:0, canBuy:false },
  { id:7, icon:'🌑', name:'Гравитационный коллектор', desc:'Изгибает пространство-время. Форма ПРС-7. 4 страницы.', bonus:'+100 клик', type:'click', baseCost:25000, level:0, canBuy:false },
];

function UpgradesScreen({ energy = 480 }) {
  const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
  const [mult, setMult] = React.useState(1);
  const [tab, setTab] = React.useState('click');

  const filtered = UPGRADES_DATA.filter(u => u.type === tab);

  return (
    <div style={{...sharedStyles.screen}}>
      <StarField />
      {/* Type tabs */}
      <div style={{position:'relative',zIndex:2,display:'flex',borderBottom:'1px solid rgba(0,212,255,0.10)',flexShrink:0}}>
        {[['click','⚡ АКТИВНАЯ'],['passive','🤖 ПАССИВНАЯ']].map(([id,label]) => (
          <div key={id} onClick={() => setTab(id)}
            style={{flex:1,padding:'10px 0',textAlign:'center',cursor:'pointer',fontSize:9,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',
              color:tab===id?'#00d4ff':'rgba(255,255,255,0.3)',
              borderBottom:tab===id?'2px solid #00d4ff':'2px solid transparent',
              background:'transparent',transition:'all 0.2s'}}>
            {label}
          </div>
        ))}
      </div>
      {/* Multiplier row */}
      <div style={{position:'relative',zIndex:2,padding:'8px 16px 4px',display:'flex',justifyContent:'flex-end',gap:4,flexShrink:0}}>
        {[1,5,10,'MAX'].map(m => (
          <button key={m} onClick={() => setMult(m)}
            style={{padding:'4px 8px',borderRadius:6,border:'1px solid',fontSize:10,fontWeight:700,cursor:'pointer',
              background:mult===m?'rgba(255,200,0,0.12)':'rgba(255,255,255,0.03)',
              borderColor:mult===m?'rgba(255,200,0,0.5)':'rgba(255,255,255,0.07)',
              color:mult===m?'#ffd700':'rgba(255,200,0,0.35)'}}>
            ×{m}
          </button>
        ))}
      </div>
      <div style={{...sharedStyles.scroll,position:'relative',zIndex:2,padding:'4px 14px 16px'}}>
        {filtered.map(u => {
          const cost = Math.floor(u.baseCost * Math.pow(1.5, u.level) * (typeof mult==='number'?mult:1));
          const canAfford = energy >= cost && u.canBuy;
          return (
            <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:12,marginBottom:10,border:'1px solid',background:canAfford?'rgba(0,30,50,0.95)':'rgba(10,10,20,0.92)',borderColor:canAfford?'rgba(0,212,255,0.30)':'rgba(255,255,255,0.07)',opacity:!u.canBuy?0.65:1}}>
              <span style={{fontSize:28,flexShrink:0}}>{u.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,letterSpacing:0.5,color:'#fff'}}>{u.name}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.65)',marginTop:2}}>{u.desc}</div>
                <div style={{fontSize:9,color:'rgba(0,212,255,0.75)',fontWeight:700,marginTop:3}}>{u.bonus}/ур</div>
                {u.level > 0 && <div style={{fontSize:9,color:'rgba(120,255,120,0.8)',fontWeight:700,marginTop:2}}>Ур. {u.level} куплено</div>}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:900,color:canAfford?'#ffd700':'rgba(255,200,0,0.3)'}}>{fmt(cost)}</div>
                <div style={{fontSize:9,color:'rgba(255,200,0,0.6)',fontWeight:700}}>⚡ Энергиум</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { UpgradesScreen });
