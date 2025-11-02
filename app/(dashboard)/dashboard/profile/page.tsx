'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  })

  const handleSave = async () => {
    try {
      // TODO: Add API endpoint to update profile
      toast.success('Profil uppdaterad!')
      setIsEditing(false)
      // Update session
      await update()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Kunde inte uppdatera profil')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Profil</h1>

      <div className="space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personlig Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Redigera
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    Spara
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: session?.user?.name || '',
                        email: session?.user?.email || '',
                      })
                    }}
                  >
                    Avbryt
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Kontoinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Roll</Label>
                <p className="text-lg font-medium capitalize">
                  {(session?.user as any)?.role || 'client'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="text-lg font-medium">
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Aktiv
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>Säkerhet</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              Ändra Lösenord
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
