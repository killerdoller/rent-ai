"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { cream: "#F7F2EC", coffee: "#82554D", ink: "#0D0D0D", white: "#FFFFFF" };

function SyncPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const role = params.get("role");
  const [showRetry, setShowRetry] = useState(false);
  const [attempts, setAttempts] = useState(0);
  useEffect(() => {
    if (!isLoaded || !user) return;

    const timeout = setTimeout(() => setShowRetry(true), 10000);

    fetch("/api/clerk/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerk_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        avatar_url: user.imageUrl || "",
        mode,
        role,
      }),
    })
      .then(r => r.json())
      .then(data => {
        clearTimeout(timeout);
        if (data.needs_role) { router.replace("/app/role-selection"); return; }
        if (data.error) { setShowRetry(true); return; }
        if (data.role === "owner") {
          localStorage.setItem("owner_id", data.profile_id);
          localStorage.setItem("owner_email", data.email || "");
          localStorage.setItem("userMode", "landlord");
          router.replace(data.is_new ? "/owner/complete-profile" : "/owner/dashboard");
        } else {
          localStorage.setItem("rentai_user_id", data.profile_id);
          localStorage.setItem("userMode", mode || "find-room");
          router.replace(data.is_new ? "/app/complete-profile" : "/app/home");
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        setShowRetry(true);
      });
      
    return () => clearTimeout(timeout);
  }, [user, isLoaded, attempts, mode, role, router]);

  return (
    <div style={{
      width: "100%", height: "100vh", background: C.cream,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: BODY, gap: 20
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 20px 10px 12px", borderRadius: 9999,
        background: C.white, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`
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
              fontWeight: 700, fontSize: 13
            }}
          >
            Reintentar ahora
          </button>
        </div>
      )}
    </div>
  );
}

export default SyncPage;
