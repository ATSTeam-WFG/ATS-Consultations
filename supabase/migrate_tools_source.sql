alter table tool_recommendations
  add column if not exists source text not null default 'external'
  check (source in ('ats', 'external'));
