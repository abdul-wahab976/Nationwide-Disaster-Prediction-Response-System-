import { useState, useEffect, useRef } from "react";

const DISASTERS = [
  { id: 1, type: "flood", name: "Flood Risk", icon: "🌊", color: "#0ea5e9", bgColor: "rgba(14,165,233,0.15)" },
  { id: 2, type: "earthquake", name: "Seismic Activity", icon: "⚡", color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)" },
  { id: 3, type: "heatwave", name: "Heatwave Alert", icon: "🔥", color: "#ef4444", bgColor: "rgba(239,68,68,0.15)" },
  { id: 4, type: "cyclone", name: "Cyclone Track", icon: "🌀", color: "#a855f7", bgColor: "rgba(168,85,247,0.15)" },
];

const REGIONS = [
  { id: "sindh", name: "Sindh", lat: 26, lng: 68, flood: 87, earthquake: 32, heatwave: 78, cyclone: 65, population: "47.9M", status: "critical" },
  { id: "balochistan", name: "Balochistan", lat: 28, lng: 65, flood: 45, earthquake: 72, heatwave: 89, cyclone: 30, population: "12.3M", status: "high" },
  { id: "punjab", name: "Punjab", lat: 31, lng: 73, flood: 62, earthquake: 55, heatwave: 71, cyclone: 15, population: "110M", status: "high" },
  { id: "kpk", name: "KPK", lat: 34, lng: 71, flood: 70, earthquake: 85, heatwave: 42, cyclone: 10, population: "35.5M", status: "critical" },
  { id: "gilgit", name: "Gilgit-Baltistan", lat: 36, lng: 74, flood: 55, earthquake: 91, heatwave: 25, cyclone: 5, population: "2.4M", status: "high" },
  { id: "azad_kashmir", name: "Azad Kashmir", lat: 34.5, lng: 73.5, flood: 60, earthquake: 88, heatwave: 30, cyclone: 8, population: "4.5M", status: "moderate" },
  { id: "islamabad", name: "Islamabad", lat: 33.7, lng: 73.1, flood: 40, earthquake: 68, heatwave: 55, cyclone: 12, population: "2.1M", status: "moderate" },
];

const ALERTS = [
  { id: 1, time: "2 min ago", region: "Sindh", type: "flood", message: "River Indus water level rising — 87% breach probability in 6hrs", severity: "critical", icon: "🌊" },
  { id: 2, time: "15 min ago", region: "KPK", type: "earthquake", message: "Seismic cluster detected near Peshawar — M4.2 precursor pattern", severity: "high", icon: "⚡" },
  { id: 3, time: "32 min ago", region: "Balochistan", type: "heatwave", message: "48°C+ forecast for next 72hrs — mass casualty risk elevated", severity: "high", icon: "🔥" },
  { id: 4, time: "1 hr ago", region: "Punjab", type: "flood", message: "Flash flood watch issued — Chenab tributaries overflow risk", severity: "moderate", icon: "🌊" },
  { id: 5, time: "2 hrs ago", region: "Gilgit", type: "earthquake", message: "GLOF warning — glacial lake outburst flood potential rising", severity: "moderate", icon: "⚡" },
];

const RESOURCES = [
  { name: "NDMA Teams", deployed: 24, total: 40, icon: "🚁", color: "#0ea5e9" },
  { name: "Medical Units", deployed: 180, total: 250, icon: "🏥", color: "#10b981" },
  { name: "Relief Camps", deployed: 62, total: 100, icon: "⛺", color: "#f59e0b" },
  { name: "Rescue Boats", deployed: 340, total: 500, icon: "🚤", color: "#a855f7" },
];

const PREDICTIONS = [
  { day: "Today", flood: 78, earthquake: 45, heatwave: 82 },
  { day: "Day 2", flood: 85, earthquake: 48, heatwave: 88 },
  { day: "Day 3", flood: 91, earthquake: 52, heatwave: 79 },
  { day: "Day 4", flood: 76, earthquake: 44, heatwave: 72 },
  { day: "Day 5", flood: 65, earthquake: 60, heatwave: 68 },
  { day: "Day 6", flood: 55, earthquake: 55, heatwave: 65 },
  { day: "Day 7", flood: 48, earthquake: 49, heatwave: 60 },
];

