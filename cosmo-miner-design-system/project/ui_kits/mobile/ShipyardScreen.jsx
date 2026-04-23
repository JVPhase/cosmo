// ShipyardScreen.jsx — Fleet + Expeditions

const METAL_ICONS = {iron:'../../assets/resources/iron.png',titan:'../../assets/resources/titan.png',iridium:'../../assets/resources/iridium.png'};
const MetalIcon = ({id,size=14}) => <img src={METAL_ICONS[id]} style={{width:size,height:size,objectFit:'contain',verticalAlign:'middle'}}/>;

const SHIPS_DATA = [
  { id:'scout', name:'Разведчик «Нулевой»', lore:'Серийный номер 0000. По умолчанию же и ломается.', dmg:'×1', status:'active', image:'../../assets/ships/scoutship.png', cannons:[{name:'Станд. пушка',icon:'../../assets/cannons/standartcanon.png',level:2,dmg:10}] },
  { id:'cruiser', name:'Крейсер «Гамма»', lore:'Министерство финансов — нет. Летит.', dmg:'×2.5', status:'broken', image:'../../assets/ships/cruisership.png', repairCost:{titan:8} },
  { id:'dreadnought', name:'Дредноут «Отдел Б»', lore:'Официально не существует.', dmg:'×5', status:'locked', image:'../../assets/ships/dreadnoughtship.png', buildCost:{iridium:20} },
  { id:'flagship', name:'Флагман «Абсолют-77»', lore:'Форма допуска — 47 страниц.', dmg:'×12', status:'locked', image:'../../assets/ships/flagship.png', buildCost:{iron:28,titan:28,iridium:29} },
];
const EXPEDITIONS_DATA = [
  { id:'patrol', icon:'🔍', name:'Патрульный рейс', dur:'5 мин', metals:[{id:'iron',n:8},{id:'titan',n:3}], xp:50 },
  { id:'asteroid_belt', icon:'🪨', name:'Пояс астероидов', dur:'30 мин', metals:[{id:'iron',n:40},{id:'titan',n:20},{id:'iridium',n:5}], xp:250 },
  { id:'deep_space', icon:'🌌', name:'Глубокий космос', dur:'2 ч', metals:[{id:'iron',n:100},{id:'titan',n:80},{id:'iridium',n:40}], xp:1000 },
  { id:'classified', icon:'🔒', name:'Операция «Отдел Б»', dur:'8 ч', metals:[{id:'iron',n:300},{id:'titan',n:250},{id:'iridium',n:150}], xp:3000 },
];

function ShipyardScreen() {
  const [tab, setTab] = React.useState('fleet');

  return (
    <div style={{...sharedStyles.screen}}>
      <StarField />
      {/* Sub-tabs */}
      <div style={{position:'relative',zIndex:2,display:'flex',borderBottom:'1px solid rgba(0,212,255,0.10)',flexShrink:0}}>
        {[['fleet','ФЛОТ'],['expeditions','ЭКСПЕДИЦИИ']].map(([id,label]) => (
          <div key={id} onClick={() => setTab(id)}
            style={{flex:1,padding:'10px 0',textAlign:'center',cursor:'pointer',fontSize:9,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:tab===id?'#00d4ff':'rgba(255,255,255,0.3)',borderBottom:tab===id?'2px solid #00d4ff':'2px solid transparent',transition:'all 0.2s',background:'transparent'}}>
            {label}
          </div>
        ))}
      </div>

      <div style={{...sharedStyles.scroll,position:'relative',zIndex:2,padding:'10px 14px 16px'}}>
        {tab === 'fleet' && SHIPS_DATA.map(ship => {
          const statusColors = { active:{bg:'rgba(68,255,136,0.10)',border:'rgba(68,255,136,0.3)',color:'#44ff88',label:'АКТИВЕН'}, broken:{bg:'rgba(255,40,40,0.08)',border:'rgba(255,80,80,0.25)',color:'#ff6666',label:'СЛОМАН'}, locked:{bg:'rgba(255,255,255,0.03)',border:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.25)',label:'НЕ ПОСТРОЕН'} };
          const sc = statusColors[ship.status];
          return (
            <div key={ship.id} style={{borderRadius:12,marginBottom:10,border:'1px solid',background:ship.status==='active'?'rgba(0,25,45,0.95)':'rgba(10,8,18,0.92)',borderColor:ship.status==='active'?'rgba(0,212,255,0.20)':ship.status==='broken'?'rgba(255,80,80,0.20)':'rgba(255,255,255,0.06)',opacity:ship.status==='locked'?0.55:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px'}}>
                <img src={ship.image} style={{width:60,height:60,objectFit:'contain',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>{ship.name}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.45)',marginTop:2}}>{ship.lore}</div>
                  <div style={{fontSize:9,color:'rgba(0,212,255,0.7)',fontWeight:700,marginTop:3}}>Урон {ship.dmg}</div>
                </div>
                <div style={{padding:'3px 8px',borderRadius:5,background:sc.bg,border:`1px solid ${sc.border}`,fontSize:8,fontWeight:900,letterSpacing:1,color:sc.color}}>{sc.label}</div>
              </div>
              {ship.cannons && (
                <div style={{padding:'0 14px 12px',borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:10}}>
                  <div style={{fontSize:7,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.35)',textTransform:'uppercase',marginBottom:6}}>ВООРУЖЕНИЕ</div>
                  {ship.cannons.map((c,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      <img src={c.icon} style={{width:28,height:28,objectFit:'contain'}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)'}}>{c.name}</div>
                        <div style={{fontSize:9,color:'rgba(0,212,255,0.6)'}}>Ур.{c.level} · +{c.dmg} урон</div>
                      </div>
                      <button style={{...sharedStyles.btnGold,padding:'5px 10px',fontSize:9}}>УЛУ.</button>
                    </div>
                  ))}
                </div>
              )}
              {ship.repairCost && (
                <div style={{padding:'0 14px 12px',borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:9,color:'rgba(255,200,0,0.6)'}}><MetalIcon id="titan"/>×{ship.repairCost.titan} Ремонт</span>
                  <button style={{...sharedStyles.btnGold,padding:'5px 14px',fontSize:9}}>ПОЧИНИТЬ</button>
                </div>
              )}
            </div>
          );
        })}

        {tab === 'expeditions' && EXPEDITIONS_DATA.map(exp => (
          <div key={exp.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:12,marginBottom:8,border:'1px solid rgba(0,212,255,0.15)',background:'rgba(0,212,255,0.05)'}}>
            <span style={{fontSize:28,flexShrink:0}}>{exp.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>{exp.name}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.45)',marginTop:2}}>⏱️ {exp.dur} · +{exp.xp} XP</div>
              <div style={{fontSize:9,color:'rgba(255,220,100,0.7)',fontWeight:700,marginTop:3,display:'flex',gap:6,flexWrap:'wrap'}}>
                {exp.metals.map(m => (
                  <span key={m.id} style={{display:'inline-flex',alignItems:'center',gap:2}}>
                    <MetalIcon id={m.id}/>×{m.n}
                  </span>
                ))}
              </div>
            </div>
            <button style={{...sharedStyles.btnCyan,padding:'7px 12px',fontSize:9,flexShrink:0}}>ОТПРАВИТЬ</button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ShipyardScreen });
