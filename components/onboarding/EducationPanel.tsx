'use client'

import { ReactNode } from 'react'
import { BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react'

interface EducationPanelProps {
  title: string
  children: ReactNode
  keyPoints?: string[]
  tip?: string
}

export function EducationPanel({ title, children, keyPoints, tip }: EducationPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {children}
      </div>

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Key Takeaways
          </h4>
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span className="text-slate-700 dark:text-slate-300">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tip */}
      {tip && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm mb-1">
                Pro Tip
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
