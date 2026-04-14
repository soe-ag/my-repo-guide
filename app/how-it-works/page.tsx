import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CRITICAL_PATHS,
  DEEP_DIVE_ROUTE_CHAR_BUDGET,
  DEEP_DIVE_SCHEMA_CHAR_BUDGET,
  DEEP_DIVE_SOURCE_CHAR_BUDGET,
  DEEP_DIVE_SOURCE_FILE_LIMIT,
  FETCH_BATCH_SIZE,
  MAX_FILES_TO_FETCH,
  MAX_FILE_SIZE_BYTES,
  MAX_PER_EXTENSION,
  MAX_PER_TOP_LEVEL_DIR,
  MAX_FETCH_FAILURE_RATIO,
  MIN_FETCHED_FILES,
  MIN_USABLE_FILES_FOR_ANALYSIS,
  OPENROUTER_PROMPT_MAX_TOKENS,
  ORIENTATION_CONFIG_CHAR_BUDGET,
  REPORT_CORE_SECTIONS,
  REPORT_SECTION_COUNT,
} from '@/lib/analysis-config'

export const metadata: Metadata = {
  title: 'How RepoGuide Works',
  description:
    'Explain how RepoGuide fetches repositories, selects files, runs analysis, and exports saved reports.',
}

function formatKb(bytes: number) {
  return `${Math.round(bytes / 1000)} KB`
}

const collectionRules = [
  `RepoGuide fetches the full GitHub file tree first, then chooses up to ${MAX_FILES_TO_FETCH} files for content fetching.`,
  `Each fetched file must be ${formatKb(MAX_FILE_SIZE_BYTES)} or smaller. Larger files are skipped before analysis.`,
  `Selection is balanced so one area does not dominate the prompt: up to ${MAX_PER_TOP_LEVEL_DIR} files per top-level folder and up to ${MAX_PER_EXTENSION} files per extension.`,
  `Files are fetched in batches of ${FETCH_BATCH_SIZE} to reduce GitHub API spikes.`,
  `At least ${MIN_FETCHED_FILES} files must be fetched successfully, and at least one critical file must appear: ${CRITICAL_PATHS.join(', ')}.`,
  `Ignored paths include build outputs, lockfiles, generated declarations, tests, editor folders, and common dependency folders like node_modules.`,
]

const analysisRules = [
  `The pipeline needs at least ${MIN_USABLE_FILES_FOR_ANALYSIS} usable files before AI analysis starts. Empty files and failed fetches do not count.`,
  `Analysis is split into ${REPORT_SECTION_COUNT} passes: Orientation and Deep Dive.`,
  `Orientation sends the file tree, package.json, and configuration files with a total config-file budget of about ${ORIENTATION_CONFIG_CHAR_BUDGET.toLocaleString()} characters.`,
  `Deep Dive sends schema/model files, route/page files, and up to ${DEEP_DIVE_SOURCE_FILE_LIMIT} extra source files with budgets of ${DEEP_DIVE_SCHEMA_CHAR_BUDGET.toLocaleString()}, ${DEEP_DIVE_ROUTE_CHAR_BUDGET.toLocaleString()}, and ${DEEP_DIVE_SOURCE_CHAR_BUDGET.toLocaleString()} characters.`,
  `Each OpenRouter call is capped at ${OPENROUTER_PROMPT_MAX_TOKENS.toLocaleString()} output tokens.`,
  `Files outside the selected subset are not sent to the model and are not exported verbatim. The export contains the generated briefing, not the raw source files.`,
]

const outputRules = [
  `The final saved report merges both passes into one Markdown document with a repo title, source URL, generation date, and model name.`,
  `RepoGuide asks the model for ${REPORT_CORE_SECTIONS.length} core sections: ${REPORT_CORE_SECTIONS.join(', ')}.`,
  'Saved reports get a permanent slug under /analysis/[slug] and can be reopened later from the home page.',
  'The Export button downloads the exact saved Markdown briefing that you see in the analysis view.',
  'The Copy button copies the same saved Markdown content to the clipboard.',
]

