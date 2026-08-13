# 05 — Reputation & Badges (1am nightly job)

See also: [SKILL.md](../SKILL.md) · [02 — Data model](./02-data-model-and-rbac.md) · [04 — Event-driven activity](./04-event-driven-activity.md)

## Job shape

A scheduled task (NestJS `@Cron('0 1 * * *')`, run in UTC — store/display
user-facing times converted to their local timezone) that, on each run:

1. Reads `activity_events` since the last successful run (track this with a
   `cron_runs` table: `id, started_at, completed_at, status, events_processed`
   — needed for idempotency and observability, see below).
2. Computes a reputation delta per user from that batch of events.
3. Writes each delta as a row in `reputation_ledger` (never just increments
   `users.reputation_total` directly without a ledger row — the ledger is
   what lets the profile show "why points changed").
4. Updates `users.reputation_total` from the ledger.
5. Evaluates badge rules and awards any newly-earned badges.
6. Evaluates the moderator-promotion threshold and promotes qualifying
   users.

## Suggested scoring table (defaults — tune via config, not hardcoded)

| Event | Reputation delta |
|---|---|
| Question upvote received | +5 |
| Question downvote received | -2 |
| Answer upvote received | +10 |
| Answer downvote received | -2 |
| Answer accepted | +15 |
| Medal received (bronze / silver / gold) | +5 / +10 / +20 |
| Daily login (streak contribution) | small flat amount, e.g. +1 |

These numbers are a starting point modeled loosely on how Stack
Overflow weights things, not a value the project specified beyond the
voting rule in [02](./02-data-model-and-rbac.md) — keep them in a config
file so they're easy to rebalance once real usage data exists.

## Badge rules

Keep badge criteria in a small rules table rather than hardcoded
conditionals, so adding a badge later doesn't mean touching the cron logic:

| Field | Purpose |
|---|---|
| `name`, `tier` | e.g. "Well Regarded" / gold |
| `criteria_type` | e.g. `medals_received`, `accepted_answers`, `login_streak_days` |
| `threshold` | e.g. 5 medals, 10 accepted answers, 30-day streak |

Award idempotently — check the user doesn't already have that badge before
inserting, since the job may process overlapping windows on retry.

## Moderator auto-promotion

When a user's activity score (a config-defined combination of reputation,
recent activity volume, and medals received) crosses a threshold, the job
promotes them from `user` to `moderator` directly — this is automatic, not
something an admin approves. See [02](./02-data-model-and-rbac.md) for why
promotion beyond moderator (to admin) stays manual and super-admin-only:
this job produces the trust/activity signal the super admin looks at when
making that call, it doesn't make the call itself.

## Idempotency & failure handling

- Every write in the job (ledger inserts, badge awards, promotions) must be
  safe to re-run — use upserts/existence checks, not blind increments, so a
  crashed-and-restarted run doesn't double-count.
- Log each run to `cron_runs` with status and event count processed — if a
  run fails partway, the next run's "since last successful run" window
  should pick up from the last *completed* run, not the last *attempted*
  one.
