import { supabase } from './supabaseClient'

export async function logAcao(usuarioId, acao, detalhe = {}) {
  try {
    await supabase.from('log_acoes').insert({ usuario_id: usuarioId, acao, detalhe })
  } catch (err) {
    console.error('Erro ao gravar log de ação:', err)
  }
}
