-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- v2 MIGRATION NOTES (2026-06-22)
-- agents: removed phone, team, role, tenure_months
--         added agency_name, category, wfg_rep, contacts
-- sessions: added session_type
-- playbooks: added agent_category_fit text[]
-- tool_recommendations: replaced avg_tps_fit numrange with min_tps/max_tps numeric
-- ============================================================

-- ============================================================
-- AGENTS
-- ============================================================
create table if not exists agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  agency_name text not null,
  category text check (category in ('UNICORN', 'DIAMOND', 'GOLD', 'SILVER')),
  wfg_rep text,
  contacts jsonb default '[]',
  location text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agents_user_id on agents(user_id);

alter table agents enable row level security;
drop policy if exists "Users can manage their own agents" on agents;
create policy "Users can manage their own agents" on agents
  for all using (auth.uid() = user_id);

-- ============================================================
-- SESSIONS
-- ============================================================
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  rep_name text,
  session_date date not null,
  duration_minutes integer,
  notes text,
  transcript_url text,
  transcript_text text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'failed')),
  session_type text check (session_type in ('walk_in', 'zoom_call')) default 'zoom_call',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_agent_id on sessions(agent_id);
create index if not exists idx_sessions_status on sessions(status);

alter table sessions enable row level security;
drop policy if exists "Users can manage their own sessions" on sessions;
create policy "Users can manage their own sessions" on sessions
  for all using (auth.uid() = user_id);

