'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Scale, Ruler, Camera } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface CheckIn {
  id: string
  createdAt: string
  isStartCheckIn: boolean
  weekNumber: number | null
  weightKg: number | null
  mondayWeight: number | null
  tuesdayWeight: number | null
  wednesdayWeight: number | null
  thursdayWeight: number | null
  fridayWeight: number | null
  saturdayWeight: number | null
  sundayWeight: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  butt: number | null
  arms: number | null
  thighs: number | null
  calves: number | null
  photoFront: string | null
  photoSide: string | null
  photoBack: string | null
}

export default function ProgressPage() {
  const { data: session } = useSession()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isCoach = session?.user && (session.user as any).role?.toUpperCase() === 'COACH'

  useEffect(() => {
    fetchCheckIns()
  }, [])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/check-ins')
      if (response.ok) {
        const data = await response.json()
        setCheckIns(data.checkIns || [])
      }
    } catch (error) {
      console.error('Failed to fetch check-ins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get start check-in and latest check-in
  const startCheckIn = checkIns.find(c => c.isStartCheckIn)
  const weeklyCheckIns = checkIns.filter(c => !c.isStartCheckIn).sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  const latestCheckIn = weeklyCheckIns[weeklyCheckIns.length - 1]

  // Calculate average weight per check-in
  const getAverageWeight = (checkIn: CheckIn): number | null => {
    const weights = [
      checkIn.mondayWeight,
      checkIn.tuesdayWeight,
      checkIn.wednesdayWeight,
      checkIn.thursdayWeight,
      checkIn.fridayWeight,
      checkIn.saturdayWeight,
      checkIn.sundayWeight,
    ].filter((w): w is number => w !== null)

    if (weights.length === 0) return checkIn.weightKg
    return weights.reduce((sum, w) => sum + w, 0) / weights.length
  }

  // Weight chart data
  const weightChartData = [
    ...(startCheckIn ? [{
      name: 'Start',
      weight: getAverageWeight(startCheckIn),
    }] : []),
    ...weeklyCheckIns.map((c, idx) => ({
      name: `V${c.weekNumber || idx + 1}`,
      weight: getAverageWeight(c),
    }))
  ].filter(d => d.weight !== null)

  // Calculate weight change
  const startWeight = startCheckIn ? getAverageWeight(startCheckIn) : null
  const currentWeight = latestCheckIn ? getAverageWeight(latestCheckIn) : startWeight
  const weightChange = startWeight && currentWeight ? currentWeight - startWeight : null

  // Calculate measurement changes
  const getMeasurementChange = (field: keyof CheckIn) => {
    const start = startCheckIn?.[field] as number | null
    const current = latestCheckIn?.[field] as number | null
    if (start === null || current === null) return null
    return current - start
  }

  const measurements = [
    { label: 'Bröst', field: 'chest' as keyof CheckIn, unit: 'cm' },
    { label: 'Midja', field: 'waist' as keyof CheckIn, unit: 'cm' },
    { label: 'Höfter', field: 'hips' as keyof CheckIn, unit: 'cm' },
    { label: 'Rumpa', field: 'butt' as keyof CheckIn, unit: 'cm' },
    { label: 'Armar', field: 'arms' as keyof CheckIn, unit: 'cm' },
    { label: 'Lår', field: 'thighs' as keyof CheckIn, unit: 'cm' },
    { label: 'Vader', field: 'calves' as keyof CheckIn, unit: 'cm' },
  ]

  // Get photos from check-ins
  const getPhotosFromCheckIn = (checkIn: CheckIn | undefined) => {
    if (!checkIn) return []
    const photos = []
    if (checkIn.photoFront) photos.push({ type: 'Fram', url: checkIn.photoFront })
    if (checkIn.photoSide) photos.push({ type: 'Sida', url: checkIn.photoSide })
    if (checkIn.photoBack) photos.push({ type: 'Bak', url: checkIn.photoBack })
    return photos
  }

  const startPhotos = getPhotosFromCheckIn(startCheckIn)
  const latestPhotos = getPhotosFromCheckIn(latestCheckIn)

  // Coach view
  if (isCoach) {
    return (
      <div className="px-4 lg:px-0 py-6 space-y-6">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Statistik Översikt</h1>
          <p className="text-muted-foreground text-lg">
            Se statistik över alla klienter
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Klient Översikt</CardTitle>
            <CardDescription>Statistik och progress för alla dina klienter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Ingen statistik tillgänglig ännu</p>
              <p className="text-sm text-muted-foreground mt-2">
                När klienter börjar checka in kommer deras statistik att visas här
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar dina framsteg...</p>
        </div>
      </div>
    )
  }

  // Client view
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Framsteg
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Se hur du utvecklas över tid
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {checkIns.length === 0 ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl hover:border-gold-primary hover:shadow-lg transition-all p-12">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900">Ingen data än</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Börja med att göra din start check-in för att se dina framsteg här!
              </p>
              <Link href="/dashboard/check-in">
                <Button className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
                  Gör Check-in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Weight Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Viktförändring</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-1">Startvikt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {startWeight ? `${startWeight.toFixed(1)} kg` : '-'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-1">Nuvarande vikt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentWeight ? `${currentWeight.toFixed(1)} kg` : '-'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-1">Förändring</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${weightChange && weightChange < 0 ? 'text-green-600' : weightChange && weightChange > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '-'}
                  </p>
                  {weightChange !== null && weightChange < 0 && <TrendingDown className="w-5 h-5 text-green-600" />}
                  {weightChange !== null && weightChange > 0 && <TrendingUp className="w-5 h-5 text-red-500" />}
                  {weightChange === 0 && <Minus className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            </div>

            {weightChartData.length > 1 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', r: 5 }}
                      name="Vikt (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Measurements Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Mätpunkter</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {measurements.map(({ label, field, unit }) => {
                const startValue = startCheckIn?.[field] as number | null
                const currentValue = latestCheckIn?.[field] as number | null ?? startValue
                const change = getMeasurementChange(field)

                return (
                  <div key={field} className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-1">{label}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {currentValue !== null ? `${currentValue} ${unit}` : '-'}
                    </p>
                    {change !== null && change !== 0 && (
                      <p className={`text-sm ${change < 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)} {unit}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Photos Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Formbilder</h2>
            </div>

            {startPhotos.length === 0 && latestPhotos.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Inga formbilder uppladdade än</p>
                <p className="text-gray-400 text-sm mt-1">Ladda upp bilder i din nästa check-in</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Photos */}
                {startPhotos.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Start</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {startPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={photo.url}
                            alt={`Start ${photo.type}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            {photo.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest Photos */}
                {latestPhotos.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Vecka {latestCheckIn?.weekNumber || weeklyCheckIns.length}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {latestPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={photo.url}
                            alt={`Vecka ${latestCheckIn?.weekNumber} ${photo.type}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            {photo.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
