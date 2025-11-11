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
    photos: false,
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

    // Physical Stats
    age: '',
    gender: '',
    height: '',
    currentWeight: '',

    // Current Photos
    frontPhoto: null as File | null,
    backPhoto: null as File | null,
    sidePhoto: null as File | null,

    // Training
    currentTraining: '',
    trainingExperience: '',
    injuries: '',

    // Nutrition
    dietHistory: '',
    allergies: '',
    supplements: '',
    previousCoaching: '',

    // Lifestyle
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

=== FYSISKA MÅTT ===
Längd: ${formData.height || 'Ej angivet'} cm
Nuvarande vikt: ${formData.currentWeight || 'Ej angivet'} kg

=== AKTUELLA BILDER ===
Framsida: ${formData.frontPhoto ? formData.frontPhoto.name : 'Ej bifogad'}
Baksida: ${formData.backPhoto ? formData.backPhoto.name : 'Ej bifogad'}
Sida: ${formData.sidePhoto ? formData.sidePhoto.name : 'Ej bifogad'}

=== TRÄNING ===
Träningshistorik: ${formData.currentTraining || 'Ej angivet'}
Erfarenhet: ${formData.trainingExperience || 'Ej angivet'}
Skador/Begränsningar: ${formData.injuries || 'Ej angivet'}

=== NÄRING ===
Kost historik: ${formData.dietHistory || 'Ej angivet'}
Allergier: ${formData.allergies || 'Ej angivet'}
Kosttillskott: ${formData.supplements || 'Ej angivet'}
Tidigare coaching: ${formData.previousCoaching || 'Ej angivet'}

