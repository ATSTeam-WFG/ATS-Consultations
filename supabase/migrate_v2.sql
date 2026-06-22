-- ============================================================
-- v2 Migration — run this if your DB was created before v2
-- Safe to run multiple times (all statements are idempotent)
-- ============================================================

-- AGENTS: add v2 columns
alter table agents add column if not exists agency_name text;
alter table agents add column if not exists category text check (category in ('UNICORN', 'DIAMOND', 'GOLD', 'SILVER'));
alter table agents add column if not exists wfg_rep text;
alter table agents add column if not exists contacts jsonb default '[]';
alter table agents add column if not exists location text;

-- Back-fill agency_name from name for existing rows
update agents set agency_name = name where agency_name is null;

-- Now enforce not null (after back-fill)
alter table agents alter column agency_name set not null;

-- AGENTS: drop old v1 columns if they exist
alter table agents drop column if exists phone;
alter table agents drop column if exists team;
alter table agents drop column if exists role;
alter table agents drop column if exists tenure_months;

-- SESSIONS: add session_type if missing
alter table sessions add column if not exists session_type text
  check (session_type in ('walk_in', 'zoom_call')) default 'zoom_call';

-- PLAYBOOKS: add agent_category_fit if missing
alter table playbooks add column if not exists agent_category_fit text[] default '{}';

-- TOOL RECOMMENDATIONS: replace avg_tps_fit numrange with min_tps/max_tps if needed
alter table tool_recommendations add column if not exists min_tps numeric;
alter table tool_recommendations add column if not exists max_tps numeric;
alter table tool_recommendations drop column if exists avg_tps_fit;
