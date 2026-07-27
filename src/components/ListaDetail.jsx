import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { logAcao } from '../log'
import PdfModal from './PdfModal'

export default function ListaDetail({ listaId, user, onVoltar }) {
  const [lista, setLista] = useState(null)
  const [itens, setItens] = useState([]) // [{ numero, ordem, musica }]
  const [musicas, setMusicas] = useState([])
  const [numeroAdd, setNumeroAdd] = useState('')
  const [erro, setErro] = useState('')
  const [compartilhamentos, setCompartilhamentos] = useState([])
  const [emailCompartilhar, setEmailCompartilhar] = useState('')
  const [permissaoCompartilhar, setPermissaoCompartilhar] = useState('leitura')
  const [erroCompartilhar, setErroCompartilhar] = useState('')
  const [visualizando, setVisualizando] = useState(null) // { index, url }

  const souDono = lista && lista.criado_por === user.id

  async function carregarTudo() {
    const { data: l } = await supabase.from('listas').select('*').eq('id', listaId).single()
    setLista(l)

    const { data: lm } = await supabase.from('lista_musicas').select('*').eq('lista_id', listaId).order('ordem')
    const { data: mAll } = await supabase.from('musicas').select('*')
    setMusicas(mAll || [])
    const mMap = {}
    ;(mAll || []).forEach((m) => { mMap[m.numero] = m })
    setItens((lm || []).map((i) => ({ ...i, musica: mMap[i.numero] })))

    if (l && l.criado_por === user.id) {
      const { data: comp } = await supabase
        .from('lista_compartilhamento')
        .select('usuario_id, permissao, profiles:usuario_id ( email )')
        .eq('lista_id', listaId)
      setCompartilhamentos(comp || [])
    }
  }

  useEffect(() => { carregarTudo() }, [listaId])

  async function adicionarMusica(e) {
    e.preventDefault()
    setErro('')
    const num = Number(numeroAdd)
    if (!num) { setErro('Informe o número da música.'); return }
    if (!musicas.some((m) => m.numero === num)) { setErro('Não existe música com esse número na biblioteca.'); return }
    if (itens.some((i) => i.numero === num)) { setErro('Essa música já está na lista.'); return }
    const ordem = itens.length
    const { error } = await supabase.from('lista_musicas').insert({ lista_id: listaId, numero: num, ordem })
    if (error) { setErro(error.message); return }
    setNumeroAdd('')
    await logAcao(user.id, 'adicionou_musica_lista', { listaId, numero: num })
    await carregarTudo()
  }

  async function remover(numero) {
    await supabase.from('lista_musicas').delete().eq('lista_id', listaId).eq('numero', numero)
    const restantes = itens.filter((i) => i.numero !== numero)
    await Promise.all(restantes.map((item, i) =>
      supabase.from('lista_musicas').update({ ordem: i }).eq('lista_id', listaId).eq('numero', item.numero)
    ))
    await logAcao(user.id, 'removeu_musica_lista', { listaId, numero })
    await carregarTudo()
  }

  async function mover(idx, dir) {
    const nova = [...itens]
    const alvo = idx + dir
    if (alvo < 0 || alvo >= nova.length) return
    ;[nova[idx], nova[alvo]] = [nova[alvo], nova[idx]]
    await Promise.all(nova.map((item, i) =>
      supabase.from('lista_musicas').update({ ordem: i }).eq('lista_id', listaId).eq('numero', item.numero)
    ))
    await carregarTudo()
  }

  async function compartilhar(e) {
    e.preventDefault()
    setErroCompartilhar('')
    if (!emailCompartilhar.trim()) return
    const { data: perfil, error: perfilErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailCompartilhar.trim())
      .maybeSingle()
    if (perfilErr || !perfil) {
      setErroCompartilhar('Nenhum usuário encontrado com esse e-mail (a pessoa precisa já ter criado uma conta no app).')
      return
    }
    const { error } = await supabase.from('lista_compartilhamento').insert({
      lista_id: listaId, usuario_id: perfil.id, permissao: permissaoCompartilhar,
    })
    if (error) { setErroCompartilhar(error.message); return }
    setEmailCompartilhar('')
    await logAcao(user.id, 'compartilhou_lista', { listaId, email: emailCompartilhar })
    await carregarTudo()
  }

  async function removerCompartilhamento(usuarioId) {
    await supabase.from('lista_compartilhamento').delete().eq('lista_id', listaId).eq('usuario_id', usuarioId)
    await carregarTudo()
  }

  async function irPara(idx) {
    if (idx < 0 || idx >= itens.length) return
    const item = itens[idx]
    if (!item.musica) return
    const { data, error } = await supabase.storage.from('partituras').createSignedUrl(item.musica.pdf_url, 3600)
    if (!error) setVisualizando({ index: idx, url: data.signedUrl })
  }

  if (!lista) return <div className="empty-msg">Carregando…</div>

  return (
    <>
      <div className="back-row">
        <button className="ghost" onClick={onVoltar}>← Voltar</button>
        <h2>{lista.titulo}</h2>
      </div>

      <div className="panel">
        <h2>Adicionar música à lista</h2>
        <form className="form-row" onSubmit={adicionarMusica}>
          <div className="field">
            <label>Número</label>
            <input type="number" value={numeroAdd} onChange={(e) => setNumeroAdd(e.target.value)} style={{ width: 100 }} />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="primary">Adicionar</button>
          </div>
        </form>
        {erro && <div className="error-text">{erro}</div>}
      </div>

      <div className="panel">
        <h2>Ordem da lista</h2>
        {itens.length === 0 && <div className="empty-msg">Nenhuma música nesta lista ainda.</div>}
        {itens.map((item, idx) => (
          <div className="ordered-item" key={item.numero}>
            <div className="num">{item.numero}</div>
            <div className="nome">{item.musica ? (item.musica.nome || '') : '(não encontrada na biblioteca)'}</div>
            <div className="actions">
              <button className="icon-btn" onClick={() => mover(idx, -1)} disabled={idx === 0} title="Mover para cima">▲</button>
              <button className="icon-btn" onClick={() => mover(idx, 1)} disabled={idx === itens.length - 1} title="Mover para baixo">▼</button>
              <button className="icon-btn open" onClick={() => irPara(idx)} disabled={!item.musica}>Abrir</button>
              <button className="icon-btn" onClick={() => remover(item.numero)} title="Remover da lista">✕</button>
            </div>
          </div>
        ))}
      </div>

      {souDono && (
        <div className="panel">
          <h2>Compartilhar esta lista</h2>
          <form className="form-row" onSubmit={compartilhar}>
            <div className="field">
              <label>E-mail do usuário</label>
              <input type="email" value={emailCompartilhar} onChange={(e) => setEmailCompartilhar(e.target.value)} style={{ width: 220 }} />
            </div>
            <div className="field">
              <label>Permissão</label>
              <select value={permissaoCompartilhar} onChange={(e) => setPermissaoCompartilhar(e.target.value)}>
                <option value="leitura">Somente leitura</option>
                <option value="edicao">Pode editar</option>
              </select>
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button className="primary">Compartilhar</button>
            </div>
          </form>
          {erroCompartilhar && <div className="error-text">{erroCompartilhar}</div>}

          {compartilhamentos.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {compartilhamentos.map((c) => (
                <div className="list-card" key={c.usuario_id} style={{ marginBottom: 8 }}>
                  <div>
                    <div className="titulo" style={{ fontSize: 14 }}>{c.profiles?.email}</div>
                    <div className="meta">{c.permissao === 'edicao' ? 'Pode editar' : 'Somente leitura'}</div>
                  </div>
                  <button className="ghost" onClick={() => removerCompartilhamento(c.usuario_id)}>Remover</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {visualizando && itens[visualizando.index]?.musica && (
        <PdfModal
          titulo={`${itens[visualizando.index].numero} — ${itens[visualizando.index].musica.nome || ''}`}
          url={visualizando.url}
          mime={itens[visualizando.index].musica.arquivo_mime}
          onClose={() => setVisualizando(null)}
          onPrev={() => irPara(visualizando.index - 1)}
          onNext={() => irPara(visualizando.index + 1)}
          podeAnterior={visualizando.index > 0}
          podeProxima={visualizando.index < itens.length - 1}
          posicao={`${visualizando.index + 1} / ${itens.length}`}
        />
      )}
    </>
  )
}
