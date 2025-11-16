'use client'

import { useClientPlan } from '../context/ClientPlanContext'
import { User, Save } from 'lucide-react'

export default function ClientSelector() {
  const { clients, selectedClient, setSelectedClient, isLoading, isSaving, savePlan } = useClientPlan()

  return (
    <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <User className="text-gold-light" size={24} />
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Välj klient
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-black/30 border border-gold-primary/30 rounded-lg text-white focus:outline-none focus:border-gold-light disabled:opacity-50"
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
            <div className="text-sm text-gray-400 animate-pulse">
              Laddar klientdata...
            </div>
          )}
        </div>

        {selectedClient && (
          <button
            onClick={savePlan}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-gold-light to-orange-500 hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        )}
      </div>
    </div>
  )
}
