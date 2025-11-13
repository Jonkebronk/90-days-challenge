'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import {
  Home,
  TrendingUp,
  Calendar,
  User,
  Users,
  LogOut,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  FileText,
  GraduationCap,
  UserPlus,
  Calculator,
  Activity,
  Utensils,
  UtensilsCrossed,
  Zap,
  Scale,
  FolderOpen,
  Library,
  Map,
  ChefHat,
  ClipboardList,
  Bell,
  Dumbbell,
  MessageSquare,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Klienter', href: '/dashboard/clients', icon: Users, coachOnly: true },
  { name: 'Journal', href: '/dashboard/journal', icon: ClipboardList },
  { name: 'Ansökningar', href: '/dashboard/leads', icon: UserPlus, coachOnly: true },
  {
    name: 'Innehåll',
    icon: BookOpen,
    coachOnly: true,
    dropdown: [
      { name: 'Skapa Kategorier', href: '/dashboard/content/categories', icon: FolderOpen },
      { name: 'Skapa Artiklar', href: '/dashboard/content/articles', icon: Library },
      { name: 'Skapa Recept Kategorier', href: '/dashboard/content/recipe-categories', icon: FolderOpen },
      { name: 'Skapa Recept', href: '/dashboard/content/recipes', icon: ChefHat },
      { name: 'Måltidsplaner', href: '/dashboard/content/meal-plans', icon: UtensilsCrossed },
      { name: 'Guider', href: '/dashboard/content/guides', icon: BookOpen },
      { name: 'Vanliga frågor', href: '/dashboard/content/faqs', icon: HelpCircle },
      { name: 'Övningar', href: '/dashboard/content/exercises', icon: Activity },
      { name: 'Träningsprogram', href: '/dashboard/content/workout-programs', icon: Zap },
    ]
  },
  { name: 'Kunskapsbanken', href: '/dashboard/articles', icon: Library },
  { name: 'Recept', href: '/dashboard/recipes', icon: ChefHat },
  { name: 'Kostschema', href: '/dashboard/meal-plan', icon: Utensils, clientOnly: true },
  { name: 'Träningsprogram', href: '/dashboard/workout', icon: Dumbbell, clientOnly: true },
  {
    name: 'Verktyg',
    icon: Calculator,
    coachOnly: true,
    dropdown: [
      { name: 'Klientplan Workspace', href: '/dashboard/tools/workspace', icon: Zap },
      { name: 'Kaloriverktyg', href: '/dashboard/tools', icon: Calculator },
      { name: 'Kostschema Kalkylator', href: '/dashboard/nutrition-calculator', icon: Utensils },
      { name: 'Måltidsfördelning', href: '/dashboard/tools/meal-distribution', icon: Utensils },
      { name: 'Stegkalkylator', href: '/dashboard/tools/steps', icon: Activity },
      { name: 'Viktspårning', href: '/dashboard/weight-tracker', icon: Scale },
    ]
  },
  { name: 'Check-in', href: '/dashboard/check-in', icon: Calendar, clientOnly: true },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp, clientOnly: true },
  { name: 'Meddelanden', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'
  const isClient = (session?.user as any)?.role?.toUpperCase() === 'CLIENT'

  const filteredNavigation = navigation.filter(item => {
    if ((item as any).coachOnly && !isCoach) return false
    if ((item as any).clientOnly && !isClient) return false
    return true
  })

  // Fetch notifications for coaches
  const fetchNotifications = async () => {
    if (!isCoach) return

    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setNotificationCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)

    return () => clearInterval(interval)
  }, [isCoach])

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just nu'
    if (diffMins < 60) return `${diffMins}min sedan`
    if (diffHours < 24) return `${diffHours}h sedan`
    if (diffDays === 1) return 'Igår'
    if (diffDays < 7) return `${diffDays} dagar sedan`
    return date.toLocaleDateString('sv-SE')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-[rgba(255,215,0,0.2)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                // Check if item has dropdown
                if ('dropdown' in item && item.dropdown) {
                  const isDropdownActive = item.dropdown.some(
                    (dropdownItem) => pathname === dropdownItem.href
                  )

                  return (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                            ${isDropdownActive
                              ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-medium'
                              : 'hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {item.dropdown.map((dropdownItem) => {
                          const DropdownIcon = dropdownItem.icon
                          return (
                            <DropdownMenuItem key={dropdownItem.name} asChild>
                              <Link
                                href={dropdownItem.href}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <DropdownIcon className="w-4 h-4" />
                                <span>{dropdownItem.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href || '#'}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${isActive
                        ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-medium'
                        : 'hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Notifications Bell (Coach only) */}
              {isCoach && (
                <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
                    >
                      <Bell className="w-4 h-4" />
                      {notificationCount > 0 && (
                        <Badge
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] text-xs font-bold border-none"
                        >
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 max-h-[500px] overflow-y-auto bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)] backdrop-blur-lg"
                  >
                    <div className="px-3 py-2 border-b border-[rgba(255,215,0,0.2)]">
                      <h3 className="text-sm font-semibold text-[#FFD700]">
                        Notifikationer {notificationCount > 0 && `(${notificationCount})`}
                      </h3>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[rgba(255,255,255,0.4)] text-sm">
                        Inga nya notifikationer
                      </div>
                    ) : (
                      <div className="py-1">
                        {notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            asChild
                          >
                            <Link
                              href={notification.link}
                              className="flex flex-col gap-1 px-3 py-3 cursor-pointer hover:bg-[rgba(255,215,0,0.1)] focus:bg-[rgba(255,215,0,0.1)] border-b border-[rgba(255,215,0,0.1)] last:border-b-0"
                              onClick={() => setNotificationsOpen(false)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-white font-medium leading-tight">
                                  {notification.message}
                                </p>
                                <Badge
                                  className={`shrink-0 text-xs ${
                                    notification.type === 'NEW_LEAD'
                                      ? 'bg-[rgba(255,215,0,0.2)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]'
                                      : notification.type === 'NEW_PHOTOS'
                                      ? 'bg-[rgba(0,123,255,0.2)] text-[#007bff] border border-[rgba(0,123,255,0.3)]'
                                      : 'bg-[rgba(40,167,69,0.2)] text-[#28a745] border border-[rgba(40,167,69,0.3)]'
                                  }`}
                                >
                                  {notification.type === 'NEW_LEAD' && 'Ansökan'}
                                  {notification.type === 'NEW_CHECKIN' && 'Check-in'}
                                  {notification.type === 'NEW_PHOTOS' && 'Bilder'}
                                </Badge>
                              </div>
                              <p className="text-xs text-[rgba(255,255,255,0.5)]">
                                {formatNotificationTime(notification.timestamp)}
                              </p>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logga ut</span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[rgba(255,215,0,0.2)] bg-[rgba(10,10,10,0.95)]">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                // Check if item has dropdown
                if ('dropdown' in item && item.dropdown) {
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center gap-3 px-4 py-3 text-[rgba(255,255,255,0.6)] font-medium">
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      <div className="pl-8 space-y-1">
                        {item.dropdown.map((dropdownItem) => {
                          const DropdownIcon = dropdownItem.icon
                          const isDropdownActive = pathname === dropdownItem.href
                          return (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg transition-all
                                ${isDropdownActive
                                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-medium'
                                  : 'hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]'
                                }
                              `}
                            >
                              <DropdownIcon className="w-4 h-4" />
                              <span>{dropdownItem.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href || '#'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive
                        ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-medium'
                        : 'hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
