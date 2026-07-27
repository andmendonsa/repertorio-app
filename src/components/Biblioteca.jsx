import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { logAcao } from '../log'
import PdfModal from './PdfModal'

const TIPOS_ACEITOS = 'application/pdf,image/jpeg,image/png,image/webp'

export default function Biblioteca({ user }) {
  const [musicas, setMusicas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [numero, setNumero] = useState('')
  const [nome, setNome] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [visualizando, setVisualizando] = useState(null) // { numero, nome, url, mime }

  const [editando, setEditando] = useState(null) // numero da música em edição
  const [editNome, setEditNome] = useState('')
  const [editArquivo, setEditArquivo] = useState(null)
  const [editErro, setEditErro] = useState('')
  const [editSalvando, setEditSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase.from('musicas').select('*').order('numero')
    if (!error) setMusicas(data || [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function adicionar(e) {
    e.preventDefault()
    setErro('')
    if (!numero) { setErro('Informe o número da música.'); return }
    if (!arquivo) { setErro('Selecione o PDF ou a imagem da partitura.'); return }
    if (musicas.some((m) => String(m.numero) === String(numero))) {
      setErro('Já existe uma música cadastrada com esse número.')
      return
    }
    setSalvando(true)
    try {
      const ext = arquivo.name.split('.').pop()
      const path = `${numero}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('partituras').upload(path, arquivo)
      if (upErr) throw upErr
      const { error: insErr } = await supabase.from('musicas').insert({
        numero: Number(numero),
        nome: nome || null,
        pdf_url: path,
        arquivo_mime: arquivo.type,
        criado_por: user.id,
      })
      if (insErr) throw insErr
      await logAcao(user.id, 'cadastrou_musica', { numero })
      setNumero(''); setNome(''); setArquivo(null)
      await carregar()
    } catch (err) {
      setErro(err.message || 'Erro ao salvar a música.')
    }
    setSalvando(false)
  }

  async function excluir(m) {
    try {
      await supabase.storage.from('partituras').remove([m.pdf_url])
      await supabase.from('musicas').delete().eq('numero', m.numero)
      await logAcao(user.id, 'excluiu_musica', { numero: m.numero })
      await carregar()
    } catch (err) {
      console.error(err)
    }
  }

  async function abrir(m) {
    const { data, error } = await supabase.storage.from('partituras').createSignedUrl(m.pdf_url, 3600)
    if (!error) setVisualizando({ numero: m.numero, nome: m.nome, url: data.signedUrl, mime: m.arquivo_mime })
  }

  function iniciarEdicao(m) {
    setEditando(m.numero)
    setEditNome(m.nome || '')
    setEditArquivo(null)
    setEditErro('')
  }

  function cancelarEdicao() {
    setEditando(null)
    setEditArquivo(null)
    setEditErro('')
  }

  async function salvarEdicao(m) {
    setEditErro('')
    setEditSalvando(true)
    try {
      const atualizacao = { nome: editNome || null }

      if (editArquivo) {
        const ext = editArquivo.name.split('.').pop()
        const novoPath = `${m.numero}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('partituras').upload(novoPath, editArquivo)
        if (upErr) throw upErr
        atualizacao.pdf_url = novoPath
        atualizacao.arquivo_mime = editArquivo.type
      }

      const { error: updErr } = await supabase.from('musicas').update(atualizacao).eq('numero', m.numero)
      if (updErr) throw updErr

      // remove o arquivo antigo do storage só depois que o registro novo foi salvo com sucesso
      if (editArquivo) {
        await supabase.storage.from('partituras').remove([m.pdf_url])
      }

      await logAcao(user.id, 'editou_musica', { numero: m.numero, trocouArquivo: !!editArquivo })
      setEditando(null)
      setEditArquivo(null)
      await carregar()
    } catch (err) {
      setEditErro(err.message || 'Erro ao salvar as alterações.')
    }
    setEditSalvando(false)
  }

  return (
    <>
      <div className="panel">
        <h2>Cadastrar música</h2>
        <form className="form-row" onSubmit={adicionar}>
          <div className="field">
            <label>Número</label>
            <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} style={{ width: 100 }} />
          </div>
          <div className="field">
            <label>Nome (opcional)</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: 220 }} />
          </div>
          <div className="field">
            <label>Partitura (PDF ou imagem)</label>
            <label className={`file-btn ${arquivo ? 'has-file' : ''}`}>
              {arquivo ? arquivo.name : 'Escolher arquivo'}
              <input type="file" accept={TIPOS_ACEITOS} onChange={(e) => setArquivo(e.target.files[0])} />
            </label>
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Adicionar'}</button>
          </div>
        </form>
        {erro && <div className="error-text">{erro}</div>}
        <div className="hint">Aceita arquivos em PDF, JPG, PNG ou WEBP.</div>
      </div>

      <div className="panel">
        <h2>Todas as músicas ({musicas.length})</h2>
        {carregando ? (
          <div className="empty-msg">Carregando…</div>
        ) : (
          <div className="board">
            {musicas.length === 0 && <div className="empty-msg">Nenhuma música cadastrada ainda.</div>}
            {musicas.map((m) => (
              editando === m.numero ? (
                <div className="tile tile-edit" key={m.numero} onClick={(e) => e.stopPropagation()}>
                  <div className="num">{m.numero}</div>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome"
                    style={{ width: '100%', marginTop: 6, marginBottom: 6 }}
                  />
                  <label className={`file-btn ${editArquivo ? 'has-file' : ''}`} style={{ width: '100%', fontSize: 11 }}>
                    {editArquivo ? editArquivo.name : 'Substituir arquivo (opcional)'}
                    <input type="file" accept={TIPOS_ACEITOS} onChange={(e) => setEditArquivo(e.target.files[0])} />
                  </label>
                  {editErro && <div className="error-text" style={{ marginTop: 6 }}>{editErro}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="primary" disabled={editSalvando} onClick={() => salvarEdicao(m)} style={{ flex: 1, padding: '6px 8px', fontSize: 12 }}>
                      {editSalvando ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button className="ghost" onClick={cancelarEdicao} style={{ padding: '6px 8px', fontSize: 12 }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="tile" key={m.numero} onClick={() => abrir(m)}>
                  <button className="del" onClick={(e) => { e.stopPropagation(); excluir(m) }} title="Excluir">✕</button>
                  <button className="edit" onClick={(e) => { e.stopPropagation(); iniciarEdicao(m) }} title="Editar">✎</button>
                  <div className="num">{m.numero}</div>
                  <div className="nome">{m.nome || ''}</div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {visualizando && (
        <PdfModal
          titulo={`${visualizando.numero} — ${visualizando.nome || ''}`}
          url={visualizando.url}
          mime={visualizando.mime}
          onClose={() => setVisualizando(null)}
        />
      )}
    </>
  )
}
