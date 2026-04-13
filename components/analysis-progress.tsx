'use client'

import { type AnalysisType } from '@/lib/prompts'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

const PIPELINE_STEPS: { types: AnalysisType[]; label: string }[] = [
  { types: ['orientation'], label: 'Orientation — Stack & Structure' },
  { types: ['deepDive'], label: 'Deep Dive — Data, Flows & Reading Order' },
]

interface AnalysisProgressProps {
  completedTypes: AnalysisType[]
  status: 'fetching' | 'analyzing' | 'done' | 'error'
  errorMessage?: string
}

export function AnalysisProgress({ completedTypes, status, errorMessage }: AnalysisProgressProps) {
  function getStepStatus(step: (typeof PIPELINE_STEPS)[number]) {
    const allDone = step.types.every((t) => completedTypes.includes(t))
    if (allDone) return 'done'

    // Check if this is the current step being processed
    const prevSteps = PIPELINE_STEPS.slice(0, PIPELINE_STEPS.indexOf(step))
    const allPrevDone = prevSteps.every((ps) => ps.types.every((t) => completedTypes.includes(t)))
    if (allPrevDone && status === 'analyzing') return 'in-progress'

    return 'pending'
  }

  const steps = [
    {
      label: 'Fetching repository contents',
      state:
        status === 'fetching'
          ? 'in-progress'
          : status === 'error' && completedTypes.length === 0
            ? 'error'
            : 'done',
    },
    ...PIPELINE_STEPS.map((step) => ({
      label: step.label,
      state: getStepStatus(step),
    })),
  ]

  return (
    <div className="space-y-5">
      <ol className="border-y border-black">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="grid gap-3 border-t border-black px-0 py-4 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="font-display text-3xl leading-none tracking-[-0.04em] text-foreground sm:text-4xl">
              {String(index + 1).padStart(2, '0')}
            </span>

            <div className="space-y-1">
              <p className="editorial-kicker text-muted-foreground">Pipeline step</p>
              <p
                className={
                  step.state === 'in-progress'
                    ? 'font-ui text-base font-semibold text-[#057dbc]'
                    : step.state === 'done'
                      ? 'font-ui text-base font-semibold text-foreground'
                      : 'font-ui text-base text-muted-foreground'
                }
              >
                {step.label}
              </p>
            </div>

            <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
              {step.state === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-foreground" />
              ) : step.state === 'in-progress' ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#057dbc]" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                {step.state === 'in-progress'
                  ? 'Running'
                  : step.state === 'done'
                    ? 'Filed'
                    : step.state === 'error'
                      ? 'Stopped'
                      : 'Queued'}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {status === 'error' && errorMessage && (
        <div className="border-l-2 border-black pl-4">
          <p className="editorial-kicker text-muted-foreground">Pipeline note</p>
          <p className="mt-2 font-body text-base leading-7 text-foreground">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}
