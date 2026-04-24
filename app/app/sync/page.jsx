"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../src/utils/supabaseClient";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { cream: "#FFFFFF", coffee: "#82554D", ink: "#0D0D0D", white: "#FFFFFF" };

function SyncPage() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const role = params.get("role");
  const [showRetry, setShowRetry] = useState(false);
  const [attempts, setAttempts] = useState(0);
  // Tracks which attempt was last processed — prevents React Strict Mode double-execution
  // from reading pending_role/mode twice (second read would get null → wrong role)
  const lastAttempt = useRef(-1);

  useEffect(() => {
    if (lastAttempt.current === attempts) return;
    lastAttempt.current = attempts;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/app");
        return;
      }

      const timeout = setTimeout(() => setShowRetry(true), 10000);
      const user = session.user;

      // Role from: URL param → localStorage → user metadata → default student
      const pendingRole = localStorage.getItem("pending_role");
      const pendingMode = localStorage.getItem("pending_mode");
      const effectiveRole = role || pendingRole || user.user_metadata?.role || "student";
      const effectiveMode = mode || pendingMode || user.user_metadata?.mode || "find-room";

      localStorage.removeItem("pending_role");
      localStorage.removeItem("pending_mode");

      fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:    user.id,
          email:      user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(" ")[0] || "",
          last_name:  user.user_metadata?.last_name  || user.user_metadata?.name?.split(" ").slice(1).join(" ") || "",
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          mode:       effectiveMode,
          role:       effectiveRole,
        }),
      })
        .then(r => r.json())
        .then(data => {
          clearTimeout(timeout);
          if (data.error) { setShowRetry(true); return; }
          if (data.role === "owner") {
            localStorage.setItem("owner_id",    data.profile_id);
            localStorage.setItem("owner_email", data.email || user.email || "");
            localStorage.setItem("userMode",    "landlord");
            router.replace(data.is_new ? "/owner/complete-profile" : "/owner/dashboard");
          } else {
            localStorage.setItem("rentai_user_id",  data.profile_id);
            localStorage.setItem("userMode",          effectiveMode);
            localStorage.setItem("profile_completed", data.is_new ? "false" : "true");
            router.replace(data.is_new ? "/app/complete-profile" : "/app/home");
          }
        })
        .catch(() => {
          clearTimeout(timeout);
          setShowRetry(true);
        });
    });
  }, [attempts]);

  return (
    <div style={{
      width: "100%", height: "100dvh", background: C.cream,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: BODY, gap: 20,
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 20px 10px 12px", borderRadius: 9999,
        background: C.white, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`,
      }}>
        <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 28, height: 28, objectFit: "contain" }}/>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Validando sesión…</span>
      </div>

      {showRetry && (
        <div style={{ textAlign: "center", padding: 20, maxWidth: 300 }}>
          <p style={{ fontSize: 14, color: C.coffee, marginBottom: 16 }}>
            Parece que está tardando más de lo habitual.
          </p>
          <button
            onClick={() => { setShowRetry(false); setAttempts(a => a + 1); }}
            style={{
              padding: "12px 24px", background: C.ink, color: C.white,
              border: "none", borderRadius: 12, cursor: "pointer",
              fontWeight: 700, fontSize: 13,
            }}
          >
            Reintentar ahora
          </button>
        </div>
      )}
    </div>
  );
}

export default function SyncPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ width: "100%", height: "100dvh", background: "#F7F2EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px 10px 12px", borderRadius: 9999, background: "#FFFFFF", border: "2px solid #0D0D0D", boxShadow: "4px 4px 0 #0D0D0D" }}>
          <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 28, height: 28, objectFit: "contain" }}/>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0D0D0D" }}>Validando sesión…</span>
        </div>
      </div>
    }>
      <SyncPage />
    </Suspense>
  );
}
