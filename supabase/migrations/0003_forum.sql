-- Fórum do ateliê: tópicos e respostas da comunidade.
create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 140),
  body text not null check (char_length(body) between 4 and 5000),
  category text not null default 'Styling' check (category in ('Styling', 'Medidas & caimento', 'Cuidados', 'Lançamentos', 'Geral')),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  author_staff boolean not null default false,
  pinned boolean not null default false,
  locked boolean not null default false,
  replies_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on public.forum_topics (pinned desc, last_activity_at desc);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 5000),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  author_staff boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.forum_replies (topic_id, created_at);

-- Autoria vem sempre da sessão, nunca do que o cliente envia.
create function public.forum_stamp_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if not found then raise exception 'Entre na sua conta para participar do fórum.'; end if;
  new.author_id := p.id;
  new.author_name := coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Cliente');
  new.author_staff := p.role in ('owner', 'staff');
  new.created_at := now();
  if tg_table_name = 'forum_topics' then
    new.replies_count := 0;
    new.last_activity_at := now();
    if not new.author_staff then new.pinned := false; new.locked := false; end if;
  elsif exists (select 1 from public.forum_topics t where t.id = new.topic_id and t.locked) and not new.author_staff then
    raise exception 'Este tópico está fechado para novas respostas.';
  end if;
  return new;
end $$;

create trigger forum_topics_author before insert on public.forum_topics
for each row execute function public.forum_stamp_author();
create trigger forum_replies_author before insert on public.forum_replies
for each row execute function public.forum_stamp_author();

create function public.forum_count_replies() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_topics set replies_count = replies_count + 1, last_activity_at = now() where id = new.topic_id;
  else
    update public.forum_topics set replies_count = greatest(0, replies_count - 1) where id = old.topic_id;
  end if;
  return null;
end $$;

create trigger forum_replies_count after insert or delete on public.forum_replies
for each row execute function public.forum_count_replies();

alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;

create policy "leitura pública" on public.forum_topics for select using (true);
create policy "contas criam tópicos" on public.forum_topics for insert to authenticated with check (true);
create policy "equipe modera" on public.forum_topics for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "autora ou equipe remove" on public.forum_topics for delete
  using (author_id = (select auth.uid()) or (select public.is_staff()));

create policy "leitura pública" on public.forum_replies for select using (true);
create policy "contas respondem" on public.forum_replies for insert to authenticated with check (true);
create policy "autora ou equipe remove" on public.forum_replies for delete
  using (author_id = (select auth.uid()) or (select public.is_staff()));

revoke execute on function public.forum_stamp_author() from public, anon, authenticated;
revoke execute on function public.forum_count_replies() from public, anon, authenticated;
