'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Utensils, MessageSquare, User, BookOpen } from 'lucide-react'
import Image from 'next/image'

const tabs = [
  { href: '/dashboard', label: 'HEM', icon: 'logo' as const },
  { href: '/dashboard/meal-plan', label: 'KOST', icon: Utensils },
  { href: '/dashboard/workout', label: 'TRÄNING', icon: Dumbbell },
  { href: '/dashboard/articles', label: 'UTBILDNING', icon: BookOpen },
  { href: '/dashboard/messages', label: 'CHATT', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'PROFIL', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-shrink-0 bg-[#1a3a4a] border-t border-gray-700 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6 h-16 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
            >
              {Icon === 'logo' ? (
                <Image
                  src="/images/compass-icon-black.svg"
                  alt="Hem"
                  width={22}
                  height={22}
                  className={isActive ? 'brightness-0 invert' : 'brightness-0 invert opacity-60'}
                />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[9px] mt-1 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
