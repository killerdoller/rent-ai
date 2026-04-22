"use client";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { LayoutDashboard, Building2, Users, Heart, MessageCircle, LogOut } from "lucide-react";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:      "#0D0D0D",
  cream:    "#F7F2EC",
  white:    "#FFFFFF",
  terra:    "#D87D6F",
  terraFg:  "#FFFFFF",
  coffee:   "#82554D",
  border:   "rgba(130,85,77,0.14)",
};

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useRouter();
  const { signOut } = useClerk();

  const navItems = [
    { path: "/owner/dashboard",  icon: LayoutDashboard,  label: "Dashboard" },
    { path: "/owner/properties", icon: Building2,        label: "Propiedades" },
    { path: "/owner/interested", icon: Users,            label: "Interesados" },
    { path: "/owner/matches",    icon: Heart,            label: "Matches" },
    { path: "/owner/chat",       icon: MessageCircle,    label: "Chats" },
  ];

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("owner_id");
    localStorage.removeItem("owner_email");
    localStorage.removeItem("userMode");
    navigate.push("/app");
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:C.cream }}>
      {/* Desktop Sidebar */}
      <div style={{
        position:"fixed", top:0, left:0, bottom:0, width:240,
        background:C.white, borderRight:`1.5px solid ${C.border}`,
        flexDirection:"column", padding:"32px 20px 28px",
      }} className="hidden md:flex">
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8, alignSelf:"flex-start",
          padding:"6px 12px 6px 8px", borderRadius:9999, marginBottom:40,
          background:C.cream, border:`1.5px solid ${C.border}`,
        }}>
          <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width:24, height:24, objectFit:"contain" }}/>
          <span style={{ fontFamily:DISPLAY, fontSize:15, fontWeight:500, color:C.ink, letterSpacing:-0.4 }}>RentAI</span>
        </div>
        <div style={{ fontFamily:BODY, fontSize:10, fontWeight:700, color:C.coffee,
          textTransform:"uppercase", letterSpacing:1.4, marginTop:-28, marginBottom:28, marginLeft:2 }}>
          Propietario
        </div>

        <nav style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate.push(item.path)}
                style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"11px 14px", borderRadius:12,
                  background: isActive ? C.terra : "transparent",
                  color: isActive ? C.terraFg : C.coffee,
                  border:"none", cursor:"pointer",
                  fontFamily:BODY, fontSize:14, fontWeight:600,
                  transition:"all 0.12s", textAlign:"left",
                }}>
                <Icon style={{ width:18, height:18, flexShrink:0 }}/>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button onClick={handleLogout}
          style={{
            display:"flex", alignItems:"center", gap:10, width:"100%",
            padding:"11px 14px", borderRadius:12,
            background:"transparent", color:C.coffee,
            border:"none", cursor:"pointer",
            fontFamily:BODY, fontSize:14, fontWeight:600,
            transition:"all 0.12s", textAlign:"left",
          }}>
          <LogOut style={{ width:18, height:18 }}/>
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}
        className="md:ml-60">
        <main style={{ flex:1, overflowY:"auto", minHeight:0 }}>{children}</main>

        {/* Mobile Bottom Nav */}
        <nav style={{
          justifyContent:"space-around", alignItems:"center",
          height:64, paddingBottom:"env(safe-area-inset-bottom)",
          background:C.white, borderTop:`1.5px solid ${C.border}`,
          flexShrink:0,
        }} className="flex md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate.push(item.path)}
                style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                  padding:"6px 8px", background:"none", border:"none", cursor:"pointer",
                  color: isActive ? C.terra : C.coffee,
                }}>
                <Icon style={{ width:22, height:22 }} strokeWidth={isActive ? 2.2 : 1.8}/>
                <span style={{ fontFamily:BODY, fontSize:9, fontWeight:600 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
