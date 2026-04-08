"use client";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Users, Heart, LogOut } from "lucide-react";

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useRouter();

  const navItems = [
    { path: "/owner/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/owner/properties", icon: Building2, label: "Mis propiedades" },
    { path: "/owner/interested", icon: Users, label: "Interesados" },
    { path: "/owner/matches", icon: Heart, label: "Matches" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("owner_id");
    localStorage.removeItem("owner_email");
    localStorage.removeItem("userMode");
    navigate.push("/app");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:bg-card md:border-r md:border-border">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <img src="/Logo_finalfinal.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-lg font-semibold text-primary">RentAI</h1>
              <p className="text-xs text-muted-foreground">Propietario</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate.push(item.path)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#D87D6F] text-white"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cambiar usuario</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-0 md:ml-64 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto min-h-0">{children}</main>

        {/* Mobile Navigation */}
        <nav className="border-t border-border bg-card shadow-lg md:hidden">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate.push(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    isActive ? "text-[#D87D6F]" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "fill-[#D87D6F]" : ""}`} />
                  <span className="text-[9px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
