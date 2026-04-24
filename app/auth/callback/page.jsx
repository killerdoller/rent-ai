"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../src/utils/supabaseClient";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { cream: "#F7F2EC", ink: "#0D0D0D", white: "#FFFFFF" };

export default function AuthCallbackPage() {
  const router = useRouter();
  const didExchange = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode double-invocation — code can only be exchanged once
    if (didExchange.current) return;
    didExchange.current = true;

    const code = new URLSearchParams(window.location.search).get("code");
    const type = new URLSearchParams(window.location.search).get("type");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          router.replace("/app");
          return;
        }
        if (type === "recovery") {
          router.replace("/auth/reset-password");
        } else {
          router.replace("/app/sync");
        }
      });
    } else {
      // Fallback: check if session already exists (hash-based flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/app/sync");
        } else {
          router.replace("/app");
        }
      });
    }
  }, [router]);

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
