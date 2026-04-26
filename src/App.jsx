import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  PieChart,
  Pie,
} from 'recharts'

const G = '#54A432'
const G_DARK = '#3a8022'
const G_LIGHT = '#e6f5de'
const AMBER = '#f0a000'
const RED = '#d44'
const BG = '#f4f4f2'
const TEXT = '#111111'
const TEXT_MUTED = '#666666'
const BORDER = '#e8e8e8'

const PASS_THRESHOLD = 0.75
const FAIL_SCORE_THRESHOLD = 75
const MEETS_SCORE_THRESHOLD = 85

const GLOBAL_MODEL = {
  intercept: -93.5572,
  coefs: { fq: 28.8761, pb: 36.6887, ks: 26.1582, h: 34.0957 },
}

const SECTIONS = [
  { key: 'fq', label: 'Food & Quality', short: 'FQ', weight: 20, coef: 28.88 },
  { key: 'pb', label: 'People & Business', short: 'PB', weight: 27, coef: 36.69 },
  { key: 'ks', label: 'Kitchen & Safety', short: 'KS', weight: 21, coef: 26.16 },
  { key: 'h', label: 'Hospitality', short: 'H', weight: 32, coef: 34.1 },
]

const COUNTRIES = [
  { c: 'South Korea', n: 838, f: 14, fr: 1.7, fq: 90.8, pb: 89.6, ks: 87.7, h: 87.3, ov: 89.4 },
  { c: 'Singapore', n: 350, f: 22, fr: 6.3, fq: 90.0, pb: 87.3, ks: 77.6, h: 80.5, ov: 85.1 },
  { c: 'Japan', n: 335, f: 118, fr: 35.2, fq: 84.6, pb: 77.2, ks: 73.2, h: 72.1, ov: 76.9 },
  { c: 'Hong Kong', n: 256, f: 2, fr: 0.8, fq: 91.0, pb: 92.6, ks: 90.6, h: 83.7, ov: 91.6 },
  { c: 'Philippines', n: 124, f: 11, fr: 8.9, fq: 93.3, pb: 81.4, ks: 86.0, h: 74.4, ov: 84.4 },
  { c: 'Thailand', n: 73, f: 2, fr: 2.7, fq: 95.8, pb: 93.2, ks: 82.5, h: 82.7, ov: 89.8 },
  { c: 'Malaysia', n: 10, f: 0, fr: 0.0, fq: 93.6, pb: 92.8, ks: 77.9, h: 80.6, ov: 87.3 },
]

// Paste your Google Sheets "Publish to web → CSV" URL here
const SHEET_CSV_URL = ''

const COUNTRY_COLORS = [G, G_DARK, '#78c050', '#a0d080', '#1c5c08', '#c5e8a0', '#2a7a12']
const PIE_COLORS = [G, G_DARK, '#78c050', '#a0d080']

const PRESETS = [
  { label: 'Japan', fq: 85, pb: 77, ks: 73, h: 72 },
  { label: 'Hong Kong', fq: 91, pb: 93, ks: 91, h: 84 },
  { label: 'South Korea', fq: 91, pb: 90, ks: 88, h: 87 },
  { label: 'Singapore', fq: 90, pb: 87, ks: 78, h: 81 },
  { label: 'Philippines', fq: 93, pb: 81, ks: 86, h: 74 },
  { label: 'Thailand', fq: 96, pb: 93, ks: 83, h: 83 },
]

const COEF_ROWS = [
  { v: 'Intercept', c: '−93.56', se: '7.82', z: '−11.96', p: '<.001', or: '~0', bold: false },
  { v: 'Food & Quality', c: '28.88', se: '3.12', z: '9.24', p: '<.001', or: '3.5×10¹²', bold: false },
  { v: 'People & Business', c: '36.69', se: '3.56', z: '10.30', p: '<.001', or: '8.6×10¹⁵', bold: true },
  { v: 'Kitchen & Safety', c: '26.16', se: '2.89', z: '9.04', p: '<.001', or: '2.3×10¹¹', bold: false },
  { v: 'Hospitality', c: '34.10', se: '3.42', z: '9.98', p: '<.001', or: '6.4×10¹⁴', bold: false },
]

