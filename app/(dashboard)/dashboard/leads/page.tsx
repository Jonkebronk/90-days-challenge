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
import { Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

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
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  in_dialog: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-gray-100 text-gray-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

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
        toast.error('Kunde inte hämta leads')
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
      if (editingLead) {
        // Update existing lead
        const response = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success('Lead uppdaterad!')
          fetchLeads()
          setEditingLead(null)
        } else {
          toast.error('Kunde inte uppdatera lead')
        }
      } else {
        // Create new lead
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success('Lead skapad!')
          fetchLeads()
          setIsAddDialogOpen(false)
        } else {
          toast.error('Kunde inte skapa lead')
        }
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
    if (!confirm('Är du säker på att du vill ta bort denna lead?')) return

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Lead borttagen!')
        fetchLeads()
      } else {
        toast.error('Kunde inte ta bort lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const startEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status,
      notes: lead.notes || '',
    })
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Leads</h1>

        {/* Status tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alla {leads.length > 0 && <span className="ml-1">{leads.length}</span>}
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'new'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ny {getStatusCount('new') > 0 && <span className="ml-1">{getStatusCount('new')}</span>}
          </button>
          <button
            onClick={() => setStatusFilter('contacted')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'contacted'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kontaktad
          </button>
          <button
            onClick={() => setStatusFilter('in_dialog')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'in_dialog'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            I Dialog
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'paused'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pausad
          </button>
          <button
            onClick={() => setStatusFilter('won')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'won'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vunnen {getStatusCount('won') > 0 && <span className="ml-1">{getStatusCount('won')}</span>}
          </button>
          <button
            onClick={() => setStatusFilter('lost')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              statusFilter === 'lost'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Förlorad
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Visar {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Lägg till lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lägg till lead</DialogTitle>
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
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Lägg till
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Laddar...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="text-muted-foreground">Inga leads hittades.</p>
          ) : (
            <div className="space-y-4">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b font-semibold text-sm">
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
                  className="grid grid-cols-12 gap-4 py-3 border-b items-center hover:bg-gray-50"
                >
                  <div className="col-span-3 font-medium">{lead.name}</div>
                  <div className="col-span-3 text-muted-foreground">
                    {lead.phone || '-'}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        statusColors[lead.status]
                      }`}
                    >
                      {statusLabels[lead.status]}
                    </span>
                  </div>
                  <div className="col-span-3 text-muted-foreground text-sm">
                    {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="col-span-1 flex gap-2 justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => startEdit(lead)}
                          className="p-2 hover:bg-gray-200 rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Redigera lead</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Namn *</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-email">E-post</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-phone">Telefon</Label>
                            <Input
                              id="edit-phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) =>
                                setFormData({ ...formData, status: value })
                              }
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
                            <Label htmlFor="edit-notes">Anteckningar</Label>
                            <Textarea
                              id="edit-notes"
                              value={formData.notes}
                              onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingLead(null)
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
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                              Spara
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
