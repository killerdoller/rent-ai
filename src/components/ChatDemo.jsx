import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Circle } from 'lucide-react';

export const ChatDemo = () => {
    const [currentFrame, setCurrentFrame] = useState(1);
    const [showTyping, setShowTyping] = useState(false);

    // Auto-advance frames with loop
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentFrame === 1) {
                setShowTyping(true);
                setTimeout(() => {
                    setShowTyping(false);
                    setCurrentFrame(3);
                }, 1000);
            } else if (currentFrame === 3) {
                setTimeout(() => {
                    setCurrentFrame(4);
                }, 800);
            } else if (currentFrame === 4) {
                setShowTyping(true);
                setTimeout(() => {
                    setShowTyping(false);
                    setCurrentFrame(6);
                }, 1000);
            } else if (currentFrame === 6) {
                setTimeout(() => {
                    setCurrentFrame(7);
                }, 1500);
            } else if (currentFrame === 7) {
                setTimeout(() => {
                    setCurrentFrame(8);
                }, 1500);
            } else if (currentFrame === 8) {
                // Wait at final frame, then loop back
                setTimeout(() => {
                    setCurrentFrame(1);
                    setShowTyping(false);
                }, 3000);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [currentFrame]);

    const messages = [
        {
            id: 1,
            type: 'user',
            text: 'Busco un apartamento de 2 habitaciones y 1 baño cerca de un centro comercial central. Presupuesto $2.200.000. Mascotas sí.',
            frame: 1
        },
        {
            id: 2,
            type: 'bot',
            text: 'Perfecto. ¿Qué tan cerca quieres estar del centro comercial? (5–10 min caminando / 10–20 en transporte)',
            frame: 3
        },
        {
            id: 3,
            type: 'user',
            text: '5–10 caminando. Y ojalá con buena luz natural.',
            frame: 4
        },
        {
            id: 4,
            type: 'bot',
            text: 'Listo. Te dejo 3 opciones con mejor match:',
            frame: 6
        }
    ];

    const properties = [
        {
            id: 1,
            title: '2H • 1B • 62 m²',
            distance: 'a 6 min',
            price: '$2.150.000',
            match: '92%',
            chips: [
                { label: 'Mascotas', color: 'green' },
                { label: 'Luz natural', color: 'neutral' },
                { label: 'Transporte', color: 'neutral' }
            ]
        },
        {
            id: 2,
            title: '2H • 1B • 58 m²',
            distance: 'a 8 min',
            price: '$2.200.000',
            match: '89%',
            chips: [
                { label: 'Balcón', color: 'neutral' },
                { label: 'Remodelado', color: 'neutral' },
                { label: 'Mascotas con depósito', color: 'warm' }
            ]
        },
        {
            id: 3,
            title: '2H • 1B • 65 m²',
            distance: 'a 10 min',
            price: '$2.050.000',
            match: '86%',
            chips: [
                { label: 'Zona tranquila', color: 'neutral' },
                { label: 'Cocina abierta', color: 'neutral' }
            ]
        }
    ];

    return (
        <div className="w-full">
            {/* Chat Component */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
                style={{
                    backgroundColor: 'rgba(199, 217, 191, 0.05)'
                }}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center gap-1 border-slate-100">
                    <div className="w-16 h-16 flex items-center justify-center">
                        <img
                            src="/Logo_finalfinal.png"
                            alt="RentAI Logo"
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-text-main">RentAI Asistente</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-olive-match">
                            <Circle className="w-1.5 h-1.5 fill-current" />
                            <span>En línea</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="px-6 py-6 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto" style={{ backgroundColor: 'rgba(199, 217, 191, 0.08)' }}>
                    <AnimatePresence mode="popLayout">
                        {messages.map((message) => {
                            if (message.frame > currentFrame) return null;

                            return (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.type === 'user'
                                            ? 'rounded-br-md bg-primary/10 border border-primary/20 text-text-main'
                                            : 'rounded-bl-md bg-slate-100 border border-slate-200 text-text-main'
                                            }`}
                                    >
                                        <p className="text-sm font-medium leading-relaxed">{message.text}</p>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Typing indicator */}
                        {showTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-start"
                            >
                                <div className="px-5 py-3 rounded-2xl rounded-bl-md flex items-center gap-1 bg-slate-100 border border-slate-200">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                delay: i * 0.15
                                            }}
                                            className="w-1.5 h-1.5 rounded-full bg-text-muted"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Property Cards */}
                        {currentFrame >= 7 && (
                            <div className="space-y-3 pt-2">
                                {properties.map((property, index) => (
                                    <motion.div
                                        key={property.id}
                                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: index * 0.15,
                                            ease: 'easeOut'
                                        }}
                                        className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3 21L3 10L12 3L21 10V21" stroke="#A65D8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M9 21V15H15V21" stroke="#A65D8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M19 21V12" stroke="#A65D8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline justify-between mb-2">
                                                    <h4 className="text-sm font-black text-text-main">{property.title}</h4>
                                                    <div className="px-2 py-0.5 rounded-full text-[10px] font-black bg-olive-match/10 text-olive-match">
                                                        Match {property.match}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs mb-3 text-text-muted font-bold">
                                                    <span>{property.distance}</span>
                                                    <span>•</span>
                                                    <span className="font-black text-text-main">{property.price}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {property.chips.map((chip, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                                                            style={
                                                                chip.color === 'green'
                                                                    ? { backgroundColor: 'rgba(104, 140, 79, 0.1)', color: '#688C4F', border: '1px solid rgba(104, 140, 79, 0.2)' }
                                                                    : chip.color === 'warm'
                                                                        ? { backgroundColor: 'rgba(191, 126, 126, 0.1)', color: '#BF7E7E', border: '1px solid rgba(191, 126, 126, 0.2)' }
                                                                        : { backgroundColor: 'rgba(121, 133, 140, 0.1)', color: '#79858C', border: '1px solid rgba(121, 133, 140, 0.2)' }
                                                            }
                                                        >
                                                            {chip.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Final message */}
                        {currentFrame >= 8 && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-4"
                            >
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 text-text-main">
                                        <p className="text-sm font-medium leading-relaxed">
                                            ¿Quieres que priorice precio, tamaño o amenities (balcón/parqueadero/gym)?
                                        </p>
                                    </div>
                                </div>

                                {/* CTAs */}
                                <div className="flex gap-3 justify-start pl-1">
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider text-white bg-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                                    >
                                        Guardar búsqueda
                                    </motion.button>
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider border-2 border-primary text-primary hover:bg-primary/5 transition-all"
                                    >
                                        Ver más
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Escribe tu consulta..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary/40 text-sm font-medium placeholder:text-slate-300 transition-all"
                        />
                        <button
                            className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-primary hover:opacity-90 transition-all"
                        >
                            Enviar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
