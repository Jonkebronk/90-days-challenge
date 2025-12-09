'use client'

import { useState } from 'react'
import { Camera, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhotoCaptureTab } from './tabs/PhotoCaptureTab'
import { QuickAddModal } from './QuickAddModal'

export function InputMethodTabs() {
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  return (
    <>
      <div className="flex gap-3">
        {/* Quick Add Button */}
        <Button
          onClick={() => setShowQuickAdd(true)}
          className="flex-1 h-auto py-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-gray-900 hover:opacity-90 shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span className="font-semibold">Quick Add</span>
        </Button>

        {/* Photo Capture Card */}
        <Card className="bg-white border border-gray-200 flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Camera className="w-4 h-4" />
              Fota mat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PhotoCaptureTab />
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </>
  )
}
