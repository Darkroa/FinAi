export function SecureWealth() {
  const pillars = [
    {
      icon: "🔐",
      title: "Bank-Grade Encryption",
      desc: "256-bit AES encryption on every transaction, every second of every day.",
    },
    {
      icon: "🛡️",
      title: "Zero-Breach Record",
      desc: "Years of operation. Millions of trades. Zero security incidents. Ever.",
    },
    {
      icon: "✅",
      title: "KYC & Compliance",
      desc: "Full identity verification and regulatory compliance protect every account.",
    },
    {
      icon: "📊",
      title: "Transparent Ledger",
      desc: "Every deposit, withdrawal and trade logged in real-time. Always auditable.",
    },
  ];

  const trust = ["256-bit SSL", "2FA Auth", "Cold Storage", "AML Verified", "ISO 27001"];

  return (
    <div style={{
      width: 1080,
      height: 1080,
      background: "#0b0e11",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Center shield glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600,
        background: "radial-gradient(ellipse at center, rgba(240,185,11,0.1) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Top left gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 350, height: 350,
        background: "linear-gradient(135deg, rgba(240,185,11,0.07) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, padding: "60px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>

        {/* Top */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 52 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#f0b90b" }}>⚡ FinAi</span>
          <div style={{
            background: "rgba(240,185,11,0.08)", border: "1px solid rgba(240,185,11,0.2)",
            borderRadius: 100, padding: "8px 18px",
            fontSize: 12, color: "#f0b90b", fontWeight: 700, letterSpacing: 1,
          }}>
            🔒 ENTERPRISE SECURITY
          </div>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", gap: 64, alignItems: "center" }}>

          {/* LEFT */}
          <div style={{ flex: 1 }}>
            {/* Shield visual */}
            <div style={{
              width: 100, height: 100, marginBottom: 32,
              background: "linear-gradient(135deg, rgba(240,185,11,0.15), rgba(240,185,11,0.05))",
              border: "1px solid rgba(240,185,11,0.25)",
              borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 44,
              boxShadow: "0 0 40px rgba(240,185,11,0.15)",
            }}>
              🛡️
            </div>

            <h1 style={{
              margin: "0 0 16px", fontSize: 72, fontWeight: 900, lineHeight: 1.0, letterSpacing: -3,
              color: "#eaecef",
            }}>
              Your Wealth.
              <br />
              <span style={{
                background: "linear-gradient(90deg, #f0b90b, #ffe082)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Fortified.</span>
              <br />
              Unstoppable.
            </h1>

            <p style={{ margin: "0 0 36px", fontSize: 18, color: "#848e9c", lineHeight: 1.7, maxWidth: 440 }}>
              While others promise security, we engineer it. Your capital doesn't just sit on our platform — it's <strong style={{ color: "#eaecef" }}>protected by layers of military-grade infrastructure</strong> that never sleep, never compromise.
            </p>

            {/* Trust badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 40 }}>
              {trust.map(t => (
                <div key={t} style={{
                  background: "#161a1e", border: "1px solid #2b3139",
                  borderRadius: 8, padding: "8px 14px",
                  fontSize: 12, color: "#848e9c", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ color: "#0ecb81", fontSize: 10 }}>✓</span> {t}
                </div>
              ))}
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "#f0b90b", borderRadius: 12, padding: "18px 36px",
              fontSize: 16, fontWeight: 800, color: "#0b0e11",
              boxShadow: "0 0 40px rgba(240,185,11,0.3)",
            }}>
              Secure My Wealth Now →
            </div>
          </div>

          {/* RIGHT — pillars */}
          <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 16 }}>
            {pillars.map((p, i) => (
              <div key={p.title} style={{
                background: "#161a1e",
                border: "1px solid #2b3139",
                borderLeft: `3px solid ${i % 2 === 0 ? "#f0b90b" : "#2b3139"}`,
                borderRadius: 14, padding: "20px 22px",
                display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 42, height: 42, flexShrink: 0,
                  background: "rgba(240,185,11,0.06)", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#eaecef", marginBottom: 5 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "#4a5568", lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              </div>
            ))}

            {/* Security counter */}
            <div style={{
              background: "rgba(240,185,11,0.05)", border: "1px solid rgba(240,185,11,0.15)",
              borderRadius: 14, padding: "18px 22px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#f0b90b" }}>0</div>
              <div style={{ fontSize: 13, color: "#848e9c", marginTop: 4 }}>Security breaches in our history</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, transparent, #f0b90b 30%, #ffe082 50%, #f0b90b 70%, transparent)",
      }} />
      <div style={{ position: "absolute", bottom: 20, right: 30, fontSize: 13, color: "#2b3139" }}>finai.app</div>
    </div>
  );
}
