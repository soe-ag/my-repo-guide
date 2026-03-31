# RepoGuide — GitHub Repo Analyzer MVP

## TL;DR

A personal web app that takes a GitHub repo URL, fetches its contents via GitHub API, sends structured prompts to OpenRouter AI, and generates a comprehensive learning guide + project analysis. Built with Next.js + Convex, deployed on Vercel. GitHub OAuth for private repo access.

---

## Decisions

- **Personal tool** — no multi-user auth/billing, but GitHub OAuth needed for private repos
- **OpenRouter** for AI — supports multiple models, user picks from available ones
- **Next.js + Convex** — same stack (already scaffolded via boilerplate)
- **Vercel** deployment
- **MVP scope**: Tier 1 outputs only (structure, stack, architecture, routes, schema, patterns, learning path)
- **Excluded from MVP**: interactive chat, diff analysis, component trees, dependency graphs

---

## Problem

Agentic/vibe-coded repos get merged fast without understanding the detail. You need a tool that:

1. Imports any GitHub repo (public or private)
2. Fetches the file tree and key source files
3. Runs a multi-step AI analysis pipeline
4. Generates structured outputs that help you catch up on the project

---

## What the Analyzer Generates

### Tier 1 — MVP (must-have)

| Output                         | What It Answers                                                     |
| ------------------------------ | ------------------------------------------------------------------- |
| **Project Structure Map**      | Folder purposes, key files, what lives where                        |
| **Tech Stack Summary**         | Frameworks, DB, auth, styling, state mgmt — auto-detected from code |
| **Architecture Overview**      | How pieces connect: frontend → backend → DB, data flow              |
| **Route / Page Map**           | Every page/endpoint, what it does, which components it uses         |
| **Data Model / Schema**        | Tables, fields, relationships — the backbone                        |
| **Key Patterns & Conventions** | Auth guards, data fetching, error handling, naming conventions      |
| **Ordered Learning Path**      | Module-by-module guide — "read X then Y because Y depends on X"     |

### Tier 2 — Post-MVP (nice-to-have)

| Output                   | Why                                                       |
| ------------------------ | --------------------------------------------------------- |
| Component Tree           | Visual hierarchy of UI components and their props         |
| User Flow Traces         | "Sign up → Browse → Checkout" traced through actual files |
| Dependency Graph         | Which files import what — find root files vs leaves       |
| Environment Setup Guide  | Required env vars, services, setup steps                  |
| Code Complexity Hotspots | Largest/most complex files that need the most attention   |
| Test Coverage Map        | What's tested, what's not                                 |

### Tier 3 — Future

| Output               | Why                                                    |
| -------------------- | ------------------------------------------------------ |
| Interactive Q&A      | Chat with the repo — ask questions about specific code |
| Diff Analysis        | "What changed in the last 5 PRs" summary               |
| Onboarding Checklist | Auto-generated reading tasks + exercises               |

---

## Architecture

```
User → Next.js Frontend → Convex Backend → GitHub API (fetch repo tree + files)
                                         → OpenRouter API (analyze in chunks)
                       ← Convex (store + stream results in real-time)
```

---

## Implementation Phases

### Phase 1: Project Setup

> Boilerplate already scaffolded — Next.js 16, Convex, Tailwind 4, Shadcn UI.

| Step | Task                                                 |
| ---- | ---------------------------------------------------- |
| 1    | Configure Convex Auth with **GitHub OAuth** provider |
| 2    | Add OpenRouter API integration as a Convex action    |
| 3    | Define Convex schema (`repos` + `analyses` tables)   |
| 4    | Deploy skeleton to Vercel + Convex production        |

### Phase 2: GitHub Integration

| Step | Task                                                                             |
| ---- | -------------------------------------------------------------------------------- |
| 5    | **GitHub OAuth flow** — sign in with GitHub, store access token in Convex        |
| 6    | **Repo fetcher** (Convex action) — parse URL → fetch file tree → fetch key files |
|      | - Prioritize: entry points, configs, schemas, routes, largest components         |
|      | - Cap at ~50 key files to stay within token budgets                              |
|      | - Handle GitHub API rate limits (5000 req/hr authenticated)                      |
|      | - Store raw data in `repos` table                                                |

### Phase 3: AI Analysis Pipeline (the core)

| Step | Task                                                                              |
| ---- | --------------------------------------------------------------------------------- |
| 7    | **5-step chunked pipeline** (repos too large for one prompt):                     |
|      | → Step 1: File tree + `package.json` + configs → **Tech Stack + Structure**       |
|      | → Step 2: Schema/model files → **Data Model**                                     |
|      | → Step 3: Route/page files → **Route Map**                                        |
|      | → Step 4: Key source files (batched) → **Patterns + Architecture**                |
|      | → Step 5: All summaries from 1–4 → **Learning Path** (final synthesis)            |
| 8    | **OpenRouter integration** — model selector, structured API calls, store per step |
| 9    | **Prompt templates** — 6 crafted prompts, one per analysis type                   |

