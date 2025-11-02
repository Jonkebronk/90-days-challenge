'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Star, Frown, Meh, Smile } from 'lucide-react'

interface CheckInFlowProps {
  userId: string
  userName: string
  onClose: () => void
}

export default function CheckInFlow({ userId, userName, onClose }: CheckInFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<{
    front: File | null
    side: File | null
    back: File | null
  }>({ front: null, side: null, back: null })

  const [formData, setFormData] = useState({
    statusUpdate: '',
    weightKg: '',
    energyLevel: 0,
    mood: 0,
    dietPlanAdherence: 0,
    workoutPlanAdherence: 0,
    sleepNotes: '',
    dailySteps: '',
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (type: 'front' | 'side' | 'back', file: File | null) => {
    setPhotoFiles(prev => ({ ...prev, [type]: file }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // For now, we'll just save the data without uploading images
      // Image upload will be added in next iteration
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
          weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        }),
      })

      if (response.ok) {
        toast.success('Check-in skickad!')
        onClose()
        router.refresh()
      } else {
        toast.error('Något gick fel')
      }
    } catch (error) {
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  // Progress bar component
  const ProgressBar = ({ current, total }: { current: number; total: number }) => (
    <div className="flex gap-1 mb-6">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={`h-1 flex-1 rounded-full ${
            idx < current ? 'bg-green-700' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  )

  const Header = ({ onBack }: { onBack?: () => void }) => (
    <div className="relative mb-4">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute left-0 top-0 p-2"
        >
          ←
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={onClose}
        className="absolute right-0 top-0 p-2"
      >
        ✕
      </Button>
      <h1 className="text-2xl font-bold text-center pt-8">Check-in</h1>
    </div>
  )

  // Star rating component
  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center ${
            star <= value ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
          }`}
        >
          <Star
            className={`w-8 h-8 ${
              star <= value ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )

  // Mood rating component
  const MoodRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const moods = [
      { icon: '😡', value: 1 },
      { icon: '😟', value: 2 },
      { icon: '😐', value: 3 },
      { icon: '🙂', value: 4 },
      { icon: '😄', value: 5 },
    ]

    return (
      <div className="flex gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-3xl ${
              mood.value === value ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            {mood.icon}
          </button>
        ))}
      </div>
    )
  }

  // Step 1: Welcome
  if (step === 1) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <div className="relative mb-6">
              <Button
                variant="ghost"
                onClick={onClose}
                className="absolute right-0 top-0 p-2"
              >
                ✕
              </Button>
              <h1 className="text-2xl font-bold">Check-in</h1>
            </div>

            <ProgressBar current={1} total={11} />

            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Hallå där! 👋</h2>
                <p className="text-muted-foreground">
                  Det är dags för din check-in. Du kan uppdatera några mått och berätta hur din vecka har varit.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Status
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(1)} />
            <ProgressBar current={2} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Status</h2>
                <p className="text-sm text-muted-foreground">
                  Hur har du haft det sedan din senaste uppdatering?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.statusUpdate}
              onChange={(e) => updateFormData('statusUpdate', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
              maxLength={500}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {formData.statusUpdate.length} / 500
            </div>

            <Button
              onClick={() => setStep(3)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: Weight
  if (step === 3) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(2)} />
            <ProgressBar current={3} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Kroppsmått</h2>
                <p className="text-sm text-muted-foreground">
                  Lägg till dina senaste mätningar
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Vikt</Label>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => updateFormData('weightKg', e.target.value)}
                  placeholder=""
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kg
                </span>
              </div>
            </div>

            <Button
              onClick={() => setStep(4)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 4: Energy Level
  if (step === 4) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(3)} />
            <ProgressBar current={4} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Energinivå</h2>
                <p className="text-sm text-muted-foreground">
                  1 = låg energi, 5 = mycket energisk
                </p>
              </div>
            </div>

            <StarRating
              value={formData.energyLevel}
              onChange={(v) => updateFormData('energyLevel', v)}
            />

            <Button
              onClick={() => setStep(5)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 5: Mood
  if (step === 5) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(4)} />
            <ProgressBar current={5} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Humör</h2>
                <p className="text-sm text-muted-foreground">
                  1 = dålig, 5 = mycket bra
                </p>
              </div>
            </div>

            <MoodRating
              value={formData.mood}
              onChange={(v) => updateFormData('mood', v)}
            />

            <Button
              onClick={() => setStep(6)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 6: Diet Plan Adherence
  if (step === 6) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(5)} />
            <ProgressBar current={6} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Användning av kostschema</h2>
                <p className="text-sm text-muted-foreground">
                  Hur väl tyckte du att kostschemat fungerade förra veckan? 1 = Väldigt dåligt, 5 = Mycket bra
                </p>
              </div>
            </div>

            <StarRating
              value={formData.dietPlanAdherence}
              onChange={(v) => updateFormData('dietPlanAdherence', v)}
            />

            <Button
              onClick={() => setStep(7)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 7: Workout Plan Adherence
  if (step === 7) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(6)} />
            <ProgressBar current={7} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Användning av träningsschema</h2>
                <p className="text-sm text-muted-foreground">
                  Använde du ditt träningsschema? 1 = inte alls, 5 = använde hela planen
                </p>
              </div>
            </div>

            <StarRating
              value={formData.workoutPlanAdherence}
              onChange={(v) => updateFormData('workoutPlanAdherence', v)}
            />

            <Button
              onClick={() => setStep(8)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 8: Sleep
  if (step === 8) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(7)} />
            <ProgressBar current={8} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Sömn</h2>
                <p className="text-sm text-muted-foreground">
                  Hur mycket sover du i genomsnitt per natt?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.sleepNotes}
              onChange={(e) => updateFormData('sleepNotes', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
              maxLength={500}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {formData.sleepNotes.length} / 500
            </div>

            <Button
              onClick={() => setStep(9)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 9: Daily Steps
  if (step === 9) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(8)} />
            <ProgressBar current={9} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Steg</h2>
                <p className="text-sm text-muted-foreground">
                  Hur många steg tar du vanligtvis per dag?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.dailySteps}
              onChange={(e) => updateFormData('dailySteps', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={4}
              maxLength={300}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {formData.dailySteps.length} / 300
            </div>

            <Button
              onClick={() => setStep(10)}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 10: Progress Photos
  if (step === 10) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(9)} />
            <ProgressBar current={10} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Framstegsbilder</h2>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {['front', 'side', 'back'].map((type) => (
                <div key={type} className="space-y-2">
                  <label className="block">
                    <div className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <div className="text-4xl mb-2">↑</div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileChange(type as 'front' | 'side' | 'back', file)
                          }
                        }}
                      />
                    </div>
                  </label>
                  <p className="text-sm text-center capitalize">
                    {type === 'front' ? 'Framsida' : type === 'side' ? 'Sidan' : 'Bakifrån'}
                  </p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-12 mt-6"
            >
              {isLoading ? 'Skickar...' : 'Skicka in'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
