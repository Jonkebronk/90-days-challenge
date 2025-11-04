'use client'

import { Calculator, Utensils, Activity } from 'lucide-react'

interface ToolsSidebarProps {
  activeTool: 'calories' | 'meals' | 'steps'
  onToolChange: (tool: 'calories' | 'meals' | 'steps') => void
}

const tools = [
  { id: 'calories' as const, name: 'Kaloriverktyg', icon: Calculator, color: 'blue' },
  { id: 'meals' as const, name: 'Måltidsfördelning', icon: Utensils, color: 'green' },
  { id: 'steps' as const, name: 'Stegkalkylator', icon: Activity, color: 'purple' }
]

export default function ToolsSidebar({ activeTool, onToolChange }: ToolsSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-4 backdrop-blur-[10px] h-full">
        <h3 className="text-lg font-semibold text-white mb-4 px-2">Verktyg</h3>
        <nav className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id

            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-medium shadow-lg scale-105'
                    : 'hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.7)] hover:text-[#FFD700]'
                  }
                `}
              >
                <Icon className={isActive ? 'text-[#0a0a0a]' : 'text-[#FFD700]'} size={20} />
                <span>{tool.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-6 pt-6 border-t border-[rgba(255,215,0,0.2)]">
          <div className="text-xs text-[rgba(255,255,255,0.5)] px-2">
            <p className="mb-2 font-semibold text-[rgba(255,255,255,0.7)]">Tips:</p>
            <p>Välj klient ovan och börja arbeta. Ändringar visas live i höger panel.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
