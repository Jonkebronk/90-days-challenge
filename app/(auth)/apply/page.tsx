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
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ApplyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    currentWeight: '',
    goalWeight: '',
    height: '',
    activityLevel: '',
    whyApply: '',
    commitment: '',
    expectations: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Vänligen fyll i alla obligatoriska fält')
      return
    }

    setIsSubmitting(true)

    try {
      // Create lead with application data
      const leadNotes = `
ANSÖKAN - 90-Dagars Challenge

Ålder: ${formData.age || 'Ej angivet'}
Kön: ${formData.gender || 'Ej angivet'}
Nuvarande vikt: ${formData.currentWeight || 'Ej angivet'} kg
Målvikt: ${formData.goalWeight || 'Ej angivet'} kg
Längd: ${formData.height || 'Ej angivet'} cm
Aktivitetsnivå: ${formData.activityLevel || 'Ej angivet'}

VARFÖR VILL DU DELTA?
${formData.whyApply || 'Ej angivet'}

KAN DU FÖLJA PLANEN I 90 DAGAR?
${formData.commitment || 'Ej angivet'}

VAD FÖRVÄNTAR DU DIG?
${formData.expectations || 'Ej angivet'}
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
      <div className="container mx-auto p-6 max-w-3xl">
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
            Fyll i formuläret nedan så återkommer vi inom 1-2 vardagar
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
              Personuppgifter
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-[rgba(255,255,255,0.8)]">Namn *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  placeholder="Ditt fullständiga namn"
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
            </div>
          </div>

          {/* Health & Fitness Information */}
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
              Hälsa & Fitness
            </h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
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
              </div>

              <div>
                <Label className="text-[rgba(255,255,255,0.8)]">Aktivitetsnivå</Label>
                <Select value={formData.activityLevel} onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}>
                  <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                    <SelectValue placeholder="Välj din aktivitetsnivå" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Stillasittande (kontorsarbete, ingen träning)</SelectItem>
                    <SelectItem value="light">Lätt aktiv (lätt träning 1-3 dagar/vecka)</SelectItem>
                    <SelectItem value="moderate">Måttligt aktiv (måttlig träning 3-5 dagar/vecka)</SelectItem>
                    <SelectItem value="very">Mycket aktiv (hård träning 6-7 dagar/vecka)</SelectItem>
                    <SelectItem value="extreme">Extremt aktiv (hård träning 2x/dag)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Motivation & Commitment */}
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
              Motivation & Åtagande
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-[rgba(255,255,255,0.8)]">
                  Varför vill du delta i 90-Dagars Challenge?
                </Label>
                <Textarea
                  value={formData.whyApply}
                  onChange={(e) => setFormData({ ...formData, whyApply: e.target.value })}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                  placeholder="Berätta om dina mål och vad som motiverar dig..."
                />
              </div>

              <div>
                <Label className="text-[rgba(255,255,255,0.8)]">
                  Kan du följa en strukturerad plan i 90 dagar?
                </Label>
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
                <Label className="text-[rgba(255,255,255,0.8)]">
                  Vad förväntar du dig av programmet?
                </Label>
                <Textarea
                  value={formData.expectations}
                  onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                  placeholder="Berätta vad du hoppas uppnå..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
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
