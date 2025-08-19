# AI Mind-Map — Build Guide (Embedded AI)

**Goal:** Plan out the files, stack, and responsibilities so the chatbot can scaffold the project step-by-step.

## 1. Tech Stack

### Frontend
- Next.js 15 (React, App Router)
- React Flow (graph visualization)
- TailwindCSS + shadcn/ui (UI kit)
- Zustand (client state)
- SWR/React Query (data fetching)

### Backend
- Express (AI + API server)
- Supabase (Postgres DB, auth, storage)
- Prisma ORM (schema + migrations)
- Zod (validation)

### AI Integration
- OpenAI / Anthropic API (LLM calls)
- Optional: Web scraping + RAG via Supabase pgvector

### Infrastructure
- Vercel (frontend hosting)
- Fly.io/Render (backend service)
- Supabase Cloud (DB + auth)

## 2. File/Folder Structure

```
root/
 ├─ apps/
 │   ├─ web/ (Next.js frontend)
 │   │   ├─ app/            # App Router pages
 │   │   ├─ components/     # React UI components
 │   │   ├─ hooks/          # Zustand + fetch hooks
 │   │   ├─ lib/            # utils (api client, schema)
 │   │   └─ styles/
 │   └─ server/ (Express backend)
 │       ├─ src/
 │       │   ├─ index.ts    # server entry
 │       │   ├─ routes/
 │       │   │   ├─ ai.ts   # /ai/* endpoints
 │       │   │   └─ graph.ts# CRUD endpoints for nodes/edges
 │       │   ├─ services/
 │       │   │   ├─ ai/     # prompt orchestrator, context builder
 │       │   │   └─ db/     # Prisma client
 │       │   ├─ schemas/   # Zod validation
 │       │   └─ utils/
 ├─ prisma/
 │   └─ schema.prisma
 ├─ packages/
 │   ├─ types/   # shared TS types (GraphDoc, NodeDraft)
 │   └─ config/  # env, eslint, tsconfig
 ├─ .env.local
 └─ docker-compose.yml (optional local dev)
```

## 3. Database Schema (Prisma + Supabase)

```prisma
model IdeaNode {
  id        String   @id @default(cuid())
  title     String
  kind      String
  body      String?
  tags      String[]
  score     Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  edgesFrom LinkEdge[] @relation("FromEdges")
  edgesTo   LinkEdge[] @relation("ToEdges")
}

model LinkEdge {
  id        String   @id @default(cuid())
  sourceId  String
  targetId  String
  relation  String
  confidence Float?
  rationale  String?
  source    IdeaNode @relation("FromEdges", fields: [sourceId], references: [id])
  target    IdeaNode @relation("ToEdges", fields: [targetId], references: [id])
}

model Snippet {
  id     String   @id @default(cuid())
  url    String
  title  String
  quote  String
  date   DateTime
  tags   String[]
  vector Vector?
}
```

## 4. Key Components

### Frontend
- `GraphCanvas.tsx` — React Flow canvas
- `Sidebar.tsx` — AI modes (Suggest, Expand, Cluster, Links, Summarize, Research)
- `NodeEditor.tsx` — node details + Idea Template
- `CommandPalette.tsx` — ⌘K actions
- `DiffView.tsx` — approve/reject AI proposals

