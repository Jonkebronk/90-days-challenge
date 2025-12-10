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
  fullName?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
  age?: number | null
  gender?: string | null
  height?: number | null
  currentWeight?: number | null
  currentTraining?: string | null
  trainingBackground?: string | null
  injuries?: string | null
  dietHistory?: string | null
  foodPreferences?: string | null
  allergies?: string | null
  lifestyle?: string | null
  whyJoin?: string | null
  biggestChallenges?: string | null
  previousCoaching?: string | null
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
  new: 'bg-blue-100 text-blue-700 border border-blue-200',
  contacted: 'bg-purple-100 text-purple-700 border border-purple-200',
  in_dialog: 'bg-amber-100 text-amber-700 border border-amber-200',
  paused: 'bg-gray-100 text-gray-600 border border-gray-200',
  won: 'bg-green-100 text-green-700 border border-green-200',
  lost: 'bg-red-100 text-red-700 border border-red-200',
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
          lead.fullName?.toLowerCase().includes(query) ||
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
    if (!confirm(`Konvertera ${lead.fullName} till klient?`)) return

    try {
      setConvertingLeadId(lead.id)
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${lead.fullName} konverterad till klient!`)
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
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Intresseanmälningar
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
            Inkomna intresseanmälningar från potentiella klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>


      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Visar {filteredLeads.length} ansökning{filteredLeads.length !== 1 ? 'ar' : ''}
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
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
              <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 font-semibold text-sm text-gray-600">
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
                  className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 items-center hover:bg-amber-50/50 transition-colors rounded-lg px-2"
                >
                  <div className="col-span-3 font-medium text-gray-900">{lead.fullName}</div>
                  <div className="col-span-3 text-gray-500">
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
                  <div className="col-span-3 text-gray-500 text-sm">
                    {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="col-span-1 flex gap-2 justify-end">
                    <Dialog open={viewingLead?.id === lead.id} onOpenChange={(open) => !open && setViewingLead(null)}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-amber-100 rounded transition-colors text-amber-600 hover:text-amber-700"
                          title="Visa ansökning"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white border border-gray-200">
                        <DialogHeader className="border-b border-gray-200 pb-4">
                          <DialogTitle className="text-3xl font-bold text-gray-900">
                            Ansökning - {lead.fullName}
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
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                            <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
                              📞 Kontaktinformation
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Namn</p>
                                <p className="text-gray-900 font-medium">{lead.fullName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">E-post</p>
                                <p className="text-gray-900">{lead.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Telefon</p>
                                <p className="text-gray-900">{lead.phone || '-'}</p>
                              </div>
                              {lead.city && (
                                <div>
                                  <p className="text-sm text-gray-500 mb-1">Stad</p>
                                  <p className="text-gray-900">{lead.city}</p>
                                </div>
                              )}
                              {lead.country && (
                                <div>
                                  <p className="text-sm text-gray-500 mb-1">Land</p>
                                  <p className="text-gray-900">{lead.country}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Personal Info */}
                          {(lead.age || lead.gender || lead.height || lead.currentWeight) && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
                                👤 Personuppgifter
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                {lead.age && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Ålder</p>
                                    <p className="text-gray-900">{lead.age} år</p>
                                  </div>
                                )}
                                {lead.gender && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Kön</p>
                                    <p className="text-gray-900">{lead.gender}</p>
                                  </div>
                                )}
                                {lead.height && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Längd</p>
                                    <p className="text-gray-900">{lead.height} cm</p>
                                  </div>
                                )}
                                {lead.currentWeight && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Nuvarande vikt</p>
                                    <p className="text-gray-900">{lead.currentWeight} kg</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Målsättning */}
                          {(lead.whyJoin || lead.biggestChallenges || lead.previousCoaching) && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
                                🎯 Målsättning
                              </h3>
                              <div className="space-y-3">
                                {lead.whyJoin && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Klientens målsättningar (Stora och små mål)</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.whyJoin}</p>
                                  </div>
                                )}
                                {lead.biggestChallenges && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Största utmaningar</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.biggestChallenges}</p>
                                  </div>
                                )}
                                {lead.previousCoaching && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Tidigare coaching eller PT</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.previousCoaching}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Träningsbakgrund */}
                          {(lead.currentTraining || lead.trainingBackground || lead.injuries) && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
                                💪 Träningsbakgrund
                              </h3>
                              <div className="space-y-3">
                                {lead.currentTraining && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Tränar du idag?</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.currentTraining}</p>
                                  </div>
                                )}
                                {lead.trainingBackground && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Träningserfarenhet historiskt</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.trainingBackground}</p>
                                  </div>
                                )}
                                {lead.injuries && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Skador/Begränsningar</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.injuries}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Kostbakgrund */}
                          {(lead.dietHistory || lead.foodPreferences || lead.allergies) && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
                                🥗 Kostbakgrund
                              </h3>
                              <div className="space-y-3">
                                {lead.dietHistory && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Hur äter du idag?</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.dietHistory}</p>
                                  </div>
                                )}
                                {lead.foodPreferences && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Matpreferenser</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.foodPreferences}</p>
                                  </div>
                                )}
                                {lead.allergies && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Allergier och intoleranser</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.allergies}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Livsstil */}
                          {lead.lifestyle && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
                                🏡 Livsstil
                              </h3>
                              <p className="text-sm text-gray-500 mb-1">Ta mig igenom en dag, från när du vaknar till när du går och lägger dig. Hur ser den ut för dig?</p>
                              <p className="text-gray-900 whitespace-pre-wrap">{lead.lifestyle}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                            <Button
                              onClick={() => setViewingLead(null)}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
  )
}
