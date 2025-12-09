'use client'

import { Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhotoCaptureTab } from './tabs/PhotoCaptureTab'

export function InputMethodTabs() {
  return (
    <Card className="bg-white border border-gray-200">
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
  )
}
