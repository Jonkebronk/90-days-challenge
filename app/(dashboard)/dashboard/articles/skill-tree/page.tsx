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

type BranchWithArticles = {
  id: string
  name: string
  icon: string
  color: string
  articles: {
    id: string
    title: string
    slug: string
    orderInBranch: number
    estimatedReadingMinutes?: number
    progress?: { completed: boolean }[]
  }[]
}

export default function SkillTreePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<BranchWithArticles[]>([])
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

      // Fetch branches with articles and progress
      const response = await fetch(`/api/skill-tree-branches?includeArticles=true&userId=${session?.user?.id}`)

      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      } else {
        toast.error('Kunde inte hämta data')
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

  const getBranchProgress = (branch: BranchWithArticles) => {
    const articles = branch.articles || []
    const completed = articles.filter(a => a.progress && a.progress.length > 0 && a.progress[0].completed).length
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

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || BookOpen
  }

  const isArticleCompleted = (article: BranchWithArticles['articles'][0]) => {
    return article.progress && article.progress.length > 0 && article.progress[0].completed
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
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">
                      Livsstil, Kost & Träning – de tre faktorerna för din framgång
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
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

          {/* Introduction Text */}
          {rootExpanded && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 text-gray-300 text-sm leading-relaxed">
              <h3 className="text-gold-light font-semibold text-base">Varför träning ensamt inte räcker</h3>
              <p>
                Det räcker inte att bara hoppa på den senaste trenddieten eller träningsprogrammet. Vi vet alla hur viktigt det är att variera sin träning, men om du bara fokuserar på det kämpar du en förlorande kamp.
              </p>
              <p>
                Om du söker långsiktig framgång är det avgörande att din approach inkluderar en förståelse för tre grundläggande principer:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gold-light/90">
                <li>Livsstilsfaktorer</li>
                <li>Kostfaktorer</li>
                <li>Träningsfaktorer</li>
              </ul>
              <p>
                Tillsammans kommer dessa faktorer att hjälpa dig nå dina hälso- och träningsmål, men de klarar det inte ensamma.
              </p>
              <h4 className="text-white font-medium pt-2">Varför?</h4>
              <p>
                Har du någonsin hört uttrycket &quot;Du kan inte bygga ett hus utan att först lägga grunden&quot;? Samma koncept gäller för din kropp.
              </p>
              <p>
                Om vi inte tar hand om vår livsstil och kost kommer all den hårda träningen inte att hjälpa oss nå våra mål. Varför? Därför att om vår kost inte stödjer målet vi strävar efter att nå kommer vi inte att lyckas nå det.
              </p>
              <p>
                Praktiskt innebär detta att om ditt mål är fettförlust och du tränar hårt på gymmet men inte äter i ett kaloriskt underskott (mer om detta kommer), kommer du inte att förlora fett.
              </p>
              <p>
                På samma sätt, om ditt mål är att bygga muskler men du inte får i dig tillräckligt med protein eller kalorier, kommer du inte att bygga muskler.
              </p>
              <p>
                Återigen, om du tränar hårt på gymmet men dina livsstilsfaktorer som stress och sömnhygien inte hanteras, kommer du att göra det svårare för dig själv i en fettförlustfas eller en muskelbyggnadsfas.
              </p>
              <p>
                Våra undermåliga livsstilsval kan leda till ständiga bakslag och viktuppgång.
              </p>
              <p>
                Det är ofta kopplat till en bristande förståelse för kost och höga stressnivåer från omvärlden. Det är därför detta program fokuserar starkt på de tre faktorerna: livsstil, kost och träning.
              </p>
            </div>
          )}

          {/* Branching Lines */}
          {rootExpanded && (
            <div className="relative hidden lg:flex justify-center">
              {/* Vertical line down */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-[#FFD700]/50 to-[#FFD700]/30" />
              {/* Horizontal line */}
              <div className="absolute top-4 left-[33%] right-[33%] h-0.5 bg-[#FFD700]/30" />
              {/* Three vertical lines down to branches */}
              <div className="absolute top-4 left-[33%] w-0.5 h-4 bg-gradient-to-b from-[#FFD700]/30 to-purple-500/50" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-[#FFD700]/30 to-green-500/50" />
              <div className="absolute top-4 right-[33%] w-0.5 h-4 bg-gradient-to-b from-[#FFD700]/30 to-orange-500/50" />
              {/* Spacer for the lines */}
              <div className="h-8" />
            </div>
          )}

          {/* Mobile: Simple line */}
          {rootExpanded && (
            <div className="lg:hidden flex justify-center">
              <div className="w-0.5 h-4 bg-gradient-to-b from-[#FFD700]/50 to-transparent" />
            </div>
          )}

          {/* Branches */}
          {rootExpanded && (
            <div className="space-y-3 -mt-1">
              {/* Desktop: Show branches in a row */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                {branches.map((branch) => {
                  const Icon = getIconComponent(branch.icon)
                  const progress = getBranchProgress(branch)
                  const articles = branch.articles || []
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
                          {articles.map((article) => (
                            <Link
                              key={article.id}
                              href={`/dashboard/articles/${article.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                              {isArticleCompleted(article) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${isArticleCompleted(article) ? 'text-gray-400' : 'text-white'}`}>
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
                  const Icon = getIconComponent(branch.icon)
                  const progress = getBranchProgress(branch)
                  const articles = branch.articles || []
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
                              {isArticleCompleted(article) ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-6 h-6 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${isArticleCompleted(article) ? 'text-gray-400' : 'text-white'}`}>
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
                          <p className="text-gray-500 text-sm">Inga artiklar i denna gren ännu</p>
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
              Klicka ovan för att utforska de tre faktorerna
            </p>
          )}
        </div>
      )}
    </div>
  )
}
