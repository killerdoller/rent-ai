"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Design tokens match Onboarding.tsx
const C = {
  green:     "#63A694",
  greenL:    "#A8D1B1",
  greenDeep: "#3D7360",
  terra:     "#D87D6F",
  ink:       "#0D0D0D",
  cream: "#FFFFFF",
  white:     "#FFFFFF",
  coffee:    "#82554D"
};
const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";

export default function RoleSelectionPage() {
  const navigate = useRouter();
  const [selected, setSelected] = useState(null);
  
  const modes = [
    { id:"find-room",     label:"Busco\nhabitación", sub:"Encuentra un lugar cerca de tu universidad.",      bg:C.green,  fg:"#fff", role: "student" },
    { id:"find-roommate", label:"Busco\nroommate",   sub:"Conecta con personas de estilos compatibles.",    bg:C.greenL, fg:C.greenDeep, role: "student" },
    { id:"landlord",      label:"Soy\npropietario",  sub:"Publica tu inmueble y elige a quién aceptar.",    bg:C.terra,  fg:"#fff", role: "owner" },
  ];

  const handleContinue = () => {
    if (!selected) return;
    const mode = modes.find(m => m.id === selected);
    localStorage.setItem("userMode", selected);
    // Redirigir de vuelta a sync con los parámetros elegidos
    navigate.push(`/app/sync?mode=${encodeURIComponent(selected)}&role=${mode.role}`);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      {/* Background Dots */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        backgroundImage:"radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
        backgroundSize:"18px 18px" }}/>

      <div style={{ position:"relative", width:"100%", maxWidth:480, background:C.white, border:`2.5px solid ${C.ink}`, borderRadius:32, boxShadow:`8px 8px 0 ${C.ink}`, padding:"40px 32px" }}>
        
        <header style={{ marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            padding:"6px 14px 6px 8px", borderRadius:9999, marginBottom:24,
            background:C.cream, border:`2px solid ${C.ink}`, boxShadow:`3px 3px 0 ${C.ink}` }}>
            <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:24, height:24, objectFit:"contain" }}/>
            <span style={{ fontFamily:BODY, fontSize:12, fontWeight:700, color:C.ink }}>RentAI</span>
          </div>
          <h1 style={{ fontFamily:DISPLAY, fontSize:38, lineHeight:0.95, fontWeight:500, color:C.ink, letterSpacing:-1.5 }}>
            ¿Qué te trae<br/><span style={{ fontStyle:"italic", color:C.green }}>por aquí?</span>
          </h1>
          <p style={{ fontFamily:BODY, fontSize:14, color:C.coffee, marginTop:12 }}>Elige tu rol para continuar con tu perfil.</p>
        </header>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {modes.map(m => {
            const isSel = selected === m.id;
            return (
              <button key={m.id} type="button" onClick={() => setSelected(m.id)}
                style={{ background:m.bg, color:m.fg, border:`2.5px solid ${isSel ? C.ink : "transparent"}`,
                  cursor:"pointer", borderRadius:20, padding:"20px 22px 18px", textAlign:"left",
                  boxShadow: isSel ? `4px 4px 0 ${C.ink}` : "0 2px 8px rgba(13,13,13,0.06)",
                  transform: isSel ? "translate(-2px,-2px)" : "translate(0,0)",
                  transition:"all 0.15s", outline: "none" }}>
                <div style={{ display:"flex", justifyContent:"flex-end", height:0 }}>
                   <div style={{ width:24, height:24, borderRadius:12, 
                    background: isSel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.22)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isSel && <span style={{ color:m.bg, fontSize:13, fontWeight:800 }}>✓</span>}
                  </div>
                </div>
                <div style={{ fontFamily:DISPLAY, fontSize:26, lineHeight:1, fontWeight:500, letterSpacing:-0.8 }}>
                  {m.label.split("\n")[0]} <span style={{ fontStyle:"italic" }}>{m.label.split("\n")[1]}</span>
                </div>
                <div style={{ fontFamily:BODY, fontSize:12, marginTop:6, opacity:0.85 }}>{m.sub}</div>
              </button>
            );
          })}
        </div>

        <button 
          onClick={handleContinue}
          disabled={!selected}
          style={{ width:"100%", height:56, marginTop:32, border:`2.5px solid ${C.ink}`, background:C.ink, color:C.white,
            borderRadius:18, cursor: !selected ? "not-allowed" : "pointer",
            fontFamily:BODY, fontSize:15, fontWeight:700, opacity: !selected ? 0.5 : 1,
            transition:"all 0.1s", boxShadow: !selected ? "none" : `4px 4px 0 ${C.greenL}` }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}
