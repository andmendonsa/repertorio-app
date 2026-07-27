-- ============================================================
-- Migração adicional: tabela "profiles"
-- Necessária para que o compartilhamento de listas por e-mail funcione.
-- (Por segurança, não é possível consultar auth.users diretamente pelo
-- app com a chave anon — esta tabela pública guarda só o e-mail de cada
-- usuário, sincronizada automaticamente quando alguém cria conta.)
--
-- Rode este arquivo no SQL Editor do Supabase, depois das tabelas e
-- políticas de RLS que você já criou.
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  criado_em timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select_autenticados"
on profiles for select
to authenticated
using (true);

-- Função + gatilho: toda vez que alguém cria conta (auth.users), cria
-- automaticamente a linha correspondente em profiles.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANTE: essa função só sincroniza contas criadas A PARTIR DE AGORA.
-- Se você já criou alguma conta de teste antes de rodar esta migração,
-- rode manualmente para os usuários existentes:
--
-- insert into public.profiles (id, email)
-- select id, email from auth.users
-- on conflict (id) do nothing;
