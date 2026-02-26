import React, { useState, useCallback } from "react";

// ─── SERIES CONFIG ────────────────────────────────────────────────────────────
const SERIES_CONFIG = {
  A: {
    name: "Serie A — IPC + Margen",
    color: "#4D8FFF",
    nominal: 10_000_000,
    moneda: "COP",
    convencion: 365,
    info: 'Bonos en <strong>Pesos</strong>. TEA = (1+IPC) × (1+Margen) − 1. El IPC crece período a período según la proyección de inflación que configures. Aplica convención 365/365.',
    labelInd: "IPC Anual (%) E.A.",
    labelMar: "Margen Adicional (%) E.A.",
    ttInd: "Inflación anual certificada por el DANE. Se proyecta con la tasa de crecimiento configurada.",
    ttMar: "Spread en términos efectivos anuales, fijado en el Aviso de Oferta Pública.",
    showIBRPlazo: false, showUVR: false, showTRM: false,
    showIPCGrowth: true, showIBRChange: false, showUVRInflation: false, showTRMDevaluation: false,
  },
  B: {
    name: "Serie B — Tasa Fija",
    color: "#F5A623",
    nominal: 10_000_000,
    moneda: "COP",
    convencion: 365,
    info: 'Bonos en <strong>Pesos</strong> con tasa <strong>fija</strong>. No varía con el mercado. Ideal para comparar contra las series variables.',
    labelInd: "Tasa Cupón Fija (%) E.A.",
    labelMar: null,
    ttInd: "Tasa fija determinada por el Emisor en la Oferta Pública, expresada en términos E.A.",
    showIBRPlazo: false, showUVR: false, showTRM: false,
    showIPCGrowth: false, showIBRChange: false, showUVRInflation: false, showTRMDevaluation: false,
  },
  C: {
    name: "Serie C — IBR + Margen",
    color: "#00B274",
    nominal: 10_000_000,
    moneda: "COP",
    convencion: 360,
    info: 'Bonos en <strong>Pesos</strong>. Tasa N = IBR% + Margen%. El IBR varía cada período según la proyección del Banco de la República. Convención <strong>360/360</strong>.',
    labelInd: "IBR Nominal (%)",
    labelMar: "Margen Adicional (%) Nominal",
    ttInd: "Tasa IBR publicada por el Banco de la República al plazo seleccionado.",
    ttMar: "Spread nominal adicional sobre el IBR.",
    showIBRPlazo: true, showUVR: false, showTRM: false,
    showIPCGrowth: false, showIBRChange: true, showUVRInflation: false, showTRMDevaluation: false,
  },
  D: {
    name: "Serie D — UVR + Tasa Fija",
    color: "#E86FAB",
    nominal: 100_000,
    moneda: "UVR",
    convencion: 365,
    info: 'Bonos en <strong>UVR</strong>. El capital crece con la inflación. La UVR se proyecta con la inflación promedio anual configurada.',
    labelInd: "Tasa Cupón Fija (%) E.A.",
    labelMar: null,
    ttInd: "Tasa fija en E.A. sobre capital UVR convertido a Pesos.",
    showIBRPlazo: false, showUVR: true, showTRM: false,
    showIPCGrowth: false, showIBRChange: false, showUVRInflation: true, showTRMDevaluation: false,
  },
  E: {
    name: "Serie E — USD + Tasa Fija",
    color: "#FF7043",
    nominal: 5_000,
    moneda: "USD",
    convencion: 365,
    info: 'Bonos en <strong>Dólares</strong>. Los pagos se convierten a Pesos con la TRM proyectada, que crece según la devaluación anual configurada.',
    labelInd: "Tasa Cupón Fija (%) E.A.",
    labelMar: null,
    ttInd: "Tasa fija en E.A. en dólares. Pago en Pesos usando TRM proyectada.",
    showIBRPlazo: false, showUVR: false, showTRM: true,
    showIPCGrowth: false, showIBRChange: false, showUVRInflation: false, showTRMDevaluation: true,
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatCOP = (val) => "$ " + Math.round(val).toLocaleString("es-CO");
const formatNum = (val) => Number(val).toLocaleString("es-CO");
const formatPct = (val) => `${Number(val).toFixed(2)}%`;

function calcDuracion(flujos, totalVP) {
  return flujos.reduce((acc, f) => acc + f.ti * (f.vp / totalVP), 0);
}
function getPeriodoLabel(i, m) {
  if (m === 12) return `Mes ${i}`;
  if (m === 4) return `Trim ${i}`;
  if (m === 2) return `Sem ${i}`;
  return `Año ${i}`;
}

// ─── PROJECTION BADGE ────────────────────────────────────────────────────────
function ProjectionBadge({ label, value, color }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label}: {value}
    </div>
  );
}

