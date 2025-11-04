'use client'

import { useClientPlan } from '../context/ClientPlanContext'
import { User, Save } from 'lucide-react'

export default function ClientSelector() {
  const { clients, selectedClient, setSelectedClient, isLoading, isSaving, savePlan } = useClientPlan()

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-6 backdrop-blur-[10px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <User className="text-[#FFD700]" size={24} />
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
              Välj klient
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700] disabled:opacity-50"
            >
              <option value="">Välj en klient...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name || client.email}
                </option>
              ))}
            </select>
          </div>
          {isLoading && (
            <div className="text-sm text-[rgba(255,255,255,0.6)] animate-pulse">
              Laddar klientdata...
            </div>
          )}
        </div>

        {selectedClient && (
          <button
            onClick={savePlan}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        )}
      </div>
    </div>
  )
}
