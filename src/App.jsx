import { useState, useCallback } from "react";

// ─── SERIES CONFIG ────────────────────────────────────────────────────────────
const SERIES_CONFIG = {
  A: {
    name: "Serie A — IPC + Margen",
    color: "#4D8FFF",
    nominal: 10_000_000,
    moneda: "COP",
    convencion: 365,
    info: 'Bonos denominados en <strong>Pesos</strong>. La tasa efectiva anual se forma combinando el IPC certificado por el DANE más un margen, usando la fórmula multiplicativa: <strong>TEA = (1+IPC) × (1+Margen) - 1</strong>. Aplica convención 365/365.',
    labelInd: "IPC Anual (%) E.A.",
    labelMar: "Margen Adicional (%) E.A.",
    ttInd: "Inflación anual certificada por el DANE. Dato oficial más reciente disponible al inicio o fin del período de intereses.",
    ttMar: "Spread en términos efectivos anuales, fijado en el Aviso de Oferta Pública.",
    showIBRPlazo: false, showUVR: false, showTRM: false,
  },
  B: {
    name: "Serie B — Tasa Fija",
    color: "#F5A623",
    nominal: 10_000_000,
    moneda: "COP",
    convencion: 365,
    info: 'Bonos denominados en <strong>Pesos</strong> con tasa de interés <strong>fija</strong> definida como Tasa Cupón en la Oferta Pública. Se expresa en términos efectivos anuales y se convierte a nominal según la periodicidad pactada.',
    labelInd: "Tasa Cupón Fija (%) E.A.",
    labelMar: null,
    ttInd: "Tasa fija determinada como Tasa Cupón por el Emisor en la Oferta Pública, expresada en términos efectivos anuales.",
    showIBRPlazo: false, showUVR: false, showTRM: false,
  },
  C: {
    name: "Serie C — IBR + Margen",
    color: "#00B274",
    nominal: 10_000_000,
    moneda: "COP",
    convencion: 360,
    info: 'Bonos denominados en <strong>Pesos</strong>. La tasa nominal se construye sumando el IBR publicado por el Banco de la República al margen determinado en la Oferta Pública. Aplica convención <strong>360/360</strong>. Fórmula: <strong>Tasa N = IBR% N + Margen% N</strong>.',
    labelInd: "IBR Nominal (%)",
    labelMar: "Margen Adicional (%) Nominal",
    ttInd: "Tasa IBR publicada por el Banco de la República al plazo seleccionado, expresada en términos nominales.",
    ttMar: "Spread nominal adicional sobre el IBR, fijado en el Aviso de Oferta Pública.",
    showIBRPlazo: true, showUVR: false, showTRM: false,
  },
  D: {
    name: "Serie D — UVR + Tasa Fija",
    color: "#E86FAB",
    nominal: 100_000,
    moneda: "UVR",
    convencion: 365,
    info: 'Bonos denominados en <strong>UVR</strong>. El capital y los intereses se convierten a Pesos multiplicando por el valor vigente de la UVR certificado por el Banco de la República. La tasa es fija expresada en términos efectivos anuales.',
    labelInd: "Tasa Cupón Fija (%) E.A.",
    labelMar: null,
    ttInd: "Tasa fija en términos efectivos anuales. Se aplica sobre el capital en UVR convertido a Pesos al último día del período.",
    showIBRPlazo: false, showUVR: true, showTRM: false,
  },
  E: {
    name: "Serie E — USD + Tasa Fija",
    color: "#FF7043",
    nominal: 5_000,
    moneda: "USD",
    convencion: 365,
    info: 'Bonos denominados en <strong>Dólares</strong>. Los intereses se calculan sobre el capital en USD y se pagan en Pesos aplicando la TRM certificada por la SFC al último día del período. Tasa fija en términos efectivos anuales.',
    labelInd: "Tasa Cupón Fija (%) E.A.",
    labelMar: null,
    ttInd: "Tasa fija en términos efectivos anuales en dólares. El pago se realiza en Pesos usando la TRM del último día del período.",
    showIBRPlazo: false, showUVR: false, showTRM: true,
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatCOP = (val) => "$ " + Math.round(val).toLocaleString("es-CO");
const formatNum = (val) => val.toLocaleString("es-CO");

function calcDuracion(flujos, totalVP) {
  return flujos.reduce((acc, f) => acc + f.ti * (f.vp / totalVP), 0);
}
function getPeriodoLabel(i, m) {
  if (m === 12) return `Mes ${i}`;
  if (m === 4) return `Trim ${i}`;
  if (m === 2) return `Sem ${i}`;
  return `Año ${i}`;
}

// ─── FORMULA CARD ─────────────────────────────────────────────────────────────
function FormulaCard({ serie }) {
  const baseStyle = {
    background: "linear-gradient(135deg, #00205B 0%, #001844 100%)",
    borderRadius: 20,
    padding: "28px 32px",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    marginBottom: 24,
  };
  const titleStyle = {
    fontSize: 12, textTransform: "uppercase", letterSpacing: 2,
    color: "#B3CFFF", marginBottom: 20, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8,
  };
  const boxStyle = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14, padding: 24,
    fontFamily: "'DM Mono', monospace", fontSize: 15,
    color: "#B3CFFF", lineHeight: 1.8,
  };
  const mainStyle = {
    fontSize: 22, color: "#fff", fontWeight: 500,
    textAlign: "center", margin: "16px 0 20px",
    display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8,
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

  let content = null;

  if (serie === "A") content = (
    <>
      {stepLabel(1, "Calcular la Tasa Efectiva Anual compuesta")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>TEA</span>
        <span style={{ color: "#aaa", fontSize: 20 }}>=</span>
        <span>(1 + <span style={{ color: "#4D8FFF" }}>IPC</span><sub style={{ fontSize: 12 }}>%EA</sub>)</span>
        <span style={{ color: "#aaa" }}>×</span>
        <span>(1 + <span style={{ color: "#4FFFB0" }}>M</span><sub style={{ fontSize: 12 }}>%EA</sub>)</span>
        <span style={{ color: "#aaa" }}>− 1</span>
      </div>
      {stepLabel(2, "Precio de Suscripción (Valor Presente Neto)")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>P</span>
        <span style={{ color: "#aaa" }}>=</span>
        <span style={{ fontSize: 24, margin: "0 4px" }}>∑</span>
        <span style={{ color: "#4D8FFF" }}>F<sub style={{ fontSize: 11 }}>i</sub></span>
        <span style={{ margin: "0 4px", color: "#aaa" }}>÷</span>
        <span>(1 + <span style={{ color: "#F5A623" }}>r</span>)<sup style={{ fontSize: 11 }}><span style={{ color: "#4FFFB0" }}>tᵢ</span></sup></span>
      </div>
      <Legend items={[
        ["TEA", "Tasa Efectiva Anual combinada del período"],
        ["IPC", "Inflación certificada DANE — términos E.A."],
        ["M", "Margen adicional — términos E.A."],
        ["P", "Precio de Suscripción en COP"],
        ["Fᵢ", "Flujo de interés o amortización en el período i"],
        ["r", "Tasa de Corte / Rendimiento ofrecido E.A."],
        ["tᵢ", "Tiempo en años desde suscripción hasta pago i (conv. 365/365)"],
      ]} />
    </>
  );

  if (serie === "B") content = (
    <>
      {stepLabel(1, "Conversión de Tasa E.A. → Tasa Nominal Equivalente")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>i<sub style={{ fontSize: 11 }}>nom</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>m × [(1 + <span style={{ color: "#4D8FFF" }}>TEA</span>)<sup style={{ fontSize: 11 }}>1/m</sup> − 1]</span>
      </div>
      {stepLabel(2, "Precio de Suscripción (Valor Presente)")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>P</span>
        <span style={{ color: "#aaa" }}>=</span>
        <span style={{ fontSize: 24, margin: "0 4px" }}>∑</span>
        <span style={{ color: "#4D8FFF" }}>F<sub style={{ fontSize: 11 }}>i</sub></span>
        <span style={{ margin: "0 4px", color: "#aaa" }}>÷</span>
        <span>(1 + <span style={{ color: "#F5A623" }}>r</span>)<sup style={{ fontSize: 11 }}><span style={{ color: "#4FFFB0" }}>tᵢ</span></sup></span>
      </div>
      <Legend items={[
        ["TEA", "Tasa Cupón fija definida en la Oferta Pública — E.A."],
        ["m", "Número de períodos por año (12, 4, 2 ó 1)"],
        ["inom", "Tasa nominal equivalente al período de pago"],
        ["P", "Precio de Suscripción · conv. 365/365"],
        ["r", "Tasa de Corte / Tasa de Rendimiento Ofrecida E.A."],
      ]} />
    </>
  );

  if (serie === "C") content = (
    <>
      {stepLabel(1, "Tasa Nominal Total del período según plazo IBR")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>i<sub style={{ fontSize: 11 }}>nom</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span><span style={{ color: "#4D8FFF" }}>IBR<sub style={{ fontSize: 11 }}>N·P·V</sub></span> + <span style={{ color: "#4FFFB0" }}>Margen<sub style={{ fontSize: 11 }}>N·P·V</sub></span></span>
      </div>
      {stepLabel(2, "Factor de Liquidación de Intereses (conv. 360/360)")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>Interés</span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Capital × <span style={{ color: "#4D8FFF" }}>i<sub style={{ fontSize: 11 }}>nom</sub></span> × (n/360)</span>
      </div>
      {stepLabel(3, "Precio de Suscripción")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>P</span>
        <span style={{ color: "#aaa" }}>=</span>
        <span style={{ fontSize: 24, margin: "0 4px" }}>∑</span>
        <span style={{ color: "#4D8FFF" }}>F<sub style={{ fontSize: 11 }}>i</sub></span>
        <span style={{ margin: "0 4px", color: "#aaa" }}>÷</span>
        <span>(1+<span style={{ color: "#F5A623" }}>r</span>)<sup style={{ fontSize: 11 }}><span style={{ color: "#4FFFB0" }}>tᵢ</span></sup></span>
      </div>
      <Legend items={[
        ["IBR N·P·V", "IBR nominal al plazo: N.M.V / N.T.V / N.S.V / N.A.V (base 360 días)"],
        ["n", "Días calendario del período de intereses"],
        ["P", "Precio de Suscripción · conv. 360/360"],
        ["r", "Tasa de descuento E.A. para valoración"],
      ]} />
    </>
  );

  if (serie === "D") content = (
    <>
      {stepLabel(1, "Conversión del Capital UVR → Pesos")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>Capital<sub style={{ fontSize: 11 }}>COP</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Capital<sub style={{ fontSize: 11 }}>UVR</sub> × <span style={{ color: "#4D8FFF" }}>UVR<sub style={{ fontSize: 11 }}>t</sub></span></span>
      </div>
      {stepLabel(2, "Interés del período en Pesos")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>Interés<sub style={{ fontSize: 11 }}>COP</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Capital<sub style={{ fontSize: 11 }}>UVR</sub> × <span style={{ color: "#4D8FFF" }}>UVR<sub style={{ fontSize: 11 }}>fin</sub></span> × i<sub style={{ fontSize: 11 }}>nom</sub></span>
      </div>
      {stepLabel(3, "Precio Suscripción en Pesos")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>P<sub style={{ fontSize: 11 }}>COP</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span style={{ fontSize: 22, margin: "0 4px" }}>∑</span>
        <span style={{ color: "#4D8FFF" }}>F<sub style={{ fontSize: 11 }}>i</sub></span>
        <span style={{ margin: "0 4px", color: "#aaa" }}>÷</span>
        <span>(1+r)<sup style={{ fontSize: 11 }}>tᵢ</sup></span>
        <span style={{ color: "#aaa" }}>×</span>
        <span style={{ color: "#4D8FFF" }}>UVR<sub style={{ fontSize: 11 }}>suscrip</sub></span>
      </div>
      <Legend items={[
        ["UVR t", "Valor de la UVR certificada por el Banco de la República en la fecha t"],
        ["UVR fin", "UVR vigente al último día del período de intereses"],
        ["inom", "Tasa nominal equivalente derivada de la Tasa Cupón E.A."],
      ]} />
    </>
  );

  if (serie === "E") content = (
    <>
      {stepLabel(1, "Interés en Dólares del período")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>Interés<sub style={{ fontSize: 11 }}>USD</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Capital<sub style={{ fontSize: 11 }}>USD</sub> × i<sub style={{ fontSize: 11 }}>nom</sub></span>
      </div>
      {stepLabel(2, "Conversión a Pesos usando TRM")}
      <div style={mainStyle}>
        <span style={{ color: "#F5A623" }}>Interés<sub style={{ fontSize: 11 }}>COP</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span>Capital<sub style={{ fontSize: 11 }}>USD</sub> × i<sub style={{ fontSize: 11 }}>nom</sub> × <span style={{ color: "#4D8FFF" }}>TRM<sub style={{ fontSize: 11 }}>fin período</sub></span></span>
      </div>
      {stepLabel(3, "Precio Suscripción en Pesos")}
      <div style={{ ...mainStyle, fontSize: 18 }}>
        <span style={{ color: "#F5A623" }}>P<sub style={{ fontSize: 11 }}>COP</sub></span>
        <span style={{ color: "#aaa" }}>=</span>
        <span style={{ fontSize: 22, margin: "0 4px" }}>∑</span>
        <span style={{ color: "#4D8FFF" }}>F<sub style={{ fontSize: 11 }}>i,USD</sub></span>
        <span style={{ margin: "0 4px", color: "#aaa" }}>÷</span>
        <span>(1+r)<sup style={{ fontSize: 11 }}>tᵢ</sup></span>
        <span style={{ color: "#aaa" }}>×</span>
        <span style={{ color: "#4D8FFF" }}>TRM<sub style={{ fontSize: 11 }}>suscrip</sub></span>
      </div>
      <Legend items={[
        ["TRM fin", "Tasa Representativa del Mercado certificada por la SFC al último día del período"],
        ["TRM suscrip", "TRM vigente en la Fecha de Suscripción"],
        ["inom", "Tasa nominal equivalente derivada de la Tasa Cupón E.A. en dólares"],
      ]} />
    </>
  );

  return (
    <div style={baseStyle}>
      <div style={{ position: "absolute", right: 32, bottom: -20, fontSize: 160, fontFamily: "'Playfair Display', serif", color: "rgba(255,255,255,0.04)", pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>∑</div>
      <div style={titleStyle}>
        <span style={{ width: 24, height: 2, background: "#F5A623", display: "inline-block" }} />
        Fórmula Oficial · {SERIES_CONFIG[serie].name}
      </div>
      <div style={boxStyle}>{content}</div>
    </div>
  );
}

// ─── MINI CHART ───────────────────────────────────────────────────────────────
function MiniChart({ flujos, serie }) {
  const maxVal = Math.max(...flujos.map((f) => f.flujoTotal));
  const w = 700, h = 100, pad = 10;
  const bw = (w - pad * 2) / flujos.length - 2;
  const cols = { A: "#4D8FFF", B: "#F5A623", C: "#00B274", D: "#E86FAB", E: "#FF7043" };
  const col = cols[serie] || "#4D8FFF";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 120, display: "block", marginTop: 20 }}>
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.08" />
          <stop offset="100%" stopColor={col} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} rx="8" fill="url(#bgGrad)" />
      {flujos.map((f, idx) => {
        const bh = (f.flujoTotal / maxVal) * (h - pad - 10);
        const x = pad + idx * ((w - pad * 2) / flujos.length) + 1;
        const y = h - pad - bh;
        return (
          <rect key={idx} x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)}
            rx="3" fill={col} opacity={f.amort > 0 ? "1" : "0.6"} />
        );
      })}
      <text x={w / 2} y={h - 2} textAnchor="middle" fontSize="9" fill="#888" fontFamily="DM Sans">
        Flujos de caja · barras más altas = período final con devolución de capital
      </text>
    </svg>
  );
}

// ─── SLIDER FIELD ─────────────────────────────────────────────────────────────
function SliderField({ label, tooltip, value, onChange, min, max, step, suffix = "%" }) {
  const [showTip, setShowTip] = useState(false);
  const display = suffix === " años" ? `${value} años` : `${Number(value).toFixed(2)}%`;

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#6B7594", marginBottom: 8 }}>
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {label}
          <span
            style={{ width: 18, height: 18, background: "#E8F0FF", color: "#0046B5", borderRadius: "50%", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help" }}
            onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
          >?</span>
          {showTip && (
            <span style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#00205B", color: "#fff", fontSize: 12, lineHeight: 1.5, padding: "10px 14px", borderRadius: 10, whiteSpace: "normal", textAlign: "center", maxWidth: 240, zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              {tooltip}
            </span>
          )}
        </span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, height: 6, appearance: "none", WebkitAppearance: "none", background: "#F0F2F7", borderRadius: 99, cursor: "pointer", border: "none", padding: 0 }}
        />
        <span style={{ minWidth: 60, textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: "#0046B5", background: "#E8F0FF", padding: "6px 10px", borderRadius: 8 }}>
          {display}
        </span>
      </div>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{ marginTop: 8, width: "100%", padding: "14px 16px", border: "2px solid #F0F2F7", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374169", background: "#F0F2F7", outline: "none" }}
      />
    </div>
  );
}

// ─── RESULT ITEM ─────────────────────────────────────────────────────────────
function ResultItem({ label, value, sub, variant = "default" }) {
  const variants = {
    default: { bg: "#F4F7FF", labelColor: "#6B7594", valueColor: "#00205B" },
    highlight: { bg: "linear-gradient(135deg, #0046B5, #00205B)", labelColor: "#B3CFFF", valueColor: "#fff" },
    gold: { bg: "linear-gradient(135deg, #F5A623, #E8860A)", labelColor: "rgba(0,0,0,0.6)", valueColor: "#fff" },
  };
  const v = variants[variant];
  return (
    <div className="result-item" style={{ background: v.bg, borderRadius: 12, padding: 20, textAlign: "center", border: variant === "default" ? "1px solid #E8F0FF" : "none", transition: "all 0.3s ease" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1.5px", color: v.labelColor, marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: variant === "highlight" ? 32 : 26, fontWeight: 700, color: v.valueColor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: variant === "default" ? "#6B7594" : "rgba(255,255,255,0.7)", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
import React from "react";

export default function EssaBondCalculator() {
  const [serie, setSerie] = useState("A");
  const cfg = SERIES_CONFIG[serie];

  const [numBonos, setNumBonos] = useState(10);
  const [indVal, setIndVal] = useState(6.5);
  const [marVal, setMarVal] = useState(2.5);
  const [plazo, setPlazo] = useState(5);
  const [periodo, setPeriodo] = useState(2);
  const [ibrPlazo, setIbrPlazo] = useState("NTV");
  const [uvr, setUvr] = useState(388.45);
  const [trm, setTrm] = useState(4250);
  const [descVal, setDescVal] = useState(10.5);
  const [results, setResults] = useState(null);

  const getNominalDisplay = useCallback(() => {
    const val = numBonos * cfg.nominal;
    if (cfg.moneda === "COP") return `Valor nominal total: ${formatCOP(val)}`;
    if (cfg.moneda === "UVR") return `Valor nominal total: ${formatNum(val)} UVR (≈ ${formatCOP(val * uvr)})`;
    return `Valor nominal total: USD ${formatNum(val)} (≈ ${formatCOP(val * trm)})`;
  }, [numBonos, cfg, uvr, trm]);

  const calcular = () => {
    const m = parseInt(periodo);
    const ind = indVal / 100;
    const mar = marVal / 100;
    const r = descVal / 100;
    let capMult = 1;
    if (serie === "D") capMult = uvr;
    if (serie === "E") capMult = trm;

    let teaAnual;
    if (serie === "A") teaAnual = (1 + ind) * (1 + mar) - 1;
    else if (serie === "C") teaAnual = Math.pow(1 + (ind + mar) / m, m) - 1;
    else teaAnual = ind;

    let iPeriodica;
    if (serie === "C") iPeriodica = (ind + mar) / m;
    else iPeriodica = Math.pow(1 + teaAnual, 1 / m) - 1;

    const totalPeriodos = plazo * m;
    const dtPeriodo = 1 / m;
    const capitalBase = cfg.nominal * numBonos;
    const flujos = [];
    let totalIntereses = 0;

    for (let i = 1; i <= totalPeriodos; i++) {
      const esUltimo = i === totalPeriodos;
      const intPeriodo = capitalBase * iPeriodica * capMult;
      const amort = esUltimo ? capitalBase * capMult : 0;
      const flujoTotal = intPeriodo + amort;
      const ti = i * dtPeriodo;
      const vp = flujoTotal / Math.pow(1 + r, ti);
      totalIntereses += intPeriodo;

      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() + Math.round((12 / m) * i));
      const fechaStr = fecha.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

      flujos.push({ i, fechaStr, capital: capitalBase * capMult, intPeriodo, amort, flujoTotal, vp, ti });
    }

    const precio = flujos.reduce((acc, f) => acc + f.vp, 0);
    const totalVP = precio;
    const dur = calcDuracion(flujos, totalVP);

    setResults({ flujos, teaAnual, precio, totalIntereses, capitalBase, capMult, m, dur, plazo, totalPeriodos, r });
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", border: "2px solid #F0F2F7", borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374169", background: "#F0F2F7", outline: "none",
  };
  const selectStyle = { ...inputStyle, appearance: "none" };
  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: 1, color: "#6B7594", marginBottom: 8,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F7FF; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; background: #0046B5; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,70,181,0.4); cursor: pointer; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes orbit { 0% { transform:rotate(0deg) translateX(30px) rotate(0deg); } 100% { transform:rotate(360deg) translateX(30px) rotate(-360deg); } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .btn-calc:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,70,181,0.5) !important; }
        .series-btn:hover { border-color: rgba(255,255,255,0.5) !important; background: rgba(255,255,255,0.15) !important; }
        .result-item:hover { transform: translateY(-3px); box-shadow: 0 4px 24px rgba(0,32,91,0.10); }
        tr:hover td { background: #F4F7FF; }
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
            <div style={{ width: 52, height: 52, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", overflow: "hidden" }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <rect width="44" height="44" rx="10" fill="#00205B" />
                <path d="M26 6L14 22H22L18 38L30 20H22L26 6Z" fill="#F5A623" stroke="#F5A623" strokeWidth="0.5" strokeLinejoin="round" />
                <circle cx="12" cy="22" r="2.5" fill="white" opacity="0.6" />
                <circle cx="32" cy="22" r="2.5" fill="white" opacity="0.6" />
                <line x1="12" y1="22" x2="16" y2="22" stroke="white" strokeWidth="1.5" opacity="0.4" />
                <line x1="28" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>
            <div style={{ color: "#fff" }}>
              <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, letterSpacing: 1, display: "block", lineHeight: 1 }}>ESSA</strong>
              <span style={{ fontSize: 11, color: "#B3CFFF", letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}>Electrificadora de Santander</span>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 18px", borderRadius: 40, fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}>
            Mercado de Valores · Colombia
          </div>
        </header>

        {/* HERO */}
        <div style={{ padding: "80px 40px 60px", textAlign: "center", color: "#fff" }} className="fade-up">
          <div style={{ display: "inline-block", background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.5)", color: "#F5A623", padding: "6px 20px", borderRadius: 40, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
            ⚡ Prospecto de Información · Febrero 2026
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px,6vw,72px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 20 }}>
            Bonos de <span style={{ color: "#F5A623" }}>Deuda Pública</span>
            <br />Interna BDPI
          </h1>
          <p style={{ fontSize: 18, color: "#B3CFFF", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Calculadora interactiva de rendimiento según el Prospecto oficial de Emisión y Colocación. Selecciona la serie que te interesa y explora los flujos de caja.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[["$200MM", "Monto Total COP"], ["5", "Series (A · B · C · D · E)"], ["1–50", "Años plazo máximo"], ["BVC", "Bolsa de Valores"]].map(([num, lbl]) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#fff" }}>{num}</div>
                <div style={{ fontSize: 12, color: "#B3CFFF", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: "0 40px 80px", maxWidth: 1300, margin: "0 auto", width: "100%" }}>

          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20, opacity: 0.7, display: "flex", alignItems: "center", gap: 10 }}>
            Selecciona la Serie del Bono
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* SERIES SELECTOR */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
            {Object.entries(SERIES_CONFIG).map(([key, val]) => (
              <button
                key={key}
                className="series-btn"
                onClick={() => { setSerie(key); setResults(null); }}
                style={{
                  padding: "12px 28px", borderRadius: 50, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: 0.5,
                  transition: "all 0.25s ease", backdropFilter: "blur(8px)",
                  display: "flex", alignItems: "center", gap: 10,
                  background: serie === key ? "#fff" : "rgba(255,255,255,0.08)",
                  color: serie === key ? "#00205B" : "#fff",
                  border: serie === key ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                  boxShadow: serie === key ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: val.color }} />
                {val.name}
              </button>
            ))}
          </div>

          <FormulaCard serie={serie} />

          {/* GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>

            {/* INPUT CARD */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,32,91,0.14)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #0046B5, #4D8FFF)" }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#00205B", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                ⚙️ Parámetros del Bono
              </div>
              <div style={{ fontSize: 13, color: "#6B7594", marginBottom: 24 }}>{cfg.name} · {cfg.moneda}</div>

              <div style={{ background: "#F4F7FF", border: "1px solid #B3CFFF", borderRadius: 12, padding: "16px 20px", marginBottom: 24, fontSize: 13, color: "#003087", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: cfg.info }} />

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>$ Número de Bonos a Suscribir</label>
                <input type="number" value={numBonos} min="1" max="10000" onChange={(e) => setNumBonos(parseInt(e.target.value) || 1)} style={inputStyle} />
                <div style={{ fontSize: 12, color: "#6B7594", marginTop: 6 }}>{getNominalDisplay()}</div>
              </div>

              <SliderField
                label={cfg.labelInd} tooltip={cfg.ttInd}
                value={indVal} onChange={setIndVal}
                min={0} max={25} step={0.1}
              />

              {cfg.labelMar && (
                <SliderField
                  label={cfg.labelMar} tooltip={cfg.ttMar}
                  value={marVal} onChange={setMarVal}
                  min={0} max={10} step={0.05}
                />
              )}

              <SliderField
                label="Plazo de Redención (Años)"
                tooltip="Entre 1 y 50 años según el Prospecto. Define la subserie del BDPI."
                value={plazo} onChange={setPlazo}
                min={1} max={50} step={1} suffix=" años"
              />

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Periodicidad de Pago de Intereses</label>
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
                  <label style={labelStyle}>Valor UVR vigente (COP)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: "#6B7594", pointerEvents: "none" }}>$</span>
                    <input type="number" value={uvr} step="0.01" min="1" onChange={(e) => setUvr(parseFloat(e.target.value) || 1)} style={{ ...inputStyle, paddingLeft: 48 }} />
                  </div>
                </div>
              )}

              {cfg.showTRM && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>TRM vigente (COP / USD)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: "#6B7594", pointerEvents: "none" }}>$</span>
                    <input type="number" value={trm} step="1" min="1" onChange={(e) => setTrm(parseFloat(e.target.value) || 1)} style={{ ...inputStyle, paddingLeft: 48 }} />
                  </div>
                </div>
              )}

              <SliderField
                label="Tasa de Descuento / Corte (r%) — E.A."
                tooltip="Tasa de mercado o Tasa de Corte (Subasta Holandesa) para valorar el precio de suscripción."
                value={descVal} onChange={setDescVal}
                min={0} max={30} step={0.1}
              />

              <button
                className="btn-calc"
                onClick={calcular}
                style={{
                  width: "100%", padding: 18,
                  background: "linear-gradient(135deg, #0046B5, #00205B)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
                  cursor: "pointer", letterSpacing: 0.5,
                  transition: "all 0.25s ease",
                  boxShadow: "0 6px 24px rgba(0,70,181,0.35)",
                  marginTop: 8,
                }}
              >
                Calcular Rendimiento →
              </button>
            </div>

            {/* RESULTS CARD */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,32,91,0.14)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #0046B5, #4D8FFF)" }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#00205B", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                📊 Vista Previa del Cálculo
              </div>
              <div style={{ fontSize: 13, color: "#6B7594", marginBottom: 24 }}>
                {results ? "Resultados calculados" : "Presiona Calcular para ver el detalle completo"}
              </div>

              {!results ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.15, filter: "grayscale(1)" }}>⚡</div>
                  <div style={{ fontSize: 15, color: "#6B7594" }}>Los resultados aparecerán aquí</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <ResultItem label="Tasa Cupón E.A." value={`${(results.teaAnual * 100).toFixed(4)}%`} sub="Efectiva Anual" variant="highlight" />
                    <ResultItem label="Precio Suscripción" value={formatCOP(results.precio / numBonos)} sub={`${(results.precio / (results.capitalBase * results.capMult) * 100).toFixed(2)}% del nominal`} variant="gold" />
                    <ResultItem label="Cupón Periódico" value={formatCOP(results.flujos[0].intPeriodo)} sub="Interés por período" />
                    <ResultItem label="Total Intereses" value={formatCOP(results.totalIntereses)} sub="Suma todos los períodos" />
                  </div>
                  <MiniChart flujos={results.flujos} serie={serie} />
                </>
              )}
            </div>
          </div>

          {/* FLOW TABLE */}
          {results && (
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,32,91,0.14)", marginTop: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #F5A623, #4D8FFF)" }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#00205B", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                📋 Tabla de Flujos de Caja
              </div>
              <div style={{ fontSize: 13, color: "#6B7594", marginBottom: 24 }}>
                Proyección completa de pagos según el Prospecto ESSA — Febrero 2026
              </div>

              <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #E8F0FF" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #00205B, #0046B5)", color: "#fff" }}>
                      {["Período", "Fecha Pago", "Saldo Capital", "Interés Período", "Amortización", "Flujo Total", "VP Flujo"].map((h) => (
                        <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.flujos.map((f) => (
                      <tr key={f.i} style={{ borderBottom: "1px solid #F4F7FF" }}>
                        <td style={{ padding: "13px 18px", color: "#003087", fontWeight: 600, fontSize: 13 }}>{getPeriodoLabel(f.i, results.m)}</td>
                        <td style={{ padding: "13px 18px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{f.fechaStr}</td>
                        <td style={{ padding: "13px 18px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{formatCOP(f.capital)}</td>
                        <td style={{ padding: "13px 18px", color: "#00B274", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{formatCOP(f.intPeriodo)}</td>
                        <td style={{ padding: "13px 18px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{f.amort > 0 ? formatCOP(f.amort) : "—"}</td>
                        <td style={{ padding: "13px 18px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{formatCOP(f.flujoTotal)}</td>
                        <td style={{ padding: "13px 18px", color: "#374169", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{formatCOP(f.vp)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#F4F7FF", fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: "13px 18px", fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#00205B" }}>TOTALES</td>
                      <td style={{ padding: "13px 18px", fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#00B274" }}>{formatCOP(results.totalIntereses)}</td>
                      <td style={{ padding: "13px 18px", fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#00205B" }}>{formatCOP(results.capitalBase * results.capMult)}</td>
                      <td style={{ padding: "13px 18px", fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#00205B" }}>{formatCOP(results.flujos.reduce((a, f) => a + f.flujoTotal, 0))}</td>
                      <td style={{ padding: "13px 18px", fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#00205B" }}>{formatCOP(results.flujos.reduce((a, f) => a + f.vp, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginTop: 24 }}>
                <ResultItem label="Capital Total" value={formatCOP(results.capitalBase * results.capMult)} sub={`${numBonos} bono(s)`} />
                <ResultItem label="Intereses Totales" value={formatCOP(results.totalIntereses)} sub={`${results.totalPeriodos} pagos`} />
                <ResultItem label="Retorno Bruto" value={`${((results.totalIntereses / (results.capitalBase * results.capMult)) * 100).toFixed(2)}%`} sub="Sobre el capital" />
                <ResultItem label="Precio Suscripción Total" value={formatCOP(results.precio)} sub={`${(results.precio / (results.capitalBase * results.capMult) * 100).toFixed(2)}% del nominal`} variant="highlight" />
                <ResultItem label="Duración Macaulay" value={results.dur.toFixed(3)} sub="años" />
                <ResultItem label="Tasa Cupón E.A." value={`${(results.teaAnual * 100).toFixed(4)}%`} sub={`Conv. ${cfg.convencion}/365`} />
                <ResultItem label="Tasa Desc. Aplicada" value={`${(results.r * 100).toFixed(2)}%`} sub="Para precio de suscripción" variant="gold" />
                <ResultItem label="Plazo Total" value={`${results.plazo} años`} sub={`${results.totalPeriodos} períodos`} />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ background: "rgba(0,32,91,0.9)", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "28px 40px", color: "#B3CFFF", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
          <strong style={{ color: "#fff" }}>Electrificadora de Santander S.A. E.S.P. — ESSA</strong><br />
          Prospecto de Información · Emisión y Colocación Bonos de Deuda Pública Interna · Febrero de 2026<br />
          Esta calculadora es de uso académico e ilustrativo. Los valores reales serán definidos en el Aviso de Oferta Pública oficial.
          Inscrito en la <strong style={{ color: "#fff" }}>Bolsa de Valores de Colombia (BVC)</strong> · Administrado por <strong style={{ color: "#fff" }}>Deceval S.A.</strong>
        </footer>
      </div>
    </div>
  );
}
