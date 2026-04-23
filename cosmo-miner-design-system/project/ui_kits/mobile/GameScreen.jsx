// GameScreen.jsx — Mining / Home Screen

function GameScreen({ energy, onMine, planet, playerLevel, playerXP, passiveRate, clickPower }) {
  const [clicks, setClicks] = React.useState(0);
  const [floats, setFloats] = React.useState([]);
  const [clerkMsg, setClerkMsg] = React.useState("Добыча запущена. Согласно регламенту, вы обязаны уведомить министерство о каждом 1 000-м клике.");
  const [researchOpen, setResearchOpen] = React.useState(false);
  const nextFloat = React.useRef(0);

  const handleMine = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++nextFloat.current;
    setFloats(f => [...f, { id, x, y, val: clickPower }]);
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 900);
    setClicks(c => c + 1);
    onMine();
  };

  const xpStart = [0,100,300,700,1500,3000,6000,12000,22000,40000][Math.max(0,playerLevel-1)] || 0;
  const xpEnd = [100,300,700,1500,3000,6000,12000,22000,40000,70000][Math.max(0,playerLevel-1)] || 100;

  return (
    <div style={{...sharedStyles.screen}}>
      <StarField />
      {/* Gradient wash */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,10,40,0.4) 0%,transparent 40%)',pointerEvents:'none'}}/>

      {/* XP bar + level */}
      <div style={{position:'relative',zIndex:2,padding:'8px 14px 6px',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:8,fontWeight:900,letterSpacing:0.5,color:'rgba(0,212,255,0.6)',minWidth:38}}>ЛВЛ {playerLevel}</span>
        <div style={{flex:1}}>
          <ProgressBar value={playerXP - xpStart} max={xpEnd - xpStart} color='rgba(0,212,255,0.6)' height={4} />
        </div>
        <span style={{fontSize:8,fontWeight:700,letterSpacing:0.3,color:'rgba(0,212,255,0.35)'}}>ОПЕРАТИВНИК</span>
      </div>

      {/* Planet name */}
      <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'4px 0 0'}}>
        <span style={{fontSize:8,fontWeight:900,letterSpacing:3,color:'rgba(0,212,255,0.4)',textTransform:'uppercase'}}>{planet.name}</span>
      </div>

      {/* Main mine area */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:2}}>
        {/* Orbit ring */}
        <div style={{position:'absolute',width:260,height:260,borderRadius:'50%',border:'1px solid rgba(0,212,255,0.15)',pointerEvents:'none'}}>
          <div style={{position:'absolute',width:8,height:8,borderRadius:'50%',background:'rgba(0,212,255,0.6)',top:-4,left:'50%',marginLeft:-4,boxShadow:'0 0 8px rgba(0,212,255,0.8)'}}/>
        </div>
        {/* Glow */}
        <div style={{position:'absolute',width:120,height:120,borderRadius:'50%',background:'rgba(0,212,255,0.04)',boxShadow:'0 0 80px rgba(0,212,255,0.08)',pointerEvents:'none'}}/>
        {/* Planet button */}
        <div onClick={handleMine} style={{width:160,height:160,borderRadius:'50%',overflow:'hidden',cursor:'pointer',position:'relative',userSelect:'none',flexShrink:0}}>
          <img src={planet.image} style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} draggable={false}/>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,20,60,0.45)',borderRadius:'50%'}}>
            <span style={{fontSize:28}}>⛏️</span>
            <span style={{fontSize:9,fontWeight:800,letterSpacing:3,color:'rgba(255,200,0,0.8)',textTransform:'uppercase',marginTop:2}}>НАЖМИ</span>
          </div>
        </div>
        {/* Floating +N labels */}
        {floats.map(fl => (
          <div key={fl.id} style={{position:'absolute',left:fl.x,top:fl.y,pointerEvents:'none',fontSize:14,fontWeight:900,color:'#ffd700',textShadow:'0 0 8px rgba(255,200,0,0.8)',animation:'floatUp 0.9s ease forwards'}}>
            +{fl.val}
          </div>
        ))}
      </div>

      {/* Floating buttons — left */}
      <div style={{position:'absolute',left:10,top:44,display:'flex',flexDirection:'column',gap:6,zIndex:5}}>
        <div style={{...sharedStyles.fab,position:'relative'}} onClick={() => setResearchOpen(true)} title="Исследования">
          <span style={{fontSize:16}}>🔬</span>
          <div style={{position:'absolute',top:4,right:4,width:7,height:7,borderRadius:'50%',background:'#ff3b3b'}}/>
        </div>
        <div style={{...sharedStyles.fab,position:'relative'}} title="Достижения">
          <span style={{fontSize:16}}>🏆</span>
        </div>
        <div style={{...sharedStyles.fab}} title="История">
          <span style={{fontSize:16}}>📖</span>
        </div>
      </div>

      {/* Floating buttons — right */}
      <div style={{position:'absolute',right:10,top:44,display:'flex',flexDirection:'column',gap:6,zIndex:5}}>
        <div style={{...sharedStyles.fab,...sharedStyles.fabGold,position:'relative',paddingInline:10,width:'auto',gap:5,flexDirection:'row'}} title="Престиж">
          <span style={{fontSize:14}}>⭐</span>
          <span style={{fontSize:8,fontWeight:900,color:'rgba(0,212,255,0.75)',letterSpacing:1}}>ПРЕСТИЖ</span>
        </div>
        <div style={{...sharedStyles.fab,width:'auto',paddingInline:10,flexDirection:'row',gap:5}} title="Канал">
          <span style={{fontSize:14}}>💬</span>
          <span style={{fontSize:8,fontWeight:900,color:'rgba(0,212,255,0.75)',letterSpacing:1}}>КАНАЛ</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{position:'relative',zIndex:2,padding:'0 16px 8px',display:'flex',gap:16}}>
        <div>
          <div style={{fontSize:7,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.4)',textTransform:'uppercase',marginBottom:2}}>КЛИК</div>
          <div style={{fontSize:11,fontWeight:900,color:'rgba(0,212,255,0.8)'}}>+{clickPower} ⚡</div>
        </div>
        <div>
          <div style={{fontSize:7,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.4)',textTransform:'uppercase',marginBottom:2}}>ПАССИВ</div>
          <div style={{fontSize:11,fontWeight:900,color:'rgba(0,212,255,0.8)'}}>+{passiveRate}/с ⚡</div>
        </div>
      </div>

      {/* CLERK-7 bubble — absolute bottom */}
      {clerkMsg && (
        <div style={{position:'absolute',bottom:10,left:10,right:10,zIndex:20,background:'rgba(4,16,45,0.97)',border:'1px solid rgba(0,212,255,0.35)',borderRadius:14,padding:'10px 12px',display:'flex',gap:10,alignItems:'flex-start'}}>
          <span style={{fontSize:22,flexShrink:0}}>🤖</span>
          <div style={{flex:1}}>
            <div style={{fontSize:8,fontWeight:900,letterSpacing:2,color:'rgba(0,212,255,0.55)',textTransform:'uppercase',marginBottom:3}}>КЛЕРК-7</div>
            <div style={{fontSize:11,color:'rgba(200,230,255,0.9)',lineHeight:1.6}}>{clerkMsg}</div>
          </div>
          <span onClick={() => setClerkMsg(null)} style={{fontSize:14,color:'rgba(0,212,255,0.35)',cursor:'pointer',padding:2,flexShrink:0}}>✕</span>
        </div>
      )}

      <ResearchModal visible={researchOpen} onClose={() => setResearchOpen(false)} energy={energy} playerLevel={playerLevel} />

      <style>{`@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }`}</style>
    </div>
  );
}

Object.assign(window, { GameScreen });