### Backend
- `routes/ai.ts` — /ai/* endpoints
- `services/ai/contextBuilder.ts` — gather graph context
- `services/ai/prompts.ts` — prompt seeds
- `services/ai/orchestrator.ts` — call LLMs, validate outputs
- `services/db/*` — Prisma wrappers

## 5. Build Phases

### Phase 1 — Graph CRUD (1 week)
- Next.js app with React Flow
- Node/Edge create, update, delete
- Supabase auth
- Express CRUD API with Prisma

### Phase 2 — AI Integration (1–2 weeks)
- /ai/* endpoints wired to OpenAI
- Context builder + orchestrator
- Sidebar with Suggest, Expand, Cluster, Links, Summarize
- Diff view for approval flow

### Phase 3 — Enhancements (stretch)
- RAG snippets store + search
- Obsidian export (markdown)
- Multi-view layouts (hierarchy, timeline)
- Scoring + prioritization heatmaps

## 6. Next Steps

1. Scaffold monorepo (pnpm workspaces)
2. Initialize Next.js + Express apps
3. Define Prisma schema + migrate to Supabase
4. Build Graph CRUD API + hook frontend
5. Implement AI endpoints with basic prompts
6. Add Sidebar + DiffView in frontend

This gives the chatbot a clear roadmap to scaffold files, connect services, and iterate toward the MVP.

---

## 12. Tech Stack (MVP-Friendly)

- **Frontend & API:** Next.js 14 (App Router, React 18), TypeScript, Tailwind, shadcn/ui, React Flow (graph)
- **Backend:** Next.js server actions/route handlers (no separate Express for MVP)
- **DB & Auth:** Supabase (Postgres + Auth) or Postgres (RDS/Neon) + NextAuth/Clerk
- **ORM & Validation:** Prisma + Zod
- **Search/Vector (optional):** pgvector (in Supabase/Neon) for RAG snippets
- **LLM:** server-side SDK (OpenAI/Anthropic via provider abstraction). All calls from server only
- **State:** Zustand for client-local; server state persisted in DB
- **Deploy:** Vercel (web + API) + Supabase/Neon (DB). Edge not required initially

> **Why no Express?** Next.js route handlers cover all /ai/* endpoints; keep infra minimal

## 13. Repository & File Layout

### Option A (MVP, single app):

```
/ (repo root)
  ├─ app/                      # Next.js App Router
  │   ├─ (dashboard)/
  │   │   ├─ graph/page.tsx    # Graph canvas view
  │   │   ├─ components/       # Graph UI (NodeCard, EdgeInspector, Sidebar)
  │   │   └─ hooks/
  │   └─ api/
  │       └─ ai/
  │           ├─ suggest-nodes/route.ts
  │           ├─ expand-node/route.ts
  │           ├─ cluster/route.ts
  │           ├─ suggest-links/route.ts
  │           ├─ summarize/route.ts
  │           └─ research/route.ts
  ├─ components/               # shared UI primitives (Button, TagChip, Facets)
  ├─ lib/
  │   ├─ db.ts                 # Prisma client
  │   ├─ ai/
  │   │   ├─ contextBuilder.ts
  │   │   ├─ prompts.ts        # prompt templates
  │   │   ├─ orchestrator.ts   # calls provider, returns drafts
  │   │   └─ postprocess.ts    # Zod validate, rank, dedupe
  │   ├─ schemas.ts            # Zod schemas (IdeaNodeDraft, LinkSuggestion, …)
  │   ├─ scoring.ts            # score helpers
  │   ├─ auth.ts               # NextAuth/Clerk helpers (if used)
  │   └─ rag.ts                # (optional) snippets search helpers
  ├─ prisma/
  │   ├─ schema.prisma
  │   └─ migrations/
  ├─ public/
  ├─ styles/
  ├─ package.json
  ├─ .env.local.example
  └─ README.md
```

### Option B (later, monorepo): 
`/apps/web`, `/packages/ui`, `/packages/types`, `/packages/ai`

## 14. Data Model (Prisma)

```prisma
model User {
  id     String  @id @default(cuid())
  email  String  @unique
  name   String?
  spaces Space[]
}

model Space {
  id        String        @id @default(cuid())
  name      String
  ownerId   String
  owner     User          @relation(fields: [ownerId], references: [id])
  members   SpaceMember[]
  nodes     Node[]
  edges     Edge[]
  tags      Tag[]
  snippets  Snippet[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model SpaceMember {
  id      String @id @default(cuid())
  spaceId String
  userId  String
  role    Role   @default(EDITOR)
  space   Space  @relation(fields: [spaceId], references: [id])
  user    User   @relation(fields: [userId], references: [id])
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}

model Node {
  id                 String    @id @default(cuid())
  spaceId            String
  title              String
  kind               NodeKind
  body               String    @default("")
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  scorePainkiller    Int?
  scoreFounderFit    Int?
  scoreTiming        Int?
  scoreMoat          Int?
  scorePracticality  Int?
  space              Space     @relation(fields: [spaceId], references: [id])
  tags               NodeTag[]
  outEdges           Edge[]    @relation("Edge_source")
  inEdges            Edge[]    @relation("Edge_target")
}

enum NodeKind {
  problem
  solution
  market
  tech
  theme
  note
}

model Edge {
  id       String   @id @default(cuid())
  spaceId  String
  sourceId String
  targetId String
  relation Relation
  weight   Float?
  space    Space    @relation(fields: [spaceId], references: [id])
  source   Node     @relation("Edge_source", fields: [sourceId], references: [id])
  target   Node     @relation("Edge_target", fields: [targetId], references: [id])
}

enum Relation {
  solves
  depends_on
  competes_with
  related
  enables
  contradicts
}

model Tag {
  id      String    @id @default(cuid())
  spaceId String
  label   String
  space   Space     @relation(fields: [spaceId], references: [id])
  nodes   NodeTag[]
  
  @@unique([spaceId, label])
}

model NodeTag {
  nodeId String
  tagId  String
  node   Node   @relation(fields: [nodeId], references: [id])
  tag    Tag    @relation(fields: [tagId], references: [id])
  
  @@id([nodeId, tagId])
}

model Snippet {
  id        String    @id @default(cuid())
  spaceId   String
  url       String?
  title     String?
  quote     String
  date      DateTime?
  tags      String[]
  embedding Float[]?
  space     Space     @relation(fields: [spaceId], references: [id])
}
```

**Indexes:** `Edge(sourceId)`, `Edge(targetId)`, `Node(spaceId, kind)`, `Tag(spaceId,label)`

## 15. API Contracts (Zod)

```typescript
// lib/schemas.ts
export const IdeaNodeDraft = z.object({
  title: z.string(),
  kind: z.enum(['problem', 'solution', 'market', 'tech', 'theme', 'note']),
  body: z.string().optional(),
  tags: z.array(z.string()).optional(),
  score: z.object({
    painkiller: z.number().min(1).max(5).optional(),
    founderFit: z.number().min(1).max(5).optional(),
    timing: z.number().min(1).max(5).optional(),
    moat: z.number().min(1).max(5).optional(),
    practicality: z.number().min(1).max(5).optional()
  }).partial().optional()
});

export const LinkSuggestion = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  relation: z.enum(['solves', 'depends_on', 'competes_with', 'related', 'enables', 'contradicts']),
  confidence: z.number().min(0).max(1),
  rationale: z.string().optional()
});
```

**Route handler pattern:** validate → build context → call orchestrator → validate drafts → return list

## 16. LLM Integration

- **Provider wrapper:** `lib/ai/orchestrator.ts` switches between OpenAI/Anthropic via env (`AI_PROVIDER`)
- **Prompt templates** in `lib/ai/prompts.ts` with small, testable functions per mode
- **Safety:** temperature defaults low for Expand/Links; higher for Suggest
- **Token bounds:** Context Builder caps nodes/edges; summarization reduces text before calls

## 17. Frontend Components (Key)

- `GraphCanvas` (React Flow config, layouts, selection)
- `AISidebar` (tabs: Suggest/Expand/Cluster/Links/Summarize/Research)
- `DiffPanel` (review & apply proposed changes)
- `NodeCard` / `EdgeInspector`
- `FacetBar` (filters for tags/kind/stage)
- `ScoreInputs` (1–5 sliders with derived total)

## 18. Environment & Configuration

**Required environment variables:**

```bash
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
RAG_ENABLED=false
```

## 19. Build Steps (Chatbot-Friendly)

1. **Init:** `npx create-next-app@latest`, add Tailwind, shadcn, React Flow, Prisma
2. **DB:** define `schema.prisma` → `prisma migrate dev`
3. **Models:** Zod schemas in `lib/schemas.ts`
4. **Graph UI:** scaffold `(dashboard)/graph/page.tsx` with React Flow + selection state
5. **Sidebar:** AISidebar with tabs + forms → POST to `/api/ai/*`
6. **AI Service:** implement contextBuilder, prompts, orchestrator, postprocess
7. **CRUD:** node/edge/tag endpoints & UI modals
8. **Diff Apply:** add DiffPanel to accept AI drafts → write to DB
9. **Auth:** add Supabase Auth or NextAuth (email magic link)
10. **Deploy:** Vercel + Supabase; add envs; run migrations

## 20. Testing & Quality

- **Unit:** schemas, postprocess (validation/dedupe)
- **Integration:** route handlers (`/api/ai/*`) with mocked LLM
- **E2E:** Playwright flows (create nodes → cluster → apply diff)
- **Performance budget:** subgraph context ≤ 200 nodes; LLM call p95 ≤ 6s

## 21. Analytics & Telemetry

- **PostHog** (events: `suggest_opened`, `suggest_applied`, `cluster_applied`, `link_applied`)
- **Structured logs** on server for prompt/cost tracking (no PII)

## 22. Roadmap (Weeks 1–4)

- **Week 1:** Graph CRUD, basic canvas, auth, Prisma schema, Suggest (no RAG)
- **Week 2:** Expand, Cluster, Link suggestions; DiffPanel polish; filters/facets
- **Week 3:** Summarize digests; snippets store + simple web clipping; deploy; analytics
- **Week 4:** Polished layouts, import/export (JSON), Obsidian export, team roles

## 23. Nice-to-Haves (Later)

- Embedding-based auto-linking; Leiden clustering; heatmaps
- Obsidian live sync; CSV import; theme mining across spaces
- Offline-first (Yjs); enterprise SSO; RBAC policies


Future:
- Hidden notes, when clicking on the node can view the notes
- Analytics
- Querying nodes