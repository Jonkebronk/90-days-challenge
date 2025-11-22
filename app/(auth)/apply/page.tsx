'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Camera } from 'lucide-react'

export default function ApplyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    training: false,
    nutrition: false,
    lifestyle: false,
    motivation: false,
  })

  const [formData, setFormData] = useState({
    // Service Selection
    serviceType: '90 Dagars Utmaningen',

    // Personal Information
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'Sverige',

    // Physical Stats
    age: '',
    gender: '',
    height: '',
    currentWeight: '',

    // Training
    currentTraining: '',
    trainingBackground: '',
    injuries: '',

    // Nutrition
    dietHistory: '',
    foodPreferences: '',
    allergies: '',
    previousCoaching: '',

    // Lifestyle
    lifestyle: '',

    // Motivation
    whyApply: '',
    challenges: ''
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Vänligen fyll i alla obligatoriska fält')
      return
    }

    setIsSubmitting(true)

    try {
      // Create detailed lead notes
      const leadNotes = `
INTRESSEANMÄLAN - ${formData.serviceType}

=== VALD TJÄNST ===
${formData.serviceType}

=== PERSONUPPGIFTER ===
Ålder: ${formData.age || 'Ej angivet'}
Kön: ${formData.gender || 'Ej angivet'}
Stad: ${formData.city || 'Ej angivet'}
Land: ${formData.country || 'Ej angivet'}

=== FYSISKA MÅTT ===
Längd: ${formData.height || 'Ej angivet'} cm
Nuvarande vikt: ${formData.currentWeight || 'Ej angivet'} kg

=== TRÄNING ===
Tränar du idag: ${formData.currentTraining || 'Ej angivet'}
Träningserfarenhet historiskt: ${formData.trainingBackground || 'Ej angivet'}
Skador/Begränsningar: ${formData.injuries || 'Ej angivet'}

=== KOSTBAKGRUND ===
Hur äter du idag: ${formData.dietHistory || 'Ej angivet'}
Matpreferenser: ${formData.foodPreferences || 'Ej angivet'}
Allergier: ${formData.allergies || 'Ej angivet'}

=== LIVSSTIL ===
Livsstil: ${formData.lifestyle || 'Ej angivet'}

=== MOTIVATION ===
Målsättningar:
${formData.whyApply || 'Ej angivet'}

Största utmaningar:
${formData.challenges || 'Ej angivet'}

Tidigare coaching:
${formData.previousCoaching || 'Ej angivet'}
      `.trim()

      // Send application to backend
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Service Selection
          serviceType: formData.serviceType,

          // Personal Information
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          country: formData.country,

          // Physical Stats
          age: formData.age,
          gender: formData.gender,
          height: formData.height,
          currentWeight: formData.currentWeight,

          // Training
          currentTraining: formData.currentTraining,
          trainingBackground: formData.trainingBackground,
          injuries: formData.injuries,

          // Nutrition
          dietHistory: formData.dietHistory,
          foodPreferences: formData.foodPreferences,
          allergies: formData.allergies,

          // Lifestyle
          lifestyle: formData.lifestyle,

          // Motivation
          whyJoin: formData.whyApply,
          biggestChallenges: formData.challenges,
          previousCoaching: formData.previousCoaching,

          // Complete application notes
          notes: leadNotes,
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSubmitted(true)
        toast.success('Intresseanmälan mottagen! Tack för din anmälan.')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Något gick fel vid bearbetning av intresseanmälan')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Något gick fel. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const SectionHeader = ({
    title,
    section,
    isExpanded
  }: {
    title: string
    section: keyof typeof expandedSections
    isExpanded: boolean
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
    >
      <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
        {title}
      </h2>
      {isExpanded ? (
        <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
      ) : (
        <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
      )}
    </button>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white/5 border-2 border-[rgba(34,197,94,0.3)] rounded-2xl p-12 backdrop-blur-[10px]">
            <div className="w-20 h-20 mx-auto mb-6 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-4 break-words">
              Tack för din intresseanmälan!
            </h1>

            <p className="text-gray-300 mb-8 leading-relaxed">
              Vi har tagit emot din intresseanmälan för 90 Dagars Utmaningen.<br />
              Vår coach kommer att granska din anmälan och höra av sig inom 1-2 vardagar.
            </p>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Du kommer få ett mejl till: <span className="text-gold-light">{formData.email}</span>
              </p>

              <Button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold tracking-[2px] uppercase hover:scale-105 transition-transform"
              >
                Tillbaka till Startsidan
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[rgba(255,215,0,0.7)] hover:text-gold-light transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm tracking-[1px]">Tillbaka</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-[2px] md:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 break-words">
            Intresseanmälan
          </h1>
          <div className="text-gray-400 text-sm tracking-[1px] max-w-3xl mx-auto leading-relaxed space-y-4">
            <p>Fyll i formuläret för att anmäla ditt intresse till 90 Dagars Utmaningen.</p>
            <p>Detta formulär är en viktig startpunkt för oss båda att se var du är idag och bestämma den bästa vägen framåt för dig.</p>
          </div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <SectionHeader title="Personuppgifter" section="personal" isExpanded={expandedSections.personal} />

            {expandedSections.personal && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-gray-200">Fullständigt namn *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white"
                    placeholder="För- och efternamn"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">E-post *</Label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="din@email.se"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Telefon *</Label>
                    <Input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="070-123 45 67"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Stad</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="Stockholm"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Land</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="Sverige"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Ålder</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Kön</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                        <SelectValue placeholder="Välj" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Man</SelectItem>
                        <SelectItem value="female">Kvinna</SelectItem>
                        <SelectItem value="other">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Längd (cm)</Label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Nuvarande vikt (kg)</Label>
                    <Input
                      type="number"
                      value={formData.currentWeight}
                      onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                      className="bg-black/30 border-gold-primary/30 text-white"
                      placeholder="80"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Motivation & Commitment */}
          <div className="space-y-4">
            <SectionHeader title="Målsättning" section="motivation" isExpanded={expandedSections.motivation} />

            {expandedSections.motivation && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-gray-200">Klientens målsättningar (Stora och små mål)</Label>
                  <Textarea
                    value={formData.whyApply}
                    onChange={(e) => setFormData({ ...formData, whyApply: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[120px]"
                    placeholder="Beskriv dina stora mål och små delmål..."
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Största utmaningar</Label>
                  <Textarea
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                    placeholder="Vad har hindrat dig från att nå dina mål tidigare?"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Tidigare coaching eller PT</Label>
                  <Textarea
                    value={formData.previousCoaching}
                    onChange={(e) => setFormData({ ...formData, previousCoaching: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[80px]"
                    placeholder="Har du haft personlig tränare eller coach tidigare? Vad funkade/funkade inte?"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Training */}
          <div className="space-y-4">
            <SectionHeader title="Träningsbakgrund" section="training" isExpanded={expandedSections.training} />

            {expandedSections.training && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-gray-200">Tränar du idag?</Label>
                  <Textarea
                    value={formData.currentTraining}
                    onChange={(e) => setFormData({ ...formData, currentTraining: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                    placeholder="Om du gör det, beskriv vad du gör, gärna så detaljerat som möjligt"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Träningserfarenhet historiskt</Label>
                  <Textarea
                    value={formData.trainingBackground}
                    onChange={(e) => setFormData({ ...formData, trainingBackground: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                    placeholder="Vad har du för träningserfarenhet historiskt?"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Skador/Begränsningar</Label>
                  <Textarea
                    value={formData.injuries}
                    onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[80px]"
                    placeholder="Eventuella skador, smärtor eller andra begränsningar vi bör veta om"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Nutrition */}
          <div className="space-y-4">
            <SectionHeader title="Kostbakgrund" section="nutrition" isExpanded={expandedSections.nutrition} />

            {expandedSections.nutrition && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-gray-200">Hur äter du idag?</Label>
                  <Textarea
                    value={formData.dietHistory}
                    onChange={(e) => setFormData({ ...formData, dietHistory: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[120px]"
                    placeholder="Beskriv en vanlig dag i ditt liv i matväg, gärna så detaljerat som möjligt"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Matpreferenser</Label>
                  <Textarea
                    value={formData.foodPreferences}
                    onChange={(e) => setFormData({ ...formData, foodPreferences: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                    placeholder="Har du några särskilda matpreferenser? Till exempelvis mat som du gillar mer eller mindre?"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Allergier och intoleranser</Label>
                  <Input
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white"
                    placeholder="T.ex. gluten, laktos, nötter"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Lifestyle */}
          <div className="space-y-4">
            <SectionHeader title="Livsstil" section="lifestyle" isExpanded={expandedSections.lifestyle} />

            {expandedSections.lifestyle && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-gray-200">Ta mig igenom en dag, från när du vaknar till när du går och lägger dig. Hur ser den ut för dig?</Label>
                  <Textarea
                    value={formData.lifestyle}
                    onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                    className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                    placeholder="Beskriv din dag..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-12 py-6 text-lg tracking-[3px] uppercase font-bold bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Skickar...' : 'Skicka Intresseanmälan'}
            </Button>

            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-4">
              * Obligatoriska fält
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gold-primary/20 text-center">
          <p className="text-xs text-[rgba(255,215,0,0.6)] tracking-[1px]">
            Vi behandlar dina uppgifter konfidentiellt
          </p>
        </div>
      </div>
    </div>
  )
}
