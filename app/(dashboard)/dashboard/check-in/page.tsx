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
  const [showCheckIn, setShowCheckIn] = useState(false)
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
      const response = await fetch('/api/check-in')
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

  // Client view - Allow regular check-in after start check-in
  if (showCheckIn && session?.user) {
    return (
      <CheckInFlow
        userId={session.user.id!}
        userName={session.user.name || 'User'}
        onClose={() => setShowCheckIn(false)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-[rgba(255,215,0,0.05)] to-transparent border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
          CHECK-IN
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] mt-2">
          {hasStartCheckIn ? 'Dokumentera din veckovisa framgång' : 'Börja din 90-dagars resa'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {!hasStartCheckIn ? (
          // Show Start Check-In card if not completed
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.3)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-3xl flex-shrink-0">
                🎯
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2">Gör din Start Check-in</h2>
                <p className="text-[rgba(255,255,255,0.7)] leading-relaxed">
                  Innan du kan göra veckovisa check-ins måste du först dokumentera din utgångspunkt.
                  Detta hjälper dig att följa din fantastiska transformation under de kommande 90 dagarna!
                </p>
              </div>
            </div>
            <div className="bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded-lg p-4 mb-6">
              <p className="text-[rgba(255,255,255,0.8)] text-sm">
                ✓ Berätta om din utgångspunkt<br />
                ✓ Dokumentera startvikt och mått<br />
                ✓ Ta dina startbilder
              </p>
            </div>
            <Button
              onClick={() => setShowStartCheckIn(true)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 text-lg"
            >
              Börja Start Check-in
            </Button>
          </div>
        ) : (
          // Show regular check-in card if start check-in is completed
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all p-8">
            <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-4">Veckovis Check-in</h2>
            <p className="text-[rgba(255,255,255,0.6)] mb-6">
              Det är dags för din veckovisa check-in. Klicka nedan för att börja.
            </p>
            <Button
              onClick={() => setShowCheckIn(true)}
              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#22c55e] hover:to-[#22c55e] text-white font-semibold"
            >
              Starta Check-in
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
