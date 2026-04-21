"use client";
import { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";

async function googleOAuth(onError: (msg: string) => void, onLoading: (v: boolean) => void) {
  onLoading(true);
  try {
    const clerk = (window as any).Clerk;
    if (!clerk?.client) { onError("Clerk no inicializado"); onLoading(false); return; }
    await clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: `${window.location.origin}/app/sync`,
    });
  } catch (e: any) {
    onError(e.errors?.[0]?.message || e.message || "Error con Google");
    onLoading(false);
  }
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green:     "#63A694",
  greenL:    "#A8D1B1",
  greenDeep: "#3D7360",
  terra:     "#D87D6F",
  terraDeep: "#A85548",
  coffee:    "#82554D",
  ink:       "#0D0D0D",
  cream:     "#F2ECDF",
  white:     "#FFFFFF",
};
const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";

type Screen = "splash" | "login" | "register" | "otp" | "mode";
type Role   = "student" | "owner";

// ─── Interactive city (isometric SVG) ────────────────────────────────────────
const ISO_W = 26, ISO_H = 13;
function iso(gx: number, gy: number, z = 0) {
  return { x: (gx - gy) * ISO_W, y: (gx + gy) * ISO_H - z };
}

const CITY = {
  ink: "#1A1814", paper: "#EEE6D2", grass: "#A9C49A", grassDk: "#7FA174",
  grassDeep: "#5F8765", road: "#C9BEA8",
  magenta: "#A55B88", magentaDk: "#7D4468", purple: "#7B5C94",
  teal: "#5E9C95", tealDk: "#3F7063", terra: "#C76D5F", terraDk: "#9A4F44",
  peach: "#E6B48E", cream: "#E8D9B4", yellow: "#E2BE66", beige: "#C9B998",
  brown: "#82554D", water: "#8FAEB6",
};

const towerPalettes = [
  { front: CITY.magenta,  side: CITY.magentaDk },
  { front: CITY.teal,     side: CITY.tealDk    },
  { front: CITY.terra,    side: CITY.terraDk   },
  { front: CITY.purple,   side: "#5A4272"      },
  { front: CITY.peach,    side: "#C09060"      },
  { front: CITY.yellow,   side: "#B0902E"      },
  { front: CITY.beige,    side: "#A09070"      },
  { front: CITY.water,    side: "#607880"      },
];
const subPalettes = [
  { front: "#D4A96A", side: "#A07840", roof: CITY.terra  },
  { front: "#A8C4A0", side: "#6E9068", roof: CITY.ink    },
  { front: "#C4B4A0", side: "#907860", roof: CITY.terra  },
  { front: "#B8D4C0", side: "#78A488", roof: CITY.tealDk },
];
function pick(i: number) { return towerPalettes[i % towerPalettes.length]; }

