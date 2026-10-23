# AGENTS.md — Repertório

Instruções para qualquer agente de IA (Claude Code, Codex, Cursor etc.) que trabalhe neste repositório.

## O que é o projeto
App web para um grupo de música pequeno e não comercial organizar partituras (PDF) por número:
biblioteca compartilhada de músicas, listas por usuário com reordenação, compartilhamento de
listas (leitura/edição), visualizador de PDF com anterior/próxima e log de ações.
A especificação completa está em [especificacao-app-repertorio.md](especificacao-app-repertorio.md).

## Stack
- React 18 + Vite 5 (JavaScript/JSX, sem TypeScript)
- Supabase: Postgres + Auth (e-mail/senha) + Storage (bucket privado `partituras`)
- Deploy previsto: Vercel ou Netlify
- Próxima etapa: PWA (manifest + service worker + cache offline)

## Comandos
```
npm install      # dependências
npm run dev      # servidor local (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
```
Não há testes automatizados nem linter configurados. Antes de concluir uma mudança, rode
`npm run build` para garantir que compila.

## Estrutura
```
src/
  main.jsx            # entrada do React
  App.jsx             # sessão do Supabase + abas (Biblioteca / Minhas Listas)
  supabaseClient.js   # cliente único do Supabase (lê VITE_SUPABASE_*)
  log.js              # logAcao(usuarioId, acao, detalhe) -> tabela log_acoes
  styles.css          # estilos globais
  components/
    Login.jsx         # login e criação de conta
    Biblioteca.jsx    # cadastro de músicas (número + PDF)
    Listas.jsx        # listas próprias e compartilhadas comigo
    ListaDetail.jsx   # músicas de uma lista, ordem, compartilhamento
    PdfModal.jsx      # visualizador de PDF com navegação
politicas-rls.sql     # políticas de Row Level Security
migracao-profiles.sql # tabela profiles + trigger (compartilhar por e-mail)
```

## Banco de dados (Supabase)
- Tabelas: `musicas` (PK `numero`), `listas`, `lista_musicas` (ordem), `lista_compartilhamento`
  (`leitura` | `edicao`), `log_acoes`, `profiles` (id + e-mail, espelho de `auth.users`).
- **RLS ativo em todas as tabelas.** Toda tabela nova precisa de `enable row level security`
  e políticas explícitas; nunca desative RLS para "fazer funcionar".
- O app usa só a chave anon/publishable. Nunca usar `service_role` no frontend.
- `auth.users` não é acessível pelo app: para achar usuário por e-mail, use `profiles`.
- Mudanças de schema vão em um arquivo `.sql` novo na raiz (ex: `migracao-<assunto>.sql`),
  idempotente quando possível (`if not exists`, `drop policy if exists`), e a ordem de execução
  deve ser documentada no README. As migrações são rodadas manualmente no SQL Editor do Supabase.
- Cuidado com recursão em políticas RLS (ex: política de `listas` consultando
  `lista_compartilhamento`, que por sua vez consulta `listas`). Prefira funções
  `security definer` para checagens cruzadas.

## Convenções de código
- Código, nomes de variáveis, tabelas, mensagens de UI e comentários em **português**
  (ex: `carregandoSessao`, `criado_por`, `logAcao`), seguindo o que já existe.
- Componentes funcionais com hooks; estado local com `useState`/`useEffect`. Sem bibliotecas
  de estado ou UI extras sem necessidade clara.
- Acesse o Supabase sempre via `src/supabaseClient.js`; não crie outro cliente.
- Ações relevantes do usuário (cadastrar música, criar/editar/compartilhar lista) devem chamar
  `logAcao` com um código em snake_case (ex: `cadastrou_musica`, `criou_lista`).
- Trate o `error` retornado pelo Supabase em toda chamada e mostre mensagem compreensível ao
  usuário; o Supabase não lança exceção por padrão.
- PDFs ficam em bucket privado: use URLs assinadas (`createSignedUrl`) para exibir.

## Segredos e ambiente
- Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` em `.env` (ignorado pelo git).
- Nunca commitar `.env` nem chaves `service_role`.

## Arquivos de apoio
- [MISTAKES.md](MISTAKES.md) — registro de erros e aprendizados. **Leia antes de começar** e
  **registre** nele todo erro relevante cometido ou encontrado durante o desenvolvimento
  (formato descrito no próprio arquivo).
- [README.md](README.md) — instruções para humanos (rodar, migrar, deploy).

## Git
- Branch principal: `main`. Commits com mensagens curtas em português.
- Só faça commit/push quando o usuário pedir.
