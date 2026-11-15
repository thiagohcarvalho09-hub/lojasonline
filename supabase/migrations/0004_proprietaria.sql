-- Garante que tefi7009@gmail.com seja proprietária da loja (acesso total ao /admin),
-- tanto para a conta que já existe quanto para um cadastro futuro com esse e-mail.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when lower(new.email) = 'tefi7009@gmail.com' then 'owner'
      when exists (select 1 from public.profiles where role = 'owner') then 'customer'
      else 'owner'
    end
  );
  return new;
end $$;

-- Conta já cadastrada: cria o perfil se faltar e promove a proprietária.
insert into public.profiles (id, full_name, email, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)), u.email, 'owner'
from auth.users u
where lower(u.email) = 'tefi7009@gmail.com'
on conflict (id) do update set role = 'owner';
