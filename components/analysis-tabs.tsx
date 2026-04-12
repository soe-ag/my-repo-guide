'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ANALYSIS_LABELS, type AnalysisType } from '@/lib/prompts'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Analysis {
  _id: string
  type: string
  content: string
  model: string
  createdAt: number
}

interface AnalysisTabsProps {
  analyses: Analysis[]
}

const TAB_ORDER: AnalysisType[] = ['orientation', 'deepDive']

export function AnalysisTabs({ analyses }: AnalysisTabsProps) {
  const analysisMap = new Map(analyses.map((a) => [a.type, a]))
  const availableTabs = TAB_ORDER.filter((type) => analysisMap.has(type))

  if (availableTabs.length === 0) {
    return null
  }

  return (
    <Tabs defaultValue={availableTabs[0]} className="w-full">
      <TabsList className="flex h-auto flex-wrap gap-1">
        {availableTabs.map((type) => (
          <TabsTrigger key={type} value={type} className="text-xs sm:text-sm">
            {ANALYSIS_LABELS[type]}
          </TabsTrigger>
        ))}
      </TabsList>

      {availableTabs.map((type) => {
        const analysis = analysisMap.get(type)!
        return (
          <TabsContent key={type} value={type} className="mt-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{analysis.content}</Markdown>
            </div>
            <div className="text-muted-foreground mt-4 text-xs">
              Generated with {analysis.model} • {new Date(analysis.createdAt).toLocaleString()}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
