'use client'

import { useState, useEffect } from 'react'
import { Activity, Save, User } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string | null
  email: string
}

export default function StepsCalculator() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dailySteps, setDailySteps] = useState('5000')

  // Fetch clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Load data when client is selected
  useEffect(() => {
    if (selectedClient) {
      loadClientData(selectedClient)
    }
  }, [selectedClient])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients.filter((c: Client) => c.name))
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const loadClientData = async (clientId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/calorie-plan?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.caloriePlan && data.caloriePlan.dailySteps) {
          setDailySteps(data.caloriePlan.dailySteps.toString())
        }
      }
    } catch (error) {
      console.error('Failed to load client data:', error)
      toast.error('Kunde inte ladda klientdata')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error('Välj en klient först')
      return
    }

    setIsSaving(true)
    try {
      // First fetch existing calorie plan
      const getResponse = await fetch(`/api/calorie-plan?clientId=${selectedClient}`)
      const existingData = await getResponse.json()

      const response = await fetch('/api/calorie-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          ...existingData.caloriePlan,
          dailySteps: parseInt(dailySteps)
        })
      })

      if (response.ok) {
        toast.success('Stegmål sparat!')
      } else {
        toast.error('Kunde inte spara stegmål')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Något gick fel')
    } finally {
      setIsSaving(false)
    }
  }

  const calculateStepsCalories = () => {
    const steps = parseFloat(dailySteps) || 0
    return Math.round((steps / 1000) * 50)
  }

  const stepsCalories = calculateStepsCalories()

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-8 backdrop-blur-[10px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="text-gold-light" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-light to-orange-500 bg-clip-text text-transparent">
              Daglig Aktivitetsnivå (Steg)
            </h1>
          </div>

          {/* Client Selector and Save Button */}
          <div className="flex items-center gap-3">
            <div className="min-w-[250px]">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-gold-primary/30 rounded-lg text-white focus:outline-none focus:border-gold-light"
                disabled={isLoading}
              >
                <option value="">Välj klient...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={!selectedClient || isSaving}
              className="px-6 py-2 bg-gradient-to-r from-gold-light to-orange-500 hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} />
              {isSaving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mb-6 p-4 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg text-center text-white">
            Laddar klientdata...
          </div>
        )}

        {/* Steps Calculator */}
        <div className="p-6 bg-[rgba(168,85,247,0.1)] border-2 border-purple-400 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Beräkna Extra Kalorier från Steg
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-3">
              Antal steg per dag
            </label>
            <input
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={dailySteps}
              onChange={(e) => setDailySteps(e.target.value)}
              className="w-full h-3 bg-purple-900 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((parseInt(dailySteps) - 1000) / 14000) * 100}%, rgba(147, 51, 234, 0.3) ${((parseInt(dailySteps) - 1000) / 14000) * 100}%, rgba(147, 51, 234, 0.3) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1,000</span>
              <span>15,000</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border-2 border-purple-400">
              <p className="text-sm text-gray-400 mb-1">Valda steg</p>
              <p className="text-3xl font-bold text-purple-400">{parseInt(dailySteps).toLocaleString()}</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border-2 border-purple-400">
              <p className="text-sm text-gray-400 mb-1">Extra kalorier från steg</p>
              <p className="text-3xl font-bold text-purple-400">+{stepsCalories} kcal</p>
            </div>
          </div>

          <div className="bg-[rgba(59,130,246,0.15)] border-l-4 border-blue-400 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">Beräkning</h3>
            <p className="text-sm text-gray-200">
              1,000 steg ≈ 50 kcal
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {parseInt(dailySteps).toLocaleString()} steg ÷ 1,000 × 50 = <span className="font-bold text-purple-400">{stepsCalories} kcal</span>
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-6 bg-white/5 border border-gold-primary/20 rounded-xl">
          <h3 className="font-semibold text-white mb-3">Om stegkalkylering</h3>
          <div className="space-y-2 text-sm text-gray-200">
            <p>
              <span className="text-gold-light font-semibold">Steg som aktivitet:</span> När du räknar dagliga steg som extra aktivitet får klienten äta mer samtidigt som viktnedgången bibehålls.
            </p>
            <p>
              <span className="text-gold-light font-semibold">Formeln:</span> Vi använder en enkel formel där 1,000 steg ≈ 50 kalorier. Detta är en bra approximation för de flesta personer.
            </p>
            <p>
              <span className="text-gold-light font-semibold">Integration:</span> De extra kalorierna från steg läggs till klientens dagliga kaloriintag när du tittar på kaloriverktyget.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
