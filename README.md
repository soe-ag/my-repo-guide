# RepoGuide

**Learn any codebase like it has an editor.**

A web application that turns any public GitHub repository into a readable, editorial-style briefing. Paste a repo URL, pick an AI model, and get a navigable analysis with orientation pass and deep-dive sections—formatted for reading, not dashboards.

Built with Next.js, React 19, Convex, Tailwind CSS, and OpenRouter.

## What You Get

Submit a GitHub repository and receive:

- **Orientation Pass** — project purpose, folder structure, tech stack summary
- **Architecture Overview** — system boundaries, how modules connect
- **Route / Page Map** — every exposed page, API endpoint, webhook
- **Data Model & Schema** — tables, fields, relationships, access patterns
- **Key Patterns & Conventions** — auth guards, data fetching, naming schemes, middleware
- **Learning Path** — ordered progression through the codebase (read X before Y) with references and callouts
- **Saved as Markdown** — export each analysis to `.md`, keep forever, edit locally

All analyses are **permanently saved** with unique URLs, searchable by repo, and can be re-run on demand.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

If you haven't already, initialize Convex:

```bash
npx convex dev
```

This creates `.env.local` with your `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`.

### 3. Get an OpenRouter API key

1. Go to [openrouter.ai](https://openrouter.ai/)
2. Sign up / log in
3. Navigate to **Keys** → **Create Key**
4. Copy the key (starts with `sk-or-...`)

### 4. Set environment variables in Convex

The OpenRouter key and GitHub token are used server-side in Convex actions, so they must be set as **Convex environment variables** (not in `.env.local`).

Open the Convex dashboard:

```bash
npx convex dashboard
```

Then go to **Settings → Environment Variables** and add:

| Variable              | Required | Description                                                                    |
| --------------------- | -------- | ------------------------------------------------------------------------------ |
| `OPENROUTER_API_KEY`  | Yes      | Your OpenRouter API key (`sk-or-...`)                                          |
| `GITHUB_ACCESS_TOKEN` | No       | GitHub personal access token — needed for private repos and higher rate limits |

#### Getting a GitHub Personal Access Token (optional)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scope: `repo` (for private repo access)
4. Copy the token and add it as `GITHUB_ACCESS_TOKEN` in Convex

Without a token, only public repos can be analyzed and you're limited to 60 GitHub API requests/hour. With a token, you get 5,000 req/hr.

### 5. Run the dev servers

```bash
npm run dev
```

This starts both Next.js and Convex dev servers. Open [http://localhost:3000](http://localhost:3000).

## Usage

### Analyze a Repository

1. **Enter repo URL** — paste full URL (`https://github.com/owner/repo`) or shorthand (`owner/repo`)
2. **Pick a model** — select from Claude Sonnet, GPT-4o, Gemini 2.5 Pro, DeepSeek V3, or free tier options
3. **Click Analyze** — watch real-time progress as each pipeline stage completes:
   - Fetching code from GitHub
   - Running orientation analysis
   - Generating deep-dive sections
4. **Auto-save & redirect** — when complete, the analysis is permanently saved and you're redirected to the results page
5. **Navigate with sidebar** — click section headings in the left sidebar to jump through the analysis
6. **Copy or export** — button bar at top lets you copy all markdown or download as `.md` file for offline editing
7. **Delete if needed** — trash icon with confirmation prevents accidents

### Home Page Features

- **In Progress** — live pipeline jobs with status badges and delete options
- **Saved Analyses** — numbered archive of all completed analyses, click to open, delete individually
- **One URL per analysis** — each run gets a unique permalink (`/analysis/[slug]`) even on the same repo
- **Responsive on all screens** — desktop two-column layout, mobile single-column compact view

### Routes

| Route              | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `/`                | Home — submit repos, view saved & in-progress analyses |
| `/repo/[id]`       | Live analysis progress (auto-redirects when done)      |
| `/analysis/[slug]` | Saved analysis with sidebar navigation                 |

## Supported AI Models

Models are routed through [OpenRouter](https://openrouter.ai/), so cost and availability depend on your OpenRouter account:

- Claude Sonnet 4
- GPT-4o
- Gemini 2.5 Pro
- DeepSeek V3

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (new-york preset)
- **Fonts**: Cormorant Garamond (display), Source Serif 4 (body), Work Sans (UI), Space Mono (mono)
- **Backend**: Convex (real-time database, serverless mutations/queries/actions)
- **AI**: OpenRouter API (multi-model routing)
- **GitHub API**: REST v3 for repository fetching
- **Real-time Updates**: IntersectionObserver for sidebar TOC sync, Convex subscriptions

## Design System

The UI follows an **editorial print aesthetic**:

- Flat design, square borders, zero border radius
- Black & white color palette with accent link blue (`#057dbc`)
- Serif typography hierarchy (display/body/UI/mono)
- Numbered feature lists with horizontal rule separators
- Responsive two-column layouts (sidebar + content on desktop, mobile-optimized on small screens)
- Custom Tailwind utilities: `.editorial-kicker`, `.editorial-ribbon`, `.editorial-link`, `.editorial-prose`
