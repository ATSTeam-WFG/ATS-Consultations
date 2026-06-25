-- Migration: agent_playbooks bookmark table
-- Run this in the Supabase SQL editor

create table if not exists agent_playbooks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade not null,
  playbook_id uuid references playbooks(id) on delete cascade not null,
  added_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(agent_id, playbook_id)
);

create index if not exists idx_agent_playbooks_agent_id on agent_playbooks(agent_id);
create index if not exists idx_agent_playbooks_playbook_id on agent_playbooks(playbook_id);

alter table agent_playbooks enable row level security;

create policy "Team can manage agent playbooks"
  on agent_playbooks for all
  using (auth.role() = 'authenticated');
