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

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Convert photos to base64
      const photoUrls: { front?: string; side?: string; back?: string } = {}

      if (photoFiles.front) {
        photoUrls.front = await convertFileToBase64(photoFiles.front)
      }
      if (photoFiles.side) {
        photoUrls.side = await convertFileToBase64(photoFiles.side)
      }
      if (photoFiles.back) {
        photoUrls.back = await convertFileToBase64(photoFiles.back)
      }

      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
          weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
          photoFront: photoUrls.front,
          photoSide: photoUrls.side,
          photoBack: photoUrls.back,
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
            idx < current ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]' : 'bg-[rgba(255,255,255,0.1)]'
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
          className="absolute left-0 top-0 p-2 text-[#FFD700] hover:text-[#FFA500] hover:bg-[rgba(255,215,0,0.1)]"
        >
          ←
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={onClose}
        className="absolute right-0 top-0 p-2 text-[#FFD700] hover:text-[#FFA500] hover:bg-[rgba(255,215,0,0.1)]"
      >
        ✕
      </Button>
      <h1 className="text-2xl font-bold text-center pt-8 bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">Check-in</h1>
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
          className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
            star <= value ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]' : 'border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,215,0,0.5)]'
          }`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= value ? 'fill-[#FFD700] text-[#FFD700]' : 'text-[rgba(255,255,255,0.3)]'
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
            className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-3xl transition-all ${
              mood.value === value ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]' : 'border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,215,0,0.5)] bg-[rgba(255,255,255,0.03)]'
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <div className="relative mb-6">
              <Button
                variant="ghost"
                onClick={onClose}
                className="absolute right-0 top-0 p-2 text-[#FFD700] hover:text-[#FFA500] hover:bg-[rgba(255,215,0,0.1)]"
              >
                ✕
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">Check-in</h1>
            </div>

            <ProgressBar current={1} total={11} />

            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white text-white">Hallå där! 👋</h2>
                <p className="text-[rgba(255,255,255,0.6)]">
                  Det är dags för din check-in. Du kan uppdatera några mått och berätta hur din vecka har varit.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(1)} />
            <ProgressBar current={2} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Status</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.statusUpdate.length} / 500
            </div>

            <Button
              onClick={() => setStep(3)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(2)} />
            <ProgressBar current={3} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Kroppsmått</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Lägg till dina senaste mätningar
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-[rgba(255,215,0,0.8)]">Vikt</Label>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => updateFormData('weightKg', e.target.value)}
                  placeholder=""
                  className="pr-12 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.6)]">
                  kg
                </span>
              </div>
            </div>

            <Button
              onClick={() => setStep(4)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(3)} />
            <ProgressBar current={4} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Energinivå</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(4)} />
            <ProgressBar current={5} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Humör</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(5)} />
            <ProgressBar current={6} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Användning av kostschema</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(6)} />
            <ProgressBar current={7} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Användning av träningsschema</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(7)} />
            <ProgressBar current={8} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Sömn</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.sleepNotes.length} / 500
            </div>

            <Button
              onClick={() => setStep(9)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(8)} />
            <ProgressBar current={9} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Steg</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
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
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.dailySteps.length} / 300
            </div>

            <Button
              onClick={() => setStep(10)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(9)} />
            <ProgressBar current={10} total={11} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Framstegsbilder</h2>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {['front', 'side', 'back'].map((type) => {
                const file = photoFiles[type as keyof typeof photoFiles]
                const preview = file ? URL.createObjectURL(file) : null

                return (
                  <div key={type} className="space-y-2">
                    <label className="block">
                      <div className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative">
                        {preview ? (
                          <>
                            <img src={preview} alt={type} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                handleFileChange(type as 'front' | 'side' | 'back', null)
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <div className="text-4xl mb-2">↑</div>
                        )}
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
                )
              })}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12 mt-6"
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
