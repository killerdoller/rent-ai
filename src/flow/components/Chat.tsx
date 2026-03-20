"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, Bot } from "lucide-react";

interface ChatPreview {
  id: number;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isOnline?: boolean;
}

const mockChats: ChatPreview[] = [
  {
    id: 1,
    name: "Apartamento Moderno en Chapinero",
    image: "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400",
    lastMessage: "¡Hola! Me interesa conocer más sobre el apartamento",
    timestamp: "Hace 5 min",
    unread: 2,
    isOnline: true,
  },
  {
    id: 2,
    name: "María García",
    image: "https://images.unsplash.com/photo-1645664747204-31fee58898dc?w=400",
    lastMessage: "¿Cuándo podemos conocernos?",
    timestamp: "Hace 1 hora",
    unread: 0,
    isOnline: true,
  },
  {
    id: 5,
    name: "Apartamento Compartido Luminoso",
    image: "https://images.unsplash.com/photo-1593853814555-6951885ffa63?w=400",
    lastMessage: "Los servicios están incluidos en el precio",
    timestamp: "Ayer",
    unread: 0,
    isOnline: false,
  },
];

export function Chat() {
  const [chats] = useState(mockChats);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useRouter();

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Mensajes</h1>
              <p className="text-muted-foreground mt-1">
                {chats.filter(c => c.unread > 0).length} conversaciones sin leer
              </p>
            </div>
            <button
              onClick={() => navigate.push("/app/chat/ai")}
              className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg"
            >
              <Bot className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Chat List */}
      <div className="max-w-4xl mx-auto pb-24 md:pb-6">
        {filteredChats.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No hay conversaciones</h2>
            <p className="text-muted-foreground">
              Cuando hagas match, podrás chatear aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate.push(`/app/chat/${chat.id}`)}
                className="w-full p-4 hover:bg-secondary/30 transition-colors flex items-center gap-4 text-left"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.image}
                    alt={chat.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {chat.name}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unread > 0 && (
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">
                      {chat.unread}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}