### Phase 4: Frontend

| Step | Task                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| 10   | **Landing page** (`/`) — repo URL input, model dropdown, list of past analyses  |
| 11   | **Results page** (`/repo/[id]`) — real-time progress bar + tabbed markdown view |
| 12   | Copy / export full analysis as `.md` file                                       |

### Phase 5: Polish & Deploy

| Step | Task                                                            |
| ---- | --------------------------------------------------------------- |
| 13   | Loading states, error handling, toast notifications             |
| 14   | **Re-analyze** button — reuse cached repo data, run new AI pass |
| 15   | Markdown export download                                        |
| 16   | Production deploy to Vercel                                     |

---

## Data Model (Convex Schema)

### `repos` table

| Field           | Type                                             | Description                           |
| --------------- | ------------------------------------------------ | ------------------------------------- |
| `userId`        | `string`                                         | GitHub user ID from auth              |
| `repoUrl`       | `string`                                         | Full GitHub URL                       |
| `owner`         | `string`                                         | Repo owner                            |
| `name`          | `string`                                         | Repo name                             |
| `isPrivate`     | `boolean`                                        | Public or private                     |
| `defaultBranch` | `string`                                         | e.g. `main`, `master`                 |
| `fileTree`      | `string`                                         | JSON stringified tree                 |
| `fetchedFiles`  | `string`                                         | JSON stringified map (path → content) |
| `status`        | `'fetching' \| 'analyzing' \| 'done' \| 'error'` | Pipeline status                       |
| `errorMessage`  | `string?`                                        | Error details if failed               |
| `createdAt`     | `number`                                         | Timestamp                             |

### `analyses` table

| Field       | Type                                                                                       | Description             |
| ----------- | ------------------------------------------------------------------------------------------ | ----------------------- |
| `repoId`    | `Id<"repos">`                                                                              | Reference to repo       |
| `type`      | `'techStack' \| 'architecture' \| 'routes' \| 'dataModel' \| 'patterns' \| 'learningPath'` | Analysis category       |
| `content`   | `string`                                                                                   | Markdown output from AI |
| `model`     | `string`                                                                                   | Which AI model was used |
| `createdAt` | `number`                                                                                   | Timestamp               |

---

## Files to Create

```
convex/
  schema.ts          ← repos + analyses tables (update existing)
  repos.ts           ← mutations for creating/updating repo records
  github.ts          ← action to fetch repo contents from GitHub API
  analyze.ts         ← action to run AI analysis pipeline via OpenRouter
  auth.ts            ← GitHub OAuth config

app/
  page.tsx           ← landing page with URL input (update existing)
  repo/[id]/page.tsx ← analysis results page

lib/
  prompts.ts         ← AI prompt templates for each analysis type

components/
  repo-input.tsx           ← URL input + model selector form
  analysis-tabs.tsx        ← tabbed markdown results view
  analysis-progress.tsx    ← step-by-step progress indicator
```

---

## Key Technical Decisions

| Decision                          | Rationale                                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| Chunked pipeline over single-shot | Better results, enables progress tracking, avoids token limits            |
| Store raw fetched files           | Re-analyze with different models without re-fetching GitHub               |
| OpenRouter over direct API        | Single integration, switch between Claude/GPT/Gemini freely               |
| File sampling (~50 key files)     | Can't fetch everything; prioritize entry points, configs, schemas, routes |
| Markdown output for all analyses  | Easy to render, copy, and export                                          |
| Convex reactive queries           | Real-time progress updates as each analysis step completes                |

---

## Verification Checklist

1. Full pipeline test with a known public repo
2. Private repo test — verify GitHub OAuth grants access
3. Large repo test (100+ files) — verify chunking stays within token limits
4. Re-analyze test — reuses cached data, doesn't re-fetch from GitHub
5. Markdown export — verify downloaded file is well-formatted
6. Real-time progress — Convex reactive queries update UI as each step completes

---

## Open Questions

1. **Token budget**: Large repos may exceed context limits even with chunking. Current strategy: cap at ~50 prioritized files. Future: add a "select which files to include" UI.
2. **Caching**: Default to cached repo data; offer "Refresh from GitHub" button for re-fetch.
3. **Rate limiting**: GitHub API allows 5000 req/hr authenticated. For most repos one analysis = ~10–30 requests. Should be fine for personal use.
4. **OpenRouter API key**: Store as env var (personal tool). If sharing later, move to per-user encrypted storage.
