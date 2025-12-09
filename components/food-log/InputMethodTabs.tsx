'use client'

import { Camera, Barcode, FileJson } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { PhotoCaptureTab } from './tabs/PhotoCaptureTab'
import { BarcodeScannerTab } from './tabs/BarcodeScannerTab'
import { JsonImportTab } from './tabs/JsonImportTab'

const tabs = [
  { id: 'photo' as const, label: 'Fota mat', icon: Camera },
  { id: 'barcode' as const, label: 'Streckkod', icon: Barcode },
  { id: 'import' as const, label: 'Importera', icon: FileJson }
]

export function InputMethodTabs() {
  const { activeTab, setActiveTab } = useFoodLogStore()

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-zinc-800">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-colors ${
                isActive
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-zinc-800/50'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'photo' && <PhotoCaptureTab />}
        {activeTab === 'barcode' && <BarcodeScannerTab />}
        {activeTab === 'import' && <JsonImportTab />}
      </div>
    </div>
  )
}
