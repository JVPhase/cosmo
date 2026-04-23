// PlanetsScreen.jsx — Planet selection + combat launch

const PLANETS_DATA = [
  { id:1, icon:'🪨', name:'Астероид Б-4', sector:1, bonus:1, resource:'Энергиум™', unlocked:true, active:true, image:'../../assets/asteroid.png', alien:null },
  { id:2, icon:'🔴', name:'Меркурий-Икс', sector:1, bonus:2.5, resource:'Пламенит', unlocked:true, active:false, image:'../../assets/planets/mercury.png', alien:{name:'Пламенники',hp:500,cost:10000} },
  { id:3, icon:'💎', name:'Кристаллис', sector:1, bonus:6, resource:'Кристаллит', unlocked:false, image:'../../assets/planets/crystal.png', alien:{name:'Кристаллиты',hp:2000,cost:50000} },
  { id:4, icon:'🌫️', name:'Туманность Омега', sector:1, bonus:15, resource:'Туманоид', unlocked:false, image:'../../assets/planets/nebula.png', alien:{name:'Туманники',hp:8000,cost:250000} },
  { id:5, icon:'⭐', name:'Солнце Гамма-9', sector:1, bonus:50, resource:'Соляриум', unlocked:false, image:'../../assets/planets/sun.png', alien:{name:'Солярианцы',hp:30000,cost:1250000} },
  { id:6, icon:'⚫', name:'Чёрная дыра Б-7', sector:2, bonus:120, resource:'Темниум', unlocked:false, image:'../../assets/planets/blackhole.png', alien:{name:'Тёмные стражи',hp:500000,cost:6250000} },
];

function PlanetsScreen({ energy = 48320, onStartBattle }) {
  const fmt = n => n >= 1e9 ? (n/1e9).toFixed(1)+'B' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
  const [selected, setSelected] = React.useState(null);

  return (
    <div style={{...sharedStyles.screen}}>
      <StarField />
      <div style={{position:'relative',zIndex:2,padding:'10px 16px 6px',flexShrink:0}}>
        <span style={{fontSize:8,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.5)',textTransform:'uppercase'}}>ПЛАНЕТЫ И СЕКТОРЫ</span>
      </div>

      <div style={{...sharedStyles.scroll,position:'relative',zIndex:2,padding:'4px 14px 16px'}}>
        {/* Sector labels */}
        {[1,2].map(sector => (
          <div key={sector}>
            <div style={{fontSize:8,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.35)',textTransform:'uppercase',marginBottom:8,marginTop:sector>1?14:0}}>
              СЕКТОР {sector} — {sector===1?'ВНУТРЕННИЙ КЛАСТЕР':'ДАЛЬНИЙ КЛАСТЕР'}
              {sector===2 && <span style={{marginLeft:8,color:'rgba(255,255,255,0.25)',fontSize:7}}>ЗАБЛОКИРОВАН</span>}
            </div>
            {PLANETS_DATA.filter(p => p.sector===sector).map(p => {
              const isSel = selected === p.id;
              const canAttack = p.alien && p.unlocked && !p.active && energy >= p.alien.cost;
              return (
                <div key={p.id}>
                  <div onClick={() => setSelected(isSel ? null : p.id)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,marginBottom:6,border:'1px solid',cursor:'pointer',opacity:p.unlocked?1:0.45,
                      background:p.active?'rgba(30,20,0,0.95)':p.unlocked?'rgba(0,20,40,0.92)':'rgba(8,8,18,0.90)',
                      borderColor:p.active?'rgba(255,200,0,0.35)':p.unlocked?'rgba(0,212,255,0.20)':'rgba(255,255,255,0.06)'}}>
                    <img src={p.image} style={{width:52,height:52,objectFit:'contain',filter:p.unlocked?'none':'grayscale(0.7)',flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:p.active?'#ffd700':'#fff'}}>{p.icon} {p.name}</div>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.45)',marginTop:2}}>Сектор {p.sector} · Бонус ×{p.bonus}</div>
                      <div style={{fontSize:9,color:'rgba(0,212,255,0.65)',fontWeight:700,marginTop:3}}>Ресурс: {p.resource}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {p.active && <div style={{fontSize:8,fontWeight:900,letterSpacing:1,color:'#44ff88',padding:'3px 8px',borderRadius:5,background:'rgba(68,255,136,0.10)',border:'1px solid rgba(68,255,136,0.3)'}}>АКТИВНА</div>}
                      {!p.unlocked && <div style={{fontSize:8,fontWeight:900,letterSpacing:1,color:'rgba(255,255,255,0.25)',padding:'3px 8px',borderRadius:5,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>ЗАКРЫТА</div>}
                      {p.unlocked && !p.active && p.alien && <div style={{fontSize:8,fontWeight:900,letterSpacing:1,color:'#ff6666',padding:'3px 8px',borderRadius:5,background:'rgba(255,40,40,0.08)',border:'1px solid rgba(255,80,80,0.25)'}}>ОХРАНЯЕТСЯ</div>}
                    </div>
                  </div>
                  {/* Expanded attack panel */}
                  {isSel && p.alien && p.unlocked && !p.active && (
                    <div style={{margin:'0 0 8px 0',padding:'12px 14px',borderRadius:12,background:'rgba(255,40,40,0.06)',border:'1px solid rgba(255,80,80,0.25)'}}>
                      <div style={{fontSize:11,fontWeight:800,color:'#ff6666',marginBottom:6}}>{p.alien.name} — {p.alien.hp.toLocaleString()} HP</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginBottom:10}}>Стоимость атаки: <span style={{color:'#ffd700',fontWeight:700}}>⚡ {fmt(p.alien.cost)}</span></div>
                      <button
                        disabled={!canAttack}
                        onClick={() => canAttack && onStartBattle?.(p)}
                        style={{...canAttack?sharedStyles.btnDanger:sharedStyles.btnDisabled,width:'100%',textAlign:'center',fontSize:12}}>
                        ⚔️ НАЧАТЬ БОЙ
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PlanetsScreen });
