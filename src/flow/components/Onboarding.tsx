"use client";
import { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp, useAuth, useClerk } from "@clerk/nextjs";

async function googleAuth(
  clerk: any,
  resource: any,
  onError: (msg: string) => void,
  onLoading: (v: boolean) => void,
  role?: string,
  mode?: string
) {
  if (!clerk || !resource) return;
  onLoading(true);
  try {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (mode) params.set("mode", mode);
    
    const syncUrl = `/app/sync${params.toString() ? `?${params.toString()}` : ""}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const callbackUrl = `${origin}/sso-callback`;
    const finalUrl = `${origin}${syncUrl}`;

    const common = {
      strategy: "oauth_google" as any,
      redirectUrl: callbackUrl,
      redirectUrlComplete: finalUrl,
    };

    if (typeof resource.authenticateWithRedirect === "function") {
      await resource.authenticateWithRedirect(common);
    } else if (typeof resource.sso === "function") {
      await resource.sso(common);
    } else {
      throw new Error("No compatible authentication method found");
    }
  } catch (e: any) {
    if (e.message?.includes("already signed in")) {
       const params = new URLSearchParams();
       if (role) params.set("role", role);
       if (mode) params.set("mode", mode);
       window.location.href = `/app/sync${params.toString() ? `?${params.toString()}` : ""}`;
       return;
    }
    const msg = e.errors?.[0]?.longMessage || e.message || "Error con Google";
    onError(msg);
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

type Screen = "splash" | "login" | "register" | "otp" | "mode" | "forgot-password";
type Role   = "student" | "owner" | "roomie";

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
        marginRight: 4, width: "calc(100% - 4px)", // Safety space for shadow
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
      style={{ height:54, border:`2.5px solid ${C.ink}`, background:bg, color:C.ink,
        borderRadius:16, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily:BODY, fontSize:15, fontWeight:700,
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:9,
        boxShadow: pressed ? `1px 1px 0 ${C.ink}` : `4px 4px 0 ${C.ink}`,
        width: "calc(100% - 8px)", // Safety for shadow
        margin: "0 auto",
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
      style={{ width: "calc(100% - 8px)", height:50, border:`2px solid ${C.ink}`, background:C.white, borderRadius:14,
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        fontFamily:BODY, fontSize:14, fontWeight:600, color:C.ink,
        boxShadow: pressed ? `1px 1px 0 ${C.ink}` : `3px 3px 0 ${C.ink}`,
        margin: "0 auto",
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
function AuthLayout({ headline, sub, leftExtra, backBtn, mobileTopContent, children, isMobile }: {
  headline: React.ReactNode;
  sub?: string;
  leftExtra?: React.ReactNode;
  backBtn?: () => void;
  mobileTopContent?: React.ReactNode;
  children: React.ReactNode;
  isMobile?: boolean;
}) {
  return (
    <div style={{ position:"relative", minHeight:"100dvh", background:C.cream, display:"block" }}>
      <DotBg/>
      <div className="relative z-10 w-full md:max-w-[1440px] md:mx-auto md:flex md:flex-row min-h-[100dvh]">

        {/* Left — desktop only */}
        {!isMobile && (
          <div className="hidden md:flex flex-col justify-center flex-1 overflow-hidden"
            style={{ padding:"64px 56px", position:"sticky", top:0, height:"100dvh" }}>
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
        )}

        {/* Right — form card */}
        <div className="flex flex-col w-full md:w-[480px] min-h-[100dvh]"
          style={{ position:"relative", background:C.white }}>
          <div className="hidden md:block" style={{
            position:"absolute", inset:0, zIndex:0,
            background:C.white, borderLeft:`2.5px solid ${C.ink}`
          }}/>

          {mobileTopContent ? (
            <>
              <div className="flex flex-col flex-1 md:hidden min-h-[100dvh]" style={{ position:"relative", zIndex:1 }}>
                {mobileTopContent}
              </div>
              <div className="hidden md:flex flex-col flex-1" style={{ position:"relative", zIndex:1 }}>
                {children}
              </div>
            </>
          ) : (
            <div className="flex flex-col flex-1" style={{ position:"relative", zIndex:1 }}>
              <div className="md:hidden" style={{ padding:"24px 24px 0", flexShrink:0 }}>
                {backBtn ? (
                  <button type="button" onClick={backBtn}
                    style={{ width:36, height:36, borderRadius:12, background:C.white,
                      border:`2px solid ${C.ink}`, cursor:"pointer", boxShadow:`3px 3px 0 ${C.ink}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:16, marginBottom:14 }}>←</button>
                ) : (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                    padding:"6px 12px 6px 8px", borderRadius:9999, alignSelf:"flex-start", marginBottom:14,
                    background:C.white, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}` }}>
                    <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:22, height:22, objectFit:"contain" }}/>
                    <span style={{ fontFamily:BODY, fontSize:12, fontWeight:700, color:C.ink }}>RentAI</span>
                  </div>
                )}
                <div style={{ fontFamily:DISPLAY, fontSize:"min(32px, 8vw)", lineHeight:0.92, fontWeight:500,
                  color:C.ink, letterSpacing:-1.5, marginBottom:4 }}>{headline}</div>
                {sub && <div style={{ fontFamily:BODY, fontSize:13, color:C.coffee }}>{sub}</div>}
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
    <div className="flex flex-col flex-1 px-5 pb-6 pt-3 md:px-11 md:pt-14 md:pb-12" style={{ boxSizing: "border-box", overflowX: "hidden" }}>
      {children}
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen({ onStart, onGoogle, isMobile }: { onStart:(t:"login"|"register")=>void; onGoogle:()=>void; isMobile?:boolean }) {
  return (
    <AuthLayout
      headline={<>Hola.<br/><span style={{ fontStyle:"italic", color:C.terraDeep }}>bienvenido.</span></>}
      sub="Tu próximo hogar te espera en la ciudad."
      leftExtra={
        <img src="/Logo_finalfinal.png" alt="" style={{ width:200, height:200, objectFit:"contain" }}/>
      }
      mobileTopContent={
        <div style={{ padding:"52px 28px 20px", display:"flex", flexDirection:"column", flex:1, minHeight:"100dvh" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:40 }}>
            <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:180, height:180, objectFit:"contain" }}/>
          </div>
          <div>
            <div style={{ fontFamily:DISPLAY, fontSize:36, lineHeight:0.95, fontWeight:500,
              color:C.ink, letterSpacing:-2 }}>
              Hola.<br/><span style={{ fontStyle:"italic", color:C.terraDeep }}>bienvenido.</span>
            </div>
            <div style={{ fontFamily:BODY, fontSize:14, color:C.coffee, marginTop:10 }}>
              Tu próximo hogar te espera en la ciudad.
            </div>
          </div>
          <div style={{ marginTop:"auto", paddingTop:40, display:"flex", flexDirection:"column", gap:12 }}>
            <SketchBtn onClick={() => onStart("register")} bg={C.green}>Crear cuenta →</SketchBtn>
            <SketchBtn onClick={() => onStart("login")} bg={C.cream}>Ya tengo cuenta</SketchBtn>
          </div>
        </div>
      }
      isMobile={isMobile}
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
function LoginScreen({ onBack, onSuccess, onGoRegister, onGoForgotPassword, onLoading, onGoogle, isMobile }: {
  onBack:()=>void; onSuccess:(role:Role)=>void; onGoRegister:()=>void; onGoForgotPassword:(email?:string)=>void; onLoading:(v:boolean)=>void; onGoogle:()=>void; isMobile?:boolean;
}) {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes("@")) { setErr("Email inválido"); return; }
    if (password.length < 4) { setErr("Contraseña muy corta"); return; }
    setErr(""); setLoading(true); onLoading(true);
    try {
      const res = await signIn!.create({ identifier: email, password });
      if (res.status === "complete") {
        await setActive!({ session: res.createdSessionId });
        onSuccess("student");
      } else {
        setErr("Se requiere verificación adicional para esta cuenta.");
      }
    } catch (e: any) {
      console.error("Error en login:", e);
      let msg = e.errors?.[0]?.longMessage || e.errors?.[0]?.message || e.message || "Credenciales incorrectas";
      if (msg.includes("identifier") || msg.includes("email")) msg = "El correo ingresado no es correcto.";
      else if (msg.includes("password")) msg = "La contraseña es incorrecta.";
      setErr(msg);
    } finally { setLoading(false); onLoading(false); }
  };

  return (
    <AuthLayout
      headline={<>Hola de <span style={{ fontStyle:"italic", color:C.terraDeep }}>nuevo.</span></>}
      sub="Tu ciudad te espera."
      backBtn={onBack}
      leftExtra={<InteractiveCity height={260}/>}
      isMobile={isMobile}
    >
      <FormPanel>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          <SketchInput label="Email" value={email} onChange={setEmail} placeholder="tu@uni.edu.co"/>
          <SketchInput label="Contraseña" value={password}
            onChange={v => { setPassword(v); setErr(""); }}
            placeholder="••••••••" type="password" error={err}/>
          <div style={{ textAlign:"right", marginTop:-4 }}>
            <button type="button" onClick={() => onGoForgotPassword(email)}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontFamily:BODY, fontSize:12, fontWeight:600, color:C.coffee,
                textDecoration:"underline", textUnderlineOffset:2 }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
        <div style={{ marginTop:"auto", paddingTop:16 }}>
          <SketchBtn onClick={submit} bg={C.green} disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión →"}
          </SketchBtn>
          <Divider/>
          <SketchSocial provider="google" onClick={onGoogle}/>
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
function RegisterScreen({ onBack, onSuccess, onGoLogin, onLoading, onGoogle, isMobile }: {
  onBack:()=>void; onSuccess:(email:string, role:Role)=>void;
  onGoLogin:()=>void; onLoading:(v:boolean)=>void; onGoogle:()=>void; isMobile?:boolean;
}) {
  const { signUp } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const submit = async () => {
    const e: Record<string,string> = {};
    if (firstName.length < 2) e.firstName = "Ingresa tu nombre";
    if (lastName.length < 2) e.lastName = "Ingresa tu apellido";
    if (!email.includes("@")) e.email = "Email inválido";
    if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (!agreed) e.agreed = "Acepta los términos";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!signUp) {
      setGlobalErr("El sistema de registro aún está cargando. Espera un momento.");
      return;
    }

    setLoading(true); 
    onLoading(true); 
    setGlobalErr("");
    console.log("Iniciando creación de cuenta para:", email);

    try {
      // 1. Crear el usuario en Clerk
      const res = await signUp.create({ emailAddress: email, password, firstName, lastName });
      
      if (res.error) {
        let msg = res.error.longMessage || res.error.message || "Error al crear la cuenta";
        if (msg.includes("data breach")) msg = "Esta contraseña es poco segura (aparece en filtraciones). Por favor usa una diferente.";
        else if (msg.includes("already exists") || msg.includes("in use")) msg = "Este correo ya está registrado. Intenta iniciar sesión.";
        else if (msg.includes("short")) msg = "La contraseña es demasiado corta.";
        
        setGlobalErr(msg);
        setLoading(false); onLoading(false);
        return;
      }

      console.log("Usuario creado en Clerk:", signUp.status);
      
      // 2. Preparar verificación por email
      const verifyRes = await signUp.verifications.sendEmailCode();
      if (verifyRes.error) {
        setGlobalErr(verifyRes.error.longMessage || "Error al enviar el código de verificación.");
        setLoading(false); onLoading(false);
        return;
      }

      console.log("Código de verificación enviado.");
      onSuccess(email, role);
    } catch (err: any) {
      console.error("Error inesperado:", err);
      setGlobalErr("Ocurrió un error inesperado. Por favor intenta de nuevo.");
    } finally { 
      setLoading(false); 
      onLoading(false); 
    }
  };

  return (
    <AuthLayout
      headline={<>Crea tu<br/><span style={{ fontStyle:"italic", color:C.green }}>cuenta.</span></>}
      sub="30 segundos y empezamos a matchear."
      backBtn={onBack}
      isMobile={isMobile}
    >
      <FormPanel>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8, marginBottom:20 }}>
          {[
            { id: "student", label: "Habitación", icon: "🏠", color: C.green },
            { id: "roomie", label: "Roomie", icon: "🤝", color: "#6386A6" },
            { id: "owner", label: "Propietario", icon: "🔑", color: C.terra }
          ].map(({ id, label, icon, color }) => (
            <button key={id} type="button" onClick={() => setRole(id as any)}
              style={{ padding:"12px 6px", borderRadius:16,
                border:`2px solid ${role===id ? color : "rgba(0,0,0,0.12)"}`,
                background: role===id ? `${color}14` : C.white, cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                boxShadow: role===id ? `3px 3px 0 ${C.ink}` : "none",
                transition:"all 0.12s" }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background: role===id ? color : "rgba(0,0,0,0.06)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                {icon}
              </div>
              <span style={{ fontFamily:BODY, fontSize:9, fontWeight:800,
                color: role===id ? color : C.coffee,
                textTransform:"uppercase", letterSpacing:0.5, textAlign:"center" }}>{label}</span>
            </button>
          ))}
        </div>
        <SketchSocial provider="google" onClick={onGoogle}/>
        <Divider/>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SketchInput label="Nombre" value={firstName}
            onChange={v => { setFirstName(v); setErrors({...errors,firstName:""}); }}
            placeholder="Ej: Juan" error={errors.firstName}/>
          <SketchInput label="Apellido" value={lastName}
            onChange={v => { setLastName(v); setErrors({...errors,lastName:""}); }}
            placeholder="Ej: Pérez" error={errors.lastName}/>
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
function OTPScreen({ email, onBack, onSuccess, isMobile }: { email:string; onBack:()=>void; onSuccess:()=>void; isMobile?:boolean }) {
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
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
      console.log("Verificando código:", fullCode);
      const { error } = await signUp!.verifications.verifyEmailCode({ code: fullCode });
      
      if (error) {
        console.error("Error verificando código:", error);
        setErr(error.longMessage || "Código inválido o expirado. Intenta de nuevo.");
        setCode(["","","","","",""]);
        refs[0].current?.focus();
        return;
      }

      if (signUp!.status === "complete") {
        await setActive!({ session: signUp!.createdSessionId });
        onSuccess();
      } else {
        console.log("Status incompleto:", signUp!.status);
        setErr("El registro aún no está completo. Revisa los datos.");
      }
    } catch (e: any) {
      console.error("Error inesperado en OTP:", e);
      setErr("Ocurrió un error. Intenta reenviar el código.");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      headline={<>Revisa tu<br/><span style={{ fontStyle:"italic", color:C.green }}>correo.</span></>}
      sub={`Código enviado a ${email}`}
      backBtn={onBack}
      isMobile={isMobile}
    >
      <FormPanel>
        <div style={{ marginTop:32, display:"flex", gap:6, justifyContent:"space-between" }}>
          {code.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} inputMode="numeric" maxLength={1}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              autoFocus={i===0}
              style={{ flex:1, minWidth:0, height:54, textAlign:"center",
                fontFamily:DISPLAY, fontSize:22, fontWeight:500, color:C.ink,
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
              onClick={() => { setTimer(60); signUp?.verifications.sendEmailCode(); }}
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
                  {m.label.split("\n").map((line,i) => (line.includes("\n") ? line.split("\n").map((l,idx) => <div key={idx}>{l}</div>) : <div key={i}>{line}</div>))}
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

// ─── Forgot Password ──────────────────────────────────────────────────────────
function ForgotPasswordScreen({ initialEmail, onBack, onSuccess }: { initialEmail: string; onBack: () => void; onSuccess: () => void }) {
  const { signIn } = useSignIn();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!email.includes("@")) { setError("Email inválido"); return; }
    setLoading(true); setError("");
    try {
      await signIn!.create({ identifier: email });
      await signIn!.resetPasswordEmailCode.sendCode();
      setStep("verify");
    } catch (e: any) {
      setError(e.errors?.[0]?.longMessage || "Error al enviar el código");
    } finally { setLoading(true); setLoading(false); }
  };

  const submitReset = async () => {
    if (code.length < 6) { setError("Código incompleto"); return; }
    if (newPassword.length < 8) { setError("Contraseña muy corta"); return; }
    setLoading(true); setError("");
    try {
      await signIn!.resetPasswordEmailCode.verifyCode({ code });
      const res = await signIn!.resetPasswordEmailCode.submitPassword({ password: newPassword });
      if (res.status === "complete") {
        onSuccess();
      } else {
        setError("Error al finalizar el restablecimiento.");
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.longMessage || "Código o contraseña inválida");
    } finally { setLoading(false); }
  };

  const pwStrength = newPassword.length===0 ? 0 : newPassword.length<6 ? 1 : newPassword.length<10 ? 2 : 3;
  const pwColors = ["transparent", C.terra, C.coffee, C.green];
  const pwLabels = ["","Débil","Media","Fuerte"];

  return (
    <AuthLayout
      headline={<>Recuperar<br/><span style={{ fontStyle:"italic", color:C.terraDeep }}>acceso.</span></>}
      sub={step === "email" ? "Te enviaremos un código de seguridad." : `Código enviado a ${email}`}
      backBtn={onBack}
    >
      <FormPanel>
        {step === "email" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <SketchInput label="Tu Email" value={email} onChange={setEmail} placeholder="tu@uni.edu.co" error={error}/>
            <div style={{ marginTop:24 }}>
              <SketchBtn onClick={sendCode} bg={C.green} disabled={loading}>
                {loading ? "Enviando…" : "Enviar código de seguridad →"}
              </SketchBtn>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <SketchInput label="Código" value={code} onChange={setCode} placeholder="123456" error={error}/>
            <div>
              <SketchInput label="Nueva Contraseña" value={newPassword} onChange={setNewPassword} placeholder="Mínimo 8 caracteres" type="password"/>
              {newPassword.length > 0 && (
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
            <div style={{ marginTop:24 }}>
              <SketchBtn onClick={submitReset} bg={C.green} disabled={loading}>
                {loading ? "Cambiando…" : "Restablecer contraseña →"}
              </SketchBtn>
            </div>
            <button onClick={() => setStep("email")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:BODY, fontSize:13, color:C.coffee, textAlign:"center", marginTop:10 }}>
              Reenviar código
            </button>
          </div>
        )}
      </FormPanel>
    </AuthLayout>
  );
}

// ─── Root orchestrator ────────────────────────────────────────────────────────
export function Onboarding() {
  const navigate = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const [screen, setScreen] = useState<Screen>("splash");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<Role>("student");
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Redirigir automáticamente si ya hay una sesión activa a la sincronización
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      navigate.push("/app/sync");
    }
  }, [isAuthLoaded, isSignedIn, navigate]);

  const handleLoginSuccess = (role: Role) => {
    navigate.push("/app/sync");
  };

  const handleRegisterSuccess = (email: string, role: Role) => {
    setRegEmail(email); setRegRole(role); setScreen("otp");
  };

  const handleOTPSuccess = () => {
    if (regRole === "owner") {
      navigate.push("/app/sync?mode=landlord&role=owner");
    } else if (regRole === "roomie") {
      navigate.push("/app/sync?mode=find-roommate&role=student");
    } else {
      setScreen("mode");
    }
  };

  const handleModeSelect = async (mode: string) => {
    localStorage.setItem("userMode", mode);
    navigate.push(`/app/sync?mode=${encodeURIComponent(mode)}`);
  };

  const go = async (s: Screen, reset = false) => {
    if (reset) {
      console.log("[Onboarding] Ejecutando reset de sesión...");
      try {
        await clerk.signOut();
        localStorage.clear();
        setGlobalError("");
      } catch (e) {
        console.error("Error en reset:", e);
      }
    }
    setScreen(s);
  };

  // Evitar parpadeo si ya está autenticado
  if (isAuthLoaded && isSignedIn) {
    return (
      <div style={{ width:"100%", height:"100vh", background:C.cream, display:"flex",
        alignItems:"center", justifyContent:"center" }}>
        <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:40, height:40, objectFit:"contain", animation:"spin 2s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }


  const screenMap: Record<Screen, React.ReactNode> = {
    splash: (
      <SplashScreen 
        isMobile={isMobile}
        onStart={type => go(type === "login" ? "login" : "register")}
        onGoogle={() => googleAuth(clerk, signIn, setGlobalError, setGlobalLoading)}
      />
    ),
    login:  (
      <LoginScreen 
        isMobile={isMobile}
        onBack={() => go("splash", true)} 
        onSuccess={handleLoginSuccess}
        onGoRegister={() => go("register")} 
        onGoForgotPassword={(e) => { if(e) setRegEmail(e); go("forgot-password"); }}
        onLoading={setGlobalLoading}
        onGoogle={() => googleAuth(clerk, signIn, setGlobalError, setGlobalLoading)}
      />
    ),
    register: (
      <RegisterScreen 
        isMobile={isMobile}
        onBack={() => go("splash", true)} 
        onSuccess={handleRegisterSuccess}
        onGoLogin={() => go("login")} 
        onLoading={setGlobalLoading}
        onGoogle={() => googleAuth(clerk, signUp, setGlobalError, setGlobalLoading, "student", "find-room")}
      />
    ),
    otp:  <OTPScreen isMobile={isMobile} email={regEmail} onBack={() => go("register")} onSuccess={handleOTPSuccess}/>,
    mode: <ModeScreen onSelect={handleModeSelect}/>,
    "forgot-password": <ForgotPasswordScreen initialEmail={regEmail} onBack={() => go("login")} onSuccess={() => go("login")}/>,
  };

  return (
    <div style={{ position: "relative", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {globalError && (
        <div style={{ padding: 12, background: "#FEE2E2", color: "#B91C1C", borderBottom: "1px solid #EF4444", textAlign: "center", fontFamily: BODY, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {globalError}
          <button onClick={() => setGlobalError("")} style={{ marginLeft: 12, background: "none", border: "none", color: "#B91C1C", cursor: "pointer", fontWeight: 900 }}>✕</button>
        </div>
      )}
      <div key={screen} style={{ display: "contents" }}>
        {screenMap[screen]}
      </div>

      {globalLoading && (
        <div style={{ 
          position: "fixed", inset: 0, zIndex: 999, 
          background: "rgba(242, 236, 223, 0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center" 
        }}>
          <div style={{ 
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 9999,
            background: C.white, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}` 
          }}>
            <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 24, height: 24, objectFit: "contain", animation: "spin 2s linear infinite" }} />
            <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink }}>Procesando…</span>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
