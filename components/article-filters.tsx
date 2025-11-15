'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Filter, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { getPhaseColors, type Phase } from '@/lib/utils/phase-colors'

interface ArticleCategory {
  id: string
  name: string
  icon?: string
  color?: string
}

interface ArticleFiltersProps {
  categories: ArticleCategory[]
  filters: {
    category: string
    phase: string
    difficulty: string
    completed: string
    tags: string[]
  }
  onFilterChange: (filters: any) => void
  totalResults: number
  className?: string
}

export function ArticleFilters({
  categories,
  filters,
  onFilterChange,
  totalResults,
  className
}: ArticleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({
      category: 'all',
      phase: 'all',
      difficulty: 'all',
      completed: 'all',
      tags: []
    })
  }

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.phase !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.completed !== 'all' ||
    filters.tags.length > 0

  const activeFilterCount = [
    filters.category !== 'all',
    filters.phase !== 'all',
    filters.difficulty !== 'all',
    filters.completed !== 'all',
    filters.tags.length > 0
  ].filter(Boolean).length

  return (
    <Card className={`bg-[rgba(10,10,10,0.5)] backdrop-blur-sm border-[rgba(255,215,0,0.2)] ${className}`}>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-[#FFD700]" />
            <CardTitle className="text-white">
              Filter och sortering
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge className="bg-[#FFD700] text-black">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgba(255,255,255,0.5)]">
              {totalResults} artiklar
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[rgba(255,255,255,0.5)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[rgba(255,255,255,0.5)]" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[rgba(255,255,255,0.5)]">Aktiva filter:</span>

              {filters.category !== 'all' && (
                <Badge className="bg-[rgba(255,215,0,0.2)] text-[#FFD700] border-[rgba(255,215,0,0.3)]">
                  {categories.find(c => c.id === filters.category)?.name}
                  <button
                    onClick={() => handleFilterChange('category', 'all')}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.phase !== 'all' && (
                <Badge className={`${getPhaseColors(parseInt(filters.phase) as Phase).badge}`}>
                  Fas {filters.phase}
                  <button
                    onClick={() => handleFilterChange('phase', 'all')}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.difficulty !== 'all' && (
                <Badge className="bg-[rgba(255,255,255,0.1)] text-white">
                  {filters.difficulty === 'beginner' && 'Nybörjare'}
                  {filters.difficulty === 'intermediate' && 'Medel'}
                  {filters.difficulty === 'advanced' && 'Avancerad'}
                  <button
                    onClick={() => handleFilterChange('difficulty', 'all')}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.completed !== 'all' && (
                <Badge className="bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[#22c55e]">
                  {filters.completed === 'true' ? 'Läst' : 'Oläst'}
                  <button
                    onClick={() => handleFilterChange('completed', 'all')}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-[rgba(255,255,255,0.5)] hover:text-white"
              >
                Rensa alla
              </Button>
            </div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.7)]">Kategori</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Alla kategorier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kategorier</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phase Filter */}
            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.7)]">Fas</Label>
              <Select
                value={filters.phase}
                onValueChange={(value) => handleFilterChange('phase', value)}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Alla faser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla faser</SelectItem>
                  <SelectItem value="1">Fas 1 (Dag 1-30)</SelectItem>
                  <SelectItem value="2">Fas 2 (Dag 31-60)</SelectItem>
                  <SelectItem value="3">Fas 3 (Dag 61-90)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.7)]">Svårighetsgrad</Label>
              <Select
                value={filters.difficulty}
                onValueChange={(value) => handleFilterChange('difficulty', value)}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Alla nivåer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla nivåer</SelectItem>
                  <SelectItem value="beginner">Nybörjare</SelectItem>
                  <SelectItem value="intermediate">Medel</SelectItem>
                  <SelectItem value="advanced">Avancerad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Completed Filter */}
            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.7)]">Status</Label>
              <Select
                value={filters.completed}
                onValueChange={(value) => handleFilterChange('completed', value)}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Alla artiklar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla artiklar</SelectItem>
                  <SelectItem value="true">Lästa</SelectItem>
                  <SelectItem value="false">Olästa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
