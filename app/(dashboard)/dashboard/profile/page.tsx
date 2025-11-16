'use client'

import { useSession } from 'next-auth/react'
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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          MIN PROFIL
        </h1>
        <p className="text-gray-600 mt-2">
          Hantera dina uppgifter och inställningar
        </p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* User Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl hover:border-gold-primary hover:shadow-lg transition-all">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Personlig Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gold-primary">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary disabled:bg-gray-50 disabled:opacity-60"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gold-primary">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary disabled:bg-gray-50 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
                >
                  Redigera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-semibold"
                  >
                    Spara
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: session?.user?.name || '',
                        email: session?.user?.email || '',
                      })
                    }}
                    className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-900"
                  >
                    Avbryt
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl hover:border-gold-primary hover:shadow-lg transition-all">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Kontoinformation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gold-primary text-sm">Roll</Label>
                <p className="text-lg font-medium text-gray-900 capitalize mt-1">
                  {(session?.user as any)?.role || 'Client'}
                </p>
              </div>
              <div>
                <Label className="text-gold-primary text-sm">Status</Label>
                <p className="text-lg font-medium mt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold">
                    Aktiv
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white border border-gray-200 rounded-xl hover:border-gold-primary hover:shadow-lg transition-all">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Säkerhet</h2>
          </div>
          <div className="p-6">
            <Button
              className="bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gold-primary text-gray-900"
            >
              Ändra Lösenord
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
