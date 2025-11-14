import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { SupersetGroup as SupersetGroupType } from './types'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SupersetGroupProps {
  group: SupersetGroupType
  onRemove: () => void
  children: React.ReactNode
}

export function SupersetGroup({ group, onRemove, children }: SupersetGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className="relative pl-4 py-3 pr-3 rounded-lg border-l-4"
      style={{
        borderLeftColor: group.color,
        backgroundColor: `${group.color}10`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge
            className="text-xs font-medium"
            style={{
              backgroundColor: group.color,
              color: '#0a0a0a'
            }}
          >
            {group.label}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)] h-7 px-2"
        >
          <X className="w-4 h-4 mr-1" />
          Ta bort gruppering
        </Button>
      </div>

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
          {group.exerciseIndices.length} övningar
        </p>
      )}
    </div>
  )
}
