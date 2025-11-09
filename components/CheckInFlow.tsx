'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

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
    // Dagliga vikter
    mondayWeight: '',
    tuesdayWeight: '',
    wednesdayWeight: '',
    thursdayWeight: '',
    fridayWeight: '',
    saturdayWeight: '',
    sundayWeight: '',
    // Kroppsmått
    chest: '',
    waist: '',
    hips: '',
    butt: '',
    arms: '',
    thighs: '',
    calves: '',
    // Träning och kost
    trainedAllSessions: null as boolean | null,
    trainingComments: '',
    hadDietDeviations: null as boolean | null,
    dietComments: '',
    otherComments: '',
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

            <ProgressBar current={1} total={10} />

            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Hallå där! 👋</h2>
                <p className="text-[rgba(255,255,255,0.6)]">
                  Det är dags för din avstämning. Uppdatera dina mätpunkter och berätta hur veckan har gått.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold h-12"
            >
              Starta
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
            <ProgressBar current={2} total={10} />

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

  // Step 3: Dagliga vikter
  if (step === 3) {
    const weekDays = [
      { name: 'Måndag', field: 'mondayWeight' },
      { name: 'Tisdag', field: 'tuesdayWeight' },
      { name: 'Onsdag', field: 'wednesdayWeight' },
      { name: 'Torsdag', field: 'thursdayWeight' },
      { name: 'Fredag', field: 'fridayWeight' },
      { name: 'Lördag', field: 'saturdayWeight' },
      { name: 'Söndag', field: 'sundayWeight' },
    ]

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(2)} />
            <ProgressBar current={3} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Vikter för veckan</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Fyll i dina vikter för varje dag du vägt dig denna vecka
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {weekDays.map((day) => (
                <div key={day.field} className="space-y-1">
                  <Label htmlFor={day.field} className="text-[rgba(255,215,0,0.8)]">{day.name}</Label>
                  <div className="relative">
                    <Input
                      id={day.field}
                      type="number"
                      step="0.1"
                      value={formData[day.field as keyof typeof formData] as string}
                      onChange={(e) => updateFormData(day.field, e.target.value)}
                      placeholder="Valfritt"
                      className="pr-12 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.6)]">
                      kg
                    </span>
                  </div>
                </div>
              ))}
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

  // Step 4: Kroppsmått
  if (step === 4) {
    const measurements = [
      { name: 'Bröst', field: 'chest', description: 'Mät i höjd med dina bröstvårtor.', image: '/images/measurements/chest.png' },
      { name: 'Midja', field: 'waist', description: 'Mät runt det bredaste stället på midjan, oftast precis under naveln. Dra ej in magen när du tar måttet utan var avslappnad', image: '/images/measurements/waist.png' },
      { name: 'Höfter', field: 'hips', description: 'Mär runt det bredaste stället på dina höfter utan dra in magen.', image: '/images/measurements/hips.png' },
      { name: 'Rumpa', field: 'butt', description: 'Mät runt det bredaste stället på din rumpa.', image: '/images/measurements/butt.png' },
      { name: 'Armar', field: 'arms', description: 'Mät runt det bredaste stället på din arm. Mät båda armarna.', image: '/images/measurements/arms.png' },
      { name: 'Lår', field: 'thighs', description: 'Mät på det bredaste stället på låret. Mät båda låren.', image: '/images/measurements/thighs.png' },
      { name: 'Vader', field: 'calves', description: 'Mät på det bredaste stället runt vaderna. Mät båda vaderna.', image: '/images/measurements/calfs.png' },
    ]

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(3)} />
            <ProgressBar current={4} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Omkrets mätningar</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Mät på samma ställe varje gång. Mät det bredaste området på respektive kroppsdel och spänn inte bandet allt för hårt.
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {measurements.map((measurement) => (
                <div key={measurement.field} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <img
                      src={measurement.image}
                      alt={measurement.name}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.3)]"
                    />
                    <div className="flex-1">
                      <Label htmlFor={measurement.field} className="text-[rgba(255,215,0,0.8)] font-semibold text-base">{measurement.name}</Label>
                      <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">{measurement.description}</p>
                    </div>
                  </div>
                  <div className="relative ml-[76px]">
                    <Input
                      id={measurement.field}
                      type="number"
                      step="0.1"
                      value={formData[measurement.field as keyof typeof formData] as string}
                      onChange={(e) => updateFormData(measurement.field, e.target.value)}
                      placeholder="Valfritt"
                      className="pr-12 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.6)]">
                      cm
                    </span>
                  </div>
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

  // Step 5: Formbilder
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(4)} />
            <ProgressBar current={5} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Uppdatera bilder</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Använd self-timer på en telefon för lättare ta bild.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Framsida */}
              <div>
                <Label className="text-[rgba(255,215,0,0.8)] mb-2 block">📸 Framsida</Label>

                {/* Exempel bilder */}
                <div className="flex gap-4 mb-3 justify-center">
                  <div className="text-center">
                    <img
                      src="/images/Formbild/k_framsida.png"
                      alt="Exempel kvinna framsida"
                      className="w-20 h-28 object-cover rounded border border-[rgba(255,215,0,0.3)]"
                    />
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Kvinna</p>
                  </div>
                  <div className="text-center">
                    <img
                      src="/images/Formbild/man_framsida.png"
                      alt="Exempel man framsida"
                      className="w-20 h-28 object-cover rounded border border-[rgba(255,215,0,0.3)]"
                    />
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Man</p>
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-6 text-center hover:border-[rgba(255,215,0,0.5)] transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileChange('front', file)
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {photoFiles.front ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(photoFiles.front)}
                        alt="Front"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-[rgba(255,255,255,0.8)]">{photoFiles.front.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileChange('front', null)
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Ta bort
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📷</div>
                      <p className="text-[rgba(255,255,255,0.6)]">Klicka för att ladda upp</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Baksida */}
              <div>
                <Label className="text-[rgba(255,215,0,0.8)] mb-2 block">📸 Baksida</Label>

                {/* Exempel bilder */}
                <div className="flex gap-4 mb-3 justify-center">
                  <div className="text-center">
                    <img
                      src="/images/Formbild/k_baksida.png"
                      alt="Exempel kvinna baksida"
                      className="w-20 h-28 object-cover rounded border border-[rgba(255,215,0,0.3)]"
                    />
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Kvinna</p>
                  </div>
                  <div className="text-center">
                    <img
                      src="/images/Formbild/man_baksida.png"
                      alt="Exempel man baksida"
                      className="w-20 h-28 object-cover rounded border border-[rgba(255,215,0,0.3)]"
                    />
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Man</p>
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-6 text-center hover:border-[rgba(255,215,0,0.5)] transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileChange('back', file)
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {photoFiles.back ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(photoFiles.back)}
                        alt="Back"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-[rgba(255,255,255,0.8)]">{photoFiles.back.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileChange('back', null)
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Ta bort
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📷</div>
                      <p className="text-[rgba(255,255,255,0.6)]">Klicka för att ladda upp</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sida */}
              <div>
                <Label className="text-[rgba(255,215,0,0.8)] mb-2 block">📸 Sida</Label>

                {/* Exempel bilder */}
                <div className="flex gap-4 mb-3 justify-center">
                  <div className="text-center">
                    <img
                      src="/images/Formbild/k_sida.png"
                      alt="Exempel kvinna sida"
                      className="w-20 h-28 object-cover rounded border border-[rgba(255,215,0,0.3)]"
                    />
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Kvinna</p>
                  </div>
                  <div className="text-center">
                    <img
                      src="/images/Formbild/man_sida.png"
                      alt="Exempel man sida"
                      className="w-20 h-28 object-cover rounded border border-[rgba(255,215,0,0.3)]"
                    />
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Man</p>
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-6 text-center hover:border-[rgba(255,215,0,0.5)] transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileChange('side', file)
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {photoFiles.side ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(photoFiles.side)}
                        alt="Side"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-[rgba(255,255,255,0.8)]">{photoFiles.side.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileChange('side', null)
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Ta bort
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📷</div>
                      <p className="text-[rgba(255,255,255,0.6)]">Klicka för att ladda upp</p>
                    </div>
                  )}
                </div>
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

  // Step 6: Training Adherence
  if (step === 6) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(5)} />
            <ProgressBar current={6} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Tränat alla pass?</h2>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => updateFormData('trainedAllSessions', true)}
                className={`flex-1 h-16 rounded-lg border-2 transition-all ${
                  formData.trainedAllSessions === true
                    ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]'
                    : 'border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <span className="text-lg text-white">Ja</span>
              </button>
              <button
                onClick={() => updateFormData('trainedAllSessions', false)}
                className={`flex-1 h-16 rounded-lg border-2 transition-all ${
                  formData.trainedAllSessions === false
                    ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]'
                    : 'border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <span className="text-lg text-white">Nej</span>
              </button>
            </div>

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

  // Step 7: Training Comments
  if (step === 7) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(6)} />
            <ProgressBar current={7} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Träning</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Hur gick träning denna vecka?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.trainingComments}
              onChange={(e) => updateFormData('trainingComments', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
              maxLength={500}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.trainingComments.length} / 500
            </div>

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

  // Step 8: Diet Adherence
  if (step === 8) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(7)} />
            <ProgressBar current={8} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Avsteg i kosten?</h2>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => updateFormData('hadDietDeviations', true)}
                className={`flex-1 h-16 rounded-lg border-2 transition-all ${
                  formData.hadDietDeviations === true
                    ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]'
                    : 'border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <span className="text-lg text-white">Ja</span>
              </button>
              <button
                onClick={() => updateFormData('hadDietDeviations', false)}
                className={`flex-1 h-16 rounded-lg border-2 transition-all ${
                  formData.hadDietDeviations === false
                    ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]'
                    : 'border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <span className="text-lg text-white">Nej</span>
              </button>
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

  // Step 9: Diet Comments
  if (step === 9) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(8)} />
            <ProgressBar current={9} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Kost</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Hur gick kosten denna vecka?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.dietComments}
              onChange={(e) => updateFormData('dietComments', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
              maxLength={500}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.dietComments.length} / 500
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

  // Step 10: Other Comments & Submit
  if (step === 10) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <Header onBack={() => setStep(9)} />
            <ProgressBar current={10} total={10} />

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-[#0a0a0a] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Övrigt</h2>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Har du någon övrig kommentar?
                </p>
              </div>
            </div>

            <Textarea
              value={formData.otherComments}
              onChange={(e) => updateFormData('otherComments', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
              maxLength={500}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            <div className="text-right text-sm text-[rgba(255,255,255,0.6)] mt-1">
              {formData.otherComments.length} / 500
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
