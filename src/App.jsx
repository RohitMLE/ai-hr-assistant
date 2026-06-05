import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  Shield, AlertTriangle, CheckCircle2, Zap, BarChart3,
  Clock, FileText, Sparkles, ChevronRight, Copy, X,
  Activity, Cpu, TrendingUp, Lock
} from 'lucide-react'
import './App.css'

/* ─── Data ──────────────────────────────────────────────────────────────── */
const LABEL_META = {
  GENDER:             { icon: '⚧',   color: '#ff6eb4', glow: 'rgba(255,110,180,0.3)',  name: 'Gender Bias' },
  RACIAL:             { icon: '✊',   color: '#ff6b35', glow: 'rgba(255,107,53,0.3)',   name: 'Racial Bias' },
  AGE:                { icon: '🎂',   color: '#ffd93d', glow: 'rgba(255,217,61,0.3)',   name: 'Age Bias' },
  DISABILITY:         { icon: '♿',   color: '#00d4ff', glow: 'rgba(0,212,255,0.3)',    name: 'Disability' },
  RELIGIOUS:          { icon: '🕌',  color: '#b47cff', glow: 'rgba(180,124,255,0.3)',  name: 'Religious Bias' },
  SOCIOECONOMIC:      { icon: '💰',  color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)',  name: 'Socioeconomic' },
  NATIONALITY:        { icon: '🌍',  color: '#34d399', glow: 'rgba(52,211,153,0.3)',   name: 'Nationality Bias' },
  SEXUAL_ORIENTATION: { icon: '🏳️‍🌈', color: '#f472b6', glow: 'rgba(244,114,182,0.3)',  name: 'Sexual Orientation' },
  APPEARANCE:         { icon: '👤',  color: '#a78bfa', glow: 'rgba(167,139,250,0.3)',  name: 'Appearance Bias' },
  STEREOTYPE:         { icon: '🔁',  color: '#fbbf24', glow: 'rgba(251,191,36,0.3)',   name: 'Stereotype' },
  TOXICITY:           { icon: '☣',  color: '#f87171', glow: 'rgba(248,113,113,0.3)',  name: 'Toxicity' },
  HATE_SPEECH:        { icon: '🚫',  color: '#ef4444', glow: 'rgba(239,68,68,0.3)',    name: 'Hate Speech' },
  POLITICAL:          { icon: '🗳',  color: '#60a5fa', glow: 'rgba(96,165,250,0.3)',   name: 'Political Bias' },
  MEDIA_FRAMING:      { icon: '📰',  color: '#818cf8', glow: 'rgba(129,140,248,0.3)',  name: 'Media Framing' },
  NO_BIAS:            { icon: '✅',  color: '#10d980', glow: 'rgba(16,217,128,0.3)',   name: 'No Bias' },
}

const LEGAL_REFS = {
  GENDER: 'Equality Act 2010 / Title VII', RACIAL: 'Race Relations Act / Title VII',
  AGE: 'ADEA / Equality Act 2010', DISABILITY: 'ADA / Equality Act 2010',
  RELIGIOUS: 'Title VII / Human Rights Act', SOCIOECONOMIC: 'EHRC Guidance',
  NATIONALITY: 'Immigration & Nationality Act', SEXUAL_ORIENTATION: 'Equality Act 2010',
  APPEARANCE: 'EHRC Guidance', STEREOTYPE: 'EEOC Guidelines',
  TOXICITY: 'Workplace Harassment Law', HATE_SPEECH: 'Public Order Act',
  POLITICAL: 'NLRA', MEDIA_FRAMING: 'FTC / Media Ethics',
}

const SAMPLES = [
  { label: 'Performance Review — Age Bias', type: 'Performance Review', tag: 'AGE',
    text: 'David brings historical knowledge to the team but struggles to adapt to modern tools and agile practices. At his stage of career, we question whether the investment in upskilling makes business sense. Younger colleagues seem to pick things up more quickly.' },
  { label: 'Job Description — Gender Bias', type: 'Job Description', tag: 'GENDER',
    text: 'We are looking for a rockstar developer who thrives in a fast-paced, aggressive environment. The ideal candidate is a recent graduate with no family commitments who can work long hours and be available on weekends.' },
  { label: 'Interview Feedback — Racial Bias', type: 'Interview Feedback', tag: 'RACIAL',
    text: 'Raj continues to perform well technically — as expected from someone with his background. However, his communication style is sometimes difficult to follow and we worry about his ability to present to Western clients effectively.' },
  { label: 'Company Policy — Disability Bias', type: 'Company Policy', tag: 'DISABILITY',
    text: 'Employees are expected to maintain full attendance at all times. Persistent absence, including absence related to ongoing health conditions, will be treated as a performance issue subject to disciplinary procedure.' },
  { label: 'Clean Document — No Bias', type: 'Performance Review', tag: 'CLEAN',
    text: 'James delivered exceptional results this quarter, exceeding his OKRs by 20%. He proactively identified a critical infrastructure gap and led the remediation project end-to-end. He communicates clearly and is a strong collaborator across teams.' },
]

