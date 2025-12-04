'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import CheckInFlow from '@/components/CheckInFlow'
import StartCheckInFlow from '@/components/StartCheckInFlow'
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
  const [showStartCheckIn, setShowStartCheckIn] = useState(false)
  const [hasStartCheckIn, setHasStartCheckIn] = useState(false)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isCoach = session?.user && (session.user as any).role?.toUpperCase() === 'COACH'

  useEffect(() => {
    if (isCoach) {
      fetchAllCheckIns()
    } else if (session?.user?.id) {
      checkForStartCheckIn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach, session?.user?.id])

  const checkForStartCheckIn = async () => {
    try {
      setIsLoading(true)
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }
      const response = await fetch(`/api/check-in?userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        // Check if user has a start check-in
        const startCheckIn = data.checkIns?.find((ci: any) => ci.isStartCheckIn === true)
        setHasStartCheckIn(!!startCheckIn)
      }
    } catch (error) {
      console.error('Error checking for start check-in:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  // Client view - Show StartCheckInFlow if not completed
  if (showStartCheckIn && session?.user) {
    return (
      <StartCheckInFlow
        userId={session.user.id!}
        userName={session.user.name || 'User'}
        onClose={() => {
          setShowStartCheckIn(false)
          checkForStartCheckIn() // Refresh check-in status
        }}
      />
    )
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Check-in
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          {hasStartCheckIn ? 'Dokumentera din veckovisa framgång' : 'Börja din resa'}
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto">
        {!hasStartCheckIn ? (
          // Show Start Check-In card if not completed
          <div className="bg-white border border-gray-200 rounded-xl hover:border-gold-primary hover:shadow-lg transition-all p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-3xl flex-shrink-0">
                🎯
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Gör din Start Check-in</h2>
                <p className="text-gray-700 leading-relaxed">
                  Innan du kan göra veckovisa check-ins måste du först dokumentera din utgångspunkt.
                  Detta hjälper dig att följa din fantastiska transformation under de kommande 90 dagarna!
                </p>
              </div>
            </div>
            <div className="bg-gold-primary/10 border border-gold-primary/30 rounded-lg p-4 mb-6">
              <p className="text-gray-800 text-sm">
                ✓ Berätta om din utgångspunkt<br />
                ✓ Dokumentera startvikt och mått<br />
                ✓ Ta dina startbilder
              </p>
            </div>
            <Button
              onClick={() => setShowStartCheckIn(true)}
              className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold h-12 text-lg"
            >
              Börja Start Check-in
            </Button>
          </div>
        ) : (
          // Show CheckInFlow directly if start check-in is completed
          <CheckInFlow
            userId={session?.user?.id!}
            userName={session?.user?.name || 'User'}
            onClose={() => {
              // Stay on page when closing
            }}
          />
        )}
      </div>
    </div>
  )
}
