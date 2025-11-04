'use client'

import { useClientPlan } from '../context/ClientPlanContext'
import { Activity } from 'lucide-react'

export default function StepsTool() {
  const { localPlan, updateLocalPlan, selectedClient } = useClientPlan()

  const calculateStepsCalories = () => {
    const steps = localPlan.dailySteps || 0
    return Math.round((steps / 1000) * 50)
  }

  const stepsCalories = calculateStepsCalories()

  if (!selectedClient) {
    return (
      <div className="text-center py-12">
        <p className="text-[rgba(255,255,255,0.6)]">Välj en klient för att börja</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Activity className="text-[#FFD700]" size={32} />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
          Daglig Aktivitetsnivå (Steg)
        </h1>
      </div>

      {/* Steps Calculator */}
      <div className="p-6 bg-[rgba(168,85,247,0.1)] border-2 border-purple-400 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Beräkna Extra Kalorier från Steg
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-3">
            Antal steg per dag
          </label>
          <input
            type="range"
            min="1000"
            max="15000"
            step="500"
            value={localPlan.dailySteps || 5000}
            onChange={(e) => updateLocalPlan({ dailySteps: parseInt(e.target.value) })}
            className="w-full h-3 bg-purple-900 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(((localPlan.dailySteps || 5000) - 1000) / 14000) * 100}%, rgba(147, 51, 234, 0.3) ${(((localPlan.dailySteps || 5000) - 1000) / 14000) * 100}%, rgba(147, 51, 234, 0.3) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-[rgba(255,255,255,0.6)] mt-2">
            <span>1,000</span>
            <span>15,000</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border-2 border-purple-400">
            <p className="text-sm text-[rgba(255,255,255,0.6)] mb-1">Valda steg</p>
            <p className="text-3xl font-bold text-purple-400">{(localPlan.dailySteps || 5000).toLocaleString()}</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border-2 border-purple-400">
            <p className="text-sm text-[rgba(255,255,255,0.6)] mb-1">Extra kalorier från steg</p>
            <p className="text-3xl font-bold text-purple-400">+{stepsCalories} kcal</p>
          </div>
        </div>

        <div className="bg-[rgba(59,130,246,0.15)] border-l-4 border-blue-400 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Beräkning</h3>
          <p className="text-sm text-[rgba(255,255,255,0.8)]">
            1,000 steg ≈ 50 kcal
          </p>
          <p className="text-sm text-[rgba(255,255,255,0.6)] mt-2">
            {(localPlan.dailySteps || 5000).toLocaleString()} steg ÷ 1,000 × 50 = <span className="font-bold text-purple-400">{stepsCalories} kcal</span>
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-xl">
        <h3 className="font-semibold text-white mb-3">Om stegkalkylering</h3>
        <div className="space-y-2 text-sm text-[rgba(255,255,255,0.8)]">
          <p>
            <span className="text-[#FFD700] font-semibold">Steg som aktivitet:</span> När du räknar dagliga steg som extra aktivitet får klienten äta mer samtidigt som viktnedgången bibehålls.
          </p>
          <p>
            <span className="text-[#FFD700] font-semibold">Formeln:</span> Vi använder en enkel formel där 1,000 steg ≈ 50 kalorier. Detta är en bra approximation för de flesta personer.
          </p>
          <p>
            <span className="text-[#FFD700] font-semibold">Integration:</span> De extra kalorierna från steg läggs till klientens dagliga kaloriintag automatiskt.
          </p>
        </div>
      </div>
    </div>
  )
}
