import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line } from "recharts";

// ── Model coefficients from logistic regression ──
const MODEL = {
  intercept: -93.5572,
  coefs: { fq: 28.8761, pb: 36.6887, ks: 26.1582, h: 34.0957 },
};

const COUNTRY_MODELS = {
  "Hong Kong": { intercept: -152.29, coefs: { fq: 43.05, pb: 47.22, ks: 34.58, h: 55.10 }, n: 256, fail: 2, acc: 1.000, r2: 1.000, status: "Non-converged" },
  "Japan": { intercept: -65.44, coefs: { fq: 22.94, pb: 23.58, ks: 14.26, h: 27.58 }, n: 335, fail: 118, acc: 0.961, r2: 0.911, status: "Converged" },
  "Philippines": { intercept: -54.19, coefs: { fq: 20.75, pb: 14.57, ks: 16.83, h: 24.72 }, n: 124, fail: 11, acc: 0.960, r2: 0.841, status: "Converged" },
  "Singapore": { intercept: -98.29, coefs: { fq: 29.05, pb: 38.56, ks: 25.12, h: 39.28 }, n: 350, fail: 22, acc: 0.986, r2: 0.890, status: "Converged" },
  "South Korea": { intercept: -118.74, coefs: { fq: 41.78, pb: 48.34, ks: 26.59, h: 36.61 }, n: 838, fail: 14, acc: 0.994, r2: 0.835, status: "Converged" },
  "Thailand": { intercept: -195.48, coefs: { fq: 55.12, pb: 62.84, ks: 44.62, h: 72.33 }, n: 73, fail: 2, acc: 1.000, r2: 1.000, status: "Non-converged" },
};

// ── Country-level BSE data (aggregated from dataset) ──
const COUNTRY_DATA = [
  { country: "South Korea", audits: 838, failRate: 1.7, avgFQ: 90.8, avgPB: 89.6, avgKS: 87.7, avgH: 87.3, avgOverall: 89.4 },
  { country: "Singapore", audits: 350, failRate: 6.3, avgFQ: 90.0, avgPB: 87.3, avgKS: 77.6, avgH: 80.5, avgOverall: 85.1 },
  { country: "Japan", audits: 335, failRate: 35.2, avgFQ: 84.6, avgPB: 77.2, avgKS: 73.2, avgH: 72.1, avgOverall: 76.9 },
  { country: "Hong Kong", audits: 256, failRate: 0.8, avgFQ: 91.0, avgPB: 92.6, avgKS: 90.6, avgH: 83.7, avgOverall: 91.6 },
  { country: "Philippines", audits: 124, failRate: 8.9, avgFQ: 93.3, avgPB: 81.4, avgKS: 86.0, avgH: 74.4, avgOverall: 84.4 },
  { country: "Thailand", audits: 73, failRate: 2.7, avgFQ: 95.8, avgPB: 93.2, avgKS: 82.5, avgH: 82.7, avgOverall: 89.8 },
  { country: "Malaysia", audits: 10, failRate: 0.0, avgFQ: 93.6, avgPB: 92.8, avgKS: 77.9, avgH: 80.6, avgOverall: 87.3 },
];

const SECTION_WEIGHTS = { "Food & Quality": 20, "People & Business": 27, "Kitchen & Safety": 21, "Hospitality": 32 };

const COLORS = {
  bg: "#0F1419", card: "#1A2332", cardHover: "#1E2A3A", border: "#2A3A4E",
  accent: "#00C853", accentDim: "#00963E", danger: "#FF3D57", warn: "#FFB300",
  text: "#E8ECF1", textMuted: "#8899AA", textDim: "#5A6B7E",
  green: "#00C853", greenBg: "rgba(0,200,83,0.08)",
  red: "#FF3D57", redBg: "rgba(255,61,87,0.08)",
  amber: "#FFB300", amberBg: "rgba(255,179,0,0.08)",
  chart: ["#00C853", "#00B0FF", "#FF6D00", "#AA00FF", "#FF3D57", "#FFD600", "#00E5FF"],
};

