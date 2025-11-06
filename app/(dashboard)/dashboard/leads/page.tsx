'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  in_dialog: 'bg-[rgba(255,215,0,0.2)] text-[rgb(255,215,0)] border border-[rgba(255,215,0,0.3)]',
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    notes: '',
  })

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'coach') {
      fetchLeads()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    filterLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, searchQuery, statusFilter])

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

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create new lead
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Ansökning skapad!')
        fetchLeads()
        setIsAddDialogOpen(false)
      } else {
        toast.error('Kunde inte skapa ansökning')
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'new',
        notes: '',
      })
    } catch (error) {
      console.error('Error saving lead:', error)
      toast.error('Ett fel uppstod')
    }
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

  const getStatusCount = (status: string) => {
    return leads.filter((lead) => lead.status === status).length
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Ansökningar
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Inkomna ansökningar från potentiella klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Alla {leads.length > 0 && <span className="ml-1">({leads.length})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'new'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Ny {getStatusCount('new') > 0 && <span className="ml-1">({getStatusCount('new')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('contacted')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'contacted'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Kontaktad {getStatusCount('contacted') > 0 && <span className="ml-1">({getStatusCount('contacted')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('in_dialog')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'in_dialog'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            I Dialog {getStatusCount('in_dialog') > 0 && <span className="ml-1">({getStatusCount('in_dialog')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'paused'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Pausad {getStatusCount('paused') > 0 && <span className="ml-1">({getStatusCount('paused')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('won')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'won'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Vunnen {getStatusCount('won') > 0 && <span className="ml-1">({getStatusCount('won')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('lost')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'lost'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Förlorad {getStatusCount('lost') > 0 && <span className="ml-1">({getStatusCount('lost')})</span>}
          </button>
        </div>

      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
        <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">
              Visar {filteredLeads.length} ansökning{filteredLeads.length !== 1 ? 'ar' : ''}
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,215,0,0.5)]" />
                <Input
                  placeholder="Sök..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity">
                    Lägg till ansökning
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lägg till ansökning</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Namn *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-post</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="notes">Anteckningar</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false)
                          setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            status: 'new',
                            notes: '',
                          })
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90">
                        Lägg till
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-[rgba(255,255,255,0.5)] text-center py-8">Laddar...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="text-[rgba(255,255,255,0.5)] text-center py-8">Inga ansökningar hittades.</p>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b border-[rgba(255,215,0,0.2)] font-semibold text-sm text-[rgba(255,215,0,0.8)]">
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
                  className="grid grid-cols-12 gap-4 py-3 border-b border-[rgba(255,215,0,0.1)] items-center hover:bg-[rgba(255,215,0,0.05)] transition-colors rounded-lg px-2"
                >
                  <div className="col-span-3 font-medium text-[rgba(255,255,255,0.9)]">{lead.name}</div>
                  <div className="col-span-3 text-[rgba(255,255,255,0.6)]">
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
                  <div className="col-span-3 text-[rgba(255,255,255,0.6)] text-sm">
                    {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="col-span-1 flex gap-2 justify-end">
                    <Dialog open={viewingLead?.id === lead.id} onOpenChange={(open) => !open && setViewingLead(null)}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-[rgba(255,215,0,0.1)] rounded transition-colors text-[rgba(255,215,0,0.8)] hover:text-[#FFD700]"
                          title="Visa ansökning"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-[#FFD700]">Ansökning - {lead.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          {/* Contact Info */}
                          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-[#FFD700] mb-3">Kontaktinformation</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Namn</p>
                                <p className="text-[rgba(255,255,255,0.9)]">{lead.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">E-post</p>
                                <p className="text-[rgba(255,255,255,0.9)]">{lead.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Telefon</p>
                                <p className="text-[rgba(255,255,255,0.9)]">{lead.phone || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Skapad</p>
                                <p className="text-[rgba(255,255,255,0.9)]">
                                  {new Date(lead.createdAt).toLocaleDateString('sv-SE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-[#FFD700] mb-3">Status</h3>
                            <Select
                              value={lead.status}
                              onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                            >
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
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

                          {/* Application Details */}
                          {lead.notes && (
                            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4">
                              <h3 className="text-lg font-semibold text-[#FFD700] mb-3">Ansökningsdetaljer</h3>
                              <div className="text-[rgba(255,255,255,0.8)] whitespace-pre-wrap text-sm leading-relaxed">
                                {lead.notes}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4">
                              <h3 className="text-lg font-semibold text-[#FFD700] mb-3">Taggar</h3>
                              <div className="flex flex-wrap gap-2">
                                {lead.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded-full text-xs text-[rgba(255,215,0,0.9)]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(255,215,0,0.1)]">
                            <Button
                              variant="outline"
                              onClick={() => setViewingLead(null)}
                              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)]"
                            >
                              Stäng
                            </Button>
                            <Button
                              onClick={() => {
                                handleConvertToClient(lead)
                                setViewingLead(null)
                              }}
                              disabled={lead.status === 'won'}
                              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              Konvertera till klient
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