function Building({ gx, gy, w, d, h, color, sideColor, roofColor = CITY.ink, seed = 0 }: {
  gx:number; gy:number; w:number; d:number; h:number;
  color:string; sideColor:string; roofColor?:string; seed?:number;
}) {
  const bl = iso(gx, gy+d), br = iso(gx+w, gy+d), bc = iso(gx+w, gy);
  const tl = iso(gx, gy+d, h), tr = iso(gx+w, gy+d, h), tc = iso(gx+w, gy, h), t0 = iso(gx, gy, h);
  const cols = Math.max(1, Math.round(w*1.8));
  const rows = Math.max(1, Math.round(h/14));
  const ink = CITY.ink;
  return (
    <g>
      <polygon points={`${br.x},${br.y} ${bc.x},${bc.y} ${tc.x},${tc.y} ${tr.x},${tr.y}`} fill={sideColor} stroke={ink} strokeWidth="0.9"/>
      <polygon points={`${bl.x},${bl.y} ${br.x},${br.y} ${tr.x},${tr.y} ${tl.x},${tl.y}`} fill={color} stroke={ink} strokeWidth="0.9"/>
      <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${tc.x},${tc.y} ${t0.x},${t0.y}`} fill={roofColor} stroke={ink} strokeWidth="0.9"/>
      {Array.from({ length: rows }).map((_, r) => (
        <g key={r}>
          {Array.from({ length: cols }).map((_, c) => {
            const hash = (seed*73 + r*13 + c*29) % 100;
            const lit = hash < 55;
            const wx = bl.x + ((c+0.5)/cols)*(br.x-bl.x);
            const wy = bl.y + ((c+0.5)/cols)*(br.y-bl.y) - ((r+0.7)/(rows+0.3))*(bl.y-tl.y);
            const ww = Math.min(4, (br.x-bl.x)/cols*0.5);
            const wh = Math.min(5, (bl.y-tl.y)/(rows+0.3)*0.55);
            return <rect key={c} x={wx-ww/2} y={wy-wh/2} width={ww} height={wh}
              fill={lit ? CITY.cream : "#24211C"} stroke={ink} strokeWidth="0.4"/>;
          })}
        </g>
      ))}
    </g>
  );
}

function SpireTower({ gx, gy, w, d, h, color, sideColor, seed }: {
  gx:number; gy:number; w:number; d:number; h:number; color:string; sideColor:string; seed:number;
}) {
  const roofCenter = iso(gx+w/2, gy+d/2, h);
  const tip = iso(gx+w/2, gy+d/2, h+24);
  return (
    <g>
      <Building gx={gx} gy={gy} w={w} d={d} h={h} color={color} sideColor={sideColor} roofColor={CITY.ink} seed={seed}/>
      <polygon points={`${roofCenter.x-3},${roofCenter.y} ${roofCenter.x+3},${roofCenter.y} ${tip.x},${tip.y}`}
        fill={CITY.terraDk} stroke={CITY.ink} strokeWidth="0.8"/>
      <circle cx={tip.x} cy={tip.y} r="1.5" fill={CITY.yellow} stroke={CITY.ink} strokeWidth="0.5"/>
    </g>
  );
}

function Tree({ gx, gy, scale = 1, seed = 0 }: { gx:number; gy:number; scale?:number; seed?:number; }) {
  const p = iso(gx, gy);
  const delay = (seed % 10) * 0.2;
  return (
    <g transform={`translate(${p.x}, ${p.y})`} style={{ transformOrigin:"0 0", animation:`treeSway 3.8s ease-in-out ${delay}s infinite` }}>
      <rect x={-0.8*scale} y={-4*scale} width={1.6*scale} height={5*scale} fill={CITY.brown} stroke={CITY.ink} strokeWidth="0.5"/>
      <circle cx="0" cy={-7*scale} r={5.2*scale} fill={seed%3===0 ? CITY.grassDeep : CITY.grassDk} stroke={CITY.ink} strokeWidth="0.7"/>
      <circle cx={-2*scale} cy={-8.5*scale} r={2.2*scale} fill={CITY.grass} stroke={CITY.ink} strokeWidth="0.4"/>
    </g>
  );
}

function Cloud({ y, delay, duration, scale = 1, opacity = 0.85 }: { y:number; delay:number; duration:number; scale?:number; opacity?:number; }) {
  return (
    <g style={{ animation:`cloudDrift ${duration}s linear ${delay}s infinite` }} transform="translate(-2200, 0)" opacity={opacity}>
      <ellipse cx="0" cy={y} rx={55*scale} ry={18*scale} fill={CITY.cream} stroke={CITY.ink} strokeWidth="0.6"/>
      <ellipse cx={-22*scale} cy={y-8*scale} rx={28*scale} ry={14*scale} fill={CITY.cream} stroke={CITY.ink} strokeWidth="0.5"/>
      <ellipse cx={18*scale} cy={y-6*scale} rx={22*scale} ry={11*scale} fill={CITY.cream} stroke={CITY.ink} strokeWidth="0.5"/>
    </g>
  );
}

const CityScene = memo(function CityScene() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="580" ry="300" fill={CITY.paper}/>
      {/* Main roads */}
      <line x1={iso(-15,0).x} y1={iso(-15,0).y} x2={iso(15,0).x} y2={iso(15,0).y} stroke={CITY.road} strokeWidth="13"/>
      <line x1={iso(0,-15).x} y1={iso(0,-15).y} x2={iso(0,15).x} y2={iso(0,15).y} stroke={CITY.road} strokeWidth="13"/>
      {/* Downtown towers */}
      <Building gx={-3} gy={-4} w={2} d={2} h={110} color={pick(0).front} sideColor={pick(0).side} seed={1}/>
      <Building gx={-0.8} gy={-4} w={1.8} d={2} h={130} color={pick(1).front} sideColor={pick(1).side} seed={2}/>
      <SpireTower gx={1.2} gy={-4} w={1.6} d={1.8} h={150} color={pick(2).front} sideColor={pick(2).side} seed={3}/>
      <Building gx={3} gy={-4} w={1.8} d={2} h={98} color={pick(3).front} sideColor={pick(3).side} seed={4}/>
      <Building gx={-3} gy={-1.8} w={2} d={1.8} h={90} color={pick(4).front} sideColor={pick(4).side} seed={5}/>
      <Building gx={-0.8} gy={-1.8} w={1.8} d={1.8} h={120} color={pick(0).front} sideColor={pick(0).side} seed={6}/>
      <Building gx={1.2} gy={-1.8} w={1.6} d={1.8} h={106} color={pick(1).front} sideColor={pick(1).side} seed={7}/>
      <Building gx={3} gy={-1.8} w={1.8} d={1.8} h={86} color={pick(5).front} sideColor={pick(5).side} seed={8}/>
      <Building gx={-3} gy={1.2} w={1.8} d={2} h={78} color={pick(2).front} sideColor={pick(2).side} seed={9}/>
      <Building gx={-0.8} gy={1.2} w={1.6} d={2} h={102} color={pick(3).front} sideColor={pick(3).side} seed={10}/>
      <Building gx={1.2} gy={1.2} w={1.8} d={2} h={94} color={pick(6).front} sideColor={pick(6).side} roofColor={CITY.terraDk} seed={11}/>
      <Building gx={3} gy={1.2} w={1.6} d={2} h={70} color={pick(7).front} sideColor={pick(7).side} seed={12}/>
      {/* Mid-ring */}
      {([-7,-5,5,7] as number[]).flatMap(gx => ([-7,-5,5,7] as number[]).map(gy => {
        const k = Math.abs(gx + gy*3);
        const h = 30 + ((k*7) % 40);
        const p = towerPalettes[k % towerPalettes.length];
        return <Building key={`mb-${gx}-${gy}`} gx={gx} gy={gy} w={1.5} d={1.5} h={h} color={p.front} sideColor={p.side} seed={k}/>;
      }))}
      {/* Suburbs */}
      {([-14,-12,-10,10,12,14] as number[]).flatMap(gx => ([-14,-12,-10,10,12,14] as number[]).map(gy => {
        if (Math.abs(gx) > 13 && Math.abs(gy) > 13) return null;
        const k = Math.abs(gx*11 + gy*7);
        const h = 16 + ((k*3) % 22);
        const p = subPalettes[k % subPalettes.length];
        return <Building key={`sb-${gx}-${gy}`} gx={gx} gy={gy} w={1.4} d={1.4} h={h} color={p.front} sideColor={p.side} roofColor={p.roof} seed={k}/>;
      }))}
      {/* Trees */}
      {([-12,-10,-8,-6,-4,4,6,8,10,12] as number[]).flatMap(gx =>
        ([1,-1] as number[]).map(gy => <Tree key={`tx-${gx}-${gy}`} gx={gx} gy={gy*1.2} scale={0.65} seed={Math.abs(gx+gy*3)}/>)
      )}
      <Cloud y={-340} delay={0} duration={55}/>
      <Cloud y={-300} delay={20} duration={68} scale={0.75} opacity={0.65}/>
    </g>
  );
});

function InteractiveCity({ height = 220 }: { height?: number }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (interacted) return;
    let raf: number; let t = 0;
    const tick = () => { t += 0.003; setPos({ x: Math.sin(t)*22, y: Math.cos(t*0.6)*10 }); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [interacted]);

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true); setInteracted(true);
    const p = "touches" in e ? e.touches[0] : e;
    last.current = { x: p.clientX, y: p.clientY };
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const p = "touches" in e ? e.touches[0] : e;
    const dx = p.clientX - last.current.x, dy = p.clientY - last.current.y;
    last.current = { x: p.clientX, y: p.clientY };
    setPos(c => ({ x: Math.max(-500, Math.min(500, c.x+dx)), y: Math.max(-300, Math.min(300, c.y+dy)) }));
    if (Math.abs(dy) > Math.abs(dx)*0.5) setZoom(z => Math.max(0.5, Math.min(2.4, z - dy*0.006)));
  };
  const onUp = () => setDragging(false);
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault(); setInteracted(true);
    setZoom(z => Math.max(0.5, Math.min(2.4, z - e.deltaY*0.002)));
  };

  return (
    <div onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} onWheel={onWheel}
      style={{ position:"relative", width:"100%", height, borderRadius:20, overflow:"hidden",
        background:"linear-gradient(180deg,#EFE5D0 0%,#E8DCC0 60%,#DED0AF 100%)",
        border:`2.5px solid ${C.ink}`, boxShadow:`4px 4px 0 ${C.ink}`,
        cursor: dragging?"grabbing":"grab", userSelect:"none", touchAction:"none" }}>
      <div style={{ position:"absolute", inset:0,
        backgroundImage:"radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
        backgroundSize:"14px 14px", pointerEvents:"none" }}/>
      <svg viewBox="-500 -360 1000 720" preserveAspectRatio="xMidYMid meet"
        style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          transform:`translate(${pos.x}px,${pos.y}px) scale(${zoom})`,
          transition: dragging ? "none" : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          transformOrigin:"center", pointerEvents:"none",
          filter:"drop-shadow(0 6px 14px rgba(13,13,13,0.15))" }}>
        <CityScene/>
      </svg>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(circle at center,transparent 50%,rgba(237,229,213,0.7) 100%)" }}/>
      <div style={{ position:"absolute", bottom:10, left:12, padding:"4px 10px", borderRadius:9999,
        background:C.ink, color:C.cream, fontFamily:BODY, fontSize:9, fontWeight:700,
        letterSpacing:1.3, textTransform:"uppercase" }}>
        Chapinero · 248 rooms
      </div>
      {!interacted && (
        <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)",
          padding:"6px 12px", borderRadius:9999, background:C.ink, color:C.cream,
          fontFamily:BODY, fontSize:10, fontWeight:600, whiteSpace:"nowrap",
          animation:"floatHint 2s ease-in-out infinite" }}>
          ↑ arrastra · desliza arriba = zoom
        </div>
      )}
      <style>{`
        @keyframes treeSway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(2deg)} }
        @keyframes cloudDrift { 0%{transform:translateX(0)} 100%{transform:translateX(2200px)} }
        @keyframes floatHint { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-4px)} }
      `}</style>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function DotBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
      backgroundImage:"radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
      backgroundSize:"18px 18px" }}/>
  );
}


function SketchInput({ label, value, onChange, placeholder, type="text", error }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const inputType = type === "password" && showPw ? "text" : type;
  return (
    <div>
      {label && <div style={{ fontFamily:BODY, fontSize:10, fontWeight:800, color:C.ink,
        textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>{label}</div>}
      <div style={{ display:"flex", alignItems:"center", gap:10, height:50, padding:"0 14px",
        background:C.white, border:`2px solid ${error ? C.terra : C.ink}`,
        borderRadius:14, boxShadow: focused ? `3px 3px 0 ${C.ink}` : `2px 2px 0 ${C.ink}`,
        transform: focused ? "translate(-1px,-1px)" : "translate(0,0)", transition:"all 0.1s" }}>
        <input type={inputType} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex:1, border:"none", outline:"none", background:"transparent",
            fontFamily:BODY, fontSize:15, fontWeight:500, color:C.ink }}/>
        {type === "password" && value && (
          <button type="button" onClick={() => setShowPw(s => !s)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:C.coffee }}>
            {showPw ? "●" : "○"}
          </button>
        )}
      </div>
      {error && <div style={{ fontFamily:BODY, fontSize:11, color:C.terraDeep, marginTop:4, fontWeight:600 }}>{error}</div>}
    </div>
  );
}

function SketchBtn({ children, onClick, bg=C.green, disabled=false, type="button" }: {
  children: React.ReactNode; onClick?: () => void; bg?: string;
  disabled?: boolean; type?: "button" | "submit";
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{ width:"100%", height:54, border:`2.5px solid ${C.ink}`, background:bg, color:C.ink,
        borderRadius:16, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily:BODY, fontSize:15, fontWeight:700,
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:9,
        boxShadow: pressed ? `1px 1px 0 ${C.ink}` : `4px 4px 0 ${C.ink}`,
        transform: pressed ? "translate(3px,3px)" : "translate(0,0)",
        opacity: disabled ? 0.5 : 1, transition:"box-shadow 0.08s, transform 0.08s" }}>
      {children}
    </button>
  );
}

type SocialProvider = "google";

const SOCIAL_ICONS: Record<SocialProvider, React.ReactNode> = {
  google: (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  ),
};

function SketchSocial({ provider, onClick }: { provider: SocialProvider; onClick?: () => void }) {
  const [pressed, setPressed] = useState(false);
  const labels: Record<SocialProvider, string> = { google: "Continuar con Google" };
  return (
    <button type="button" onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{ width:"100%", height:50, border:`2px solid ${C.ink}`, background:C.white, borderRadius:14,
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        fontFamily:BODY, fontSize:14, fontWeight:600, color:C.ink,
        boxShadow: pressed ? `1px 1px 0 ${C.ink}` : `3px 3px 0 ${C.ink}`,
        transform: pressed ? "translate(2px,2px)" : "translate(0,0)",
        transition:"box-shadow 0.08s, transform 0.08s" }}>
      {SOCIAL_ICONS[provider]}
      {labels[provider]}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
      <div style={{ flex:1, height:1.5, background:C.ink, opacity:0.2 }}/>
      <div style={{ fontFamily:BODY, fontSize:10, color:C.coffee,
        textTransform:"uppercase", letterSpacing:1.5, fontWeight:700 }}>o con</div>
      <div style={{ flex:1, height:1.5, background:C.ink, opacity:0.2 }}/>
    </div>
  );
}

// ─── AuthLayout (responsive: mobile full-screen / desktop split) ─────────────
function AuthLayout({ headline, sub, leftExtra, backBtn, mobileTopContent, children }: {
  headline: React.ReactNode;
  sub?: string;
  leftExtra?: React.ReactNode;
  backBtn?: () => void;
  mobileTopContent?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight:"100vh", background:C.cream, position:"relative" }}>
      <DotBg/>
      <div className="relative z-10 flex flex-col md:flex-row" style={{ minHeight:"100vh" }}>

        {/* Left — desktop only */}
        <div className="hidden md:flex flex-col justify-center flex-1 overflow-hidden"
          style={{ padding:"64px 56px", position:"sticky", top:0, height:"100vh" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, alignSelf:"flex-start",
            padding:"6px 14px 6px 8px", borderRadius:9999, marginBottom:52,
            background:C.white, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}` }}>
            <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:26, height:26, objectFit:"contain" }}/>
            <span style={{ fontFamily:BODY, fontSize:13, fontWeight:700, color:C.ink }}>RentAI</span>
          </div>
          <div style={{ fontFamily:DISPLAY, fontSize:72, lineHeight:0.9, fontWeight:500,
            color:C.ink, letterSpacing:-3 }}>{headline}</div>
          {sub && <div style={{ fontFamily:BODY, fontSize:16, color:C.coffee, marginTop:18 }}>{sub}</div>}
          {leftExtra && <div style={{ marginTop:44 }}>{leftExtra}</div>}
        </div>

        {/* Right — form card */}
        <div className="flex flex-col flex-1 md:flex-none md:w-[480px] md:overflow-y-auto"
          style={{ position:"relative" }}>
          <div className="hidden md:block" style={{
            position:"absolute", inset:0, zIndex:0,
            background:C.white, borderLeft:`2.5px solid ${C.ink}`
          }}/>

          {mobileTopContent ? (
            <>
              <div className="flex flex-col flex-1 md:hidden" style={{ position:"relative", zIndex:1 }}>
                {mobileTopContent}
              </div>
              <div className="hidden md:flex flex-col flex-1" style={{ position:"relative", zIndex:1 }}>
                {children}
              </div>
            </>
          ) : (
            <div className="flex flex-col flex-1" style={{ position:"relative", zIndex:1 }}>
              <div className="md:hidden" style={{ padding:"52px 24px 0" }}>
                {backBtn ? (
                  <button type="button" onClick={backBtn}
                    style={{ width:40, height:40, borderRadius:12, background:C.white,
                      border:`2px solid ${C.ink}`, cursor:"pointer", boxShadow:`3px 3px 0 ${C.ink}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:16, marginBottom:20 }}>←</button>
                ) : (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                    padding:"6px 12px 6px 8px", borderRadius:9999, alignSelf:"flex-start", marginBottom:20,
                    background:C.white, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}` }}>
                    <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:22, height:22, objectFit:"contain" }}/>
                    <span style={{ fontFamily:BODY, fontSize:12, fontWeight:700, color:C.ink }}>RentAI</span>
                  </div>
                )}
                <div style={{ fontFamily:DISPLAY, fontSize:46, lineHeight:0.92, fontWeight:500,
                  color:C.ink, letterSpacing:-2, marginBottom:6 }}>{headline}</div>
                {sub && <div style={{ fontFamily:BODY, fontSize:14, color:C.coffee }}>{sub}</div>}
              </div>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-9 pt-4 md:px-11 md:pt-14 md:pb-12">
      {children}
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen({ onStart }: { onStart: (type: "login" | "register") => void }) {
  return (
    <AuthLayout
      headline={<>Hola.<br/><span style={{ fontStyle:"italic", color:C.terraDeep }}>bienvenido.</span></>}
      sub="Tu próximo hogar te espera en la ciudad."
      leftExtra={
        <img src="/Logo_finalfinal.png" alt="" style={{ width:200, height:200, objectFit:"contain" }}/>
      }
      mobileTopContent={
        <div style={{ padding:"52px 28px 36px", display:"flex", flexDirection:"column", flex:1 }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:160, height:160, objectFit:"contain" }}/>
          </div>
          <div>
            <div style={{ fontFamily:DISPLAY, fontSize:52, lineHeight:0.95, fontWeight:500,
              color:C.ink, letterSpacing:-2 }}>
              Hola.<br/><span style={{ fontStyle:"italic", color:C.terraDeep }}>bienvenido.</span>
            </div>
            <div style={{ fontFamily:BODY, fontSize:14, color:C.coffee, marginTop:10 }}>
              Tu próximo hogar te espera en la ciudad.
            </div>
          </div>
          <div style={{ marginTop:28, display:"flex", flexDirection:"column", gap:12 }}>
            <SketchBtn onClick={() => onStart("register")} bg={C.green}>Crear cuenta →</SketchBtn>
            <SketchBtn onClick={() => onStart("login")} bg={C.cream}>Ya tengo cuenta</SketchBtn>
          </div>
        </div>
      }
    >
      <FormPanel>
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:12 }}>
          <SketchBtn onClick={() => onStart("register")} bg={C.green}>Crear cuenta →</SketchBtn>
          <SketchBtn onClick={() => onStart("login")} bg={C.cream}>Ya tengo cuenta</SketchBtn>
        </div>
      </FormPanel>
    </AuthLayout>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onBack, onSuccess, onGoRegister, onLoading }: {
  onBack:()=>void; onSuccess:(role:Role)=>void; onGoRegister:()=>void; onLoading:(v:boolean)=>void;
}) {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = () => googleOAuth(setErr, onLoading);

  const submit = async () => {
    if (!email.includes("@")) { setErr("Email inválido"); return; }
    if (password.length < 4) { setErr("Contraseña muy corta"); return; }
    setErr(""); setLoading(true); onLoading(true);
    try {
      const result = await signIn!.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        onSuccess("student");
      } else {
        setErr("Se requiere verificación adicional");
      }
    } catch (e: any) {
      setErr(e.errors?.[0]?.longMessage || e.errors?.[0]?.message || "Credenciales incorrectas");
    } finally { setLoading(false); onLoading(false); }
  };

  return (
    <AuthLayout
      headline={<>Hola de <span style={{ fontStyle:"italic", color:C.terraDeep }}>nuevo.</span></>}
      sub="Tu ciudad te espera."
      backBtn={onBack}
      leftExtra={<InteractiveCity height={260}/>}
    >
      <FormPanel>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          <SketchInput label="Email" value={email} onChange={setEmail} placeholder="tu@uni.edu.co"/>
          <SketchInput label="Contraseña" value={password}
            onChange={v => { setPassword(v); setErr(""); }}
            placeholder="••••••••" type="password" error={err}/>
        </div>
        <div style={{ marginTop:"auto", paddingTop:16 }}>
          <SketchBtn onClick={submit} bg={C.green} disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión →"}
          </SketchBtn>
          <Divider/>
          <SketchSocial provider="google" onClick={handleGoogle}/>
          <div style={{ textAlign:"center", marginTop:16 }}>
            <span style={{ fontFamily:BODY, fontSize:13, color:C.coffee }}>¿No tienes cuenta? </span>
            <button type="button" onClick={onGoRegister}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontFamily:BODY, fontSize:13, fontWeight:700, color:C.ink,
                textDecoration:"underline", textDecorationThickness:2, textUnderlineOffset:3 }}>
              Regístrate
            </button>
          </div>
        </div>
      </FormPanel>
    </AuthLayout>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────
