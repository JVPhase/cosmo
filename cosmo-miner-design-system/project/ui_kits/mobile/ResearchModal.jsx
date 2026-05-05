// ResearchModal.jsx — Research modal sheet

const RESEARCH_DATA = [
  {
    group: '⛏️ ДОБЫЧА',
    nodes: [
      { id:'mining_click_1', name:'Квантовое долото', desc:'Резонансное поле усиливает каждый удар.', effect:'+0.3 клик×', cost:300, reqLevel:1, unlocked:true },
      { id:'mining_passive_1', name:'Дрон-надзорщик', desc:'Следит за дронами. Дроны следят за ним.', effect:'+0.4 пассив×', cost:2000, reqLevel:3, unlocked:true, requires:'mining_click_1' },
      { id:'mining_metal_1', name:'Геологический сканер', desc:'Форма на использование сканера: ГС-3. 2 экз.', effect:'+8% дроп металлов', cost:6000, reqLevel:5, unlocked:false },
      { id:'mining_click_2', name:'Турбо-экстрактор', desc:'Запрещён в трёх измерениях. В нашем — пока нет.', effect:'+0.6 клик×', cost:25000, reqLevel:8, unlocked:false, requires:'mining_passive_1' },
      { id:'mining_passive_2', name:'Нейронный автопилот', desc:'Думает за вас. Думает лучше вас.', effect:'+0.8 пассив×', cost:100000, reqLevel:12, unlocked:false },
    ]
  },
  {
    group: '⚔️ БОЙ',
    nodes: [
      { id:'battle_damage_1', name:'Тактика берсерка', desc:'Одобрена комиссией. Комиссия не пережила демо.', effect:'+0.3 урон×', cost:70000, reqLevel:6, unlocked:false },
      { id:'battle_damage_2', name:'Орбитальная артиллерия', desc:'Согласование заняло 4 года. Стреляет быстрее.', effect:'+0.6 урон×', cost:240000, reqLevel:8, unlocked:false, requires:'battle_damage_1' },
      { id:'battle_damage_3', name:'Тёмная материя', desc:'Засекречена. Эффект — незасекречен. Просто огонь.', effect:'+1.0 урон×', cost:3000000, reqLevel:13, unlocked:false, requires:'battle_damage_2' },
    ]
  },
  {
    group: '🚀 ЭКСПЕДИЦИИ',
    nodes: [
      { id:'exp_speed_1', name:'Ускоритель маршрутов', desc:'Сокращает время рейса. Расход топлива — ваша проблема.', effect:'-15% время', cost:15000, reqLevel:4, unlocked:false },
      { id:'exp_reward_1', name:'Торговый протокол', desc:'Увеличивает добычу с экспедиций. Пункт 44-Б.', effect:'+25% металлы', cost:50000, reqLevel:7, unlocked:false },
      { id:'exp_slots_1', name:'Параллельный диспетч', desc:'Два корабля одновременно. Диспетчер не одобрил.', effect:'+1 слот', cost:200000, reqLevel:10, unlocked:false, requires:'exp_reward_1' },
    ]
  },
];

function ResearchModal({ visible, onClose, energy = 0, playerLevel = 1 }) {
  if (!visible) return null;
  const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
  const [tab, setTab] = React.useState(0);
  const group = RESEARCH_DATA[tab];

  return (
    <div style={{position:'absolute',inset:0,zIndex:50,display:'flex',flexDirection:'column'}}>
      {/* Sheet — full height */}
      <div style={{position:'relative',flex:1,background:'#060d1f',display:'flex',flexDirection:'column',borderBottom:'1px solid rgba(0,212,255,0.15)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 10px',borderBottom:'1px solid rgba(0,212,255,0.08)',flexShrink:0}}>
          <span style={{fontSize:9,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.6)',textTransform:'uppercase'}}>🔬 ИССЛЕДОВАНИЯ</span>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:8,fontWeight:700,color:'rgba(0,212,255,0.4)'}}>ЛВЛ {playerLevel} · ⚡{fmt(energy)}</span>
            <span onClick={onClose} style={{fontSize:18,color:'rgba(0,212,255,0.4)',cursor:'pointer',lineHeight:1}}>✕</span>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(0,212,255,0.08)',flexShrink:0}}>
          {RESEARCH_DATA.map((g,i) => (
            <div key={i} onClick={() => setTab(i)}
              style={{flex:1,padding:'10px 4px',textAlign:'center',cursor:'pointer',fontSize:9,fontWeight:900,letterSpacing:1,
                color:tab===i?'#00d4ff':'rgba(255,255,255,0.3)',
                borderBottom:tab===i?'2px solid #00d4ff':'2px solid transparent',
                background:'transparent',transition:'all 0.2s'}}>
              {g.group}
            </div>
          ))}
        </div>
        {/* Nodes */}
        <div style={{overflowY:'auto',flex:1,padding:'10px 14px 20px'}}>
          {group.nodes.map(node => {
            const canAfford = energy >= node.cost;
            const levelOk = playerLevel >= node.reqLevel;
            const available = node.unlocked && canAfford && levelOk;
            const locked = !levelOk;
            return (
              <div key={node.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 12px',borderRadius:10,marginBottom:8,border:'1px solid',
                background:node.unlocked?'rgba(0,212,255,0.06)':available?'rgba(0,212,255,0.08)':locked?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.02)',
                borderColor:available?'rgba(0,212,255,0.28)':node.unlocked?'rgba(0,212,255,0.15)':locked?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.07)',
                opacity:locked?0.4:1}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:node.unlocked?'rgba(255,255,255,0.4)':'#fff'}}>{node.name}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.45)',marginTop:3,lineHeight:1.5}}>{node.desc}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginTop:5,flexWrap:'wrap'}}>
                    <span style={{fontSize:9,fontWeight:800,color:'rgba(0,212,255,0.8)',background:'rgba(0,212,255,0.08)',padding:'2px 6px',borderRadius:4}}>{node.effect}</span>
                    {node.requires && <span style={{fontSize:8,color:'rgba(255,255,255,0.2)'}}>треб.: {node.requires.split('_').slice(1).join(' ')}</span>}
                    {locked && <span style={{fontSize:8,fontWeight:700,color:'rgba(255,150,50,0.8)',background:'rgba(255,100,0,0.08)',padding:'2px 5px',borderRadius:4}}>ЛВЛ {node.reqLevel}</span>}
                  </div>
                </div>
                <div style={{flexShrink:0,textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                  <div style={{fontSize:11,fontWeight:900,color:canAfford&&!locked?'#ffd700':'rgba(255,200,0,0.25)'}}>⚡{fmt(node.cost)}</div>
                  <button style={{padding:'5px 12px',borderRadius:6,border:'1px solid',fontSize:9,fontWeight:900,cursor:available?'pointer':'not-allowed',
                    background:node.unlocked?'rgba(68,255,136,0.08)':available?'rgba(0,212,255,0.12)':'rgba(255,255,255,0.03)',
                    borderColor:node.unlocked?'rgba(68,255,136,0.25)':available?'rgba(0,212,255,0.35)':'rgba(255,255,255,0.07)',
                    color:node.unlocked?'#44ff88':available?'#00d4ff':'rgba(255,255,255,0.2)'}}>
                    {node.unlocked?'✓ КУПЛЕНО':locked?'ЗАКРЫТО':'КУПИТЬ'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ResearchModal });
