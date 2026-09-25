-- Atendly: Supabase persistence
-- Run this entire file in Supabase Dashboard -> SQL Editor.

create table if not exists public.app_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key)
);

alter table public.app_state enable row level security;

drop policy if exists "Users can read their own Atendly state" on public.app_state;
create policy "Users can read their own Atendly state"
  on public.app_state for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own Atendly state" on public.app_state;
create policy "Users can insert their own Atendly state"
  on public.app_state for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Atendly state" on public.app_state;
create policy "Users can update their own Atendly state"
  on public.app_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists app_state_user_id_idx on public.app_state(user_id);
create index if not exists app_state_updated_at_idx on public.app_state(updated_at desc);

-- Keep updated_at correct even when the client does not send it.
create or replace function public.set_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_state_updated_at on public.app_state;
create trigger set_app_state_updated_at
before update on public.app_state
for each row execute function public.set_app_state_updated_at();

-- Optional but useful for local development and testing:
-- Enable Google under Authentication -> Providers -> Google in the dashboard.
