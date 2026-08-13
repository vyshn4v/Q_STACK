# 03 — AI Systems

See also: [SKILL.md](../SKILL.md) · [02 — Data model](./02-data-model-and-rbac.md) · [04 — Event-driven activity](./04-event-driven-activity.md)

There are **two separate AI features** in QStack. Don't merge their code
paths — they solve different problems and have different cost/latency
profiles.

## LLM & embedding provider — free tier

No Gemini in this build — using free-tier inference instead, since this is
a demo project at 20-30 user scale:

| Need | Provider | Why |
|---|---|---|
| Embeddings (ingestion + query, part B) | **NVIDIA NIM** — `NV-Embed V1` via build.nvidia.com | Free tier, OpenAI-compatible embedding endpoint designed for dense retrieval |
| Chat completions (parts A and B) | **NVIDIA NIM** by default; **OpenRouter** as a drop-in swap | Both are OpenAI-compatible endpoints — swapping is a `base_url` + model-name change in the API client config, not a code change. OpenRouter provides multi-model routing and free-tier access (e.g. `meta-llama/llama-3.1-8b-instruct:free`) |

Default to NVIDIA NIM for everything (one provider, one free API key, one
thing to configure). Swap completion calls to OpenRouter if preferred — the embedding calls
stay on NIM.

Both providers gate on rate limits, not a hard spend cap, so the per-user
rate limiting called out in part (B) below matters more here than it would
on a paid, unlimited provider — a stray loop can burn through the daily
request cap fast on either free tier.

## A) Cached per-question AI answer ("view-answer AI")

Shown on every Question Detail view. Generated **once per question**, then
served from storage on every subsequent view — this is the whole point of
caching it: avoid paying for (or burning free-tier quota on) an LLM call on
every page load.

**Trigger**: a `question.created` event (see
[04](./04-event-driven-activity.md)) fires an async worker (BullMQ job on
Redis) that calls the LLM (NVIDIA NIM by default) and writes the result into
`question_ai_responses`.
Question pages never block on an LLM call — they read whatever's already in
that table.

**Status handling on the frontend**:

| `status` | Behavior |
|---|---|
| `pending` | Show a lightweight skeleton/loading state, not a spinner blocking the whole page |
| `ready` | Render the cached `response_text` |
| `failed` | Retry via the background job; don't surface a broken state to the user |

**Regeneration**: only on an explicit action (e.g. after a question edit
that meaningfully changes the body) — never automatically re-triggered by a
view. This is the mechanism that satisfies "avoid multiple usage of the AI."

> Assumption flagged: read "persist in sb" as "persist in the DB" (Postgres).
> If that meant something else specific, the storage layer is the only part
> of this design that would need to change — the caching behavior stays the
> same either way.

## B) AI chat (Pinecone RAG)

The sidebar "AI chat" feature — a completely separate system from (A), used
for open-ended questions rather than a single question's page.

**Ingestion pipeline** (runs on question/answer create or update):

1. Take title + body (+ top answers, once they exist) for a question
2. Generate embeddings (NVIDIA NIM's `NV-Embed V1`)
3. Upsert into Pinecone with metadata: `questionId`, `tags`, `contentType`

**Query pipeline** (runs on each chat message):

1. User sends a message in the AI chat sidebar
2. Embed the message (NVIDIA NIM `NV-Embed V1`, same model as ingestion — embedding queries and documents with different models breaks similarity search)
3. Pinecone similarity search (top-k, optionally filtered by tag/namespace)
4. Assemble retrieved snippets into context
5. Prompt the LLM (NVIDIA NIM or OpenRouter — see provider note above) with: context + user message + recent chat history
6. Stream the response back over Socket.io (or SSE) so it feels responsive

**Session storage**: `chat_sessions` / `chat_messages` in Postgres so a
user's chat history persists across visits to the sidebar (see
[02](./02-data-model-and-rbac.md) for the table shape).

**Cost control**: at 20-30 users this is low volume, but add basic
per-user rate limiting on the chat endpoint anyway — a stray loop or bot
account shouldn't be able to burn through NVIDIA NIM/OpenRouter's free-tier daily
request cap (or Pinecone's) unchecked.

## Where these two systems must not cross

- The cached per-question answer never uses Pinecone — it only needs that
  one question's own content, not retrieval across the platform.
- The AI chat never writes to `question_ai_responses` — its output is
  conversational and session-scoped, not a per-question artifact.
