# 01 — Tech Architecture

See also: [SKILL.md](../SKILL.md) · [04 — Event-driven activity](./04-event-driven-activity.md) · [07 — Phase roadmap](./07-phase-roadmap.md)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | NestJS + TypeScript | Modular structure maps cleanly to the domain modules below; easy to split into services later without a rewrite |
| Database | PostgreSQL, raw SQL (no ORM) | Stated preference — hand-written queries, one query module per domain module |
| Cache + events | Redis | Doubles as cache, pub/sub event bus (Streams), and a lightweight job queue (BullMQ) — one process instead of three |
| Vector store | Pinecone (managed) | External/hosted — doesn't compete for RAM on the 1GB box, unlike a self-hosted option (pgvector, Milvus, Weaviate) |
| LLM + embeddings | NVIDIA NIM (build.nvidia.com) — free tier, no card, OpenAI-compatible | External/hosted, same RAM-budget reasoning as Pinecone; one free API key covers both chat completions and embeddings. OpenRouter (openrouter.ai) is a drop-in swap for the completions half (flexible model routing) — see [03](./03-ai-systems.md) |
| Auth | Passport.js (local, google, github strategies) + JWT access/refresh | Stateless auth scales horizontally without sticky sessions, which matters once this moves to Kubernetes |
| Realtime | Socket.io | Notifications, AI chat streaming |
| Frontend | React + Vite + Redux/RTK Query (or React Query) | Matches existing stack familiarity |
| Admin UI | Separate React + Vite app | Own build, own deploy artifact — see rationale below |

## Why this fits a 1 vCPU / 1GB box today

The two heaviest workloads in a system like this — the LLM and the vector
search — are both offloaded to external managed APIs (NVIDIA NIM/OpenRouter for
the LLM, Pinecone for vector search).
Nothing compute-heavy runs on the box itself. What's left to run locally is:

- Node process (NestJS API)
- Postgres
- Redis
- Nginx (reverse proxy / TLS termination)

That's a realistic fit for 1GB at 20-30 user scale. Rough budget, not a
guarantee — measure and adjust once it's running:

| Process | Approx. RAM |
|---|---|
| Postgres | ~150-250MB |
| Redis | ~50-100MB |
| Node/NestJS | ~150-300MB (watch this — it's the one most likely to grow) |
| Nginx | ~10-20MB |
| OS + headroom | remainder |

**RabbitMQ and Kafka are deliberately not in the current build.** Kafka's
JVM alone typically needs more RAM than this whole box has; RabbitMQ's
Erlang VM is lighter but still an extra process competing for the same 1GB.
Redis Streams covers the event-bus need (see
[04](./04-event-driven-activity.md)) without adding a process. The event bus
is built behind a small interface specifically so Kafka can be swapped in
later without touching business logic — see the "Deploy path" section below.

## Service boundaries (monolith first, on purpose)

At 20-30 users, microservices would add operational overhead
(service discovery, network hops, more moving parts to keep alive on 1GB)
without a real benefit. Build one NestJS app with clearly separated modules
instead:

```
auth · users · questions · answers · comments · votes · tags · medals
reputation · badges · activity · notifications · ai · admin
```

Each module owns its own data-access layer (raw SQL queries) and doesn't
reach into another module's tables directly — call the other module's
service instead. This is what makes a later split into services possible
without a rewrite, if it's ever actually needed.

## Deploy path

**Phase A — now.** Single VM. Docker Compose running: NestJS API, Postgres,
Redis, Nginx. TLS via Certbot. `.env` for all config/secrets.

**Phase B — later, on Kubernetes.** Because everything is already
containerized in Phase A, this is a lift-and-shift, not a rewrite:

- Docker Compose services → Kubernetes Deployments (one pod type per
  service) + a Helm chart
- `.env` → Kubernetes Secrets (or an External Secrets setup)
- Self-hosted Postgres → managed Postgres (RDS / Cloud SQL) if desired
- Redis Streams event bus adapter → swap for a `KafkaEventBus` implementing
  the same publish/subscribe interface (see
  [04](./04-event-driven-activity.md)) — only needed if event volume
  actually grows past what Redis comfortably handles
- Add a Horizontal Pod Autoscaler on the API deployment since auth is
  already stateless (JWT, no server-side sessions)

## Admin UI as a separate app

Built and deployed as its own React/Vite app rather than gated routes inside
the main app:

- Keeps the main user-facing bundle smaller (no admin code shipped to
  regular users)
- Matches the RBAC boundary architecturally, not just at the route level
- Can share a component library and API client package with the main app in
  the same monorepo, so it isn't a second full app to hand-build
