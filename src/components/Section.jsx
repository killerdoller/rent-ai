"use client";
import React from "react";
import { sectionVariants } from "../utils/sectionStyles";

export function Section({
    id,
    variant = "blue",
    kicker,
    title,
    subtitle,
    children,
}) {
    const v = sectionVariants[variant];

    return (
        <section id={id} className="relative py-24 sm:py-32 border-t border-slate-100 overflow-hidden">
            {/* Background Layer */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className={`absolute left-1/2 top-0 h-[600px] w-full max-w-[1200px] -translate-x-1/2 blur-[120px] bg-gradient-to-b ${v.glow} opacity-60`} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02),transparent_70%)]" />
            </div>

            <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
                <div className="flex flex-col gap-6 mb-20 items-center text-center max-w-4xl mx-auto">
                    {kicker && (
                        <span className={`inline-flex items-center rounded-full border px-4 py-1 text-[10px] uppercase tracking-[0.2em] font-black ${v.badge} shadow-sm`}>
                            {kicker}
                        </span>
                    )}

                    <h2 className={`text-4xl sm:text-6xl font-black tracking-tighter bg-gradient-to-r ${v.title} bg-clip-text text-transparent leading-[1.1]`}>
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-lg sm:text-xl text-text-muted font-medium leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="relative z-10">{children}</div>
            </div>
        </section>
    );
}
