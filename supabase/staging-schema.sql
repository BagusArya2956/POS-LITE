create table if not exists public.vigo_pos_state (
  instance_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.vigo_pos_state enable row level security;

drop policy if exists "Allow staging read access" on public.vigo_pos_state;
create policy "Allow staging read access"
on public.vigo_pos_state
for select
to anon, authenticated
using (true);

drop policy if exists "Allow staging write access" on public.vigo_pos_state;
create policy "Allow staging write access"
on public.vigo_pos_state
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow staging update access" on public.vigo_pos_state;
create policy "Allow staging update access"
on public.vigo_pos_state
for update
to anon, authenticated
using (true)
with check (true);
