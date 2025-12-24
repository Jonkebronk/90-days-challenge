'use client'

import { useState } from 'react'
import { ShoppingCart, Heart, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'lists' | 'favorites' | 'recurring'

interface Tab {
  id: TabType
  label: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { id: 'lists', label: 'Inköpslistor', icon: ShoppingCart },
  { id: 'favorites', label: 'Favoriter', icon: Heart },
  { id: 'recurring', label: 'Återkommande', icon: RefreshCw },
]

interface ShoppingListTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  counts?: {
    lists?: number
    favorites?: number
    recurring?: number
  }
  className?: string
}

export function ShoppingListTabs({
  activeTab,
  onTabChange,
  counts = {},
  className,
}: ShoppingListTabsProps) {
  return (
    <div className={cn('bg-white border-b border-zinc-200', className)}>
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count = counts[tab.id]

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all relative',
                isActive
                  ? 'text-gold-primary'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5',
                    isActive
                      ? 'bg-gold-primary text-white'
                      : 'bg-zinc-200 text-zinc-600'
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type { TabType }