function RegisterScreen({ onBack, onSuccess, onGoLogin, onLoading }: {
  onBack:()=>void; onSuccess:(email:string, role:Role)=>void;
  onGoLogin:()=>void; onLoading:(v:boolean)=>void;
}) {
  const { signUp } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  const pwStrength = password.length===0 ? 0 : password.length<6 ? 1 : password.length<10 ? 2 : 3;
  const pwColors = ["transparent", C.terra, C.coffee, C.green];
  const pwLabels = ["","Débil","Media","Fuerte"];

  const handleGoogle = () => googleOAuth(setGlobalErr, onLoading);

  const submit = async () => {
    const e: Record<string,string> = {};
    if (firstName.length < 2) e.firstName = "Ingresa tu nombre";
    if (!email.includes("@")) e.email = "Email inválido";
    if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (!agreed) e.agreed = "Acepta los términos";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true); onLoading(true); setGlobalErr("");
    try {
      await signUp!.create({ emailAddress: email, password, firstName });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      onSuccess(email, role);
    } catch (err: any) {
      setGlobalErr(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Error al crear la cuenta");
    } finally { setLoading(false); onLoading(false); }
  };

  return (
    <AuthLayout
      headline={<>Crea tu<br/><span style={{ fontStyle:"italic", color:C.green }}>cuenta.</span></>}
      sub="30 segundos y empezamos a matchear."
      backBtn={onBack}
    >
      <FormPanel>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {([["student","Arrendatario",C.green],["owner","Propietario",C.terra]] as const).map(([r,label,color]) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              style={{ padding:"14px 10px", borderRadius:16,
                border:`2px solid ${role===r ? color : "rgba(0,0,0,0.12)"}`,
                background: role===r ? `${color}14` : C.white, cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                boxShadow: role===r ? `3px 3px 0 ${C.ink}` : "none",
                transition:"all 0.12s" }}>
              <div style={{ width:36, height:36, borderRadius:10,
                background: role===r ? color : "rgba(0,0,0,0.06)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                {r==="student" ? "🏠" : "🔑"}
              </div>
              <span style={{ fontFamily:BODY, fontSize:11, fontWeight:800,
                color: role===r ? color : C.coffee,
                textTransform:"uppercase", letterSpacing:0.8 }}>{label}</span>
            </button>
          ))}
        </div>
        <SketchSocial provider="google" onClick={handleGoogle}/>
        <Divider/>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SketchInput label="Nombre" value={firstName}
            onChange={v => { setFirstName(v); setErrors({...errors,firstName:""}); }}
            placeholder="María González" error={errors.firstName}/>
          <SketchInput label="Email" value={email}
            onChange={v => { setEmail(v); setErrors({...errors,email:""}); }}
            placeholder="tu@uni.edu.co" error={errors.email}/>
          <div>
            <SketchInput label="Contraseña" value={password}
              onChange={v => { setPassword(v); setErrors({...errors,password:""}); }}
              placeholder="Mínimo 8 caracteres" type="password" error={errors.password}/>
            {password.length > 0 && (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, display:"flex", gap:3 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ flex:1, height:4, borderRadius:2, transition:"background 0.2s",
                      background: i<=pwStrength ? pwColors[pwStrength] : "rgba(0,0,0,0.1)" }}/>
                  ))}
                </div>
                <span style={{ fontFamily:BODY, fontSize:11, fontWeight:700,
                  color:pwColors[pwStrength], textTransform:"uppercase", letterSpacing:1 }}>
                  {pwLabels[pwStrength]}
                </span>
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setAgreed(a => !a)}
          style={{ marginTop:18, padding:4, background:"none", border:"none", cursor:"pointer",
            display:"flex", alignItems:"flex-start", gap:10, textAlign:"left" }}>
          <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, marginTop:1,
            background: agreed ? C.green : "transparent",
            border:`1.5px solid ${agreed ? C.green : (errors.agreed ? C.terra : "rgba(0,0,0,0.3)")}`,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {agreed && <span style={{ color:C.white, fontSize:14, fontWeight:800 }}>✓</span>}
          </div>
          <div style={{ fontFamily:BODY, fontSize:13, lineHeight:1.4, color:C.coffee, flex:1 }}>
            Acepto los <span style={{ color:C.ink, fontWeight:600, textDecoration:"underline" }}>Términos</span> y la{" "}
            <span style={{ color:C.ink, fontWeight:600, textDecoration:"underline" }}>Política de Privacidad</span>
          </div>
        </button>
        {errors.agreed && <div style={{ fontFamily:BODY, fontSize:11, color:C.terraDeep, fontWeight:600 }}>{errors.agreed}</div>}
        {globalErr && <div style={{ fontFamily:BODY, fontSize:13, color:C.terraDeep, fontWeight:600, textAlign:"center", marginTop:8 }}>{globalErr}</div>}
        <div style={{ marginTop:20 }}>
          <SketchBtn onClick={submit} bg={C.green} disabled={loading}>
            {loading ? "Creando cuenta…" : "Crear cuenta →"}
          </SketchBtn>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <span style={{ fontFamily:BODY, fontSize:13, color:C.coffee }}>¿Ya tienes cuenta? </span>
            <button type="button" onClick={onGoLogin}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontFamily:BODY, fontSize:13, fontWeight:700, color:C.ink,
                textDecoration:"underline", textDecorationThickness:2, textUnderlineOffset:3 }}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </FormPanel>
    </AuthLayout>
  );
}

