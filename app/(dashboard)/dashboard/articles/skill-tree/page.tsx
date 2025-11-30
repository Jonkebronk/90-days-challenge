'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Leaf,
  Dumbbell,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Brain,
  Zap,
  Target,
  Flame,
  Star,
  LucideIcon
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type Article = {
  id: string
  title: string
  slug: string
  categoryId: string
  estimatedReadingMinutes?: number
  progress?: {
    completed: boolean
  }
}

type ArticleCategory = {
  id: string
  name: string
  slug: string
  color?: string
  section?: string | null
  articles: Article[]
}

type ApiBranch = {
  id: string
  name: string
  icon: string
  color: string
  categorySlugs: string[]
  orderIndex: number
}

type BranchConfig = {
  id: string
  name: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  categories: string[]
}

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  Heart,
  Leaf,
  Dumbbell,
  BookOpen,
  Brain,
  Zap,
  Target,
  Flame,
  Star
}

// Default branches if API returns empty
const defaultBranches: BranchConfig[] = [
  {
    id: 'livsstil',
    name: 'Livsstil',
    icon: Heart,
    color: '#A855F7',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    categories: ['kropp-sinne', 'livsstil', 'framgangsrik-livsstilsforandring']
  },
  {
    id: 'kost',
    name: 'Kost',
    icon: Leaf,
    color: '#22C55E',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    categories: ['kost', 'din-guide-till-ratt-naring']
  },
  {
    id: 'traning',
    name: 'Träning',
    icon: Dumbbell,
    color: '#F97316',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    categories: ['traning', 'ovningar']
  }
]

// Helper to convert hex color to Tailwind-like classes
const getColorClasses = (hexColor: string): { bgColor: string; borderColor: string } => {
  // Generate opacity-based classes from hex color
  return {
    bgColor: '', // We'll use inline styles instead
    borderColor: ''
  }
}