const INSIGHTS = [
  { title: 'People & Business leads prediction', body: 'Highest coefficient (36.69) — strongest predictor of pass/fail across all countries.' },
  { title: 'Hospitality: high weight, high impact', body: 'Largest BSE weight (32%) and second-highest coefficient (34.10) — doubly critical.' },
  { title: 'Kitchen & Safety underweighted', body: 'BSE assigns 21% weight but lowest coefficient (26.16) — least predictive section.' },
  { title: "Japan's danger zones", body: 'KS avg 73.2% and H avg 72.1% — both below the 75% fail threshold.' },
  { title: 'All sections significant', body: 'Every section: p < 0.001. None can be dropped without hurting accuracy.' },
  { title: 'Model fit: McFadden R² 0.854', body: 'Well above the 0.4 threshold for a strong model. AIC 137.42, 98% accuracy.' },
]

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < breakpoint
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])

  return isMobile
}

function calcProb(fq, pb, ks, h) {
  const lo =
    GLOBAL_MODEL.intercept +
    GLOBAL_MODEL.coefs.fq * (fq / 100) +
    GLOBAL_MODEL.coefs.pb * (pb / 100) +
    GLOBAL_MODEL.coefs.ks * (ks / 100) +
    GLOBAL_MODEL.coefs.h * (h / 100)

  return { lo, p: 1 / (1 + Math.exp(-lo)) }
}

const scoreColor = (v) => (v < FAIL_SCORE_THRESHOLD ? RED : v < MEETS_SCORE_THRESHOLD ? AMBER : G)
const frColor = (v) => (v > 10 ? RED : v > 3 ? AMBER : G)

function Card({ children, style }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '16px 18px',
        color: TEXT,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: TEXT,
        marginBottom: 12,
        textAlign: 'left',
      }}
    >
      {children}
    </div>
  )
}

function ChartBox({ height = 240, children }) {
  return <div style={{ width: '100%', height, minHeight: height }}>{children}</div>
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        color: TEXT,
      }}
    >
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: TEXT }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || TEXT }}>
          {p.name}: <b>{typeof p.value === 'number' ? Number(p.value.toFixed(1)) : p.value}</b>
        </div>
      ))}
    </div>
  )
}

function ScorePill({ fr }) {
  const bg = fr > 10 ? '#fde8e8' : fr > 3 ? '#fff8e0' : G_LIGHT
  const color = fr > 10 ? '#911' : fr > 3 ? '#7a5c00' : '#2e6b12'

  return (
    <span
      style={{
        background: bg,
        color,
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {fr.toFixed(1)}%
    </span>
  )
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: '#f7f7f7', borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}>
      <div
        style={{
          fontSize: 10,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{value}</div>
    </div>
  )
}

function ScoreBar({ label, value, weight }) {
  const col = scoreColor(value)

  return (
    <div style={{ marginBottom: 9 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: 12,
          marginBottom: 3,
          gap: 10,
        }}
      >
        <span style={{ color: '#555' }}>
          {label} {weight && <span style={{ color: '#bbb', fontSize: 10 }}>({weight}% weight)</span>}
        </span>
        <span style={{ fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: col,
            borderRadius: 3,
            transition: 'width .25s',
          }}
        />
      </div>
    </div>
  )
}

function MetricBadge({ label, value }) {
  return (
    <div style={{ background: G, padding: '6px 16px', textAlign: 'center' }}>
      <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 10 }}>{label}</div>
    </div>
  )
}

