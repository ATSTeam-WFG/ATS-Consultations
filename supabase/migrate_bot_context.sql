-- Migration: add bot_context column to tool_recommendations
-- Run in Supabase SQL editor

ALTER TABLE tool_recommendations ADD COLUMN IF NOT EXISTS bot_context TEXT;

-- Seed WFG Prompts with existing product knowledge
UPDATE tool_recommendations
SET bot_context = 'WFG PROMPTS — PRODUCT KNOWLEDGE FOR SALES REPS

WFG Prompts™ (powered by MyHome) is an AI-powered marketing and communication workspace for title agencies. Tagline: "Your ideas. Your voice. Amplified." It turns everyday agency ideas into polished content that sounds authentically like the user — not generic AI.

FIVE FEATURES:

1. Brand Voice — A guided onboarding interview that learns the agency''s unique tone, vocabulary, and communication style. Every output is automatically written in that voice.

2. AI Assistant — A conversational drafting partner. The rep describes what they need (Realtor outreach, social post, event invite, email campaign) and the assistant asks one clarifying question at a time before producing strategic, on-brand content. It never produces generic filler.

3. Prompt Library — Ready-to-use title-agency marketing recipes across 12 categories: agency branding, Realtor relationships, lender/builder outreach, client communication, closing coordination, title education, social media, events, operations, reputation, and leadership. The title-agent-specific library is rolling out end of 2026; the platform currently has real estate marketing examples to explore in the meantime.

4. Listings Made Easy — Guided workflow for creating property listing copy and exploring print design options. Note: live MLS connection and print fulfillment are not currently live features.

5. My Concierge Creative — A short weekly guided interview (5–10 min) about wins, activities, and ideas that transforms the rep''s answers into ready-to-use content. Manual interview flow available now.

ACCESS & STATUS:
- Currently in beta — internal WFG team access since November 10, 2026
- Title-agent-specific prompt library: rolling out end of 2026
- Broader title-agent market introduction: early 2027
- Referral-only access: reps request a code from atsteam@wfgtitle.com
- Onboarding: wfgprompts.ai → Get Started → enter referral code → set up Brand Voice → try a prompt
- Support: support@wfgprompts.ai or atsteam@wfgtitle.com

IMPORTANT GUARDRAILS — never claim:
- Legal, underwriting, or compliance advice
- Automatic compliance or accuracy guarantees (human review always required)
- Live MLS connection, print fulfillment, or publishing integrations
- Unsubstantiated time-saving figures or security certifications
- Realtor/lender/builder direct access — they receive content agencies create, not platform users

When a rep asks about WFG Prompts: share wfgprompts.ai, walk through the 5 features conversationally, explain the referral-code access process (atsteam@wfgtitle.com), then ask if they''d like to submit a consultation request for a personalized demo or onboarding support.'
WHERE name ILIKE '%WFG Prompts%' OR name ILIKE '%wfgprompts%';
