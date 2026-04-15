"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, User, Flame } from "lucide-react";

export function Root({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("rentai_user_id");
    const ownerId = localStorage.getItem("owner_id");
    setIsLoggedIn(!!userId || !!ownerId);
  }, [pathname]);

  // Ocultar nav en la página de login/registro y cuando no hay sesión
  const isAuthPage = pathname === "/app";
  const hideNav = isAuthPage || !isLoggedIn;

  const navItems = [
    { path: "/app/home", icon: Flame, label: "Descubrir" },
    { path: "/app/matches", icon: Heart, label: "Conexiones" },
    { path: "/app/chat", icon: MessageCircle, label: "Chats" },
    { path: "/app/profile", icon: User, label: "Perfil" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!hideNav && (
        <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:bg-card md:border-r md:border-border">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/Logo_finalfinal.png"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-xl font-semibold text-primary">RentAI</h1>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate.push(item.path)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 min-h-0 ${!hideNav ? 'md:ml-64' : ''}`}>
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>

        {/* Mobile Navigation */}
        {!hideNav && (
          <nav className="border-t border-border bg-card shadow-lg md:hidden">
            <div className="flex justify-around items-center h-16 px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate.push(item.path)}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? "fill-primary" : ""}`} />
                    <span className="text-[10px]">{item.label}</span>
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