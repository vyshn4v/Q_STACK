# Graph Report - Q_STACK  (2026-08-13)

## Corpus Check
- 55 files · ~16,675 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 435 nodes · 442 edges · 40 communities (35 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 22 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 18 edges
4. `compilerOptions` - 15 edges
5. `compilerOptions` - 15 edges
6. `scripts` - 13 edges
7. `DatabaseService` - 12 edges
8. `RedisService` - 11 edges
9. `06 — Design System` - 9 edges
10. `07 — Phase Roadmap` - 9 edges

## Surprising Connections (you probably didn't know these)
- `RedisEventBusService` --implements--> `IEventBus`  [EXTRACTED]
  backend/src/redis/event-bus.service.ts → backend/src/redis/event-bus.interface.ts

## Communities (40 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (10): Environment, EnvironmentVariables, validate(), DatabaseModule, DatabaseService, MigratorService, AppController, mockAppService (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (28): author, dependencies, bcrypt, class-transformer, class-validator, ioredis, @nestjs/common, @nestjs/config (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (22): dependencies, lucide-react, react, react-dom, react-router-dom, devDependencies, oxlint, @types/node (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (22): dependencies, lucide-react, react, react-dom, react-router-dom, devDependencies, oxlint, @types/node (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (5): AppEvent, IEventBus, RedisEventBusService, RedisModule, RedisService

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (15): 1. Start Infrastructure (PostgreSQL & Redis), 2. Configure Environment Variables, 3. Start Backend API, 4. Start Client Frontend, 5. Start Admin Frontend, code:block1 (Q_STACK/), code:bash (docker compose up -d), code:bash (cp .env.example backend/.env) (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (13): code:bash ($ npm install), code:bash (# development), code:bash (# unit tests), code:bash ($ npm install -g @nestjs/mau), Compile and run the project, Deployment, Description, License (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (13): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (10): 06 — Design System, Admin UI — same tokens, different density, App shell — condensed, code:block1 (AppHeader · GlobalSearch · SidebarNavigation · MobileNavigat), Component inventory (build once, share across app + admin where sensible), Design priority (maps to phases — see [07](./07-phase-roadmap.md)), Landing page — condensed, Two surfaces, two design systems (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (9): 02 — Data Model & RBAC, code:block1 (user → moderator → admin → super admin), code:block2 (reported → moderator_review → admin_review → super_admin_rev), Core entities, Medals vs. badges — these are two different things, Permission matrix, Report escalation flow, Role hierarchy (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (9): 07 — Phase Roadmap, Phase 0 — Foundation, Phase 1 — Core auth + Q&A loop (MVP), Phase 2 — Community signals, Phase 3 — Event-driven activity + reputation/badges, Phase 4 — AI systems, Phase 5 — RBAC + admin panel, Phase 6 — Landing page (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.28
Nodes (3): AllExceptionsFilter, ApiResponse, TransformInterceptor

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (5): EscalationLevel, ReportStatus, TargetType, Tier, UserRole

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (7): 01 — Tech Architecture, Admin UI as a separate app, code:block1 (auth · users · questions · answers · comments · votes · tags), Deploy path, Service boundaries (monolith first, on purpose), Stack, Why this fits a 1 vCPU / 1GB box today

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (6): 04 — Event-Driven Activity Tracking, code:block1 (EventBus.publish(topic: string, event: object): void), Consumers, Daily login tracking, Event catalog, EventBus abstraction

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): Global constraints (apply in every phase, don't re-derive these), One-paragraph project summary, QStack — Architecture Skill, Read this first, every session, Reference files, Use Graphify before scanning the codebase

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): 05 — Reputation & Badges (1am nightly job), Badge rules, Idempotency & failure handling, Job shape, Moderator auto-promotion, Suggested scoring table (defaults — tune via config, not hardcoded)

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (6): moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 27 - "Community 27"
Cohesion: 0.40
Nodes (4): code:json ({), Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (4): 03 — AI Systems, A) Cached per-question AI answer ("view-answer AI"), B) AI chat (Pinecone RAG), Where these two systems must not cross

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (4): code:json ({), Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **286 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 13` to `Community 1`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10416666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._