// ─── FORMULA CARD ─────────────────────────────────────────────────────────────
function FormulaCard({ serie }) {
  const cfg = SERIES_CONFIG[serie];
  const baseStyle = {
    background: "linear-gradient(135deg, #00205B 0%, #001844 100%)",
    borderRadius: 20, padding: "28px 32px", color: "#fff",
    position: "relative", overflow: "hidden", marginBottom: 24,
  };
  const boxStyle = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14, padding: 24, fontFamily: "'DM Mono', monospace",
    fontSize: 15, color: "#B3CFFF", lineHeight: 1.8,
  };
  const mainStyle = {
    fontSize: 22, color: "#fff", fontWeight: 500, textAlign: "center",
    margin: "16px 0 20px", display: "flex", alignItems: "center",
    justifyContent: "center", flexWrap: "wrap", gap: 8,
  };
  const legendStyle = {
    display: "grid", gridTemplateColumns: "auto 1fr",
    gap: "8px 16px", fontSize: 13, color: "#B3CFFF", marginTop: 16,
  };
  const stepLabel = (n, text) => (
    <div style={{ fontSize: 13, color: "#B3CFFF", marginBottom: 12 }}>
      <strong style={{ color: "#F5A623" }}>PASO {n}:</strong> {text}
    </div>
  );
  const Legend = ({ items }) => (
    <div style={legendStyle}>
      {items.map(([sym, desc], i) => (
        <React.Fragment key={i}>
          <span style={{ color: "#F5A623", fontWeight: 600, whiteSpace: "nowrap" }}>{sym}</span>
          <span>{desc}</span>
        </React.Fragment>
      ))}
    </div>
  );

  const projectionNote = (text) => (
    <div style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#F5A623", marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ fontSize: 16 }}>📈</span>
      <span>{text}</span>
    </div>
  );

  let content = null;
  if (serie === "A") content = (
    <>
      {stepLabel(1, "TEA compuesta por período (IPC crece cada año)")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>TEA<sub style={{ fontSize: 11 }}>t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>(1 + <span style={{ color: "#4D8FFF" }}>IPC<sub style={{ fontSize: 11 }}>t</sub></span>) × (1 + <span style={{ color: "#4FFFB0" }}>M</span>) − 1</span>
      </div>
      {stepLabel(2, "IPC proyectado período a período")}
      <div style={mainStyle}>
        <span style={{ color: "#4D8FFF" }}>IPC<sub style={{ fontSize: 11 }}>t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>IPC<sub style={{ fontSize: 11 }}>0</sub> × (1 + <span style={{ color: "#FF7043" }}>g<sub style={{ fontSize: 11 }}>IPC</sub></span>)<sup style={{ fontSize: 11 }}>t</sup></span>
      </div>
      {projectionNote("El IPC crece año a año con la tasa de crecimiento que configures. Los flujos de caja aumentan progresivamente, mostrando el impacto real de la inflación compuesta.")}
      <Legend items={[
        ["IPC₀", "Inflación inicial — dato DANE"], ["g_IPC", "Tasa de crecimiento anual del IPC (tu proyección)"],
        ["M", "Margen fijo E.A."], ["r", "Tasa de descuento para valoración"],
      ]} />
    </>
  );
  if (serie === "B") content = (
    <>
      {stepLabel(1, "Tasa periódica equivalente")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>i<sub style={{ fontSize: 11 }}>nom</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>m × [(1 + <span style={{ color: "#4D8FFF" }}>TEA</span>)<sup style={{ fontSize: 11 }}>1/m</sup> − 1]</span>
      </div>
      {stepLabel(2, "Precio de Suscripción")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>P</span>
        <span style={{ color: "#aaa" }}>=</span>
        <span style={{ fontSize: 24 }}>∑</span>
        <span style={{ color: "#4D8FFF" }}>F<sub style={{ fontSize: 11 }}>i</sub></span>
        <span style={{ color: "#aaa" }}>÷</span>
        <span>(1 + <span style={{ color: "#F5A623" }}>r</span>)<sup style={{ fontSize: 11 }}>tᵢ</sup></span>
      </div>
      <Legend items={[
        ["TEA", "Tasa fija de la Oferta Pública"], ["m", "Períodos por año"],
        ["r", "Tasa de Corte del mercado"],
      ]} />
    </>
  );
  if (serie === "C") content = (
    <>
      {stepLabel(1, "IBR varía cada período según política monetaria")}
      <div style={mainStyle}>
        <span style={{ color: "#4D8FFF" }}>IBR<sub style={{ fontSize: 11 }}>t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>IBR<sub style={{ fontSize: 11 }}>0</sub> + <span style={{ color: "#FF7043" }}>Δ<sub style={{ fontSize: 11 }}>t</sub></span></span>
      </div>
      {stepLabel(2, "Tasa nominal total por período")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>i<sub style={{ fontSize: 11 }}>nom,t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span><span style={{ color: "#4D8FFF" }}>IBR<sub style={{ fontSize: 11 }}>t</sub></span> + <span style={{ color: "#4FFFB0" }}>Margen</span></span>
      </div>
      {projectionNote("El IBR cambia progresivamente según la variación anual configurada (positiva = sube tasas, negativa = Banrep baja tasas). Cada fila de la tabla refleja el cupón real de ese período.")}
      <Legend items={[
        ["IBR₀", "IBR inicial al plazo elegido"], ["Δt", "Cambio acumulado por período"],
        ["Margen", "Spread fijo de la emisión"],
      ]} />
    </>
  );
  if (serie === "D") content = (
    <>
      {stepLabel(1, "UVR crece con la inflación proyectada")}
      <div style={mainStyle}>
        <span style={{ color: "#4D8FFF" }}>UVR<sub style={{ fontSize: 11 }}>t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>UVR<sub style={{ fontSize: 11 }}>0</sub> × (1 + <span style={{ color: "#FF7043" }}>π</span>)<sup style={{ fontSize: 11 }}>t</sup></span>
      </div>
      {stepLabel(2, "Capital e interés en COP por período")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>Capital<sub style={{ fontSize: 11 }}>COP,t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Cap<sub style={{ fontSize: 11 }}>UVR</sub> × <span style={{ color: "#4D8FFF" }}>UVR<sub style={{ fontSize: 11 }}>t</sub></span></span>
      </div>
      {projectionNote("La UVR sube cada año con la inflación promedio que configures. El capital en pesos crece visiblemente en cada fila — ese es el poder de protección real de esta serie.")}
      <Legend items={[
        ["UVR₀", "Valor UVR hoy (Banrep)"], ["π", "Inflación promedio anual proyectada"],
        ["t", "Tiempo en años desde emisión"],
      ]} />
    </>
  );
  if (serie === "E") content = (
    <>
      {stepLabel(1, "TRM proyectada con devaluación anual")}
      <div style={mainStyle}>
        <span style={{ color: "#4D8FFF" }}>TRM<sub style={{ fontSize: 11 }}>t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>TRM<sub style={{ fontSize: 11 }}>0</sub> × (1 + <span style={{ color: "#FF7043" }}>δ</span>)<sup style={{ fontSize: 11 }}>t</sup></span>
      </div>
      {stepLabel(2, "Interés en COP por período")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>Int<sub style={{ fontSize: 11 }}>COP,t</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Cap<sub style={{ fontSize: 11 }}>USD</sub> × i<sub style={{ fontSize: 11 }}>nom</sub> × <span style={{ color: "#4D8FFF" }}>TRM<sub style={{ fontSize: 11 }}>t</sub></span></span>
      </div>
      {projectionNote("La TRM crece con la devaluación anual esperada. Cada cupón en dólares se convierte a más pesos año a año — visualmente dramático si configuras una devaluación alta.")}
      <Legend items={[
        ["TRM₀", "TRM vigente hoy (SFC)"], ["δ", "Devaluación anual esperada del peso"],
        ["i_nom", "Tasa nominal periódica en USD"],
      ]} />
    </>
  );

  return (
    <div style={baseStyle}>
      <div style={{ position: "absolute", right: 32, bottom: -20, fontSize: 160, fontFamily: "'Playfair Display', serif", color: "rgba(255,255,255,0.04)", pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>∑</div>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#B3CFFF", marginBottom: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 24, height: 2, background: "#F5A623", display: "inline-block" }} />
        Fórmula Oficial · {cfg.name}
        <span style={{ marginLeft: "auto", background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623", padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
          {cfg.showIPCGrowth || cfg.showIBRChange || cfg.showUVRInflation || cfg.showTRMDevaluation ? "✦ Proyección Dinámica" : "Tasa Fija"}
        </span>
      </div>
      <div style={boxStyle}>{content}</div>
    </div>
  );
}

// ─── MINI CHART ───────────────────────────────────────────────────────────────
function MiniChart({ flujos, serie }) {
  const maxVal = Math.max(...flujos.map((f) => f.flujoTotal));
  const w = 700, h = 120, pad = 10;
  const bw = Math.max(2, (w - pad * 2) / flujos.length - 2);
  const cols = { A: "#4D8FFF", B: "#F5A623", C: "#00B274", D: "#E86FAB", E: "#FF7043" };
  const col = cols[serie] || "#4D8FFF";
  const isGrowing = flujos.length > 1 && flujos[flujos.length - 2].intPeriodo > flujos[0].intPeriodo;

  return (
    <div style={{ marginTop: 20 }}>
      {isGrowing && (
        <div style={{ fontSize: 12, color: col, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📈</span> Los flujos crecen por la proyección dinámica de variables
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 130, display: "block" }}>
        <defs>
          <linearGradient id={`bgGrad${serie}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.08" />
            <stop offset="100%" stopColor={col} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={w} height={h} rx="8" fill={`url(#bgGrad${serie})`} />
        {flujos.map((f, idx) => {
          const bh = Math.max(2, (f.flujoTotal / maxVal) * (h - pad - 14));
          const x = pad + idx * ((w - pad * 2) / flujos.length) + 1;
          const y = h - pad - bh - 12;
          return (
            <rect key={idx} x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)}
              rx="3" fill={col} opacity={f.amort > 0 ? "1" : "0.55"} />
          );
        })}
        <text x={w / 2} y={h - 2} textAnchor="middle" fontSize="9" fill="#888" fontFamily="DM Sans">
          Flujos de caja · barras más oscuras = último período con devolución del capital
        </text>
      </svg>
    </div>
  );
}

// ─── SLIDER FIELD ─────────────────────────────────────────────────────────────
function SliderField({ label, tooltip, value, onChange, min, max, step, suffix = "%", highlight = false }) {
  const [showTip, setShowTip] = useState(false);
  const display = suffix === " años" ? `${value} años` : suffix === " COP" ? formatCOP(value) : `${Number(value).toFixed(2)}%`;

  return (
    <div style={{ marginBottom: 20, ...(highlight ? { background: "linear-gradient(135deg, #FFF8EC, #FFF3DC)", border: "1px solid #F5A62340", borderRadius: 14, padding: "16px 16px 8px" } : {}) }}>
      {highlight && <div style={{ fontSize: 10, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>✦ Variable de Proyección</div>}
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: highlight ? "#C47D00" : "#6B7594", marginBottom: 8 }}>
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {label}
          {tooltip && (
            <span style={{ width: 18, height: 18, background: highlight ? "#F5A62320" : "#E8F0FF", color: highlight ? "#F5A623" : "#0046B5", borderRadius: "50%", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help" }}
              onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>?
              {showTip && (
                <span style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#00205B", color: "#fff", fontSize: 12, lineHeight: 1.5, padding: "10px 14px", borderRadius: 10, whiteSpace: "normal", textAlign: "center", maxWidth: 240, zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  {tooltip}
                </span>
              )}
            </span>
          )}
        </span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, height: 6, appearance: "none", WebkitAppearance: "none", background: highlight ? "#F5A62330" : "#F0F2F7", borderRadius: 99, cursor: "pointer", border: "none", padding: 0 }} />
        <span style={{ minWidth: 72, textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: highlight ? "#C47D00" : "#0046B5", background: highlight ? "#F5A62318" : "#E8F0FF", padding: "6px 10px", borderRadius: 8 }}>
          {display}
        </span>
      </div>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{ marginTop: 8, width: "100%", padding: "12px 16px", border: `2px solid ${highlight ? "#F5A62340" : "#F0F2F7"}`, borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#374169", background: highlight ? "#FFFDF7" : "#F0F2F7", outline: "none" }} />
    </div>
  );
}

// ─── RESULT ITEM ─────────────────────────────────────────────────────────────
function ResultItem({ label, value, sub, variant = "default" }) {
  const variants = {
    default: { bg: "#F4F7FF", labelColor: "#6B7594", valueColor: "#00205B" },
    highlight: { bg: "linear-gradient(135deg, #0046B5, #00205B)", labelColor: "#B3CFFF", valueColor: "#fff" },
    gold: { bg: "linear-gradient(135deg, #F5A623, #E8860A)", labelColor: "rgba(0,0,0,0.6)", valueColor: "#fff" },
    green: { bg: "linear-gradient(135deg, #00B274, #009060)", labelColor: "rgba(255,255,255,0.7)", valueColor: "#fff" },
  };
  const v = variants[variant] || variants.default;
  return (
    <div className="result-item" style={{ background: v.bg, borderRadius: 12, padding: 20, textAlign: "center", border: variant === "default" ? "1px solid #E8F0FF" : "none", transition: "all 0.3s ease" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1.5px", color: v.labelColor, marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: variant === "highlight" ? 28 : 22, fontWeight: 700, color: v.valueColor, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: variant === "default" ? "#6B7594" : "rgba(255,255,255,0.75)", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function EssaBondCalculator() {
  const [serie, setSerie] = useState("A");
  const cfg = SERIES_CONFIG[serie];

  // Base params
  const [numBonos, setNumBonos] = useState(10);
  const [indVal, setIndVal] = useState(5.22);
  const [marVal, setMarVal] = useState(3.80);
  const [plazo, setPlazo] = useState(5);
  const [periodo, setPeriodo] = useState(2);
  const [ibrPlazo, setIbrPlazo] = useState("NTV");
  const [uvr, setUvr] = useState(388.45);
  const [trm, setTrm] = useState(4250);
  const [descVal, setDescVal] = useState(9.5);

  // ── Projection params ──
  const [ipcGrowth, setIpcGrowth] = useState(0.30);       // % anual crecimiento IPC
  const [ibrChange, setIbrChange] = useState(-0.50);      // % anual variación IBR (negativo = Banrep baja)
  const [uvrInflation, setUvrInflation] = useState(5.00); // % inflación promedio para proyectar UVR
  const [trmDevaluation, setTrmDevaluation] = useState(4.00); // % devaluación anual TRM

  const [results, setResults] = useState(null);

  const getNominalDisplay = useCallback(() => {
    const val = numBonos * cfg.nominal;
    if (cfg.moneda === "COP") return `Valor nominal total: ${formatCOP(val)}`;
    if (cfg.moneda === "UVR") return `${formatNum(val)} UVR ≈ ${formatCOP(val * uvr)} hoy`;
    return `USD ${formatNum(val)} ≈ ${formatCOP(val * trm)} hoy`;
  }, [numBonos, cfg, uvr, trm]);

  const calcular = () => {
    const m = parseInt(periodo);
    const ind = indVal / 100;
    const mar = marVal / 100;
    const r = descVal / 100;
    const capitalBase = cfg.nominal * numBonos;
    const flujos = [];
    let totalIntereses = 0;

    for (let i = 1; i <= plazo * m; i++) {
      const esUltimo = i === plazo * m;
      const ti = i / m; // tiempo en años
      const yearFraction = ti; // años transcurridos

      let intPeriodo = 0;
      let capMult = 1;
      let ibrActual = ind;
      let uvrActual = uvr;
      let trmActual = trm;
      let teaAnualPeriodo = 0;

      if (serie === "A") {
        // IPC crece cada año
        const ipcProyectado = ind * Math.pow(1 + ipcGrowth / 100, yearFraction);
        teaAnualPeriodo = (1 + ipcProyectado) * (1 + mar) - 1;
        const iPeriodica = Math.pow(1 + teaAnualPeriodo, 1 / m) - 1;
        intPeriodo = capitalBase * iPeriodica;
      } else if (serie === "B") {
        teaAnualPeriodo = ind;
        const iPeriodica = Math.pow(1 + teaAnualPeriodo, 1 / m) - 1;
        intPeriodo = capitalBase * iPeriodica;
      } else if (serie === "C") {
        // IBR cambia cada año
        ibrActual = Math.max(0, ind + (ibrChange / 100) * yearFraction);
        const tasaNominalTotal = ibrActual + mar;
        const iPeriodica = tasaNominalTotal / m;
        intPeriodo = capitalBase * iPeriodica;
        teaAnualPeriodo = Math.pow(1 + iPeriodica, m) - 1;
      } else if (serie === "D") {
        // UVR crece con inflación proyectada
        uvrActual = uvr * Math.pow(1 + uvrInflation / 100, yearFraction);
        capMult = uvrActual;
        teaAnualPeriodo = ind;
        const iPeriodica = Math.pow(1 + teaAnualPeriodo, 1 / m) - 1;
        intPeriodo = capitalBase * iPeriodica * capMult;
      } else if (serie === "E") {
        // TRM crece con devaluación
        trmActual = trm * Math.pow(1 + trmDevaluation / 100, yearFraction);
        capMult = trmActual;
        teaAnualPeriodo = ind;
        const iPeriodica = Math.pow(1 + teaAnualPeriodo, 1 / m) - 1;
        intPeriodo = capitalBase * iPeriodica * capMult;
      }

      const amort = esUltimo ? capitalBase * (serie === "D" ? uvrActual : serie === "E" ? trmActual : 1) : 0;
      const flujoTotal = intPeriodo + amort;
      const vp = flujoTotal / Math.pow(1 + r, ti);
      totalIntereses += intPeriodo;

      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() + Math.round((12 / m) * i));
      const fechaStr = fecha.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

      flujos.push({
        i, fechaStr,
        capital: capitalBase * (serie === "D" ? uvrActual : serie === "E" ? trmActual : 1),
        intPeriodo, amort, flujoTotal, vp, ti,
        teaAnualPeriodo,
        varDinamica: serie === "A" ? ind * Math.pow(1 + ipcGrowth / 100, yearFraction) * 100
          : serie === "C" ? Math.max(0, ind + (ibrChange / 100) * yearFraction) * 100
          : serie === "D" ? uvr * Math.pow(1 + uvrInflation / 100, yearFraction)
          : serie === "E" ? trm * Math.pow(1 + trmDevaluation / 100, yearFraction)
          : null,
      });
    }

    const precio = flujos.reduce((acc, f) => acc + f.vp, 0);
    const dur = calcDuracion(flujos, precio);
    const teaInicial = serie === "A" ? (1 + ind) * (1 + mar) - 1
      : serie === "C" ? Math.pow(1 + (ind + mar) / m, m) - 1
      : ind;
    const capMultFinal = serie === "D" ? uvr : serie === "E" ? trm : 1;

    setResults({ flujos, teaInicial, precio, totalIntereses, capitalBase, capMultFinal, m, dur, plazo, totalPeriodos: plazo * m, r });
  };

  const inputStyle = { width: "100%", padding: "14px 16px", border: "2px solid #F0F2F7", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374169", background: "#F0F2F7", outline: "none" };
  const selectStyle = { ...inputStyle, appearance: "none" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#6B7594", marginBottom: 8 };

  const varDinamicaLabel = {
    A: "IPC Proyectado",
    C: "IBR Proyectado",
    D: "UVR Proyectada (COP)",
    E: "TRM Proyectada (COP)",
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F7FF; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #0046B5; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,70,181,0.4); cursor: pointer; }
        input[type=range].highlight-range::-webkit-slider-thumb { background: #F5A623; box-shadow: 0 2px 8px rgba(245,166,35,0.5); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes orbit { 0% { transform:rotate(0deg) translateX(30px) rotate(0deg); } 100% { transform:rotate(360deg) translateX(30px) rotate(-360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .btn-calc { transition: all 0.25s ease; }
        .btn-calc:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,70,181,0.5) !important; }
        .series-btn { transition: all 0.25s ease; }
        .series-btn:hover { border-color: rgba(255,255,255,0.5) !important; background: rgba(255,255,255,0.15) !important; }
        .result-item { transition: all 0.3s ease; }
        .result-item:hover { transform: translateY(-3px); box-shadow: 0 4px 24px rgba(0,32,91,0.10); }
        tr:hover td { background: #F4F7FF !important; }
        .growing-cell { color: #00B274 !important; font-weight: 600 !important; }
      `}</style>

      {/* BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(135deg, #00205B 0%, #0046B5 50%, #003087 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(0,92,230,0.4)", top: -100, right: -100, filter: "blur(60px)", animation: "orbit 15s linear infinite" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(77,143,255,0.25)", bottom: -50, left: -80, filter: "blur(60px)", animation: "orbit 20s linear infinite reverse" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* HEADER */}
        <header style={{ padding: "0 40px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", background: "rgba(0,32,91,0.6)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <rect width="44" height="44" rx="10" fill="#00205B" />
                <path d="M26 6L14 22H22L18 38L30 20H22L26 6Z" fill="#F5A623" stroke="#F5A623" strokeWidth="0.5" strokeLinejoin="round" />
                <circle cx="12" cy="22" r="2.5" fill="white" opacity="0.6" />
                <circle cx="32" cy="22" r="2.5" fill="white" opacity="0.6" />
              </svg>
            </div>
            <div style={{ color: "#fff" }}>
              <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, letterSpacing: 1, display: "block", lineHeight: 1 }}>ESSA</strong>
              <span style={{ fontSize: 11, color: "#B3CFFF", letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}>Electrificadora de Santander</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623", padding: "6px 14px", borderRadius: 40, fontSize: 12, fontWeight: 600, animation: "pulse 3s ease infinite" }}>
              ✦ Proyección Dinámica
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 18px", borderRadius: 40, fontSize: 13, fontWeight: 500 }}>
              Mercado de Valores · Colombia
            </div>
          </div>
        </header>

        {/* HERO */}
        <div style={{ padding: "70px 40px 50px", textAlign: "center", color: "#fff" }} className="fade-up">
          <div style={{ display: "inline-block", background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.5)", color: "#F5A623", padding: "6px 20px", borderRadius: 40, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
            ⚡ Prospecto de Información · Febrero 2026
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px,5.5vw,68px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 16 }}>
            Bonos de <span style={{ color: "#F5A623" }}>Deuda Pública</span><br />Interna BDPI
          </h1>
          <p style={{ fontSize: 17, color: "#B3CFFF", maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Calculadora interactiva con <strong style={{ color: "#fff" }}>proyección dinámica de variables</strong>: IPC, IBR, UVR y TRM crecen período a período según tu escenario.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
            {[["$200MM", "Monto Total COP"], ["5", "Series A·B·C·D·E"], ["1–50", "Años plazo"], ["BVC", "Bolsa Colombia"]].map(([num, lbl]) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700 }}>{num}</div>
                <div style={{ fontSize: 11, color: "#B3CFFF", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: "0 40px 80px", maxWidth: 1340, margin: "0 auto", width: "100%" }}>

          {/* SERIES SELECTOR */}
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, opacity: 0.7, display: "flex", alignItems: "center", gap: 10 }}>
            Selecciona la Serie
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            {Object.entries(SERIES_CONFIG).map(([key, val]) => (
              <button key={key} className="series-btn" onClick={() => { setSerie(key); setResults(null); }}
                style={{ padding: "10px 24px", borderRadius: 50, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8, background: serie === key ? "#fff" : "rgba(255,255,255,0.08)", color: serie === key ? "#00205B" : "#fff", border: serie === key ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)", boxShadow: serie === key ? "0 4px 20px rgba(0,0,0,0.3)" : "none" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: val.color }} />
                {val.name}
                {(val.showIPCGrowth || val.showIBRChange || val.showUVRInflation || val.showTRMDevaluation) && (
                  <span style={{ fontSize: 9, background: "rgba(245,166,35,0.3)", color: "#F5A623", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>DINÁMICO</span>
                )}
              </button>
            ))}
          </div>

          <FormulaCard serie={serie} />

          {/* GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24 }}>

            {/* INPUT CARD */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,32,91,0.14)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, #0046B5, ${cfg.color})` }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#00205B", marginBottom: 6 }}>⚙️ Parámetros del Bono</div>
              <div style={{ fontSize: 13, color: "#6B7594", marginBottom: 20 }}>{cfg.name} · {cfg.moneda}</div>
              <div style={{ background: "#F4F7FF", border: "1px solid #B3CFFF", borderRadius: 12, padding: "14px 18px", marginBottom: 22, fontSize: 13, color: "#003087", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: cfg.info }} />

              {/* Número de bonos */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Número de Bonos a Suscribir</label>
                <input type="number" value={numBonos} min="1" max="10000" onChange={(e) => setNumBonos(parseInt(e.target.value) || 1)} style={inputStyle} />
                <div style={{ fontSize: 12, color: "#6B7594", marginTop: 6 }}>{getNominalDisplay()}</div>
              </div>

              <SliderField label={cfg.labelInd} tooltip={cfg.ttInd} value={indVal} onChange={setIndVal} min={0} max={25} step={0.1} />
              {cfg.labelMar && <SliderField label={cfg.labelMar} tooltip={cfg.ttMar} value={marVal} onChange={setMarVal} min={0} max={10} step={0.05} />}
              <SliderField label="Plazo de Redención (Años)" tooltip="Entre 1 y 50 años según el Prospecto." value={plazo} onChange={setPlazo} min={1} max={50} step={1} suffix=" años" />

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Periodicidad de Pago</label>
                <select value={periodo} onChange={(e) => setPeriodo(parseInt(e.target.value))} style={selectStyle}>
                  <option value="12">Mes Vencido (12 pagos/año)</option>
                  <option value="4">Trimestre Vencido (4 pagos/año)</option>
                  <option value="2">Semestre Vencido (2 pagos/año)</option>
                  <option value="1">Año Vencido (1 pago/año)</option>
                </select>
              </div>

              {cfg.showIBRPlazo && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Plazo IBR</label>
                  <select value={ibrPlazo} onChange={(e) => setIbrPlazo(e.target.value)} style={selectStyle}>
                    <option value="NMV">1 mes (N.M.V)</option>
                    <option value="NTV">3 meses (N.T.V)</option>
                    <option value="NSV">6 meses (N.S.V)</option>
                    <option value="NAV">12 meses (N.A.V)</option>
                  </select>
                </div>
              )}

              {cfg.showUVR && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Valor UVR vigente hoy (COP)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: "#6B7594", pointerEvents: "none" }}>$</span>
                    <input type="number" value={uvr} step="0.01" min="1" onChange={(e) => setUvr(parseFloat(e.target.value) || 1)} style={{ ...inputStyle, paddingLeft: 48 }} />
                  </div>
                </div>
              )}

              {cfg.showTRM && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>TRM vigente hoy (COP/USD)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: "#6B7594", pointerEvents: "none" }}>$</span>
                    <input type="number" value={trm} step="1" min="1" onChange={(e) => setTrm(parseFloat(e.target.value) || 1)} style={{ ...inputStyle, paddingLeft: 48 }} />
                  </div>
                </div>
              )}

              <SliderField label="Tasa de Descuento / Corte (r%) E.A." tooltip="Tasa del mercado para valorar el precio de suscripción." value={descVal} onChange={setDescVal} min={0} max={30} step={0.1} />

              {/* ── PROJECTION SLIDERS ── */}
              {cfg.showIPCGrowth && (
                <>
                  <div style={{ borderTop: "2px dashed #F5A62340", margin: "24px 0 20px", position: "relative" }}>
                    <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: 2 }}>Proyección Dinámica</span>
                  </div>
                  <SliderField
                    label="Crecimiento Anual del IPC (%)"
                    tooltip="El IPC inicial crece este porcentaje cada año. Simula un escenario de inflación acelerada o moderada."
                    value={ipcGrowth} onChange={setIpcGrowth} min={-2} max={5} step={0.1}
                    highlight={true}
                  />
                </>
              )}

              {cfg.showIBRChange && (
                <>
                  <div style={{ borderTop: "2px dashed #F5A62340", margin: "24px 0 20px", position: "relative" }}>
                    <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: 2 }}>Proyección Dinámica</span>
                  </div>
                  <SliderField
                    label="Variación Anual del IBR (%)"
                    tooltip="El IBR sube o baja este porcentaje cada año. Negativo = Banrep recorta tasas. Positivo = Banrep sube tasas."
                    value={ibrChange} onChange={setIbrChange} min={-4} max={4} step={0.1}
                    highlight={true}
                  />
                </>
              )}

              {cfg.showUVRInflation && (
                <>
                  <div style={{ borderTop: "2px dashed #F5A62340", margin: "24px 0 20px", position: "relative" }}>
                    <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: 2 }}>Proyección Dinámica</span>
                  </div>
                  <SliderField
                    label="Inflación Promedio Anual para UVR (%)"
                    tooltip="La UVR crece con esta tasa de inflación anual. A mayor inflación, mayor crecimiento del capital en pesos."
                    value={uvrInflation} onChange={setUvrInflation} min={1} max={20} step={0.1}
                    highlight={true}
                  />
                </>
              )}

              {cfg.showTRMDevaluation && (
                <>
                  <div style={{ borderTop: "2px dashed #F5A62340", margin: "24px 0 20px", position: "relative" }}>
                    <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: 2 }}>Proyección Dinámica</span>
                  </div>
                  <SliderField
                    label="Devaluación Anual Esperada del Peso (%)"
                    tooltip="La TRM crece este porcentaje por año. A mayor devaluación, más pesos recibes por cada dólar de cupón."
                    value={trmDevaluation} onChange={setTrmDevaluation} min={0} max={20} step={0.5}
                    highlight={true}
                  />
                </>
              )}

              <button className="btn-calc" onClick={calcular}
                style={{ width: "100%", padding: 18, background: "linear-gradient(135deg, #0046B5, #00205B)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 24px rgba(0,70,181,0.35)", marginTop: 12 }}>
                Calcular con Proyección Dinámica →
              </button>
            </div>

            {/* RESULTS CARD */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,32,91,0.14)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, #0046B5, ${cfg.color})` }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#00205B", marginBottom: 6 }}>📊 Vista Previa</div>
              <div style={{ fontSize: 13, color: "#6B7594", marginBottom: 20 }}>
                {results ? "Resultados con proyección dinámica activada" : "Configura los parámetros y presiona Calcular"}
              </div>

              {!results ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.12 }}>⚡</div>
                  <div style={{ fontSize: 15, color: "#6B7594", maxWidth: 240, lineHeight: 1.6 }}>Los flujos proyectados aparecerán aquí</div>
                </div>
              ) : (
                <>
                  {/* Projection badges */}
                  {(cfg.showIPCGrowth || cfg.showIBRChange || cfg.showUVRInflation || cfg.showTRMDevaluation) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                      {cfg.showIPCGrowth && <ProjectionBadge label="IPC crece" value={`+${ipcGrowth}%/año`} color="#4D8FFF" />}
                      {cfg.showIBRChange && <ProjectionBadge label="IBR varía" value={`${ibrChange > 0 ? "+" : ""}${ibrChange}%/año`} color="#00B274" />}
                      {cfg.showUVRInflation && <ProjectionBadge label="UVR inflación" value={`${uvrInflation}%/año`} color="#E86FAB" />}
                      {cfg.showTRMDevaluation && <ProjectionBadge label="TRM devalúa" value={`+${trmDevaluation}%/año`} color="#FF7043" />}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <ResultItem label="TEA Inicial" value={`${(results.teaInicial * 100).toFixed(3)}%`} sub="Efectiva Anual" variant="highlight" />
                    <ResultItem label="Precio Suscripción" value={formatCOP(results.precio / numBonos)} sub={`${(results.precio / (results.capitalBase * results.capMultFinal) * 100).toFixed(2)}% del nominal`} variant="gold" />
                    <ResultItem label="Primer Cupón" value={formatCOP(results.flujos[0].intPeriodo)} sub="Período 1" />
                    <ResultItem label="Último Cupón" value={formatCOP(results.flujos[results.flujos.length - 1].intPeriodo)} sub={`Período ${results.totalPeriodos}`} variant={results.flujos[results.flujos.length - 1].intPeriodo > results.flujos[0].intPeriodo ? "green" : "default"} />
                  </div>
                  {results.flujos[results.flujos.length - 1].intPeriodo > results.flujos[0].intPeriodo && (
                    <div style={{ marginTop: 16, background: "#F0FDF8", border: "1px solid #00B27430", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#007A50", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>📈</span>
                      El cupón creció un <strong>{(((results.flujos[results.flujos.length - 1].intPeriodo / results.flujos[0].intPeriodo) - 1) * 100).toFixed(1)}%</strong> del primer al último período por la proyección dinámica.
                    </div>
                  )}
                  <MiniChart flujos={results.flujos} serie={serie} />
                </>
              )}
            </div>
          </div>

          {/* FLOW TABLE */}
          {results && (
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,32,91,0.14)", marginTop: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #F5A623, #4D8FFF)" }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#00205B", marginBottom: 6 }}>📋 Tabla de Flujos de Caja Proyectados</div>
              <div style={{ fontSize: 13, color: "#6B7594", marginBottom: 20 }}>
                Proyección completa · ESSA BDPI · Febrero 2026
                {(cfg.showIPCGrowth || cfg.showIBRChange || cfg.showUVRInflation || cfg.showTRMDevaluation) && (
                  <span style={{ marginLeft: 12, background: "#FFF8EC", border: "1px solid #F5A62330", color: "#C47D00", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    ✦ Variables proyectadas dinámicamente
                  </span>
                )}
              </div>

              <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #E8F0FF" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #00205B, #0046B5)", color: "#fff" }}>
                      {["Período", "Fecha", "Saldo Capital", "Interés Período", "Amortización", "Flujo Total", "VP Flujo",
                        ...(varDinamicaLabel[serie] ? [varDinamicaLabel[serie]] : [])
                      ].map((h) => (
                        <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.flujos.map((f, idx) => {
                      const isGrowing = idx > 0 && f.intPeriodo > results.flujos[idx - 1].intPeriodo;
                      return (
                        <tr key={f.i} style={{ borderBottom: "1px solid #F4F7FF" }}>
                          <td style={{ padding: "12px 16px", color: "#003087", fontWeight: 600, fontSize: 12 }}>{getPeriodoLabel(f.i, results.m)}</td>
                          <td style={{ padding: "12px 16px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{f.fechaStr}</td>
                          <td style={{ padding: "12px 16px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{formatCOP(f.capital)}</td>
                          <td className={isGrowing ? "growing-cell" : ""} style={{ padding: "12px 16px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: isGrowing ? "#00B274" : "#374169" }}>
                            {formatCOP(f.intPeriodo)} {isGrowing && "↑"}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{f.amort > 0 ? formatCOP(f.amort) : "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{formatCOP(f.flujoTotal)}</td>
                          <td style={{ padding: "12px 16px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{formatCOP(f.vp)}</td>
                          {f.varDinamica !== null && f.varDinamica !== undefined && (
                            <td style={{ padding: "12px 16px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#F5A623", fontWeight: 600 }}>
                              {serie === "D" || serie === "E" ? formatCOP(f.varDinamica) : `${f.varDinamica.toFixed(2)}%`}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr style={{ background: "#F4F7FF", fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: "13px 16px", fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#00205B" }}>TOTALES</td>
                      <td style={{ padding: "13px 16px", fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#00B274" }}>{formatCOP(results.totalIntereses)}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#00205B" }}>{formatCOP(results.capitalBase * results.capMultFinal)}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#00205B" }}>{formatCOP(results.flujos.reduce((a, f) => a + f.flujoTotal, 0))}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#00205B" }}>{formatCOP(results.flujos.reduce((a, f) => a + f.vp, 0))}</td>
                      {varDinamicaLabel[serie] && <td style={{ padding: "13px 16px" }} />}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 16, marginTop: 24 }}>
                <ResultItem label="Capital Total Hoy" value={formatCOP(results.capitalBase * results.capMultFinal)} sub={`${numBonos} bono(s)`} />
                <ResultItem label="Intereses Totales" value={formatCOP(results.totalIntereses)} sub={`${results.totalPeriodos} pagos`} />
                <ResultItem label="Retorno Bruto" value={`${((results.totalIntereses / (results.capitalBase * results.capMultFinal)) * 100).toFixed(2)}%`} sub="Sobre capital inicial" />
                <ResultItem label="Precio Suscripción" value={formatCOP(results.precio)} sub={`${(results.precio / (results.capitalBase * results.capMultFinal) * 100).toFixed(2)}% del nominal`} variant="highlight" />
                <ResultItem label="Duración Macaulay" value={results.dur.toFixed(3)} sub="años" />
                <ResultItem label="TEA Inicial" value={`${(results.teaInicial * 100).toFixed(3)}%`} sub={`Conv. ${cfg.convencion}/365`} />
                <ResultItem label="Tasa Descuento" value={`${(results.r * 100).toFixed(2)}%`} sub="Para precio de suscripción" variant="gold" />
                <ResultItem label="Plazo Total" value={`${results.plazo} años`} sub={`${results.totalPeriodos} períodos`} />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ background: "rgba(0,32,91,0.9)", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "28px 40px", color: "#B3CFFF", fontSize: 12, textAlign: "center", lineHeight: 1.8 }}>
          <strong style={{ color: "#fff" }}>Electrificadora de Santander S.A. E.S.P. — ESSA</strong><br />
          Prospecto de Información · Emisión y Colocación Bonos de Deuda Pública Interna · Febrero de 2026<br />
          Calculadora de uso académico e ilustrativo. Valores reales en el Aviso de Oferta Pública oficial.
          Inscrito en la <strong style={{ color: "#fff" }}>BVC</strong> · Administrado por <strong style={{ color: "#fff" }}>Deceval S.A.</strong>
        </footer>
      </div>
    </div>
  );
}
