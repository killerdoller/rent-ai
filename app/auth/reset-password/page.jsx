"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../src/utils/supabaseClient";

const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const C = {
  ink: "#0D0D0D", cream: "#F2ECDF", white: "#FFFFFF",
  green: "#63A694", terra: "#D87D6F", terraDeep: "#A85548", coffee: "#82554D",
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColors   = ["transparent", C.terra, C.coffee, C.green];
  const pwLabels   = ["", "Débil", "Media", "Fuerte"];

  const handleSubmit = async () => {
    if (password.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.replace("/app"), 2000);
  };

  return (
    <div style={{
      minHeight: "100dvh", background: C.cream, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
      backgroundImage: "radial-gradient(rgba(130,85,77,0.09) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: C.white,
        border: `2.5px solid ${C.ink}`, borderRadius: 24,
        boxShadow: `6px 6px 0 ${C.ink}`, padding: "40px 32px",
      }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 500, color: C.ink, lineHeight: 0.95, marginBottom: 8 }}>
          Nueva<br/><span style={{ fontStyle: "italic", color: C.terraDeep }}>contraseña.</span>
        </div>
        <div style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginBottom: 28 }}>
          Elige una contraseña segura para tu cuenta.
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32 }}>✅</div>
            <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.green, marginTop: 8 }}>
              ¡Contraseña actualizada!
            </div>
            <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginTop: 4 }}>
              Redirigiendo…
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Nueva contraseña</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={{ width: "100%", height: 50, padding: "0 14px", border: `2px solid ${C.ink}`, borderRadius: 14, background: C.white, fontFamily: BODY, fontSize: 15, color: C.ink, outline: "none", boxSizing: "border-box" }}/>
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, display: "flex", gap: 3 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStrength ? pwColors[pwStrength] : "rgba(0,0,0,0.1)" }}/>
                    ))}
                  </div>
                  <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: pwColors[pwStrength], textTransform: "uppercase", letterSpacing: 1 }}>
                    {pwLabels[pwStrength]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Confirmar contraseña</div>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                style={{ width: "100%", height: 50, padding: "0 14px", border: `2px solid ${error ? C.terra : C.ink}`, borderRadius: 14, background: C.white, fontFamily: BODY, fontSize: 15, color: C.ink, outline: "none", boxSizing: "border-box" }}/>
            </div>
            {error && <div style={{ fontFamily: BODY, fontSize: 12, color: C.terraDeep, fontWeight: 600 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading}
              style={{ marginTop: 8, height: 54, border: `2.5px solid ${C.ink}`, background: C.green, color: C.white, borderRadius: 16, cursor: loading ? "not-allowed" : "pointer", fontFamily: BODY, fontSize: 15, fontWeight: 700, boxShadow: `4px 4px 0 ${C.ink}`, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Actualizando…" : "Actualizar contraseña →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
