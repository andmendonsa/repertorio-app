import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Biblioteca from './components/Biblioteca'
import Listas from './components/Listas'

export default function App() {
  const [session, setSession] = useState(null)
  const [carregandoSessao, setCarregandoSessao] = useState(true)
  const [tab, setTab] = useState('biblioteca')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregandoSessao(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
  }

  if (carregandoSessao) {
    return <div className="empty-msg">Carregando…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div id="app">
      <div className="app-header">
        <div>
          <h1 className="app-title">
            Repertório
            <span>{session.user.email}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab-btn ${tab === 'biblioteca' ? 'active' : ''}`} onClick={() => setTab('biblioteca')}>
              Biblioteca
            </button>
            <button className={`tab-btn ${tab === 'listas' ? 'active' : ''}`} onClick={() => setTab('listas')}>
              Minhas Listas
            </button>
          </div>
          <button className="ghost" onClick={sair}>Sair</button>
        </div>
      </div>

      {tab === 'biblioteca' ? <Biblioteca user={session.user} /> : <Listas user={session.user} />}
    </div>
  )
}