const accessRules = [
  'Public repositories are attempted without a GitHub token first.',
  'If unauthenticated public access hits GitHub rate limits, RepoGuide retries with GITHUB_ACCESS_TOKEN when it exists.',
  'Private repositories require GITHUB_ACCESS_TOKEN in Convex and that token must have access to the specific repo.',
  `Fetch quality checks fail if too many files error out. The current failure threshold is ${(MAX_FETCH_FAILURE_RATIO * 100).toFixed(0)}%.`,
]

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex w-full max-w-400 flex-col px-4 pb-20 sm:px-6 lg:px-8">
      <section className="space-y-6 border-b border-black py-10 lg:py-12">
        <span className="editorial-ribbon">How It Works</span>
        <h1 className="max-w-5xl font-display text-[3rem] leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[4.2rem]">
          Clear rules for fetch, analysis, and export.
        </h1>
        <p className="max-w-3xl font-body text-[1.05rem] leading-8 text-muted-foreground">
          RepoGuide runs a fixed pipeline. This page shows the exact limits and behaviors used by
          the app so you know what gets included, what gets skipped, and what appears in the final
          markdown report.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-black p-4">
            <p className="editorial-kicker text-muted-foreground">Max fetched files</p>
            <p className="mt-2 font-display text-4xl leading-none tracking-[-0.04em]">
              {MAX_FILES_TO_FETCH}
            </p>
          </div>
          <div className="border border-black p-4">
            <p className="editorial-kicker text-muted-foreground">Per-file size cap</p>
            <p className="mt-2 font-display text-4xl leading-none tracking-[-0.04em]">
              {formatKb(MAX_FILE_SIZE_BYTES)}
            </p>
          </div>
          <div className="border border-black p-4">
            <p className="editorial-kicker text-muted-foreground">Analysis passes</p>
            <p className="mt-2 font-display text-4xl leading-none tracking-[-0.04em]">
              {REPORT_SECTION_COUNT}
            </p>
          </div>
          <div className="border border-black p-4">
            <p className="editorial-kicker text-muted-foreground">Prompt token cap</p>
            <p className="mt-2 font-display text-4xl leading-none tracking-[-0.04em]">
              {OPENROUTER_PROMPT_MAX_TOKENS}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-black py-10 lg:grid-cols-3 lg:py-12">
        <div className="space-y-3 border border-black p-5">
          <p className="editorial-kicker text-muted-foreground">1. Access</p>
          <h2 className="font-display text-3xl leading-none tracking-[-0.04em]">
            Repository access
          </h2>
          <ul className="space-y-2 font-body text-[1rem] leading-7 text-muted-foreground">
            {accessRules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 border border-black p-5">
          <p className="editorial-kicker text-muted-foreground">2. Collection</p>
          <h2 className="font-display text-3xl leading-none tracking-[-0.04em]">File selection</h2>
          <ul className="space-y-2 font-body text-[1rem] leading-7 text-muted-foreground">
            {collectionRules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 border border-black p-5">
          <p className="editorial-kicker text-muted-foreground">3. Analysis</p>
          <h2 className="font-display text-3xl leading-none tracking-[-0.04em]">Prompt assembly</h2>
          <ul className="space-y-2 font-body text-[1rem] leading-7 text-muted-foreground">
            {analysisRules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-8 border-b border-black py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-stretch lg:py-12">
        <div className="flex h-full flex-col gap-4">
          <span className="editorial-ribbon">Requested Sections</span>
          <p className="font-body text-[1.02rem] leading-8 text-muted-foreground">
            RepoGuide asks the model for these core sections in the saved briefing.
          </p>
          <div className="border border-black">
            {REPORT_CORE_SECTIONS.map((section, index) => (
              <div
                key={section}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-black px-4 py-3 first:border-t-0"
              >
                <span className="font-display text-2xl leading-none tracking-[-0.04em]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-ui text-sm font-semibold uppercase tracking-[0.08em]">
                  {section}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-full flex-col gap-4">
          <span className="editorial-ribbon">Hard Limits</span>
          <p className="font-body text-[1.02rem] leading-8 text-muted-foreground">
            Fixed thresholds used by fetch validation and prompt assembly.
          </p>
          <div className="overflow-hidden border border-black">
            <table className="w-full border-collapse font-ui text-sm">
              <tbody>
                <tr className="border-t border-black first:border-t-0">
                  <td className="px-4 py-3 text-muted-foreground">Min fetched files</td>
                  <td className="px-4 py-3 text-right font-semibold">{MIN_FETCHED_FILES}</td>
                </tr>
                <tr className="border-t border-black">
                  <td className="px-4 py-3 text-muted-foreground">Min usable files</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {MIN_USABLE_FILES_FOR_ANALYSIS}
                  </td>
                </tr>
                <tr className="border-t border-black">
                  <td className="px-4 py-3 text-muted-foreground">Batch size</td>
                  <td className="px-4 py-3 text-right font-semibold">{FETCH_BATCH_SIZE}</td>
                </tr>
                <tr className="border-t border-black">
                  <td className="px-4 py-3 text-muted-foreground">Per top-level dir</td>
                  <td className="px-4 py-3 text-right font-semibold">{MAX_PER_TOP_LEVEL_DIR}</td>
                </tr>
                <tr className="border-t border-black">
                  <td className="px-4 py-3 text-muted-foreground">Per extension</td>
                  <td className="px-4 py-3 text-right font-semibold">{MAX_PER_EXTENSION}</td>
                </tr>
                <tr className="border-t border-black">
                  <td className="px-4 py-3 text-muted-foreground">Failure threshold</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {(MAX_FETCH_FAILURE_RATIO * 100).toFixed(0)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-stretch lg:py-12">
        <div className="flex h-full flex-col gap-4">
          <span className="editorial-ribbon">Export Output</span>
          <ul className="h-full space-y-2 border border-black p-5 font-body text-[1rem] leading-7 text-muted-foreground">
            {outputRules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </div>

        <div className="flex h-full flex-col gap-4">
          <span className="editorial-ribbon">Navigation</span>
          <div className="flex h-full flex-col justify-between border border-black p-5">
            <p className="font-body text-[1rem] leading-7 text-muted-foreground">
              Go back to the main page to run a new analysis and compare the output to these rules.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex font-ui text-sm font-semibold uppercase tracking-[0.14em] text-foreground underline decoration-black underline-offset-4 transition-colors hover:text-link"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
