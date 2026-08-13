# 07 — Phase Roadmap

See also: [SKILL.md](../SKILL.md)

Read this file first, every session — it's the priority order for the whole
skill. Each phase lists exactly which other reference files it needs, so you
only load what's relevant to the phase you're in. Don't start a later
phase's work while an earlier one is still open — confirm each phase against
its own scope before moving on (see the global constraints in
[SKILL.md](../SKILL.md)).

## Phase 0 — Foundation

- Repo scaffold, NestJS project structure, Postgres schema + `/migration`
  folder convention, `.env`/`local.env` setup, Docker Compose for local dev
  (Postgres + Redis), CI skeleton.
- Read: [01](./01-tech-architecture.md), [02](./02-data-model-and-rbac.md)
  (schema only, not RBAC logic yet).

## Phase 1 — Core auth + Q&A loop (MVP)

- Email/password + Google + GitHub auth (Passport + JWT access/refresh).
- Questions CRUD, tags, answers, unified comments, voting (per the defined
  scoring rule).
- Screens: App shell, Home, Question List, Question Detail, Ask Question
  (P0 in the design doc).
- Read: [02](./02-data-model-and-rbac.md), [06](./06-design-system.md)
  (P0 screens only).

## Phase 2 — Community signals

- Medal-giving, follow/unfollow, bookmarks, notifications (Socket.io),
  search.
- Screens: Search, Tags, User Profile, Notifications, Bookmarks (P1).
- Read: [02](./02-data-model-and-rbac.md), [06](./06-design-system.md).

## Phase 3 — Event-driven activity + reputation/badges

- Redis Streams event bus + event catalog, `activity_events` log, daily
  login tracking, 1am nightly cron for reputation and badges.
- Screens: Reputation/Activity, Badges (P2).
- Read: [04](./04-event-driven-activity.md), [05](./05-reputation-badges.md).

## Phase 4 — AI systems

- Cached per-question AI answer (async, triggered on `question.created`).
- Pinecone ingestion pipeline + the AI chat sidebar (RAG).
- Read: [03](./03-ai-systems.md) (depends on Phase 3's event bus already
  being in place).

## Phase 5 — RBAC + admin panel

- Role hierarchy, permission matrix, report/escalation flow, separate admin
  UI, super admin seed script, wiring moderator auto-promotion to Phase 3's
  nightly job output.
- Read: [02](./02-data-model-and-rbac.md), [06](./06-design-system.md)
  (admin section).

## Phase 6 — Landing page

- Public marketing site. No backend dependency — this can be built in
  parallel with any other phase if convenient, since it doesn't touch the
  app's data model or auth.
- Read: [06](./06-design-system.md) (landing page section).

## Phase 7 — Scale-out

- Write Kubernetes manifests / Helm chart from the already-containerized
  Phase 0 setup. Swap the event bus adapter to Kafka only if event volume
  actually warrants it. Move to managed Postgres if desired. Add HPA on the
  API deployment. `.env` → Kubernetes Secrets.
- Read: [01](./01-tech-architecture.md) (deploy path section),
  [04](./04-event-driven-activity.md) (adapter-swap section).
- Not needed for the 20-30 user demo target — only do this phase if/when
  actually moving off the single box.
