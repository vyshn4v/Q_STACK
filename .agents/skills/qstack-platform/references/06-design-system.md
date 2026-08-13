# 06 — Design System

See also: [SKILL.md](../SKILL.md) · [02 — Data model](./02-data-model-and-rbac.md) · [07 — Phase roadmap](./07-phase-roadmap.md)

Source docs: `landing_page_design_document.docx` and
`community_app_full_uiux_design_document.docx`. This file condenses both
into one implementation reference and maps the new functional requirements
(medals, AI chat, resume-style profile) onto the existing information
architecture. **These are two separate token systems for two separate
surfaces — don't let the landing page's tokens leak into the app, or vice
versa.**

## Two surfaces, two design systems

| Surface | Purpose | Source doc |
|---|---|---|
| Landing page (public, pre-login) | Marketing/conversion | `landing_page_design_document.docx` |
| App shell (post-login product) + Admin UI | The actual product | `community_app_full_uiux_design_document.docx` |

## Landing page — condensed

**IA** (top to bottom): Nav (logo, Product/Solutions/Resources/Pricing, Sign
in, Get Started) → Hero (headline + supporting copy + CTA + product visual)
→ Social proof → Core value proposition → 3-4 feature-story sections
(alternating image/text) → Product experience showcase → Results/proof →
Final CTA → Footer.

**Tokens** (landing page only):

| Token | Value direction |
|---|---|
| Background | Warm/off-white |
| Surface | White / very light neutral |
| Text primary | Near-black |
| Text secondary | Muted gray |
| Accent | One strong brand color, used sparingly (CTAs, highlights) |
| Radius | 16-28px on cards; pill or soft-rounded buttons |
| Type | Grotesk/sans-serif; hero 64-88px desktop, section headings 42-60px, body 17-20px |
| Section spacing | 96-160px vertical rhythm |

**Rules**: original product naming/copy/visuals throughout (the reference is
layout inspiration only, not a template to copy). Respect
`prefers-reduced-motion`. Deliverables: desktop (1440px), tablet (~1024px),
mobile (390px), plus hover/focus/pressed/loading/disabled states for every
interactive component.

## App shell — condensed

**Global shell**: top bar (logo, global search, Ask Question CTA,
notifications, avatar) · left nav (Home, Questions, Tags, Users, Bookmarks,
followed topics, **AI Chat**, admin/moderation entry — role-gated) · main
content column · optional right rail (trending tags, unanswered questions,
stats).

**Primary areas and screens**:

| Area | Screens |
|---|---|
| Home | Home / personalized feed (tabs: For You / Latest / Following / Unanswered) |
| Questions | All Questions / Unanswered / Newest / Trending, with sort + tag/status/time filters |
| Ask | Question composer (title → body → tags → preview → review → publish) |
| Question | Question Detail — the core screen, see below |
| Tags | Tag Directory / Tag Detail |
| Users | User Directory / User Profile |
| Notifications | Notification Center |
| Bookmarks | Saved Items |
| Reputation | Reputation / Activity |
| Search | Global search with autocomplete (questions, tags, users) |
| Settings | Profile / Preferences / Security |

**Question Detail** (highest-traffic screen — build carefully): header
(title, date, author, tags) → voting rail → body (rich text, code blocks,
images) → **cached AI answer block** (new — see below) → actions
(edit/share/bookmark/follow/report) → comments → answers (sorted, each with
its own vote rail, accepted-state, comments) → answer composer → right rail
(related questions, tags, contributor info).

## Where the new requirements slot into the existing IA

These three are new relative to the source docs — here's where they attach:

- **Medal-giving**: a "Give medal" action next to the voting rail /
  accepted-answer indicator on Question Detail. Visually distinct from a
  vote — it's an endorsement, not a score. Gold/silver/bronze tier picker.
- **AI chat**: its own left-nav item (alongside Home/Questions/Tags/Users),
  opening a dedicated chat screen/sidebar — separate from the cached
  per-question AI answer block, which lives inline on Question Detail. See
  [03](./03-ai-systems.md) for why these stay separate systems.
- **Resume-style profile fields**: extend the existing Profile tab set
  (Overview / Questions / Answers / Saved / Activity / Badges) with
  Personal Details / Education / Experience sub-tabs, editable from
  Settings.
- **Cached AI answer block**: sits directly under the question body on
  Question Detail, before comments — pending/ready/failed states per
  [03](./03-ai-systems.md).

## Visual tokens (app only — do not reuse landing page tokens here)

| Token | Value direction |
|---|---|
| Background | Warm white / very light neutral |
| Surface | White cards, subtle 1px borders (prefer borders over heavy shadows) |
| Primary | One distinctive brand color — links, primary CTA, selected states |
| Secondary accents | 2-3 soft colors for badges/tags/highlights |
| Success | Accepted-answer state only |
| Warning/danger | Moderation and destructive actions only |
| Radius | 12-20px major surfaces, 8-12px chips/small controls |
| Type | Question titles 20-28px, body 16-18px, UI labels 13-15px, metadata 12-13px, dedicated monospace for code |

**Accessibility (applies to both surfaces)**: visible keyboard focus on
every interactive control, never color-alone for status/accepted/error
states, comfortable touch targets, keyboard-accessible modals/dropdowns,
reduced-motion support, sufficient text contrast.

## Component inventory (build once, share across app + admin where sensible)

```
AppHeader · GlobalSearch · SidebarNavigation · MobileNavigation
QuestionList · QuestionRow · QuestionCard · VoteControl · MedalControl
AnswerCard · AcceptedAnswerBadge · TagChip · TagPicker
UserMiniCard · UserAvatar · ReputationBadge · BadgeItem
CommentThread · RichTextEditor · CodeBlock · MarkdownPreview
FilterBar · SortControl · Pagination · NotificationItem
Toast · Modal · Dropdown · Tooltip
Tabs · EmptyState · SkeletonLoader · ConfirmationDialog
AIAnswerBlock · AIChatPanel
```

(`MedalControl`, `AIAnswerBlock`, `AIChatPanel` are additions beyond the
source doc's inventory, for the new features above.)

## Design priority (maps to phases — see [07](./07-phase-roadmap.md))

| Priority | Screens |
|---|---|
| P0 | App shell, Home, Question List, Question Detail, Ask Question |
| P1 | Search, Tags, User Profile, Notifications, Bookmarks |
| P2 | Badges, reputation history, advanced filters, moderation views |

## Admin UI — same tokens, different density

Reuse the app's color/type tokens for brand consistency, but design it as a
denser, utility-first layout — data tables, filters, bulk actions — rather
than the consumer app's card-based, spacious layout. Admin users are
optimizing for speed, not browsing.
