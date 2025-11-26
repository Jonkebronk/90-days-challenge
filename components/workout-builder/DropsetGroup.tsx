'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react'
import { Dropset, DROPSET_COLORS } from './types'
import { cn } from '@/lib/utils'

interface DropsetGroupProps {
  dropset: Dropset
  exerciseNames: string[]
  onRemove: () => void
  onUpdate: (dropset: Dropset) => void
  children: React.ReactNode
}

export function DropsetGroup({
  dropset,
  exerciseNames,
  onRemove,
  onUpdate,
  children
}: DropsetGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const color = DROPSET_COLORS[0].value // Default blue

  const updateWeight = (index: number, weight: number) => {
    const newWeights = [...dropset.weights]
    newWeights[index] = weight
    onUpdate({ ...dropset, weights: newWeights })
  }

  const updateReps = (index: number, reps: number) => {
    const newReps = [...dropset.reps]
    newReps[index] = reps
    onUpdate({ ...dropset, reps: newReps })
  }

  return (
    <div
      className="relative pl-4 py-3 pr-3 rounded-lg border-l-4"
      style={{
        borderLeftColor: color,
        backgroundColor: `${color}10`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge
            className="text-xs font-medium flex items-center gap-1"
            style={{
              backgroundColor: color,
              color: '#ffffff'
            }}
          >
            <TrendingDown className="w-3 h-3" />
            Dropset
          </Badge>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)] transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-[rgba(96,165,250,0.8)] hover:text-[#60A5FA] hover:bg-[rgba(96,165,250,0.1)] h-7 px-2"
          >
            {showSettings ? 'Dölj' : 'Vikter'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)] h-7 px-2"
          >
            <X className="w-4 h-4 mr-1" />
            Ta bort
          </Button>
        </div>
      </div>

      {/* Weight/Reps Settings */}
      {showSettings && !isCollapsed && (
        <div className="mb-4 p-3 bg-[rgba(96,165,250,0.05)] rounded-lg border border-[rgba(96,165,250,0.2)]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-sm text-[rgba(255,255,255,0.8)]">
              Viktprogression
            </span>
          </div>

          <div className="space-y-2">
            {dropset.exerciseIndices.map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-[rgba(255,255,255,0.5)] w-16">
                  Drop {idx + 1}:
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={dropset.weights[idx] || ''}
                      onChange={(e) => updateWeight(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-sm bg-[rgba(255,255,255,0.05)] border-[rgba(96,165,250,0.3)] text-white"
                      placeholder="kg"
                    />
                    <span className="text-xs text-[rgba(255,255,255,0.5)]">kg</span>
                  </div>
                  <span className="text-[rgba(255,255,255,0.3)]">×</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={dropset.reps[idx] || ''}
                      onChange={(e) => updateReps(idx, parseInt(e.target.value) || 0)}
                      className="w-14 h-7 text-sm bg-[rgba(255,255,255,0.05)] border-[rgba(96,165,250,0.3)] text-white"
                      placeholder="reps"
                    />
                    <span className="text-xs text-[rgba(255,255,255,0.5)]">reps</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-3 pt-3 border-t border-[rgba(96,165,250,0.2)]">
            <span className="text-xs text-[rgba(255,255,255,0.5)]">Förhandsgranskning: </span>
            <span className="text-sm text-[#60A5FA]">
              {dropset.weights.filter(w => w > 0).map((w, i) =>
                `${w}kg × ${dropset.reps[i] || '?'}`
              ).join(' → ') || 'Ingen vikt angiven'}
            </span>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div
        className={cn(
          "space-y-2 transition-all",
          isCollapsed && "hidden"
        )}
      >
        {children}
      </div>

      {isCollapsed && (
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          {dropset.exerciseIndices.length} drop{dropset.exerciseIndices.length !== 1 ? 's' : ''}
          {dropset.weights.some(w => w > 0) && (
            <span className="ml-2 text-[#60A5FA]">
              ({dropset.weights.filter(w => w > 0).join(' → ')} kg)
            </span>
          )}
        </p>
      )}
    </div>
  )
}
