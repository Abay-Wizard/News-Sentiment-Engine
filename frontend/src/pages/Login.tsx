import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [id, setId]           = useState('')
  const [pw, setPw]           = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await login(id, pw)
      nav('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize:'48px 48px', opacity:.3, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'20%', left:'10%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(63,185,80,.05) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div className="auth-card fade-up">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:46, height:46, borderRadius:12, background:'var(--green-dim)', border:'1px solid var(--green-border)', marginBottom:14 }}>
            <Activity size={22} color="var(--green)" />
          </div>
          <div style={{ fontSize:21, fontWeight:800, letterSpacing:'-.025em', color:'var(--fg)', marginBottom:4 }}>Welcome back</div>
          <div style={{ fontSize:13, color:'var(--fg-3)' }}>Sign in to your NSE account</div>
        </div>

        {error && (
          <div style={{ display:'flex', gap:10, padding:'11px 13px', marginBottom:18, background:'var(--red-dim)', border:'1px solid var(--red-border)', borderRadius:'var(--r)' }}>
            <AlertCircle size={15} style={{ color:'var(--red)', flexShrink:0, marginTop:1 }} />
            <span style={{ fontSize:13, color:'var(--red)', lineHeight:1.5 }}>{error}</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
          <Field label="Email or Username">
            <input type="text" value={id} onChange={e=>setId(e.target.value)}
              placeholder="you@example.com or username" required autoComplete="username" />
          </Field>

          <Field label="Password">
            <div style={{ position:'relative' }}>
              <input type={show?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                style={{ paddingRight:40 }} />
              <button type="button" onClick={()=>setShow(v=>!v)}
                style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--fg-3)', display:'flex' }}>
                {show ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </Field>

          <button type="submit" disabled={loading || !id || !pw}
            className="btn btn-primary" style={{ marginTop:6, width:'100%', padding:'11px', fontSize:14 }}>
            {loading
              ? <><Loader2 size={15} className="spin" /> Signing in…</>
              : <><span>Sign In</span><ArrowRight size={15}/></>}
          </button>
        </form>

        <div style={{ marginTop:22, paddingTop:18, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:13, color:'var(--fg-3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--green)', fontWeight:600 }}>Create one</Link>
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
