import { useState, useEffect, useRef, useCallback } from 'react'

/* ─────────────────── LOGO SVG ─────────────────── */
function EssaLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0099DD" />
          <stop offset="1" stopColor="#003366" />
        </linearGradient>
        <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FFB800" />
          <stop offset="1" stopColor="#FF8800" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#logoGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <path d="M72 22L42 62H62L50 98L82 52H60L72 22Z" fill="url(#boltGrad)" />
      <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none"/>
    </svg>
  )
}

/* ─────────────────── MATH FORMULA DISPLAY ─────────────────── */
function Formula({ label, formula, description, variables }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      background: 'rgba(0,153,221,0.06)',
      border: '1px solid rgba(0,153,221,0.2)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
    }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(0,153,221,0.5)'}
      onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(0,153,221,0.2)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--essa-sky)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{expanded ? '▲ ocultar' : '▼ ver detalle'}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1rem',
        color: 'var(--essa-white)',
        marginTop: '8px',
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        letterSpacing: '0.02em',
      }}>
        {formula}
      </div>
      {expanded && (
        <div style={{ marginTop: '12px', animation: 'fadeUp 0.3s ease' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '10px' }}>{description}</p>
          {variables && variables.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--essa-sky)', fontSize: '0.8rem', minWidth: '100px', flexShrink: 0 }}>{v.name}:</span>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', lineHeight: 1.5 }}>{v.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────── ANIMATED NUMBER ─────────────────── */
function AnimatedValue({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const end = value
    const duration = 800
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
      else { prev.current = end; setDisplay(end) }
    }
    requestAnimationFrame(animate)
  }, [value])

  const formatted = display.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return <span>{prefix}{formatted}{suffix}</span>
}

