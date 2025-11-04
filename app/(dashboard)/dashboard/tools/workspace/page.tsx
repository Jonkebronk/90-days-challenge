'use client'

import { useState } from 'react'
import { ClientPlanProvider } from './context/ClientPlanContext'
import ToolsSidebar from './components/ToolsSidebar'
import LivePreview from './components/LivePreview'
import ClientSelector from './components/ClientSelector'
import CalorieTool from './components/CalorieTool'
import MealDistributionTool from './components/MealDistributionTool'
import StepsTool from './components/StepsTool'

export default function WorkspacePage() {
  const [activeTool, setActiveTool] = useState<'calories' | 'meals' | 'steps'>('calories')

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
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px]">
              {activeTool === 'calories' && <CalorieTool />}
              {activeTool === 'meals' && <MealDistributionTool />}
              {activeTool === 'steps' && <StepsTool />}
            </div>
          </div>

          {/* Right Sidebar - Live Preview */}
          <LivePreview />
        </div>
      </div>
    </ClientPlanProvider>
  )
}
