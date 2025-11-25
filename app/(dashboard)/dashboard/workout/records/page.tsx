'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Dumbbell, Calendar, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workout">
            <Button variant="ghost" size="icon" className="text-gray-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 flex items-center gap-2">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-gold-light" />
              Personbästa
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Dina högsta lyft för varje övning
            </p>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      {records.length === 0 ? (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="py-12 text-center">
            <Trophy className="w-16 h-16 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              Inga personbästa än
            </h3>
            <p className="text-gray-400 mb-6">
              Genomför ditt första träningspass för att börja spåra dina rekord!
            </p>
            <Link href="/dashboard/workout">
              <Button className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90">
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
              className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-[#0a0a0a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                      {record.exercise.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {record.exercise.muscleGroups.slice(0, 2).map((mg, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] sm:text-xs bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)] text-[rgba(139,92,246,0.9)]"
                        >
                          {mg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {record.records.max_weight && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                          {Number(record.records.max_weight.weightKg).toFixed(1)} kg
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {record.records.max_weight.reps} reps
                        </div>
                      </div>
                      <Trophy className="w-8 h-8 text-gold-light" />
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-2 pt-2 border-t border-white/10">
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
