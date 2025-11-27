'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Dumbbell, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PRData {
  exercise: {
    id: string
    name: string
    muscleGroups: string[]
    category: string | null
  }
  records: {
    max_weight?: any
  }
}

export default function PersonalRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<PRData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/personal-records')
      if (response.ok) {
        const data = await response.json()
        // Filter to only include records that have max_weight
        const recordsWithWeight = data.records.filter(
          (r: PRData) => r.records.max_weight
        )
        setRecords(recordsWithWeight)
      }
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gold-primary/30 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Personbästa
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Dina högsta lyft för varje övning
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Records Grid */}
      {records.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="py-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Inga personbästa än
            </h3>
            <p className="text-gray-500 mb-6">
              Genomför ditt första träningspass för att börja spåra dina rekord!
            </p>
            <Link href="/dashboard/workout">
              <Button className="bg-gradient-to-r from-gold-light to-orange-500 text-black hover:opacity-90">
                Börja träna
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <Card
              key={record.exercise.id}
              className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {record.exercise.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {record.exercise.muscleGroups.slice(0, 2).map((mg, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] sm:text-xs bg-purple-50 border-purple-200 text-purple-600"
                        >
                          {mg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {record.records.max_weight && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {Number(record.records.max_weight.weightKg).toFixed(1)} kg
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {record.records.max_weight.reps} reps
                        </div>
                      </div>
                      <Trophy className="w-8 h-8 text-gold-primary" />
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.records.max_weight.achievedAt)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
