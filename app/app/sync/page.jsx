"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { cream: "#F7F2EC", coffee: "#82554D", ink: "#0D0D0D", white: "#FFFFFF" };

function SyncPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const role = params.get("role");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace("/app"); return; }

    fetch("/api/clerk/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerk_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        first_name: user.firstName || "",
        mode,
        role,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.replace("/app"); return; }
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
      .catch(() => router.replace("/app"));
  }, [user, isLoaded]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: C.cream,
      backgroundImage: "radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 16px 7px 10px", borderRadius: 9999,
        background: C.white, border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 ${C.ink}`,
      }}>
        <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 22, height: 22, objectFit: "contain" }} />
        <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink }}>Cargando…</span>
      </div>
    </div>
  );
}

export default SyncPage;
