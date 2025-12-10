'use client'

import { useState, useEffect } from 'react'
import { Micronutrients } from '@/lib/kostschema/types'
import {
  DEMOGRAPHIC_PROFILES,
  MICRONUTRIENT_KEYS,
  NUTRIENT_META,
  DEFAULT_PROFILE_ID,
  calculateRDIPercent,
  getRDIForProfile,
  getRDIColorClass,
  getRDITextColorClass
} from '@/lib/kostschema/rdi-constants'
import { Loader2, ChevronDown } from 'lucide-react'

interface NutritionSummaryPanelProps {
  micronutrients: Micronutrients
  isLoading?: boolean
}

const STORAGE_KEY = 'nutrition-profile-id'

export function NutritionSummaryPanel({ micronutrients, isLoading }: NutritionSummaryPanelProps) {
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Load saved profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DEMOGRAPHIC_PROFILES.some(p => p.id === saved)) {
      setProfileId(saved)
    }
  }, [])

  // Save profile to localStorage
  const handleProfileChange = (newProfileId: string) => {
    setProfileId(newProfileId)
    localStorage.setItem(STORAGE_KEY, newProfileId)
    setIsDropdownOpen(false)
  }

  const selectedProfile = DEMOGRAPHIC_PROFILES.find(p => p.id === profileId)

  // Split into vitamins and minerals
  const vitamins = MICRONUTRIENT_KEYS.filter(key => NUTRIENT_META[key]?.category === 'vitamin')
  const minerals = MICRONUTRIENT_KEYS.filter(key => NUTRIENT_META[key]?.category === 'mineral')

  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Laddar mikronutrienter...</span>
        </div>
      </div>
    )
  }

  // Check if we have any micronutrient data
  const hasData = MICRONUTRIENT_KEYS.some(key => micronutrients[key as keyof Micronutrients] !== null)

  if (!hasData) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Mikronutrienter</h3>
        <p className="text-zinc-500 text-sm">
          Mikronutrientdata visas endast for ingredienser med SLV-nummer
        </p>
      </div>
    )
  }

  // Group profiles for dropdown
  const groupedProfiles = {
    barn: DEMOGRAPHIC_PROFILES.filter(p => p.group === 'barn'),
    kvinna: DEMOGRAPHIC_PROFILES.filter(p => p.group === 'kvinna'),
    man: DEMOGRAPHIC_PROFILES.filter(p => p.group === 'man'),
    special: DEMOGRAPHIC_PROFILES.filter(p => p.group === 'special'),
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header with profile selector */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Mikronutrienter</h3>
          <p className="text-zinc-500 text-sm">% av rekommenderat dagligt intag (RDI)</p>
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
          >
            <span className="text-zinc-500">Norm:</span>
            <span className="font-medium text-amber-600">{selectedProfile?.label}</span>
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {/* Barn */}
                  <div className="px-3 py-1.5 bg-zinc-100 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Barn
                  </div>
                  {groupedProfiles.barn.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileChange(profile.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 transition-colors ${
                        profile.id === profileId ? 'bg-zinc-100 text-amber-600' : 'text-zinc-700'
                      }`}
                    >
                      {profile.label}
                    </button>
                  ))}

                  {/* Kvinna */}
                  <div className="px-3 py-1.5 bg-zinc-100 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Kvinna
                  </div>
                  {groupedProfiles.kvinna.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileChange(profile.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 transition-colors ${
                        profile.id === profileId ? 'bg-zinc-100 text-amber-600' : 'text-zinc-700'
                      }`}
                    >
                      {profile.label}
                    </button>
                  ))}

                  {/* Man */}
                  <div className="px-3 py-1.5 bg-zinc-100 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Man
                  </div>
                  {groupedProfiles.man.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileChange(profile.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 transition-colors ${
                        profile.id === profileId ? 'bg-zinc-100 text-amber-600' : 'text-zinc-700'
                      }`}
                    >
                      {profile.label}
                    </button>
                  ))}

                  {/* Special */}
                  <div className="px-3 py-1.5 bg-zinc-100 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Special
                  </div>
                  {groupedProfiles.special.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileChange(profile.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 transition-colors ${
                        profile.id === profileId ? 'bg-zinc-100 text-amber-600' : 'text-zinc-700'
                      }`}
                    >
                      {profile.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitamins */}
        <div>
          <h4 className="text-sm font-medium text-amber-600 mb-3">Vitaminer</h4>
          <div className="space-y-2">
            {vitamins.map(key => {
              const value = micronutrients[key as keyof Micronutrients]
              const percent = calculateRDIPercent(key, value, profileId)
              const rdiInfo = getRDIForProfile(key, profileId)

              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-24 truncate">{rdiInfo.name}</span>
                  <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRDIColorClass(percent)} transition-all duration-300`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${getRDITextColorClass(percent)}`}>
                    {percent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Minerals */}
        <div>
          <h4 className="text-sm font-medium text-amber-600 mb-3">Mineraler</h4>
          <div className="space-y-2">
            {minerals.map(key => {
              const value = micronutrients[key as keyof Micronutrients]
              const percent = calculateRDIPercent(key, value, profileId)
              const rdiInfo = getRDIForProfile(key, profileId)

              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-24 truncate">{rdiInfo.name}</span>
                  <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRDIColorClass(percent)} transition-all duration-300`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${getRDITextColorClass(percent)}`}>
                    {percent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-3">Detaljerade värden</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-200">
                <th className="text-left py-2 px-2">Näringsämne</th>
                <th className="text-right py-2 px-2">Värde</th>
                <th className="text-right py-2 px-2">Enhet</th>
                <th className="text-right py-2 px-2">RDI</th>
                <th className="text-right py-2 px-2">%</th>
              </tr>
            </thead>
            <tbody>
              {MICRONUTRIENT_KEYS.map(key => {
                const value = micronutrients[key as keyof Micronutrients]
                const percent = calculateRDIPercent(key, value, profileId)
                const rdiInfo = getRDIForProfile(key, profileId)

                return (
                  <tr key={key} className="border-b border-zinc-100">
                    <td className="py-2 px-2 text-zinc-700">{rdiInfo.name}</td>
                    <td className="py-2 px-2 text-right text-zinc-900 font-medium">
                      {value !== null ? value.toFixed(1) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right text-zinc-500">{rdiInfo.unit}</td>
                    <td className="py-2 px-2 text-right text-zinc-500">{rdiInfo.value}</td>
                    <td className={`py-2 px-2 text-right font-medium ${getRDITextColorClass(percent)}`}>
                      {percent}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-200">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>50-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>80-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>&gt;100%</span>
        </div>
      </div>
    </div>
  )
}
