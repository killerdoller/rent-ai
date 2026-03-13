import { useNavigate } from "react-router-dom";
import { Home, Users, Key } from "lucide-react";

export function Onboarding() {
  const navigate = useNavigate();

  const modes = [
    {
      id: "find-room",
      icon: Home,
      title: "Busco Habitación",
      description: "Encuentra tu lugar ideal para vivir",
      color: "bg-[#63A694]",
    },
    {
      id: "find-roommate",
      icon: Users,
      title: "Busco Roommate",
      description: "Encuentra compañeros de cuarto compatibles",
      color: "bg-[#A8D1B1]",
    },
    {
      id: "landlord",
      icon: Key,
      title: "Soy Propietario",
      description: "Publica tu propiedad y encuentra inquilinos",
      color: "bg-[#D87D6F]",
    },
  ];

  const handleSelectMode = (modeId) => {
    // Guardar modo en localStorage o contexto
    localStorage.setItem("userMode", modeId);
    navigate("/app/home");
  };

  return (
    <div className="min-h-screen bg-[#A8D1B1] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Logo y título */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/Logo_finalfinal.png"
              alt="RentAI Logo"
              className="w-24 h-24 md:w-32 md:h-32 object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0D0D0D] mb-3">
            Bienvenido a RentAI
          </h1>
          <p className="text-[#0D0D0D]/80 text-lg md:text-xl">
            Encuentra tu match perfecto para vivir
          </p>
        </div>

        {/* Opciones de modo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-left group"
              >
                <div className={`${mode.color} w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#0D0D0D]">
                  {mode.title}
                </h3>
                <p className="text-[#82554D]">{mode.description}</p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-[#0D0D0D]/70 text-sm">
            Plataforma de matching inteligente para vivienda estudiantil
          </p>
        </div>
      </div>
    </div>
  );
}