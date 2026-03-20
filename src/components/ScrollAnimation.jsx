"use client";
import React, { useEffect, useRef, useState } from 'react';

export const ScrollAnimation = ({ frames, className }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const preloadImages = async () => {
            try {
                const loadedImages = await Promise.all(
                    frames.map(url => {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => resolve(img);
                            img.onerror = () => {
                                console.warn(`Failed to load: ${url}`);
                                resolve(null);
                            };
                        });
                    })
                );
                if (isMounted) {
                    setImages(loadedImages.filter(img => img !== null));
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Preload error:", error);
            }
        };
        preloadImages();
        return () => { isMounted = false; };
    }, [frames]);

    useEffect(() => {
        if (images.length === 0) return;

        const handleScroll = () => {
            const container = containerRef.current;
            const canvas = canvasRef.current;
            if (!container || !canvas) return;

            const heroSection = container.closest('header');
            if (!heroSection) return;

            const scrollTop = window.scrollY;
            const maxScroll = heroSection.offsetHeight - window.innerHeight;

            const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
            const frameIndex = Math.min(
                images.length - 1,
                Math.floor(scrollFraction * images.length)
            );

            const context = canvas.getContext('2d');
            const img = images[frameIndex];

            if (img && context) {
                if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }

                const cWidth = canvas.width;
                const cHeight = canvas.height;
                const iWidth = img.width;
                const iHeight = img.height;

                const ratio = Math.max(cWidth / iWidth, cHeight / iHeight);
                const newWidth = iWidth * ratio * 1.05;
                const newHeight = iHeight * ratio * 1.05;
                const offsetX = (cWidth - newWidth) / 2;
                const offsetY = (cHeight - newHeight) / 2;

                context.clearRect(0, 0, cWidth, cHeight);
                context.drawImage(img, offsetX, offsetY, newWidth, newHeight);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        // Initial call
        setTimeout(handleScroll, 100);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [images]);

    return (
        <div ref={containerRef} className={`${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ display: isLoading ? 'none' : 'block' }}
            />
        </div>
    );
};
