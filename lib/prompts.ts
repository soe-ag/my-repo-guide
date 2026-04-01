export const ANALYSIS_TYPES = [
  'techStack',
  'structure',
  'architecture',
  'routes',
  'dataModel',
  'patterns',
  'learningPath',
] as const

export type AnalysisType = (typeof ANALYSIS_TYPES)[number]

export const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  techStack: 'Tech Stack',
  structure: 'Project Structure',
  architecture: 'Architecture',
  routes: 'Routes & Pages',
  dataModel: 'Data Model',
  patterns: 'Patterns & Conventions',
  learningPath: 'Learning Path',
}

export function buildTechStackPrompt(
  fileTree: string,
  packageJson: string,
  configFiles: Record<string, string>
): string {
  const configs = Object.entries(configFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  return `You are analyzing a GitHub repository to generate a comprehensive tech stack summary and project structure map.

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

## Instructions
Generate TWO sections in Markdown:

### 1. Tech Stack Summary
- List every framework, library, database, auth system, styling approach, state management, and dev tool detected
- For each, note the version (if visible) and its role in the project
- Group by category: Frontend, Backend, Database, Auth, Styling, State Management, Dev Tools, Deployment

### 2. Project Structure Map
- Describe the purpose of each top-level directory
- Identify key files and what they do
- Note any unconventional patterns in the file organization

Be specific and detailed. Reference actual file paths and package names.`
}

export function buildDataModelPrompt(
  schemaFiles: Record<string, string>,
  fileTree: string
): string {
  const schemas = Object.entries(schemaFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  return `You are analyzing a GitHub repository's data model and schema.

## File Tree
\`\`\`
${fileTree}
\`\`\`

## Schema / Model Files
${schemas || 'No dedicated schema files found. Infer the data model from the file tree and any ORM/database files.'}

## Instructions
Generate a comprehensive **Data Model / Schema** analysis in Markdown:

- List every table/collection/model with all fields, types, and relationships
- Draw connections between models (one-to-many, many-to-many, etc.)
- Note any indexes, constraints, or validation rules
- If using an ORM (Prisma, Drizzle, Convex, etc.), note the specific ORM patterns
- If no explicit schema exists, infer the data structures from API routes, form submissions, and type definitions
- Use a clear table format for each model

Be thorough — the data model is the backbone of understanding the project.`
}

export function buildRoutesPrompt(routeFiles: Record<string, string>, fileTree: string): string {
  const routes = Object.entries(routeFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  return `You are analyzing a GitHub repository's routes, pages, and API endpoints.

## File Tree
\`\`\`
${fileTree}
\`\`\`

## Route / Page Files
${routes}

## Instructions
Generate a comprehensive **Route / Page Map** in Markdown:

- List every page route with its URL pattern, purpose, and key components used
- List every API route/endpoint with its HTTP method, purpose, and request/response shape
- Note which routes are protected (require auth) vs public
- Describe the navigation flow between pages
- Identify dynamic routes and what data they depend on
- Note any middleware, layouts, or route groups

Use tables for routes and describe the flow between them.`
}

export function buildPatternsPrompt(sourceFiles: Record<string, string>, fileTree: string): string {
  const sources = Object.entries(sourceFiles)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  return `You are analyzing a GitHub repository's coding patterns, architecture, and conventions.

## File Tree
\`\`\`
${fileTree}
\`\`\`

## Key Source Files
${sources}

## Instructions
Generate TWO sections in Markdown:

### 1. Architecture Overview
- How do the pieces connect? Frontend → Backend → Database
- What's the data flow for key operations?
- How is state managed across the app?
- What patterns are used for data fetching?
- How does authentication/authorization work?
- Are there any microservices, workers, or background jobs?

### 2. Key Patterns & Conventions
- Auth guards — how is route protection implemented?
- Data fetching — client-side, server-side, or hybrid?
- Error handling — try/catch patterns, error boundaries, toast notifications?
- Naming conventions — files, components, functions, variables
- Code organization — how are related files grouped?
- Reusable patterns — custom hooks, utility functions, shared components
- Testing patterns (if any tests exist)

Be specific. Reference actual code patterns you see in the files.`
}

export function buildLearningPathPrompt(
  techStack: string,
  dataModel: string,
  routes: string,
  patterns: string
): string {
  return `You are creating an ordered learning path for a developer who needs to understand this codebase quickly.

## Previous Analysis Results

### Tech Stack & Structure
${techStack}

### Data Model
${dataModel}

### Routes & Pages
${routes}

### Architecture & Patterns
${patterns}

## Instructions
Generate an **Ordered Learning Path** in Markdown:

1. Create a module-by-module learning guide
2. Each module should specify:
   - **What to read** — specific files/directories
   - **Why** — what concept you'll learn
   - **Prerequisites** — which modules should be read first
   - **Key things to notice** — specific patterns or decisions to pay attention to
3. Order modules so that dependencies come first (e.g., schema before API routes)
4. Start with the foundation (config, schema, types) and build up to features
5. End with the most complex or feature-rich parts
6. Include estimated reading time per module (rough)
7. Add a "Quick Start" section at the top for developers who just need the 5-minute overview

Make this practical and actionable — a developer should be able to follow this guide and understand the entire codebase.`
}

export const FREE_MODELS_ROUTER_ID = 'openrouter/auto:free'

export const FREE_DAILY_LIMIT = 50

export const OPENROUTER_MODELS = [
  { id: FREE_MODELS_ROUTER_ID, name: 'Free Models (Auto)' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3' },
] as const