// ─── OTP ──────────────────────────────────────────────────────────────────────
function OTPScreen({ email, onBack, onSuccess }: { email:string; onBack:()=>void; onSuccess:()=>void }) {
  const { signUp, setActive } = useSignUp();
  const [code, setCode] = useState(["","","","","",""]);
  const [timer, setTimer] = useState(42);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = [useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),
                useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(timer-1), 1000); return () => clearTimeout(t); }
  }, [timer]);

  const setDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g,"").slice(-1);
    const next = [...code]; next[i] = digit; setCode(next);
    if (digit && i < 5) refs[i+1].current?.focus();
    if (next.every(c => c !== "")) verifyCode(next.join(""));
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs[i-1].current?.focus();
  };
  const verifyCode = async (fullCode: string) => {
    setLoading(true); setErr("");
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code: fullCode });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        onSuccess();
      } else {
        setErr("Código inválido. Intenta de nuevo.");
        setCode(["","","","","",""]);
        refs[0].current?.focus();
      }
    } catch {
      setErr("Código inválido. Intenta de nuevo.");
      setCode(["","","","","",""]);
      refs[0].current?.focus();
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      headline={<>Revisa tu<br/><span style={{ fontStyle:"italic", color:C.green }}>correo.</span></>}
      sub={`Código enviado a ${email}`}
      backBtn={onBack}
    >
      <FormPanel>
        <div style={{ marginTop:32, display:"flex", gap:8, justifyContent:"space-between" }}>
          {code.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} inputMode="numeric" maxLength={1}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              autoFocus={i===0}
              style={{ width:46, height:58, textAlign:"center",
                fontFamily:DISPLAY, fontSize:26, fontWeight:500, color:C.ink,
                background:C.white, border:`2px solid ${d ? C.green : C.ink}`,
                borderRadius:14, outline:"none", transition:"border-color 0.15s",
                boxShadow:`2px 2px 0 ${C.ink}` }}/>
          ))}
        </div>
        {err && <div style={{ fontFamily:BODY, fontSize:12, color:C.terraDeep, fontWeight:600, marginTop:12 }}>{err}</div>}
        <div style={{ marginTop:24, textAlign:"center" }}>
          {timer > 0 ? (
            <div style={{ fontFamily:BODY, fontSize:13, color:C.coffee }}>
              Reenviar en <span style={{ color:C.ink, fontWeight:600 }}>0:{String(timer).padStart(2,"0")}</span>
            </div>
          ) : (
            <button type="button"
              onClick={() => { setTimer(60); signUp?.prepareEmailAddressVerification({ strategy: "email_code" }); }}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontFamily:BODY, fontSize:14, fontWeight:700, color:C.green,
                textDecoration:"underline", textUnderlineOffset:3 }}>
              Reenviar código
            </button>
          )}
        </div>
        <div style={{ marginTop:"auto", paddingTop:32 }}>
          <SketchBtn onClick={() => verifyCode(code.join(""))} bg={C.green}
            disabled={loading || code.some(c => !c)}>
            {loading ? "Verificando…" : "Verificar →"}
          </SketchBtn>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <button type="button" onClick={onBack}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontFamily:BODY, fontSize:13, color:C.coffee }}>← Usar otro email</button>
          </div>
        </div>
      </FormPanel>
    </AuthLayout>
  );
}