function predictProb(fq, pb, ks, h, model = MODEL) {
  const logOdds = model.intercept + model.coefs.fq * fq + model.coefs.pb * pb + model.coefs.ks * ks + model.coefs.h * h;
  return 1 / (1 + Math.exp(-logOdds));
}

function GaugeChart({ value, size = 180 }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const angle = (pct / 100) * 180;
  const r = size / 2 - 16;
  const cx = size / 2, cy = size / 2 + 10;
  const color = pct >= 75 ? COLORS.green : pct >= 50 ? COLORS.amber : COLORS.red;
  const endX = cx + r * Math.cos(Math.PI - (angle * Math.PI) / 180);
  const endY = cy - r * Math.sin(Math.PI - (angle * Math.PI) / 180);
  const large = angle > 180 ? 1 : 0;

  return (
    <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={COLORS.border} strokeWidth="10" strokeLinecap="round" />
      {angle > 0 && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />}
      <text x={cx} y={cy - 14} textAnchor="middle" fill={color} fontSize="32" fontWeight="800" fontFamily="'JetBrains Mono', monospace">{pct.toFixed(1)}%</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill={COLORS.textMuted} fontSize="11" fontFamily="sans-serif">{pct >= 75 ? "PASS" : "FAIL"}</text>
    </svg>
  );
}

function Slider({ label, value, onChange, weight }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? COLORS.green : pct >= 75 ? COLORS.amber : COLORS.red;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 600 }}>{label} <span style={{ color: COLORS.textDim, fontWeight: 400, fontSize: 11 }}>({weight}%)</span></span>
        <span style={{ color, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
      </div>
      <input type="range" min="0" max="100" value={pct} onChange={e => onChange(Number(e.target.value) / 100)}
        style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }} />
    </div>
  );
}

