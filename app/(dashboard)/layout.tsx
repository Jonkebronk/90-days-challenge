'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  HelpCircle,
  ShoppingCart,
  Apple
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
  { name: 'Intresseanmälningar', href: '/dashboard/leads', icon: UserPlus, coachOnly: true },
  {
    name: 'Innehåll',
    icon: BookOpen,
    coachOnly: true,
    dropdown: [
      { name: 'Skapa Kategorier', href: '/dashboard/content/categories', icon: FolderOpen },
      { name: 'Skapa Artiklar', href: '/dashboard/content/articles', icon: Library },
      { name: 'Skapa Recept Kategorier', href: '/dashboard/content/recipe-categories', icon: FolderOpen },
      { name: 'Skapa Recept', href: '/dashboard/content/recipes', icon: ChefHat },
      { name: 'Livsmedelbanken', href: '/dashboard/content/food-items', icon: Apple },
      { name: 'Näringstabeller', href: '/dashboard/content/nutrition-admin', icon: Calculator },
      { name: 'Inköpslistor', href: '/dashboard/content/shopping-lists', icon: ShoppingCart },
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
  { name: 'Inköpslistor', href: '/dashboard/shopping-lists', icon: ShoppingCart, clientOnly: true },
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center mr-6 group flex-shrink-0">
              <Image
                src="/images/compass-icon-black.svg"
                alt="Friskvårdskompassen"
                width={48}
                height={48}
                className="h-12 w-auto object-contain transition-all group-hover:scale-110 group-hover:rotate-12"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
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
                              ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-medium'
                              : 'hover:bg-gray-100 text-gray-700 hover:text-gold-primary'
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
                        ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-700 hover:text-gold-primary'
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
                      className="relative text-gray-700 hover:text-gold-primary hover:bg-gray-100"
                    >
                      <Bell className="w-4 h-4" />
                      {notificationCount > 0 && (
                        <Badge
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-br from-gold-primary to-gold-secondary text-white text-xs font-bold border-none"
                        >
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 max-h-[500px] overflow-y-auto bg-white border-gray-200 shadow-xl"
                  >
                    <div className="px-3 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gold-primary">
                        Notifikationer {notificationCount > 0 && `(${notificationCount})`}
                      </h3>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
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
                              className="flex flex-col gap-1 px-3 py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              onClick={() => setNotificationsOpen(false)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-gray-900 font-medium leading-tight">
                                  {notification.message}
                                </p>
                                <Badge
                                  className={`shrink-0 text-xs ${
                                    notification.type === 'NEW_LEAD'
                                      ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30'
                                      : notification.type === 'NEW_PHOTOS'
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                      : 'bg-green-100 text-green-700 border border-green-200'
                                  }`}
                                >
                                  {notification.type === 'NEW_LEAD' && 'Ansökan'}
                                  {notification.type === 'NEW_CHECKIN' && 'Check-in'}
                                  {notification.type === 'NEW_PHOTOS' && 'Bilder'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
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
                className="text-gray-700 hover:text-gold-primary hover:bg-gray-100"
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
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                // Check if item has dropdown
                if ('dropdown' in item && item.dropdown) {
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center gap-3 px-4 py-3 text-gray-700 font-medium">
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
                                  ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-medium'
                                  : 'hover:bg-gray-100 text-gray-700 hover:text-gold-primary'
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
                        ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-700 hover:text-gold-primary'
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
