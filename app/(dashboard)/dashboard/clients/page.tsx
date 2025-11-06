'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Mail, User, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface Client {
  id: string
  name: string | null
  email: string
  status: string
  invitationSentAt: string | null
  createdAt: string
  inviteCode: string | null
  inviteCodeExpiresAt: string | null
}

interface NewClientForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  tags: string[]
  checkInPeriod: string
  checkInDay: string
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [newClient, setNewClient] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tags: [],
    checkInPeriod: 'Vecka',
    checkInDay: 'Måndag',
  })

  const availableTags = ['Nutrition Only', 'VIP', 'Workout Only']

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setNewClient(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleInviteClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.email) {
      toast.error('Vänligen fyll i förnamn, efternamn och e-post')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Inbjudan skickad till ${newClient.email}`)
        setIsDialogOpen(false)
        setNewClient({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          tags: [],
          checkInPeriod: 'Vecka',
          checkInDay: 'Måndag',
        })
        fetchClients()
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Failed to send invitation')
      console.error('Invite error:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const handleDeleteClient = async (clientId: string, clientEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${clientEmail}?`)) {
      return
    }

    setDeletingClientId(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Client deleted successfully')
        fetchClients()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete client')
      }
    } catch (error) {
      toast.error('Failed to delete client')
      console.error('Delete error:', error)
    } finally {
      setDeletingClientId(null)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
        <div className="container mx-auto p-6 space-y-8 max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[rgba(255,215,0,0.1)] rounded w-1/4"></div>
            <div className="h-64 bg-[rgba(255,215,0,0.1)] rounded"></div>
          </div>
        </div>
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
            Klienter
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Hantera och bjud in dina klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 mr-2" />
                Lägg till klient
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#FFD700]">Lägg till ny klient</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Klientinformation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#FFD700]">Klientinformation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[rgba(255,255,255,0.8)]">Förnamn <span className="text-red-400">*</span></Label>
                    <Input
                      id="firstName"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                      className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[rgba(255,255,255,0.8)]">Efternamn <span className="text-red-400">*</span></Label>
                    <Input
                      id="lastName"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                      className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[rgba(255,255,255,0.8)]">E-post <span className="text-red-400">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[rgba(255,255,255,0.8)]">Telefon</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="070 123 45 67"
                    className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[rgba(255,255,255,0.8)]">Taggar</Label>
                  <Select>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Välj taggar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map(tag => (
                        <div
                          key={tag}
                          className="px-2 py-1.5 cursor-pointer hover:bg-[rgba(255,215,0,0.1)] flex items-center gap-2"
                          onClick={() => toggleTag(tag)}
                        >
                          <input
                            type="checkbox"
                            checked={newClient.tags.includes(tag)}
                            readOnly
                          />
                          {tag}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {newClient.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newClient.tags.map(tag => (
                        <Badge key={tag} className="bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] text-[rgba(255,215,0,0.9)] gap-1">
                          {tag}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => toggleTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-[rgba(255,215,0,0.2)]" />

              {/* Check-in */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#FFD700]">Check-in</h3>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Skicka påminnelse om check-in varje gång:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[rgba(255,255,255,0.8)]">Check-in-period</Label>
                    <Select value={newClient.checkInPeriod} onValueChange={(value) => setNewClient({ ...newClient, checkInPeriod: value })}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dag">Dag</SelectItem>
                        <SelectItem value="Vecka">Vecka</SelectItem>
                        <SelectItem value="Månad">Månad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[rgba(255,255,255,0.8)]">Dag</Label>
                    <Select value={newClient.checkInDay} onValueChange={(value) => setNewClient({ ...newClient, checkInDay: value })}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Måndag">Måndag</SelectItem>
                        <SelectItem value="Tisdag">Tisdag</SelectItem>
                        <SelectItem value="Onsdag">Onsdag</SelectItem>
                        <SelectItem value="Torsdag">Torsdag</SelectItem>
                        <SelectItem value="Fredag">Fredag</SelectItem>
                        <SelectItem value="Lördag">Lördag</SelectItem>
                        <SelectItem value="Söndag">Söndag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)]">
                Avbryt
              </Button>
              <Button
                onClick={handleInviteClient}
                disabled={isInviting}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90"
              >
                {isInviting ? 'Skickar...' : 'Skicka inbjudan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
          <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">
              Alla klienter
            </h2>
            <p className="text-[rgba(255,255,255,0.6)] text-sm mt-1">
              {clients.length} {clients.length === 1 ? 'klient' : 'klienter'}
            </p>
          </div>
          <div className="p-6">
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-[rgba(255,255,255,0.9)]">Inga klienter än</h3>
                <p className="text-[rgba(255,255,255,0.6)] mb-4">
                  Börja med att bjuda in din första klient till programmet
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Bjud in klient
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border border-[rgba(255,215,0,0.2)] rounded-lg hover:bg-[rgba(255,215,0,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all"
                  >
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                        <span className="font-bold text-[#0a0a0a] text-lg">
                          {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[rgba(255,255,255,0.9)]">{client.name || 'Inget namn'}</p>
                        <p className="text-sm text-[rgba(255,255,255,0.6)] flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.id, client.email)}
                        disabled={deletingClientId === client.id}
                        className="text-[rgba(239,68,68,0.8)] hover:text-[rgb(239,68,68)] hover:bg-[rgba(239,68,68,0.1)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
