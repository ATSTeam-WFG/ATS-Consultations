create table consultation_requests (
  id uuid primary key default uuid_generate_v4(),
  agency_name text not null,
  category text not null check (category in ('UNICORN','DIAMOND','GOLD','SILVER')),
  requested_time text,
  contacts jsonb default '[]',
  status text default 'pending' check (status in ('pending','converted','dismissed')),
  agent_id uuid references agents(id) on delete set null,
  submitted_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table consultation_requests enable row level security;

create policy "Public can submit requests" on consultation_requests
  for insert with check (true);

create policy "Team can manage requests" on consultation_requests
  for select using (auth.role() = 'authenticated');

create policy "Team can update requests" on consultation_requests
  for update using (auth.role() = 'authenticated');
