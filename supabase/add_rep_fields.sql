alter table consultation_requests
  add column if not exists rep_name text,
  add column if not exists rep_email text;