function PredictorTab() {
  const [scores, setScores] = useState({ fq: 85, pb: 82, ks: 80, h: 78 })
  const mobile = useIsMobile()
  const set = (k, v) => setScores((prev) => ({ ...prev, [k]: +v }))

  const { lo, p } = useMemo(() => calcProb(scores.fq, scores.pb, scores.ks, scores.h), [scores])

  const pct = Math.min(99, Math.round(p * 100))
  const pass = p >= PASS_THRESHOLD
  const wtd = Math.round(SECTIONS.reduce((acc, s) => acc + scores[s.key] * (s.weight / 100), 0))

  const impacts = useMemo(
    () =>
      SECTIONS.map((s) => {
        const bumped5 = { ...scores, [s.key]: Math.min(scores[s.key] + 5, 100) }
        const gain5 = calcProb(bumped5.fq, bumped5.pb, bumped5.ks, bumped5.h).p - p
        const bumpedMax = { ...scores, [s.key]: 100 }
        const gainMax = calcProb(bumpedMax.fq, bumpedMax.pb, bumpedMax.ks, bumpedMax.h).p - p
        return { ...s, gain: gainMax, gain5, val: scores[s.key] }
      }).sort((a, b) => b.gain - a.gain),
    [scores, p]
  )

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <CardTitle>Section score inputs</CardTitle>
          {SECTIONS.map((s) => (
            <div key={s.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                <span style={{ fontSize: 13, color: '#333' }}>
                  {s.label} <span style={{ fontSize: 10, color: '#aaa' }}>({s.weight}% BSE weight)</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(scores[s.key]) }}>
                  {scores[s.key]}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={scores[s.key]}
                onChange={(e) => set(s.key, e.target.value)}
                style={{ width: '100%', accentColor: G }}
              />
            </div>
          ))}

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 4 }}>
            <div
              style={{
                fontSize: 11,
                color: '#999',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'left',
              }}
            >
              Load country average
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr',
                gap: 6,
              }}
            >
              {PRESETS.map((pr) => (
                <button
                  key={pr.label}
                  onClick={() => setScores({ fq: pr.fq, pb: pr.pb, ks: pr.ks, h: pr.h })}
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    background: '#fafafa',
                    color: '#333',
                  }}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Which section to improve first? (max potential impact)</CardTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
              gap: 8,
            }}
          >
            {impacts.map((im, i) => (
              <div
                key={im.key}
                style={{
                  background: i === 0 ? '#fff5f5' : '#f8faf7',
                  border: `1px solid ${i === 0 ? '#f5c5c5' : '#d8ead2'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#888',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  #{i + 1}
                  {i === 0 ? ' — focus here' : ''}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{im.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor(im.val), margin: '2px 0' }}>
                  {im.val}%
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>+5pt → +{(im.gain5 * 100).toFixed(1)}pp</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            background: pass ? G : RED,
            borderRadius: 12,
            padding: '24px 20px',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <div
            style={{
              fontSize: 11,
              opacity: 0.75,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 8,
            }}
          >
            Pass probability
          </div>
          <div style={{ fontSize: mobile ? 56 : 72, fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
            {pct}%
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 8 }}>
            {pass ? 'Likely to pass BSE audit' : 'At risk of failing BSE audit'}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '5px 22px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(255,255,255,.22)',
            }}
          >
            {pass ? 'PASS' : 'FAIL'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 10 }}>
            Decision rule: p ≥ 0.75 → predicted pass
          </div>
        </div>

        <Card>
          <CardTitle>Weighted overall score</CardTitle>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: scoreColor(wtd), letterSpacing: '-1px' }}>
              {wtd}%
            </span>
            <span style={{ fontSize: 13, color: '#888' }}>overall</span>
          </div>
          {SECTIONS.map((s) => (
            <ScoreBar key={s.key} label={s.label} value={scores[s.key]} weight={s.weight} />
          ))}
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: '#f7f7f7',
              borderRadius: 7,
              fontSize: 11,
              color: '#888',
              lineHeight: 1.7,
              textAlign: 'left',
            }}
          >
            <b style={{ color: '#555' }}>75%</b> = fail threshold
          </div>
        </Card>

        <Card>
          <CardTitle>Log-odds breakdown</CardTitle>
          {SECTIONS.map((s) => {
            const contrib = GLOBAL_MODEL.coefs[s.key] * (scores[s.key] / 100)
            const maxC = GLOBAL_MODEL.coefs[s.key]
            return (
              <div key={s.key} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#777',
                    marginBottom: 3,
                  }}
                >
                  <span>{s.short}</span>
                  <span style={{ fontFamily: 'monospace', color: G, fontWeight: 600 }}>{contrib.toFixed(2)}</span>
                </div>
                <div style={{ height: 4, background: '#eee', borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${(contrib / maxC) * 100}%`,
                      height: '100%',
                      background: G,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            )
          })}
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#999',
              marginTop: 10,
              lineHeight: 1.8,
              textAlign: 'left',
            }}
          >
            intercept: {GLOBAL_MODEL.intercept}
            <br />
            logit sum: <b style={{ color: '#555' }}>{lo.toFixed(4)}</b>
            <br />
            probability: <b style={{ color: G }}>{pct}%</b>
          </div>
        </Card>
      </div>
    </div>
  )
}

