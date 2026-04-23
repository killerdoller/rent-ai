"use client";
import { useEffect } from "react";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { cream: "#FFFFFF", coffee: "#82554D", ink: "#0D0D0D", white: "#FFFFFF" };

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: C.cream,
      backgroundImage: "radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }}>
      <AuthenticateWithRedirectCallback />
      
      <div style={{
        position: "absolute", display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 16px 7px 10px", borderRadius: 9999,
        background: C.white, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`,
      }}>
        <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 22, height: 22, objectFit: "contain" }} />
        <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink }}>Validando sesión…</span>
      </div>
    </div>
  );
}