-- ============================================================
-- SESSION ANALYSIS
-- ============================================================
create table if not exists session_analysis (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null unique,
  summary text,
  pain_points jsonb default '[]',
  problem_tags text[] default '{}',
  tool_recommendations jsonb default '[]',
  roadmap_steps jsonb default '[]',
  roi_estimate jsonb,
  matched_playbook_ids uuid[] default '{}',
  raw_claude_response jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_session_analysis_session_id on session_analysis(session_id);
create index if not exists idx_session_analysis_problem_tags on session_analysis using gin(problem_tags);

alter table session_analysis enable row level security;
drop policy if exists "Users can view session analysis for their sessions" on session_analysis;
create policy "Users can view session analysis for their sessions" on session_analysis
  for all using (
    exists (
      select 1 from sessions s where s.id = session_analysis.session_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- PROBLEMS
-- ============================================================
create table if not exists problems (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  description text not null,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  category text,
  created_at timestamptz default now()
);

create index if not exists idx_problems_session_id on problems(session_id);

alter table problems enable row level security;
drop policy if exists "Users can view problems for their sessions" on problems;
create policy "Users can view problems for their sessions" on problems
  for all using (
    exists (
      select 1 from sessions s where s.id = problems.session_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- TOOL RECOMMENDATIONS
-- ============================================================
create table if not exists tool_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  description text,
  use_cases text[] default '{}',
  ats_size_fit text[] default '{}',
  min_tps numeric,
  max_tps numeric,
  website_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tool_recommendations_user_id on tool_recommendations(user_id);

alter table tool_recommendations enable row level security;
drop policy if exists "Users can manage their own tools" on tool_recommendations;
create policy "Users can manage their own tools" on tool_recommendations
  for all using (auth.uid() = user_id);

-- ============================================================
-- AGENT TOOLS RECOMMENDED (junction)
-- ============================================================
create table if not exists agent_tools_recommended (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  tool_id uuid references tool_recommendations(id) on delete cascade not null,
  relevance_score numeric(3,2),
  rationale text,
  created_at timestamptz default now(),
  unique(session_id, tool_id)
);

alter table agent_tools_recommended enable row level security;
drop policy if exists "Users can view their agent tool recommendations" on agent_tools_recommended;
create policy "Users can view their agent tool recommendations" on agent_tools_recommended
  for all using (
    exists (
      select 1 from sessions s where s.id = agent_tools_recommended.session_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRENDS
-- ============================================================
create table if not exists trends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tag text not null,
  category text,
  session_count integer default 0,
  agent_count integer default 0,
  severity_avg numeric(3,2),
  trend_direction text check (trend_direction in ('rising', 'stable', 'falling')),
  description text,
  detected_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, tag)
);

create index if not exists idx_trends_user_id on trends(user_id);
create index if not exists idx_trends_session_count on trends(session_count desc);

alter table trends enable row level security;
drop policy if exists "Users can manage their own trends" on trends;
create policy "Users can manage their own trends" on trends
  for all using (auth.uid() = user_id);

-- ============================================================
-- PLAYBOOKS
-- ============================================================
create table if not exists playbooks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  trigger_tags text[] default '{}',
  ats_size_fit text[] default '{}',
  agent_category_fit text[] default '{}',
  min_tps numeric,
  max_tps numeric,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  estimated_weeks integer,
  steps jsonb default '[]',
  tools_needed text[] default '{}',
  expected_outcome text,
  usage_count integer default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_playbooks_user_id on playbooks(user_id);
create index if not exists idx_playbooks_status on playbooks(status);
create index if not exists idx_playbooks_trigger_tags on playbooks using gin(trigger_tags);

alter table playbooks enable row level security;
drop policy if exists "Users can manage their own playbooks" on playbooks;
create policy "Users can manage their own playbooks" on playbooks
  for all using (auth.uid() = user_id);

-- ============================================================
-- PLAYBOOK SESSIONS (usage tracking)
-- ============================================================
create table if not exists playbook_sessions (
  id uuid primary key default uuid_generate_v4(),
  playbook_id uuid references playbooks(id) on delete cascade not null,
  session_id uuid references sessions(id) on delete cascade not null,
  match_score numeric(3,2),
  match_reason text,
  used_at timestamptz default now(),
  unique(playbook_id, session_id)
);

create index if not exists idx_playbook_sessions_playbook_id on playbook_sessions(playbook_id);
create index if not exists idx_playbook_sessions_session_id on playbook_sessions(session_id);

alter table playbook_sessions enable row level security;
drop policy if exists "Users can view their playbook sessions" on playbook_sessions;
create policy "Users can view their playbook sessions" on playbook_sessions
  for all using (
    exists (
      select 1 from sessions s where s.id = playbook_sessions.session_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- QA CONVERSATIONS
-- ============================================================
create table if not exists qa_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_qa_conversations_user_id on qa_conversations(user_id);
create index if not exists idx_qa_conversations_updated_at on qa_conversations(updated_at desc);

alter table qa_conversations enable row level security;
drop policy if exists "Users can manage their own conversations" on qa_conversations;
create policy "Users can manage their own conversations" on qa_conversations
  for all using (auth.uid() = user_id);

-- ============================================================
-- QA MESSAGES
-- ============================================================
create table if not exists qa_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references qa_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  context_used jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_qa_messages_conversation_id on qa_messages(conversation_id);
create index if not exists idx_qa_messages_created_at on qa_messages(created_at);

alter table qa_messages enable row level security;
drop policy if exists "Users can view messages in their conversations" on qa_messages;
create policy "Users can view messages in their conversations" on qa_messages
  for all using (
    exists (
      select 1 from qa_conversations c where c.id = qa_messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger update_agents_updated_at before update on agents
  for each row execute function update_updated_at_column();
create or replace trigger update_sessions_updated_at before update on sessions
  for each row execute function update_updated_at_column();
create or replace trigger update_session_analysis_updated_at before update on session_analysis
  for each row execute function update_updated_at_column();
create or replace trigger update_tool_recommendations_updated_at before update on tool_recommendations
  for each row execute function update_updated_at_column();
create or replace trigger update_trends_updated_at before update on trends
  for each row execute function update_updated_at_column();
create or replace trigger update_playbooks_updated_at before update on playbooks
  for each row execute function update_updated_at_column();
create or replace trigger update_qa_conversations_updated_at before update on qa_conversations
  for each row execute function update_updated_at_column();
