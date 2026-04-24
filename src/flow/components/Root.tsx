"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, User, Flame } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream: "#FFFFFF",
  white:  "#FFFFFF",
  green:  "#D87D6F",
  coffee: "#4B5563",
  border: "rgba(0,0,0,0.08)",
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
  const [localLoggedIn, setLocalLoggedIn] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const userId = localStorage.getItem("rentai_user_id");
    const ownerId = localStorage.getItem("owner_id");
    setLocalLoggedIn(!!userId || !!ownerId);

    // Block access to tenant app routes until profile is complete
    const profileCompleted = localStorage.getItem("profile_completed");
    const isProtectedTenantRoute = pathname?.startsWith("/app/") &&
      pathname !== "/app" &&
      !pathname.startsWith("/app/sync") &&
      !pathname.startsWith("/app/complete-profile");

    if (isProtectedTenantRoute && userId && profileCompleted === "false") {
      navigate.replace("/app/complete-profile");
    }
  }, [pathname]);

  const isLoggedIn = localLoggedIn;

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
    <div className="flex flex-col md:flex-row w-full overflow-x-hidden" style={{ background: C.cream, minHeight: "100dvh", position: "relative" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Desktop Sidebar — Tailwind controls visibility */}
      {!hideNav && (
        <div className="hidden md:flex flex-col" style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
          background: C.white, borderRight: `1.5px solid ${C.border}`,
          padding: "32px 20px 28px", zIndex: 40
        }}>
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
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
          {/* Espaciador para la nav móvil fija */}
          {!hideNav && <div className="md:hidden" style={{ height: "calc(64px + env(safe-area-inset-bottom))", flexShrink: 0 }} />}
        </main>

        {/* Mobile Bottom Nav — Tailwind controls visibility */}
        {!hideNav && (
          <nav className="md:hidden" style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)",
            background: C.white, borderTop: `1.5px solid ${C.border}`,
          }}>
            <div style={{ height: 64, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = pathname?.startsWith(path);
                return (
                  <button key={path} onClick={() => navigate.push(path)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "6px 16px", background: "none", border: "none", cursor: "pointer",
                    color: isActive ? C.green : C.coffee,
                  }}>
                    <Icon style={{ width: 22, height: 22 }} strokeWidth={isActive ? 2.2 : 1.8}/>
                    <span style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
