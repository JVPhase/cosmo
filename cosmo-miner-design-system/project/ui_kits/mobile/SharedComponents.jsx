// SharedComponents.jsx — Cosmo Miner Design System
// Shared primitives: HUD, TabBar, Buttons, Bars, Toasts, StarField

const sharedStyles = {
  // Layout
  screen: { position:'relative', width:'100%', height:'100%', background:'#050918', overflow:'hidden', fontFamily:"'Exo 2',-apple-system,sans-serif", color:'rgba(200,230,255,0.9)', display:'flex', flexDirection:'column' },
  flex1: { flex:1, overflow:'hidden' },
  scroll: { flex:1, overflowY:'auto', overflowX:'hidden' },

  // Typography roles
  microLabel: { fontSize:7, fontWeight:900, letterSpacing:2, textTransform:'uppercase', color:'rgba(0,212,255,0.5)' },
  hudLabel: { fontSize:8, fontWeight:900, letterSpacing:2, textTransform:'uppercase', color:'rgba(0,212,255,0.55)' },
  statChip: { fontSize:9, fontWeight:700, color:'rgba(0,212,255,0.75)' },
  cardTitle: { fontSize:13, fontWeight:800, letterSpacing:0.5, color:'#fff' },
  value: { fontSize:14, fontWeight:900, color:'#ffd700' },
  body: { fontSize:11, color:'rgba(200,230,255,0.9)', lineHeight:1.6 },
  desc: { fontSize:10, color:'rgba(255,255,255,0.65)', lineHeight:1.5 },

  // Buttons
  btnCyan: { background:'rgba(0,212,255,0.10)', border:'1px solid rgba(0,212,255,0.35)', color:'#00d4ff', padding:'10px 20px', borderRadius:8, fontSize:11, fontWeight:900, letterSpacing:1, textTransform:'uppercase', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' },
  btnGold: { background:'rgba(255,200,0,0.12)', border:'1px solid rgba(255,200,0,0.50)', color:'#ffd700', padding:'10px 20px', borderRadius:8, fontSize:11, fontWeight:900, letterSpacing:1, textTransform:'uppercase', cursor:'pointer' },
  btnDanger: { background:'rgba(255,40,40,0.10)', border:'1px solid rgba(255,80,80,0.35)', color:'rgba(255,100,100,0.85)', padding:'8px 18px', borderRadius:8, fontSize:11, fontWeight:900, letterSpacing:1.5, textTransform:'uppercase', cursor:'pointer' },
  btnDisabled: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.2)', padding:'10px 20px', borderRadius:8, fontSize:11, fontWeight:900, cursor:'not-allowed' },
  fab: { width:36, height:36, borderRadius:10, background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer', position:'relative', flexShrink:0 },
  fabGold: { background:'rgba(255,200,0,0.10)', border:'1px solid rgba(255,200,0,0.45)' },
};

// StarField background
function StarField() {
  const stars = React.useMemo(() => Array.from({length:60}, (_,i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:Math.random()*1.5+0.5, opacity:Math.random()*0.6+0.2
  })), []);
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
      {stars.map(s => (
        <div key={s.id} style={{position:'absolute',left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,borderRadius:'50%',background:'#fff',opacity:s.opacity}} />
      ))}
    </div>
  );
}

