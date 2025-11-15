'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { getPhaseColors, type Phase } from '@/lib/utils/phase-colors'
import Link from 'next/link'
import { debounce } from 'lodash'

interface SearchResult {
  id: string
  title: string
  slug: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  phase: number | null
  difficulty: string | null
  estimatedReadingMinutes: number | null
  coverImage: string | null
  tags: string[]
  isRead: boolean
  score: number
  snippets: string[]
}

interface ArticleSearchProps {
  className?: string
  onSearch?: (results: SearchResult[]) => void
  showResults?: boolean // Show results inline
}

export function ArticleSearch({
  className,
  onSearch,
  showResults = true
}: ArticleSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('articleSearchHistory')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse search history', e)
      }
    }
  }, [])

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/articles/search?q=${encodeURIComponent(searchQuery)}&limit=5`
        )

        if (response.ok) {
          const data = await response.json()
          setResults(data.articles || [])
          if (onSearch) {
            onSearch(data.articles || [])
          }
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [onSearch]
  )

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value)
    setShowDropdown(true)

    if (value.trim()) {
      performSearch(value)
    } else {
      setResults([])
      setIsLoading(false)
    }
  }

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (query.trim()) {
      // Save to recent searches
      const updated = [
        query,
        ...recentSearches.filter(s => s !== query)
      ].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('articleSearchHistory', JSON.stringify(updated))

      // Navigate to search results page
      router.push(`/dashboard/articles?q=${encodeURIComponent(query)}`)
      setShowDropdown(false)
    }
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  // Select a recent search
  const selectRecentSearch = (search: string) => {
    setQuery(search)
    performSearch(search)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Sök artiklar..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="pl-10 pr-10 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
          />
          {(query || isLoading) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </form>

      {/* Search Dropdown */}
      {showDropdown && showResults && (query || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-[rgba(10,10,10,0.95)] backdrop-blur-sm border-[rgba(255,215,0,0.2)]">
          <CardContent className="p-4 space-y-3">
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.5)] uppercase">
                  <Clock className="h-3 w-3" />
                  Senaste sökningar
                </div>
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectRecentSearch(search)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[rgba(255,215,0,0.1)] text-sm text-white"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {query && results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,0.5)] uppercase">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Sökresultat
                  </div>
                  <span>{results.length} träffar</span>
                </div>
                {results.map((article) => {
                  const Icon = getCategoryIcon(article.categoryIcon, article.categoryName)
                  const phaseColors = getPhaseColors(article.phase as Phase)

                  return (
                    <Link
                      key={article.id}
                      href={`/dashboard/articles/${article.id}`}
                      onClick={() => setShowDropdown(false)}
                      className="block p-3 rounded-lg hover:bg-[rgba(255,215,0,0.1)] border border-transparent hover:border-[rgba(255,215,0,0.3)] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${phaseColors.bg}`}>
                          <Icon className={`h-5 w-5 ${phaseColors.text}`} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Title */}
                          <h4 className="font-semibold text-sm text-white line-clamp-1">
                            {article.title}
                          </h4>

                          {/* Snippet */}
                          {article.snippets[0] && (
                            <p className="text-xs text-[rgba(255,255,255,0.6)] line-clamp-2">
                              {article.snippets[0].replace(/\*\*/g, '')}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="text-xs bg-[rgba(255,215,0,0.2)] text-[#FFD700] border-[rgba(255,215,0,0.3)]">
                              {article.categoryName}
                            </Badge>
                            {article.phase && (
                              <Badge className={`text-xs ${phaseColors.badge}`}>
                                Fas {article.phase}
                              </Badge>
                            )}
                            {article.estimatedReadingMinutes && (
                              <span className="text-xs text-[rgba(255,255,255,0.5)]">
                                {article.estimatedReadingMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {/* Show all results link */}
                <Button
                  onClick={() => {
                    router.push(`/dashboard/articles?q=${encodeURIComponent(query)}`)
                    setShowDropdown(false)
                  }}
                  variant="ghost"
                  className="w-full text-[#FFD700] hover:text-[#FFA500] hover:bg-[rgba(255,215,0,0.1)]"
                  size="sm"
                >
                  Visa alla resultat
                </Button>
              </div>
            )}

            {/* No results */}
            {query && !isLoading && results.length === 0 && (
              <div className="text-center py-4 text-sm text-[rgba(255,255,255,0.5)]">
                Inga artiklar hittades för &quot;{query}&quot;
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
