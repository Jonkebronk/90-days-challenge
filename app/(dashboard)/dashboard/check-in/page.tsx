'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import CheckInFlow from '@/components/CheckInFlow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckInPage() {
  const { data: session } = useSession()
  const [showCheckIn, setShowCheckIn] = useState(false)

  if (showCheckIn && session?.user) {
    return (
      <CheckInFlow
        userId={session.user.id!}
        userName={session.user.name || 'User'}
        onClose={() => setShowCheckIn(false)}
      />
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Det är dags för din veckovisa check-in. Klicka nedan för att börja.
          </p>
          <Button
            onClick={() => setShowCheckIn(true)}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            Starta Check-in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