=== LIVSSTIL ===
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

      // Convert photos to base64 if uploaded
      const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
        })
      }

      let frontPhotoBase64 = undefined
      let sidePhotoBase64 = undefined
      let backPhotoBase64 = undefined

      if (formData.frontPhoto) {
        frontPhotoBase64 = await convertFileToBase64(formData.frontPhoto)
      }
      if (formData.sidePhoto) {
        sidePhotoBase64 = await convertFileToBase64(formData.sidePhoto)
      }
      if (formData.backPhoto) {
        backPhotoBase64 = await convertFileToBase64(formData.backPhoto)
      }

      // Send application to backend
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          trainingExperience: formData.trainingExperience,
          injuries: formData.injuries,

          // Nutrition
          dietHistory: formData.dietHistory,
          allergies: formData.allergies,
          supplements: formData.supplements,
          previousCoaching: formData.previousCoaching,

          // Lifestyle
          occupation: formData.occupation,
          lifestyle: formData.lifestyle,

          // Motivation
          whyJoin: formData.whyApply,
          canFollowPlan: formData.commitment,
          expectations: formData.expectations,
          biggestChallenges: formData.challenges,

          // Photos
          frontPhoto: frontPhotoBase64,
          sidePhoto: sidePhotoBase64,
          backPhoto: backPhotoBase64,
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSubmitted(true)
        toast.success('Ansökan mottagen! Tack för din ansökan.')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Något gick fel vid bearbetning av ansökan')
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
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px] max-w-3xl mx-auto leading-relaxed">
            Även om vårt program har en specifik, beprövad metodik och struktur, anpassas detaljerna helt efter dig — din kropp, din livsstil, dina förutsättningar. Detta formulär är en viktig startpunkt för oss båda att se var du är idag och bestämma den bästa vägen framåt för dig.
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

                <div className="grid md:grid-cols-2 gap-4">
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
                </div>
              </div>
            )}
          </div>

          {/* 2. Motivation & Commitment */}
          <div className="space-y-4">
            <SectionHeader title="Motivation & Åtagande" section="motivation" isExpanded={expandedSections.motivation} />

            {expandedSections.motivation && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Klientens målsättningar (Stora och små mål)</Label>
                  <Textarea
                    value={formData.whyApply}
                    onChange={(e) => setFormData({ ...formData, whyApply: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[120px]"
                    placeholder="Beskriv dina stora mål (t.ex. gå ner 10 kg) och små delmål (t.ex. träna 3 ggr/vecka)..."
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

          {/* 3. Training */}
          <div className="space-y-4">
            <SectionHeader title="Träningsprogram" section="training" isExpanded={expandedSections.training} />

            {expandedSections.training && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Träningshistorik och om du tränar nu?</Label>
                  <Textarea
                    value={formData.currentTraining}
                    onChange={(e) => setFormData({ ...formData, currentTraining: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                    placeholder="Berätta om din träningshistorik och om du tränar just nu..."
                  />
                </div>

                <div>
                  <Label className="text-[rgba(255,255,255,0.8)]">Träningserfarenhet</Label>
                  <Select value={formData.trainingExperience} onValueChange={(value) => setFormData({ ...formData, trainingExperience: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Välj din erfarenhetsnivå" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Nybörjare, mindre än ett år</SelectItem>
                      <SelectItem value="intermediate">Intermediate 1-3 års styrketräning</SelectItem>
                      <SelectItem value="advanced">Advanced 4+ år</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
            )}
          </div>

          {/* 4. Nutrition */}
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
                  <Label className="text-[rgba(255,255,255,0.8)]">Allergier och intoleranser</Label>
                  <Input
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                    placeholder="T.ex. gluten, laktos, nötter"
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

          {/* 5. Lifestyle */}
          <div className="space-y-4">
            <SectionHeader title="Livsstil" section="lifestyle" isExpanded={expandedSections.lifestyle} />

            {expandedSections.lifestyle && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] space-y-4">
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
                    placeholder="Ta mig igenom en dag, från när du vaknar till när du går och lägger dig. Hur ser den ut för dig?"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Current Photos */}
          <div className="space-y-4">
            <SectionHeader
              title="Aktuella Bilder"
              section="photos"
              isExpanded={expandedSections.photos}
            />
            {expandedSections.photos && (
              <div className="space-y-6 bg-[rgba(0,0,0,0.2)] p-6 rounded-lg border border-[rgba(255,215,0,0.2)]">
                {/* Warning Box */}
                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 font-bold text-lg flex-shrink-0">⚠</span>
                    <div className="text-yellow-200/90 text-sm">
                      <p className="font-semibold mb-2">Observera!</p>
                      <p className="leading-relaxed">
                        Startbilder för att mäta framsteg kommer att krävas vid något tillfälle under de första 4 veckorna,
                        sedan var 2:a vecka (de första 12 veckorna) följt av var 4:e vecka (efter 12 veckor).
                        Dessa hjälper oss att bedöma dina framsteg. De kommer att laddas upp till ditt klientuppföljningsark.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Example images showing proper positioning */}
                <div className="bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4 mb-4">
                  <p className="text-[rgba(255,255,255,0.7)] text-sm mb-3 text-center">
                    <strong className="text-[#FFD700]">Exempel på korrekt positionering:</strong>
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 mb-2 flex items-center justify-center h-20">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">🧍<br />Stå rakt framifrån</span>
                      </div>
                      <p className="text-xs text-[rgba(255,255,255,0.6)] font-medium">Framsida</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 mb-2 flex items-center justify-center h-20">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">🏃<br />Profil från sidan</span>
                      </div>
                      <p className="text-xs text-[rgba(255,255,255,0.6)] font-medium">Sida</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 mb-2 flex items-center justify-center h-20">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">🙋<br />Stå rakt bakifrån</span>
                      </div>
                      <p className="text-xs text-[rgba(255,255,255,0.6)] font-medium">Baksida</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Front Photo */}
                  <div className="space-y-3">
                    <Label className="text-[rgba(255,255,255,0.8)] text-center block">Framsida</Label>
                    <div className="border-2 border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-4 text-center hover:border-[rgba(255,215,0,0.5)] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFormData({ ...formData, frontPhoto: file })
                          }
                        }}
                        className="hidden"
                        id="frontPhoto"
                      />
                      <label htmlFor="frontPhoto" className="cursor-pointer">
                        {formData.frontPhoto ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(formData.frontPhoto)}
                              alt="Front"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <p className="text-xs text-[rgba(255,255,255,0.6)]">{formData.frontPhoto.name}</p>
                          </div>
                        ) : (
                          <div className="py-8">
                            <Camera className="w-12 h-12 mx-auto mb-3 text-[rgba(255,215,0,0.5)]" />
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">Klicka för att välja</p>
                            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">eller dra och släpp</p>
                          </div>
                        )}
                      </label>
                    </div>
                    {formData.frontPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, frontPhoto: null })}
                        className="w-full text-xs text-red-400 hover:text-red-300"
                      >
                        Ta bort
                      </button>
                    )}
                  </div>

                  {/* Back Photo */}
                  <div className="space-y-3">
                    <Label className="text-[rgba(255,255,255,0.8)] text-center block">Baksida</Label>
                    <div className="border-2 border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-4 text-center hover:border-[rgba(255,215,0,0.5)] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFormData({ ...formData, backPhoto: file })
                          }
                        }}
                        className="hidden"
                        id="backPhoto"
                      />
                      <label htmlFor="backPhoto" className="cursor-pointer">
                        {formData.backPhoto ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(formData.backPhoto)}
                              alt="Back"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <p className="text-xs text-[rgba(255,255,255,0.6)]">{formData.backPhoto.name}</p>
                          </div>
                        ) : (
                          <div className="py-8">
                            <Camera className="w-12 h-12 mx-auto mb-3 text-[rgba(255,215,0,0.5)]" />
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">Klicka för att välja</p>
                            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">eller dra och släpp</p>
                          </div>
                        )}
                      </label>
                    </div>
                    {formData.backPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, backPhoto: null })}
                        className="w-full text-xs text-red-400 hover:text-red-300"
                      >
                        Ta bort
                      </button>
                    )}
                  </div>

                  {/* Side Photo */}
                  <div className="space-y-3">
                    <Label className="text-[rgba(255,255,255,0.8)] text-center block">Sida</Label>
                    <div className="border-2 border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-4 text-center hover:border-[rgba(255,215,0,0.5)] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFormData({ ...formData, sidePhoto: file })
                          }
                        }}
                        className="hidden"
                        id="sidePhoto"
                      />
                      <label htmlFor="sidePhoto" className="cursor-pointer">
                        {formData.sidePhoto ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(formData.sidePhoto)}
                              alt="Side"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <p className="text-xs text-[rgba(255,255,255,0.6)]">{formData.sidePhoto.name}</p>
                          </div>
                        ) : (
                          <div className="py-8">
                            <Camera className="w-12 h-12 mx-auto mb-3 text-[rgba(255,215,0,0.5)]" />
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">Klicka för att välja</p>
                            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">eller dra och släpp</p>
                          </div>
                        )}
                      </label>
                    </div>
                    {formData.sidePhoto && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sidePhoto: null })}
                        className="w-full text-xs text-red-400 hover:text-red-300"
                      >
                        Ta bort
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 7. Customer Agreement */}
          <div className="space-y-4">
            <SectionHeader
              title="Kundavtal & Villkor"
              section="agreement"
              isExpanded={expandedSections.agreement}
            />
            {expandedSections.agreement && (
              <div className="space-y-6 bg-[rgba(0,0,0,0.2)] p-6 rounded-lg border border-[rgba(255,215,0,0.2)]">
                {/* Header */}
                <div className="text-center mb-4">
                  <h3 className="text-[#FFD700] font-bold text-xl mb-2">Allmänna villkor och avtal för Friskvårdskompassen</h3>
                  <p className="text-[rgba(255,255,255,0.5)] text-xs">Läs igenom villkoren noggrant innan du accepterar</p>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 1. Tjänstens omfattning och hälsodeklaration */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">1. Tjänstens omfattning och hälsodeklaration</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>
                      Friskvårdskompassen erbjuder onlinebaserad coachning inom fysisk träning, kost och hälsa.
                      Tjänsten kan inkludera, men är inte begränsad till, styrketräning, konditionsträning, kostråd och livsstilscoachning.
                    </p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Genom att acceptera dessa villkor bekräftar du att:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Du är fullt fysiskt kapabel att delta i programmet</li>
                      <li>Du inte lider av någon sjukdom, skada eller funktionsnedsättning som utgör hinder för säker träning</li>
                      <li>Du vid osäkerhet om din hälsa konsulterat läkare innan programmets start</li>
                      <li>Du informerat din coach om eventuella hälsotillstånd som kan påverka din träning</li>
                    </ul>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 2. Ansvar och säkerhet */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">2. Ansvar och säkerhet</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Eget ansvar:</p>
                    <p>
                      Du deltar i programmet och utför alla tränings- och kostaktiviteter på eget ansvar.
                      Du ansvarar själv för att utföra övningar korrekt och anpassa träningen efter din individuella förmåga.
                    </p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Ansvarsfriskrivning:</p>
                    <p>Friskvårdskompassen, inklusive dess ägare, coacher och samarbetspartners, ansvarar inte för:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Skador som uppstår under eller efter träning</li>
                      <li>Negativa hälsoeffekter till följd av programmet</li>
                      <li>Skador vid användning av träningsutrustning</li>
                      <li>Medicinska komplikationer relaterade till träning eller kosthållning</li>
                    </ul>
                    <p>Detta gäller oavsett orsak, inklusive eventuella fel, försummelser eller rådgivning från Friskvårdskompassen.</p>
                    <p className="font-semibold text-yellow-400 bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
                      ⚠ Viktigt: Vid minsta tveksamhet om din hälsa rekommenderar vi starkt att du konsulterar läkare innan du påbörjar programmet.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 3. Betalningsvillkor */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">3. Betalningsvillkor</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Förskottsbetalning:</p>
                    <p>Full betalning för minimum 4 veckors coachning krävs i förskott för att säkra din plats i programmet.</p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Fortsatt betalning:</p>
                    <p>Efter de första 4 veckorna kan betalning ske via:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Banköverföring</li>
                      <li>Swish</li>
                      <li>Annan överenskommen betalningsmetod</li>
                    </ul>
                    <p>Betalning ska erläggas senast samma veckodag som avtalets start, 2 veckor i förskott.</p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Försenad betalning:</p>
                    <p>Utebliven betalning inom överenskommen tid kan leda till att tjänsten pausas eller avslutas.</p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 4. Uppsägning och återbetalning */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">4. Uppsägning och återbetalning</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Bindningstid:</p>
                    <p>Avtalet löper på 4 veckor i taget från förskottsbetalningen. Du förbinder dig att fullfölja den betalade perioden.</p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Uppsägning från klient:</p>
                    <p>Du kan säga upp tjänsten när som helst genom att meddela din coach minst 2 veckor i förskott. Uppsägningen träder i kraft vid nästa betalningsperiods utgång.</p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Ingen återbetalning:</p>
                    <p className="font-semibold text-[rgba(255,255,255,0.9)]">
                      Betalning som redan erlagts återbetalas inte, oavsett orsak till uppsägning. Detta gäller även om du väljer att avbryta programmet i förtid.
                    </p>
                    <p className="font-medium text-[rgba(255,255,255,0.8)]">Uppsägning från Friskvårdskompassen:</p>
                    <p>Vi förbehåller oss rätten att omedelbart avsluta avtalet utan återbetalning om du:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Inte följer överenskommet träningsschema och rapportering</li>
                      <li>Inte svarar på meddelanden och uppföljning inom skälig tid</li>
                      <li>Inte lämnar in krävda uppgifter (träningslogg, kostdagbok etc.) senast överenskommet datum</li>
                      <li>Uppvisar ett beteende som är olämpligt eller respektlöst mot coacher</li>
                      <li>Bryter mot dessa villkor på annat sätt</li>
                    </ul>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 5. Klientens åtaganden */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">5. Klientens åtaganden</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>För att tjänsten ska fungera optimalt förbinder du dig att:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Kommunicera regelbundet med din coach</li>
                      <li>Följa överenskommet upplägg för träning och rapportering</li>
                      <li>Svara på meddelanden inom 48 timmar</li>
                      <li>Skicka in träningslogg och kostdagbok enligt överenskomna tider</li>
                      <li>Vara ärlig om din situation, framsteg och eventuella svårigheter</li>
                    </ul>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 6. Personuppgifter och sekretess */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">6. Personuppgifter och sekretess</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>
                      Friskvårdskompassen behandlar dina personuppgifter i enlighet med GDPR. Den information du delar med din coach
                      hanteras konfidentiellt och används endast för att leverera tjänsten. Läs vår integritetspolicy för mer information.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 7. Ändringar av villkor */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">7. Ändringar av villkor</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>
                      Friskvårdskompassen förbehåller sig rätten att ändra dessa villkor. Du kommer att informeras om
                      väsentliga ändringar via e-post eller i plattformen.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />

                {/* 8. Godkännande */}
                <div className="space-y-3">
                  <h3 className="text-[#FFD700] font-semibold text-lg">8. Godkännande</h3>
                  <div className="text-[rgba(255,255,255,0.7)] text-sm space-y-2 leading-relaxed">
                    <p>Genom att registrera dig och betala för tjänsten bekräftar du att du:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Läst och förstått dessa villkor</li>
                      <li>Accepterar villkoren i sin helhet</li>
                      <li>Är minst 18 år gammal (alternativt har vårdnadshavares godkännande)</li>
                    </ul>
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
