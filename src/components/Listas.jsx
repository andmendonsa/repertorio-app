import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { logAcao } from '../log'
import ListaDetail from './ListaDetail'

export default function Listas({ user }) {
  const [listas, setListas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [listaAberta, setListaAberta] = useState(null)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase.from('listas').select('*').order('criado_em')
    if (!error) setListas(data || [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function criar(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    const { error } = await supabase.from('listas').insert({ titulo: titulo.trim(), criado_por: user.id })
    if (!error) {
      await logAcao(user.id, 'criou_lista', { titulo })
      setTitulo('')
      await carregar()
    }
  }

  async function excluir(id) {
    await supabase.from('listas').delete().eq('id', id)
    await logAcao(user.id, 'excluiu_lista', { id })
    if (listaAberta === id) setListaAberta(null)
    await carregar()
  }

  if (listaAberta) {
    return (
      <ListaDetail
        listaId={listaAberta}
        user={user}
        onVoltar={() => { setListaAberta(null); carregar() }}
      />
    )
  }

  const minhas = listas.filter((l) => l.criado_por === user.id)
  const compartilhadas = listas.filter((l) => l.criado_por !== user.id)

  return (
    <>
      <div className="panel">
        <h2>Nova lista</h2>
        <form className="form-row" onSubmit={criar}>
          <div className="field">
            <label>Título</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} style={{ width: 260 }} />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="primary">Criar lista</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Minhas listas</h2>
        {carregando ? (
          <div className="empty-msg">Carregando…</div>
        ) : (
          <div className="list-cards">
            {minhas.length === 0 && <div className="empty-msg">Nenhuma lista criada ainda.</div>}
            {minhas.map((l) => (
              <div className="list-card" key={l.id}>
                <div><div className="titulo">{l.titulo}</div></div>
                <div className="list-card-actions">
                  <button className="ghost" onClick={() => setListaAberta(l.id)}>Abrir</button>
                  <button className="ghost" onClick={() => excluir(l.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!carregando && compartilhadas.length > 0 && (
        <div className="panel">
          <h2>Compartilhadas comigo</h2>
          <div className="list-cards">
            {compartilhadas.map((l) => (
              <div className="list-card" key={l.id}>
                <div><div className="titulo">{l.titulo}</div></div>
                <div className="list-card-actions">
                  <button className="ghost" onClick={() => setListaAberta(l.id)}>Abrir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
