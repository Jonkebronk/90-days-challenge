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
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

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
    agreement: false
  })

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'Sverige',
    instagram: '',
    hearAboutUs: '',

    // Physical Stats
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    goalWeight: '',
    morningHeartRate: '',
    bloodPressure: '',

    // Training
    currentTraining: '',
    trainingExperience: '',
    trainingGoals: '',
    injuries: '',
    availableTime: '',
    workoutSchedule: '',

    // Nutrition
    dietHistory: '',
    macroTracking: '',
    digestion: '',
    allergies: '',
    favoriteFoods: '',
    foodsDislikes: '',
    supplements: '',
    previousCoaching: '',

    // Lifestyle
    stressLevel: '',
    sleepHours: '',
    occupation: '',
    lifestyle: '',

    // Motivation
    whyApply: '',
    commitment: '',
    expectations: '',
    challenges: '',

    // Agreement
    termsAccepted: false,
    signature: ''
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

    if (!formData.termsAccepted) {
      toast.error('Du måste acceptera villkoren för att fortsätta')
      return
    }

    if (!formData.signature || formData.signature.trim().length < 2) {
      toast.error('Vänligen signera genom att skriva ditt namn')
      return
    }

    setIsSubmitting(true)

    try {
      // Create detailed lead notes
      const leadNotes = `
ANSÖKAN - 90-Dagars Challenge

=== PERSONUPPGIFTER ===
Ålder: ${formData.age || 'Ej angivet'}
Kön: ${formData.gender || 'Ej angivet'}
Stad: ${formData.city || 'Ej angivet'}
Land: ${formData.country || 'Ej angivet'}
Instagram: ${formData.instagram || 'Ej angivet'}
Hittade oss via: ${formData.hearAboutUs || 'Ej angivet'}

=== FYSISKA MÅTT ===
Längd: ${formData.height || 'Ej angivet'} cm
Nuvarande vikt: ${formData.currentWeight || 'Ej angivet'} kg
Målvikt: ${formData.goalWeight || 'Ej angivet'} kg
Morgonpuls: ${formData.morningHeartRate || 'Ej angivet'} bpm
Blodtryck: ${formData.bloodPressure || 'Ej angivet'}

=== TRÄNING ===
Nuvarande träning: ${formData.currentTraining || 'Ej angivet'}
Erfarenhet: ${formData.trainingExperience || 'Ej angivet'}
Mål: ${formData.trainingGoals || 'Ej angivet'}
Skador/Begränsningar: ${formData.injuries || 'Ej angivet'}
Tillgänglig tid: ${formData.availableTime || 'Ej angivet'}
Träningsschema: ${formData.workoutSchedule || 'Ej angivet'}

=== NÄRING ===
Kost historik: ${formData.dietHistory || 'Ej angivet'}
Makro tracking: ${formData.macroTracking || 'Ej angivet'}
Matsmältning: ${formData.digestion || 'Ej angivet'}
Allergier: ${formData.allergies || 'Ej angivet'}
Favoritmat: ${formData.favoriteFoods || 'Ej angivet'}
Mat ogillar: ${formData.foodsDislikes || 'Ej angivet'}
Kosttillskott: ${formData.supplements || 'Ej angivet'}
Tidigare coaching: ${formData.previousCoaching || 'Ej angivet'}

=== LIVSSTIL ===
Stressnivå: ${formData.stressLevel || 'Ej angivet'}
Sömn: ${formData.sleepHours || 'Ej angivet'} timmar
Yrke: ${formData.occupation || 'Ej angivet'}
Livsstil: ${formData.lifestyle || 'Ej angivet'}

=== MOTIVATION ===
Varför ansöker du?
${formData.whyApply || 'Ej angivet'}

Åtagande:
${formData.commitment || 'Ej angivet'}

Förväntningar:
${formData.expectations || 'Ej angivet'}

Utmaningar:
${formData.challenges || 'Ej angivet'}

=== AVTAL & SIGNATUR ===
Villkor accepterade: ${formData.termsAccepted ? 'Ja' : 'Nej'}
Signatur: ${formData.signature}
Datum: ${new Date().toLocaleDateString('sv-SE')}
      `.trim()

      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: 'new',
          notes: leadNotes,
          tags: ['90-dagars-challenge', 'web-ansokan']
        })
      })

      if (response.ok) {
        setSubmitted(true)
        toast.success('Ansökan mottagen!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Något gick fel')
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
      className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
    >
      <h2 className="text-xl font-bold text-[#FFD700] tracking-[2px] uppercase font-['Orbitron',sans-serif]">
        {title}
      </h2>
      {isExpanded ? (
        <ChevronUp className="w-6 h-6 text-[#FFD700] group-hover:scale-110 transition-transform" />
      ) : (
        <ChevronDown className="w-6 h-6 text-[#FFD700] group-hover:scale-110 transition-transform" />
      )}
    </button>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(34,197,94,0.3)] rounded-2xl p-12 backdrop-blur-[10px]">
            <div className="w-20 h-20 mx-auto mb-6 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-[#22c55e]" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-3xl font-black tracking-[3px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-4">
              Tack för din ansökan!
            </h1>

            <p className="text-[rgba(255,255,255,0.7)] mb-8 leading-relaxed">
              Vi har tagit emot din ansökan till 90-Dagars Challenge.<br />
              Vår coach kommer att granska din ansökan och höra av sig inom 1-2 vardagar.
            </p>

            <div className="space-y-4">
              <p className="text-sm text-[rgba(255,255,255,0.5)]">
                Du kommer få ett mejl till: <span className="text-[#FFD700]">{formData.email}</span>
              </p>

              <Button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold tracking-[2px] uppercase hover:scale-105 transition-transform"
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[rgba(255,215,0,0.7)] hover:text-[#FFD700] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm tracking-[1px]">Tillbaka</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Ansök till 90-Dagars Challenge
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Fyll i formuläret nedan så att vi kan skapa din perfekta plan
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <SectionHeader title="Personuppgifter" section="personal" isExpanded={expandedSections.personal} />

            {expandedSections.personal && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Fullständigt namn *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="För- och efternamn"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">E-post *</Label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="din@email.se"
                    />
                  </div>

                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Telefon *</Label>
                    <Input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="070-123 45 67"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Stad</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="Stockholm"
                    />
                  </div>

                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Land</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="Sverige"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Instagram</Label>
                  <Input
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="@dittanvändarnamn"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Hur hittade du oss?</Label>
                  <Input
                    value={formData.hearAboutUs}
                    onChange={(e) => setFormData({ ...formData, hearAboutUs: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="T.ex. Instagram, Google, rekommendation"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Ålder</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Kön</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
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

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Längd (cm)</Label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Nuvarande vikt (kg)</Label>
                    <Input
                      type="number"
                      value={formData.currentWeight}
                      onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="80"
                    />
                  </div>

                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Målvikt (kg)</Label>
                    <Input
                      type="number"
                      value={formData.goalWeight}
                      onChange={(e) => setFormData({ ...formData, goalWeight: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Morgonpuls (bpm)</Label>
                    <Input
                      type="number"
                      value={formData.morningHeartRate}
                      onChange={(e) => setFormData({ ...formData, morningHeartRate: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="60"
                    />
                  </div>

                  <div>
                    <Label className="text-[rgba(255,255,255,0.8)]">Blodtryck</Label>
                    <Input
                      value={formData.bloodPressure}
                      onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                      className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      placeholder="120/80"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Training Program */}
          <div className="space-y-4">
            <SectionHeader title="Träningsprogram" section="training" isExpanded={expandedSections.training} />

            {expandedSections.training && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Nuvarande träning</Label>
                  <Textarea
                    value={formData.currentTraining}
                    onChange={(e) => setFormData({ ...formData, currentTraining: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                    placeholder="Beskriv din nuvarande träningsrutin (t.ex. 'Gym 3x/vecka, fokus på styrketräning')"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Träningserfarenhet</Label>
                  <Select value={formData.trainingExperience} onValueChange={(value) => setFormData({ ...formData, trainingExperience: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Välj din erfarenhetsnivå" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Nybörjare (0-6 månader)</SelectItem>
                      <SelectItem value="intermediate">Medel (6 månader - 2 år)</SelectItem>
                      <SelectItem value="advanced">Avancerad (2+ år)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Träningsmål</Label>
                  <Textarea
                    value={formData.trainingGoals}
                    onChange={(e) => setFormData({ ...formData, trainingGoals: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                    placeholder="Vad vill du uppnå? (t.ex. bygga muskler, öka styrka, förbättra kondition)"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Skador eller begränsningar</Label>
                  <Textarea
                    value={formData.injuries}
                    onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                    placeholder="Eventuella skador, smärtor eller fysiska begränsningar vi bör veta om"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Tillgänglig tid för träning</Label>
                  <Select value={formData.availableTime} onValueChange={(value) => setFormData({ ...formData, availableTime: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Hur många dagar per vecka?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 dagar/vecka</SelectItem>
                      <SelectItem value="3-4">3-4 dagar/vecka</SelectItem>
                      <SelectItem value="5-6">5-6 dagar/vecka</SelectItem>
                      <SelectItem value="7">7 dagar/vecka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Föredraget träningsschema</Label>
                  <Input
                    value={formData.workoutSchedule}
                    onChange={(e) => setFormData({ ...formData, workoutSchedule: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="T.ex. 'Morgon 06:00' eller 'Kväll efter jobbet'"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Nutrition */}
          <div className="space-y-4">
            <SectionHeader title="Näring" section="nutrition" isExpanded={expandedSections.nutrition} />

            {expandedSections.nutrition && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Kost historik</Label>
                  <Textarea
                    value={formData.dietHistory}
                    onChange={(e) => setFormData({ ...formData, dietHistory: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                    placeholder="Beskriv dina tidigare erfarenheter av kostförändringar, dieter du provat, etc."
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Erfarenhet av makroräkning</Label>
                  <Select value={formData.macroTracking} onValueChange={(value) => setFormData({ ...formData, macroTracking: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Har du räknat makron tidigare?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Aldrig</SelectItem>
                      <SelectItem value="some">Lite erfarenhet</SelectItem>
                      <SelectItem value="experienced">Mycket erfarenhet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Matsmältning</Label>
                  <Textarea
                    value={formData.digestion}
                    onChange={(e) => setFormData({ ...formData, digestion: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                    placeholder="Eventuella problem med matsmältningen? (t.ex. IBS, laktosintolerans)"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Allergier och intoleranser</Label>
                  <Input
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="T.ex. gluten, laktos, nötter"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Favoritmat</Label>
                  <Input
                    value={formData.favoriteFoods}
                    onChange={(e) => setFormData({ ...formData, favoriteFoods: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="Mat du älskar och gärna äter"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Mat du inte gillar</Label>
                  <Input
                    value={formData.foodsDislikes}
                    onChange={(e) => setFormData({ ...formData, foodsDislikes: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="Mat vi bör undvika i din plan"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Kosttillskott</Label>
                  <Textarea
                    value={formData.supplements}
                    onChange={(e) => setFormData({ ...formData, supplements: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                    placeholder="Vilka kosttillskott tar du för närvarande?"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Tidigare coaching eller PT</Label>
                  <Textarea
                    value={formData.previousCoaching}
                    onChange={(e) => setFormData({ ...formData, previousCoaching: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                    placeholder="Har du haft personlig tränare eller coach tidigare? Vad funkade/funkade inte?"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lifestyle */}
          <div className="space-y-4">
            <SectionHeader title="Livsstil" section="lifestyle" isExpanded={expandedSections.lifestyle} />

            {expandedSections.lifestyle && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Stressnivå</Label>
                  <Select value={formData.stressLevel} onValueChange={(value) => setFormData({ ...formData, stressLevel: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Hur stressad känner du dig?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg stress</SelectItem>
                      <SelectItem value="medium">Måttlig stress</SelectItem>
                      <SelectItem value="high">Hög stress</SelectItem>
                      <SelectItem value="very-high">Mycket hög stress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Sömn per natt</Label>
                  <Select value={formData.sleepHours} onValueChange={(value) => setFormData({ ...formData, sleepHours: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Hur många timmar sover du?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5">Mindre än 5 timmar</SelectItem>
                      <SelectItem value="5-6">5-6 timmar</SelectItem>
                      <SelectItem value="6-7">6-7 timmar</SelectItem>
                      <SelectItem value="7-8">7-8 timmar</SelectItem>
                      <SelectItem value=">8">Mer än 8 timmar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Yrke</Label>
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="Vad arbetar du med?"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Livsstil</Label>
                  <Textarea
                    value={formData.lifestyle}
                    onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                    placeholder="Beskriv din vardag, fritidsintressen, sociala liv, etc."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Motivation & Commitment */}
          <div className="space-y-4">
            <SectionHeader title="Motivation & Åtagande" section="motivation" isExpanded={expandedSections.motivation} />

            {expandedSections.motivation && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Varför vill du delta i 90-Dagars Challenge?</Label>
                  <Textarea
                    value={formData.whyApply}
                    onChange={(e) => setFormData({ ...formData, whyApply: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[120px]"
                    placeholder="Berätta om dina mål och vad som motiverar dig..."
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Kan du följa en strukturerad plan i 90 dagar?</Label>
                  <Select value={formData.commitment} onValueChange={(value) => setFormData({ ...formData, commitment: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Välj ditt svar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes-100">Ja, 100% committed</SelectItem>
                      <SelectItem value="yes-mostly">Ja, men behöver lite flexibilitet</SelectItem>
                      <SelectItem value="unsure">Osäker, vill veta mer först</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Vad förväntar du dig av programmet?</Label>
                  <Textarea
                    value={formData.expectations}
                    onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                    placeholder="Vad hoppas du uppnå efter 90 dagar?"
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Största utmaningar</Label>
                  <Textarea
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                    placeholder="Vad har hindrat dig från att nå dina mål tidigare?"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Customer Agreement */}
          <div className="space-y-4">
            <SectionHeader
              title="Kundavtal & Villkor"
              section="agreement"
              isExpanded={expandedSections.agreement}
            />
            {expandedSections.agreement && (
              <div className="space-y-6 bg-[rgba(0,0,0,0.2)] p-6 rounded-lg border border-[rgba(255,215,0,0.2)]">
                {/* Release of Liability */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">Ansvarsfriskrivning</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>
                      Detta är ett program för fysisk träning som inkluderar, men är inte begränsat till, styrketräning,
                      viktträning och olika konditionsövningar. Jag bekräftar härmed att jag är fullt fysiskt kapabel
                      och att jag inte lider av någon funktionsnedsättning eller sjukdom som skulle hindra mig från att
                      delta i detta program på ett säkert sätt.
                    </p>
                    <p>
                      Vid bekräftelse av mitt deltagande i detta program upphäver jag allt ansvar för Maximum Performance
                      Training för eventuella skador som kan uppstå som en följd av min deltagning i detta program eller
                      när jag använder konditionerings- och träningsutrustning. Jag bekräftar att jag, på eget ansvar,
                      deltar i alla konditionerings- och träningsaktiviteter och faciliteter, oavsett skada.
                    </p>
                    <p>
                      Jag avsäger härmed Maximum Performance Training, även dess anställda och ägare av allt ansvar,
                      inklusive men inte begränsat till medicinsk exponering, smärta och lidande som kan uppstå av någon
                      anledning under eller efter mitt deltagande i programmet eller från vår användning av
                      konditionerings- och träningsutrustning och faciliteter, oavsett fel, försumlighet eller ansvar.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* Payment & Cancellation */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">Betalning & Avbokning</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>
                      Jag förstår att om jag blir accepterad till programmet krävs full betalning för minimum 4 veckors
                      coaching i förskott för att säkra min plats. Efter detta kan jag välja att fortsätta genom
                      PayPal, banköverföring eller kontant, men betalning ska göras senast vid andra veckans avtalsdag,
                      eller avbrytas.
                    </p>
                    <p>
                      Jag förstår att den här kontraktet är omedelbart uppsägbart och inte kan återbetalas. Om min
                      coach rapporterar att jag saknar överenskommelse om vad som utgör regelbundet uppträdande i form
                      av, men inte begränsat till:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Ej svarar på mitt schema när jag ombeds</li>
                      <li>Ej skickar in mitt schema och mina kosttillskott regelbundet senast angivet datum</li>
                    </ul>
                    <p className="font-semibold text-[rgba(255,255,255,0.9)]">
                      Jag bekräftar att återbetalning inte kan ske av dessa skäl och jag är enligt avtal åtagande att
                      fullfölja denna 12-veckors avtalad period eller längre om avtalet förnyas.
                    </p>
                    <p>
                      Klient kan avsluta tjänsterna efter avtalad period när som helst så länge återbetalning inte söks
                      och ett varsel på 2 veckor lämnas. Fortsatt betalning efter uppsägningsdatumet kan inte
                      återbetalas.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* Accept Terms Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-[rgba(255,215,0,0.5)] bg-[rgba(0,0,0,0.3)] text-[#FFD700] focus:ring-[#FFD700] focus:ring-2 cursor-pointer"
                    required
                  />
                  <label htmlFor="termsAccepted" className="text-[rgba(255,255,255,0.9)] font-medium cursor-pointer select-none">
                    Ja, jag accepterar ovanstående villkor. *
                  </label>
                </div>

                {/* Signature Field */}
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)] mb-2 block">
                    Signatur (skriv ditt fullständiga namn) *
                  </Label>
                  <Input
                    type="text"
                    value={formData.signature}
                    onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white font-['Brush_Script_MT',cursive] text-2xl"
                    placeholder="Ditt fullständiga namn"
                    required
                  />
                  <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">
                    Genom att skriva ditt namn ovan bekräftar du att du har läst och accepterat alla villkor.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-12 py-6 text-lg tracking-[3px] uppercase font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Skickar...' : 'Skicka Ansökan'}
            </Button>

            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-4">
              * Obligatoriska fält
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[rgba(255,215,0,0.2)] text-center">
          <p className="text-xs text-[rgba(255,215,0,0.6)] tracking-[1px]">
            Vi behandlar dina uppgifter konfidentiellt
          </p>
        </div>
      </div>
    </div>
  )
}
