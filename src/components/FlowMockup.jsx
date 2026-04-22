"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Circle, Send, ArrowRight, Sparkles } from 'lucide-react';

export default function FlowMockup() {
    const [currentFrame, setCurrentFrame] = useState(1);
    const [showTyping, setShowTyping] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentFrame === 1) {
                setShowTyping(true);
                setTimeout(() => {
                    setShowTyping(false);
                    setCurrentFrame(3);
                }, 1500);
            } else if (currentFrame === 3) {
                setTimeout(() => {
                    setCurrentFrame(4);
                }, 1000);
            } else if (currentFrame === 4) {
                setShowTyping(true);
                setTimeout(() => {
                    setShowTyping(false);
                    setCurrentFrame(6);
                }, 1500);
            } else if (currentFrame === 6) {
                setTimeout(() => {
                    setCurrentFrame(7);
                }, 2000);
            } else if (currentFrame === 7) {
                setTimeout(() => {
                    setCurrentFrame(8);
                }, 2000);
            } else if (currentFrame === 8) {
                setTimeout(() => {
                    setCurrentFrame(1);
                    setShowTyping(false);
                }, 5000);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [currentFrame]);

    const messages = [
        {
            id: 1,
            type: 'user',
            text: 'Busco un apartamento de 2 habitaciones cerca del centro. Presupuesto $2.2M. Mascotas sí.',
            frame: 1
        },
        {
            id: 2,
            type: 'bot',
            text: '¡Excelente elección! ¿Qué tan cerca quieres estar exactamente? (¿5-10 min caminando?)',
            frame: 3
        },
        {
            id: 3,
            type: 'user',
            text: 'Sí, máximo 10 minutos. Y ojalá con mucha luz natural.',
            frame: 4
        },
        {
            id: 4,
            type: 'bot',
            text: 'Perfecto. He filtrado 3 opciones que encajan perfectamente con lo que buscas:',
            frame: 6
        }
    ];

    const properties = [
        {
            id: 1,
            title: '2H • 1B • 62 m²',
            distance: 'a 6 min',
            price: '$2.150.000',
            match: '98%',
            chips: ['Mascotas', 'Luz natural']
        },
        {
            id: 2,
            title: '2H • 2B • 68 m²',
            distance: 'a 8 min',
            price: '$2.200.000',
            match: '94%',
            chips: ['Balcón', 'Remodelado']
        }
    ];

    return (
        <div className="w-full max-w-2xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-primary/20 shadow-2xl overflow-hidden shadow-primary/5"
            >
                {/* Header */}
                <div className="bg-white/80 border-b border-primary/10 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
                            <img src="/Logo_finalfinal.png" alt="RentAI" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-black text-text-main tracking-tight">Asistente RentAI</h3>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
                                <Circle className="w-1.5 h-1.5 fill-current animate-pulse" />
                                <span>En línea • Matcher Inteligente</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                    </div>
                </div>

                {/* Chat Area */}
                <div className="p-8 space-y-6 h-[500px] overflow-y-auto scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {messages.map((message) => {
                            if (message.frame > currentFrame) return null;

                            return (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] shadow-sm ${message.type === 'user'
                                                ? 'bg-primary text-white rounded-br-none font-medium'
                                                : 'bg-white border border-primary/10 text-text-main rounded-bl-none font-medium'
                                            }`}
                                    >
                                        <p className="text-[15px] leading-relaxed italic">{message.text}</p>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {showTyping && (
                            <motion.div
                                key="typing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white/60 px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 border border-primary/10">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                            className="w-1.5 h-1.5 bg-primary/40 rounded-full"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {currentFrame >= 7 && (
                            <div key="properties" className="space-y-4 pt-4">
                                {properties.map((prop, idx) => (
                                    <motion.div
                                        key={prop.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.2 }}
                                        className="group bg-white rounded-3xl p-5 border border-primary/5 hover:border-primary/20 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-mint-soft/20 flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">
                                                🏠
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-black text-text-main">{prop.title}</h4>
                                                    <span className="text-primary font-black text-xs bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
                                                        {prop.match} Match
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 text-xs font-bold text-text-muted">
                                                    <span>{prop.distance}</span>
                                                    <span>•</span>
                                                    <span className="text-primary">{prop.price}</span>
                                                </div>
                                                <div className="flex gap-1.5 mt-3">
                                                    {prop.chips.map(chip => (
                                                        <span key={chip} className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md">
                                                            {chip}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {currentFrame >= 8 && (
                            <motion.div
                                key="final-message"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-4 mt-8"
                            >
                                <div className="flex justify-start">
                                    <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded-[1.5rem] rounded-bl-none">
                                        <p className="text-sm font-bold text-primary italic">
                                            ¿Te gustaría que agende una visita virtual para ti mañana? ✨
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                                        ¡Sí, agendar ahora!
                                    </button>
                                    <button className="bg-white border-2 border-primary/20 text-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors">
                                        Ver más opciones
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Bar */}
                <div className="bg-white/80 p-6 border-t border-primary/10">
                    <div className="flex gap-3 bg-slate-50 p-2 pl-6 rounded-2xl border border-slate-100 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <input
                            type="text"
                            placeholder="Pregúntale cualquier cosa a RentAI..."
                            className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-text-main placeholder:text-slate-300"
                            readOnly
                        />
                        <button className="bg-primary p-3 rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            <p className="text-center mt-6 text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
                Animación generada por el Motor de IA de RentAI
            </p>
        </div>
    );
}
