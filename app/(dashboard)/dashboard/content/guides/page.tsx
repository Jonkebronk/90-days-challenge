'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Save, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'

interface GuideContent {
  id: string
  type: string
  title: string
  content: string
}

export default function GuidesManagementPage() {
  const { data: session } = useSession()
  const [guides, setGuides] = useState<GuideContent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activePreview, setActivePreview] = useState<'meal_plan' | 'workout' | 'onboarding' | null>(null)

  const [mealPlanData, setMealPlanData] = useState({
    title: '',
    content: ''
  })

  const [workoutData, setWorkoutData] = useState({
    title: '',
    content: ''
  })

  const [onboardingData, setOnboardingData] = useState({
    title: '',
    content: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchGuides()
    }
  }, [session])

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/guide-content')
      if (response.ok) {
        const data = await response.json()
        setGuides(data.guides)

        // Populate form data
        const mealPlan = data.guides.find((g: GuideContent) => g.type === 'meal_plan')
        const workout = data.guides.find((g: GuideContent) => g.type === 'workout')
        const onboarding = data.guides.find((g: GuideContent) => g.type === 'onboarding')

        if (mealPlan) {
          setMealPlanData({
            title: mealPlan.title,
            content: mealPlan.content
          })
        }

        if (workout) {
          setWorkoutData({
            title: workout.title,
            content: workout.content
          })
        }

        if (onboarding) {
          setOnboardingData({
            title: onboarding.title,
            content: onboarding.content
          })
        }
      }
    } catch (error) {
      console.error('Error fetching guides:', error)
      toast.error('Kunde inte hämta guider')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (type: 'meal_plan' | 'workout' | 'onboarding') => {
    try {
      setSaving(type)
      const data = type === 'meal_plan' ? mealPlanData : type === 'workout' ? workoutData : onboardingData

      const response = await fetch('/api/guide-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          ...data
        })
      })

      if (response.ok) {
        toast.success('Guide sparad!')
        fetchGuides()
      } else {
        toast.error('Kunde inte spara guide')
      }
    } catch (error) {
      console.error('Error saving guide:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSaving(null)
    }
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar guider...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-[#FFD700]" />
          <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            Hantera Guider
          </h1>
        </div>
        <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
          Redigera innehåll för kom igång, kostschema och träningsprogram introduktioner
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
      </div>

      {/* Tabs for different guides */}
      <Tabs defaultValue="onboarding" className="w-full">
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.3)]">
          <TabsTrigger
            value="onboarding"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a]"
          >
            Kom Igång Guide
          </TabsTrigger>
          <TabsTrigger
            value="meal_plan"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#fb923c] data-[state=active]:to-[#f97316] data-[state=active]:text-white"
          >
            Kostschema Guide
          </TabsTrigger>
          <TabsTrigger
            value="workout"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8b5cf6] data-[state=active]:to-[#7c3aed] data-[state=active]:text-white"
          >
            Träningsprogram Guide
          </TabsTrigger>
        </TabsList>

        {/* Onboarding / Kom Igång Guide */}
        <TabsContent value="onboarding">
          <Card className="bg-[rgba(10,10,10,0.6)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-[rgba(255,255,255,0.9)]">Kom Igång Guide</CardTitle>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">
                Denna text visas på /dashboard/onboarding/guide
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="onboarding-title" className="text-[rgba(255,255,255,0.8)]">
                  Titel
                </Label>
                <Input
                  id="onboarding-title"
                  value={onboardingData.title}
                  onChange={(e) => setOnboardingData({ ...onboardingData, title: e.target.value })}
                  className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="onboarding-content" className="text-[rgba(255,255,255,0.8)]">
                    Innehåll (MDX)
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePreview(activePreview === 'onboarding' ? null : 'onboarding')}
                    className="bg-transparent border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {activePreview === 'onboarding' ? 'Dölj' : 'Visa'} Förhandsvisning
                  </Button>
                </div>
                <Textarea
                  id="onboarding-content"
                  value={onboardingData.content}
                  onChange={(e) => setOnboardingData({ ...onboardingData, content: e.target.value })}
                  className="min-h-[400px] font-mono bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white"
                  placeholder="# Rubrik&#10;&#10;Din text här..."
                />
              </div>

              {activePreview === 'onboarding' && (
                <div className="border-2 border-[rgba(255,215,0,0.3)] rounded-lg p-6 bg-[rgba(0,0,0,0.3)]">
                  <h3 className="text-lg font-bold text-[#FFD700] mb-4">Förhandsvisning:</h3>
                  <div className="prose prose-invert prose-lg max-w-none prose-headings:text-[#FFD700] prose-headings:font-bold prose-p:text-[rgba(255,255,255,0.8)] prose-strong:text-[#FFD700] prose-li:text-[rgba(255,255,255,0.8)]">
                    <MDXPreview content={onboardingData.content} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSave('onboarding')}
                  disabled={saving === 'onboarding'}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving === 'onboarding' ? 'Sparar...' : 'Spara Ändringar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/dashboard/onboarding/guide', '_blank')}
                  className="bg-transparent border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Öppna Live-sida
                </Button>
              </div>

              <div className="mt-4 p-4 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg">
                <p className="text-sm font-medium text-[#3b82f6] mb-2">MDX Formatering:</p>
                <ul className="text-sm text-[rgba(255,255,255,0.7)] space-y-1 list-disc list-inside">
                  <li># för huvudrubrik (H1)</li>
                  <li>## för underrubrik (H2)</li>
                  <li>**text** för fet text</li>
                  <li>*text* för kursiv text</li>
                  <li>[länktext](url) för länkar</li>
                  <li>- för punktlistor</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meal Plan Guide */}
        <TabsContent value="meal_plan">
          <Card className="bg-[rgba(10,10,10,0.6)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-[rgba(255,255,255,0.9)]">Kostschema Guide</CardTitle>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">
                Denna text visas på /dashboard/meal-plan/guide
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meal-plan-title" className="text-[rgba(255,255,255,0.8)]">
                  Titel
                </Label>
                <Input
                  id="meal-plan-title"
                  value={mealPlanData.title}
                  onChange={(e) => setMealPlanData({ ...mealPlanData, title: e.target.value })}
                  className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="meal-plan-content" className="text-[rgba(255,255,255,0.8)]">
                    Innehåll (MDX)
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePreview(activePreview === 'meal_plan' ? null : 'meal_plan')}
                    className="bg-transparent border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {activePreview === 'meal_plan' ? 'Dölj' : 'Visa'} Förhandsvisning
                  </Button>
                </div>
                <Textarea
                  id="meal-plan-content"
                  value={mealPlanData.content}
                  onChange={(e) => setMealPlanData({ ...mealPlanData, content: e.target.value })}
                  className="min-h-[400px] font-mono bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white"
                  placeholder="# Rubrik&#10;&#10;Din text här..."
                />
              </div>

              {activePreview === 'meal_plan' && (
                <div className="border-2 border-[rgba(255,215,0,0.3)] rounded-lg p-6 bg-[rgba(0,0,0,0.3)]">
                  <h3 className="text-lg font-bold text-[#FFD700] mb-4">Förhandsvisning:</h3>
                  <div className="prose prose-invert prose-lg max-w-none prose-headings:text-[#FFD700] prose-headings:font-bold prose-p:text-[rgba(255,255,255,0.8)] prose-strong:text-[#FFD700] prose-li:text-[rgba(255,255,255,0.8)]">
                    <MDXPreview content={mealPlanData.content} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSave('meal_plan')}
                  disabled={saving === 'meal_plan'}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving === 'meal_plan' ? 'Sparar...' : 'Spara Ändringar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/dashboard/meal-plan/guide', '_blank')}
                  className="bg-transparent border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Öppna Live-sida
                </Button>
              </div>

              <div className="mt-4 p-4 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg">
                <p className="text-sm font-medium text-[#3b82f6] mb-2">MDX Formatering:</p>
                <ul className="text-sm text-[rgba(255,255,255,0.7)] space-y-1 list-disc list-inside">
                  <li># för huvudrubrik (H1)</li>
                  <li>## för underrubrik (H2)</li>
                  <li>**text** för fet text</li>
                  <li>*text* för kursiv text</li>
                  <li>[länktext](url) för länkar</li>
                  <li>- för punktlistor</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workout Guide */}
        <TabsContent value="workout">
          <Card className="bg-[rgba(10,10,10,0.6)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-[rgba(255,255,255,0.9)]">Träningsprogram Guide</CardTitle>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">
                Denna text visas på /dashboard/workout/guide
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workout-title" className="text-[rgba(255,255,255,0.8)]">
                  Titel
                </Label>
                <Input
                  id="workout-title"
                  value={workoutData.title}
                  onChange={(e) => setWorkoutData({ ...workoutData, title: e.target.value })}
                  className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="workout-content" className="text-[rgba(255,255,255,0.8)]">
                    Innehåll (MDX)
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePreview(activePreview === 'workout' ? null : 'workout')}
                    className="bg-transparent border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {activePreview === 'workout' ? 'Dölj' : 'Visa'} Förhandsvisning
                  </Button>
                </div>
                <Textarea
                  id="workout-content"
                  value={workoutData.content}
                  onChange={(e) => setWorkoutData({ ...workoutData, content: e.target.value })}
                  className="min-h-[400px] font-mono bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white"
                  placeholder="# Rubrik&#10;&#10;Din text här..."
                />
              </div>

              {activePreview === 'workout' && (
                <div className="border-2 border-[rgba(255,215,0,0.3)] rounded-lg p-6 bg-[rgba(0,0,0,0.3)]">
                  <h3 className="text-lg font-bold text-[#FFD700] mb-4">Förhandsvisning:</h3>
                  <div className="prose prose-invert prose-lg max-w-none prose-headings:text-[#FFD700] prose-headings:font-bold prose-p:text-[rgba(255,255,255,0.8)] prose-strong:text-[#FFD700] prose-li:text-[rgba(255,255,255,0.8)]">
                    <MDXPreview content={workoutData.content} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSave('workout')}
                  disabled={saving === 'workout'}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving === 'workout' ? 'Sparar...' : 'Spara Ändringar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/dashboard/workout/guide', '_blank')}
                  className="bg-transparent border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Öppna Live-sida
                </Button>
              </div>

              <div className="mt-4 p-4 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg">
                <p className="text-sm font-medium text-[#3b82f6] mb-2">MDX Formatering:</p>
                <ul className="text-sm text-[rgba(255,255,255,0.7)] space-y-1 list-disc list-inside">
                  <li># för huvudrubrik (H1)</li>
                  <li>## för underrubrik (H2)</li>
                  <li>**text** för fet text</li>
                  <li>*text* för kursiv text</li>
                  <li>[länktext](url) för länkar</li>
                  <li>- för punktlistor</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
