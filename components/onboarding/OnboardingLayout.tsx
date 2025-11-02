'use client'

import { ReactNode } from 'react'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OnboardingLayoutProps {
  currentStep: number
  totalSteps: number
  title: string
  description: string
  children: ReactNode
  educationContent: ReactNode
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  backLabel?: string
  isNextDisabled?: boolean
  nextHref?: string
  backHref?: string
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  educationContent,
  onNext,
  onBack,
  nextLabel = 'Next',
  backLabel = 'Back',
  isNextDisabled = false,
  nextHref,
  backHref,
}: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header with Progress */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">90</span>
              </div>
              <span className="font-bold text-lg">90 Days Challenge</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {/* Left Side - Form/Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground text-lg">{description}</p>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              {children}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              {backHref ? (
                <Link href={backHref}>
                  <Button variant="outline" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {backLabel}
                  </Button>
                </Link>
              ) : onBack ? (
                <Button variant="outline" size="lg" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {backLabel}
                </Button>
              ) : (
                <div />
              )}

              {nextHref ? (
                <Link href={nextHref}>
                  <Button size="lg" disabled={isNextDisabled}>
                    {nextLabel}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : onNext ? (
                <Button size="lg" onClick={onNext} disabled={isNextDisabled}>
                  {nextLabel}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : null}
            </div>
          </div>

          {/* Right Side - Education Panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-6">
              {educationContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
