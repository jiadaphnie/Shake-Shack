import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell, Legend,
} from "recharts";

/* ── constants ─────────────────────────────────────────────────────────── */
const GREEN = "#54A432";
const GREEN_LIGHT = "#e6f5de";
const GREEN_MID = "#3a8022";
const AMBER = "#f0a000";
const RED = "#d44";

const GLOBAL = {
  intercept: -93.5572,
  coefs: { fq: 28.8761, pb: 36.6887, ks: 26.1582, h: 34.0957 },
};

const COUNTRY_DATA = [
  { c: "South Korea",  n: 838, f: 14,  fr: 1.7,  fq: 90.8, pb: 89.6, ks: 87.7, h: 87.3, ov: 89.4 },
  { c: "Singapore",    n: 350, f: 22,  fr: 6.3,  fq: 90.0, pb: 87.3, ks: 77.6, h: 80.5, ov: 85.1 },
  { c: "Japan",        n: 335, f: 118, fr: 35.2, fq: 84.6, pb: 77.2, ks: 73.2, h: 72.1, ov: 76.9 },
  { c: "Hong Kong",    n: 256, f: 2,   fr: 0.8,  fq: 91.0, pb: 92.6, ks: 90.6, h: 83.7, ov: 91.6 },
  { c: "Philippines",  n: 124, f: 11,  fr: 8.9,  fq: 93.3, pb: 81.4, ks: 86.0, h: 74.4, ov: 84.4 },
  { c: "Thailand",     n: 73,  f: 2,   fr: 2.7,  fq: 95.8, pb: 93.2, ks: 82.5, h: 82.7, ov: 89.8 },
  { c: "Malaysia",     n: 10,  f: 0,   fr: 0.0,  fq: 93.6, pb: 92.8, ks: 77.9, h: 80.6, ov: 87.3 },
];

const SECTIONS = [
  { key: "fq", label: "Food & Quality",    weight: 20, coef: 28.88 },
  { key: "pb", label: "People & Business", weight: 27, coef: 36.69 },
  { key: "ks", label: "Kitchen & Safety",  weight: 21, coef: 26.16 },
  { key: "h",  label: "Hospitality",       weight: 32, coef: 34.10 },
];

const PIE_COLORS = [GREEN, GREEN_MID, "#78c050", "#a0d080"];

/* ── helpers ────────────────────────────────────────────────────────────── */
function predictProb(fq, pb, ks, h) {
  const lo =
    GLOBAL.intercept +
    GLOBAL.coefs.fq * (fq / 100) +
    GLOBAL.coefs.pb * (pb / 100) +
    GLOBAL.coefs.ks * (ks / 100) +
    GLOBAL.coefs.h  * (h  / 100);
  return 1 / (1 + Math.exp(-lo));
}

function scoreColor(v) {
  return v < 75 ? RED : v < 85 ? AMBER : GREEN;
}

function frColor(fr) {
  return fr > 10 ? RED : fr > 3 ? AMBER : GREEN;
}

/* ── sub-components ─────────────────────────────────────────────────────── */
function StatCard({ label, value }) {
  return (
    <div style={{
      background: "#f5f5f5", borderRadius: 10, padding: "12px 16px",
    }}>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#111" }}>{value}</div>
    </div>
  );
}