const DOC_TYPES = ['Job Description','Performance Review','Interview Feedback','Company Policy','Internal Communication','Other']

/* ─── Animated Counter ──────────────────────────────────────────────────── */
function AnimatedNumber({ value, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0; const end = value; const dur = 1200
    const step = (timestamp) => {
      if (!start) start = timestamp
      const p = Math.min((timestamp - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(+(end * ease).toFixed(decimals))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <>{display.toFixed(decimals)}{suffix}</>
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}0a 0%, var(--bg3) 60%)`,
        border: `1px solid ${color}25`,
        borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div className="shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 16 }} />
      <div style={{ background: `${color}20`, borderRadius: 12, padding: 10, flexShrink: 0, position: 'relative' }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

/* ─── Hero Canvas (particle network) ────────────────────────────────────── */
function HeroCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#6c8fff','#c084fc','#f472b6','#00e5a0','#ff6b35','#ffd93d']
    const count  = 55
    const pts = Array.from({ length: count }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r:  Math.random() * 2.5 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
    }))

    let beamX = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      beamX = (beamX + 1.2) % (canvas.width + 120)

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.18
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(108,143,255,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      pts.forEach(p => {
        const dist = Math.abs(p.x - beamX)
        if (dist < 60) {
          const intensity = 1 - dist / 60
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r + intensity * 5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(108,143,255,${intensity * 0.25})`
          ctx.fill()
        }
      })

      const grad = ctx.createLinearGradient(beamX - 60, 0, beamX + 60, 0)
      grad.addColorStop(0,   'rgba(108,143,255,0)')
      grad.addColorStop(0.5, 'rgba(108,143,255,0.07)')
      grad.addColorStop(1,   'rgba(108,143,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(beamX - 60, 0, 120, canvas.height)

      pts.forEach(p => {
        p.pulse += 0.035
        const scale = 1 + Math.sin(p.pulse) * 0.18

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * scale * 3.5, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '18'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * scale, 0, Math.PI * 2)
        ctx.fillStyle = p.color + 'cc'
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      ctx.save()
      pts.slice(0, 6).forEach((p, i) => {
        const progress = (Date.now() * 0.0006 + i * 0.18) % 1
        const sx = progress * canvas.width
        const alpha = Math.sin(progress * Math.PI) * 0.5
        ctx.beginPath()
        ctx.moveTo(sx, canvas.height - 6 - i * 4)
        ctx.lineTo(sx + 28, canvas.height - 6 - i * 4)
        ctx.strokeStyle = COLORS[i] + Math.round(alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
      ctx.restore()

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

/* ─── Premium Empty State Illustration ──────────────────────────────────── */
function ScanIllustration() {
  const nodes = [
    { cx: 160, cy: 80,  r: 6,  color: '#6c8fff', delay: 0 },
    { cx: 290, cy: 60,  r: 5,  color: '#c084fc', delay: 0.2 },
    { cx: 380, cy: 110, r: 7,  color: '#f472b6', delay: 0.4 },
    { cx: 80,  cy: 160, r: 5,  color: '#00e5a0', delay: 0.1 },
    { cx: 220, cy: 150, r: 8,  color: '#6c8fff', delay: 0.3 },
    { cx: 340, cy: 185, r: 5,  color: '#c084fc', delay: 0.5 },
    { cx: 440, cy: 145, r: 6,  color: '#ff7a3d', delay: 0.6 },
    { cx: 120, cy: 250, r: 5,  color: '#f472b6', delay: 0.2 },
    { cx: 260, cy: 270, r: 6,  color: '#00e5a0', delay: 0.4 },
    { cx: 390, cy: 260, r: 5,  color: '#6c8fff', delay: 0.3 },
  ]
  const edges = [
    [0,1],[1,2],[0,4],[1,4],[2,6],[3,4],[4,5],[5,6],[3,7],[7,8],[8,9],[5,9],[4,8],[6,9],[1,5],
  ]
  const labels = ['GENDER','AGE','RACIAL','DISABILITY','RELIGIOUS','STEREOTYPE']
  const labelColors = ['#ff6eb4','#ffd93d','#ff6b35','#00d4ff','#b47cff','#fbbf24']

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
      <svg viewBox="0 0 520 330" style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#6c8fff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#050811" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <ellipse cx="260" cy="165" rx="220" ry="140" fill="url(#bgGrad)" />
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 48 + 8} cy={row * 44 + 8} r="1" fill="rgba(108,143,255,0.12)" />
          ))
        )}
        {edges.map(([a, b], i) => (
          <motion.line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
            stroke="rgba(108,143,255,0.18)" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.04, duration: 0.6 }}
          />
        ))}
        {[1, 1.8, 2.6].map((s, i) => (
          <motion.circle key={i} cx={nodes[4].cx} cy={nodes[4].cy} r={16}
            fill="none" stroke="#6c8fff" strokeWidth="1"
            initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: s, opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
            style={{ transformOrigin: `${nodes[4].cx}px ${nodes[4].cy}px` }}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <motion.circle cx={n.cx} cy={n.cy} r={n.r + 4} fill={n.color} opacity="0.12"
              initial={{ scale: 0 }} animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: n.delay + 0.8, ease: 'easeInOut' }}
              style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
            />
            <motion.circle cx={n.cx} cy={n.cy} r={n.r} fill={n.color} filter="url(#glow)"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: n.delay + 0.3, duration: 0.5, type: 'spring', stiffness: 200 }}
              style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
            />
          </g>
        ))}
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7, type: 'spring' }} style={{ transformOrigin: '220px 150px' }}
        >
          <rect x="192" y="122" width="56" height="56" rx="16" fill="rgba(108,143,255,0.12)" stroke="rgba(108,143,255,0.3)" strokeWidth="1" />
          <path d="M220 133 L234 139 L234 153 C234 161 220 167 220 167 C220 167 206 161 206 153 L206 139 Z"
            fill="none" stroke="#6c8fff" strokeWidth="1.5" strokeLinejoin="round" />
          <motion.path d="M214 150 L218 154 L227 145" fill="none" stroke="#00e5a0" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.2, duration: 0.5 }}
          />
        </motion.g>
        {[
          { x: 18, y: 95, w: 68, h: 82, color: '#6c8fff', label: 'JD', delay: 0.6 },
          { x: 430, y: 75, w: 72, h: 90, color: '#c084fc', label: 'PR', delay: 0.8 },
          { x: 20, y: 215, w: 65, h: 78, color: '#00e5a0', label: 'IF', delay: 1.0 },
          { x: 432, y: 200, w: 68, h: 84, color: '#f472b6', label: 'CP', delay: 1.2 },
        ].map((card, i) => (
          <motion.g key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{ opacity: { delay: card.delay, duration: 0.5 }, y: { duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: card.delay } }}
          >
            <rect x={card.x} y={card.y} width={card.w} height={card.h} rx="10" fill="rgba(255,255,255,0.03)" stroke={card.color + '30'} strokeWidth="1" />
            {[0,1,2,3].map(j => (
              <rect key={j} x={card.x + 10} y={card.y + 18 + j * 13} width={card.w - 20} height="4"
                rx="2" fill={j === 0 ? card.color + '60' : 'rgba(255,255,255,0.06)'} />
            ))}
            <rect x={card.x + 8} y={card.y + 7} width={24} height={9} rx="3" fill={card.color + '30'} />
            <text x={card.x + 20} y={card.y + 14.5} textAnchor="middle" fill={card.color}
              style={{ fontSize: 6, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{card.label}</text>
          </motion.g>
        ))}
        <motion.line x1="70" y1="0" x2="70" y2="330" stroke="url(#scanBeam)" strokeWidth="60"
          initial={{ x: -100 }} animate={{ x: 600 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
        />
        <defs>
          <linearGradient id="scanBeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6c8fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#6c8fff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#6c8fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0,1,2,3,4].map((i) => (
          <motion.rect key={i} x={80 + i * 72} y={300} height={3} rx={1.5}
            fill={['#6c8fff','#c084fc','#00e5a0','#f472b6','#ff7a3d'][i]}
            initial={{ width: 0, opacity: 0 }} animate={{ width: [0, 40 + i * 8, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 1 + i * 0.25, ease: 'easeInOut' }}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}>
        {labels.map((l, i) => (
          <motion.div key={l} initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.5 + i * 0.1, type: 'spring', stiffness: 200 }}
            style={{ fontSize: 9, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: labelColors[i] + '18', color: labelColors[i], border: `1px solid ${labelColors[i]}35`, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
          >{l}</motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
          style={{ fontSize: 9, color: 'var(--text3)', padding: '3px 10px', fontFamily: 'var(--font-mono)' }}
        >+9 more</motion.div>
      </div>
    </div>
  )
}

/* ─── Confidence Bar ────────────────────────────────────────────────────── */
function ConfBar({ value, color, delay = 0 }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, height: 8, overflow: 'hidden', position: 'relative' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay }}
        style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${color}cc, ${color})`, boxShadow: pct > 60 ? `0 0 10px ${color}60` : 'none', position: 'relative' }}
      >
        {pct > 50 && <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '100%', background: 'white', opacity: 0.6, borderRadius: 2, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />}
      </motion.div>
    </div>
  )
}

/* ─── Label Result Card ──────────────────────────────────────────────────── */
function LabelCard({ label, score, fired, index = 0 }) {
  const meta = LABEL_META[label] || { icon: '?', color: '#94a3b8', glow: 'transparent', name: label }
  const pct  = Math.round(score * 100)
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: fired ? -20 : 0, y: fired ? 0 : 5 }}
      animate={{ opacity: fired ? 1 : 0.35, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: fired ? `linear-gradient(135deg, ${meta.color}12 0%, ${meta.color}06 100%)` : 'rgba(255,255,255,0.015)',
        border: `1px solid ${fired ? meta.color + '35' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: 12, padding: '12px 14px', transition: 'all 0.2s',
        boxShadow: fired && hovered ? `0 4px 20px ${meta.glow}` : 'none',
        transform: fired && hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: fired ? 8 : 6 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{meta.icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: fired ? 700 : 500, color: fired ? meta.color : 'var(--text3)', fontFamily: 'var(--font-body)', letterSpacing: '-0.1px' }}>{meta.name}</span>
        <motion.span key={pct} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          style={{ fontSize: 12, fontWeight: 600, color: fired ? meta.color : 'var(--text3)', fontFamily: 'var(--font-mono)' }}
        >{pct}%</motion.span>
      </div>
      <ConfBar value={score} color={meta.color} delay={index * 0.06} />
      {fired && LEGAL_REFS[label] && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ delay: index * 0.06 + 0.3 }}
          style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <Lock size={10} color="var(--text3)" />{LEGAL_REFS[label]}
        </motion.div>
      )}
    </motion.div>
  )
}

