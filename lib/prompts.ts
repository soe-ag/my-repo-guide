export const ANALYSIS_TYPES = ['orientation', 'deepDive'] as const

export type AnalysisType = (typeof ANALYSIS_TYPES)[number]

export const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  orientation: 'Orientation',
  deepDive: 'Deep Dive',
}

export function buildOrientationPrompt(
  fileTree: string,
  packageJson: string,
  configFiles: Record<string, string>
): string {
  const configs = Object.entries(configFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  return `You are generating a concise "Repo Brief" for a junior developer catching up on a codebase. Output strict Markdown. No prose intros, no padding, no meta-commentary. Skip any section you cannot populate from the provided data.

## File Tree
\`\`\`
${fileTree}
\`\`\`

## package.json
\`\`\`json
${packageJson}
\`\`\`

## Config Files
${configs}

## Output

### ## Overview
2–3 sentences: what this project does, who it's for, and what problem it solves. Plain English.

### ## Tech Stack
A Markdown table with columns: Category | Tool | Role
One row per major dependency. Categories: Frontend, Backend, Database, Auth, Styling, State, Dev Tools, Deployment.

### ## Project Structure
A bullet list. One line per top-level folder/file that matters. Format: \`folder/\` — one-line purpose. Skip generated or obvious folders (node_modules, .git, dist).

Rules:
- No headers other than the three above
- No prose paragraphs
- Tables and bullets only
- Target 600–900 tokens total`
}

export function buildDeepDivePrompt(
  schemaFiles: Record<string, string>,
  routeFiles: Record<string, string>,
  sourceFiles: Record<string, string>,
  fileTree: string
): string {
  const schemas = Object.entries(schemaFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  const routes = Object.entries(routeFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  const sources = Object.entries(sourceFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  return `You are generating the second half of a concise "Repo Brief" for a junior developer. Output strict Markdown only. No prose intros, no padding. Skip any section you cannot populate from the provided data.

## File Tree
\`\`\`
${fileTree}
\`\`\`

## Schema / Model Files
${schemas || '_No dedicated schema files found. Infer from source files if possible._'}

## Route / Page Files
${routes || '_No route files found._'}

## Key Source Files
${sources || '_No source files provided._'}

## Output

### ## Data Model
For each entity/table/model: a one-line description, then a Markdown table with columns: Field | Type | Purpose.
Skip this section entirely if no data model is detectable.

### ## Key Flows
List up to 10 flows. For the top 3–5 most important flows, show 3–4 numbered steps tracing the code path (include \`file.ts\` names). For remaining flows (if any), list as a single bullet with a brief one-line description — no steps.

### ## Reading Order
A numbered list of 10–15 items. Format: \`path/to/file\` — one sentence on what you'll learn.
Order: config → schema → backend → frontend → pages (foundation before features).

Rules:
- No headers other than the three above
- No prose paragraphs outside step descriptions
- Target 600–900 tokens total`
}

export { FREE_MODELS_ROUTER_ID, FREE_DAILY_LIMIT } from './constants'

import { FREE_MODELS_ROUTER_ID as _FREE_ID } from './constants'

export const OPENROUTER_MODELS = [
  { id: _FREE_ID, name: 'Free Models (Auto)' },
  // { id: 'qwen/qwen3.6-plus-preview:free', name: 'Qwen 3.6 Plus Preview (Free)' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  // { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3' },
] as const
