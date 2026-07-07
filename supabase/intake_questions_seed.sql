INSERT INTO intake_questions (key, type, title, subtitle, options, max_select, display_order, enabled) VALUES

('monthly_volume', 'choice', 'How many transactions does your agency close monthly?', 'Your Volume',
  '[
    {"label": "<25",          "value": "<25"},
    {"label": "25–50",        "value": "25-50"},
    {"label": "50–100",       "value": "50-100"},
    {"label": "100–250",      "value": "100-250"},
    {"label": "250+",         "value": "250+"}
  ]'::jsonb,
  null, 1, true),

('team_size', 'choice', 'How large is your team?', 'Your Team',
  '[
    {"label": "Just me",         "value": "Solo"},
    {"label": "2–5 people",      "value": "2-5"},
    {"label": "6–15 people",     "value": "6-15"},
    {"label": "16–30 people",    "value": "16-30"},
    {"label": "30+ people",      "value": "30+"}
  ]'::jsonb,
  null, 2, true),

('current_software', 'multiselect', 'What software does your agency use today?', 'Current Tools',
  '[
    {"label": "Qualia",      "value": "Qualia"},
    {"label": "RamQuest",    "value": "RamQuest"},
    {"label": "SoftPro",     "value": "SoftPro"},
    {"label": "ResWare",     "value": "ResWare"},
    {"label": "ClosingCorp", "value": "ClosingCorp"},
    {"label": "Other",       "value": "Other"}
  ]'::jsonb,
  null, 3, true),

('challenge_areas', 'multiselect', 'Where do you feel the most friction day-to-day?', 'Where You Struggle',
  '[
    {"label": "Order Entry & File Opening",    "value": "order_entry"},
    {"label": "Purchase & Sale Agreements",    "value": "purchase_sale_agreement"},
    {"label": "Closing Coordination",          "value": "closing_coordination"},
    {"label": "Post-Closing & Recording",      "value": "post_closing"},
    {"label": "Remittance & Disbursement",     "value": "remittance"},
    {"label": "Escrow Accounting",             "value": "escrow_accounting"},
    {"label": "Workflow Automations",          "value": "tps_automations"},
    {"label": "Software Integrations",         "value": "integrations"},
    {"label": "AI Tools & Adoption",           "value": "ai_adoption"},
    {"label": "Marketing & Outreach",          "value": "marketing"},
    {"label": "CRM & Prospecting",             "value": "crm_prospects"},
    {"label": "Lender Relationships",          "value": "lender_relations"},
    {"label": "Realtor Relationships",         "value": "realtor_relations"},
    {"label": "Reporting & Analytics",         "value": "reporting"},
    {"label": "Compliance & Audits",           "value": "compliance"},
    {"label": "Wire Fraud Prevention",         "value": "wire_fraud_prevention"},
    {"label": "Policy & Procedure Management", "value": "policies"},
    {"label": "Title Search & Examination",    "value": "title_search"},
    {"label": "Staffing & Team Capacity",      "value": "team_capacity"},
    {"label": "Client Communication",          "value": "client_communication"}
  ]'::jsonb,
  5, 4, true),

('success_looks_like', 'text', 'What would a successful consultation look like for you?', 'Your Goals',
  null, null, 5, true),

('additional_context', 'contact', 'Last step — almost there.', 'Anything Else',
  null, null, 6, true)

ON CONFLICT (key) DO NOTHING;
