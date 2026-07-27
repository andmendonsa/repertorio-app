-- ============================================================
-- Políticas de RLS (Row Level Security) — App Repertório
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run"
-- (rode depois de já ter criado as tabelas do documento de especificação)
-- ============================================================

-- ---------- MUSICAS ----------
-- Biblioteca é compartilhada: qualquer usuário logado do grupo pode
-- ler, cadastrar, editar ou excluir músicas.

alter table musicas enable row level security;

create policy "musicas_select_autenticados"
on musicas for select
to authenticated
using (true);

create policy "musicas_insert_autenticados"
on musicas for insert
to authenticated
with check (true);

create policy "musicas_update_autenticados"
on musicas for update
to authenticated
using (true);

create policy "musicas_delete_autenticados"
on musicas for delete
to authenticated
using (true);


-- ---------- LISTAS ----------
-- Só o dono da lista, ou alguém com quem ela foi compartilhada, pode vê-la.
-- Só o dono pode excluir. Dono ou compartilhado com permissão "edicao"
-- pode atualizar o título.

alter table listas enable row level security;

create policy "listas_select_dono_ou_compartilhado"
on listas for select
to authenticated
using (
  criado_por = auth.uid()
  or exists (
    select 1 from lista_compartilhamento lc
    where lc.lista_id = listas.id
      and lc.usuario_id = auth.uid()
  )
);

create policy "listas_insert_dono"
on listas for insert
to authenticated
with check (criado_por = auth.uid());

create policy "listas_update_dono_ou_editor"
on listas for update
to authenticated
using (
  criado_por = auth.uid()
  or exists (
    select 1 from lista_compartilhamento lc
    where lc.lista_id = listas.id
      and lc.usuario_id = auth.uid()
      and lc.permissao = 'edicao'
  )
);

create policy "listas_delete_somente_dono"
on listas for delete
to authenticated
using (criado_por = auth.uid());


-- ---------- LISTA_MUSICAS ----------
-- Ver = mesma regra de quem pode ver a lista.
-- Alterar (inserir/atualizar/remover música da lista) = dono ou
-- compartilhado com permissão "edicao".

alter table lista_musicas enable row level security;

create policy "lista_musicas_select_visivel"
on lista_musicas for select
to authenticated
using (
  exists (
    select 1 from listas l
    where l.id = lista_musicas.lista_id
      and (
        l.criado_por = auth.uid()
        or exists (
          select 1 from lista_compartilhamento lc
          where lc.lista_id = l.id and lc.usuario_id = auth.uid()
        )
      )
  )
);

create policy "lista_musicas_insert_editavel"
on lista_musicas for insert
to authenticated
with check (
  exists (
    select 1 from listas l
    where l.id = lista_musicas.lista_id
      and (
        l.criado_por = auth.uid()
        or exists (
          select 1 from lista_compartilhamento lc
          where lc.lista_id = l.id and lc.usuario_id = auth.uid() and lc.permissao = 'edicao'
        )
      )
  )
);

create policy "lista_musicas_update_editavel"
on lista_musicas for update
to authenticated
using (
  exists (
    select 1 from listas l
    where l.id = lista_musicas.lista_id
      and (
        l.criado_por = auth.uid()
        or exists (
          select 1 from lista_compartilhamento lc
          where lc.lista_id = l.id and lc.usuario_id = auth.uid() and lc.permissao = 'edicao'
        )
      )
  )
)
with check (
  exists (
    select 1 from listas l
    where l.id = lista_musicas.lista_id
      and (
        l.criado_por = auth.uid()
        or exists (
          select 1 from lista_compartilhamento lc
          where lc.lista_id = l.id and lc.usuario_id = auth.uid() and lc.permissao = 'edicao'
        )
      )
  )
);

create policy "lista_musicas_delete_editavel"
on lista_musicas for delete
to authenticated
using (
  exists (
    select 1 from listas l
    where l.id = lista_musicas.lista_id
      and (
        l.criado_por = auth.uid()
        or exists (
          select 1 from lista_compartilhamento lc
          where lc.lista_id = l.id and lc.usuario_id = auth.uid() and lc.permissao = 'edicao'
        )
      )
  )
);


-- ---------- LISTA_COMPARTILHAMENTO ----------
-- Só o dono da lista pode compartilhar, alterar permissão, ou remover
-- o compartilhamento. Cada usuário pode ver as linhas em que ele mesmo
-- aparece (para saber quais listas foram compartilhadas com ele).

alter table lista_compartilhamento enable row level security;

create policy "compartilhamento_select_dono_ou_convidado"
on lista_compartilhamento for select
to authenticated
using (
  usuario_id = auth.uid()
  or exists (
    select 1 from listas l
    where l.id = lista_compartilhamento.lista_id
      and l.criado_por = auth.uid()
  )
);

create policy "compartilhamento_insert_somente_dono"
on lista_compartilhamento for insert
to authenticated
with check (
  exists (
    select 1 from listas l
    where l.id = lista_compartilhamento.lista_id
      and l.criado_por = auth.uid()
  )
);

create policy "compartilhamento_update_somente_dono"
on lista_compartilhamento for update
to authenticated
using (
  exists (
    select 1 from listas l
    where l.id = lista_compartilhamento.lista_id
      and l.criado_por = auth.uid()
  )
);

create policy "compartilhamento_delete_somente_dono"
on lista_compartilhamento for delete
to authenticated
using (
  exists (
    select 1 from listas l
    where l.id = lista_compartilhamento.lista_id
      and l.criado_por = auth.uid()
  )
);


-- ---------- LOG_ACOES ----------
-- Cada usuário só grava e lê o próprio log.
-- (Se preferir que todo o grupo veja o histórico de todo mundo, troque a
-- política de select abaixo por: using (true) )

alter table log_acoes enable row level security;

create policy "log_insert_proprio"
on log_acoes for insert
to authenticated
with check (usuario_id = auth.uid());

create policy "log_select_proprio"
on log_acoes for select
to authenticated
using (usuario_id = auth.uid());

-- Caso queira o log aberto para todo o grupo (mais transparência), use:
-- create policy "log_select_todo_grupo"
-- on log_acoes for select
-- to authenticated
-- using (true);
