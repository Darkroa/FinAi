export function DepositBonus() {
  const steps = [
    { num: "01", title: "Create Your Account", desc: "Free in 2 minutes" },
    { num: "02", title: "Make First Deposit", desc: "Any amount qualifies" },
    { num: "03", title: "Bonus Credited Instantly", desc: "+10% added to balance" },
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
      }}
    >
      {/* Gold burst background */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900, height: 900,
        background: "radial-gradient(ellipse at center, rgba(240,185,11,0.13) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Top-left accent blob */}
      <div style={{
        position: "absolute", top: -100, left: -100,
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(240,185,11,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Diagonal stripe decoration */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "60%", height: "100%",
        background: "linear-gradient(135deg, transparent 0%, rgba(240,185,11,0.025) 100%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", padding: "60px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 60 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#f0b90b" }}>⚡ FinAi</span>
          <div style={{
            background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.3)",
            borderRadius: 100, padding: "8px 18px",
            fontSize: 12, color: "#0ecb81", fontWeight: 700, letterSpacing: 1,
          }}>
            🎁 LIMITED OFFER
          </div>
        </div>

        {/* Big 10% number — centerpiece */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, color: "#848e9c", letterSpacing: 4, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            First Deposit Bonus
          </div>
          <div style={{
            fontSize: 260, fontWeight: 900, lineHeight: 0.85,
            background: "linear-gradient(180deg, #ffe082 0%, #f0b90b 40%, #b8860b 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: -12, filter: "drop-shadow(0 0 60px rgba(240,185,11,0.4))",
          }}>
            10%
          </div>
          <div style={{ fontSize: 20, color: "#848e9c", marginTop: 12, letterSpacing: 1 }}>
            BONUS ON YOUR FIRST DEPOSIT
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, #2b3139 30%, #2b3139 70%, transparent)",
          margin: "32px 0",
        }} />

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            margin: "0 0 12px", fontSize: 38, fontWeight: 900,
            color: "#eaecef", lineHeight: 1.2, letterSpacing: -1,
          }}>
            Your Money Just Got <span style={{ color: "#f0b90b" }}>Smarter</span> Before You Even Trade
          </h2>
          <p style={{ margin: 0, fontSize: 17, color: "#848e9c", lineHeight: 1.6, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
            Every great portfolio starts with a decision. Start yours with an instant 10% advantage — credited before your first trade executes.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", gap: 0, flex: 1, alignItems: "stretch" }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
                flex: 1, background: "#161a1e", border: "1px solid #2b3139",
                borderRadius: 16, padding: "24px 28px",
                borderTop: "3px solid #f0b90b",
              }}>
                <div style={{ fontSize: 13, color: "#f0b90b", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>{s.num}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#eaecef", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#4a5568" }}>{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ fontSize: 20, color: "#2b3139", padding: "0 12px", flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 }}>
          <div style={{
            background: "#f0b90b", borderRadius: 14, padding: "18px 44px",
            fontSize: 17, fontWeight: 800, color: "#0b0e11",
            boxShadow: "0 0 50px rgba(240,185,11,0.4)",
          }}>
            Claim My 10% Bonus →
          </div>
          <div style={{ fontSize: 13, color: "#4a5568", textAlign: "right", lineHeight: 1.8 }}>
            <div style={{ color: "#848e9c" }}>✓ No minimum deposit</div>
            <div>✓ Instant credit</div>
            <div>✓ Withdraw anytime</div>
          </div>
        </div>
      </div>

      {/* Bottom gold line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, transparent, #f0b90b 30%, #ffe082 50%, #f0b90b 70%, transparent)",
      }} />
      <div style={{ position: "absolute", bottom: 20, right: 30, fontSize: 13, color: "#2b3139" }}>finai.app</div>
    </div>
  );
}
