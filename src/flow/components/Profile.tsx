import { useState } from "react";
import { Camera, Edit2, MapPin, GraduationCap, Calendar, Home, Settings, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router";

export function Profile() {
  const navigate = useNavigate();
  const userMode = localStorage.getItem("userMode") || "find-room";
  const [isEditing, setIsEditing] = useState(false);

  const getModeLabel = () => {
    switch (userMode) {
      case "find-room":
        return "Buscando habitación";
      case "find-roommate":
        return "Buscando roommate";
      case "landlord":
        return "Propietario";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Mi Perfil</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-5xl">👤</span>
              </div>
              <button className="absolute bottom-4 right-0 p-2 bg-white text-primary rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-2xl font-semibold mb-1">Juan Pérez</h2>
            <p className="text-white/80">{getModeLabel()}</p>
          </div>
        </div>
      </header>

      {/* Profile Details */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {/* Info Cards */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Universidad</p>
                <p className="font-medium">Universidad Nacional de Colombia</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Ubicación Preferida</p>
                <p className="font-medium">Chapinero, Bogotá</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium">Marzo 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Preferencias</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span>Presupuesto máximo</span>
              <span className="font-semibold text-primary">$1,500,000 COP</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span>Tipo de vivienda</span>
              <span className="font-semibold">Apartamento compartido</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span>Mascotas</span>
              <span className="font-semibold">No</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">12</div>
            <div className="text-sm text-muted-foreground">Matches</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-3xl font-bold text-accent mb-1">8</div>
            <div className="text-sm text-muted-foreground">Guardados</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-3xl font-bold text-secondary mb-1">95%</div>
            <div className="text-sm text-muted-foreground">Match Rate</div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors border-b border-border">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span>Configuración</span>
          </button>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors border-b border-border">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span>Privacidad y seguridad</span>
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 p-4 hover:bg-accent/10 transition-colors text-accent"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Change Mode */}
        <button
          onClick={() => navigate("/")}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Cambiar modo de búsqueda
        </button>
      </div>
    </div>
  );
}