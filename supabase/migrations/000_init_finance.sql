-- Habilitar extensões úteis
create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- MERCHANTS (canônicos)
create table if not exists public.merchants (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  nome text not null,
  cnpj text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, slug)
);

-- MAPA de reconciliação (aprende com correções do usuário)
create table if not exists public.merchant_map (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_substring text not null,
  merchant_id bigint references public.merchants(id) on delete set null,
  cnpj text,
  categoria text,
  confianca real default 0.99,
  criado_por uuid references auth.users(id) on delete set null,
  atualizado_em timestamptz default now()
);

-- Cache de CNPJ (evita bater API toda hora)
create table if not exists public.cnpj_cache (
  cnpj text primary key,
  nome_fantasia text,
  razao_social text,
  cnae_principal text,
  atualizado_em timestamptz default now()
);

-- Lançamentos normalizados
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conta_id text,
  data date not null,
  descricao_raw text not null,
  merchant_raw text,
  merchant_norm text,
  merchant_slug text,
  merchant_id bigint references public.merchants(id) on delete set null,
  tipo text,
  natureza text check (natureza in ('Entrada','Saída','Neutra')),
  valor numeric(14,2) not null,
  categoria text,
  cnpj text,
  confidence real,
  fontes text,
  created_at timestamptz default now()
);

create index if not exists idx_tx_user_date on public.transactions(user_id, data);
create index if not exists idx_tx_user_slug on public.transactions(user_id, merchant_slug);
create index if not exists idx_merchant_user_slug on public.merchants(user_id, slug);

-- VIEW de recorrência (assinaturas)
create or replace view public.subscriptions_view as
with series as (
  select
    user_id,
    merchant_slug,
    valor,
    data,
    lead(data) over (partition by user_id, merchant_slug order by data) as prox_data
  from public.transactions
  where natureza = 'Saída'
),
intervalos as (
  select
    user_id,
    merchant_slug,
    abs(extract(day from (prox_data - data)))::int as delta,
    valor
  from series
  where prox_data is not null
),
stats as (
  select
    user_id,
    merchant_slug,
    count(*) as ciclos,
    avg(delta)::numeric(10,2) as ciclo_medio,
    stddev_samp(valor)::numeric(14,2) as desv_valor,
    avg(valor)::numeric(14,2) as media_valor,
    min(valor)::numeric(14,2) as min_valor,
    max(valor)::numeric(14,2) as max_valor
  from intervalos
  group by 1,2
)
select *
from stats
where ciclos >= 2 and ciclo_medio between 25 and 35;

-- RPC para listar assinaturas do usuário logado
create or replace function public.list_subscriptions()
returns setof public.subscriptions_view
language sql
security definer
set search_path = public
as $$
  select *
  from public.subscriptions_view
  where user_id = auth.uid();
$$;

-- RLS
alter table public.merchants enable row level security;
alter table public.merchant_map enable row level security;
alter table public.transactions enable row level security;

-- Policies (owner only)
do $$
begin
  if not exists (select 1 from pg_policies where policyname='merchants_owner' and tablename='merchants') then
    create policy merchants_owner on public.merchants
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where policyname='merchant_map_owner' and tablename='merchant_map') then
    create policy merchant_map_owner on public.merchant_map
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where policyname='transactions_owner' and tablename='transactions') then
    create policy transactions_owner on public.transactions
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;