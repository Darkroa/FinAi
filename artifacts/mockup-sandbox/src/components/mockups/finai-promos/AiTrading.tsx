export function AiTrading() {
  const signals = [
    { pair: "BTC/USD", action: "BUY", conf: 94, price: "$60,714" },
    { pair: "ETH/USD", action: "BUY", conf: 88, price: "$3,847" },
    { pair: "NVDA", action: "SELL", conf: 76, price: "$891.20" },
    { pair: "XAU/USD", action: "BUY", conf: 91, price: "$4,353" },
  ];

  const metrics = [
    { val: "94.2%", lbl: "Signal Accuracy" },
    { val: "24/7", lbl: "Always Active" },
    { val: "< 12ms", lbl: "Execution Speed" },
    { val: "87%", lbl: "Avg Win Rate" },
  ];

  return (
    <div style={{
      width: 1080,
      height: 1080,
      background: "#0b0e11",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background atmosphere */}
      <div style={{
        position: "absolute", top: -200, right: -100,
        width: 700, height: 700,
        background: "radial-gradient(ellipse, rgba(240,185,11,0.12) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -100, left: -100,
        width: 500, height: 500,
        background: "radial-gradient(ellipse, rgba(14,203,129,0.08) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(43,49,57,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(43,49,57,0.6) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, padding: "60px", height: "100%", boxSizing: "border-box", display: "flex", gap: 60 }}>

        {/* LEFT column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Logo */}
          <div style={{ marginBottom: 48 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#f0b90b" }}>⚡ FinAi</span>
          </div>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(14,203,129,0.08)", border: "1px solid rgba(14,203,129,0.2)",
            borderRadius: 100, padding: "7px 16px", marginBottom: 28, alignSelf: "flex-start",
          }}>
            <span style={{ width: 6, height: 6, background: "#0ecb81", borderRadius: "50%" }} />
            <span style={{ fontSize: 12, color: "#0ecb81", fontWeight: 700, letterSpacing: 1 }}>AI ENGINE LIVE</span>
          </div>

          {/* Headline */}
          <h1 style={{
            margin: "0 0 20px", fontSize: 68, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2,
            color: "#eaecef",
          }}>
            Intelligence
            <br />
            That Trades
            <br />
            <span style={{
              background: "linear-gradient(90deg, #f0b90b, #ffe082)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              While You Sleep.
            </span>
          </h1>

          <p style={{ margin: "0 0 36px", fontSize: 17, color: "#848e9c", lineHeight: 1.7 }}>
            Our neural trading engine processes <strong style={{ color: "#eaecef" }}>2.3M data points per second</strong> across every major market — crypto, stocks, metals, and forex. It doesn't sleep. It doesn't blink. It just wins.
          </p>

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
            {metrics.map(m => (
              <div key={m.lbl} style={{
                background: "#161a1e", border: "1px solid #2b3139",
                borderRadius: 12, padding: "18px 22px",
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f0b90b", lineHeight: 1 }}>{m.val}</div>
                <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>{m.lbl}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#f0b90b", borderRadius: 12, padding: "18px 36px",
            fontSize: 16, fontWeight: 800, color: "#0b0e11", alignSelf: "flex-start",
            boxShadow: "0 0 40px rgba(240,185,11,0.35)",
          }}>
            🤖 Activate My AI Bot →
          </div>
        </div>

        {/* RIGHT column — Live signals panel */}
        <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: "#161a1e", border: "1px solid #2b3139",
            borderRadius: 20, padding: "24px", flex: 1,
          }}>
            {/* Panel header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#eaecef" }}>Live AI Signals</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, background: "#0ecb81", borderRadius: "50%" }} />
                <span style={{ fontSize: 11, color: "#0ecb81", fontWeight: 600 }}>LIVE</span>
              </div>
            </div>

            {/* Signal rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {signals.map(s => (
                <div key={s.pair} style={{
                  background: "#0b0e11", border: "1px solid #2b3139",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#eaecef" }}>{s.pair}</div>
                      <div style={{ fontSize: 12, color: "#848e9c", marginTop: 2 }}>{s.price}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: "4px 10px",
                      borderRadius: 6, letterSpacing: 1,
                      background: s.action === "BUY" ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
                      color: s.action === "BUY" ? "#0ecb81" : "#f6465d",
                      border: `1px solid ${s.action === "BUY" ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
                    }}>
                      {s.action}
                    </span>
                  </div>
                  {/* Confidence bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "#4a5568" }}>Confidence</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f0b90b" }}>{s.conf}%</span>
                    </div>
                    <div style={{ height: 4, background: "#2b3139", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${s.conf}%`,
                        background: "linear-gradient(90deg, #f0b90b, #ffe082)",
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom note */}
            <div style={{
              marginTop: 20, padding: "14px 16px",
              background: "rgba(240,185,11,0.05)", border: "1px solid rgba(240,185,11,0.15)",
              borderRadius: 10, fontSize: 12, color: "#848e9c", lineHeight: 1.6,
            }}>
              🧠 AI analyzed <strong style={{ color: "#f0b90b" }}>2.3M</strong> data points in the last minute. Next signal update in <strong style={{ color: "#eaecef" }}>12s</strong>.
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
