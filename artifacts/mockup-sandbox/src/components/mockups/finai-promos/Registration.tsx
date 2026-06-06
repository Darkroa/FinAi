export function Registration() {
  const features = [
    { icon: "⚡", label: "AI Signals", desc: "Real-time market intelligence" },
    { icon: "📈", label: "Live Trading", desc: "Crypto, stocks & metals" },
    { icon: "🤖", label: "Auto Bots", desc: "Trade while you sleep" },
  ];

  const stats = [
    { value: "50K+", label: "Active Traders" },
    { value: "$2.4B", label: "Volume Traded" },
    { value: "98.7%", label: "Uptime" },
  ];

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: "#0b0e11",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Radial glow top */}
      <div style={{
        position: "absolute", top: -180, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500,
        background: "radial-gradient(ellipse at center, rgba(240,185,11,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Bottom glow */}
      <div style={{
        position: "absolute", bottom: -120, right: -120,
        width: 500, height: 500,
        background: "radial-gradient(ellipse at center, rgba(240,185,11,0.09) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(240,185,11,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240,185,11,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Decorative corner accent */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 280, height: 280,
        background: "linear-gradient(225deg, rgba(240,185,11,0.12) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 10, padding: "60px", width: "100%", boxSizing: "border-box" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#f0b90b", letterSpacing: -1 }}>⚡ FinAi</span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#848e9c", letterSpacing: 3,
            textTransform: "uppercase", borderLeft: "1px solid #2b3139", paddingLeft: 10,
          }}>Financial Intelligence Platform</span>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)",
          borderRadius: 100, padding: "8px 20px", marginBottom: 32,
        }}>
          <span style={{ width: 7, height: 7, background: "#0ecb81", borderRadius: "50%", display: "inline-block" }} />
          <span style={{ fontSize: 13, color: "#f0b90b", fontWeight: 600, letterSpacing: 1 }}>NOW OPEN — FREE REGISTRATION</span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            margin: 0, fontSize: 82, fontWeight: 900, lineHeight: 1.0,
            color: "#eaecef", letterSpacing: -3,
            fontFamily: "'Inter', sans-serif",
          }}>
            Join the Elite.
          </h1>
          <h1 style={{
            margin: 0, fontSize: 82, fontWeight: 900, lineHeight: 1.0,
            background: "linear-gradient(90deg, #f0b90b 0%, #ffe082 50%, #f0b90b 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: -3,
          }}>
            Trade the Future.
          </h1>
        </div>

        {/* Subtext */}
        <p style={{
          margin: "0 0 52px", fontSize: 22, color: "#848e9c", lineHeight: 1.6,
          maxWidth: 560, fontWeight: 400,
        }}>
          The markets don't wait — and neither should you. Over <strong style={{ color: "#eaecef" }}>50,000 smart traders</strong> are already compounding their edge. Your seat at the table is still open.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 48, marginBottom: 52 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#f0b90b", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#4a5568", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature chips */}
        <div style={{ display: "flex", gap: 16, marginBottom: 56, flexWrap: "wrap" }}>
          {features.map(f => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#161a1e", border: "1px solid #2b3139",
              borderRadius: 12, padding: "14px 20px",
            }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#eaecef" }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#4a5568" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "#f0b90b",
            borderRadius: 14, padding: "20px 40px",
            fontSize: 18, fontWeight: 800, color: "#0b0e11",
            boxShadow: "0 0 40px rgba(240,185,11,0.35)",
          }}>
            Create Free Account →
          </div>
          <div style={{ fontSize: 14, color: "#848e9c" }}>
            No card required<br />
            <span style={{ color: "#4a5568" }}>Instant access · 2 minutes</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 4,
        background: "linear-gradient(90deg, transparent, #f0b90b 30%, #ffe082 50%, #f0b90b 70%, transparent)",
      }} />

      {/* URL watermark */}
      <div style={{
        position: "absolute", bottom: 20, right: 30,
        fontSize: 13, color: "#2b3139", letterSpacing: 1,
      }}>finai.app</div>
    </div>
  );
}
