'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, TrendingUp, Dumbbell, Calendar, ArrowLeft } from 'lucide-react'
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
    max_reps?: any
    max_volume?: any
    max_one_rep_max?: any
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
        setRecords(data.records)
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
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workout">
            <Button variant="ghost" size="icon" className="text-[rgba(255,255,255,0.7)]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)] flex items-center gap-2">
              <Trophy className="w-8 h-8 text-[#FFD700]" />
              Personal Records
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              Your all-time bests for each exercise
            </p>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      {records.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="py-12 text-center">
            <Trophy className="w-16 h-16 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] mb-2">
              No Personal Records Yet
            </h3>
            <p className="text-[rgba(255,255,255,0.6)] mb-6">
              Complete your first workout to start tracking your PRs!
            </p>
            <Link href="/dashboard/workout">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90">
                Start Training
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {records.map((record) => (
            <Card
              key={record.exercise.id}
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-[#0a0a0a]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[rgba(255,255,255,0.95)]">
                        {record.exercise.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.exercise.muscleGroups.slice(0, 2).map((mg, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)] text-[rgba(139,92,246,0.9)]"
                          >
                            {mg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.records.max_weight && (
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <div>
                      <div className="text-sm text-[rgba(255,255,255,0.6)]">Max Weight</div>
                      <div className="text-2xl font-bold text-[rgba(255,255,255,0.95)]">
                        {Number(record.records.max_weight.weightKg).toFixed(1)} kg
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)] flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.records.max_weight.achievedAt)}
                      </div>
                    </div>
                    <Trophy className="w-6 h-6 text-[#FFD700]" />
                  </div>
                )}

                {record.records.max_reps && (
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <div>
                      <div className="text-sm text-[rgba(255,255,255,0.6)]">Max Reps</div>
                      <div className="text-2xl font-bold text-[rgba(255,255,255,0.95)]">
                        {record.records.max_reps.reps} reps
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)] flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.records.max_reps.achievedAt)}
                      </div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-[#8b5cf6]" />
                  </div>
                )}

                {record.records.max_volume && (
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <div>
                      <div className="text-sm text-[rgba(255,255,255,0.6)]">Max Volume</div>
                      <div className="text-2xl font-bold text-[rgba(255,255,255,0.95)]">
                        {Number(record.records.max_volume.volume).toFixed(0)} kg
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">
                        {record.records.max_volume.reps} reps × {Number(record.records.max_volume.weightKg).toFixed(1)}kg
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)] flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.records.max_volume.achievedAt)}
                      </div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-[#3b82f6]" />
                  </div>
                )}

                {record.records.max_one_rep_max && (
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <div>
                      <div className="text-sm text-[rgba(255,255,255,0.6)]">Est. 1RM</div>
                      <div className="text-2xl font-bold text-[rgba(255,255,255,0.95)]">
                        {Number(record.records.max_one_rep_max.oneRepMax).toFixed(1)} kg
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">
                        Based on {record.records.max_one_rep_max.reps} reps @ {Number(record.records.max_one_rep_max.weightKg).toFixed(1)}kg
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)] flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.records.max_one_rep_max.achievedAt)}
                      </div>
                    </div>
                    <Trophy className="w-6 h-6 text-[#22c55e]" />
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
