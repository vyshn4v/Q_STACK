# 04 — Event-Driven Activity Tracking

See also: [SKILL.md](../SKILL.md) · [01 — Tech architecture](./01-tech-architecture.md) · [05 — Reputation & badges](./05-reputation-badges.md) · [03 — AI systems](./03-ai-systems.md)

## EventBus abstraction

Define a small interface once, implement it with Redis Streams first:

```
EventBus.publish(topic: string, event: object): void
EventBus.subscribe(topic: string, handler: (event) => void): void
```

**Implementation now**: Redis Streams (via `ioredis`), not plain Redis
pub/sub — Streams persist events and support consumer groups + replay,
which the nightly reputation job needs (it has to read "everything since
last run," not just catch events live). Plain pub/sub is fire-and-forget
and would lose events if a consumer is down.

**Why not Kafka/RabbitMQ now**: see the resource-budget reasoning in
[01](./01-tech-architecture.md) — neither fits comfortably in 1GB alongside
Postgres, Redis, and the API process.

**Migration path**: when this moves to Kubernetes and/or event volume grows,
implement `KafkaEventBus` against the same interface and swap the binding at
bootstrap. No consumer or producer code changes.

## Event catalog

| Event | Producer | Consumers |
|---|---|---|
| `question.created` | Questions module | Activity logger, AI ingestion (03), Pinecone ingestion (03) |
| `question.viewed` | Questions module | Activity logger |
| `answer.posted` | Answers module | Activity logger, notification consumer, Pinecone ingestion |
| `answer.accepted` | Answers module | Activity logger, reputation ledger (via nightly job) |
| `vote.cast` | Votes module | Activity logger |
| `medal.given` | Medals module | Activity logger, notification consumer |
| `comment.posted` | Comments module | Activity logger, notification consumer |
| `user.login` | Auth module | Activity logger, `daily_active` upsert |
| `report.filed` / `report.escalated` | Reports module | Notification consumer (moderator/admin queue) |

## Consumers

- **Activity logger**: writes every event into `activity_events`
  (append-only). This table is the source of truth the nightly reputation
  job reads from — see [05](./05-reputation-badges.md).
- **Notification consumer**: turns relevant events into rows in
  `notifications` and pushes them over Socket.io to connected clients.
- **AI/Pinecone ingestion consumer**: listens for `question.created` /
  `answer.posted` to trigger the two AI pipelines in
  [03](./03-ai-systems.md).

## Daily login tracking

On every successful login, publish `user.login`. The consumer does an
upsert into `daily_active(user_id, date)` — one row per user per day,
idempotent on repeat logins the same day. This is what powers login
streaks/engagement stats on the profile, and it's also an input to the
nightly activity-score calculation.
