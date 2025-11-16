'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, Trash2, Search, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Lead = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  status: string
  notes?: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktad',
  in_dialog: 'I Dialog',
  paused: 'Pausad',
  won: 'Vunnen',
  lost: 'Förlorad',
}

const statusColors: Record<string, string> = {
  new: 'bg-[rgba(59,130,246,0.2)] text-[rgb(96,165,250)] border border-[rgba(59,130,246,0.3)]',
  contacted: 'bg-[rgba(168,85,247,0.2)] text-[rgb(192,132,252)] border border-[rgba(168,85,247,0.3)]',
  in_dialog: 'bg-[rgba(255,215,0,0.2)] text-[rgb(255,215,0)] border border-gold-primary/30',
  paused: 'bg-[rgba(156,163,175,0.2)] text-[rgb(209,213,219)] border border-[rgba(156,163,175,0.3)]',
  won: 'bg-[rgba(34,197,94,0.2)] text-[rgb(74,222,128)] border border-[rgba(34,197,94,0.3)]',
  lost: 'bg-[rgba(239,68,68,0.2)] text-[rgb(248,113,113)] border border-[rgba(239,68,68,0.3)]',
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user && (session.user as any).role?.toUpperCase() === 'COACH') {
      fetchLeads()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    filterLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, searchQuery])

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      } else {
        toast.error('Kunde inte hämta ansökningar')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = [...leads]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.includes(query)
      )
    }

    setFilteredLeads(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna ansökning?')) return

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Ansökning borttagen!')
        fetchLeads()
      } else {
        toast.error('Kunde inte ta bort ansökning')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleConvertToClient = async (lead: Lead) => {
    if (!confirm(`Konvertera ${lead.name} till klient?`)) return

    try {
      setConvertingLeadId(lead.id)
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${lead.name} konverterad till klient!`, {
          description: `Inbjudningskod: ${data.inviteCode}`,
          duration: 10000,
        })
        fetchLeads()
        // Navigate to clients page after a short delay
        setTimeout(() => {
          router.push('/dashboard/clients')
        }, 2000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Kunde inte konvertera till klient')
      }
    } catch (error) {
      console.error('Error converting to client:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setConvertingLeadId(null)
    }
  }

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Status uppdaterad!')
        fetchLeads()
        setViewingLead(null)
      } else {
        toast.error('Kunde inte uppdatera status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Ett fel uppstod')
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3">
            Ansökningar
          </h1>
          <p className="text-gray-400 text-sm tracking-[1px]">
            Inkomna ansökningar från potentiella klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>


      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px]">
        <div className="p-6 border-b border-gold-primary/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-100">
              Visar {filteredLeads.length} ansökning{filteredLeads.length !== 1 ? 'ar' : ''}
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,215,0,0.5)]" />
                <Input
                  placeholder="Sök..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Laddar...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Inga ansökningar hittades.</p>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gold-primary/20 font-semibold text-sm text-[rgba(255,215,0,0.8)]">
                <div className="col-span-3">Namn</div>
                <div className="col-span-3">Telefon</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Skapad den</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table rows */}
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b border-gold-primary/10 items-center hover:bg-[rgba(255,215,0,0.05)] transition-colors rounded-lg px-2"
                >
                  <div className="col-span-3 font-medium text-gray-100">{lead.name}</div>
                  <div className="col-span-3 text-gray-400">
                    {lead.phone || '-'}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[lead.status]
                      }`}
                    >
                      {statusLabels[lead.status]}
                    </span>
                  </div>
                  <div className="col-span-3 text-gray-400 text-sm">
                    {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="col-span-1 flex gap-2 justify-end">
                    <Dialog open={viewingLead?.id === lead.id} onOpenChange={(open) => !open && setViewingLead(null)}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-gold-50 rounded transition-colors text-[rgba(255,215,0,0.8)] hover:text-gold-light"
                          title="Visa ansökning"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-900 border-2 border-gold-primary/30">
                        <DialogHeader className="border-b border-gold-primary/20 pb-4">
                          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-gold-light to-orange-500 bg-clip-text text-transparent">
                            Ansökning - {lead.name}
                          </DialogTitle>
                          <p className="text-gray-500 text-sm mt-2">
                            Mottagen {new Date(lead.createdAt).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </DialogHeader>
                        <div className="space-y-4 py-6">
                          {/* Contact Info */}
                          <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                            <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                              📞 Kontaktinformation
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">Namn</p>
                                <p className="text-gray-100 font-medium">{lead.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">E-post</p>
                                <p className="text-gray-100">{lead.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">Telefon</p>
                                <p className="text-gray-100">{lead.phone || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">Status</p>
                                <Select
                                  value={lead.status}
                                  onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                                >
                                  <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(statusLabels).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Application Details - Formatted */}
                          {lead.notes && lead.notes.includes('===') && (
                            <>
                              {/* Personal Info */}
                              {lead.notes.match(/=== PERSONUPPGIFTER ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                                    👤 Personuppgifter
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {lead.notes.match(/Ålder: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Ålder:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Ålder: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Kön: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Kön:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Kön: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Stad: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Stad:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Stad: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Land: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Land:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Land: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Hittade oss via: (.*)/)?.[1] && (
                                      <div className="col-span-2">
                                        <span className="text-[rgba(255,215,0,0.7)]">Hittade oss via:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Hittade oss via: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Physical Stats */}
                              {lead.notes.match(/=== FYSISKA MÅTT ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                                    📏 Fysiska mått
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {lead.notes.match(/Längd: (.*?) cm/)?.[1] && (
                                      <div className="bg-black/30 p-3 rounded-lg border border-gold-primary/10">
                                        <p className="text-[rgba(255,215,0,0.7)] text-xs mb-1">Längd</p>
                                        <p className="text-gray-100 font-semibold text-lg">{lead.notes.match(/Längd: (.*?) cm/)?.[1]} cm</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Nuvarande vikt: (.*?) kg/)?.[1] && (
                                      <div className="bg-black/30 p-3 rounded-lg border border-gold-primary/10">
                                        <p className="text-[rgba(255,215,0,0.7)] text-xs mb-1">Nuvarande vikt</p>
                                        <p className="text-gray-100 font-semibold text-lg">{lead.notes.match(/Nuvarande vikt: (.*?) kg/)?.[1]} kg</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Training */}
                              {lead.notes.match(/=== TRÄNING ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                                    💪 Träning
                                  </h3>
                                  <div className="space-y-3 text-sm">
                                    {lead.notes.match(/Nuvarande träning: (.*)/)?.[1] && lead.notes.match(/Nuvarande träning: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Nuvarande träning</p>
                                        <p className="text-gray-100">{lead.notes.match(/Nuvarande träning: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Erfarenhet: (.*)/)?.[1] && lead.notes.match(/Erfarenhet: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Erfarenhet</p>
                                        <p className="text-gray-100">{lead.notes.match(/Erfarenhet: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Mål: (.*)/)?.[1] && lead.notes.match(/Mål: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Träningsmål</p>
                                        <p className="text-gray-100">{lead.notes.match(/Mål: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Skador\/Begränsningar: (.*)/)?.[1] && lead.notes.match(/Skador\/Begränsningar: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Skador/Begränsningar</p>
                                        <p className="text-gray-100">{lead.notes.match(/Skador\/Begränsningar: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Nutrition */}
                              {lead.notes.match(/=== NÄRING ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                                    🍎 Näring & Kost
                                  </h3>
                                  <div className="space-y-3 text-sm">
                                    {lead.notes.match(/Kost historik: (.*)/)?.[1] && lead.notes.match(/Kost historik: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Kost historik</p>
                                        <p className="text-gray-100">{lead.notes.match(/Kost historik: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Allergier: (.*)/)?.[1] && lead.notes.match(/Allergier: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Allergier</p>
                                        <p className="text-gray-100">{lead.notes.match(/Allergier: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Tidigare coaching: (.*)/)?.[1] && lead.notes.match(/Tidigare coaching: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Tidigare coaching</p>
                                        <p className="text-gray-100">{lead.notes.match(/Tidigare coaching: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Lifestyle */}
                              {lead.notes.match(/=== LIVSSTIL ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                                    🌟 Livsstil
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {lead.notes.match(/Stressnivå: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Stressnivå:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Stressnivå: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Sömn: (.*?) timmar/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Sömn:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Sömn: (.*?) timmar/)?.[1]} timmar</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Yrke: (.*)/)?.[1] && lead.notes.match(/Yrke: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div className="col-span-2">
                                        <span className="text-[rgba(255,215,0,0.7)]">Yrke:</span>
                                        <span className="text-gray-100 ml-2">{lead.notes.match(/Yrke: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Motivation */}
                              {lead.notes.match(/=== MOTIVATION ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-gold-light mb-4 flex items-center gap-2">
                                    🎯 Motivation & Mål
                                  </h3>
                                  <div className="space-y-4 text-sm">
                                    {lead.notes.match(/Varför ansöker du\?([\s\S]*?)(?=Åtagande:|===|$)/)?.[1]?.trim() && lead.notes.match(/Varför ansöker du\?([\s\S]*?)(?=Åtagande:|===|$)/)?.[1]?.trim() !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-2 font-medium">Varför ansöker du?</p>
                                        <p className="text-gray-100 bg-black/30 p-3 rounded-lg border border-gold-primary/10 whitespace-pre-wrap">
                                          {lead.notes.match(/Varför ansöker du\?([\s\S]*?)(?=Åtagande:|===|$)/)?.[1]?.trim()}
                                        </p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Åtagande:([\s\S]*?)(?=Förväntningar:|===|$)/)?.[1]?.trim() && lead.notes.match(/Åtagande:([\s\S]*?)(?=Förväntningar:|===|$)/)?.[1]?.trim() !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-2 font-medium">Åtagande</p>
                                        <p className="text-gray-100 bg-black/30 p-3 rounded-lg border border-gold-primary/10 whitespace-pre-wrap">
                                          {lead.notes.match(/Åtagande:([\s\S]*?)(?=Förväntningar:|===|$)/)?.[1]?.trim()}
                                        </p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Förväntningar:([\s\S]*?)(?=Utmaningar:|===|$)/)?.[1]?.trim() && lead.notes.match(/Förväntningar:([\s\S]*?)(?=Utmaningar:|===|$)/)?.[1]?.trim() !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-2 font-medium">Förväntningar</p>
                                        <p className="text-gray-100 bg-black/30 p-3 rounded-lg border border-gold-primary/10 whitespace-pre-wrap">
                                          {lead.notes.match(/Förväntningar:([\s\S]*?)(?=Utmaningar:|===|$)/)?.[1]?.trim()}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* Fallback for simple notes */}
                          {lead.notes && !lead.notes.includes('===') && (
                            <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-gold-light mb-4">Anteckningar</h3>
                              <div className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                                {lead.notes}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-gold-light mb-3">Taggar</h3>
                              <div className="flex flex-wrap gap-2">
                                {lead.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-[rgba(255,165,0,0.1)] border border-gold-primary/30 rounded-full text-sm text-gold-light font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end gap-3 pt-6 border-t border-gold-primary/20">
                            <Button
                              variant="outline"
                              onClick={() => setViewingLead(null)}
                              className="border-gold-primary/30 text-gray-100 hover:bg-gold-50 hover:border-[rgba(255,215,0,0.5)]"
                            >
                              Stäng
                            </Button>
                            <Button
                              onClick={() => {
                                handleConvertToClient(lead)
                                setViewingLead(null)
                              }}
                              disabled={lead.status === 'won'}
                              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[rgba(34,197,94,0.2)]"
                            >
                              {lead.status === 'won' ? 'Redan konverterad' : 'Konvertera till klient'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => handleConvertToClient(lead)}
                      disabled={convertingLeadId === lead.id || lead.status === 'won'}
                      className="p-2 hover:bg-[rgba(34,197,94,0.1)] rounded transition-colors text-[rgba(34,197,94,0.8)] hover:text-[rgb(34,197,94)] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Skapa klient"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors text-[rgba(239,68,68,0.8)] hover:text-[rgb(239,68,68)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
