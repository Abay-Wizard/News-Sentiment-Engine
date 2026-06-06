import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function PwStrength({ pw }: { pw: string }) {
  if (!pw) return null
  const checks = [
    { l:'8+ chars', ok: pw.length >= 8 },
    { l:'Uppercase', ok: /[A-Z]/.test(pw) },
    { l:'Digit',    ok: /\d/.test(pw) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['var(--red)', 'var(--amber)', 'var(--green)']
  const labels = ['Weak', 'Fair', 'Strong']
  return (
    <div style={{ marginTop:7, display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ display:'flex', gap:3 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2,
            background: i < score ? colors[score-1] : 'var(--border)', transition:'background .25s' }} />
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
        <div style={{ display:'flex', gap:8 }}>
          {checks.map(c => (
            <span key={c.l} style={{ display:'flex', alignItems:'center', gap:3, fontSize:11,
              color: c.ok ? 'var(--green)' : 'var(--fg-3)', fontFamily:'var(--mono)' }}>
              <CheckCircle2 size={11} style={{ opacity: c.ok ? 1 : .3 }} />{c.l}
            </span>
          ))}
        </div>
        {score > 0 && <span style={{ fontSize:11, fontWeight:600, fontFamily:'var(--mono)', color:colors[score-1] }}>{labels[score-1]}</span>}
      </div>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email:'', username:'', password:'', full_name:'' })
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string|null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  const valid = f.email && f.username.length >= 3 && f.password.length >= 8
    && /[A-Z]/.test(f.password) && /\d/.test(f.password)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await register(f.email, f.username, f.password, f.full_name || undefined)
      nav('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize:'48px 48px', opacity:.3, pointerEvents:'none' }} />

      <div className="auth-card fade-up" style={{ maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:46, height:46, borderRadius:12, background:'var(--green-dim)', border:'1px solid var(--green-border)', marginBottom:14 }}>
            <Activity size={22} color="var(--green)" />
          </div>
          <div style={{ fontSize:21, fontWeight:800, letterSpacing:'-.025em', color:'var(--fg)', marginBottom:4 }}>Create your account</div>
          <div style={{ fontSize:13, color:'var(--fg-3)' }}>Start monitoring financial market sentiment</div>
        </div>

        {error && (
          <div style={{ display:'flex', gap:10, padding:'11px 13px', marginBottom:16, background:'var(--red-dim)', border:'1px solid var(--red-border)', borderRadius:'var(--r)' }}>
            <AlertCircle size={15} style={{ color:'var(--red)', flexShrink:0, marginTop:1 }} />
            <span style={{ fontSize:13, color:'var(--red)', lineHeight:1.5 }}>{error}</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <Field label="Full Name (optional)">
            <input type="text" value={f.full_name} onChange={set('full_name')}
              placeholder="Jane Doe" autoComplete="name" />
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
            <Field label="Email">
              <input type="email" value={f.email} onChange={set('email')}
                placeholder="you@example.com" required autoComplete="email" />
            </Field>
            <Field label="Username">
              <input type="text" value={f.username} onChange={set('username')}
                placeholder="traderpro" required minLength={3} maxLength={32} autoComplete="username" />
            </Field>
          </div>

          <Field label="Password">
            <div style={{ position:'relative' }}>
              <input type={show?'text':'password'} value={f.password} onChange={set('password')}
                placeholder="Min 8 chars, 1 uppercase, 1 digit" required autoComplete="new-password"
                style={{ paddingRight:40 }} />
              <button type="button" onClick={()=>setShow(v=>!v)}
                style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--fg-3)', display:'flex' }}>
                {show ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
            <PwStrength pw={f.password} />
          </Field>

          <button type="submit" disabled={loading || !valid}
            className="btn btn-primary" style={{ marginTop:6, width:'100%', padding:'11px', fontSize:14 }}>
            {loading
              ? <><Loader2 size={15} className="spin" /> Creating account…</>
              : <><span>Create Account</span><ArrowRight size={15}/></>}
          </button>
        </form>

        <div style={{ marginTop:20, paddingTop:18, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:13, color:'var(--fg-3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--green)', fontWeight:600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'var(--fg-2)', fontFamily:'var(--mono)', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}
