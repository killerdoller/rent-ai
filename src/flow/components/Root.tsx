"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, User, Flame } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream:  "#F7F2EC",
  white:  "#FFFFFF",
  green:  "#63A694",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

const sidebarStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
  background: C.white, borderRight: `1.5px solid ${C.border}`,
  flexDirection: "column", padding: "32px 20px 28px",
};

const logoPillStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
  padding: "6px 12px 6px 8px", borderRadius: 9999, marginBottom: 40,
  background: C.cream, border: `1.5px solid ${C.border}`,
};

export function Root({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [localLoggedIn, setLocalLoggedIn] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const userId = localStorage.getItem("rentai_user_id");
    const ownerId = localStorage.getItem("owner_id");
    const loggedIn = !!userId || !!ownerId;
    setLocalLoggedIn(loggedIn);

    // Global Sync Guard: Si está en Clerk pero no en local, forzar sync
    if (isLoaded && isSignedIn && !loggedIn) {
      const allowedPaths = ["/app/sync", "/sso-callback", "/app", "/app/role-selection"];
      if (!allowedPaths.includes(pathname)) {
        navigate.push("/app/sync");
      }
    }
  }, [pathname, isLoaded, isSignedIn]);

  const isLoggedIn = isLoaded ? (isSignedIn || localLoggedIn) : localLoggedIn;

  const authPaths = ["/app/sync", "/app/role-selection", "/app/complete-profile", "/owner/complete-profile", "/sso-callback"];
  const isAuthPage = pathname === "/app" || authPaths.some(p => pathname === p || pathname?.startsWith(p + "/"));
  
  // Solo mostramos la navegación si el componente ya montó en cliente
  // Y el usuario ya está sincronizado localmente
  // Y NO estamos en una página de proceso de autenticación o perfil.
  const hideNav = !hasMounted || isAuthPage || !localLoggedIn;

  const navItems = [
    { path: "/app/home",    icon: Flame,        label: "Descubrir" },
    { path: "/app/matches", icon: Heart,         label: "Conexiones" },
    { path: "/app/chat",    icon: MessageCircle, label: "Chats" },
    { path: "/app/profile", icon: User,          label: "Perfil" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.cream }}>

      {/* Desktop Sidebar — Tailwind controls visibility */}
      {!hideNav && (
        <div className="hidden md:flex" style={sidebarStyle}>
          <div style={logoPillStyle}>
            <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 24, height: 24, objectFit: "contain" }}/>
            <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, letterSpacing: -0.4 }}>RentAI</span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = pathname?.startsWith(path);
              return (
                <button key={path} onClick={() => navigate.push(path)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "11px 14px", borderRadius: 12,
                  background: isActive ? C.green : "transparent",
                  color: isActive ? C.white : C.coffee,
                  border: "none", cursor: "pointer",
                  fontFamily: BODY, fontSize: 14, fontWeight: 600,
                  transition: "all 0.12s", textAlign: "left",
                }}>
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }}/>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex flex-col flex-1 min-h-0 ${!hideNav ? "md:ml-60" : ""}`}>
        <main style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {children}
        </main>

        {/* Mobile Bottom Nav — Tailwind controls visibility */}
        {!hideNav && (
          <nav className="flex md:hidden" style={{
            justifyContent: "space-around", alignItems: "center",
            height: 64, flexShrink: 0,
            background: C.white, borderTop: `1.5px solid ${C.border}`,
          }}>
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = pathname?.startsWith(path);
              return (
                <button key={path} onClick={() => navigate.push(path)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "6px 12px", background: "none", border: "none", cursor: "pointer",
                  color: isActive ? C.green : C.coffee,
                }}>
                  <Icon style={{ width: 22, height: 22 }} strokeWidth={isActive ? 2.2 : 1.8}/>
                  <span style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600 }}>{label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