// ─── Mode selection ───────────────────────────────────────────────────────────
function ModeScreen({ onSelect }: { onSelect:(mode:string)=>void }) {
  const [selected, setSelected] = useState<string|null>(null);
  const modes = [
    { id:"find-room",     label:"Busco\nhabitación", sub:"Encuentra un lugar cerca de tu universidad.",      bg:C.green,  fg:"#fff" },
    { id:"find-roommate", label:"Busco\nroommate",   sub:"Conecta con personas de estilos compatibles.",    bg:C.greenL, fg:C.greenDeep },
    { id:"landlord",      label:"Soy\npropietario",  sub:"Publica tu inmueble y elige a quién aceptar.",    bg:C.terra,  fg:"#fff" },
  ];
  return (
    <AuthLayout
      headline={<>¿Qué te trae<br/><span style={{ fontStyle:"italic", color:C.green }}>por aquí?</span></>}
      sub="Puedes cambiarlo después desde tu perfil."
    >
      <FormPanel>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {modes.map(m => {
            const isSel = selected === m.id;
            return (
              <button key={m.id} type="button" onClick={() => setSelected(m.id)}
                style={{ background:m.bg, color:m.fg, border:`2px solid ${isSel ? C.ink : "transparent"}`,
                  cursor:"pointer", borderRadius:24, padding:"20px 22px 18px", textAlign:"left",
                  boxShadow: isSel ? `4px 4px 0 ${C.ink}` : "0 2px 8px rgba(13,13,13,0.06)",
                  transform: isSel ? "translate(-2px,-2px)" : "translate(0,0)",
                  transition:"all 0.15s", WebkitTapHighlightColor:"transparent" }}>
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <div style={{ width:26, height:26, borderRadius:13,
                    background: isSel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.22)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isSel && <span style={{ color:m.bg, fontSize:14, fontWeight:800 }}>✓</span>}
                  </div>
                </div>
                <div style={{ fontFamily:DISPLAY, fontSize:30, lineHeight:0.95, fontWeight:500,
                  letterSpacing:-1.2, marginTop:10, whiteSpace:"pre-line" }}>
                  {m.label.split("\n").map((line,i) => (
                    <div key={i}>{i===1 ? <span style={{ fontStyle:"italic" }}>{line}</span> : line}</div>
                  ))}
                </div>
                <div style={{ fontFamily:BODY, fontSize:13, lineHeight:1.4, marginTop:8, opacity:0.85 }}>{m.sub}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop:24 }}>
          <SketchBtn onClick={() => selected && onSelect(selected)} bg={C.ink} disabled={!selected}>
            <span style={{ color:C.cream }}>Continuar →</span>
          </SketchBtn>
        </div>
      </FormPanel>
    </AuthLayout>
  );
}

// ─── Root orchestrator ────────────────────────────────────────────────────────
export function Onboarding() {
  const navigate = useRouter();
  const [screen, setScreen] = useState<Screen>("splash");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<Role>("student");
  const [globalLoading, setGlobalLoading] = useState(false);

  const handleLoginSuccess = (role: Role) => {
    navigate.push("/app/sync");
  };

  const handleRegisterSuccess = (email: string, role: Role) => {
    setRegEmail(email); setRegRole(role); setScreen("otp");
  };

  const handleOTPSuccess = () => {
    if (regRole === "owner") {
      navigate.push("/app/sync?mode=landlord&role=owner");
    } else {
      setScreen("mode");
    }
  };

  const handleModeSelect = async (mode: string) => {
    localStorage.setItem("userMode", mode);
    navigate.push(`/app/sync?mode=${encodeURIComponent(mode)}`);
  };

  const go = (s: Screen) => setScreen(s);

  if (globalLoading) {
    return (
      <div style={{ width:"100%", height:"100vh", background:C.cream, display:"flex",
        alignItems:"center", justifyContent:"center",
        backgroundImage:"radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
        backgroundSize:"18px 18px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8,
          padding:"7px 16px 7px 10px", borderRadius:9999,
          background:C.white, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}` }}>
          <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:22, height:22, objectFit:"contain" }}/>
          <span style={{ fontFamily:BODY, fontSize:13, fontWeight:700, color:C.ink }}>Entrando…</span>
        </div>
      </div>
    );
  }

  const screenMap: Record<Screen, React.ReactNode> = {
    splash: <SplashScreen onStart={type => go(type==="login" ? "login" : "register")}/>,
    login:  <LoginScreen onBack={() => go("splash")} onSuccess={handleLoginSuccess}
               onGoRegister={() => go("register")} onLoading={setGlobalLoading}/>,
    register: <RegisterScreen onBack={() => go("splash")} onSuccess={handleRegisterSuccess}
               onGoLogin={() => go("login")} onLoading={setGlobalLoading}/>,
    otp:  <OTPScreen email={regEmail} onBack={() => go("register")} onSuccess={handleOTPSuccess}/>,
    mode: <ModeScreen onSelect={handleModeSelect}/>,
  };

  return <div key={screen}>{screenMap[screen]}</div>;
}