/* ─── Scanning Overlay ───────────────────────────────────────────────────── */
function ScanEffect() {
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(79,142,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.04) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
      <motion.div initial={{ top: '-4px' }} animate={{ top: '104%' }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #4f8ef7, #7eb3ff, #4f8ef7, transparent)', boxShadow: '0 0 20px #4f8ef7, 0 0 40px #4f8ef780', filter: 'blur(0.5px)' }}
      />
      {[
        { top: 12, left: 12, borderTop: '2px solid #4f8ef7', borderLeft: '2px solid #4f8ef7' },
        { top: 12, right: 12, borderTop: '2px solid #4f8ef7', borderRight: '2px solid #4f8ef7' },
        { bottom: 12, left: 12, borderBottom: '2px solid #4f8ef7', borderLeft: '2px solid #4f8ef7' },
        { bottom: 12, right: 12, borderBottom: '2px solid #4f8ef7', borderRight: '2px solid #4f8ef7' },
      ].map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }} style={{ position: 'absolute', width: 16, height: 16, ...s }}
        />
      ))}
    </div>
  )
}

/* ─── Ambient background orbs ───────────────────────────────────────────── */
function AmbientOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {[
        { x: '15%', y: '20%', color: '#4f8ef730', size: 500 },
        { x: '80%', y: '60%', color: '#b47cff20', size: 400 },
        { x: '50%', y: '80%', color: '#10d98018', size: 350 },
      ].map((orb, i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
          style={{ position: 'absolute', left: orb.x, top: orb.y, width: orb.size, height: orb.size, background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`, transform: 'translate(-50%, -50%)', filter: 'blur(1px)' }}
        />
      ))}
    </div>
  )
}

/* ─── Explanation Panel ─────────────────────────────────────────────────── */
const SECTION_META = [
  { key: 'BIASED PHRASES',    icon: '🔍', color: '#6c8fff' },
  { key: 'WHY IT IS BIASED',  icon: '💡', color: '#fbbf24' },
  { key: 'LEGAL RISK',        icon: '⚖️',  color: '#ff6b6b' },
  { key: 'SUGGESTED REWRITE', icon: '✍️',  color: '#10d980' },
]

function parseExplanationSections(raw) {
  const cleaned = raw.replace(/\*\*/g, '')
  const sections = []
  SECTION_META.forEach(({ key, icon, color }, idx) => {
    const numKey1 = `${idx + 1}. ${key}`
    const numKey2 = `${idx + 1}.${key}`
    let start = cleaned.indexOf(numKey1)
    if (start === -1) start = cleaned.indexOf(numKey2)
    if (start === -1) return
    const nextStart = SECTION_META.slice(idx + 1).reduce((acc, sm, i) => {
      const nk = `${idx + i + 2}. ${sm.key}`
      const pos = cleaned.indexOf(nk)
      return pos !== -1 && (acc === -1 || pos < acc) ? pos : acc
    }, -1)
    const body = nextStart === -1 ? cleaned.slice(start + numKey1.length).trim() : cleaned.slice(start + numKey1.length, nextStart).trim()
    sections.push({ title: key, icon, color, body })
  })
  return sections
}

function ExplanationPanel({ explanation, loading }) {
  if (loading) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(108,143,255,0.06)', border: '1px solid rgba(108,143,255,0.2)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
    >
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(108,143,255,0.2)', borderTopColor: '#6c8fff' }}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)', marginBottom: 4 }}>Generating AI Explanation</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>GPT-4o-mini is analysing the bias patterns...</div>
      </div>
      {['Identifying phrases', 'Legal mapping', 'Generating rewrite'].map((s, i) => (
        <motion.div key={s} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
          style={{ fontSize: 10, color: 'var(--accent)', background: 'rgba(108,143,255,0.08)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(108,143,255,0.15)' }}
        >{s}</motion.div>
      ))}
    </motion.div>
  )

  if (!explanation) return null
  if (explanation.error) return (
    <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 14, padding: 18, fontSize: 13, color: '#ff6b6b' }}>
      Explanation failed: {explanation.error}
    </div>
  )

  const raw = explanation.explanation || explanation.text || ''
  const sections = parseExplanationSections(raw)
  const legalRefs = explanation.legal_refs || {}

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23,1,0.32,1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#6c8fff,#c084fc)', borderRadius: 2 }} />
        <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          AI Explanation · GPT-4o-mini
        </div>
      </div>
      {sections.length > 0 ? sections.map(({ title, icon, color, body }, idx) => (
        <motion.div key={title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
          style={{ background: 'var(--bg2)', border: '1px solid ' + color + '30', borderLeft: '3px solid ' + color, borderRadius: 12, padding: '14px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <div style={{ fontSize: 11, fontWeight: 700, color: color, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{title}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {body.replace(/^\s*[*•]\s*/gm, '→ ')}
          </div>
        </motion.div>
      )) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          {raw.replace(/\*\*/g, '')}
        </div>
      )}
      {Object.keys(legalRefs).length > 0 && (
        <div style={{ background: 'rgba(108,143,255,0.05)', border: '1px solid rgba(108,143,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Legal References</div>
          {Object.entries(legalRefs).map(([label, ref]) => (
            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6c8fff', background: 'rgba(108,143,255,0.12)', padding: '1px 7px', borderRadius: 10, flexShrink: 0, marginTop: 1 }}>{label}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{ref}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [text, setText]         = useState('')
  const [docType, setDocType]   = useState('Performance Review')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [showAll, setShowAll]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [activeSample, setActiveSample] = useState(null)
  const [explanation, setExplanation]   = useState(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const textareaRef = useRef(null)

  const analyse = async () => {
    if (!text.trim() || loading) return
    setLoading(true); setResult(null); setError(null); setShowAll(false); setExplanation(null)
    try {
      const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${API}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, document_type: docType, explain: false }) })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setResult(await res.json())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const explainBias = async () => {
    if (!result || !text.trim() || explainLoading) return
    setExplainLoading(true); setExplanation(null)
    try {
      const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${API}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, document_type: docType, explain: true }) })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setExplanation(data.explanation)
    } catch (e) { setExplanation({ error: e.message }) }
    finally { setExplainLoading(false) }
  }

  const loadSample = (s, i) => {
    setActiveSample(i); setText(s.text); setDocType(s.type); setResult(null); setError(null); setExplanation(null)
    textareaRef.current?.focus()
  }

  const copyText = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const isBiased    = result?.bias_detected
  const firedLabels = result ? Object.entries(result.all_scores || {}).filter(([l]) => result.labels?.includes(l) && l !== 'NO_BIAS').sort((a,b) => b[1]-a[1]) : []
  const allScores   = result ? Object.entries(result.all_scores || {}).sort((a,b) => b[1]-a[1]) : []
  const displayScores = showAll ? allScores : allScores.slice(0, 6)
  const biasCount   = firedLabels.length

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AmbientOrbs />

      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)', background: 'rgba(3,5,15,0.85)', backdropFilter: 'blur(24px)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div animate={{ boxShadow: ['0 0 15px #4f8ef740', '0 0 30px #4f8ef780', '0 0 15px #4f8ef740'] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ background: 'linear-gradient(135deg,#4f8ef7,#b47cff)', borderRadius: 10, padding: 8 }}
          >
            <Shield size={18} color="white" />
          </motion.div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
              Bias<span style={{ color: 'var(--accent)' }}>Lens</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginTop: 2 }}>HR Bias Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,217,128,0.08)', border: '1px solid rgba(16,217,128,0.2)', borderRadius: 20, padding: '5px 12px' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#10d980', boxShadow: '0 0 8px #10d980' }}
          />
          <span style={{ fontSize: 11, color: '#10d980', fontWeight: 600 }}>API Connected</span>
        </div>
      </motion.header>

      {/* ── STATS BAR ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,13,30,0.9)', backdropFilter: 'blur(12px)', padding: '12px 40px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard icon={Cpu}        label="Best Epoch"  value="Epoch 5 ✓"   sub="of 5 completed"      color="#4f8ef7" delay={0}    />
        <StatCard icon={BarChart3}  label="Macro F1"    value="0.8243"       sub="After tuning: 0.8600" color="#10d980" delay={0.05} />
        <StatCard icon={TrendingUp} label="vs GPT-4o"   value="+21.2%"       sub="F1 advantage"         color="#b47cff" delay={0.1}  />
        <StatCard icon={Clock}      label="Inference"   value="63× faster"   sub="~50ms per doc"        color="#ff6b35" delay={0.15} />
      </div>

      {/* ── HERO ── */}
      <div style={{ textAlign: 'center', padding: '50px 40px 28px', position: 'relative', overflow: 'hidden', minHeight: 320 }}>
        <HeroCanvas />

        {/* Floating bias label chips */}
        {[
          { label: 'GENDER BIAS',    color: '#ff6eb4', x: '6%',  y: '18%', delay: 0.4 },
          { label: 'RACIAL BIAS',    color: '#ff6b35', x: '88%', y: '14%', delay: 0.6 },
          { label: 'AGE BIAS',       color: '#ffd93d', x: '4%',  y: '72%', delay: 0.8 },
          { label: 'DISABILITY',     color: '#00d4ff', x: '86%', y: '68%', delay: 1.0 },
          { label: 'TOXICITY',       color: '#f87171', x: '78%', y: '40%', delay: 0.5 },
          { label: 'STEREOTYPE',     color: '#fbbf24', x: '10%', y: '45%', delay: 0.7 },
          { label: 'HATE SPEECH',    color: '#ef4444', x: '50%', y: '88%', delay: 1.2 },
          { label: 'RELIGIOUS',      color: '#b47cff', x: '22%', y: '82%', delay: 0.9 },
          { label: 'POLITICAL',      color: '#60a5fa', x: '68%', y: '82%', delay: 1.1 },
        ].map(({ label, color, x, y, delay }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, duration: 0.5 }, y: { duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 } }}
            style={{ position: 'absolute', left: x, top: y, fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', padding: '4px 11px', borderRadius: 20, background: `${color}18`, color: color, border: `1px solid ${color}40`, fontFamily: 'var(--font-mono)', backdropFilter: 'blur(6px)', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: `0 0 14px ${color}30` }}
          >{label}</motion.div>
        ))}

        {/* Floating document cards */}
        {[
          { label: 'JD', title: 'Job Description',    color: '#6c8fff', x: '2%',  top: '30%', delay: 0.5 },
          { label: 'PR', title: 'Performance Review', color: '#c084fc', x: '91%', top: '28%', delay: 0.7 },
        ].map(({ label, color, x, top, delay }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ opacity: { delay, duration: 0.6 }, y: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 } }}
            style={{ position: 'absolute', left: x, top, width: 90, background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}35`, borderRadius: 12, padding: '10px 12px', backdropFilter: 'blur(8px)', pointerEvents: 'none' }}
          >
            <div style={{ fontSize: 8, fontWeight: 700, color, fontFamily: 'var(--font-mono)', letterSpacing: '1px', marginBottom: 6 }}>{label}</div>
            {[1,0.6,0.4,0.7].map((w, j) => (
              <div key={j} style={{ height: 3, borderRadius: 2, background: j === 0 ? `${color}80` : 'rgba(255,255,255,0.07)', marginBottom: 4, width: `${w * 100}%` }} />
            ))}
            <div style={{ fontSize: 7, color, opacity: 0.7, marginTop: 6, fontFamily: 'var(--font-mono)' }}>SCANNING...</div>
          </motion.div>
        ))}

        {/* Scanning rings */}
        <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: '50%', top: '50%', width: 360, height: 360, border: '1px solid rgba(108,143,255,0.35)', borderRadius: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}
        />
        <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          style={{ position: 'absolute', left: '50%', top: '50%', width: 220, height: 220, border: '1px solid rgba(192,132,252,0.3)', borderRadius: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}
        />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 18, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
            ✦ &nbsp; Enterprise HR Compliance Intelligence &nbsp; ✦
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 18, fontFamily: 'var(--font-display)' }}>
            Detect Workplace Bias
            <br />
            <span style={{ background: 'linear-gradient(135deg, #6c8fff 0%, #c084fc 45%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Before It Becomes a Risk
            </span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 520, margin: '0 auto', lineHeight: 1.75, fontWeight: 400, letterSpacing: '0.01em' }}>
            Fine-tuned DeBERTa-v3 &nbsp;·&nbsp; 15 bias categories &nbsp;·&nbsp; 53,000+ training examples &nbsp;·&nbsp; Real-time analysis
          </p>
        </motion.div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, maxWidth: 1280, margin: '0 auto' }}>

        {/* ══ LEFT PANEL ══ */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Document Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {DOC_TYPES.map(t => {
                const active = docType === t
                return (
                  <motion.button key={t} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setDocType(t)}
                    style={{ padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: active ? '1px solid var(--accent)' : '1px solid var(--border)', background: active ? 'rgba(79,142,247,0.15)' : 'var(--bg3)', color: active ? 'var(--accent2)' : 'var(--text3)', boxShadow: active ? '0 0 12px rgba(79,142,247,0.2)' : 'none', transition: 'all 0.2s' }}
                  >{t}</motion.button>
                )
              })}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>HR Document</div>
            <div style={{ position: 'relative' }}>
              {loading && <ScanEffect />}
              <motion.textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') analyse() }}
                placeholder={`Paste your job description, performance review, interview feedback, or company policy here...\n\nThe model will scan for 15 types of bias including gender, age, racial, disability, religious, and more.`}
                style={{ width: '100%', minHeight: 220, padding: '18px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--text)', fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.3s, box-shadow 0.3s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(79,142,247,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.08)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
              <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                {text && (
                  <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={copyText}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: copied ? '#10d980' : 'var(--text3)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter' }}
                    ><Copy size={10} /> {copied ? 'Copied!' : 'Copy'}</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setText(''); setResult(null); setError(null); setActiveSample(null); setExplanation(null) }}
                      style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#ff4757' }}
                    ><X size={10} /></motion.button>
                  </>
                )}
                <div style={{ fontSize: 11, color: 'var(--text3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', fontFamily: "'JetBrains Mono', monospace" }}>{text.length}</div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={text.trim() && !loading ? { scale: 1.02, boxShadow: '0 8px 30px rgba(79,142,247,0.5)' } : {}}
            whileTap={text.trim() && !loading ? { scale: 0.98 } : {}}
            onClick={analyse} disabled={!text.trim() || loading}
            style={{ width: '100%', padding: '15px', background: text.trim() && !loading ? 'linear-gradient(135deg, #4f8ef7 0%, #7c4dff 50%, #b47cff 100%)' : 'var(--bg3)', border: 'none', borderRadius: 14, cursor: text.trim() && !loading ? 'pointer' : 'not-allowed', color: text.trim() && !loading ? 'white' : 'var(--text3)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}
          >
            {loading ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Scanning document...</>
            ) : (
              <><Zap size={17} />Analyse for Bias<ChevronRight size={15} style={{ marginLeft: 4 }} /></>
            )}
          </motion.button>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
            Press <kbd style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', fontSize: 10, color: 'var(--text2)' }}>⌘</kbd>{' '}
            +{' '}<kbd style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', fontSize: 10, color: 'var(--text2)' }}>Enter</kbd>{' '}to analyse instantly
          </div>

          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={11} /> Sample Documents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SAMPLES.map((s, i) => {
                const meta = LABEL_META[s.tag] || LABEL_META['NO_BIAS']
                const isActive = activeSample === i
                return (
                  <motion.button key={i} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }} onClick={() => loadSample(s, i)}
                    style={{ background: isActive ? `${meta.color}0f` : 'var(--bg2)', border: `1px solid ${isActive ? meta.color + '40' : 'var(--border)'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.2s' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border2)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <div style={{ background: `${meta.color}20`, borderRadius: 7, padding: '5px 6px', fontSize: 13 }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? meta.color : 'var(--text2)' }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{s.type}</div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${meta.color}20`, color: meta.color, letterSpacing: '0.5px' }}>{s.tag}</div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ══ RIGHT PANEL ══ */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <AnimatePresence mode="wait">
            {!result && !loading && !error && (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 28px 40px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 50% 50%, rgba(79,142,247,0.04) 0%, transparent 70%)` }} />
                <ScanIllustration />
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>Ready to Scan</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 280 }}>
                    Paste any HR document on the left and click <strong style={{ color: 'var(--accent)' }}>Analyse</strong> to detect bias across 15 categories
                  </div>
                </div>
              </motion.div>
            )}

            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ flex: 1, minHeight: 480, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40, position: 'relative', overflow: 'hidden' }}
              >
                <ScanEffect />
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ background: 'rgba(79,142,247,0.15)', borderRadius: '50%', padding: 24, border: '1px solid rgba(79,142,247,0.3)' }}
                >
                  <Activity size={36} color="var(--accent)" />
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Scanning Document</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Running DeBERTa-v3 inference...</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Tokenizing','Encoding','Classifying','Scoring'].map((step, i) => (
                    <motion.div key={step} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      style={{ fontSize: 10, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(79,142,247,0.2)' }}
                    >{step}</motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 20, padding: 36, textAlign: 'center' }}
              >
                <AlertTriangle size={32} color="#ff4757" style={{ marginBottom: 14 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#ff4757', marginBottom: 8 }}>API Unreachable</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
                  Start the FastAPI backend first:<br />
                  <code style={{ color: 'var(--accent2)', background: 'var(--bg3)', padding: '3px 10px', borderRadius: 6, marginTop: 8, display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 12 }}>python run_api.py</code>
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '22px 24px', background: isBiased ? 'linear-gradient(135deg, rgba(255,71,87,0.12) 0%, rgba(255,71,87,0.05) 100%)' : 'linear-gradient(135deg, rgba(16,217,128,0.12) 0%, rgba(16,217,128,0.05) 100%)', border: `1px solid ${isBiased ? 'rgba(255,71,87,0.3)' : 'rgba(16,217,128,0.3)'}`, boxShadow: isBiased ? '0 4px 30px rgba(255,71,87,0.1)' : '0 4px 30px rgba(16,217,128,0.1)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      style={{ background: isBiased ? 'rgba(255,71,87,0.15)' : 'rgba(16,217,128,0.15)', borderRadius: '50%', padding: 12, flexShrink: 0 }}
                    >
                      {isBiased ? <AlertTriangle size={24} color="#ff4757" /> : <CheckCircle2 size={24} color="#10d980" />}
                    </motion.div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: isBiased ? '#ff3d5a' : '#00e5a0', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>
                        {isBiased ? 'Bias Detected' : 'No Bias Detected'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
                        {isBiased ? `${biasCount} bias type${biasCount > 1 ? 's' : ''} identified in this ${docType}` : `This ${docType} appears fair and unbiased`}
                      </div>
                    </div>
                    {result.processing_time_ms && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Processed in</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{Math.round(result.processing_time_ms)}ms</div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {isBiased && firedLabels.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>⚠ Flagged Categories</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {firedLabels.map(([label, score], i) => <LabelCard key={label} label={label} score={score} fired index={i} />)}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BarChart3 size={11} /> All Confidence Scores
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {displayScores.map(([label, score], i) => (
                      <LabelCard key={label} label={label} score={score} fired={result.labels?.includes(label) && label !== 'NO_BIAS'} index={i} />
                    ))}
                  </div>
                  {allScores.length > 6 && (
                    <motion.button whileHover={{ scale: 1.01 }} onClick={() => setShowAll(v => !v)}
                      style={{ width: '100%', marginTop: 8, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}
                    >
                      <motion.div animate={{ rotate: showAll ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight size={13} style={{ transform: 'rotate(90deg)' }} />
                      </motion.div>
                      {showAll ? 'Show fewer labels' : `Show all ${allScores.length} labels`}
                    </motion.button>
                  )}
                </div>

                {isBiased && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    {!explanation && !explainLoading && (
                      <motion.button whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(108,143,255,0.35)' }} whileTap={{ scale: 0.98 }}
                        onClick={explainBias}
                        style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, rgba(108,143,255,0.15) 0%, rgba(192,132,252,0.15) 100%)', border: '1px solid rgba(108,143,255,0.35)', borderRadius: 12, cursor: 'pointer', color: 'var(--accent2)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'all 0.25s' }}
                      >
                        <Sparkles size={16} />
                        Explain This Bias
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, fontFamily: 'var(--font-mono)' }}>· GPT-4o-mini</span>
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {(explanation || explainLoading) && (
                  <ExplanationPanel explanation={explanation} loading={explainLoading} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
