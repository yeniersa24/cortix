-- =============================================================================
-- Cortix - esquema de base de datos
-- Pegalo entero en el SQL Editor de Supabase y dale Run.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enlaces
-- -----------------------------------------------------------------------------
create table if not exists public.links (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  destination   text not null,
  title         text,
  owner_token   text not null,
  active        boolean not null default true,
  views         bigint not null default 0,   -- aperturas de la pagina puente (impresiones)
  completions   bigint not null default 0,   -- visitantes que llegaron al destino
  created_at    timestamptz not null default now(),
  created_ip    text
);

create index if not exists links_created_at_idx on public.links (created_at desc);
create index if not exists links_owner_token_idx on public.links (owner_token);

-- -----------------------------------------------------------------------------
-- Eventos (una fila por vista y por redireccion completada)
-- -----------------------------------------------------------------------------
create table if not exists public.link_events (
  id            bigserial primary key,
  link_id       uuid not null references public.links(id) on delete cascade,
  kind          text not null check (kind in ('view', 'complete')),
  visitor_hash  text,
  day           date not null default (now() at time zone 'utc')::date,
  country       text,
  referer       text,
  created_at    timestamptz not null default now()
);

create index if not exists link_events_link_day_idx on public.link_events (link_id, day desc);
create index if not exists link_events_visitor_idx on public.link_events (link_id, visitor_hash);

-- -----------------------------------------------------------------------------
-- RLS: nadie entra con la clave anonima. La app solo habla con la service role
-- key desde el servidor, que ignora RLS. Asi el destino de un enlace nunca se
-- puede leer directo desde el navegador saltandose la pagina puente.
-- -----------------------------------------------------------------------------
alter table public.links enable row level security;
alter table public.link_events enable row level security;

-- -----------------------------------------------------------------------------
-- Registrar un evento e incrementar el contador en una sola llamada.
-- -----------------------------------------------------------------------------
create or replace function public.record_link_event(
  p_code text,
  p_kind text,
  p_visitor_hash text default null,
  p_country text default null,
  p_referer text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_id uuid;
begin
  select id into v_link_id from public.links where code = p_code;
  if v_link_id is null then
    return;
  end if;

  insert into public.link_events (link_id, kind, visitor_hash, country, referer)
  values (v_link_id, p_kind, p_visitor_hash, p_country, p_referer);

  if p_kind = 'view' then
    update public.links set views = views + 1 where id = v_link_id;
  elsif p_kind = 'complete' then
    update public.links set completions = completions + 1 where id = v_link_id;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Serie diaria para las graficas del panel.
-- -----------------------------------------------------------------------------
create or replace function public.link_daily_stats(p_code text, p_days int default 30)
returns table (day date, views bigint, completions bigint)
language sql
security definer
set search_path = public
as $$
  select
    e.day,
    count(*) filter (where e.kind = 'view')     as views,
    count(*) filter (where e.kind = 'complete') as completions
  from public.link_events e
  join public.links l on l.id = e.link_id
  where l.code = p_code
    and e.day >= ((now() at time zone 'utc')::date - p_days)
  group by e.day
  order by e.day;
$$;

-- -----------------------------------------------------------------------------
-- Visitantes unicos de un enlace (huellas distintas, no IPs).
-- -----------------------------------------------------------------------------
create or replace function public.link_unique_visitors(p_code text)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(distinct e.visitor_hash)
  from public.link_events e
  join public.links l on l.id = e.link_id
  where l.code = p_code and e.kind = 'view';
$$;

-- -----------------------------------------------------------------------------
-- Totales globales para el panel de admin.
-- -----------------------------------------------------------------------------
create or replace function public.global_stats()
returns table (links bigint, views bigint, completions bigint)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.links),
    (select coalesce(sum(views), 0) from public.links),
    (select coalesce(sum(completions), 0) from public.links);
$$;
