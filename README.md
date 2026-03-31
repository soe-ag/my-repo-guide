# RepoGuide

A web app that takes a GitHub repo URL, fetches its contents, and generates a comprehensive learning guide using AI. Built with Next.js, Convex, and OpenRouter.

## What It Does

Paste any GitHub repo URL and get:

- **Project Structure Map** — folder purposes, key files
- **Tech Stack Summary** — frameworks, DB, auth, styling (auto-detected)
- **Architecture Overview** — how frontend, backend, and DB connect
- **Route / Page Map** — every page and endpoint
- **Data Model / Schema** — tables, fields, relationships
- **Key Patterns & Conventions** — auth guards, data fetching, naming
- **Ordered Learning Path** — "read X then Y because Y depends on X"

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

1. Paste a GitHub repo URL (e.g. `https://github.com/vercel/next.js`) or shorthand (`vercel/next.js`)
2. Pick an AI model from the dropdown
3. Click **Analyze** — watch real-time progress as each step completes
4. When done, the analysis is **auto-saved** and you're redirected to a permanent page with sidebar navigation
5. Browse the analysis by section using the sidebar — headings are extracted from the markdown output
6. View all saved analyses from the home page, click any to revisit
7. One repo can have **multiple analyses** (different models, re-runs) — each gets a unique URL
8. Delete any saved analysis via the delete button (with confirmation dialog)
9. Export the full analysis as a `.md` file from the results page

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

- **Frontend**: Next.js, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **AI**: OpenRouter API
- **GitHub**: REST API v3 for repo fetching
