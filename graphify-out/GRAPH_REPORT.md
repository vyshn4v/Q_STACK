# Graph Report - Q_STACK  (2026-08-13)

## Corpus Check
- 118 files · ~35,669 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 767 nodes · 1166 edges · 49 communities (42 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cb1d899`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `DatabaseService` - 28 edges
2. `compilerOptions` - 22 edges
3. `ApiClient` - 21 edges
4. `compilerOptions` - 18 edges
5. `compilerOptions` - 18 edges
6. `useAuth()` - 17 edges
7. `AuthService` - 16 edges
8. `compilerOptions` - 15 edges
9. `compilerOptions` - 15 edges
10. `scripts` - 14 edges

## Surprising Connections (you probably didn't know these)
- `RedisEventBusService` --implements--> `IEventBus`  [EXTRACTED]
  backend/src/redis/event-bus.service.ts → backend/src/redis/event-bus.interface.ts
- `AnswerCardProps` --references--> `Answer`  [EXTRACTED]
  frontend/client/src/components/qa/AnswerCard.tsx → frontend/client/src/types/index.ts
- `QuestionCardProps` --references--> `Question`  [EXTRACTED]
  frontend/client/src/components/qa/QuestionCard.tsx → frontend/client/src/types/index.ts
- `AuthModal()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/client/src/components/auth/AuthModal.tsx → frontend/client/src/context/AuthContext.tsx
- `AppHeader()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/client/src/components/layout/AppHeader.tsx → frontend/client/src/context/AuthContext.tsx

## Communities (49 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (7): DatabaseModule, DatabaseService, MigratorService, TagsController, TagRow, TagsRepository, TagsService

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (20): dependencies, bcrypt, class-transformer, class-validator, ioredis, @nestjs/common, @nestjs/config, @nestjs/core (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+23 more)

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
Cohesion: 0.07
Nodes (19): AnswersModule, Environment, EnvironmentVariables, validate(), AllExceptionsFilter, ApiResponse, TransformInterceptor, QuestionsModule (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (7): AnswersController, AnswerItem, AnswersRepository, AnswersService, CreateAnswerDto, UpdateAnswerDto, OptionalJwtAuthGuard

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

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (16): AuthController, AuthModule, AuthIdentityRow, AuthRepository, UserRow, AuthService, AuthTokens, JwtPayload (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (51): api, AuthModal(), styles, AuthContext, AuthContextType, AuthProvider(), useAuth(), AppHeader() (+43 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (8): CreateQuestionDto, QueryQuestionsDto, UpdateQuestionDto, QuestionsController, QuestionDetail, QuestionListItem, QuestionsRepository, QuestionsService

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (16): CommentsController, CommentsModule, CommentItem, CommentsRepository, CommentsService, Public(), CommentParentType, CreateCommentDto (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.15
Nodes (7): AuthUserPayload, CurrentUser, UpdateProfileDto, UsersController, UserProfile, UsersRepository, UsersService

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (7): CastVoteDto, VoteTargetType, IEventBus, VotesController, VoteResult, VotesRepository, VotesService

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (14): scripts, build, format, lint, migrate, start, start:debug, start:dev (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (6): author, description, license, name, private, version

## Knowledge Gaps
- **327 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DatabaseService` connect `Community 0` to `Community 32`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 17`, `Community 18`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `IEventBus` connect `Community 43` to `Community 32`, `Community 40`, `Community 41`, `Community 17`, `Community 18`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08819345661450925 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._