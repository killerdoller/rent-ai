"use client";
import React, { useState } from 'react';
import { content } from './data/content';
import { Section } from './components/Section';
import { ScrollAnimation } from './components/ScrollAnimation';
import { ChatDemo } from './components/ChatDemo';
import FlowMockup from './components/FlowMockup';
import AuthForm from './components/AuthForm';
import Link from 'next/link';
import Image from 'next/image';



const Navbar = ({ onLoginClick }) => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-1 group cursor-pointer">
                <div className="w-20 h-20 transition-transform duration-700 group-hover:scale-110 flex items-center justify-center">
                    <img src="/Logo_finalfinal.png" alt="RentAI Logo" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black tracking-tighter text-text-main">Rent<span className="text-primary italic">AI</span></span>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-10">
                {content.nav.links.map(link => (
                    <a key={link.name} href={link.href} className="text-[14px] font-bold text-text-muted hover:text-primary transition-all">
                        {link.name}
                    </a>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={onLoginClick}
                    className="text-[14px] font-bold text-text-muted hover:text-text-main transition-colors px-4"
                >
                    {content.nav.login}
                </button>
                <Link
                    href="/app"
                    className="bg-primary hover:opacity-90 text-white text-[14px] font-black px-8 py-3 rounded-full transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                >
                    {content.nav.cta}
                </Link>
            </div>
        </div>
    </nav>
);

const Hero = () => {
    const totalFrames = 191;
    const baseUrl = "https://qtolgzslaxgiaoomophi.supabase.co/storage/v1/object/public/animacion/casita/frame_";
    const frames = Array.from({ length: totalFrames }, (_, i) => {
        const frameIndex = i.toString().padStart(3, '0');
        return `${baseUrl}${frameIndex}_delay-0.041s.webp`;
    });

    return (
        <header className="h-[250vh] relative">
            <div className="sticky top-0 h-[100vh] flex flex-col justify-center items-center pt-20 overflow-hidden">
                {/* Scroll Animation Background */}
                <div className="absolute inset-0 z-[1] overflow-hidden bg-bg-light">
                    <ScrollAnimation frames={frames} className="w-full h-full block" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#C7D9BF]/60 to-[#2A333A]/40 z-[2]" />
                </div>

                <div className="relative z-10 text-center max-w-3xl mx-auto px-6 w-full">
                    <div className="space-y-6 mb-12">
                        <h1
                            className="text-6xl sm:text-8xl font-black tracking-tighter leading-[1] text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                            style={{ fontWeight: 900 }}
                        >
                            Encuentra tu hogar en pocos clicks
                        </h1>
                        <p className="text-xl text-white/90 font-medium leading-relaxed max-w-xl mx-auto drop-shadow-sm">
                            Utilizamos IA y filtros inteligentes para optimizar tu tiempo de búsqueda.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form className="flex gap-2 bg-white/70 border-2 border-white p-2 rounded-full max-w-[550px] mx-auto backdrop-blur-md transition-all focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(166,93,140,0.15)] shadow-xl mb-16" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex-1 flex items-center gap-3 pl-4">
                            <svg className="w-5 h-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            <input
                                type="text"
                                placeholder="Área o lugar de búsqueda"
                                className="w-full bg-transparent border-none outline-none text-text-main font-bold placeholder:text-slate-500"
                                required
                            />
                        </div>
                        <Link
                            href="/app"
                            className="bg-gradient-to-br from-[#A65D8C] to-[#BF7E7E] text-white px-8 py-3 rounded-full font-black text-sm transition-all hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            Buscar
                        </Link>
                    </form>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-[-8rem] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/90 font-medium text-sm drop-shadow-md">
                        <p>Descubre más</p>
                        <svg className="w-5 h-5 animate-bounce" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>
        </header>
    );
};

const Problem = () => (
    <Section id="problema" variant="default" kicker="El dolor actual" className="bg-white">
        <div className="flex flex-col gap-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main max-w-3xl">
                {content.problem.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
                {content.problem.items.map((item, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 bg-terracotta-warm/10 text-terracotta-warm rounded-2xl flex items-center justify-center text-2xl mb-6">
                            {i === 0 ? "🔎" : i === 1 ? "📅" : "🔇"}
                        </div>
                        <h3 className="text-xl font-black text-text-main mb-4">{item.title}</h3>
                        <p className="text-text-muted font-bold text-sm leading-relaxed">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </Section>
);

const Solution = () => (
    <Section id="solucion" variant="cyan" kicker="La Revolución" className="bg-bg-light">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="flex flex-col gap-12">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main">
                    {content.solution.title}
                </h2>
                <div className="space-y-8">
                    {content.solution.steps.map((s, i) => (
                        <div key={i} className="flex gap-6 items-start">
                            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black flex-shrink-0">
                                {s.step}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black text-text-main">{s.title}</h4>
                                <p className="text-text-muted font-bold text-sm">{s.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <ChatDemo />
            </div>
        </div>
    </Section>
);

const Features = () => (
    <Section id="features" variant="violet" kicker="Características" className="bg-white">
        <div className="flex flex-col gap-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main text-center">
                {content.features.title}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {content.features.items.map((feature, i) => (
                    <div key={i} className="p-10 rounded-3xl border border-slate-100 bg-white hover:border-primary/20 transition-all hover:shadow-xl group">
                        <div className="w-14 h-14 bg-mint-soft/20 text-olive-match rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                            {["🏠", "🎯", "🤖", "🔔", "✅"][i]}
                        </div>
                        <h4 className="text-xl font-black text-text-main mb-4">{feature.title}</h4>
                        <p className="text-text-muted font-bold text-sm leading-relaxed">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </Section>
);

const Roomies = () => (
    <Section id="roomies" variant="default" kicker="La Nueva Era del Arriendo" className="bg-bg-light overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl transform -rotate-3 transition-transform group-hover:rotate-0"></div>
                <Image src="/roomies.png" alt="Roomies compatibility matching interface" width={800} height={600} className="relative z-10 w-full rounded-3xl shadow-2xl transition-transform hover:-translate-y-2 hover:shadow-primary/20" />
            </div>

            <div className="flex flex-col gap-10 order-1 lg:order-2">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main leading-tight">
                    {content.roomies.title}
                </h2>
                <p className="text-xl text-text-muted font-bold leading-relaxed">
                    {content.roomies.description}
                </p>

                <div className="space-y-6 mt-4">
                    {content.roomies.bullets.map((bullet, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full bg-mint-soft/30 text-olive-match flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <span className="text-lg font-bold text-text-main">{bullet}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </Section>
);

const Footer = () => (
    <footer className="bg-bg-light border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="bg-primary/5 rounded-4xl p-12 md:p-20 text-center flex flex-col items-center gap-8 mb-20">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-text-main max-w-3xl">
                    {content.footer.headline}
                </h2>
                <p className="text-xl text-text-muted font-bold">
                    {content.footer.subheadline}
                </p>
                <Link
                    href="/app"
                    className="bg-primary text-white px-12 py-5 rounded-2xl font-black text-lg uppercase transition-all hover:scale-105 shadow-xl shadow-primary/20"
                >
                    {content.footer.cta}
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-t border-slate-200 pt-10">
                <div className="flex items-center gap-1">
                    <div className="w-20 h-20 flex items-center justify-center">
                        <img src="/Logo_finalfinal.png" alt="RentAI" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <span className="text-2xl font-black text-text-main">Rent<span className="text-primary italic">AI</span></span>
                </div>
                <div className="flex gap-10">
                    <a href="#" className="text-text-muted hover:text-primary font-bold transition-colors">Términos</a>
                    <a href="#" className="text-text-muted hover:text-primary font-bold transition-colors">Privacidad</a>
                </div>
                <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase italic">
                    {content.footer.copy}
                </p>
            </div>
        </div>
    </footer>
);

export default function Landing() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    return (
        <main className="min-h-screen bg-bg-light selection:bg-primary/20 font-sans text-text-main">
            <Navbar onLoginClick={() => setIsAuthOpen(true)} />
            <AuthForm isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            <Hero />
            <div className="text-center py-4 bg-white border-y border-slate-100 font-black text-[12px] tracking-[0.3em] uppercase text-primary/60">
                {content.transition}
            </div>
            <Problem />
            <Solution />
            <Section id="demo" variant="default" kicker="La Experiencia" className="bg-white">
                <div className="flex flex-col gap-10">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main mb-6">
                            Tu próximo hogar está a un mensaje de distancia
                        </h2>
                        <p className="text-lg text-text-muted font-bold">
                            Mira cómo nuestro Asistente Inteligente encuentra opciones perfectas para ti en segundos.
                        </p>
                    </div>
                    <FlowMockup />
                </div>
            </Section>
            <Features />
            <Roomies />
            <Footer />
        </main>
    );
}