function MetricCard({ label, value, sub, color = COLORS.text }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px 18px", flex: 1, minWidth: 140 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionImpact({ scores, setScores }) {
  const baseline = predictProb(scores.fq, scores.pb, scores.ks, scores.h);
  const bump = 0.05;
  const impacts = [
    { name: "Food & Quality", key: "fq", current: scores.fq },
    { name: "People & Business", key: "pb", current: scores.pb },
    { name: "Kitchen & Safety", key: "ks", current: scores.ks },
    { name: "Hospitality", key: "h", current: scores.h },
  ].map(s => {
    const newScores = { ...scores, [s.key]: Math.min(1, s.current + bump) };
    const newProb = predictProb(newScores.fq, newScores.pb, newScores.ks, newScores.h);
    return { ...s, impact: (newProb - baseline) * 100, newProb: newProb * 100 };
  }).sort((a, b) => b.impact - a.impact);

  return (
    <div>
      <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 12 }}>Impact of +5% improvement on pass probability</div>
      {impacts.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "8px 12px", background: i === 0 ? COLORS.greenBg : "transparent", borderRadius: 8, border: i === 0 ? `1px solid ${COLORS.green}33` : "1px solid transparent" }}>
          <div style={{ width: 140, color: COLORS.text, fontSize: 13, fontWeight: i === 0 ? 700 : 400 }}>{s.name}</div>
          <div style={{ flex: 1, height: 8, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, s.impact * 10)}%`, height: "100%", background: i === 0 ? COLORS.green : COLORS.chart[1], borderRadius: 4, transition: "width 0.4s" }} />
          </div>
          <div style={{ width: 70, textAlign: "right", color: COLORS.green, fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>+{s.impact.toFixed(2)}%</div>
        </div>
      ))}
      {impacts[0] && <div style={{ marginTop: 8, padding: "10px 14px", background: COLORS.greenBg, borderRadius: 8, border: `1px solid ${COLORS.green}22` }}>
        <span style={{ color: COLORS.green, fontSize: 12 }}>Recommendation: Prioritize <strong>{impacts[0].name}</strong> — highest marginal gain per 5% improvement</span>
      </div>}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("predictor");
  const [scores, setScores] = useState({ fq: 0.82, pb: 0.78, ks: 0.76, h: 0.80 });
  const [selectedCountry, setSelectedCountry] = useState("All");

  const prob = useMemo(() => {
    if (selectedCountry !== "All" && COUNTRY_MODELS[selectedCountry]) {
      return predictProb(scores.fq, scores.pb, scores.ks, scores.h, COUNTRY_MODELS[selectedCountry]);
    }
    return predictProb(scores.fq, scores.pb, scores.ks, scores.h);
  }, [scores, selectedCountry]);

  const weightedOverall = scores.fq * 0.20 + scores.pb * 0.27 + scores.ks * 0.21 + scores.h * 0.32;

  const tabs = [
    { id: "predictor", label: "Risk Predictor" },
    { id: "country", label: "Country View" },
    { id: "sections", label: "Section Analysis" },
    { id: "model", label: "Model Details" },
  ];

  const radarData = COUNTRY_DATA.map(c => ({
    country: c.country === "South Korea" ? "S. Korea" : c.country === "Philippines" ? "Phil." : c.country,
    "Food & Quality": c.avgFQ, "People & Business": c.avgPB,
    "Kitchen & Safety": c.avgKS, "Hospitality": c.avgH,
  }));

  const failRateData = [...COUNTRY_DATA].sort((a, b) => b.failRate - a.failRate);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0A1628 0%, #152238 100%)", borderBottom: `1px solid ${COLORS.border}`, padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #00C853, #00B0FF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#0A1628" }}>SS</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>BSE Analytics Dashboard</h1>
            <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>Brand Standard Evaluation · Logistic Regression Model · 2023–2025</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "8px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === t.id ? COLORS.accent : "transparent",
              color: tab === t.id ? "#0A1628" : COLORS.textMuted,
              transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ═══ TAB: RISK PREDICTOR ═══ */}
        {tab === "predictor" && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <MetricCard label="Weighted Overall" value={`${(weightedOverall * 100).toFixed(1)}%`} sub="Based on section weights" color={weightedOverall >= 0.85 ? COLORS.green : weightedOverall >= 0.75 ? COLORS.amber : COLORS.red} />
              <MetricCard label="Pass Probability" value={`${(prob * 100).toFixed(1)}%`} sub="Logistic regression model" color={prob >= 0.5 ? COLORS.green : COLORS.red} />
              <MetricCard label="Classification" value={weightedOverall >= 0.85 ? "Meets Exp." : weightedOverall >= 0.75 ? "Needs Imp." : "Unacceptable"} sub={`Threshold: 75% pass, 85% meets`} color={weightedOverall >= 0.85 ? COLORS.green : weightedOverall >= 0.75 ? COLORS.amber : COLORS.red} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Section Scores</h3>
                  <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
                    style={{ background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>
                    <option value="All">All Countries</option>
                    {Object.keys(COUNTRY_MODELS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Slider label="Food & Quality" value={scores.fq} onChange={v => setScores(s => ({ ...s, fq: v }))} weight={20} />
                <Slider label="People & Business" value={scores.pb} onChange={v => setScores(s => ({ ...s, pb: v }))} weight={27} />
                <Slider label="Kitchen & Safety" value={scores.ks} onChange={v => setScores(s => ({ ...s, ks: v }))} weight={21} />
                <Slider label="Hospitality" value={scores.h} onChange={v => setScores(s => ({ ...s, h: v }))} weight={32} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => setScores({ fq: 0.90, pb: 0.88, ks: 0.87, h: 0.89 })} style={{ flex: 1, padding: "7px", background: COLORS.greenBg, color: COLORS.green, border: `1px solid ${COLORS.green}33`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Strong Store</button>
                  <button onClick={() => setScores({ fq: 0.78, pb: 0.74, ks: 0.72, h: 0.76 })} style={{ flex: 1, padding: "7px", background: COLORS.amberBg, color: COLORS.amber, border: `1px solid ${COLORS.amber}33`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Borderline</button>
                  <button onClick={() => setScores({ fq: 0.65, pb: 0.60, ks: 0.58, h: 0.62 })} style={{ flex: 1, padding: "7px", background: COLORS.redBg, color: COLORS.red, border: `1px solid ${COLORS.red}33`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>At Risk</button>
                </div>
              </div>

              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Pass Probability</h3>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <GaugeChart value={prob} size={200} />
                </div>
                <SectionImpact scores={scores} setScores={setScores} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: COUNTRY VIEW ═══ */}
        {tab === "country" && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <MetricCard label="Total Audits" value="1,986" sub="7 countries, 2023–2025" />
              <MetricCard label="Overall Fail Rate" value="8.5%" sub="169 of 1,986 audits" color={COLORS.red} />
              <MetricCard label="Highest Risk" value="Japan" sub="35.2% failure rate" color={COLORS.red} />
              <MetricCard label="Best Performer" value="Hong Kong" sub="0.8% failure rate (excl. Malaysia N=10)" color={COLORS.green} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Failure Rate by Country</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={failRateData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
                    <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 11 }} domain={[0, 40]} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="country" tick={{ fill: COLORS.text, fontSize: 12 }} width={90} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} formatter={v => [`${v}%`, "Fail Rate"]} />
                    <Bar dataKey="failRate" radius={[0, 4, 4, 0]}>
                      {failRateData.map((d, i) => <Cell key={i} fill={d.failRate > 15 ? COLORS.red : d.failRate > 8 ? COLORS.amber : COLORS.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Average Section Scores</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={COUNTRY_DATA.map(c => ({ name: c.country === "South Korea" ? "S. Korea" : c.country === "Philippines" ? "Phil." : c.country, FQ: c.avgFQ, PB: c.avgPB, KS: c.avgKS, H: c.avgH }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                    <YAxis domain={[70, 100]} tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Bar dataKey="FQ" fill={COLORS.chart[0]} name="Food & Quality" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="PB" fill={COLORS.chart[1]} name="People & Business" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="KS" fill={COLORS.chart[2]} name="Kitchen & Safety" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="H" fill={COLORS.chart[3]} name="Hospitality" radius={[2, 2, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: COLORS.textMuted }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22, marginTop: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Country Performance Table</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                      {["Country", "Audits", "Fail Rate", "Avg FQ", "Avg PB", "Avg KS", "Avg H", "Avg Overall"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COUNTRY_DATA.map(c => (
                      <tr key={c.country} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{c.country}</td>
                        <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{c.audits}</td>
                        <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.failRate > 15 ? COLORS.red : c.failRate > 8 ? COLORS.amber : COLORS.green, fontWeight: 700 }}>{c.failRate}%</td>
                        {[c.avgFQ, c.avgPB, c.avgKS, c.avgH, c.avgOverall].map((v, i) => (
                          <td key={i} style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: v >= 85 ? COLORS.green : v >= 75 ? COLORS.amber : COLORS.red }}>{v}%</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: SECTION ANALYSIS ═══ */}
        {tab === "sections" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Section Weights vs. Model Impact</h3>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 14 }}>BSE weight (assigned) vs. logistic regression coefficient (learned)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { name: "Food &\nQuality", weight: 20, coef: 28.88 },
                    { name: "People &\nBusiness", weight: 27, coef: 36.69 },
                    { name: "Kitchen &\nSafety", weight: 21, coef: 26.16 },
                    { name: "Hospitality", weight: 32, coef: 34.10 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                    <YAxis tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Bar dataKey="weight" fill={COLORS.chart[1]} name="BSE Weight (%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="coef" fill={COLORS.green} name="Model Coefficient" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>BSE Weight Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={Object.entries(SECTION_WEIGHTS).map(([k, v]) => ({ name: k, value: v }))} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={{ stroke: COLORS.textDim }}>
                      {Object.keys(SECTION_WEIGHTS).map((_, i) => <Cell key={i} fill={COLORS.chart[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: COLORS.textMuted }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ gridColumn: "1 / -1", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Key Insights from the Model</h3>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16 }}>What the logistic regression tells us about predicting BSE failures</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { title: "People & Business is #1", desc: "Largest coefficient (36.69) — strongest predictor of pass/fail. Even small drops here disproportionately increase failure risk.", color: COLORS.chart[1] },
                    { title: "Hospitality Close Behind", desc: "Second highest impact (34.10) and highest BSE weight (32%). Stores failing here are most likely to fail overall.", color: COLORS.chart[3] },
                    { title: "Kitchen & Safety Least Predictive", desc: "Lowest coefficient (26.16) despite moderate weight (21%). Scores here vary less, so the model relies on it less.", color: COLORS.chart[2] },
                    { title: "98% Model Accuracy", desc: "The model correctly classifies 98% of all audits as pass or fail using just the four section scores.", color: COLORS.green },
                    { title: "Japan is Highest Risk", desc: "35.2% failure rate — over 1 in 3 audits fail. Hospitality (72.1%) and Kitchen & Safety (73.2%) are critically low.", color: COLORS.red },
                    { title: "All Sections Significant", desc: "Every section has p < 0.001, meaning all four are statistically significant predictors. None can be ignored.", color: COLORS.amber },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "16px 18px", background: COLORS.bg, borderRadius: 10, borderLeft: `3px solid ${item.color}` }}>
                      <div style={{ color: item.color, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: MODEL DETAILS ═══ */}
        {tab === "model" && (
          <div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Logistic Regression Equation</h3>
              <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 14 }}>Model 1: All countries combined (N = 1,986)</div>
              <div style={{ background: COLORS.bg, padding: "16px 20px", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COLORS.green, overflowX: "auto", lineHeight: 1.8 }}>
                logit(p) = -93.5572 + 28.8761 × FQ + 36.6887 × PB + 26.1582 × KS + 34.0957 × H
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 8 }}>
                Where p = probability of passing (≥75% overall), FQ/PB/KS/H are section scores as decimals (e.g., 0.85 = 85%)
              </div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Coefficient Summary (All Countries)</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    {["Variable", "Coefficient", "Std. Error", "z-value", "p-value", "Signif.", "Odds Ratio"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "(Intercept)", coef: -93.5572, se: 7.8234, z: -11.96, p: "<0.0001", sig: "***", or: 0.0000 },
                    { name: "Food & Quality", coef: 28.8761, se: 3.1245, z: 9.24, p: "<0.0001", sig: "***", or: "3.47e+12" },
                    { name: "People & Business", coef: 36.6887, se: 3.5621, z: 10.30, p: "<0.0001", sig: "***", or: "8.58e+15" },
                    { name: "Kitchen & Safety", coef: 26.1582, se: 2.8934, z: 9.04, p: "<0.0001", sig: "***", or: "2.29e+11" },
                    { name: "Hospitality", coef: 34.0957, se: 3.4178, z: 9.98, p: "<0.0001", sig: "***", or: "6.42e+14" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i === 0 ? "transparent" : i % 2 === 0 ? COLORS.bg + "44" : "transparent" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.coef.toFixed(4)}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.se.toFixed(4)}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.z.toFixed(2)}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.p}</td>
                      <td style={{ padding: "10px 12px", color: COLORS.red, fontWeight: 700 }}>{row.sig}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{typeof row.or === "number" ? row.or.toFixed(4) : row.or}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12, color: COLORS.textMuted, fontSize: 11 }}>
                Signif. codes: *** p{"<"}0.001 · ** p{"<"}0.01 · * p{"<"}0.05 &nbsp;|&nbsp; Accuracy: 98.0% &nbsp;|&nbsp; McFadden R²: 0.8541 &nbsp;|&nbsp; AIC: 137.42
              </div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Country-Level Model Comparison</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    {["Country", "N", "Fails", "Accuracy", "Nagelkerke R²", "SPSS Status"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(COUNTRY_MODELS).map(([country, m], i) => (
                    <tr key={country} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{country}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{m.n}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.red }}>{m.fail}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.green }}>{(m.acc * 100).toFixed(1)}%</td>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{m.r2.toFixed(3)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 11, color: m.status === "Converged" ? COLORS.green : COLORS.amber }}>{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12, color: COLORS.textMuted, fontSize: 11, fontStyle: "italic" }}>
                Source: SPSS Binary Logistic Regression. Malaysia excluded: only 2 of 10 cases had complete data (not estimable). Hong Kong & Thailand show non-convergence due to perfect/near-perfect separation — SPSS reached max iterations because the model can perfectly classify all cases.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "20px 0 30px", color: COLORS.textDim, fontSize: 11 }}>
        Shake Shack BSE Analytics · Logistic Regression Model · Data: 1,986 audits across 7 countries (2023–2025)
      </div>
    </div>
  );
}