export default function SkillTreePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [branches, setBranches] = useState<BranchConfig[]>(defaultBranches)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedBranches, setExpandedBranches] = useState<string[]>([])
  const [rootExpanded, setRootExpanded] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch both articles and branches in parallel
      const [articlesRes, branchesRes] = await Promise.all([
        fetch('/api/articles?audience=client&includeProgress=true'),
        fetch('/api/skill-tree-branches')
      ])

      if (articlesRes.ok) {
        const data = await articlesRes.json()
        // Group articles by category
        const categoriesMap = new Map<string, ArticleCategory>()

        data.articles.forEach((article: any) => {
          if (article.category) {
            const catId = article.category.id
            if (!categoriesMap.has(catId)) {
              categoriesMap.set(catId, {
                ...article.category,
                articles: []
              })
            }
            categoriesMap.get(catId)!.articles.push({
              id: article.id,
              title: article.title,
              slug: article.slug,
              categoryId: article.categoryId,
              estimatedReadingMinutes: article.estimatedReadingMinutes,
              progress: article.progress
            })
          }
        })

        setCategories(Array.from(categoriesMap.values()))
      } else {
        toast.error('Kunde inte hämta artiklar')
      }

      // Process branches from API
      if (branchesRes.ok) {
        const branchData = await branchesRes.json()
        if (branchData.branches && branchData.branches.length > 0) {
          const apiBranches: BranchConfig[] = branchData.branches.map((b: ApiBranch) => ({
            id: b.id,
            name: b.name,
            icon: iconMap[b.icon] || BookOpen,
            color: b.color,
            bgColor: '', // Using inline styles
            borderColor: '',
            categories: b.categorySlugs
          }))
          setBranches(apiBranches)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev =>
      prev.includes(branchId)
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    )
  }

  const getBranchArticles = (branch: BranchConfig) => {
    const branchCategories = categories.filter(cat =>
      branch.categories.includes(cat.slug)
    )
    return branchCategories.flatMap(cat => cat.articles)
  }

  const getBranchProgress = (branch: BranchConfig) => {
    const articles = getBranchArticles(branch)
    const completed = articles.filter(a => a.progress?.completed).length
    return { completed, total: articles.length }
  }

  const getTotalProgress = () => {
    let completed = 0
    let total = 0
    branches.forEach(branch => {
      const progress = getBranchProgress(branch)
      completed += progress.completed
      total += progress.total
    })
    return { completed, total }
  }

  if (!session?.user) {
    return null
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* Back button */}
      <Link
        href="/dashboard/articles"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gold-light transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Tillbaka till Kunskapsbanken</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Kunskapskartan
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Din resa till framgångsrik livsstilsförändring
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Root Node - Framgångsrik Livsstilsförändring */}
          <div className="relative">
            <button
              onClick={() => setRootExpanded(!rootExpanded)}
              className="w-full bg-gradient-to-br from-[#FFD700]/20 to-orange-500/20 border-2 border-[#FFD700]/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm hover:border-[#FFD700] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#FFD700] to-orange-500 flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#0a0a0a]" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-['Orbitron',sans-serif] text-lg sm:text-xl font-bold text-gold-light tracking-wide uppercase">
                      Framgångsrik Livsstilsförändring
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {totalProgress.completed} av {totalProgress.total} artiklar lästa
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress circle */}
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30">
                    <span className="text-gold-light text-sm font-bold">
                      {totalProgress.total > 0 ? Math.round((totalProgress.completed / totalProgress.total) * 100) : 0}%
                    </span>
                  </div>
                  {rootExpanded ? (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </div>
              </div>
            </button>

            {/* Connection line */}
            {rootExpanded && (
              <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[#FFD700]/50 to-transparent" />
            )}
          </div>

          {/* Branches */}
          {rootExpanded && (
            <div className="space-y-3 pt-4 lg:pt-8">
              {/* Desktop: Show branches in a row */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                {branches.map((branch) => {
                  const Icon = branch.icon
                  const progress = getBranchProgress(branch)
                  const articles = getBranchArticles(branch)
                  const isExpanded = expandedBranches.includes(branch.id)

                  return (
                    <div key={branch.id} className="space-y-3">
                      {/* Branch node */}
                      <button
                        onClick={() => toggleBranch(branch.id)}
                        className="w-full border-2 rounded-xl p-4 backdrop-blur-sm hover:scale-[1.02] transition-all group"
                        style={{
                          backgroundColor: `${branch.color}20`,
                          borderColor: `${branch.color}50`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: branch.color }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                                {branch.name}
                              </h3>
                              <p className="text-gray-400 text-xs">
                                {progress.completed} av {progress.total} lästa
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                              backgroundColor: branch.color
                            }}
                          />
                        </div>
                      </button>

                      {/* Articles list */}
                      {isExpanded && articles.length > 0 && (
                        <div className="space-y-2 pl-2">
                          {articles.map((article, idx) => (
                            <Link
                              key={article.id}
                              href={`/dashboard/articles/${article.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                              {article.progress?.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${article.progress?.completed ? 'text-gray-400' : 'text-white'}`}>
                                  {article.title}
                                </p>
                                {article.estimatedReadingMinutes && (
                                  <p className="text-xs text-gray-500">
                                    {article.estimatedReadingMinutes} min läsning
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Mobile/Tablet: Accordion style */}
              <div className="lg:hidden space-y-3">
                {branches.map((branch) => {
                  const Icon = branch.icon
                  const progress = getBranchProgress(branch)
                  const articles = getBranchArticles(branch)
                  const isExpanded = expandedBranches.includes(branch.id)

                  return (
                    <div key={branch.id} className="space-y-2">
                      {/* Branch node */}
                      <button
                        onClick={() => toggleBranch(branch.id)}
                        className="w-full border-2 rounded-xl p-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                        style={{
                          backgroundColor: `${branch.color}20`,
                          borderColor: `${branch.color}50`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: branch.color }}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-bold text-white uppercase tracking-wide">
                                {branch.name}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {progress.completed} av {progress.total} lästa
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-bold px-2 py-1 rounded"
                              style={{ color: branch.color }}
                            >
                              {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-6 h-6 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                              backgroundColor: branch.color
                            }}
                          />
                        </div>
                      </button>

                      {/* Articles list - Mobile */}
                      {isExpanded && articles.length > 0 && (
                        <div className="space-y-2 ml-4 border-l-2 pl-4" style={{ borderColor: `${branch.color}40` }}>
                          {articles.map((article) => (
                            <Link
                              key={article.id}
                              href={`/dashboard/articles/${article.id}`}
                              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 transition-all"
                            >
                              {article.progress?.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-6 h-6 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${article.progress?.completed ? 'text-gray-400' : 'text-white'}`}>
                                  {article.title}
                                </p>
                                {article.estimatedReadingMinutes && (
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {article.estimatedReadingMinutes} min läsning
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {isExpanded && articles.length === 0 && (
                        <div className="ml-4 border-l-2 pl-4 py-4" style={{ borderColor: `${branch.color}40` }}>
                          <p className="text-gray-500 text-sm">Inga artiklar i denna kategori ännu</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Prompt to expand if not expanded */}
          {!rootExpanded && (
            <p className="text-center text-gray-500 text-sm animate-pulse">
              Klicka ovan för att utforska de tre pelarna
            </p>
          )}
        </div>
      )}
    </div>
  )
}
