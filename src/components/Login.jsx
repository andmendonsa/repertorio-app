import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [modo, setModo] = useState('entrar') // entrar | criar
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setMsg('')
    setCarregando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha })
        if (error) throw error
        setMsg('Conta criada! Se a confirmação por e-mail estiver ativada no seu projeto Supabase, verifique sua caixa de entrada antes de entrar.')
      }
    } catch (err) {
      setErro(err.message || 'Erro ao autenticar.')
    }
    setCarregando(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="app-title">
          Repertório
          <span>partituras organizadas por número</span>
        </h1>
        <div className="tabs" style={{ marginTop: 20, marginBottom: 20 }}>
          <button type="button" className={`tab-btn ${modo === 'entrar' ? 'active' : ''}`} onClick={() => setModo('entrar')}>
            Entrar
          </button>
          <button type="button" className={`tab-btn ${modo === 'criar' ? 'active' : ''}`} onClick={() => setModo('criar')}>
            Criar conta
          </button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
          </div>
          {erro && <div className="error-text">{erro}</div>}
          {msg && <div className="hint">{msg}</div>}
          <button className="primary" type="submit" disabled={carregando}>
            {carregando ? 'Enviando…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
