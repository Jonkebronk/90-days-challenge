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
import { Trash2, Search, FileText, Video, FileIcon } from 'lucide-react'
import { toast } from 'sonner'

type File = {
  id: string
  name: string
  description?: string | null
  fileUrl: string
  fileType?: string | null
  fileSize?: number | null
  uploadedBy?: string | null
  createdAt: string
  updatedAt: string
}

export default function FilesPage() {
  const { data: session } = useSession()
  const [files, setFiles] = useState<File[]>([])
  const [filteredFiles, setFilteredFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fileUrl: '',
    fileType: '',
  })

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'coach') {
      fetchFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    filterFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, searchQuery])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/files')
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      } else {
        toast.error('Kunde inte hämta filer')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const filterFiles = () => {
    let filtered = [...files]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          file.description?.toLowerCase().includes(query)
      )
    }

    setFilteredFiles(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Fil tillagd!')
        fetchFiles()
        setIsAddDialogOpen(false)
        setFormData({
          name: '',
          description: '',
          fileUrl: '',
          fileType: '',
        })
      } else {
        toast.error('Kunde inte lägga till fil')
      }
    } catch (error) {
      console.error('Error adding file:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna fil?')) return

    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Fil borttagen!')
        fetchFiles()
      } else {
        toast.error('Kunde inte ta bort fil')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const getFileIcon = (fileType?: string | null) => {
    if (!fileType) return <FileIcon className="h-5 w-5" />

    if (fileType.includes('video')) {
      return <Video className="h-5 w-5" />
    }
    return <FileText className="h-5 w-5" />
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
        <h1 className="text-3xl font-bold mb-2">Filer</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Visar {filteredFiles.length} fil{filteredFiles.length !== 1 ? 'er' : ''}
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
                    Lägg till fil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lägg till en fil</DialogTitle>
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
                      <Label htmlFor="description">Beskrivning</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Media</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium">Ladda upp fil</p>
                            <p className="text-sm text-muted-foreground">
                              Dra hit filer eller klicka för... <span className="text-green-600">Bläddra</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        * För tillfället: Klistra in fil-URL manuellt nedan
                      </p>
                      <Input
                        placeholder="Fil-URL"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        className="mt-2"
                        required
                      />
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex gap-4">
                        <div className="flex-1 border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                          <Video className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">Videoinspelning</p>
                          <p className="text-xs text-muted-foreground">
                            Klicka för att spela in en video
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false)
                          setFormData({
                            name: '',
                            description: '',
                            fileUrl: '',
                            fileType: '',
                          })
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Lägg till fil
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
          ) : filteredFiles.length === 0 ? (
            <p className="text-muted-foreground">Inga filer hittades.</p>
          ) : (
            <div className="space-y-4">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b font-semibold text-sm">
                <div className="col-span-4">Titel</div>
                <div className="col-span-3">Beskrivning</div>
                <div className="col-span-2">Typ</div>
                <div className="col-span-2">Skapad den</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table rows */}
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b items-center hover:bg-gray-50"
                >
                  <div className="col-span-4 flex items-center gap-2">
                    {getFileIcon(file.fileType)}
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <div className="col-span-3 text-muted-foreground text-sm">
                    {file.description || '-'}
                  </div>
                  <div className="col-span-2 text-muted-foreground text-sm">
                    {file.fileType || 'Fil'}
                  </div>
                  <div className="col-span-2 text-muted-foreground text-sm">
                    {new Date(file.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="col-span-1 flex gap-2 justify-end">
                    <button
                      onClick={() => handleDelete(file.id)}
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
