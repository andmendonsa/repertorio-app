export default function PdfModal({ titulo, url, mime, onClose, onPrev, onNext, podeAnterior, podeProxima, posicao }) {
  const ehImagem = mime && mime.startsWith('image/')

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <div className="titulo">{titulo}</div>
          <div className="modal-nav">
            {onPrev && (
              <button className="ghost" onClick={onPrev} disabled={!podeAnterior}>‹ Anterior</button>
            )}
            {posicao && <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>{posicao}</span>}
            {onNext && (
              <button className="ghost" onClick={onNext} disabled={!podeProxima}>Próxima ›</button>
            )}
            <button className="ghost" onClick={onClose}>Fechar</button>
          </div>
        </div>
        {!url ? (
          <div className="empty-msg">Arquivo não disponível.</div>
        ) : ehImagem ? (
          <div className="modal-image-wrap">
            <img src={url} alt={titulo} />
          </div>
        ) : (
          <iframe src={url} title={titulo} />
        )}
      </div>
    </div>
  )
}
