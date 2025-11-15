'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Flame,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  Calendar,
  BarChart3
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'

interface ReadingProgressDashboardProps {
  className?: string
}

interface Analytics {
  streak: {
    current: number
    longest: number
    lastReadDate: string | null
  }
  weeklyGoal: {
    target: number
    current: number
    percentage: number
    completed: boolean
  }
  totals: {
    articlesRead: number
    totalReadingTime: number
    averageReadingTime: number
    articlesThisWeek: number
    articlesThisMonth: number
  }
  categoryStats: Array<{
    name: string
    count: number
    color: string
  }>
  readingOverTime: Array<{
    date: string
    count: number
  }>
  phaseProgress: Array<{
    phase: number
    completed: number
    total: number
    percentage: number
  }>
}

export function ReadingProgressDashboard({ className }: ReadingProgressDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState(false)
  const [newGoalTarget, setNewGoalTarget] = useState(3)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/articles/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setNewGoalTarget(data.weeklyGoal.target)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateWeeklyGoal = async () => {
    try {
      const response = await fetch('/api/articles/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetArticles: newGoalTarget })
      })

      if (response.ok) {
        fetchAnalytics()
        setEditingGoal(false)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  if (isLoading || !analytics) {
    return (
      <Card className={`bg-[rgba(10,10,10,0.5)] backdrop-blur-sm border-[rgba(255,215,0,0.2)] ${className}`}>
        <CardContent className="p-6">
          <p className="text-[rgba(255,255,255,0.5)]">Laddar statistik...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reading Streak */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-400">
              <Flame className="h-5 w-5" />
              Läsningssvit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-orange-400">
              {analytics.streak.current}
              <span className="text-lg text-[rgba(255,255,255,0.5)] ml-2">dagar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.6)]">
              <Award className="h-4 w-4" />
              <span>Längsta: {analytics.streak.longest} dagar</span>
            </div>
            {analytics.streak.lastReadDate && (
              <p className="text-xs text-[rgba(255,255,255,0.5)]">
                Senast: {format(parseISO(analytics.streak.lastReadDate), 'd MMM', { locale: sv })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Goal */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-400">
                <Target className="h-5 w-5" />
                Veckans mål
              </CardTitle>
              {!editingGoal && (
                <Button
                  onClick={() => setEditingGoal(true)}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-green-400 hover:text-green-300"
                >
                  Ändra
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingGoal ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(parseInt(e.target.value))}
                  className="bg-[rgba(255,255,255,0.05)] border-green-500/30"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={updateWeeklyGoal}
                    size="sm"
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    Spara
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingGoal(false)
                      setNewGoalTarget(analytics.weeklyGoal.target)
                    }}
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-green-400">
                    {analytics.weeklyGoal.current}
                  </span>
                  <span className="text-lg text-[rgba(255,255,255,0.5)] mb-1">
                    / {analytics.weeklyGoal.target}
                  </span>
                </div>
                <Progress
                  value={analytics.weeklyGoal.percentage}
                  className="h-2 bg-[rgba(34,197,94,0.2)]"
                />
                <p className="text-xs text-[rgba(255,255,255,0.5)]">
                  {analytics.weeklyGoal.completed ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Målet uppnått!
                    </span>
                  ) : (
                    `${analytics.weeklyGoal.target - analytics.weeklyGoal.current} kvar till målet`
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Articles Read */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
              <BookOpen className="h-5 w-5" />
              Totalt läst
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-blue-400">
              {analytics.totals.articlesRead}
              <span className="text-lg text-[rgba(255,255,255,0.5)] ml-2">artiklar</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[rgba(255,255,255,0.6)]">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{analytics.totals.articlesThisMonth} denna månaden</span>
              </div>
            </div>
            {analytics.totals.totalReadingTime > 0 && (
              <div className="flex items-center gap-1 text-xs text-[rgba(255,255,255,0.5)]">
                <Clock className="h-3 w-3" />
                <span>{analytics.totals.totalReadingTime} min total lästid</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase Progress */}
      <Card className="bg-[rgba(10,10,10,0.5)] backdrop-blur-sm border-[rgba(255,215,0,0.2)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-[#FFD700]" />
            Framsteg per fas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.phaseProgress.map((phase) => (
            <div key={phase.phase} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Fas {phase.phase}</span>
                <span className="text-sm text-[rgba(255,255,255,0.6)]">
                  {phase.completed} / {phase.total} ({phase.percentage}%)
                </span>
              </div>
              <Progress
                value={phase.percentage}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category Stats */}
      {analytics.categoryStats.length > 0 && (
        <Card className="bg-[rgba(10,10,10,0.5)] backdrop-blur-sm border-[rgba(255,215,0,0.2)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-[#FFD700]" />
              Läsning per kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.categoryStats.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-white">{cat.name}</span>
                  <Badge
                    className="text-black font-semibold"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
