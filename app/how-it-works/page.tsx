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
      <section className="grid gap-8 border-b border-black py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end lg:py-14">
        <div className="space-y-5">
          <span className="editorial-ribbon">Method</span>
          <div className="space-y-4">
            <h1 className="font-display text-[3.1rem] leading-[1.02] tracking-[-0.05em] text-foreground sm:text-[4.5rem]">
              How RepoGuide builds a briefing.
            </h1>
            <p className="max-w-3xl font-body text-[1.08rem] leading-8 text-foreground sm:text-[1.16rem]">
              This page explains what RepoGuide fetches, what it skips, how much source it sends
              into the model, and what ends up in the saved markdown export.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-black pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <p className="editorial-kicker text-muted-foreground">Quick facts</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="font-ui text-sm uppercase tracking-[0.14em] text-muted-foreground">
                Max fetched files
              </p>
              <p className="font-display text-4xl leading-none tracking-[-0.04em] text-foreground">
                {MAX_FILES_TO_FETCH}
              </p>
            </div>
            <div>
              <p className="font-ui text-sm uppercase tracking-[0.14em] text-muted-foreground">
                Analysis passes
              </p>
              <p className="font-display text-4xl leading-none tracking-[-0.04em] text-foreground">
                {REPORT_SECTION_COUNT}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 border-b border-black py-10 lg:grid-cols-2 lg:gap-12 lg:py-12">
        <div className="space-y-5">
          <span className="editorial-ribbon">Access Rules</span>
          <div className="border-y border-black">
            {accessRules.map((rule) => (
              <p
                key={rule}
                className="border-t border-black py-4 font-body text-[1.02rem] leading-8 first:border-t-0"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <span className="editorial-ribbon">Collection Rules</span>
          <div className="border-y border-black">
            {collectionRules.map((rule) => (
              <p
                key={rule}
                className="border-t border-black py-4 font-body text-[1.02rem] leading-8 first:border-t-0"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-10 border-b border-black py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:gap-12 lg:py-12">
        <div className="space-y-5">
          <span className="editorial-ribbon">Analysis Passes</span>
          <div className="border-y border-black">
            {analysisRules.map((rule) => (
              <p
                key={rule}
                className="border-t border-black py-4 font-body text-[1.02rem] leading-8 first:border-t-0"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-black pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <p className="editorial-kicker text-muted-foreground">Requested report sections</p>
          <ol className="space-y-3 border-y border-black py-4">
            {REPORT_CORE_SECTIONS.map((section, index) => (
              <li
                key={section}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-t border-black pt-3 first:border-t-0 first:pt-0"
              >
                <span className="font-display text-2xl leading-none tracking-[-0.04em] text-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-ui text-base font-semibold uppercase tracking-[0.08em] text-foreground">
                  {section}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:gap-12 lg:py-12">
        <div className="space-y-5">
          <span className="editorial-ribbon">Export</span>
          <div className="border-y border-black">
            {outputRules.map((rule) => (
              <p
                key={rule}
                className="border-t border-black py-4 font-body text-[1.02rem] leading-8 first:border-t-0"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-black pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <p className="editorial-kicker text-muted-foreground">Need the live tool?</p>
          <p className="font-body text-[1.02rem] leading-8 text-muted-foreground">
            Return to the desk, paste a repository, and compare the saved report against these
            rules.
          </p>
          <Link
            href="/"
            className="inline-flex font-ui text-sm font-semibold uppercase tracking-[0.14em] text-foreground underline decoration-black underline-offset-4 transition-colors hover:text-link"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}
