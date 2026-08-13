---
name: qstack-platform
description: Architecture and build reference for QStack — a Stack Overflow-style Q&A / developer knowledge-community platform with RAG-based AI features (cached per-question AI answers + a Pinecone-backed AI chat), event-driven activity tracking, a nightly reputation/badge job, and 4-tier RBAC with a separate admin panel. Load this skill whenever working on QStack's backend, frontend, admin panel, AI/RAG pipeline, RBAC, or reputation system. Always read references/07-phase-roadmap.md first to find the active phase, then open only the reference file(s) that phase points to.
---

# QStack — Architecture Skill

This skill is the single source of truth for how QStack is built. It replaces
ad-hoc prompting — read the relevant reference file before writing code for
that part of the system, instead of re-deriving the design from scratch each
session.

## Read this first, every session

1. Open **`references/07-phase-roadmap.md`** — it tells you which phase is
   active and which reference files that phase needs.
2. Open only the 1-3 reference files that phase points to. Don't read the
   whole skill on every task — each file is scoped so you only pay the token
   cost for the part you're touching.
3. If a task spans two domains (e.g. "add medal-giving," which touches data
   model + design), read both files for that phase, not the whole set.

## Reference files

| File | Covers | Read when touching... |
|---|---|---|
| `references/01-tech-architecture.md` | Stack choices, service boundaries, resource budget for the 1 vCPU/1GB box, deploy path to Kubernetes | Infra, deployment, choosing a library, anything resource-budget related |
| `references/02-data-model-and-rbac.md` | Entities/tables, voting rule, medals vs. badges, role hierarchy, permission matrix, report escalation flow | Schema/migrations, any CRUD endpoint, auth guards, admin actions |
| `references/03-ai-systems.md` | The two separate AI features: cached per-question AI answer, and the Pinecone-backed AI chat | Anything under `/ai`, question creation side-effects, the AI chat sidebar |
| `references/04-event-driven-activity.md` | EventBus design (Redis Streams now, Kafka-swappable later), event catalog, activity logging, daily login tracking | Any feature that should emit or consume an event; the activity feed |
| `references/05-reputation-badges.md` | The 1am nightly cron: reputation scoring, badge rules, moderator auto-promotion | The cron job, reputation ledger, badge logic |
| `references/06-design-system.md` | Landing page IA + app shell IA + visual tokens + component inventory, synthesized from the two design docs | Any UI work, either app |
| `references/07-phase-roadmap.md` | Build order across all of the above, phase by phase | Start of every session — read this first |

Each reference file has a short "See also" line pointing to the others it
depends on — follow those links rather than re-reading everything.

## Use Graphify before scanning the codebase

Graphify (the semantic code-graph tool) is installed locally on this
machine. Before grepping or reading files one by one to find where something
lives, run Graphify and use its graph output to jump straight to the
relevant files/symbols. Do this on every task in this skill, not just large
ones — it's what keeps token usage down across a multi-phase build like this
one.

## Global constraints (apply in every phase, don't re-derive these)

- **Postgres with raw SQL, no ORM.** This is deliberate — write query
  functions by hand. Keep them in a thin data-access layer per module so raw
  SQL doesn't leak into controllers/services.
- **All config in `.env` / `local.env`.** Never commit these, never hardcode
  a secret, key, or connection string. Values must be fillable by a user who
  can't read the committed repo's secrets.
- **OWASP basics throughout**: parameterized queries only (never string-built
  SQL), password hashing (bcrypt/argon2), rate limiting on auth and AI
  endpoints, input validation (class-validator/DTOs) on every controller.
- **Code must read like a junior dev wrote it and a senior dev reviewed it.**
  Full variable names (no `aId`, no cryptic abbreviations), comments where
  the "why" isn't obvious from the code itself.
- **`/migration` folder, version-numbered**, with a short release note added
  every few schema changes — not just the raw SQL diff.
- **Comment entity is unified.** One `comments` table usable on both
  questions and answers — don't build separate "sub-answer" and "comment"
  tables.
- **Build and confirm one phase/module at a time.** Write tests alongside the
  code, not after. Don't jump ahead to a later phase's code because it seems
  related — flag it and stop instead, so each step can be checked against
  what it's supposed to do before the next one starts.

## One-paragraph project summary

QStack is a developer Q&A platform (Stack Overflow shape) plus a knowledge
layer on top: every question gets a cached AI-generated summary/answer
(generated once, reused on every view), and there's a separate AI chat that
uses Pinecone to answer questions with real context from the platform's own
content. Users vote, answer, comment, and can hand out a "medal" to mark a
question as especially valuable. Activity (posts, votes, medals, logins)
flows through an event bus into an activity log that a 1am nightly job turns
into reputation scores and badges — which is also what promotes a user to
moderator. Admins and a single super admin manage the platform through a
separate admin UI, with a report → moderator → admin → super admin
escalation path. Target scale is small (20-30 users, a resume/demo project)
on a 1 vCPU/1GB box today, but the design should not need a rewrite to move
to Kubernetes later.
