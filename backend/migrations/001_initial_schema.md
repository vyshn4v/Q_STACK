# Migration 001: Initial Schema

**Date**: 2026-08-13  
**Status**: Applied  
**Applies To**: PostgreSQL (Raw SQL)

## Summary of Changes
- **Core User & Identity System**:
  - `users`: User profiles with `role` (`user`, `moderator`, `admin`, `super_admin`), `reputation_total`, and account status.
  - `auth_identities`: Multi-provider auth linkages (`local`, `google`, `github`).
- **Q&A System**:
  - `questions`: Question threads with status (`open`, `closed`, `soft_deleted`), score cache, and view counters.
  - `answers`: Answer submissions with accepted solution flag and score.
  - `comments`: Unified single-table hierarchy for both question and answer comment threads.
  - `tags` & `question_tags`: Tagging vocabulary and join relation.
  - `votes`: Composite unique voting records for questions and answers with `+1`/`-1` values.
  - `medals`: Manual gold/silver/bronze endorsement signals on questions.
- **Reputation, Badges & Activity**:
  - `badge_rules` & `badges`: Dynamic criteria and user-earned badge awards.
  - `reputation_ledger`: Append-only audit ledger of reputation point transactions.
  - `activity_events`: Append-only system event log powering the Redis Streams event bus and nightly 1 AM cron job.
  - `daily_active`: Idempotent daily login tracking for engagement streaks.
  - `cron_runs`: Job run history, metrics, and idempotency tracking.
- **Dual AI Systems**:
  - `question_ai_responses`: Cached per-question AI summary generated asynchronously via Gemini.
  - `chat_sessions` & `chat_messages`: Multi-turn conversational AI RAG chat persistence.
- **Community, Moderation & Notifications**:
  - `follows`: User, tag, and question subscription graph.
  - `bookmarks`: User question bookmark collection.
  - `reports`: 4-stage escalation flow (`reported` -> `moderator_review` -> `admin_review` -> `super_admin_review` -> `resolved`/`dismissed`).
  - `notifications`: User notification queue with unread indexing.
- **Migration Tracking**:
  - `schema_migrations`: Table tracking executed migration versions.
