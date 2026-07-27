# Especificação — App Repertório (com login e Supabase)

## Contexto
Protótipo validado em artifact (sem login, dados compartilhados) confirmou o fluxo:
cadastro de músicas por número + PDF, criação de listas, adição de músicas por número,
reordenação e visualização de PDF com navegação anterior/próxima. Este documento descreve
como transformar isso num app real, com login individual, log de ações e compartilhamento
seletivo de listas entre os usuários do grupo.

## Stack sugerida
- **Frontend**: React + Vite (web app, evoluindo depois para PWA instalável)
- **Backend/dados**: Supabase (Postgres + Auth + Storage), plano gratuito é suficiente
  para o volume de um grupo pequeno
- **Deploy**: Vercel ou Netlify (grátis, deploy direto do repositório)

## Autenticação
- Supabase Auth, e-mail + senha
- Cada membro do grupo cria sua conta (ou o admin cria e envia convite)
- Sessão persistida no navegador (login automático nas próximas visitas)

## Modelo de dados (Postgres via Supabase)

```sql
-- Músicas: biblioteca compartilhada por todo o grupo
create table musicas (
  numero integer primary key,
  nome text,
  pdf_url text not null,          -- caminho no Supabase Storage
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Listas: pertencem a um usuário, podem ser compartilhadas
create table listas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  criado_por uuid references auth.users(id) not null,
  criado_em timestamptz default now()
);

-- Músicas dentro de uma lista, com ordem
create table lista_musicas (
  lista_id uuid references listas(id) on delete cascade,
  numero integer references musicas(numero),
  ordem integer not null,
  primary key (lista_id, numero)
);

-- Compartilhamento de listas entre usuários
create table lista_compartilhamento (
  lista_id uuid references listas(id) on delete cascade,
  usuario_id uuid references auth.users(id),
  permissao text check (permissao in ('leitura', 'edicao')) default 'leitura',
  primary key (lista_id, usuario_id)
);

-- Log de ações (auditoria simples)
create table log_acoes (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users(id),
  acao text not null,              -- ex: 'cadastrou_musica', 'criou_lista', 'editou_lista'
  detalhe jsonb,
  criado_em timestamptz default now()
);
```

Ativar **Row Level Security (RLS)** em todas as tabelas:
- `musicas`: leitura liberada para qualquer usuário autenticado; escrita para qualquer
  usuário autenticado (biblioteca é do grupo todo)
- `listas`: leitura/escrita só para `criado_por = auth.uid()` OU usuário presente em
  `lista_compartilhamento` com a permissão adequada
- `lista_musicas` e `lista_compartilhamento`: acesso controlado via join com `listas`
- `log_acoes`: inserção liberada para o próprio usuário; leitura pode ficar restrita ao
  próprio usuário ou aberta ao grupo, dependendo do quanto de transparência vocês quiserem

## Storage de PDFs
- Bucket do Supabase Storage (ex: `partituras`)
- Upload no cadastro da música, salvando a `pdf_url` retornada na tabela `musicas`
- Bucket privado + política de leitura para usuários autenticados

## Funcionalidades (herdadas do protótipo + login)
1. Tela de login/cadastro de conta
2. Biblioteca de músicas (igual ao protótipo, agora gravando `criado_por`)
3. Listas próprias do usuário logado
4. Botão "Compartilhar lista" — escolher outro usuário do grupo e a permissão
   (leitura ou edição)
5. Listas compartilhadas comigo aparecem numa seção separada ("Compartilhadas comigo")
6. Log de ações visível numa tela simples de histórico (opcional, mas já modelado)
7. Visualizador de PDF com navegação anterior/próxima (igual ao protótipo)

## Próxima etapa (depois deste)
Transformar em PWA: manifest.json + service worker para instalação no celular e
cache offline, com sincronização quando a conexão voltar.

## Prompt pronto para usar no Claude Code

```
Quero construir um app web em React + Vite, com Supabase como backend
(Postgres + Auth + Storage), para organizar partituras musicais por número
para um grupo de música pequeno e não comercial.

Siga a especificação abaixo (schema, RLS, e funcionalidades) e me ajude a:
1. Configurar o projeto Supabase (tabelas, RLS, bucket de storage)
2. Construir a tela de login/cadastro
3. Construir a biblioteca de músicas (cadastro por número + upload de PDF)
4. Construir a criação e edição de listas, com reordenação de músicas
5. Construir o compartilhamento de listas entre usuários (leitura ou edição)
6. Construir o visualizador de PDF com navegação anterior/próxima dentro da lista
7. Preparar o deploy (Vercel ou Netlify)

[Colar aqui o restante deste documento: modelo de dados, políticas de RLS e
funcionalidades detalhadas]
```
