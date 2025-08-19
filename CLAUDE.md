# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asteria is an AI-powered mind-mapping application for startup ideas and business concepts. It allows users to create interconnected nodes representing problems, solutions, markets, technologies, themes, and notes, with AI-assisted content generation and link suggestions.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI**: TailwindCSS 4, shadcn/ui components, Radix UI primitives
- **Graph Visualization**: React Flow for interactive node-edge graph canvas
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **State Management**: Zustand, React Query/TanStack Query
- **Validation**: Zod schemas
- **Package Manager**: pnpm

### Project Structure
```
/
├── web/                           # Next.js frontend application
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── (dashboard)/graph/ # Main graph canvas page
│   │   │   └── api/               # API routes (planned for AI endpoints)
│   │   ├── components/            # React components
│   │   │   ├── GraphCanvas.tsx    # Main React Flow graph component
│   │   │   ├── NodeEditPanel.tsx  # Node editing sidebar
│   │   │   ├── nodes/             # Custom React Flow node components
│   │   │   ├── edges/             # Custom React Flow edge components
│   │   │   └── ui/                # shadcn/ui components
│   │   ├── lib/                   # Utilities and core logic
│   │   │   ├── schemas.ts         # Zod validation schemas
│   │   │   ├── supabase.ts        # Supabase client setup
│   │   │   └── database.types.ts  # Generated Supabase types
│   │   └── hooks/                 # Custom React hooks
├── prisma/                        # Database schema and migrations
│   └── schema.prisma             # Prisma schema definition
├── generated/prisma/             # Generated Prisma client (custom output)
└── package.json                  # Root package dependencies
```

## Development Commands

### Frontend (web directory)
```bash
cd web
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Database
```bash
npx prisma migrate dev    # Apply database migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio
```

## Database Schema

The application uses a multi-tenant architecture with spaces containing nodes and edges:

### Core Models
- **User**: Authentication and space ownership
- **Space**: Workspace containers for graphs (multi-tenant)
- **Node**: Graph nodes with types (problem, solution, market, tech, theme, note)
- **Edge**: Connections between nodes with relations (solves, depends_on, competes_with, related, enables, contradicts)
- **Tag**: Categorization system with many-to-many relationship to nodes
- **Snippet**: Future feature for web clipping and RAG

### Node Scoring System
Each node has optional 1-5 scores for:
- Pain Killer (how well it addresses pain points)
- Founder Fit (alignment with founder strengths)
- Timing (market timing)
- Moat (competitive advantage)
- Practicality (ease of implementation)

## Key Components

### GraphCanvas.tsx
- Main React Flow wrapper with custom node/edge types
- Handles node creation via "N" key or double-click
- Manages selection state and interactions
- Custom node type: `ideaNode` (IdeaNodeCard component)
- Custom edge type: `relationEdge` (RelationEdge component)

### NodeEditPanel.tsx
- Sliding panel for editing node properties
- Supports bulk parent assignment from selected nodes
- Tag autocomplete with creation of new tags
- Score inputs with 1-5 validation
- Keyboard navigation for suggestions

### Schemas (lib/schemas.ts)
- Zod validation for all data types
- ReactFlowNodeDataType and ReactFlowEdgeDataType for graph components
- IdeaNodeDraft and LinkSuggestion for AI-generated content
- Enum definitions for NodeKind, Relation, and Role

## Environment Setup

### Required Variables (.env.local in web/ directory)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql_connection_string
DIRECT_URL=postgresql_direct_connection_string

# Future AI integration
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
RAG_ENABLED=false
```

### Database Setup
1. Set up Supabase project and get credentials
2. Configure environment variables
3. Run `npx prisma migrate dev` to create tables
4. Run `npx prisma generate` to generate client

## Planned Features

Based on Planning.md, the application will include:
- AI-powered node suggestions and expansions
- Automatic link generation between related concepts
- Content clustering and summarization
- Web snippet collection for research
- Multi-user collaboration with role-based access
- Export capabilities (JSON, Obsidian markdown)

## Development Notes

- Prisma client is generated to `../generated/prisma` (custom output location)
- Uses pnpm workspaces (root + web subdirectory)
- Dark mode support throughout UI components
- React Flow nodes are non-draggable by default but support selection
- Custom hotkeys: "N" key to add nodes at cursor position
- TypeScript strict mode enabled with proper type safety