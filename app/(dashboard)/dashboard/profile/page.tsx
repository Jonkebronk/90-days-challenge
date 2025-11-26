'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, EyeOff } from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  })

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Profil uppdaterad!')
        setIsEditing(false)
        await update()
      } else {
        toast.error('Kunde inte uppdatera profil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Kunde inte uppdatera profil')
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Lösenorden matchar inte')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Lösenordet har ändrats!')
        setShowPasswordDialog(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ändra lösenord')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Profil
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Hantera dina uppgifter och inställningar
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* User Info Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Personlig Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary disabled:bg-gray-100 disabled:text-gray-500"
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
                    className="bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 text-gray-700"
                  >
                    Avbryt
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Kontoinformation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-600 text-sm">Roll</Label>
                <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                  {(session?.user as any)?.role === 'COACH' ? 'Coach' : 'Klient'}
                </p>
              </div>
              <div>
                <Label className="text-gray-600 text-sm">Status</Label>
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
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Säkerhet</h2>
          </div>
          <div className="p-6">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700 font-medium"
                >
                  Ändra Lösenord
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-2 border-gray-300">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Ändra Lösenord</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-gray-700 font-medium">Nuvarande lösenord</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="bg-white border-2 border-gray-300 text-gray-900 pr-10 focus:border-gold-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-gray-700 font-medium">Nytt lösenord</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="bg-white border-2 border-gray-300 text-gray-900 pr-10 focus:border-gold-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Bekräfta nytt lösenord</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-white border-2 border-gray-300 text-gray-900 focus:border-gold-primary"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
                    >
                      {isChangingPassword ? 'Sparar...' : 'Spara nytt lösenord'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordDialog(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }}
                      className="bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 text-gray-700"
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