function Pill({ fr }) {
  const bg = fr === 0 ? GREEN_LIGHT : fr < 5 ? GREEN_LIGHT : fr < 15 ? "#fff8e0" : "#fde8e8";
  const color = fr === 0 ? "#2e6b12" : fr < 5 ? "#2e6b12" : fr < 15 ? "#7a5c00" : "#911";
  return (
    <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
      {fr.toFixed(1)}%
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "0.5px solid #ddd", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#333" }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  );
};

/* ── tabs ────────────────────────────────────────────────────────────────── */
function PredictorTab() {
  const [scores, setScores] = useState({ fq: 85, pb: 82, ks: 80, h: 78 });

  const prob = useMemo(() => predictProb(scores.fq, scores.pb, scores.ks, scores.h), [scores]);
  const pct = Math.round(prob * 100);
  const pass = prob >= 0.75;
  const wtd = Math.round(scores.fq * 0.20 + scores.pb * 0.27 + scores.ks * 0.21 + scores.h * 0.32);

  const impacts = useMemo(() => {
    return SECTIONS.map((s) => {
      const bumped = { ...scores, [s.key]: Math.min(scores[s.key] + 5, 100) };
      const gain = predictProb(bumped.fq, bumped.pb, bumped.ks, bumped.h) - prob;
      return { ...s, gain, val: scores[s.key] };
    }).sort((a, b) => b.gain - a.gain);
  }, [scores, prob]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
      {/* Left */}
      <div>
        <div style={card}>
          <div style={sectionTitle}>Score inputs — global model</div>
          {SECTIONS.map((s) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 150, flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: "#222" }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#999" }}>BSE weight {s.weight}%</div>
              </div>
              <input
                type="range" min={50} max={100} step={1} value={scores[s.key]}
                onChange={(e) => setScores((prev) => ({ ...prev, [s.key]: +e.target.value }))}
                style={{ flex: 1, accentColor: GREEN }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, minWidth: 40, textAlign: "right", color: scoreColor(scores[s.key]) }}>
                {scores[s.key]}%
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={sectionTitle}>Section impact — improve first</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {impacts.map((im, i) => (
              <div key={im.key} style={{
                background: i === 0 ? "#fff5f5" : "#f8f8f8",
                borderRadius: 8, padding: 10,
                borderLeft: `3px solid ${i === 0 ? RED : GREEN}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{im.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: "2px 0" }}>{im.val}%</div>
                <div style={{ fontSize: 11, color: "#888" }}>
                  +5pt → +{(im.gain * 100).toFixed(1)}pp · coef {im.coef}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div>
        <div style={{
          background: GREEN, borderRadius: 12, padding: "20px 24px",
          textAlign: "center", marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Pass probability</div>
          <div style={{ fontSize: 60, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.85)", marginTop: 6 }}>
            {pass ? "Likely to pass BSE" : "At risk of failing BSE"}
          </div>
          <span style={{
            display: "inline-block", marginTop: 10, padding: "4px 18px", borderRadius: 20,
            fontSize: 12, fontWeight: 700,
            background: pass ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.25)",
            color: "#fff",
          }}>{pass ? "PASS" : "FAIL"}</span>
        </div>

        <div style={card}>
          <div style={sectionTitle}>Weighted score estimate</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor(wtd) }}>{wtd}%</div>
            <div style={{ fontSize: 13, color: "#888" }}>overall</div>
          </div>
          {SECTIONS.map((s) => {
            const v = scores[s.key];
            const col = scoreColor(v);
            return (
              <div key={s.key} style={{ marginBottom: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 3 }}>
                  <span>{s.key.toUpperCase()}</span>
                  <span style={{ color: col, fontWeight: 600 }}>{v}%</span>
                </div>
                <div style={{ height: 5, background: "#eee", borderRadius: 3 }}>
                  <div style={{ width: `${v}%`, height: "100%", background: col, borderRadius: 3, transition: "width .2s" }} />
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: "0.5px solid #eee", marginTop: 12, paddingTop: 10, fontSize: 12, color: "#888", lineHeight: 1.7 }}>
            Threshold: <b style={{ color: "#111" }}>75%</b> = Pass &nbsp;·&nbsp; <b style={{ color: GREEN }}>85%</b> = Meets expectations
          </div>
        </div>
      </div>
    </div>
  );
}

function CountryTab() {
  const sorted = [...COUNTRY_DATA].sort((a, b) => b.fr - a.fr);

  const radarData = SECTIONS.map((s) => ({
    section: s.label.split(" ")[0],
    ...Object.fromEntries(COUNTRY_DATA.map((d) => [d.c, d[s.key]])),
  }));

  const radarColors = [GREEN, GREEN_MID, "#78c050", "#a0d080", "#1c5c08", "#c5e8a0", "#3a8022"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div style={sectionTitle}>Failure rate by country</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sorted} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="c" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => v + "%"} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fr" name="Fail rate %" radius={[4, 4, 0, 0]}>
                {sorted.map((d, i) => <Cell key={i} fill={frColor(d.fr)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Section scores by country</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#eee" />
              <PolarAngleAxis dataKey="section" tick={{ fontSize: 11 }} />
              {COUNTRY_DATA.map((d, i) => (
                <Radar key={d.c} name={d.c} dataKey={d.c} stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.08} dot={false} />
              ))}
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card}>
        <div style={sectionTitle}>Country summary</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Country", "Audits", "Fails", "Fail rate", "Avg FQ", "Avg PB", "Avg KS", "Avg H", "Overall"].map((h) => (
                <th key={h} style={{ textAlign: h === "Country" ? "left" : "right", padding: "6px 8px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COUNTRY_DATA.map((d) => (
              <tr key={d.c} style={{ borderBottom: "0.5px solid #f0f0f0" }}>
                <td style={{ padding: "7px 8px", color: "#222" }}>{d.c}</td>
                {[d.n, d.f].map((v, i) => <td key={i} style={{ padding: "7px 8px", textAlign: "right", color: "#222" }}>{v}</td>)}
                <td style={{ padding: "7px 8px", textAlign: "right" }}><Pill fr={d.fr} /></td>
                {[d.fq, d.pb, d.ks, d.h, d.ov].map((v, i) => (
                  <td key={i} style={{ padding: "7px 8px", textAlign: "right", color: scoreColor(v), fontWeight: 500 }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionsTab() {
  const barData = SECTIONS.map((s) => ({
    name: s.label.replace(" & ", " &\n"),
    "BSE weight %": s.weight,
    "Coefficient ÷10": +(s.coef / 10).toFixed(2),
  }));

  const pieData = SECTIONS.map((s) => ({ name: s.label, value: s.weight }));

  const insights = [
    { title: "People & Business leads prediction", body: "Highest model coefficient (36.69) — strongest predictor of pass/fail across all countries." },
    { title: "Hospitality: high weight, high impact", body: "Carries the largest BSE weight (32%) and second-highest coefficient (34.10) — doubly important." },
    { title: "Kitchen & Safety underweighted", body: "BSE assigns 21% weight but has the lowest coefficient (26.16) — least predictive section." },
    { title: "Japan's danger zones", body: "KS avg 73.2% and H avg 72.1% — both below the 75% fail threshold, dragging overall performance." },
    { title: "All sections significant", body: "Every section is statistically significant at p < 0.001 — none can be safely dropped from the model." },
    { title: "Model fit: McFadden R² 0.854", body: "Excellent pseudo-R² for logistic regression. AIC 137.42, 98% accuracy across 1,986 audits." },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div style={sectionTitle}>BSE weights vs model coefficients</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="BSE weight %" fill={`${GREEN}44`} stroke={GREEN} strokeWidth={1} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Coefficient ÷10" fill={GREEN} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#888" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: `${GREEN}44`, border: `1px solid ${GREEN}`, display: "inline-block" }} />
              BSE weight %
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: GREEN, display: "inline-block" }} />
              Coefficient ÷10
            </span>
          </div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>BSE design weights</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => v + "%"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {insights.map((ins) => (
          <div key={ins.title} style={{
            background: "#fff", border: "0.5px solid rgba(0,0,0,.1)", borderRadius: 8,
            padding: "12px 14px", borderTop: `3px solid ${GREEN}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 4 }}>{ins.title}</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{ins.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelTab() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
      <div>
        <div style={card}>
          <div style={sectionTitle}>Global model equation</div>
          <div style={{
            background: "#f5f5f5", borderRadius: 8, padding: "12px 14px",
            fontFamily: "monospace", fontSize: 12, color: "#222", lineHeight: 1.8,
            borderLeft: `3px solid ${GREEN}`, marginBottom: 12,
          }}>
            logit(p) = −93.5572<br />
            &nbsp;&nbsp;+ 28.8761 × FQ<br />
            &nbsp;&nbsp;+ 36.6887 × PB<br />
            &nbsp;&nbsp;+ 26.1582 × KS<br />
            &nbsp;&nbsp;+ 34.0957 × H
          </div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
            Scores entered as decimals (e.g. 85% → 0.85).<br />
            p = 1 / (1 + e<sup>−logit</sup>) &nbsp;·&nbsp;
            <span style={{ color: GREEN, fontWeight: 600 }}>p ≥ 0.75 → Pass</span>
          </div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Model fit statistics</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Accuracy", value: "98.0%" },
              { label: "McFadden R²", value: "0.8541" },
              { label: "AIC", value: "137.42" },
              { label: "N (audits)", value: "1,986" },
            ].map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </div>
      <div style={card}>
        <div style={sectionTitle}>Coefficient table</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Variable", "Coef.", "Std. err", "z", "p-value", "Odds ratio"].map((h) => (
                <th key={h} style={{ textAlign: h === "Variable" ? "left" : "right", padding: "6px 8px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { v: "Intercept",          c: "−93.56", se: "7.82",  z: "−11.96", p: "<.001", or: "~0",      bold: false },
              { v: "Food & Quality",     c: "28.88",  se: "3.12",  z: "9.24",   p: "<.001", or: "3.5×10¹²", bold: false },
              { v: "People & Business",  c: "36.69",  se: "3.56",  z: "10.30",  p: "<.001", or: "8.6×10¹⁵", bold: true  },
              { v: "Kitchen & Safety",   c: "26.16",  se: "2.89",  z: "9.04",   p: "<.001", or: "2.3×10¹¹", bold: false },
              { v: "Hospitality",        c: "34.10",  se: "3.42",  z: "9.98",   p: "<.001", or: "6.4×10¹⁴", bold: false },
            ].map((row) => (
              <tr key={row.v} style={{ borderBottom: "0.5px solid #f0f0f0" }}>
                <td style={{ padding: "8px 8px", color: "#222" }}>{row.v}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: row.v === "Intercept" ? "#888" : GREEN, fontWeight: row.bold ? 700 : 500 }}>{row.c}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: "#555" }}>{row.se}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: "#555" }}>{row.z}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: "#555" }}>{row.p}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: "#888", fontSize: 12 }}>{row.or}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: "0.5px solid #eee", marginTop: 12, paddingTop: 10, fontSize: 12, color: "#888", lineHeight: 1.6 }}>
          Verified consistent across SPSS and Python/sklearn. All predictors significant at p &lt; 0.001.
        </div>
      </div>
    </div>
  );
}

