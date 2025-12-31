'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Utensils, MessageSquare, User, Menu } from 'lucide-react'
import Image from 'next/image'

const tabs = [
  { href: '/dashboard', label: 'HEM', icon: 'logo' as const },
  { href: '/dashboard/workout', label: 'TRÄNING', icon: Dumbbell },
  { href: '/dashboard/meal-plan', label: 'KOST', icon: Utensils },
  { href: '/dashboard/messages', label: 'MEDDELANDE', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'PROFIL', icon: User },
  { href: '/dashboard/menu', label: 'MENY', icon: Menu },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-shrink-0 bg-[#1a3a4a] border-t border-gray-700 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-20 pb-4 pt-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
            >
              {Icon === 'logo' ? (
                <Image
                  src="/images/compass-icon-black.svg"
                  alt="Hem"
                  width={24}
                  height={24}
                  className={isActive ? 'brightness-0 invert' : 'opacity-60'}
                />
              ) : (
                <Icon className="w-6 h-6" />
              )}
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
