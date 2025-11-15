'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDownAZ, Clock, Calendar, TrendingUp } from 'lucide-react'

export type SortOption =
  | 'relevance'
  | 'newest'
  | 'oldest'
  | 'title-asc'
  | 'title-desc'
  | 'reading-time-asc'
  | 'reading-time-desc'

interface ArticleSortProps {
  value: SortOption
  onChange: (value: SortOption) => void
  showRelevance?: boolean // Show relevance option (only for search results)
  className?: string
}

export function ArticleSort({
  value,
  onChange,
  showRelevance = false,
  className
}: ArticleSortProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Label className="text-[rgba(255,255,255,0.7)] text-sm">Sortera:</Label>
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger className="w-[200px] bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {showRelevance && (
            <SelectItem value="relevance">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Mest relevant
              </div>
            </SelectItem>
          )}
          <SelectItem value="newest">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Nyast först
            </div>
          </SelectItem>
          <SelectItem value="oldest">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Äldst först
            </div>
          </SelectItem>
          <SelectItem value="title-asc">
            <div className="flex items-center gap-2">
              <ArrowDownAZ className="h-4 w-4" />
              Titel (A-Ö)
            </div>
          </SelectItem>
          <SelectItem value="title-desc">
            <div className="flex items-center gap-2">
              <ArrowDownAZ className="h-4 w-4 rotate-180" />
              Titel (Ö-A)
            </div>
          </SelectItem>
          <SelectItem value="reading-time-asc">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Kortast läsningstid
            </div>
          </SelectItem>
          <SelectItem value="reading-time-desc">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Längst läsningstid
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
