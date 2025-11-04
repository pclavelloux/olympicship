'use client'

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { User } from '@/types/user'
import ContributionGrid from './ContributionGrid'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ChevronDown } from 'lucide-react'
import { subDays, isAfter, isBefore, isEqual, parseISO, startOfDay } from 'date-fns'

interface LeaderboardTableProps {
  users: User[]
  currentUserGithubUsername?: string
}

type TimeFilter = 'all' | 'week' | 'month'

interface UserWithFilteredContributions extends User {
  filteredContributions: number
}

export default function LeaderboardTable({ users, currentUserGithubUsername }: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [showTimeFilter, setShowTimeFilter] = useState(false)
  const [visibleRows, setVisibleRows] = useState(20) // Limit initial render

  // Debounce search query to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      // Reset visible rows when search changes
      setVisibleRows(20)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset visible rows when time filter changes
  useEffect(() => {
    setVisibleRows(20)
  }, [timeFilter])

  // Helper function to extract domain from URL safely
  const getDomainFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return null
    }
  }

  // Calculate filtered contributions based on time filter
  const getFilteredContributions = (contributionsData?: Record<string, number>, filter: TimeFilter = 'all'): number => {
    if (!contributionsData) return 0
    
    if (filter === 'all') {
      return Object.values(contributionsData).reduce((sum, count) => sum + count, 0)
    }

    const today = startOfDay(new Date())
    const cutoffDate = startOfDay(filter === 'week' ? subDays(today, 7) : subDays(today, 30))
    
    return Object.entries(contributionsData).reduce((sum, [dateStr, count]) => {
      try {
        const date = startOfDay(parseISO(dateStr))
        // Include contributions from cutoffDate to today (inclusive)
        // date >= cutoffDate && date <= today
        if ((isAfter(date, cutoffDate) || isEqual(date, cutoffDate)) && (isBefore(date, today) || isEqual(date, today))) {
          return sum + count
        }
      } catch (error) {
        // Skip invalid dates
        console.warn('Invalid date format:', dateStr)
      }
      return sum
    }, 0)
  }

  // Memoize URL parsing helper to avoid recalculating on every render
  const parseUserUrls = useCallback((user: User) => {
    const allUrls: string[] = []
    if (user.other_urls && user.other_urls.length > 0) {
      allUrls.push(...user.other_urls)
    } else if (user.website_url) {
      try {
        const parsed = JSON.parse(user.website_url)
        if (Array.isArray(parsed) && parsed.length > 0) {
          allUrls.push(...parsed)
        } else {
          allUrls.push(user.website_url)
        }
      } catch {
        allUrls.push(user.website_url)
      }
    }
    return allUrls
  }, [])

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    // Filter by search query (using debounced value)
    let filtered = users
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.trim().toLowerCase()
      filtered = users.filter((u) => {
        const username = (u.display_username || u.github_username || '').toLowerCase()
        const githubUsername = (u.github_username || '').toLowerCase()
        return username.includes(query) || githubUsername.includes(query)
      })
    }

    // Calculate contributions for each user based on time filter
    const usersWithFilteredContributions: UserWithFilteredContributions[] = filtered.map((user) => ({
      ...user,
      filteredContributions: getFilteredContributions(user.contributions_data, timeFilter),
    }))

    // Sort by filtered contributions (descending)
    return usersWithFilteredContributions.sort((a, b) => b.filteredContributions - a.filteredContributions)
  }, [users, debouncedSearchQuery, timeFilter])

  const timeFilterLabels: Record<TimeFilter, string> = {
    all: 'All time',
    week: 'Last week',
    month: 'Last month',
  }

  // Memoized ContributionGrid to avoid re-renders
  const MemoizedContributionGrid = memo(ContributionGrid)

  return (
    <div className="overflow-x-auto" style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch' }}>
      {/* Search bar and time filter */}
      <div className="p-4 border-b border-gray-600/30 bg-gh-tertiary">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search GitHub username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md bg-[#0d1117] border border-gray-600 text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Time filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTimeFilter(!showTimeFilter)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-base-200 border border-base-300 text-base-content hover:bg-base-300 transition-colors"
            >
              <span>{timeFilterLabels[timeFilter]}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTimeFilter ? 'rotate-180' : ''}`} />
            </button>

            {showTimeFilter && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTimeFilter(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-base-200 border border-base-300 shadow-lg z-20">
                  {(['all', 'week', 'month'] as TimeFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setTimeFilter(filter)
                        setShowTimeFilter(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-base-300 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        timeFilter === filter ? 'bg-primary/20 text-primary' : 'text-base-content'
                      }`}
                    >
                      {timeFilterLabels[filter]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border border-gray-600/30 rounded-gh overflow-hidden bg-gh-tertiary">
        <table className="w-full border-collapse">
          <thead className="hidden lg:table-header-group">
            <tr className="  ">
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">Rank</th>
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">User</th>
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">Contributions</th>
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.slice(0, visibleRows).map((user, index) => {
              const filteredContributions = user.filteredContributions
              return (
                <tr
                  key={user.id}
                  className={`hover:bg-gh-tertiary/50 transition-colors ${user.github_username === currentUserGithubUsername
                    ? 'bg-success/10 ring-2 ring-success/50'
                    : ''
                    }`}
                >
                  {/* Rank */}
                  <td className="align-middle py-4 px-4">
                    <div className="flex items-center justify-center lg:justify-start">
                      {index < 3 ? (
                        <span className="text-xl lg:text-2xl font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-base lg:text-lg font-semibold text-base-content/60">
                          #{index + 1}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* User Info */}
                  <td className="align-middle py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 lg:w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                          <Image
                            src={user.avatar_url || '/default-avatar.png'}
                            alt={user.display_username || user.github_username}
                            width={48}
                            height={48}
                            className="rounded-full object-cover w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={(() => {
                              const allUrls = parseUserUrls(user)
                              return allUrls[0] || `https://github.com/${user.github_username}`
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-base-content hover:text-primary transition-colors truncate"
                          >
                            {user.display_username || user.github_username}
                          </Link>
                        </div>
                        <div className="text-sm text-base-content/60 font-medium">
                          <span className="text-gh-pink"> {filteredContributions.toLocaleString()} </span>
                          <span className="text-base-content/60">contributions</span>
                        </div>
                        {/* Display favicons for URLs */}
                        {(() => {
                          const allUrls = parseUserUrls(user)
                          return allUrls.length > 0
                        })() && (
                          <div className="flex items-center gap-2 mt-2">
                            {(() => {
                              const allUrls = parseUserUrls(user)
                              return allUrls.filter(url => url && url.trim()).map((url, idx) => {
                                const domain = getDomainFromUrl(url)
                                if (!domain) return null
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80 transition-opacity"
                                    title={url}
                                  >
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                      alt=""
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded object-contain"
                                      loading="lazy"
                                      style={{ imageRendering: 'crisp-edges' }}
                                    />
                                  </a>
                                )
                              })
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contribution Grid */}
                  <td className="align-middle py-4 px-4">
                    <MemoizedContributionGrid
                      contributionsData={user.contributions_data || {}}
                      username={user.github_username}
                      compact={true}
                    />
                  </td>

                  {/* Total Contributions */}
                  <td className="align-middle py-4 px-4">
                    <div className="flex items-center justify-end">
                      <div className="text-right">
                        <div className="text-xl lg:text-2xl font-bold text-success">
                          {filteredContributions.toLocaleString()}
                        </div>
                        <div className="text-xs text-base-content/60 hidden lg:block">
                          contributions
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredAndSortedUsers.length > visibleRows && (
          <div className="p-4 text-center border-t border-gray-600/30">
            <button
              onClick={() => setVisibleRows(prev => Math.min(prev + 20, filteredAndSortedUsers.length))}
              className="px-4 py-2 rounded-lg bg-base-200 border border-base-300 text-base-content hover:bg-base-300 transition-colors"
            >
              Load more ({filteredAndSortedUsers.length - visibleRows} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

