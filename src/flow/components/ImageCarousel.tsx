"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const FALLBACK = "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=800";

export function ImageCarousel({
  images,
  height = 220,
  className = "",
  style = {},
}: {
  images?: string[] | null;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [idx, setIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const imgs = images && images.length > 0 ? images : [FALLBACK];
  const total = imgs.length;

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(total - 1, i + 1));

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
  };

  // Evitar scroll cuando está en fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  return (
    <>
      <div
        className={className}
        style={{ position: "relative", height, overflow: "hidden", flexShrink: 0, ...style }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setIsFullscreen(true)}
      >
        <img
          key={idx}
          src={imgs[idx]}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
        />

        {/* Prev */}
        {idx > 0 && (
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: 16,
              background: "rgba(0,0,0,0.45)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 2,
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: "white" }} />
          </button>
        )}

        {/* Next */}
        {idx < total - 1 && (
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: 16,
              background: "rgba(0,0,0,0.45)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 2,
            }}
          >
            <ChevronRight style={{ width: 18, height: 18, color: "white" }} />
          </button>
        )}

        {/* Dots */}
        {total > 1 && (
          <div style={{
            position: "absolute", bottom: 10, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 5, zIndex: 2,
          }}>
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{
                  width: i === idx ? 18 : 6, height: 6, borderRadius: 3, border: "none", padding: 0,
                  background: i === idx ? "white" : "rgba(255,255,255,0.5)",
                  transition: "width 0.2s", cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        {total > 1 && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.5)", borderRadius: 9999, padding: "3px 9px", zIndex: 2,
          }}>
            <span style={{ fontFamily: "var(--font-inter,sans-serif)", fontSize: 11, color: "white", fontWeight: 600 }}>
              {idx + 1} / {total}
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center"
          }}
          onClick={() => setIsFullscreen(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={() => setIsFullscreen(false)}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 44, height: 44, borderRadius: 22,
              background: "rgba(255,255,255,0.1)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 2, color: "white"
            }}
          >
            <X style={{ width: 24, height: 24 }} />
          </button>

          <img
            key={`fs-${idx}`}
            src={imgs[idx]}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Prev Fullscreen */}
          {idx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              style={{
                position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
                width: 48, height: 48, borderRadius: 24,
                background: "rgba(255,255,255,0.1)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", zIndex: 2,
              }}
            >
              <ChevronLeft style={{ width: 28, height: 28, color: "white" }} />
            </button>
          )}

          {/* Next Fullscreen */}
          {idx < total - 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              style={{
                position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
                width: 48, height: 48, borderRadius: 24,
                background: "rgba(255,255,255,0.1)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", zIndex: 2,
              }}
            >
              <ChevronRight style={{ width: 28, height: 28, color: "white" }} />
            </button>
          )}

          {/* Fullscreen Counter */}
          <div style={{
            position: "absolute", bottom: 40, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 5, zIndex: 2,
          }}>
             <span style={{ fontSize: 14, color: "white", fontWeight: 500, letterSpacing: 1 }}>
              {idx + 1} / {total}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
