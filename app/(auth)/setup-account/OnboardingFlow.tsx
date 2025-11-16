'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

interface OnboardingFlowProps {
  userId: string
  userName: string
}

export default function OnboardingFlow({ userId, userName }: OnboardingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    primaryGoal: '',
    heightCm: '',
    currentWeightKg: '',
    genderAtBirth: '',
    activityLevelFree: '',
    activityLevelWork: '',
    nutritionNotes: '',
    allergies: [] as string[],
    dietaryPreferences: [] as string[],
    excludedIngredients: '',
    nutritionMissing: '',
    trainingDays: [] as string[],
    trainingExperience: '',
    trainingDetails: '',
    lifestyleNotes: '',
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: 'allergies' | 'dietaryPreferences' | 'trainingDays', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      })

      if (response.ok) {
        toast.success('Onboarding klar!')
        router.push('/dashboard')
      } else {
        toast.error('Något gick fel')
      }
    } catch (error) {
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const ProgressBar = ({ section, currentStep, totalSteps }: { section: string; currentStep: number; totalSteps: number }) => (
    <div className="mb-6">
      <p className="text-center text-sm font-semibold mb-2">{section}</p>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <div className={`h-2 flex-1 rounded-full ${idx < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} />
            {idx < totalSteps - 1 && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-1 ${
                idx < currentStep ? 'bg-green-600' : 'bg-gray-300'
              }`}>
                {idx < currentStep && <span className="text-white text-xs">✓</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const Header = ({ onBack }: { onBack?: () => void }) => (
    <CardHeader className="relative">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="absolute left-4 top-4 p-2">
          ←
        </Button>
      )}
      <p className="text-center text-sm font-semibold pt-8">Kom igång</p>
    </CardHeader>
  )

  // Step 1: Welcome
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold">Välkommen {userName} 👋</CardTitle>
            <CardDescription className="text-base mt-4">
              Innan du startar ditt program, behövs ytterligare information från dig.
            </CardDescription>
            <CardDescription className="text-base mt-2">
              Det är jätteviktigt att du svarar ärligt på frågorna så att den bästa möjliga coachningen kan tillhandahållas för dig!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base"
            >
              Starta
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Goal
  if (step === 2) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <CardHeader className="text-center pb-4">
            <p className="text-sm font-semibold text-muted-foreground">Kom igång</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ditt mål</h2>
              <p className="text-muted-foreground">Vad är ditt främsta hälsomål?</p>
            </div>

            <RadioGroup value={formData.primaryGoal} onValueChange={(v) => updateFormData('primaryGoal', v)}>
              <div className="space-y-3">
                {[
                  { value: 'build_muscle', label: 'Bygga muskler' },
                  { value: 'get_fit', label: 'Komma i form' },
                  { value: 'healthy_habits', label: 'Bygga upp hälsosamma vanor' },
                ].map(goal => (
                  <div key={goal.value} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                    <RadioGroupItem value={goal.value} id={goal.value} />
                    <Label htmlFor={goal.value} className="cursor-pointer flex-1">{goal.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button
              onClick={() => formData.primaryGoal && setStep(3)}
              disabled={!formData.primaryGoal}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold h-12 disabled:opacity-50"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: Physical state
  if (step === 3) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(2)} />
          <CardContent className="space-y-6">
            <ProgressBar section="FYSIOLOGI" currentStep={1} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Fysiskt tillstånd</h2>
              <p className="text-sm text-muted-foreground">
                Denna information behövs för att beräkna din basala ämnesomsättning (BMR) så att vi kan fastställa ditt dagliga kaloribehov.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Längd</Label>
                <Input
                  id="heightCm"
                  value={formData.heightCm}
                  onChange={(e) => updateFormData('heightCm', e.target.value)}
                  placeholder="cm"
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentWeightKg">Vikt</Label>
                <Input
                  id="currentWeightKg"
                  value={formData.currentWeightKg}
                  onChange={(e) => updateFormData('currentWeightKg', e.target.value)}
                  placeholder="kg"
                  type="number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kön tilldelat vid födseln</Label>
              <select
                value={formData.genderAtBirth}
                onChange={(e) => updateFormData('genderAtBirth', e.target.value)}
                className="w-full border rounded-md p-2 bg-background"
              >
                <option value="">Välj</option>
                <option value="male">Man</option>
                <option value="female">Kvinna</option>
                <option value="other">Annat</option>
              </select>
            </div>

            <Button
              onClick={() => formData.heightCm && formData.currentWeightKg && formData.genderAtBirth && setStep(4)}
              disabled={!formData.heightCm || !formData.currentWeightKg || !formData.genderAtBirth}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold h-12 disabled:opacity-50"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 4: Activity level - Free time
  if (step === 4) {
    const options = [
      { value: 'very_low', label: 'Mycket låg', desc: 'Nästan ingen aktivitet alls' },
      { value: 'low', label: 'Låg', desc: 'T.ex. promenader, cykling eller trädgårdsarbete ungefär en gång i veckan' },
      { value: 'medium', label: 'Medel', desc: 'Regelbunden aktivitet minst en gång i veckan, t.ex. promenader, cykling, trädgårdsarbete eller promenad till jobbet 10-30 min per dag' },
      { value: 'active', label: 'Aktiv', desc: 'Regelbundna aktiviteter, t.ex. intensiv gång eller cykling eller sport' },
      { value: 'very_active', label: 'Mycket aktiv', desc: 'Ensidiga aktiviteter flera gånger i veckan' },
    ]

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(3)} />
          <CardContent className="space-y-6">
            <ProgressBar section="FYSIOLOGI" currentStep={2} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Aktivitetsnivå på fritiden</h2>
              <p className="text-sm text-muted-foreground">Beskriv din fysiska aktivitet på fritiden</p>
            </div>

            <div className="space-y-3">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateFormData('activityLevelFree', opt.value)}
                  className={`w-full text-left border rounded-lg p-4 ${
                    formData.activityLevelFree === opt.value ? 'border-green-600 bg-green-50' : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => formData.activityLevelFree && setStep(5)}
              disabled={!formData.activityLevelFree}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold h-12 disabled:opacity-50"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 5: Activity level - Work
  if (step === 5) {
    const options = [
      { value: 'very_low', label: 'Mycket låg', desc: 'T.ex. att sitta vid ett skrivbord större delen av dagen' },
      { value: 'low', label: 'Låg', desc: 'T.ex. lätt fysiskt arbete, försäljnings- eller kontorsarbete som omfattar lätta aktiviteter' },
      { value: 'medium', label: 'Medel', desc: 'T.ex. städning, arbete i kök eller postutdelning till fots eller med cykel' },
      { value: 'high', label: 'Hög', desc: 'T.ex. tungt fysiskt krävande industriarbete, t.ex. byggnadsarbete' },
    ]

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(4)} />
          <CardContent className="space-y-6">
            <ProgressBar section="FYSIOLOGI" currentStep={3} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Aktivitetsnivå på jobbet</h2>
              <p className="text-sm text-muted-foreground">Beskriv din fysiska aktivitet på arbetet (även vid arbete hemma och studier)</p>
            </div>

            <div className="space-y-3">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateFormData('activityLevelWork', opt.value)}
                  className={`w-full text-left border rounded-lg p-4 ${
                    formData.activityLevelWork === opt.value ? 'border-green-600 bg-green-50' : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => formData.activityLevelWork && setStep(6)}
              disabled={!formData.activityLevelWork}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold h-12 disabled:opacity-50"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 6: Nutrition intro
  if (step === 6) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(5)} />
          <CardContent className="space-y-6">
            <ProgressBar section="NÄRING" currentStep={1} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Nutrition</h2>
              <p className="text-base mb-2">Låt oss prata mat 🥗 🥙</p>
              <p className="text-sm text-muted-foreground">
                Vad älskar eller hatar du att äta? Finns det några allergier vi bör känna till? Hur ser dina matvanor ut?
              </p>
            </div>

            <Textarea
              value={formData.nutritionNotes}
              onChange={(e) => updateFormData('nutritionNotes', e.target.value)}
              placeholder="Lägg till dina tankar här..."
              rows={6}
            />

            <Button
              onClick={() => setStep(7)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 7: Allergies
  if (step === 7) {
    const allergies = [
      'Äggallergi', 'Citrusallergi', 'Fiskallergi', 'Glutenintolerans',
      'Jordnötsallergi', 'Laktosintolerans', 'Mjölkallergi', 'Selleriiallergi',
      'Senapsallergi', 'Sesamallergi', 'Skaldjursallergi', 'Sojaallergi',
      'Stenfrutsallergi', 'Sulfitallergi', 'Trädnötsallergi', 'Veteallergi',
    ]

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(6)} />
          <CardContent className="space-y-6">
            <ProgressBar section="NÄRING" currentStep={2} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Allergier</h2>
              <p className="text-sm text-muted-foreground">Har du några matallergier?</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {allergies.map(allergy => (
                <button
                  key={allergy}
                  onClick={() => toggleArrayItem('allergies', allergy)}
                  className={`px-4 py-2 rounded-full border ${
                    formData.allergies.includes(allergy)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {allergy}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(8)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 8: Dietary preferences
  if (step === 8) {
    const preferences = [
      { value: 'pescetarian', label: 'Pescetarian' },
      { value: 'vegan', label: 'Vegansk' },
      { value: 'vegetarian', label: 'Vegetarisk' },
      { value: 'halal', label: 'Halal' },
      { value: 'no_supplements', label: 'Inga kosttillskott', info: true },
      { value: 'kosher', label: 'Kosher' },
    ]

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(7)} />
          <CardContent className="space-y-6">
            <ProgressBar section="NÄRING" currentStep={2} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Kostpreferenser</h2>
              <p className="text-sm text-muted-foreground">Har du några specifika kostpreferenser?</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {preferences.map(pref => (
                <button
                  key={pref.value}
                  onClick={() => toggleArrayItem('dietaryPreferences', pref.value)}
                  className={`px-4 py-2 rounded-full border flex items-center gap-1 ${
                    formData.dietaryPreferences.includes(pref.value)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {pref.label}
                  {pref.info && <span className="text-xs">(i)</span>}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(9)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 9: Excluded ingredients
  if (step === 9) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(8)} />
          <CardContent className="space-y-6">
            <ProgressBar section="NÄRING" currentStep={3} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Exkluderade ingredienser</h2>
              <p className="text-sm text-muted-foreground">
                Finns det några ingredienser som du skulle vilja exkludera från ditt kostschema?
              </p>
            </div>

            <Input
              value={formData.excludedIngredients}
              onChange={(e) => updateFormData('excludedIngredients', e.target.value)}
              placeholder="Sök efter ingredienser"
            />

            <Button
              onClick={() => setStep(10)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 10: Missing nutrition info
  if (step === 10) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(9)} />
          <CardContent className="space-y-6">
            <ProgressBar section="NÄRING" currentStep={3} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Har vi missat något?</h2>
              <p className="text-sm text-muted-foreground">
                Finns det några aspekter av näring som du tycker att vi har missat? Dela gärna med dig av dem nedan.
              </p>
            </div>

            <Textarea
              value={formData.nutritionMissing}
              onChange={(e) => updateFormData('nutritionMissing', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
            />

            <Button
              onClick={() => setStep(11)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 11: Activity intro
  if (step === 11) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(10)} />
          <CardContent className="space-y-6">
            <ProgressBar section="AKTIVITET" currentStep={1} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Aktivitet</h2>
              <p className="text-sm text-muted-foreground">
                Följande frågor är utformade för att skapa ett individuellt övningsprogram som hjälper dig att maximera dina träningsresultat.
              </p>
            </div>

            <Button
              onClick={() => setStep(12)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 12: Training schedule
  if (step === 12) {
    const days = ['MÅN', 'TIS', 'ONS', 'TORS', 'FRE', 'LÖR', 'SÖN']

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(11)} />
          <CardContent className="space-y-6">
            <ProgressBar section="AKTIVITET" currentStep={2} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Träningsschema</h2>
              <p className="text-sm text-muted-foreground">På vilka dagar skulle du vilja träna?</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => toggleArrayItem('trainingDays', day)}
                  className={`px-6 py-3 rounded-full border font-semibold ${
                    formData.trainingDays.includes(day)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(13)}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 13: Training experience
  if (step === 13) {
    const levels = [
      { value: 'beginner', label: 'Nybörjare', desc: 'Ingen erfarenhet av t.ex. styrketräning, yoga, löpning' },
      { value: 'experienced', label: 'Erfaren', desc: 'Viss erfarenhet av t.ex. styrketräning, yoga, löpning' },
      { value: 'very_experienced', label: 'Mycket erfaren', desc: 'Mycket erfarenhet av t.ex. styrketräning, yoga, löpning.' },
    ]

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(12)} />
          <CardContent className="space-y-6">
            <ProgressBar section="AKTIVITET" currentStep={3} totalSteps={3} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Träningserfarenhet</h2>
              <p className="text-sm text-muted-foreground">Hur erfaren är du av styrketräning?</p>
            </div>

            <div className="space-y-3">
              {levels.map(level => (
                <button
                  key={level.value}
                  onClick={() => updateFormData('trainingExperience', level.value)}
                  className={`w-full text-left border rounded-lg p-4 ${
                    formData.trainingExperience === level.value ? 'border-green-600 bg-green-50' : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-semibold">{level.label}</div>
                  <div className="text-sm text-muted-foreground">{level.desc}</div>
                  {formData.trainingExperience === level.value && (
                    <Textarea
                      value={formData.trainingDetails}
                      onChange={(e) => {
                        e.stopPropagation()
                        updateFormData('trainingDetails', e.target.value)
                      }}
                      placeholder="Din träningupplevelse..."
                      className="mt-2"
                      rows={3}
                    />
                  )}
                </button>
              ))}
            </div>

            <Button
              onClick={() => formData.trainingExperience && setStep(14)}
              disabled={!formData.trainingExperience}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12 disabled:opacity-50"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 14: Lifestyle intro
  if (step === 14) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(13)} />
          <CardContent className="space-y-6">
            <ProgressBar section="LIVSSTIL" currentStep={1} totalSteps={2} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Livsstil & Hälsa</h2>
              <p className="text-sm text-muted-foreground">
                Innan vi avslutar vill jag att du funderar på om det finns några vanor som du skulle vilja arbeta med.
              </p>
            </div>

            <Button
              onClick={() => setStep(15)}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
            >
              Fortsätt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 15: Final notes
  if (step === 15) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-0 shadow-none">
          <Header onBack={() => setStep(14)} />
          <CardContent className="space-y-6">
            <ProgressBar section="LIVSSTIL" currentStep={2} totalSteps={2} />

            <div>
              <h2 className="text-2xl font-bold mb-2">Innan vi avslutar:</h2>
              <p className="text-sm text-muted-foreground">
                Finns det något annat som du tycker är viktigt för mig att veta innan vi sätter ihop dina personliga planer?
              </p>
            </div>

            <Textarea
              value={formData.lifestyleNotes}
              onChange={(e) => updateFormData('lifestyleNotes', e.target.value)}
              placeholder="Lägg till ditt svar"
              rows={6}
            />

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12"
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
