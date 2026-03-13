import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Send, Phone, Video, MoreVertical, Bot, Sparkles } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other" | "ai";
  timestamp: string;
}

export function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const isAI = id === "ai";

  const chatName = isAI
    ? "Asistente IA RoomiMatch"
    : id === "1"
    ? "Apartamento Moderno en Chapinero"
    : id === "2"
    ? "María García"
    : "Apartamento Compartido Luminoso";

  const chatImage = isAI
    ? null
    : id === "1"
    ? "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"
    : id === "2"
    ? "https://images.unsplash.com/photo-1645664747204-31fee58898dc?w=400"
    : "https://images.unsplash.com/photo-1593853814555-6951885ffa63?w=400";

  const [messages, setMessages] = useState<Message[]>(
    isAI
      ? [
          {
            id: 1,
            text: "¡Hola! Soy tu asistente de IA. Puedo ayudarte a encontrar el apartamento perfecto. ¿Qué tipo de lugar estás buscando?",
            sender: "ai",
            timestamp: "10:00",
          },
        ]
      : [
          {
            id: 1,
            text: "¡Hola! Me interesa conocer más sobre el apartamento",
            sender: "user",
            timestamp: "10:00",
          },
          {
            id: 2,
            text: "¡Hola! Claro, con gusto te cuento más. ¿Qué te gustaría saber?",
            sender: "other",
            timestamp: "10:02",
          },
          {
            id: 3,
            text: "¿Cuál es la disponibilidad y los servicios incluyen internet?",
            sender: "user",
            timestamp: "10:05",
          },
        ]
  );

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate response
    if (isAI) {
      setTimeout(() => {
        const aiResponse: Message = {
          id: messages.length + 2,
          text: "Basado en tus preferencias, te recomiendo revisar los apartamentos en Chapinero. Tienen excelente conectividad y están cerca de varias universidades. ¿Te gustaría ver opciones en esa zona?",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    } else {
      setTimeout(() => {
        const response: Message = {
          id: messages.length + 2,
          text: "Disponible desde el 1 de abril. Sí, internet de fibra óptica está incluido, al igual que servicios públicos básicos.",
          sender: "other",
          timestamp: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, response]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate("/chat")}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {isAI ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{chatName}</h2>
              <div className="flex items-center gap-1 text-sm text-primary">
                <Sparkles className="w-3 h-3" />
                <span>Asistente inteligente</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <img
              src={chatImage || ""}
              alt={chatName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="font-semibold">{chatName}</h2>
              <p className="text-sm text-green-500">En línea</p>
            </div>
          </div>
        )}

        {!isAI && (
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <Phone className="w-5 h-5 text-primary" />
            </button>
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <Video className="w-5 h-5 text-primary" />
            </button>
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] md:max-w-md rounded-2xl px-4 py-3 ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.sender === "ai"
                  ? "bg-[#A8D1B1]/20 border border-primary/30 text-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              <p className="text-sm md:text-base">{msg.text}</p>
              <span
                className={`text-xs mt-1 block ${
                  msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-3 bg-secondary/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}