function parseCountryCsv(text) {
  const lines = text.trim().replace(/\r/g, '').split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const pick = (vals, ...keys) => {
    for (const k of keys) {
      const i = headers.indexOf(k)
      if (i !== -1) return vals[i]?.trim() ?? ''
    }
    return ''
  }
  return lines.slice(1).map((line) => {
    const vals = line.split(',')
    return {
      c: pick(vals, 'country'),
      n: Number(pick(vals, 'audits', 'n')) || 0,
      f: Number(pick(vals, 'failures', 'f')) || 0,
      fr: Number(pick(vals, 'failure_rate', 'fail_rate', 'fr')) || 0,
      fq: Number(pick(vals, 'fq')) || 0,
      pb: Number(pick(vals, 'pb')) || 0,
      ks: Number(pick(vals, 'ks')) || 0,
      h: Number(pick(vals, 'h')) || 0,
      ov: Number(pick(vals, 'overall', 'ov')) || 0,
    }
  }).filter((d) => d.c)
}

function CountryTab() {
  const [hover, setHover] = useState(null)
  const [countries, setCountries] = useState(COUNTRIES)
  const [sheetError, setSheetError] = useState(null)
  const mobile = useIsMobile()

  useEffect(() => {
    if (!SHEET_CSV_URL) return
    async function load() {
      try {
        const res = await fetch(SHEET_CSV_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        const parsed = parseCountryCsv(text)
        if (parsed.length > 0) {
          setCountries(parsed)
          setSheetError(null)
        }
      } catch {
        setSheetError('Could not load Google Sheet — showing last known data.')
      }
    }
    load()
    const interval = setInterval(load, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const sorted = [...countries].sort((a, b) => b.fr - a.fr)

  const radarData = SECTIONS.map((s) => {
    const row = { section: s.short }
    countries.forEach((d) => {
      row[d.c] = d[s.key]
    })
    return row
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sheetError && (
        <div style={{ fontSize: 12, color: AMBER, background: '#fffbf0', border: `1px solid ${AMBER}`, borderRadius: 6, padding: '6px 12px' }}>
          {sheetError}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>Failure rate by country</CardTitle>
          <ChartBox height={230}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="c" tick={{ fontSize: 10, fill: '#666' }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#666' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fr" name="Fail rate %" radius={[4, 4, 0, 0]}>
                  {sorted.map((d, i) => (
                    <Cell key={i} fill={frColor(d.fr)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card>
          <CardTitle>Section scores — radar</CardTitle>
          <ChartBox height={230}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                <PolarGrid stroke="#eee" />
                <PolarAngleAxis dataKey="section" tick={{ fontSize: 11, fill: '#666' }} />
                <PolarRadiusAxis angle={90} domain={[65, 100]} tick={{ fontSize: 8, fill: '#aaa' }} />
                {countries.map((d, i) => (
                  <Radar
                    key={d.c}
                    name={d.c}
                    dataKey={d.c}
                    stroke={COUNTRY_COLORS[i % COUNTRY_COLORS.length]}
                    fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]}
                    fillOpacity={0.07}
                    dot={false}
                  />
                ))}
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>
      </div>

      <Card>
        <CardTitle>Average section scores by country</CardTitle>
        <ChartBox height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={radarData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="section" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis domain={[60, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#666' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              {countries.map((d, i) => (
                <Bar key={d.c} dataKey={d.c} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </Card>

      <Card>
        <CardTitle>Country summary</CardTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: TEXT, minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['Country', 'Audits', 'Fails', 'Fail rate', 'FQ avg', 'PB avg', 'KS avg', 'H avg', 'Overall'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 10px',
                      fontSize: 10,
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      textAlign: h === 'Country' ? 'left' : 'right',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countries.map((d) => (
                <tr
                  key={d.c}
                  onMouseEnter={() => setHover(d.c)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    borderBottom: '1px solid #f5f5f5',
                    background: hover === d.c ? '#f9fbf8' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px 10px', fontWeight: 500, color: TEXT, textAlign: 'left' }}>{d.c}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#555' }}>{d.n}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#555' }}>{d.f}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <ScorePill fr={d.fr} />
                  </td>
                  {[d.fq, d.pb, d.ks, d.h, d.ov].map((v, i) => (
                    <td
                      key={i}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        fontWeight: 500,
                        color: scoreColor(v),
                      }}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 8, textAlign: 'left' }}>
          Color: <span style={{ color: G }}>green ≥85%</span> · <span style={{ color: AMBER }}>amber 75–85%</span> ·{' '}
          <span style={{ color: RED }}>red &lt;75%</span>
        </div>
      </Card>
    </div>
  )
}

function SectionsTab() {
  const mobile = useIsMobile()

  const weightVsCoef = SECTIONS.map((s) => ({
    name: s.short,
    'BSE weight %': s.weight,
    'Coefficient ÷10': +(s.coef / 10).toFixed(2),
  }))

  const pieData = SECTIONS.map((s) => ({ name: s.label, value: s.weight }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>BSE weights vs model predictive power</CardTitle>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 11, color: '#888', flexWrap: 'wrap' }}>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  background: `${G}55`,
                  border: `1px solid ${G}`,
                  borderRadius: 2,
                  marginRight: 4,
                  verticalAlign: 'middle',
                }}
              />
              BSE weight %
            </span>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  background: G,
                  borderRadius: 2,
                  marginRight: 4,
                  verticalAlign: 'middle',
                }}
              />
              Coefficient ÷10
            </span>
          </div>
          <ChartBox height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weightVsCoef} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} />
                <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="BSE weight %" fill={`${G}55`} stroke={G} strokeWidth={1} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Coefficient ÷10" fill={G} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card>
          <CardTitle>BSE section design weights</CardTitle>
          <ChartBox height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ cx, cy, midAngle, outerRadius, value }) => {
                    const R = Math.PI / 180
                    const r = outerRadius + 22
                    const x = cx + r * Math.cos(-midAngle * R)
                    const y = cy + r * Math.sin(-midAngle * R)
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ fontSize: 11, fill: '#555', fontWeight: 600 }}
                      >
                        {value}%
                      </text>
                    )
                  }}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>
      </div>

      <Card>
        <CardTitle>BSE outcome thresholds</CardTitle>
        <div style={{ position: 'relative', height: 40, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: '75%', background: '#fde8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#911' }}>Unacceptable (&lt; 75%)</span>
          </div>
          <div style={{ width: '10%', background: '#fff8e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7a5c00' }}>NI</span>
          </div>
          <div style={{ flex: 1, background: G_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#2e6b12' }}>Meets (≥ 85%)</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 10, color: '#aaa', marginTop: 4, paddingLeft: '74%' }}>
          <span style={{ marginRight: '9%' }}>75%</span>
          <span>85%</span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        {INSIGHTS.map((ins) => (
          <div
            key={ins.title}
            style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: '12px 14px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 5 }}>{ins.title}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6 }}>{ins.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModelTab() {
  const [inputs, setInputs] = useState({ fq: 84.6, pb: 77.2, ks: 73.2, h: 72.1 })
  const mobile = useIsMobile()
  const setI = (k, v) => setInputs((prev) => ({ ...prev, [k]: +v }))

  const { lo, p } = useMemo(() => calcProb(inputs.fq, inputs.pb, inputs.ks, inputs.h), [inputs])

  const expLo = Math.exp(lo)
  const pct = Math.min(99.9, p * 100).toFixed(1)
  const pass = p >= PASS_THRESHOLD
  const coefChartData = SECTIONS.map((s) => ({ name: s.short, Coefficient: s.coef }))

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <CardTitle>Global model equation</CardTitle>
          <div
            style={{
              background: '#f6f6f6',
              borderRadius: 8,
              padding: '12px 16px',
              fontFamily: "'Courier New', monospace",
              fontSize: 13,
              color: TEXT,
              lineHeight: 2,
              marginBottom: 12,
              textAlign: 'left',
            }}
          >
            logit(p) = −93.5572
            <br />
            &nbsp;&nbsp;+ 28.8761 × FQ
            <br />
            &nbsp;&nbsp;+ 36.6887 × PB
            <br />
            &nbsp;&nbsp;+ 26.1582 × KS
            <br />
            &nbsp;&nbsp;+ 34.0957 × H
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.8, textAlign: 'left' }}>
            Scores entered as decimals — 85% → 0.85.
            <br />
            p = 1 / (1 + e<sup>−logit</sup>)
            <br />
            <span style={{ color: G, fontWeight: 600 }}>p ≥ 0.75 → Predicted PASS</span>
          </div>
        </Card>

        <Card>
          <CardTitle>Interactive 3-step probability calculator</CardTitle>
          {[
            { k: 'fq', label: 'FQ — Food & Quality' },
            { k: 'pb', label: 'PB — People & Business' },
            { k: 'ks', label: 'KS — Kitchen & Safety' },
            { k: 'h', label: 'H — Hospitality' },
          ].map((row) => (
            <div key={row.k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: '#555',
                  width: mobile ? 120 : 170,
                  flexShrink: 0,
                  textAlign: 'left',
                }}
              >
                {row.label}
              </span>
              <input
                type="range"
                min={50}
                max={100}
                step={0.5}
                value={inputs[row.k]}
                onChange={(e) => setI(row.k, e.target.value)}
                style={{ flex: 1, accentColor: G }}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  minWidth: 44,
                  textAlign: 'right',
                  color: scoreColor(inputs[row.k]),
                }}
              >
                {Number(inputs[row.k]).toFixed(1)}%
              </span>
            </div>
          ))}

          <div
            style={{
              background: '#f6f6f6',
              borderRadius: 8,
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: 12,
              marginTop: 8,
              lineHeight: 2,
              textAlign: 'left',
            }}
          >
            <div>
              <span style={{ color: '#aaa' }}>① logit =</span> <b style={{ color: TEXT }}>{lo.toFixed(4)}</b>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>② e^logit =</span> <b style={{ color: TEXT }}>{expLo.toFixed(4)}</b>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>③ p =</span> <b style={{ color: G, fontSize: 14 }}>{pct}%</b>{' '}
              <span
                style={{
                  marginLeft: 8,
                  padding: '1px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  background: pass ? G_LIGHT : '#fde8e8',
                  color: pass ? '#2e6b12' : '#911',
                }}
              >
                {pass ? 'PASS' : 'FAIL'}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Model fit statistics</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <StatBox label="Accuracy" value="98.0%" />
            <StatBox label="McFadden R²" value="0.8541" />
            <StatBox label="AIC" value="137.42" />
            <StatBox label="N (audits)" value="1,986" />
            <StatBox label="Failures" value="169" />
            <StatBox label="Misclassif." value="~39" />
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <CardTitle>Coefficient table</CardTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: TEXT, minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  {['Variable', 'Coef.', 'Std. err', 'z', 'p-value', 'Odds ratio'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '6px 8px',
                        fontSize: 10,
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                        textAlign: h === 'Variable' ? 'left' : 'right',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COEF_ROWS.map((row) => (
                  <tr key={row.v} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px 8px', color: TEXT, textAlign: 'left' }}>{row.v}</td>
                    <td
                      style={{
                        padding: '8px 8px',
                        textAlign: 'right',
                        color: row.v === 'Intercept' ? '#999' : G,
                        fontWeight: row.bold ? 700 : 500,
                      }}
                    >
                      {row.c}
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', color: '#666' }}>{row.se}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', color: '#666' }}>{row.z}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', color: '#666' }}>{row.p}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', color: '#aaa', fontSize: 11 }}>{row.or}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 8, lineHeight: 1.6, textAlign: 'left' }}>
            Results verified in SPSS and Python/sklearn. All predictors p &lt; 0.001.
          </div>
        </Card>

        <Card>
          <CardTitle>Coefficient magnitude by section</CardTitle>
          <ChartBox height={160}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coefChartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#666' }} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Coefficient" radius={[0, 4, 4, 0]}>
                  {SECTIONS.map((s, i) => (
                    <Cell key={i} fill={i === 1 ? G_DARK : G} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div style={{ fontSize: 11, color: '#999', marginTop: 6, textAlign: 'left' }}>
            People & Business (36.69) is the strongest predictor — shown in darker green.
          </div>
        </Card>

        <Card>
          <CardTitle>Classification summary</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: G_LIGHT, borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2e6b12' }}>1,947</div>
              <div style={{ fontSize: 11, color: '#555' }}>Correct</div>
            </div>
            <div style={{ background: '#fde8e8', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#911' }}>~39</div>
              <div style={{ fontSize: 11, color: '#555' }}>Misclassified</div>
            </div>
            <div style={{ background: '#f0f8eb', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: G }}>98%</div>
              <div style={{ fontSize: 11, color: '#555' }}>Accuracy</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7, textAlign: 'left' }}>
            Decision rule: p ≥ 0.75 → predicted pass. Model back-tested on all 1,986 audits.
          </div>
        </Card>
      </div>
    </div>
  )
}

const TABS = [
  { id: 'predictor', label: 'Risk predictor', Component: PredictorTab },
  { id: 'country', label: 'Country view', Component: CountryTab },
  { id: 'sections', label: 'Section analysis', Component: SectionsTab },
  { id: 'model', label: 'Model details', Component: ModelTab },
]

export default function App() {
  const [active, setActive] = useState('predictor')
  const ActiveTab = TABS.find((t) => t.id === active)?.Component ?? PredictorTab

  return (
    <div
      style={{
        background: BG,
        minHeight: '100vh',
        color: TEXT,
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 60px' }}>
        <div
          style={{
            background: G,
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>
              Shake Shack — BSE Analytics Dashboard
            </div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 2 }}>
              ISOM 4880 · Brand Standard Evaluation · 2023–2025
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 520, overflowX: 'auto' }}>
            <div
              style={{
                display: 'inline-flex',
                minWidth: 520,
                gap: 1,
                background: G_DARK,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <MetricBadge label="Audits" value="1,986" />
              <MetricBadge label="Countries" value="7" />
              <MetricBadge label="Fail rate" value="8.5%" />
              <MetricBadge label="Accuracy" value="98%" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 2,
            background: '#e8e8e8',
            borderRadius: 10,
            padding: 3,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                flex: '1 1 180px',
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 8,
                border: 'none',
                background: active === t.id ? G : 'transparent',
                color: active === t.id ? '#fff' : '#666',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ActiveTab />
      </div>
    </div>
  )
}
// for dummy commit 1