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
import { Plus, Mail, CheckCircle2, Clock, User, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface Client {
  id: string
  name: string | null
  email: string
  status: string
  invitationSentAt: string | null
  createdAt: string
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage and invite your clients</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-lime-400 hover:bg-lime-500 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lägg till ny klient</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Klientinformation */}
              <div className="space-y-4">
                <h3 className="font-semibold">Klientinformation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Förnamn <span className="text-destructive">*</span></Label>
                    <Input
                      id="firstName"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Efternamn <span className="text-destructive">*</span></Label>
                    <Input
                      id="lastName"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-post <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="070 123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Taggar</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj taggar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map(tag => (
                        <div
                          key={tag}
                          className="px-2 py-1.5 cursor-pointer hover:bg-accent flex items-center gap-2"
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
                        <Badge key={tag} variant="secondary" className="gap-1">
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

              <Separator />

              {/* Check-in */}
              <div className="space-y-4">
                <h3 className="font-semibold">Check-in</h3>
                <p className="text-sm text-muted-foreground">Skicka påminnelse om check-in varje gång:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check-in-period</Label>
                    <Select value={newClient.checkInPeriod} onValueChange={(value) => setNewClient({ ...newClient, checkInPeriod: value })}>
                      <SelectTrigger>
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
                    <Label>Dag</Label>
                    <Select value={newClient.checkInDay} onValueChange={(value) => setNewClient({ ...newClient, checkInDay: value })}>
                      <SelectTrigger>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                onClick={handleInviteClient}
                disabled={isInviting}
                className="bg-lime-400 hover:bg-lime-500 text-black"
              >
                {isInviting ? 'Skickar...' : 'Skicka in'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by inviting your first client to the program
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-lime-400 hover:bg-lime-500 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Client
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{client.name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(client.status)}
                      {client.status === 'pending' && client.invitationSentAt && (
                        <p className="text-xs text-muted-foreground">
                          Invited {new Date(client.invitationSentAt).toLocaleDateString()}
                        </p>
                      )}
                      {client.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(client.id, client.email)}
                          disabled={deletingClientId === client.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
