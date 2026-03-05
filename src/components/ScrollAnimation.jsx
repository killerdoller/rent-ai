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

            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Simplified progress: 0 at bottom, 1 at top
            const start = windowHeight;
            const end = 0;
            let progress = (start - rect.top) / (start + rect.height);
            progress = Math.max(0, Math.min(1, progress));

            const frameIndex = Math.min(
                images.length - 1,
                Math.floor(progress * images.length)
            );

            const context = canvas.getContext('2d');
            const img = images[frameIndex];

            if (img && context) {
                // Fix canvas sizing
                if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                }

                context.clearRect(0, 0, canvas.width, canvas.height);
                const canvasAspect = canvas.width / canvas.height;
                const imgAspect = img.width / img.height;
                let drawWidth, drawHeight, offsetX, offsetY;

                if (canvasAspect > imgAspect) {
                    drawHeight = canvas.height;
                    drawWidth = drawHeight * imgAspect;
                    offsetX = (canvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = canvas.width;
                    drawHeight = drawWidth / imgAspect;
                    offsetX = 0;
                    offsetY = (canvas.height - drawHeight) / 2;
                }
                context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
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
        <div ref={containerRef} className={`${className} relative min-h-[400px] flex items-center justify-center`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none"
                style={{ display: isLoading ? 'none' : 'block' }}
            />
        </div>
    );
};
