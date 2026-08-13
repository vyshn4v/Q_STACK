# 02 — Data Model & RBAC

See also: [SKILL.md](../SKILL.md) · [05 — Reputation & badges](./05-reputation-badges.md) · [06 — Design system](./06-design-system.md)

## Core entities

Field lists are the key columns to design around, not full DDL — write the
actual `CREATE TABLE` statements in `/migration` when the relevant phase
starts.

| Entity | Key fields | Notes |
|---|---|---|
| `users` | id, email, password_hash (nullable), display_name, avatar_url, bio, role, reputation_total, created_at | `password_hash` is null for OAuth-only accounts |
| `auth_identities` | id, user_id, provider (local/google/github), provider_user_id | One row per linked login method |
| `questions` | id, author_id, title, body, status, created_at, updated_at | `status`: open / closed / soft-deleted |
| `answers` | id, question_id, author_id, body, is_accepted, created_at | |
| `comments` | id, parent_type (question/answer), parent_id, author_id, body, created_at | Single unified table — no separate sub-answer table |
| `tags` | id, name, description | |
| `question_tags` | question_id, tag_id | Join table |
| `votes` | id, target_type (question/answer), target_id, user_id, value (+1/-1) | See voting rule below |
| `medals` | id, question_id, given_by_user_id, tier (gold/silver/bronze), given_at | Manual "this question is valuable" signal — see distinction below |
| `badges` | id, user_id, name, tier, awarded_at | System-awarded, via nightly job — see [05](./05-reputation-badges.md) |
| `reputation_ledger` | id, user_id, delta, reason, source_event_id, created_at | Append-only — this is what powers "why points changed" on the profile |
| `follows` | follower_id, followed_id (or followed_tag_id) | Users can follow users or tags |
| `reports` | id, target_type, target_id, reporter_id, reason, status, escalation_level, created_at | Drives the escalation flow below |
| `activity_events` | id, event_type, user_id, payload (jsonb), created_at | Append-only log fed by the event bus — see [04](./04-event-driven-activity.md) |
| `daily_active` | user_id, date | Upsert per login, used for streaks/engagement |
| `question_ai_responses` | question_id, response_text, model, status, generated_at | Cached per-question AI answer — see [03](./03-ai-systems.md) |
| `chat_sessions` / `chat_messages` | session id, user_id / session_id, role, content, created_at | AI chat history — see [03](./03-ai-systems.md) |
| `notifications` | id, user_id, type, payload, read_at, created_at | |

## Voting rule

- Upvote from no prior vote: **+1**
- Downvote from no prior vote: **-1**
- Switching an existing upvote to a downvote: **net -2**

Apply this identically to question votes and answer votes.

## Medals vs. badges — these are two different things

- **Medal**: a manual signal another user gives to a question they found
  especially valuable (gold/silver/bronze). Attributed to the question, and
  counted toward the question's *author's* trust score.
- **Badge**: system-awarded to a *user*, computed by the nightly cron from
  activity + reputation + medals received (see
  [05](./05-reputation-badges.md)). Don't let these two concepts merge in
  the schema or the UI — they answer different questions ("was this post
  good?" vs. "is this user, overall, trustworthy?").

## Role hierarchy

Exactly one super admin exists in the system (seeded at deploy time, not
self-service). The rest is:

```
user → moderator → admin → super admin
```

- **user → moderator**: automatic, triggered by the nightly job when a
  user's activity score crosses a configured threshold (see
  [05](./05-reputation-badges.md)). Not a manual action.
- **moderator/user → admin**: manual only. Only the super admin can promote
  someone to admin, and the reputation/badge/trust data from the nightly
  job is what they use to decide.
- **admin → super admin**: not supported. There is only ever one.

## Permission matrix

| Action | User | Moderator | Admin | Super admin |
|---|---|---|---|---|
| Ask/answer/comment/vote/give medal | ✅ | ✅ | ✅ | ✅ |
| Report a post or user | ✅ | ✅ | ✅ | ✅ |
| Review reports (moderation queue) | — | ✅ | ✅ | ✅ |
| Escalate a report upward | — | ✅ → admin | ✅ → super admin | — |
| Soft-delete a post | — | — | ✅ | ✅ |
| Ban a user | — | — | ✅ | ✅ |
| View admin dashboard | — | — | ✅ (own scope) | ✅ (full) |
| Promote user → admin | — | — | — | ✅ |
| Access client app + full admin panel | ✅ (client only) | ✅ (client only) | admin panel (scoped) | both, unrestricted |

Admin's dashboard access is scoped to tracking/banning/soft-delete and
whatever moderators have escalated to them. Super admin can surf the entire
system — client and admin panel, no scope restriction.

## Report escalation flow

State machine on `reports.status`:

```
reported → moderator_review → admin_review → super_admin_review → resolved/dismissed
```

- A single user report enters `moderator_review`.
- High report volume on the same target auto-escalates it straight to
  `admin_review` (define the volume threshold as a config value, tune later
  based on real usage).
- A moderator can manually escalate a report to `admin_review`.
- An admin can manually escalate a report to `super_admin_review`.
- Every level can resolve or dismiss at their own level without escalating
  further.
