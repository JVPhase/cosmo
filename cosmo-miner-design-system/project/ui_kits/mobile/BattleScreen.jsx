// BattleScreen.jsx — Battle HUD

function BattleScreen({ battle, onAttack, onForfeit }) {
  const [hp, setHp] = React.useState(battle?.maxHp || 500);
  const [hitFlash, setHitFlash] = React.useState(false);
  const maxHp = battle?.maxHp || 500;
  const pct = Math.max(0, hp / maxHp);
  const hpColor = pct > 0.5 ? 'linear-gradient(90deg,#cc2222,#ff4444)' : pct > 0.25 ? 'linear-gradient(90deg,#cc5500,#ff9900)' : 'linear-gradient(90deg,#880000,#cc2222)';

  const [timeMs, setTimeMs] = React.useState(60000);
  React.useEffect(() => {
    if (hp <= 0) return;
    const id = setInterval(() => setTimeMs(t => Math.max(0, t - 100)), 100);
    return () => clearInterval(id);
  }, [hp]);

  const secs = Math.floor(timeMs / 1000);
  const centis = Math.floor((timeMs % 1000) / 10);
  const timerColor = timeMs > 20000 ? '#00d4ff' : timeMs > 10000 ? '#ff9900' : '#ff3333';

  const handleHit = (e) => {
    const dmg = battle?.dmgPerClick || 42;
    setHp(h => Math.max(0, h - dmg));
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 150);
    onAttack?.();
  };

  const victory = hp <= 0;
  const defeat = timeMs <= 0 && hp > 0;

  return (
    <div style={{...sharedStyles.screen,background:hitFlash?'rgba(255,30,30,0.08)':'#050918',transition:'background 0.1s'}}>
      <StarField />
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(80,0,0,0.2) 0%,transparent 30%)',pointerEvents:'none'}}/>

      {/* Header: race + timer */}
      <div style={{position:'relative',zIndex:2,padding:'10px 16px 8px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:'#ff6666',letterSpacing:1,textTransform:'uppercase'}}>{battle?.raceName || 'ПЛАМЕННИКИ'}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:2}}>{battle?.planetName || 'Меркурий-Икс'}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
          <div style={{alignItems:'center',padding:'6px 12px',borderRadius:10,border:`1px solid ${timerColor}66`,background:'rgba(0,0,0,0.3)',textAlign:'center'}}>
            <div style={{fontSize:7,color:'rgba(255,255,255,0.35)',letterSpacing:2,fontWeight:800,textTransform:'uppercase'}}>ВРЕМЯ</div>
            <div style={{fontSize:20,fontWeight:900,color:timerColor}}>{secs}.{String(centis).padStart(2,'0')}</div>
          </div>
        </div>
      </div>

      {/* HP bar */}
      <div style={{position:'relative',zIndex:2,padding:'0 16px 6px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontSize:8,fontWeight:800,letterSpacing:2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase'}}>HP ПРОТИВНИКА</span>
          <span style={{fontSize:8,fontWeight:800,color:'rgba(255,100,100,0.7)'}}>{hp.toLocaleString()} / {maxHp.toLocaleString()}</span>
        </div>
        <div style={{height:12,borderRadius:6,background:'rgba(255,255,255,0.06)',overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{height:'100%',width:`${pct*100}%`,background:hpColor,borderRadius:6,transition:'width 0.15s ease'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:9,color:'rgba(255,150,150,0.7)',fontWeight:700}}>⚔️ {battle?.dmgPerClick||42}/клик</span>
            <span style={{fontSize:9,color:'rgba(255,150,150,0.7)',fontWeight:700}}>🛸 {battle?.shipName||'Разведчик'}</span>
          </div>
          {!victory && !defeat && (
            <button onClick={onForfeit} style={{...sharedStyles.btnDanger,border:'1px solid rgba(255,80,80,0.35)',padding:'5px 12px',fontSize:9,alignSelf:'flex-start'}}>✕ ОТСТУПИТЬ</button>
          )}
        </div>
      </div>

      {/* Battle area */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:2}}>
        {victory ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:48}}>🎉</div>
            <div style={{fontSize:18,fontWeight:900,color:'#44ff88',letterSpacing:1,marginTop:8}}>ПОБЕДА!</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:4}}>Планета захвачена</div>
          </div>
        ) : defeat ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:48}}>💥</div>
            <div style={{fontSize:18,fontWeight:900,color:'#ff3333',letterSpacing:1,marginTop:8}}>ПОРАЖЕНИЕ</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:4}}>Корабль сломан</div>
          </div>
        ) : (
          <div onClick={handleHit}
            style={{width:200,height:200,borderRadius:'50%',background:'rgba(255,40,40,0.08)',border:'1px solid rgba(255,80,80,0.3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,userSelect:'none',transition:'background 0.1s',position:'relative'}}>
            <img src={battle?.shipImage || '../../assets/ships/fireship.png'} style={{width:130,height:130,objectFit:'contain',pointerEvents:'none'}} draggable={false}/>
            <div style={{position:'absolute',bottom:-32,fontSize:10,fontWeight:800,letterSpacing:3,color:'rgba(255,100,100,0.7)',textTransform:'uppercase'}}>АТАКОВАТЬ</div>
          </div>
        )}
      </div>


    </div>
  );
}

Object.assign(window, { BattleScreen });