/* ── shared styles ───────────────────────────────────────────────────────── */
const card = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,.12)",
  borderRadius: 12,
  padding: "16px 18px",
  marginBottom: 14,
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111",
  marginBottom: 12,
};

/* ── main app ────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "predictor", label: "Risk predictor",   Component: PredictorTab },
  { id: "country",   label: "Country view",     Component: CountryTab   },
  { id: "sections",  label: "Section analysis", Component: SectionsTab  },
  { id: "model",     label: "Model details",    Component: ModelTab     },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("predictor");
  const { Component } = TABS.find((t) => t.id === activeTab);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 960, margin: "0 auto", padding: "20px 16px 40px" }}>
      {/* Header */}
      <div style={{
        background: GREEN, borderRadius: 12, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10, marginBottom: 16,
      }}>
        <div>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>Shake Shack — BSE Analytics Dashboard</div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 2 }}>ISOM 4880 · Brand Standard Evaluation · 2023–2025</div>
        </div>
        <div style={{ display: "flex", gap: 1, background: GREEN_MID, borderRadius: 8, overflow: "hidden" }}>
          {[
            { label: "Audits",    value: "1,986" },
            { label: "Countries", value: "7"     },
            { label: "Fail rate", value: "8.5%"  },
            { label: "Model acc", value: "98%"   },
          ].map((s) => (
            <div key={s.label} style={{ background: GREEN, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, background: "#f0f0f0", borderRadius: 10,
        padding: 4, marginBottom: 16,
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: "7px 0", textAlign: "center", fontSize: 13,
              fontWeight: 500, cursor: "pointer", borderRadius: 8, border: "none",
              background: activeTab === t.id ? GREEN : "transparent",
              color: activeTab === t.id ? "#fff" : "#555",
              transition: "background .15s, color .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <Component />
    </div>
  );
}
