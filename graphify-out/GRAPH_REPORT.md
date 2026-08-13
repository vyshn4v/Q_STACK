# Graph Report - Q_STACK  (2026-08-13)

## Corpus Check
- 184 files · ~68,058 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1227 nodes · 2149 edges · 79 communities (61 shown, 18 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de37534c`
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
- [[_COMMUNITY_Community 33|Community 33]]
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
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]

## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 53 edges
2. `DatabaseService` - 50 edges
3. `useAuth()` - 45 edges
4. `IEventBus` - 25 edges
5. `ReputationRepository` - 23 edges
6. `compilerOptions` - 22 edges
7. `api` - 21 edges
8. `JwtAuthGuard` - 19 edges
9. `compilerOptions` - 18 edges
10. `AdminApiClient` - 18 edges

## Surprising Connections (you probably didn't know these)
- `AuthContextType` --references--> `User`  [EXTRACTED]
  frontend/client/src/context/AuthContext.tsx → frontend/client/src/types/index.ts
- `ProtectedRoute()` --calls--> `useAdminAuth()`  [EXTRACTED]
  frontend/admin/src/App.tsx → frontend/admin/src/context/AdminAuthContext.tsx
- `FollowButton()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/client/src/components/common/FollowButton.tsx → frontend/client/src/context/AuthContext.tsx
- `ReportModal()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/client/src/components/common/ReportModal.tsx → frontend/client/src/context/AuthContext.tsx
- `AIAnswerBlock()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/client/src/components/qa/AIAnswerBlock.tsx → frontend/client/src/context/AuthContext.tsx

## Communities (79 total, 18 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (12): AiConsumerService, AiController, AiModule, AiChatService, ChatMessageRow, ChatSessionRow, EmbeddingsService, LlmService (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, class-transformer, class-validator, ioredis, @nestjs/common, @nestjs/config, @nestjs/core (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (23): dependencies, lucide-react, react, react-dom, react-quill-new, react-router-dom, devDependencies, oxlint (+15 more)

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
Cohesion: 0.14
Nodes (13): 06 — Design System, Admin UI — same tokens, different density, App shell — condensed, Breakpoints, code:block1 (AppHeader · GlobalSearch · SidebarNavigation · MobileNavigat), Component inventory (build once, share across app + admin where sensible), Design priority (maps to phases — see [07](./07-phase-roadmap.md)), Landing page — condensed (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (9): 02 — Data Model & RBAC, code:block1 (user → moderator → admin → super admin), code:block2 (reported → moderator_review → admin_review → super_admin_rev), Core entities, Medals vs. badges — these are two different things, Permission matrix, Report escalation flow, Role hierarchy (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (9): 07 — Phase Roadmap, Phase 0 — Foundation, Phase 1 — Core auth + Q&A loop (MVP), Phase 2 — Community signals, Phase 3 — Event-driven activity + reputation/badges, Phase 4 — AI systems, Phase 5 — RBAC + admin panel, Phase 6 — Landing page (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (6): AnswersController, AnswerItem, AnswersRepository, AnswersService, CreateAnswerDto, UpdateAnswerDto

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (7): CastVoteDto, VoteTargetType, VotesController, VotesModule, VoteResult, VotesRepository, VotesService

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
Cohesion: 0.33
Nodes (5): 03 — AI Systems, A) Cached per-question AI answer ("view-answer AI"), B) AI chat (Pinecone RAG), LLM & embedding provider — free tier, Where these two systems must not cross

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (4): code:json ({), Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (14): AuthController, AuthIdentityRow, AuthRepository, UserRow, AuthService, AuthTokens, JwtPayload, JwtStrategy (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (26): adminApi, AdminContentItem, AdminReport, AdminStats, AdminUser, ObservabilityData, AdminAuthContext, AdminAuthContextType (+18 more)

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (9): api, AppShell(), styles, styles, styles, QuestionCard(), QuestionCardProps, styles (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (7): CommentsController, CommentItem, CommentsRepository, CommentsService, CommentParentType, CreateCommentDto, UpdateCommentDto

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (3): TagsController, TagRow, TagsService

### Community 42 - "Community 42"
Cohesion: 0.09
Nodes (10): UpdateProfileDto, UpdateProfileDto, UsersController, UsersModule, UserActivityRow, UserAnswerRow, UserProfile, UserQuestionRow (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (15): GiveMedalDto, MedalsController, MedalsModule, MedalRecord, MedalsRepository, QuestionMedalsSummary, MedalsService, AppEvent (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (14): scripts, build, format, lint, migrate, start, start:debug, start:dev (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (6): author, description, license, name, private, version

### Community 49 - "Community 49"
Cohesion: 0.16
Nodes (3): NotificationsGateway, NotificationRecord, NotificationsRepository

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (6): ToggleFollowDto, FollowsController, FollowsModule, FollowRecord, FollowsRepository, FollowsService

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (19): FollowButton(), FollowButtonProps, styles, LeaderboardPage(), styles, styles, TagsPage(), styles (+11 more)

### Community 53 - "Community 53"
Cohesion: 0.16
Nodes (15): AuthModal(), styles, useAuth(), AppHeader(), styles, AppShellProps, styles, MobileNavigation() (+7 more)

### Community 54 - "Community 54"
Cohesion: 0.12
Nodes (21): REPORT_CATEGORIES, ReportModal(), ReportModalProps, styles, RichTextRenderer(), RichTextRendererProps, styles, styles (+13 more)

### Community 55 - "Community 55"
Cohesion: 0.13
Nodes (5): BookmarksController, BookmarksModule, BookmarkedQuestionRow, BookmarksRepository, BookmarksService

### Community 56 - "Community 56"
Cohesion: 0.05
Nodes (11): DEFAULT_SYSTEM_BADGES, REPUTATION_SCORING_CONFIG, ScoringConfig, SystemBadgeRule, ReputationController, ActivityEventRow, CronRunRow, ReputationLedgerRow (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.10
Nodes (17): AuthContext, AuthContextType, AuthProvider(), AIChatPage(), ChatMessage, styles, AuthCallbackPage(), styles (+9 more)

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (7): formats, modules, RichMarkdownEditor(), RichMarkdownEditorProps, styles, AskQuestionPage(), styles

### Community 59 - "Community 59"
Cohesion: 0.21
Nodes (11): Roles(), UpdateUserBanDto, UpdateUserRoleDto, EscalationLevel, ReportStatus, TargetType, Tier, UserRole (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.17
Nodes (13): AnswersModule, AuthModule, CommentsModule, Environment, EnvironmentVariables, validate(), NotificationsModule, QuestionsModule (+5 more)

### Community 62 - "Community 62"
Cohesion: 0.19
Nodes (6): CreateReportDto, EscalateReportDto, ResolveReportDto, ReportsController, ReportRow, ReportsService

### Community 63 - "Community 63"
Cohesion: 0.17
Nodes (7): CreateQuestionDto, QueryQuestionsDto, UpdateQuestionDto, QuestionsController, QuestionDetail, QuestionListItem, QuestionsService

### Community 66 - "Community 66"
Cohesion: 0.26
Nodes (4): AuthUserPayload, CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (4): AdminModule, AdminContentItem, AdminRepository, AdminUserListItem

### Community 70 - "Community 70"
Cohesion: 0.28
Nodes (3): AllExceptionsFilter, ApiResponse, TransformInterceptor

### Community 73 - "Community 73"
Cohesion: 0.38
Nodes (3): Public(), CreateSessionDto, SendChatMessageDto

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (3): MedalControl(), MedalControlProps, styles

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (3): BookmarkButton(), BookmarkButtonProps, styles

## Knowledge Gaps
- **389 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DatabaseService` connect `Community 69` to `Community 0`, `Community 32`, `Community 64`, `Community 67`, `Community 71`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 75`, `Community 72`, `Community 17`, `Community 50`, `Community 49`, `Community 18`, `Community 55`, `Community 56`, `Community 63`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `IEventBus` connect `Community 43` to `Community 0`, `Community 32`, `Community 68`, `Community 40`, `Community 17`, `Community 50`, `Community 18`, `Community 55`, `Community 62`, `Community 63`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `ReputationRepository` connect `Community 56` to `Community 61`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07183673469387755 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._