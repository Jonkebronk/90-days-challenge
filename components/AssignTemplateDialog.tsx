'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Search, Users, Check } from 'lucide-react'
import { toast } from 'sonner'

type Client = {
  id: string
  name: string | null
  email: string
}

type Assignment = {
  id: string
  userId: string
  active: boolean
  user: {
    id: string
    name: string | null
    email: string
  }
}

type AssignTemplateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
  existingAssignments?: Assignment[]
  onSuccess: () => void
}

export function AssignTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  existingAssignments = [],
  onSuccess,
}: AssignTemplateDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      fetchClients()
      // Pre-select already assigned clients
      const assignedIds = existingAssignments
        .filter((a) => a.active)
        .map((a) => a.userId)
      setSelectedClientIds(assignedIds)
    }
  }, [open, existingAssignments])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      } else {
        toast.error('Kunde inte hämta klienter')
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const name = client.name || client.email
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const toggleClient = (clientId: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    )
  }

  const handleAssign = async () => {
    if (selectedClientIds.length === 0) {
      toast.error('Välj minst en klient')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientIds: selectedClientIds }),
        }
      )

      if (response.ok) {
        toast.success(
          `Måltidsplan tilldelad till ${selectedClientIds.length} ${
            selectedClientIds.length === 1 ? 'klient' : 'klienter'
          }`
        )
        onSuccess()
        onOpenChange(false)
        setSearchTerm('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte tilldela måltidsplan')
      }
    } catch (error) {
      console.error('Error assigning template:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            Tilldela måltidsplan
          </DialogTitle>
          <DialogDescription className="text-[rgba(255,255,255,0.6)]">
            Välj klienter som ska få tillgång till &quot;{templateName}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div>
          <Label htmlFor="clientSearch" className="text-[rgba(255,255,255,0.8)]">
            Sök klient
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
            <Input
              id="clientSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sök efter namn eller email..."
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white pl-10"
            />
          </div>
        </div>

        {/* Selected Count */}
        {selectedClientIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
              {selectedClientIds.length}{' '}
              {selectedClientIds.length === 1 ? 'klient' : 'klienter'} vald
              {selectedClientIds.length === 1 ? '' : 'a'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedClientIds([])}
              className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
            >
              Rensa alla
            </Button>
          </div>
        )}

        {/* Client List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">
                {searchTerm ? 'Inga klienter hittades.' : 'Inga klienter ännu.'}
              </p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClientIds.includes(client.id)
              const wasAssigned = existingAssignments.some(
                (a) => a.userId === client.id && a.active
              )

              return (
                <div
                  key={client.id}
                  onClick={() => toggleClient(client.id)}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)]'
                      : 'bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.2)] hover:border-[rgba(255,215,0,0.3)]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#FFD700] border-[#FFD700]'
                          : 'border-[rgba(255,215,0,0.3)]'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-[#0a0a0a]" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {client.name || 'Inget namn'}
                      </p>
                      <p className="text-sm text-[rgba(255,255,255,0.6)]">
                        {client.email}
                      </p>
                    </div>
                  </div>
                  {wasAssigned && !isSelected && (
                    <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)] text-xs">
                      Tidigare tilldelad
                    </Badge>
                  )}
                  {wasAssigned && isSelected && (
                    <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] text-xs">
                      Redan tilldelad
                    </Badge>
                  )}
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSearchTerm('')
            }}
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isSaving || selectedClientIds.length === 0}
            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            {isSaving
              ? 'Tilldelar...'
              : `Tilldela till ${selectedClientIds.length} ${
                  selectedClientIds.length === 1 ? 'klient' : 'klienter'
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