/* ─────────────────── RESULT CARD ─────────────────── */
function ResultCard({ label, value, prefix = '$', decimals = 0, highlight = false, sub }) {
  return (
    <div style={{
      background: highlight
        ? 'linear-gradient(135deg, rgba(0,153,221,0.2), rgba(0,51,102,0.3))'
        : 'rgba(255,255,255,0.04)',
      border: highlight ? '1px solid rgba(0,153,221,0.5)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      padding: '20px 24px',
      animation: 'countUp 0.5s ease',
      boxShadow: highlight ? 'var(--shadow-glow)' : 'none',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: highlight ? '1.8rem' : '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: highlight ? 'var(--essa-sky)' : 'var(--essa-white)', lineHeight: 1 }}>
        <AnimatedValue value={value} prefix={prefix} decimals={decimals} />
      </div>
      {sub && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}

/* ─────────────────── AMORTIZATION TABLE ─────────────────── */
function AmortizationTable({ rows }) {
  if (!rows || rows.length === 0) return null
  const display = rows.length > 20 ? [...rows.slice(0, 8), null, ...rows.slice(-4)] : rows

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        <thead>
          <tr style={{ background: 'rgba(0,102,204,0.25)' }}>
            {['Período', 'Fecha', 'Capital Vigente', 'Interés', 'Pago Total'].map(h => (
              <th key={h} style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--essa-sky)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((row, i) => row === null ? (
            <tr key="gap">
              <td colSpan={5} style={{ textAlign: 'center', padding: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                ··· {rows.length - 12} períodos intermedios ···
              </td>
            </tr>
          ) : (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,153,221,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
            >
              <td style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>{row.period}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem' }}>{row.date}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(255,255,255,0.85)' }}>
                {row.capital.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--essa-sky)' }}>
                {row.interest.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--essa-white)', fontWeight: 700 }}>
                {row.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: 'rgba(0,51,102,0.4)', borderTop: '1px solid rgba(0,153,221,0.3)' }}>
            <td colSpan={3} style={{ padding: '12px 14px', color: 'var(--essa-sky)', fontWeight: 700, fontSize: '0.78rem' }}>TOTAL</td>
            <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--essa-sky)', fontWeight: 700 }}>
              {rows.reduce((s, r) => s + r.interest, 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
            </td>
            <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--essa-white)', fontWeight: 800 }}>
              {rows.reduce((s, r) => s + r.total, 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/* ─────────────────── CHART (canvas-based) ─────────────────── */
function CashflowChart({ rows }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !rows || rows.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 20, bottom: 40, left: 70 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    const maxVal = Math.max(...rows.map(r => r.interest))
    const barW = Math.max(2, chartW / rows.length - 2)
    const sample = rows.length > 60 ? rows.filter((_, i) => i % Math.ceil(rows.length / 60) === 0) : rows

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke()
      const label = ((maxVal * (1 - i / 4)) / 1e6).toFixed(1)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '10px Space Mono, monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`$${label}M`, pad.left - 6, y + 4)
    }

    // Bars with gradient
    sample.forEach((row, i) => {
      const x = pad.left + (i / sample.length) * chartW
      const barH = (row.interest / maxVal) * chartH
      const y = pad.top + chartH - barH

      const grad = ctx.createLinearGradient(x, y, x, y + barH)
      grad.addColorStop(0, 'rgba(0,191,255,0.9)')
      grad.addColorStop(1, 'rgba(0,102,204,0.4)')
      ctx.fillStyle = grad
      ctx.fillRect(x, y, Math.max(1, barW), barH)
    })

    // Capital line at end
    const lastX = pad.left + chartW - 2
    ctx.strokeStyle = 'rgba(255,184,0,0.7)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath(); ctx.moveTo(lastX, pad.top); ctx.lineTo(lastX, pad.top + chartH); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(255,184,0,0.9)'
    ctx.font = 'bold 9px Space Mono, monospace'
    ctx.textAlign = 'right'
    ctx.fillText('VENCIMIENTO', lastX - 4, pad.top + 14)
  }, [rows])

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--essa-sky)', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Flujo de Intereses por Período
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '140px', display: 'block' }} />
    </div>
  )
}

/* ─────────────────── SERIES CONFIG ─────────────────── */
const SERIES_CONFIG = {
  A: {
    name: 'Serie A',
    subtitle: 'IPC + Margen (Tasa Variable)',
    color: '#0099DD',
    icon: '📈',
    currency: 'COP',
    nominalValue: 10_000_000,
    convention: 365,
    description: 'Bonos indexados al IPC. La tasa de rendimiento combina la inflación más un margen adicional determinado en la subasta.',
    formulas: [
      {
        label: 'Tasa Efectiva Anual (Serie A)',
        formula: 'TEA = (1 + IPC% E.A.) × (1 + Margen% E.A.) − 1',
        description: 'La tasa total que percibirás combina la inflación oficial del DANE más un margen fijo definido en la Oferta Pública.',
        variables: [
          { name: 'IPC% E.A.', desc: 'Índice de Precios al Consumidor anual certificado por el DANE' },
          { name: 'Margen% E.A.', desc: 'Spread adicional fijo determinado por el Ministerio de Hacienda en la subasta' },
          { name: 'TEA', desc: 'Tasa Efectiva Anual resultante que genera los cupones de interés' },
        ]
      },
      {
        label: 'Conversión Tasa Nominal',
        formula: 'TNm = [(1 + TEA)^(m/365) − 1] × (365/m)',
        description: 'La TEA se convierte a tasa nominal según la periodicidad de pago. Convención: 365/365.',
        variables: [
          { name: 'TNm', desc: 'Tasa nominal para periodicidad m (mes=30, trimestre=90, semestre=180, año=365)' },
          { name: 'TEA', desc: 'Tasa Efectiva Anual obtenida de la fórmula anterior' },
          { name: 'm', desc: 'Días del período de pago según periodicidad' },
        ]
      },
      {
        label: 'Interés del Período',
        formula: 'I = Capital × TNm × (d / 365)',
        description: 'Interés causado en el período aplicando la tasa nominal al capital vigente.',
        variables: [
          { name: 'Capital', desc: 'Valor nominal del bono ($10.000.000 por título)' },
          { name: 'TNm', desc: 'Tasa nominal del período' },
          { name: 'd', desc: 'Días reales del período de causación (convención 365/365)' },
        ]
      }
    ]
  },
  B: {
    name: 'Serie B',
    subtitle: 'Tasa Fija (Renta Fija Pura)',
    color: '#0066CC',
    icon: '🔒',
    currency: 'COP',
    nominalValue: 10_000_000,
    convention: 365,
    description: 'Bonos de tasa fija en pesos. El cupón se define en la subasta y no varía durante toda la vigencia del bono.',
    formulas: [
      {
        label: 'Tasa Cupón Fija (Serie B)',
        formula: 'TN = [(1 + TEA)^(m/365) − 1] × (365/m)',
        description: 'La tasa cupón fija en términos efectivos anuales se convierte a nominal según la periodicidad de pago. Convención 365/365.',
        variables: [
          { name: 'TEA', desc: 'Tasa Efectiva Anual fija definida por el Emisor en la Oferta Pública' },
          { name: 'TN', desc: 'Tasa Nominal equivalente para el período de pago' },
          { name: 'm', desc: 'Días del período (30, 90, 180 o 365)' },
        ]
      },
      {
        label: 'Valor Presente del Bono (Precio)',
        formula: 'P = Σ [C / (1 + r)^t] + [VN / (1 + r)^n]',
        description: 'Precio del bono en el mercado secundario. La suma de cupones descontados más el valor nominal al vencimiento.',
        variables: [
          { name: 'C', desc: 'Cupón de interés por período' },
          { name: 'r', desc: 'Tasa de descuento del mercado por período' },
          { name: 'VN', desc: 'Valor nominal ($10.000.000)' },
          { name: 'n', desc: 'Número total de períodos hasta el vencimiento' },
        ]
      },
      {
        label: 'Yield to Maturity (TIR del Bono)',
        formula: 'P = Σ C/(1+y)^t + VN/(1+y)^n',
        description: 'Tasa interna de retorno que iguala el precio actual del bono con el flujo descontado de pagos futuros.',
        variables: [
          { name: 'y', desc: 'Yield to Maturity (TIR) — se despeja numéricamente' },
          { name: 'P', desc: 'Precio actual de mercado del bono' },
        ]
      }
    ]
  },
  C: {
    name: 'Serie C',
    subtitle: 'IBR + Margen (Tasa Variable)',
    color: '#00BFFF',
    icon: '📊',
    currency: 'COP',
    nominalValue: 10_000_000,
    convention: 360,
    description: 'Bonos indexados al IBR (Indicador Bancario de Referencia). Convención 360/360.',
    formulas: [
      {
        label: 'Tasa Nominal Mensual (IBR 1M)',
        formula: 'TN N.M.V = IBR% N.M.V + Margen% N.M.V',
        description: 'Para el plazo a un mes. El IBR y el margen se expresan como tasa nominal mes vencida. Convención 360/360.',
        variables: [
          { name: 'IBR% N.M.V', desc: 'IBR plazo un mes expresado en nominal mes vencida' },
          { name: 'Margen% N.M.V', desc: 'Spread adicional en la misma expresión que el indicador' },
        ]
      },
      {
        label: 'Tasa Nominal Trimestral (IBR 3M)',
        formula: 'TN N.T.V = IBR% N.T.V + Margen% N.T.V',
        description: 'Para el plazo a tres meses. Ambos términos se expresan en nominal trimestre vencida.',
        variables: [
          { name: 'IBR% N.T.V', desc: 'IBR plazo tres meses en nominal trimestre vencida' },
          { name: 'Margen% N.T.V', desc: 'Spread determinado en la Oferta Pública' },
        ]
      },
      {
        label: 'Interés del Período (Convención 360)',
        formula: 'I = Capital × TN × (d / 360)',
        description: 'Interés causado usando la convención 360/360 (meses de 30 días exactos).',
        variables: [
          { name: 'd', desc: 'Días del período bajo convención 360 (múltiplos de 30)' },
          { name: 'TN', desc: 'Tasa nominal del período (IBR + margen)' },
        ]
      }
    ]
  },
  D: {
    name: 'Serie D',
    subtitle: 'Tasa Fija en UVR',
    color: '#4DA8FF',
    icon: '🏗️',
    currency: 'UVR',
    nominalValue: 100_000, // UVR units
    convention: 365,
    description: 'Bonos denominados en UVR (Unidad de Valor Real). El capital y los intereses se liquidan en pesos al valor vigente de la UVR al vencimiento.',
    formulas: [
      {
        label: 'Capital en Pesos (al vencimiento)',
        formula: 'Capital COP = N° UVR × UVR(fecha vencimiento)',
        description: 'El capital nominal en UVR se convierte a pesos usando el valor de la UVR publicado por el Banco de la República el día del vencimiento.',
        variables: [
          { name: 'N° UVR', desc: 'Cantidad de UVR (valor nominal = 100.000 UVR por título)' },
          { name: 'UVR(t)', desc: 'Valor en pesos de la UVR certificada por Banco de la República en la fecha t' },
        ]
      },
      {
        label: 'Interés en Pesos (período final)',
        formula: 'I = N° UVR × UVR(final periodo) × TN × (d/365)',
        description: 'El interés calculado en UVR se convierte a pesos usando el UVR del último día del período de causación.',
        variables: [
          { name: 'TN', desc: 'Tasa nominal equivalente a la TEA fija (convención 365/365)' },
          { name: 'UVR(final periodo)', desc: 'Valor de la UVR al cierre del período de intereses' },
        ]
      },
      {
        label: 'Rendimiento Real Implícito',
        formula: 'TEA Real ≈ TEA Nominal − Inflación esperada',
        description: 'Dado que la UVR ajusta el capital por inflación, el rendimiento cupón es esencialmente un rendimiento REAL sobre poder adquisitivo.',
        variables: [
          { name: 'UVR', desc: 'Ajusta por IPC — protege el capital de la inflación' },
          { name: 'TEA Nominal', desc: 'La tasa cupón ofrecida en la subasta' },
        ]
      }
    ]
  },
  E: {
    name: 'Serie E',
    subtitle: 'Tasa Fija en Dólares (USD)',
    color: '#FFB800',
    icon: '💵',
    currency: 'USD',
    nominalValue: 5_000, // USD
    convention: 365,
    description: 'Bonos denominados en dólares. Los pagos se realizan en pesos colombianos aplicando la TRM del último día del período.',
    formulas: [
      {
        label: 'Interés en Pesos (Serie E)',
        formula: 'I = Capital USD × TN(USD) × (d/365) × TRM(final periodo)',
        description: 'El cupón en dólares se calcula sobre el capital en USD y se convierte a pesos usando la TRM publicada por la SFC al cierre del período.',
        variables: [
          { name: 'Capital USD', desc: 'Capital vigente denominado en dólares (USD $5.000 por título)' },
          { name: 'TN(USD)', desc: 'Tasa nominal fija en dólares definida en la Oferta Pública' },
          { name: 'TRM(t)', desc: 'Tasa Representativa del Mercado (COP/USD) certificada por la SFC' },
          { name: 'd', desc: 'Días del período de causación' },
        ]
      },
      {
        label: 'Capital al Vencimiento en Pesos',
        formula: 'Capital COP = Capital USD × TRM(fecha vencimiento)',
        description: 'El reembolso de capital se liquida en pesos usando la TRM vigente el día del vencimiento del bono.',
        variables: [
          { name: 'TRM(vto)', desc: 'TRM del día hábil del vencimiento certificada por Superintendencia Financiera' },
        ]
      },
      {
        label: 'Rendimiento Total COP',
        formula: 'Rto Total = [(1 + TN USD) × (1 + Δ% TRM)] − 1',
        description: 'Rendimiento efectivo en pesos incluyendo la variación cambiaria. Si el dólar se aprecia, el rendimiento en COP aumenta.',
        variables: [
          { name: 'Δ% TRM', desc: 'Variación porcentual de la TRM entre fecha de compra y vencimiento' },
          { name: 'TN USD', desc: 'Tasa cupón en dólares' },
        ]
      }
    ]
  }
}

/* ─────────────────── CALCULATION ENGINE ─────────────────── */
function calcBonds({ serie, numBonds, years, periodicity, ipc, margen, ibr, uvrValue, trm }) {
  const cfg = SERIES_CONFIG[serie]
  const periodsPerYear = { MV: 12, TV: 4, SV: 2, AV: 1 }[periodicity]
  const daysPerPeriod = { MV: 30, TV: 90, SV: 180, AV: 365 }[periodicity]
  const totalPeriods = Math.round(years * periodsPerYear)
  const convention = cfg.convention

  // Capital per bond in COP
  let capitalCOP = 0
  if (serie === 'D') capitalCOP = cfg.nominalValue * uvrValue
  else if (serie === 'E') capitalCOP = cfg.nominalValue * trm
  else capitalCOP = cfg.nominalValue

  const totalCapital = capitalCOP * numBonds

  // Annual effective rate
  let tea = 0
  if (serie === 'A') tea = (1 + ipc / 100) * (1 + margen / 100) - 1
  else if (serie === 'B') tea = margen / 100 // margen = tasa fija
  else if (serie === 'C') tea = Math.pow(1 + ibr / 100 + margen / 100, periodsPerYear) - 1
  else if (serie === 'D') tea = margen / 100
  else if (serie === 'E') tea = margen / 100 // in USD

  // Nominal rate per period
  const tnPeriod = (Math.pow(1 + tea, daysPerPeriod / 365) - 1)

  // Build cashflow table
  const now = new Date()
  const rows = []
  let accInterest = 0

  for (let p = 1; p <= totalPeriods; p++) {
    const date = new Date(now)
    date.setMonth(date.getMonth() + Math.round((p * 12) / periodsPerYear))
    const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

    let interest = 0
    if (serie === 'C') {
      // 360/360
      interest = totalCapital * (ibr / 100 + margen / 100) / periodsPerYear
    } else {
      interest = totalCapital * tnPeriod
    }

    accInterest += interest
    const isLast = p === totalPeriods
    rows.push({
      period: p,
      date: dateStr,
      capital: totalCapital,
      interest: Math.round(interest),
      total: Math.round(isLast ? interest + totalCapital : interest),
    })
  }

  // Total intereses
  const totalInterest = accInterest
  // Rendimiento total
  const totalReturn = (totalInterest / totalCapital) * 100
  const tea100 = tea * 100

  // Precio (Valor Presente si tasa mercado = tea)
  const vp = totalCapital

  return {
    totalCapital,
    totalInterest: Math.round(totalInterest),
    totalReturn,
    tea: tea100,
    tnPeriod: tnPeriod * 100,
    vp: Math.round(vp),
    couponPeriod: Math.round(totalCapital * tnPeriod),
    totalPeriods,
    rows,
  }
}

/* ─────────────────── INPUT ROW ─────────────────── */
function InputRow({ label, children, hint }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>{hint}</div>}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '12px 16px',
  color: '#fff',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border 0.2s, background 0.2s',
}

/* ─────────────────── MAIN APP ─────────────────── */
export default function App() {
  const [activeSerie, setActiveSerie] = useState('B')
  const [numBonds, setNumBonds] = useState(10)
  const [years, setYears] = useState(5)
  const [periodicity, setPeriodicity] = useState('AV')
  const [ipc, setIpc] = useState(5.1)
  const [margen, setMargen] = useState(3.5)
  const [ibr, setIbr] = useState(9.75)
  const [uvrValue, setUvrValue] = useState(366.8)
  const [trm, setTrm] = useState(4250)
  const [showTable, setShowTable] = useState(false)
  const [activeTab, setActiveTab] = useState('calc') // calc | formulas | about

  const cfg = SERIES_CONFIG[activeSerie]

  const result = calcBonds({
    serie: activeSerie, numBonds, years, periodicity,
    ipc, margen, ibr, uvrValue, trm
  })

  const fmtCOP = v => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--essa-dark)' }}>

      {/* ── BACKGROUND ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '70%', height: '70%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,204,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,153,221,0.08) 0%, transparent 70%)' }} />
        {/* Grid lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── HEADER ── */}
      <header style={{ position: 'relative', zIndex: 10, background: 'rgba(10,22,40,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <EssaLogo size={44} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.08em', color: 'white' }}>
                ESSA
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Electrificadora de Santander
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {[['calc', '⚡ Calculadora'], ['formulas', '∑ Fórmulas'], ['about', 'ℹ Sobre la Emisión']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: activeTab === key ? 'rgba(0,153,221,0.2)' : 'transparent',
                  color: activeTab === key ? 'var(--essa-sky)' : 'rgba(255,255,255,0.5)',
                  outline: activeTab === key ? '1px solid rgba(0,153,221,0.4)' : '1px solid transparent',
                }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      {activeTab === 'calc' && (
        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '64px 40px 40px' }}>
          <div style={{ display: 'inline-block', padding: '6px 20px', background: 'rgba(0,153,221,0.12)', border: '1px solid rgba(0,153,221,0.25)', borderRadius: '100px', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--essa-sky)', letterSpacing: '0.1em' }}>
              ● EMISIÓN BDPI 2026 · AAA (COL) · FITCH RATINGS · $200.000 MM
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px', background: 'linear-gradient(135deg, #fff 0%, rgba(0,153,221,0.9) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Calculadora de Bonos<br />de Deuda Pública Interna
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7, fontWeight: 300 }}>
            Simula el rendimiento de las 5 series de bonos ESSA con las fórmulas exactas del Prospecto de Información registrado ante la Superintendencia Financiera de Colombia.
          </p>
        </div>
      )}

      {/* ── TABS CONTENT ── */}
      <main style={{ position: 'relative', zIndex: 5, maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ══════════ CALCULATOR ══════════ */}
        {activeTab === 'calc' && (
          <>
            {/* Series Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.entries(SERIES_CONFIG).map(([key, s]) => (
                <button key={key} onClick={() => setActiveSerie(key)}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '14px',
                    border: activeSerie === key ? `2px solid ${s.color}` : '2px solid rgba(255,255,255,0.1)',
                    background: activeSerie === key ? `rgba(${parseInt(s.color.slice(1, 3), 16)},${parseInt(s.color.slice(3, 5), 16)},${parseInt(s.color.slice(5, 7), 16)},0.15)` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    textAlign: 'left',
                    minWidth: '150px',
                    boxShadow: activeSerie === key ? `0 0 24px rgba(${parseInt(s.color.slice(1, 3), 16)},${parseInt(s.color.slice(3, 5), 16)},${parseInt(s.color.slice(5, 7), 16)},0.3)` : 'none',
                  }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeSerie === key ? s.color : 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', lineHeight: 1.3 }}>{s.subtitle}</div>
                </button>
              ))}
            </div>

            {/* Selected serie info */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `rgba(${parseInt(cfg.color.slice(1, 3), 16)},${parseInt(cfg.color.slice(3, 5), 16)},${parseInt(cfg.color.slice(5, 7), 16)},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {cfg.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: cfg.color, fontSize: '0.9rem', marginBottom: '4px' }}>{cfg.name} — {cfg.subtitle}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{cfg.description}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Valor nominal</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: cfg.color, fontWeight: 700 }}>
                  {cfg.currency === 'COP' ? `$${cfg.nominalValue.toLocaleString('es-CO')}` : cfg.currency === 'UVR' ? `${cfg.nominalValue.toLocaleString('es-CO')} UVR` : `USD $${cfg.nominalValue.toLocaleString('en-US')}`}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Conv. {cfg.convention}/año</div>
              </div>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>

              {/* ── LEFT: Inputs ── */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', color: cfg.color, marginBottom: '24px', textTransform: 'uppercase' }}>
                  ⚙ Parámetros de Inversión
                </div>

                <InputRow label="Número de Bonos" hint={`Inversión mínima: 1 bono · Valor nominal: ${cfg.currency === 'COP' ? '$10.000.000 COP' : cfg.currency === 'UVR' ? '100.000 UVR' : 'USD $5.000'}`}>
                  <input type="number" min={1} max={10000} value={numBonds}
                    onChange={e => setNumBonds(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ ...inputStyle }} />
                  <input type="range" min={1} max={100} value={Math.min(numBonds, 100)}
                    onChange={e => setNumBonds(parseInt(e.target.value))}
                    style={{ marginTop: '8px' }} />
                </InputRow>

                <InputRow label="Plazo (años)" hint="Entre 1 y 50 años según el Prospecto">
                  <input type="number" min={1} max={50} value={years}
                    onChange={e => setYears(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    style={{ ...inputStyle }} />
                  <input type="range" min={1} max={50} value={years}
                    onChange={e => setYears(parseInt(e.target.value))}
                    style={{ marginTop: '8px' }} />
                </InputRow>

                <InputRow label="Periodicidad de Pago">
                  <div style={{ position: 'relative' }}>
                    <select value={periodicity} onChange={e => setPeriodicity(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer', paddingRight: '36px' }}>
                      <option value="MV">Mes Vencido (MV)</option>
                      <option value="TV">Trimestre Vencido (TV)</option>
                      <option value="SV">Semestre Vencido (SV)</option>
                      <option value="AV">Año Vencido (AV)</option>
                    </select>
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>▼</span>
                  </div>
                </InputRow>

                {/* Conditional rate inputs */}
                {activeSerie === 'A' && <>
                  <InputRow label="IPC anual % (DANE)" hint="Último dato oficial certificado por el DANE">
                    <input type="number" step={0.01} value={ipc} onChange={e => setIpc(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={20} step={0.1} value={ipc} onChange={e => setIpc(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                  <InputRow label="Margen adicional % E.A." hint="Spread sobre el IPC definido en la subasta">
                    <input type="number" step={0.01} value={margen} onChange={e => setMargen(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={15} step={0.1} value={margen} onChange={e => setMargen(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                </>}

                {activeSerie === 'B' && (
                  <InputRow label="Tasa Cupón Fija % E.A." hint="Tasa efectiva anual definida en la Oferta Pública">
                    <input type="number" step={0.01} value={margen} onChange={e => setMargen(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={25} step={0.1} value={margen} onChange={e => setMargen(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                )}

                {activeSerie === 'C' && <>
                  <InputRow label="IBR % (Banco de la República)" hint="IBR vigente a la fecha de inicio del período">
                    <input type="number" step={0.01} value={ibr} onChange={e => setIbr(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={20} step={0.1} value={ibr} onChange={e => setIbr(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                  <InputRow label="Margen adicional %" hint="Spread sobre el IBR">
                    <input type="number" step={0.01} value={margen} onChange={e => setMargen(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={10} step={0.1} value={margen} onChange={e => setMargen(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                </>}

                {activeSerie === 'D' && <>
                  <InputRow label="Tasa Cupón Fija % E.A." hint="TEA en UVR definida en la Oferta Pública">
                    <input type="number" step={0.01} value={margen} onChange={e => setMargen(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={15} step={0.1} value={margen} onChange={e => setMargen(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                  <InputRow label="Valor UVR actual (COP)" hint="Publicado por el Banco de la República">
                    <input type="number" step={0.01} value={uvrValue} onChange={e => setUvrValue(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                  </InputRow>
                </>}

                {activeSerie === 'E' && <>
                  <InputRow label="Tasa Cupón Fija % (USD)" hint="TEA en dólares definida en la Oferta Pública">
                    <input type="number" step={0.01} value={margen} onChange={e => setMargen(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                    <input type="range" min={0} max={15} step={0.1} value={margen} onChange={e => setMargen(parseFloat(e.target.value))} style={{ marginTop: '8px' }} />
                  </InputRow>
                  <InputRow label="TRM actual (COP/USD)" hint="Certificada por la Superintendencia Financiera">
                    <input type="number" step={1} value={trm} onChange={e => setTrm(parseFloat(e.target.value) || 0)} style={{ ...inputStyle }} />
                  </InputRow>
                </>}
              </div>

              {/* ── RIGHT: Results ── */}
              <div>
                {/* Key results */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
                  <ResultCard label="Capital Invertido Total" value={result.totalCapital} prefix="$" decimals={0} highlight />
                  <ResultCard label="Total Intereses a Recibir" value={result.totalInterest} prefix="$" decimals={0} />
                  <ResultCard label={`Cupón por Período (${numBonds} bonos)`} value={result.couponPeriod} prefix="$" decimals={0} sub={`Cada ${periodicity === 'MV' ? 'mes' : periodicity === 'TV' ? 'trimestre' : periodicity === 'SV' ? 'semestre' : 'año'}`} />
                  <ResultCard label="Rendimiento Total Acumulado" value={result.totalReturn} prefix="" decimals={2} suffix="%" sub={`TEA: ${result.tea.toFixed(4)}%`} />
                </div>

                {/* Rate display */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                    Descomposición de Tasas
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'TEA', value: result.tea.toFixed(4) + '%', color: cfg.color },
                      { label: `TN ${periodicity}`, value: result.tnPeriod.toFixed(4) + '%', color: '#fff' },
                      { label: 'Períodos', value: result.totalPeriods, color: 'rgba(255,255,255,0.6)' },
                      { label: 'Conv.', value: `${cfg.convention}/${cfg.convention}`, color: 'rgba(255,255,255,0.6)' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div style={{ marginBottom: '20px' }}>
                  <CashflowChart rows={result.rows} />
                </div>

                {/* Summary bar */}
                <div style={{ background: `linear-gradient(135deg, rgba(${parseInt(cfg.color.slice(1, 3), 16)},${parseInt(cfg.color.slice(3, 5), 16)},${parseInt(cfg.color.slice(5, 7), 16)},0.12), rgba(0,51,102,0.2))`, border: `1px solid rgba(${parseInt(cfg.color.slice(1, 3), 16)},${parseInt(cfg.color.slice(3, 5), 16)},${parseInt(cfg.color.slice(5, 7), 16)},0.25)`, borderRadius: '16px', padding: '20px 24px', marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    Resumen de Inversión — {numBonds} Bono{numBonds > 1 ? 's' : ''} {cfg.name} a {years} año{years > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 2 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Capital: </span><span style={{ color: 'white' }}>{fmtCOP(result.totalCapital)}</span>
                    <span style={{ margin: '0 12px', color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Intereses: </span><span style={{ color: cfg.color }}>+{fmtCOP(result.totalInterest)}</span>
                    <span style={{ margin: '0 12px', color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total recibido: </span><span style={{ color: 'white', fontWeight: 700 }}>{fmtCOP(result.totalCapital + result.totalInterest)}</span>
                  </div>
                </div>

                {/* Toggle table */}
                <button onClick={() => setShowTable(!showTable)}
                  style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.06em' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  {showTable ? '▲ Ocultar' : '▼ Ver'} Tabla de Amortización ({result.totalPeriods} períodos)
                </button>
                {showTable && <div style={{ marginTop: '16px' }}><AmortizationTable rows={result.rows} /></div>}
              </div>
            </div>
          </>
        )}

        {/* ══════════ FORMULAS ══════════ */}
        {activeTab === 'formulas' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', padding: '48px 0 40px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '12px', background: 'linear-gradient(135deg, #fff, var(--essa-sky))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Marco Matemático de los BDPI
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
                Fórmulas exactas del Prospecto de Información registrado ante la Superintendencia Financiera de Colombia — Febrero 2026.
              </p>
            </div>

            {Object.entries(SERIES_CONFIG).map(([key, s]) => (
              <div key={key} style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `rgba(${parseInt(s.color.slice(1, 3), 16)},${parseInt(s.color.slice(3, 5), 16)},${parseInt(s.color.slice(5, 7), 16)},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.name} — {s.subtitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                      VN: {s.currency === 'COP' ? `$${s.nominalValue.toLocaleString('es-CO')} COP` : s.currency === 'UVR' ? `${s.nominalValue.toLocaleString('es-CO')} UVR` : `USD $${s.nominalValue.toLocaleString('en-US')}`} · Conv: {s.convention}/año
                    </div>
                  </div>
                </div>
                {s.formulas.map((f, i) => (
                  <Formula key={i} {...f} />
                ))}
              </div>
            ))}

            {/* General formulas */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px', marginTop: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--essa-sky)', marginBottom: '16px' }}>
                Fórmulas Generales de Valoración
              </div>
              <Formula
                label="Precio de Mercado (Valor Presente)"
                formula="P = Σ[t=1 to n] C/(1+y)^t + VN/(1+y)^n"
                description="El precio justo de un bono es la suma de sus flujos de caja futuros descontados a la tasa de rendimiento del mercado. Cuando y > tasa cupón, el bono se transa a descuento (P < VN). Cuando y < tasa cupón, se transa a prima (P > VN)."
                variables={[
                  { name: 'P', desc: 'Precio actual del bono (puede ser diferente al valor nominal)' },
                  { name: 'C', desc: 'Cupón periódico de interés' },
                  { name: 'y', desc: 'Yield to Maturity (tasa de rendimiento del mercado por período)' },
                  { name: 'VN', desc: 'Valor nominal del bono (monto a recibir al vencimiento)' },
                  { name: 'n', desc: 'Número de períodos hasta el vencimiento' },
                ]}
              />
              <Formula
                label="Duración de Macaulay"
                formula="D = Σ[t=1 to n] [t × C/(1+y)^t] / P + [n × VN/(1+y)^n] / P"
                description="Mide la sensibilidad del precio del bono a cambios en las tasas de interés. Un bono con mayor duración tiene mayor riesgo de tasa de interés. Para los BDPI ESSA con amortización única al vencimiento, la duración es máxima."
                variables={[
                  { name: 'D', desc: 'Duración de Macaulay expresada en períodos' },
                  { name: 't', desc: 'Tiempo en períodos de cada flujo de caja' },
                ]}
              />
              <Formula
                label="Duración Modificada (Sensibilidad al precio)"
                formula="DM = D / (1 + y)"
                description="Estima el cambio porcentual aproximado en el precio del bono ante un cambio de 1% en la tasa de mercado. ΔP/P ≈ −DM × Δy"
                variables={[
                  { name: 'DM', desc: 'Duración Modificada — medida de riesgo de tasa de interés' },
                  { name: 'Δy', desc: 'Cambio en la tasa de rendimiento del mercado (ej: 0.01 = 100 bps)' },
                ]}
              />
            </div>
          </div>
        )}

        {/* ══════════ ABOUT ══════════ */}
        {activeTab === 'about' && (
          <div style={{ animation: 'fadeUp 0.4s ease', maxWidth: '800px', margin: '0 auto', paddingTop: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              <EssaLogo size={72} />
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'white', lineHeight: 1.1 }}>Electrificadora de<br />Santander S.A. E.S.P.</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--essa-sky)', marginTop: '8px' }}>NIT: 890.201.230-1 · Bucaramanga, Colombia</div>
              </div>
            </div>

            {[
              { title: 'La Emisión', content: 'ESSA emite Bonos de Deuda Pública Interna (BDPI) por un monto total de $200.000.000.000 (doscientos mil millones de pesos). Calificación AAA (col) otorgada por Fitch Ratings Colombia — la más alta calificación posible, que refleja la solidez financiera del Emisor.' },
              { title: 'Las 5 Series', content: '• Serie A: Variable — IPC + Margen (protección inflacionaria en pesos)\n• Serie B: Fija en COP (tasa fija predecible, ideal para inversores conservadores)\n• Serie C: Variable — IBR + Margen (referenciada a tasas bancarias de corto plazo)\n• Serie D: Fija en UVR (protección inflacionaria con ajuste por poder adquisitivo)\n• Serie E: Fija en USD pagadera en COP (exposición cambiaria controlada)' },
              { title: 'Plazos y Amortización', content: 'Los bonos tienen plazos entre 1 y 50 años. La amortización de capital es única al vencimiento (bullet payment). Los intereses se pagan de forma periódica según la periodicidad establecida: mes vencido, trimestre vencido, semestre vencido o año vencido.' },
              { title: 'Mercado y Registro', content: 'Los BDPI se inscriben en el Registro Nacional de Valores y Emisores (RNVE) y en la Bolsa de Valores de Colombia (BVC). Son administrados por Deceval S.A. en forma desmaterializada. El Representante Legal de Tenedores es Fiduciaria Central S.A.' },
              { title: 'Estructurador', content: 'Corredores Davivienda S.A. Comisionista de Bolsa actúa como Estructurador y Agente Líder Colocador. La información financiera del prospecto está actualizada al 30 de septiembre de 2025.' },
            ].map((section, i) => (
              <div key={i} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--essa-sky)', fontSize: '0.9rem', marginBottom: '12px', letterSpacing: '0.04em' }}>{section.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.87rem', lineHeight: 1.8, whiteSpace: 'pre-line', fontWeight: 300 }}>{section.content}</div>
              </div>
            ))}

            <div style={{ background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.25)', borderRadius: '12px', padding: '16px 20px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              ⚠ <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Aviso legal:</strong> Esta calculadora es de carácter educativo e ilustrativo. Los resultados son estimaciones con base en las fórmulas del Prospecto de Información de ESSA (Febrero 2026). La inscripción de los BDPI en el RNVE y la autorización de la oferta pública no implican calificación ni responsabilidad por parte de la Superintendencia Financiera de Colombia. Consulte el Prospecto oficial en www.essa.com.co antes de invertir.
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 5, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <EssaLogo size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            ESSA · Emisión BDPI 2026 · Mercado Principal BVC
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
          AAA (col) · Fitch Ratings · $200.000MM COP · www.essa.com.co
        </div>
      </footer>
    </div>
  )
}