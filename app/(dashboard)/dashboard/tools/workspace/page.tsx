'use client'

import { useState } from 'react'
import { ClientPlanProvider } from './context/ClientPlanContext'
import ToolsSidebar from './components/ToolsSidebar'
import LivePreview from './components/LivePreview'
import ClientSelector from './components/ClientSelector'
import CalorieTool from './components/CalorieTool'
import MealDistributionTool from './components/MealDistributionTool'
import StepsTool from './components/StepsTool'
import MealPlanTool from './components/MealPlanTool'

export default function WorkspacePage() {
  const [activeTool, setActiveTool] = useState<'calories' | 'meals' | 'steps' | 'mealplan'>('calories')

  return (
    <ClientPlanProvider>
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
        {/* Client Selector */}
        <ClientSelector />

        {/* Main Workspace - Split View */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Sidebar - Tool Navigation */}
          <ToolsSidebar activeTool={activeTool} onToolChange={setActiveTool} />

          {/* Center - Active Tool */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-8 backdrop-blur-[10px]">
              {activeTool === 'calories' && <CalorieTool />}
              {activeTool === 'meals' && <MealDistributionTool />}
              {activeTool === 'steps' && <StepsTool />}
              {activeTool === 'mealplan' && <MealPlanTool />}
            </div>
          </div>

          {/* Right Sidebar - Live Preview */}
          <LivePreview />
        </div>
      </div>
    </ClientPlanProvider>
  )
}
