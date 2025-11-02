'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import CheckInFlow from '@/components/CheckInFlow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type CheckIn = {
  id: string
  userId: string
  statusUpdate?: string | null
  weightKg?: number | null
  energyLevel?: number | null
  mood?: number | null
  createdAt: string
  user?: {
    name?: string | null
    email?: string | null
  }
}

export default function CheckInPage() {
  const { data: session } = useSession()
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isCoach = session?.user && (session.user as any).role === 'coach'

  useEffect(() => {
    if (isCoach) {
      fetchAllCheckIns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach])

  const fetchAllCheckIns = async () => {
    try {
      setIsLoading(true)
      // For now, just show empty state. We'll need to create an endpoint for all check-ins
      setCheckIns([])
    } catch (error) {
      console.error('Error fetching check-ins:', error)
      toast.error('Kunde inte hämta check-ins')
    } finally {
      setIsLoading(false)
    }
  }

  // Coach view - Show overview of all client check-ins
  if (isCoach) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Check-ins Översikt</h1>
          <p className="text-muted-foreground">Se alla klient check-ins</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Senaste Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Laddar...</p>
            ) : checkIns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Inga check-ins ännu</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Klient check-ins kommer att visas här när de checkar in
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table will go here when we have data */}
                {checkIns.map((checkIn) => (
                  <div key={checkIn.id} className="border rounded-lg p-4">
                    <p className="font-medium">{checkIn.user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(checkIn.createdAt).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Client view - Allow check-in
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
