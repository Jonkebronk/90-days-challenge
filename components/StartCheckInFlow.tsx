'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface StartCheckInFlowProps {
  userId: string
  userName: string
  onClose: () => void
}

export default function StartCheckInFlow({ userId, userName, onClose }: StartCheckInFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<{
    front: File | null
    side: File | null
    back: File | null
  }>({ front: null, side: null, back: null })

  const [formData, setFormData] = useState({
    statusUpdate: '', // Will be used for "Berätta om dig"
    mondayWeight: '', // Will use just this field for starting weight
    // Kroppsmått
    chest: '',
    waist: '',
    hips: '',
    butt: '',
    arms: '',
    thighs: '',
    calves: '',
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
          photoFront: photoUrls.front,
          photoSide: photoUrls.side,
          photoBack: photoUrls.back,
          isStartCheckIn: true, // Mark as start check-in
          weekNumber: 0, // Start check-in is week 0
        }),
      })

      if (response.ok) {
        setStep(7) // Go to completion screen
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
      <h1 className="text-2xl font-bold text-center pt-8 bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">Start Check-in</h1>
    </div>
  )

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">Start Check-in</h1>
            </div>

            <ProgressBar current={1} total={6} />

            <div className="flex items-start gap-4 mb-8">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold text-2xl">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-3 text-white">Välkommen till din resa! 🎉</h2>
                <p className="text-[rgba(255,255,255,0.7)] leading-relaxed">
                  Detta är din start check-in som markerar början på din 90-dagars transformation.
                  Vi kommer att dokumentera din utgångspunkt så att du kan följa din fantastiska utveckling!
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12"
            >
              Börja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Berätta om dig
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(1)} />
            <ProgressBar current={2} total={6} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Berätta om dig</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Hur ser din utgångspunkt ut? Vad hoppas du uppnå under dessa 90 dagar?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.statusUpdate}
              onChange={(e) => updateFormData('statusUpdate', e.target.value)}
              placeholder="Berätta om din situation, dina mål och varför du vill göra denna förändring..."
              rows={8}
              maxLength={1000}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.statusUpdate.length} / 1000
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

  // Step 3: Starting weight
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(2)} />
            <ProgressBar current={3} total={6} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                ⚖️
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Startvikt</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Ange din nuvarande vikt
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Vikt (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.mondayWeight}
                  onChange={(e) => updateFormData('mondayWeight', e.target.value)}
                  placeholder="t.ex. 75.5"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700] text-lg h-12"
                />
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

  // Step 4: Body measurements
  if (step === 4) {
    const measurements = [
      { name: 'Bröst', field: 'chest', placeholder: 'cm' },
      { name: 'Midja', field: 'waist', placeholder: 'cm' },
      { name: 'Höfter', field: 'hips', placeholder: 'cm' },
      { name: 'Rumpa', field: 'butt', placeholder: 'cm' },
      { name: 'Armar', field: 'arms', placeholder: 'cm' },
      { name: 'Lår', field: 'thighs', placeholder: 'cm' },
      { name: 'Vader', field: 'calves', placeholder: 'cm' },
    ]

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(3)} />
            <ProgressBar current={4} total={6} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                📏
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Kroppsmått</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Mät dina startmått (frivilligt men rekommenderas)
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {measurements.map((measurement) => (
                <div key={measurement.field}>
                  <Label className="text-white text-sm mb-1 block">{measurement.name}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={(formData as any)[measurement.field]}
                    onChange={(e) => updateFormData(measurement.field, e.target.value)}
                    placeholder={measurement.placeholder}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
                  />
                </div>
              ))}
            </div>

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

  // Step 5: Form photos
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(4)} />
            <ProgressBar current={5} total={6} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                📸
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Startbilder</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Ta dina startbilder - dessa kommer att visa din fantastiska transformation!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Framsida</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FFD700] file:to-[#FFA500] file:text-[#0a0a0a] hover:file:bg-[#FFD700]"
                />
                {photoFiles.front && (
                  <p className="text-sm text-[#FFD700] mt-1">✓ Bild vald</p>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Sida</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('side', e.target.files?.[0] || null)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FFD700] file:to-[#FFA500] file:text-[#0a0a0a] hover:file:bg-[#FFD700]"
                />
                {photoFiles.side && (
                  <p className="text-sm text-[#FFD700] mt-1">✓ Bild vald</p>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Baksida</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FFD700] file:to-[#FFA500] file:text-[#0a0a0a] hover:file:bg-[#FFD700]"
                />
                {photoFiles.back && (
                  <p className="text-sm text-[#FFD700] mt-1">✓ Bild vald</p>
                )}
              </div>
            </div>

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

  // Step 6: Review and submit
  if (step === 6) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(5)} />
            <ProgressBar current={6} total={6} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Slutför din start check-in</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Granska och skicka in din start check-in
                </p>
              </div>
            </div>

            <div className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.6)]">Startvikt:</span>
                <span className="text-white font-semibold">{formData.mondayWeight || '—'} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.6)]">Kroppsmått:</span>
                <span className="text-white font-semibold">
                  {[formData.chest, formData.waist, formData.hips].filter(Boolean).length > 0 ? '✓ Ifyllt' : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.6)]">Startbilder:</span>
                <span className="text-white font-semibold">
                  {[photoFiles.front, photoFiles.side, photoFiles.back].filter(Boolean).length} av 3
                </span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12"
            >
              {isLoading ? 'Skickar...' : 'Skicka in'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 7: Completion screen
  if (step === 7) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-4xl">
                🎉
              </div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Välkommen till din 90-dagars resa!
              </h1>
              <p className="text-[rgba(255,255,255,0.8)] text-lg leading-relaxed mb-6">
                Din coach har nu tagit emot din start check-in och ser fram emot att följa din resa mot dina mål.
              </p>
              <div className="bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded-lg p-6 mb-6">
                <p className="text-white text-lg italic">
                  &quot;Detta är dag 1 av din transformation. Kom ihåg varför du började när det blir tufft.
                  Jag finns här för att stötta dig hela vägen!&quot;
                </p>
                <p className="text-[#FFD700] mt-4 font-semibold">- Din coach</p>
              </div>
            </div>

            <Button
              onClick={() => {
                onClose()
                router.refresh()
                router.push('/dashboard')
              }}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-14 text-lg"
            >
              Till Dashboard 💪
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