const MODEL_STATS = [
  { label: "Flood Model Accuracy", value: "94.2%", trend: "+1.2%", color: "#0ea5e9" },
  { label: "Seismic Prediction F1", value: "87.8%", trend: "+0.5%", color: "#f59e0b" },
  { label: "Heatwave Forecast", value: "96.1%", trend: "+0.8%", color: "#ef4444" },
  { label: "False Alarm Rate", value: "3.4%", trend: "-0.3%", color: "#10b981" },
];

function getRiskColor(value) {
  if (value >= 80) return "#ef4444";
  if (value >= 60) return "#f97316";
  if (value >= 40) return "#f59e0b";
  return "#10b981";
}

function RiskBar({ value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`,
        height: "100%",
        background: color || getRiskColor(value),
        borderRadius: 4,
        transition: "width 1s ease",
        boxShadow: `0 0 8px ${color || getRiskColor(value)}80`
      }} />
    </div>
  );
}

function PulsingDot({ color, size = 10 }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, animation: "ping 1.5s ease-out infinite", opacity: 0.6
      }} />
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    </span>
  );
}

function SatelliteGrid() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;

    // Draw Pakistan map approximation as heatmap cells
    const cols = 30, rows = 25;
    const cw = W / cols, ch = H / rows;

    // Risk data grid (simulated spatio-temporal)
    const riskGrid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const cx = c / cols, cy = r / rows;
        const sindh = Math.exp(-((cx - 0.6) ** 2 + (cy - 0.7) ** 2) / 0.03) * 0.9;
        const kpk = Math.exp(-((cx - 0.3) ** 2 + (cy - 0.25) ** 2) / 0.04) * 0.85;
        const baloch = Math.exp(-((cx - 0.2) ** 2 + (cy - 0.55) ** 2) / 0.06) * 0.7;
        return Math.min(sindh + kpk + baloch, 1);
      })
    );

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      riskGrid.forEach((row, r) => {
        row.forEach((risk, c) => {
          const animated = risk + Math.sin(frame * 0.03 + c * 0.3 + r * 0.2) * 0.05;
          const v = Math.max(0, Math.min(animated, 1));
          if (v < 0.1) return;
          let color;
          if (v > 0.7) color = `rgba(239,68,68,${v * 0.7})`;
          else if (v > 0.4) color = `rgba(249,115,22,${v * 0.6})`;
          else color = `rgba(245,158,11,${v * 0.5})`;
          ctx.fillStyle = color;
          ctx.fillRect(c * cw, r * ch, cw - 1, ch - 1);
        });
      });

      // Draw satellite scan line
      const scanY = ((frame * 1.5) % H);
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 4);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(1, "rgba(0,255,180,0.15)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, W, 24);
      ctx.strokeStyle = "rgba(0,255,180,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(W, scanY);
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, H); ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(W, i * ch); ctx.stroke();
      }

      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function MiniChart({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 120, H = 40;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 8) - 4}`).join(" ");

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#grad-${color.replace("#", "")})`} stroke="none" />
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DisasterSystem() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [activeDisaster, setActiveDisaster] = useState("flood");
  const [time, setTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(3);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: "dashboard", label: "COMMAND CENTER", icon: "◈" },
    { id: "heatmap", label: "RISK HEATMAP", icon: "⊕" },
    { id: "predictions", label: "AI FORECAST", icon: "⟳" },
    { id: "response", label: "RESPONSE OPS", icon: "⊛" },
    { id: "models", label: "MODEL METRICS", icon: "∿" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020811",
      color: "#e2e8f0",
      fontFamily: "'Courier New', monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @keyframes ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanMove { from { transform: translateX(-100%); } to { transform: translateX(400%); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,180,0.2); border-radius: 2px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* BG grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,180,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,180,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px"
      }} />

      {/* Glow orbs */}
      <div style={{ position: "fixed", top: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -200, left: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* HEADER */}
        <header style={{
          borderBottom: "1px solid rgba(0,255,180,0.1)",
          background: "rgba(2,8,17,0.9)",
          backdropFilter: "blur(20px)",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 8,
              background: "linear-gradient(135deg, #0ea5e9, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 0 20px rgba(14,165,233,0.4)"
            }}>🛰️</div>
            <div>
              <div style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 3, fontWeight: 700 }}>SENTINEL-AI // v3.7.2</div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: "#f1f5f9" }}>NATIONWIDE DISASTER PREDICTION & RESPONSE</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>SYSTEM TIME (UTC+5)</div>
              <div style={{ fontSize: 14, color: "#00ffb4", letterSpacing: 2, animation: "blink 2s infinite" }}>
                {time.toLocaleTimeString("en-PK")}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6 }}>
              <PulsingDot color="#ef4444" />
              <span style={{ fontSize: 11, color: "#ef4444", letterSpacing: 2, fontWeight: 700 }}>{alertCount} ACTIVE ALERTS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,255,180,0.05)", border: "1px solid rgba(0,255,180,0.2)", borderRadius: 6 }}>
              <PulsingDot color="#00ffb4" size={8} />
              <span style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2 }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* NAV TABS */}
        <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(2,8,17,0.6)", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "12px 20px", background: "none", border: "none",
              color: activeTab === tab.id ? "#00ffb4" : "#64748b",
              fontSize: 10, letterSpacing: 2, fontWeight: 700, cursor: "pointer",
              borderBottom: `2px solid ${activeTab === tab.id ? "#00ffb4" : "transparent"}`,
              transition: "all 0.2s", fontFamily: "'Courier New', monospace", whiteSpace: "nowrap"
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              {/* KPI Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "REGIONS MONITORED", value: "131", sub: "Districts + UAs", color: "#0ea5e9", icon: "📡" },
                  { label: "PEOPLE AT RISK", value: "23.4M", sub: "Real-time estimate", color: "#ef4444", icon: "👥" },
                  { label: "SATELLITES ACTIVE", value: "12", sub: "SAR + Optical + IR", color: "#10b981", icon: "🛰️" },
                  { label: "MODEL INFERENCE/SEC", value: "2,847", sub: "Spatio-temporal DL", color: "#a855f7", icon: "🧠" },
                ].map(kpi => (
                  <div key={kpi.label} style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${kpi.color}20`,
                    borderRadius: 12, padding: 20, position: "relative", overflow: "hidden"
                  }}>
                    <div style={{ position: "absolute", top: -20, right: -20, fontSize: 60, opacity: 0.06 }}>{kpi.icon}</div>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>{kpi.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: kpi.color, letterSpacing: 1 }}>{kpi.value}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
                {/* LEFT: Alerts + Region Risk */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Live Alerts */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700 }}>◈ LIVE ALERT FEED</span>
                      <span style={{ fontSize: 10, color: "#64748b" }}>Auto-refresh: 30s</span>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                      {ALERTS.map(alert => (
                        <div key={alert.id} style={{
                          padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                          display: "flex", gap: 14, alignItems: "flex-start",
                          background: alert.severity === "critical" ? "rgba(239,68,68,0.04)" : "transparent"
                        }}>
                          <span style={{ fontSize: 20 }}>{alert.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                              <span style={{
                                fontSize: 9, letterSpacing: 1, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 3, background: alert.severity === "critical" ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)",
                                color: alert.severity === "critical" ? "#ef4444" : "#f97316"
                              }}>{alert.severity.toUpperCase()}</span>
                              <span style={{ fontSize: 10, color: "#64748b" }}>{alert.region}</span>
                              <span style={{ fontSize: 10, color: "#334155" }}>• {alert.time}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{alert.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Region Risk Table */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700 }}>⊕ REGIONAL RISK INDEX — PAKISTAN</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["REGION", "POPULATION", "FLOOD", "EARTHQUAKE", "HEATWAVE", "STATUS"].map(h => (
                              <th key={h} style={{ padding: "10px 16px", fontSize: 9, color: "#475569", letterSpacing: 2, textAlign: "left", fontWeight: 700 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {REGIONS.map(r => (
                            <tr key={r.id} onClick={() => setSelectedRegion(r)} style={{
                              borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer",
                              background: selectedRegion.id === r.id ? "rgba(0,255,180,0.05)" : "transparent",
                              transition: "background 0.2s"
                            }}>
                              <td style={{ padding: "12px 16px", fontSize: 12, color: "#e2e8f0", fontWeight: 700 }}>{r.name}</td>
                              <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748b" }}>{r.population}</td>
                              {["flood", "earthquake", "heatwave"].map(type => (
                                <td key={type} style={{ padding: "12px 16px", minWidth: 100 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 11, color: getRiskColor(r[type]), minWidth: 28, fontWeight: 700 }}>{r[type]}%</span>
                                    <div style={{ flex: 1 }}><RiskBar value={r[type]} /></div>
                                  </div>
                                </td>
                              ))}
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{
                                  fontSize: 9, letterSpacing: 1, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                                  background: r.status === "critical" ? "rgba(239,68,68,0.15)" : r.status === "high" ? "rgba(249,115,22,0.15)" : "rgba(245,158,11,0.15)",
                                  color: r.status === "critical" ? "#ef4444" : r.status === "high" ? "#f97316" : "#f59e0b",
                                  border: `1px solid ${r.status === "critical" ? "rgba(239,68,68,0.3)" : r.status === "high" ? "rgba(249,115,22,0.3)" : "rgba(245,158,11,0.3)"}`
                                }}>{r.status.toUpperCase()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Selected Region Detail */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,180,0.1)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>SELECTED REGION</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 4 }}>{selectedRegion.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Population: {selectedRegion.population}</div>

                    {[
                      { type: "flood", label: "Flood Risk", icon: "🌊", color: "#0ea5e9" },
                      { type: "earthquake", label: "Seismic Risk", icon: "⚡", color: "#f59e0b" },
                      { type: "heatwave", label: "Heatwave Risk", icon: "🔥", color: "#ef4444" },
                      { type: "cyclone", label: "Cyclone Risk", icon: "🌀", color: "#a855f7" },
                    ].map(d => (
                      <div key={d.type} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{d.icon} {d.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: getRiskColor(selectedRegion[d.type]) }}>{selectedRegion[d.type]}%</span>
                        </div>
                        <RiskBar value={selectedRegion[d.type]} color={d.color} />
                      </div>
                    ))}

                    <div style={{ marginTop: 20, padding: 14, background: "rgba(0,255,180,0.04)", borderRadius: 8, border: "1px solid rgba(0,255,180,0.1)" }}>
                      <div style={{ fontSize: 10, color: "#00ffb4", letterSpacing: 2, marginBottom: 8 }}>AI RECOMMENDATION</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                        Pre-position 3 rapid response teams near river belt. Alert medical facilities within 50km radius. Issue early warning to 2.3M riverside residents.
                      </div>
                    </div>
                  </div>

                  {/* Satellite Data Sources */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#00ffb4", letterSpacing: 2, marginBottom: 16 }}>∿ DATA INGESTION PIPELINE</div>
                    {[
                      { name: "Sentinel-1 SAR", status: "LIVE", type: "Flood mapping", color: "#0ea5e9" },
                      { name: "MODIS Terra/Aqua", status: "LIVE", type: "LST + Vegetation", color: "#10b981" },
                      { name: "USGS ShakeMap", status: "LIVE", type: "Seismic network", color: "#f59e0b" },
                      { name: "ERA5 Reanalysis", status: "SYNCING", type: "Historical weather", color: "#a855f7" },
                      { name: "IMD NWP Forecast", status: "LIVE", type: "Weather prediction", color: "#06b6d4" },
                    ].map(src => (
                      <div key={src.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 700 }}>{src.name}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>{src.type}</div>
                        </div>
                        <span style={{
                          fontSize: 9, letterSpacing: 1, padding: "2px 8px", borderRadius: 3,
                          color: src.status === "LIVE" ? "#10b981" : "#f59e0b",
                          background: src.status === "LIVE" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                          animation: src.status === "LIVE" ? "blink 3s infinite" : "none"
                        }}>{src.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HEATMAP TAB */}
          {activeTab === "heatmap" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                {DISASTERS.map(d => (
                  <button key={d.type} onClick={() => setActiveDisaster(d.type)} style={{
                    padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                    background: activeDisaster === d.type ? d.bgColor : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeDisaster === d.type ? d.color : "rgba(255,255,255,0.08)"}`,
                    color: activeDisaster === d.type ? d.color : "#64748b",
                    fontSize: 11, letterSpacing: 1, fontWeight: 700,
                    fontFamily: "'Courier New', monospace", transition: "all 0.2s"
                  }}>
                    {d.icon} {d.name.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700 }}>⊕ SATELLITE RISK HEATMAP — PAKISTAN</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Spatio-temporal ConvLSTM prediction</span>
                  </div>
                  <div style={{ height: 400, position: "relative" }}>
                    <SatelliteGrid />
                    <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(2,8,17,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>RISK LEGEND</div>
                      {[
                        { label: "CRITICAL (>80%)", color: "#ef4444" },
                        { label: "HIGH (60-80%)", color: "#f97316" },
                        { label: "MODERATE (40-60%)", color: "#f59e0b" },
                        { label: "LOW (<40%)", color: "#10b981" },
                      ].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color }} />
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 10, color: "#00ffb4", letterSpacing: 2, fontWeight: 700 }}>TOP RISK ZONES</div>
                  {REGIONS.sort((a, b) => b[activeDisaster] - a[activeDisaster]).map((r, i) => (
                    <div key={r.id} style={{
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10, padding: 16
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>#{i + 1}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.name}</div>
                            <div style={{ fontSize: 10, color: "#475569" }}>{r.population}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: getRiskColor(r[activeDisaster]) }}>{r[activeDisaster]}%</span>
                      </div>
                      <RiskBar value={r[activeDisaster]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREDICTIONS TAB */}
          {activeTab === "predictions" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
                {[
                  { type: "flood", label: "7-Day Flood Risk Forecast", color: "#0ea5e9", icon: "🌊", model: "ConvLSTM + WRF" },
                  { type: "earthquake", label: "Seismic Activity Forecast", color: "#f59e0b", icon: "⚡", model: "GNN + GNSS Data" },
                  { type: "heatwave", label: "Temperature Anomaly Forecast", color: "#ef4444", icon: "🔥", model: "Transformer + ERA5" },
                ].map(fc => (
                  <div key={fc.type} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${fc.color}20`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: fc.color, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>{fc.icon} {fc.label.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>Model: {fc.model}</div>
                      </div>
                    </div>
                    <MiniChart data={PREDICTIONS.map(p => p[fc.type])} color={fc.color} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                      {PREDICTIONS.map(p => (
                        <div key={p.day} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: "#475569", marginBottom: 2 }}>{p.day}</div>
                          <div style={{ fontSize: 10, color: getRiskColor(p[fc.type]), fontWeight: 700 }}>{p[fc.type]}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Model Architecture Info */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700, marginBottom: 20 }}>🧠 AI MODEL ARCHITECTURE — SPATIO-TEMPORAL DEEP LEARNING</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                  {[
                    {
                      name: "FloodNet-v2", type: "Flood Prediction",
                      arch: "ConvLSTM + U-Net", inputs: "SAR imagery, DEM, rainfall, soil moisture, river gauge",
                      output: "72hr flood inundation maps", accuracy: "94.2%", color: "#0ea5e9"
                    },
                    {
                      name: "SeismicGNN", type: "Earthquake Forecast",
                      arch: "Graph Neural Network", inputs: "GNSS displacement, seismicity catalogs, fault geometry, stress",
                      output: "M4.0+ probability maps", accuracy: "87.8%", color: "#f59e0b"
                    },
                    {
                      name: "HeatVision", type: "Heatwave Prediction",
                      arch: "Vision Transformer", inputs: "LST, NDVI, urban heat island, reanalysis, NWP",
                      output: "5-day temperature anomaly", accuracy: "96.1%", color: "#ef4444"
                    },
                  ].map(m => (
                    <div key={m.name} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 18, border: `1px solid ${m.color}15` }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: m.color, marginBottom: 4 }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 12 }}>{m.type}</div>
                      {[
                        ["Architecture", m.arch],
                        ["Input Data", m.inputs],
                        ["Output", m.output],
                        ["Test Accuracy", m.accuracy],
                      ].map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 2 }}>{k.toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESPONSE OPS TAB */}
          {activeTab === "response" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {RESOURCES.map(r => (
                  <div key={r.name} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${r.color}20`, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{r.icon}</div>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>{r.name.toUpperCase()}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: r.color }}>{r.deployed}<span style={{ fontSize: 12, color: "#475569" }}>/{r.total}</span></div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{Math.round(r.deployed / r.total * 100)}% deployed</div>
                      <RiskBar value={r.deployed / r.total * 100} color={r.color} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700 }}>⊛ AI-OPTIMIZED RESPONSE ROUTING</span>
                  </div>
                  <div style={{ padding: 20 }}>
                    {[
                      { action: "Deploy 4 NDMA teams to Sukkur", priority: "IMMEDIATE", region: "Sindh", ETA: "45 min", status: "dispatched" },
                      { action: "Pre-position 200 rescue boats at Kotri Barrage", priority: "HIGH", region: "Sindh", ETA: "2 hrs", status: "en-route" },
                      { action: "Evacuate 15,000 from Dera Ismail Khan flood plains", priority: "HIGH", region: "KPK", ETA: "4 hrs", status: "initiated" },
                      { action: "Deploy 3 field hospitals to Quetta", priority: "MODERATE", region: "Balochistan", ETA: "6 hrs", status: "pending" },
                      { action: "Issue GLOF early warning — Hunza Valley", priority: "MODERATE", region: "Gilgit", ETA: "8 hrs", status: "pending" },
                    ].map((task, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "flex-start" }}>
                        <span style={{
                          fontSize: 9, padding: "3px 8px", borderRadius: 3, fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap",
                          background: task.priority === "IMMEDIATE" ? "rgba(239,68,68,0.2)" : task.priority === "HIGH" ? "rgba(249,115,22,0.2)" : "rgba(245,158,11,0.15)",
                          color: task.priority === "IMMEDIATE" ? "#ef4444" : task.priority === "HIGH" ? "#f97316" : "#f59e0b",
                        }}>{task.priority}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 4 }}>{task.action}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>{task.region} • ETA: {task.ETA} •
                            <span style={{ color: task.status === "dispatched" ? "#10b981" : task.status === "en-route" ? "#0ea5e9" : task.status === "initiated" ? "#a855f7" : "#475569" }}> {task.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700 }}>📡 COMMUNICATION NETWORK STATUS</span>
                  </div>
                  <div style={{ padding: 20 }}>
                    {[
                      { channel: "NDMA HQ — Provincial EOCs", status: "ACTIVE", latency: "12ms", uptime: "99.9%" },
                      { channel: "Satellite Emergency Broadcast", status: "ACTIVE", latency: "280ms", uptime: "99.7%" },
                      { channel: "Mobile Alert System (SMS)", status: "ACTIVE", latency: "4.2s", uptime: "98.1%" },
                      { channel: "District Coordination Network", status: "ACTIVE", latency: "45ms", uptime: "97.8%" },
                      { channel: "UN OCHA Reporting API", status: "SYNCING", latency: "120ms", uptime: "96.2%" },
                      { channel: "Media Emergency Broadcast", status: "STANDBY", latency: "—", uptime: "100%" },
                    ].map((ch, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#cbd5e1" }}>{ch.channel}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>Latency: {ch.latency} • Uptime: {ch.uptime}</div>
                        </div>
                        <span style={{
                          fontSize: 9, padding: "2px 8px", borderRadius: 3, letterSpacing: 1, fontWeight: 700,
                          color: ch.status === "ACTIVE" ? "#10b981" : ch.status === "SYNCING" ? "#f59e0b" : "#64748b",
                          background: ch.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : ch.status === "SYNCING" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.1)"
                        }}>{ch.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODEL METRICS TAB */}
          {activeTab === "models" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {MODEL_STATS.map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}20`, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: s.trend.startsWith("+") ? "#10b981" : "#10b981", marginTop: 4 }}>
                      {s.trend} vs last month
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 11, color: "#00ffb4", letterSpacing: 2, fontWeight: 700, marginBottom: 20 }}>∿ TRAINING DATA SOURCES</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                  {[
                    { name: "Historical Disaster Events", records: "1.2M events", span: "1960–2024", source: "EM-DAT, NDMA, PDMA", color: "#0ea5e9" },
                    { name: "Satellite Imagery Archive", records: "500TB+", span: "2000–2024", source: "ESA, NASA, ISRO", color: "#10b981" },
                    { name: "Weather Station Data", records: "780M readings", span: "1950–2024", source: "PMD, ERA5, NOAA", color: "#f59e0b" },
                    { name: "Seismic Waveform Catalog", records: "2.3M events", span: "1900–2024", source: "USGS, IRIS, PMD", color: "#ef4444" },
                    { name: "Population & Vulnerability", records: "131 districts", span: "Census 2023", source: "PBS Pakistan, UN OCHA", color: "#a855f7" },
                    { name: "Infrastructure GIS Data", records: "4.7M features", span: "Updated 2024", source: "Survey of Pakistan, OSM", color: "#06b6d4" },
                  ].map(ds => (
                    <div key={ds.name} style={{ display: "flex", gap: 16, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${ds.color}15` }}>
                      <div style={{ width: 4, borderRadius: 2, background: ds.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{ds.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{ds.records} • {ds.span}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Source: {ds.source}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(2,8,17,0.8)" }}>
          <span style={{ fontSize: 10, color: "#334155", letterSpacing: 2 }}>SENTINEL-AI © 2025 // NDMA × UN-OCHA × ANTHROPIC RESEARCH</span>
          <span style={{ fontSize: 10, color: "#334155", letterSpacing: 2 }}>DATA REFRESH: 30s // PREDICTIONS: 6hr CYCLE // SATELLITE: 15min</span>
        </footer>
      </div>
    </div>
  );
}
