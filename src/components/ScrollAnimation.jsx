"use client";
import React, { useEffect, useRef, useState } from 'react';

// Apple-style scroll-driven animation: an image sequence drawn to a <canvas>,
// with the frame index mapped from scroll position. Frames are fetched and
// decoded via fetch + createImageBitmap (more reliable than new Image() —
// real HTTP errors are catchable and we can retry), loaded with a concurrency
// cap so a burst of 192 requests doesn't trip Cloudflare/host rate limits.

async function fetchBitmap(url, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            return await createImageBitmap(blob);
        } catch (err) {
            if (attempt === retries) {
                console.warn(`Frame failed after ${retries} retries: ${url} (${err.message})`);
                return null;
            }
            await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        }
    }
    return null;
}

// Load all urls with at most `concurrency` requests in flight. Calls
// onProgress(results) periodically so the canvas can start before all frames
// are decoded.
async function loadSequence(urls, concurrency, onProgress) {
    const results = new Array(urls.length).fill(null);
    let next = 0;
    let done = 0;

    async function worker() {
        while (next < urls.length) {
            const i = next++;
            results[i] = await fetchBitmap(urls[i]);
            done++;
            if (done % 8 === 0 || done === urls.length) onProgress(results, done);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, urls.length) }, worker)
    );
    return results;
}

export const ScrollAnimation = ({ frames, className }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imagesRef = useRef([]);
    const [ready, setReady] = useState(false);
    const [progress, setProgress] = useState(0);

    // Preload the sequence
    useEffect(() => {
        let cancelled = false;
        imagesRef.current = new Array(frames.length).fill(null);

        loadSequence(frames, 6, (results, done) => {
            if (cancelled) return;
            imagesRef.current = results;
            setProgress(Math.round((done / frames.length) * 100));
            // Start rendering as soon as the opening frames are in.
            if (results.filter(Boolean).length >= Math.min(12, frames.length)) {
                setReady(true);
            }
        }).then(() => {
            if (!cancelled) { setProgress(100); setReady(true); }
        });

        return () => { cancelled = true; };
    }, [frames]);

    // Scroll → frame index → draw
    useEffect(() => {
        if (!ready) return;
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const context = canvas.getContext('2d');

        let rafId = null;

        const draw = () => {
            rafId = null;
            const images = imagesRef.current;
            const heroSection = container.closest('header');
            if (!heroSection || images.length === 0) return;

            // Use the header's position relative to the viewport instead of
            // window.scrollY. This works whether the page scrolls on `window`
            // or inside a fixed-height container (the case here: globals.css
            // sets body{height:100dvh; overflow-x:hidden}, which makes the body
            // the scroller and leaves window.scrollY stuck at 0).
            const rect = heroSection.getBoundingClientRect();
            const maxScroll = heroSection.offsetHeight - window.innerHeight;
            const frac = maxScroll > 0
                ? Math.max(0, Math.min(1, -rect.top / maxScroll))
                : 0;
            let idx = Math.min(images.length - 1, Math.floor(frac * images.length));

            // If the exact frame isn't decoded yet, fall back to nearest loaded.
            let img = images[idx];
            if (!img) {
                for (let d = 1; d < images.length; d++) {
                    if (images[idx - d]) { img = images[idx - d]; break; }
                    if (images[idx + d]) { img = images[idx + d]; break; }
                }
            }
            if (!img) return;

            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            const cW = canvas.width, cH = canvas.height;
            const ratio = Math.max(cW / img.width, cH / img.height);
            const nW = img.width * ratio * 1.05;
            const nH = img.height * ratio * 1.05;
            context.clearRect(0, 0, cW, cH);
            context.drawImage(img, (cW - nW) / 2, (cH - nH) / 2, nW, nH);
        };

        const onScroll = () => {
            if (rafId === null) rafId = requestAnimationFrame(draw);
        };

        // Capture phase (true) catches scroll events from any descendant
        // scroll container, not just window.
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        window.addEventListener('resize', onScroll);
        draw();

        return () => {
            window.removeEventListener('scroll', onScroll, { capture: true });
            window.removeEventListener('resize', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [ready]);

    return (
        <div ref={containerRef} className={className}>
            {!ready && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    {progress > 0 && <span className="text-xs text-white/60">{progress}%</span>}
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.4s' }}
            />
        </div>
    );
};
