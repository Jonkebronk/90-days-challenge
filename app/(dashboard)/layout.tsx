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
  Zap,
  Scale,
  FolderOpen,
  Library,
  Map,
  ChefHat
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Team', href: '/dashboard/clients', icon: Users, coachOnly: true },
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
    ]
  },
  { name: 'Kunskapsbanken', href: '/dashboard/articles', icon: Library },
  { name: 'Recept', href: '/dashboard/recipes', icon: ChefHat },
  {
    name: 'Verktyg',
    icon: Calculator,
    dropdown: [
      { name: 'Klientplan Workspace', href: '/dashboard/tools/workspace', icon: Zap },
      { name: 'Kaloriverktyg', href: '/dashboard/tools', icon: Calculator },
      { name: 'Måltidsfördelning', href: '/dashboard/tools/meal-distribution', icon: Utensils },
      { name: 'Stegkalkylator', href: '/dashboard/tools/steps', icon: Activity },
      { name: 'Viktspårning', href: '/dashboard/weight-tracker', icon: Scale },
    ]
  },
  { name: 'Check-in', href: '/dashboard/check-in', icon: Calendar },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
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

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const isCoach = (session?.user as any)?.role === 'coach'
  const isClient = (session?.user as any)?.role === 'client'

  const filteredNavigation = navigation.filter(item => {
    if ((item as any).coachOnly && !isCoach) return false
    if ((item as any).clientOnly && !isClient) return false
    return true
  })

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