// Resource HUD bar
function ResourceHUD({ energy = 48320, iron = 142, titan = 37, iridium = 8 }) {
  const fmt = n => n >= 1e9 ? (n/1e9).toFixed(1)+'B' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(4,16,45,0.95)',borderBottom:'1px solid rgba(0,212,255,0.10)',padding:'8px 12px',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        <span style={{fontSize:14}}>⚡</span>
        <span style={{fontSize:14,fontWeight:900,color:'#ffd700'}}>{fmt(energy)}</span>
      </div>
      <div style={{width:1,height:16,background:'rgba(255,255,255,0.08)'}}/>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {[['../../assets/resources/iron.png',iron,'iron'],['../../assets/resources/titan.png',titan,'titan'],['../../assets/resources/iridium.png',iridium,'iridium']].map(([img,val,id]) => (
          <div key={id} style={{display:'flex',alignItems:'center',gap:3}}>
            <img src={img} style={{width:16,height:16,objectFit:'contain'}}/>
            <span style={{fontSize:10,fontWeight:700,color:'rgba(255,220,100,0.75)'}}>{fmt(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab bar
function TabBar({ active, onTab }) {
  const tabs = [
    { id:'mine', icon:'⛏️', label:'ДОБЫЧА' },
    { id:'upgrades', icon:'⬆️', label:'АПГР.' },
    { id:'planets', icon:'🪐', label:'ПЛАН.' },
    { id:'shipyard', icon:'🛸', label:'ВЕРФЬ' },
    { id:'battle', icon:'⚔️', label:'БОЙ' },
  ];
  return (
    <div style={{display:'flex',background:'rgba(4,12,30,0.98)',borderTop:'1px solid rgba(0,212,255,0.12)',flexShrink:0}}>
      {tabs.map(t => (
        <div key={t.id} onClick={() => onTab(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 4px 8px',gap:3,cursor:'pointer',position:'relative',background:active===t.id?'rgba(0,212,255,0.07)':'transparent',transition:'background 0.2s'}}>
          {active===t.id && <div style={{position:'absolute',top:0,left:'20%',right:'20%',height:2,background:'#00d4ff',boxShadow:'0 0 6px rgba(0,212,255,0.8)',borderRadius:'0 0 2px 2px'}}/>}
          <span style={{fontSize:20}}>{t.icon}</span>
          <span style={{fontSize:8,fontWeight:800,letterSpacing:1.5,color:active===t.id?'#00d4ff':'rgba(255,255,255,0.35)',textTransform:'uppercase'}}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// Progress bar
function ProgressBar({ value, max, color='rgba(0,212,255,0.6)', height=4, label, rightLabel }) {
  const pct = Math.min(1, value/max)*100;
  return (
    <div style={{width:'100%'}}>
      {(label||rightLabel) && <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        {label && <span style={{fontSize:7,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'rgba(255,255,255,0.3)'}}>{label}</span>}
        {rightLabel && <span style={{fontSize:7,fontWeight:800,color:'rgba(255,100,100,0.7)'}}>{rightLabel}</span>}
      </div>}
      <div style={{height,borderRadius:height/2,background:'rgba(255,255,255,0.06)',overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:height/2,transition:'width 0.3s ease'}}/>
      </div>
    </div>
  );
}

// Toast component
function Toast({ type='clerk', icon, label, title, text, onClose }) {
  const themes = {
    achieve: { bg:'rgba(40,25,0,0.97)', border:'rgba(255,180,0,0.7)', labelColor:'rgba(255,180,0,0.7)', titleColor:'#ffd700', textColor:'rgba(255,200,100,0.65)' },
    level: { bg:'rgba(0,50,80,0.97)', border:'rgba(0,212,255,0.5)', labelColor:'rgba(0,212,255,0.7)', titleColor:'#00d4ff', textColor:'rgba(200,230,255,0.7)' },
    clerk: { bg:'rgba(4,16,45,0.97)', border:'rgba(0,212,255,0.35)', labelColor:'rgba(0,212,255,0.55)', titleColor:'#fff', textColor:'rgba(200,230,255,0.9)' },
  };
  const t = themes[type] || themes.clerk;
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',borderRadius:14,border:`1px solid ${t.border}`,background:t.bg,position:'relative'}}>
      <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
      <div style={{flex:1}}>
        {label && <div style={{fontSize:8,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:t.labelColor,marginBottom:2}}>{label}</div>}
        {title && <div style={{fontSize:12,fontWeight:800,color:t.titleColor,marginTop:2}}>{title}</div>}
        {text && <div style={{fontSize:10,color:t.textColor,marginTop:2,lineHeight:1.5}}>{text}</div>}
      </div>
      {onClose && <span onClick={onClose} style={{fontSize:14,color:'rgba(0,212,255,0.35)',cursor:'pointer',padding:4,flexShrink:0}}>✕</span>}
    </div>
  );
}

Object.assign(window, { StarField, ResourceHUD, TabBar, ProgressBar, Toast, sharedStyles });
