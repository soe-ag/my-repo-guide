'use client'

import { type AnalysisType } from '@/lib/prompts'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

const PIPELINE_STEPS: { types: AnalysisType[]; label: string }[] = [
  { types: ['techStack', 'structure'], label: 'Tech Stack & Structure' },
  { types: ['dataModel'], label: 'Data Model / Schema' },
  { types: ['routes'], label: 'Routes & Pages' },
  { types: ['architecture', 'patterns'], label: 'Architecture & Patterns' },
  { types: ['learningPath'], label: 'Learning Path' },
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

  return (
    <div className="space-y-3">
      {/* Fetching step */}
      <div className="flex items-center gap-3">
        {status === 'fetching' ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        ) : status === 'error' && completedTypes.length === 0 ? (
          <Circle className="text-destructive h-5 w-5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
        <span
          className={status === 'fetching' ? 'font-medium text-blue-500' : 'text-muted-foreground'}
        >
          Fetching repository contents
        </span>
      </div>

      {/* Analysis steps */}
      {PIPELINE_STEPS.map((step, i) => {
        const stepStatus = getStepStatus(step)
        return (
          <div key={i} className="flex items-center gap-3">
            {stepStatus === 'done' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : stepStatus === 'in-progress' ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Circle className="text-muted-foreground h-5 w-5" />
            )}
            <span
              className={
                stepStatus === 'in-progress'
                  ? 'font-medium text-blue-500'
                  : stepStatus === 'done'
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
              }
            >
              {step.label}
            </span>
          </div>
        )
      })}

      {status === 'error' && errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-2 rounded-md p-3 text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
