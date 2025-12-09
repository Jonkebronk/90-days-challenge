'use client'

import { Camera, Barcode, FileJson } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhotoCaptureTab } from './tabs/PhotoCaptureTab'
import { BarcodeScannerTab } from './tabs/BarcodeScannerTab'
import { JsonImportTab } from './tabs/JsonImportTab'

export function InputMethodTabs() {
  const { activeTab, setActiveTab } = useFoodLogStore()

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full grid grid-cols-3 bg-gray-100 rounded-none rounded-t-xl border-b border-gray-200 p-1">
            <TabsTrigger
              value="photo"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] rounded-lg py-2.5"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Fota mat</span>
            </TabsTrigger>
            <TabsTrigger
              value="barcode"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] rounded-lg py-2.5"
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Streckkod</span>
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] rounded-lg py-2.5"
            >
              <FileJson className="w-4 h-4" />
              <span className="hidden sm:inline">Importera</span>
            </TabsTrigger>
          </TabsList>

          <div className="p-4 sm:p-6">
            <TabsContent value="photo" className="mt-0">
              <PhotoCaptureTab />
            </TabsContent>
            <TabsContent value="barcode" className="mt-0">
              <BarcodeScannerTab />
            </TabsContent>
            <TabsContent value="import" className="mt-0">
              <JsonImportTab />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
