'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, FileText, Search, Save, Check, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type {
  ParsedWorkoutProgram,
  ParsedProgramWeek,
  ParsedProgramDay,
  ParsedExercise,
  ExerciseMatchResult,
  ExerciseMatch
} from '@/types/workout-program-parser'

type WizardStep = 'upload' | 'preview' | 'match' | 'save'

interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
}

export default function ImportWorkoutProgramPage() {
  const router = useRouter()

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data state
  const [rawText, setRawText] = useState<string>('')
  const [parsedProgram, setParsedProgram] = useState<ParsedWorkoutProgram | null>(null)
  const [statistics, setStatistics] = useState<{
    totalWeeks: number
    totalDays: number
    totalExercises: number
    uniqueExercises: number
  } | null>(null)

  // Exercise matching state
  const [exerciseMatches, setExerciseMatches] = useState<ExerciseMatchResult[]>([])
  const [exerciseMappings, setExerciseMappings] = useState<Record<string, string>>({})
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [matchStatistics, setMatchStatistics] = useState<{
    total: number
    autoMatched: number
    needsReview: number
  } | null>(null)

  // Import state
  const [importResult, setImportResult] = useState<{
    programId: string
    programName: string
  } | null>(null)

  // Step 1: Upload PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Endast PDF-filer stöds')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/workout-programs/parse-pdf', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Kunde inte läsa PDF-filen'
        throw new Error(errorMsg)
      }

      setRawText(data.rawText)
      setParsedProgram(data.parsedProgram)
      setStatistics(data.statistics)
      setCurrentStep('preview')

    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid uppladdning')
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 2: Preview and continue to matching
  const handleContinueToMatch = async () => {
    if (!parsedProgram) return

    setIsProcessing(true)
    setError(null)

    try {
      // Extract unique exercise names with their day's muscle groups
      const exerciseNames: string[] = []
      const dayMuscleGroups: Record<string, string[]> = {}

      parsedProgram.weeks.forEach(week => {
        week.days.forEach(day => {
          day.exercises.forEach(ex => {
            if (!exerciseNames.includes(ex.name)) {
              exerciseNames.push(ex.name)
              dayMuscleGroups[ex.name] = day.muscleGroups
            }
          })
        })
      })

      // Also fetch all exercises for manual selection
      const [matchResponse, exercisesResponse] = await Promise.all([
        fetch('/api/workout-programs/match-exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseNames, dayMuscleGroups })
        }),
        fetch('/api/exercises')
      ])

      const matchData = await matchResponse.json()
      const exercisesData = await exercisesResponse.json()

      if (!matchResponse.ok) {
        throw new Error(matchData.error || 'Kunde inte matcha övningar')
      }

      setExerciseMatches(matchData.results)
      setMatchStatistics(matchData.statistics)
      setAllExercises(exercisesData.exercises || [])

      // Pre-populate mappings from auto-matched exercises
      const initialMappings: Record<string, string> = {}
      matchData.results.forEach((result: ExerciseMatchResult) => {
        if (result.selectedMatch) {
          initialMappings[result.originalName] = result.selectedMatch.exerciseId
        }
      })
      setExerciseMappings(initialMappings)

      setCurrentStep('match')

    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid matchning')
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 3: Update exercise mapping
  const handleMappingChange = (originalName: string, exerciseId: string) => {
    setExerciseMappings(prev => ({
      ...prev,
      [originalName]: exerciseId
    }))
  }

  // Step 4: Import program
  const handleImport = async () => {
    if (!parsedProgram) return

    // Check that all exercises are mapped
    const unmappedCount = exerciseMatches.filter(
      m => !exerciseMappings[m.originalName]
    ).length

    if (unmappedCount > 0) {
      setError(`${unmappedCount} övningar är inte matchade. Välj en övning för varje eller ta bort dem.`)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/workout-programs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedProgram,
          exerciseMappings,
          published: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte importera programmet')
      }

      setImportResult({
        programId: data.program.id,
        programName: data.program.name
      })
      setCurrentStep('save')

    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid import')
    } finally {
      setIsProcessing(false)
    }
  }

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Ladda upp', icon: Upload },
      { key: 'preview', label: 'Förhandsgranska', icon: FileText },
      { key: 'match', label: 'Matcha övningar', icon: Search },
      { key: 'save', label: 'Spara', icon: Save }
    ]

    const currentIndex = steps.findIndex(s => s.key === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.key === currentStep
          const isCompleted = index < currentIndex

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400'
                    : isCompleted
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 mx-2 text-zinc-600" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render upload step
  const renderUploadStep = () => (
    <div className="max-w-xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Ladda upp träningsprogram (PDF)
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          Ladda upp en PDF med ett träningsprogram så extraherar vi automatiskt alla veckor, dagar och övningar.
        </p>

        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing}
          />
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors">
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyserar PDF...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Välj PDF-fil
              </>
            )}
          </div>
        </label>
      </div>
    </div>
  )

  // Render preview step
  const renderPreviewStep = () => {
    if (!parsedProgram) return null

    return (
      <div className="space-y-6">
        {/* Program summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Programöversikt</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{statistics?.totalWeeks}</div>
              <div className="text-sm text-zinc-400">Veckor</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{statistics?.totalDays}</div>
              <div className="text-sm text-zinc-400">Träningsdagar</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{statistics?.totalExercises}</div>
              <div className="text-sm text-zinc-400">Övningar totalt</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{statistics?.uniqueExercises}</div>
              <div className="text-sm text-zinc-400">Unika övningar</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Namn:</span>
              <span className="text-white font-medium">{parsedProgram.name}</span>
            </div>
            {parsedProgram.description && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Beskrivning:</span>
                <span className="text-white">{parsedProgram.description}</span>
              </div>
            )}
            {parsedProgram.difficulty && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Svårighetsgrad:</span>
                <span className="text-white">{parsedProgram.difficulty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Weeks preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Veckor & Dagar</h3>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {parsedProgram.weeks.map((week) => (
              <div key={week.weekNumber} className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">
                    {week.title || `Vecka ${week.weekNumber}`}
                  </h4>
                  {week.isDeloadWeek && (
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                      Deload
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {week.days.map((day) => (
                    <div
                      key={`${week.weekNumber}-${day.dayNumber}`}
                      className="text-xs bg-zinc-700 px-2 py-1 rounded"
                    >
                      <span className="text-amber-400">{day.dayName || `Dag ${day.dayNumber}`}</span>
                      <span className="text-zinc-400 ml-1">
                        ({day.exercises.length} övn)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('upload')}
          >
            Tillbaka
          </Button>
          <Button
            onClick={handleContinueToMatch}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Matchar övningar...
              </>
            ) : (
              'Fortsätt till matchning'
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Render match step
  const renderMatchStep = () => (
    <div className="space-y-6">
      {/* Match statistics */}
      {matchStatistics && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Matchningsresultat</h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{matchStatistics.total}</div>
              <div className="text-sm text-zinc-400">Totalt</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{matchStatistics.autoMatched}</div>
              <div className="text-sm text-zinc-400">Automatiskt matchade</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{matchStatistics.needsReview}</div>
              <div className="text-sm text-zinc-400">Behöver granskning</div>
            </div>
          </div>
        </div>
      )}

      {/* Exercise matching list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Matcha övningar</h3>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {exerciseMatches.map((match) => {
            const isMatched = !!exerciseMappings[match.originalName]
            const selectedExercise = allExercises.find(
              e => e.id === exerciseMappings[match.originalName]
            )

            return (
              <div
                key={match.originalName}
                className={`bg-zinc-800 rounded-lg p-4 border ${
                  isMatched ? 'border-green-500/30' : 'border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isMatched ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-white font-medium">{match.originalName}</span>
                    </div>

                    {/* Top matches */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {match.topMatches.slice(0, 3).map((m) => (
                        <button
                          key={m.exerciseId}
                          onClick={() => handleMappingChange(match.originalName, m.exerciseId)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            exerciseMappings[match.originalName] === m.exerciseId
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500'
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          }`}
                        >
                          {m.exerciseName}
                          <span className="ml-1 text-zinc-500">({m.confidence}%)</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual selection dropdown */}
                  <select
                    value={exerciseMappings[match.originalName] || ''}
                    onChange={(e) => handleMappingChange(match.originalName, e.target.value)}
                    className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white min-w-[200px]"
                  >
                    <option value="">Välj övning...</option>
                    {allExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('preview')}
        >
          Tillbaka
        </Button>
        <Button
          onClick={handleImport}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importerar...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Importera program
            </>
          )}
        </Button>
      </div>
    </div>
  )

  // Render save/success step
  const renderSaveStep = () => (
    <div className="max-w-xl mx-auto">
      <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-400" />
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">
          Programmet importerat!
        </h3>
        <p className="text-zinc-400 mb-6">
          <span className="text-white font-medium">{importResult?.programName}</span> har sparats i ditt bibliotek.
        </p>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/content/workout-programs">
              Tillbaka till program
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/content/workout-programs/${importResult?.programId}/edit`}>
              Redigera program
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/content/workout-programs"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Importera träningsprogram</h1>
            <p className="text-zinc-400">Ladda upp en PDF och konvertera till ett träningsprogram</p>
          </div>
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Step content */}
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'match' && renderMatchStep()}
        {currentStep === 'save' && renderSaveStep()}
      </div>
    </div>
  )
}
