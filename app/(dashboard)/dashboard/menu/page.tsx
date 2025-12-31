'use client'

import Link from 'next/link'
import {
  Calendar,
  TrendingUp,
  Utensils,
  Dumbbell,
  BookOpen,
  ChefHat,
  Apple,
  MessageSquare,
  HelpCircle,
  User,
  ArrowLeft
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard/check-in', label: 'Check-in', description: 'Veckocheckning', icon: Calendar, color: 'from-blue-500 to-blue-600' },
  { href: '/dashboard/progress', label: 'Framsteg', description: 'Din utveckling', icon: TrendingUp, color: 'from-pink-500 to-pink-600' },
  { href: '/dashboard/meal-plan', label: 'Kostschema', description: 'Måltidsplan', icon: Utensils, color: 'from-orange-400 to-orange-500' },
  { href: '/dashboard/workout', label: 'Träning', description: 'Träningsprogram', icon: Dumbbell, color: 'from-purple-400 to-purple-500' },
  { href: '/dashboard/articles/skill-tree', label: 'Kunskap', description: 'Kunskapskartan', icon: BookOpen, color: 'from-purple-500 to-purple-600' },
  { href: '/dashboard/recipes', label: 'Recept', description: 'Matinspiration', icon: ChefHat, color: 'from-orange-500 to-orange-600' },
  { href: '/dashboard/content/food-items', label: 'Livsmedel', description: 'Näringsinnehåll', icon: Apple, color: 'from-green-500 to-green-600' },
  { href: '/dashboard/messages', label: 'Meddelanden', description: 'Kontakta coach', icon: MessageSquare, color: 'from-blue-400 to-blue-500' },
  { href: '/dashboard/faqs', label: 'FAQ', description: 'Vanliga frågor', icon: HelpCircle, color: 'from-teal-500 to-teal-600' },
  { href: '/dashboard/profile', label: 'Profil', description: 'Dina inställningar', icon: User, color: 'from-gray-600 to-gray-700' },
]

export default function MenuPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Meny</h1>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">{item.label}</h3>
                <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">{item.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
