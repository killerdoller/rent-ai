"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy SSO callback — redirect to Supabase Auth callback
export default function SSOCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/callback" + window.location.search + window.location.hash);
  }, [router]);

  const BODY = "var(--font-inter, 'system-ui', sans-serif)";
  const C = { cream: "#FFFFFF", ink: "#0D0D0D", white: "#FFFFFF" };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100dvh", background: C.cream,
      backgroundImage: "radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 16px 7px 10px", borderRadius: 9999,
        background: C.white, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`,
      }}>
        <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 22, height: 22, objectFit: "contain" }} />
        <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink }}>Validando sesión…</span>
      </div>
    </div>
  );
}
