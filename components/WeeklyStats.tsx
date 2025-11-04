'use client'

import { useEffect, useState } from 'react'
import { format, subDays, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import SponsorBanner from './SponsorBanner'

interface UserStats {
  github_username: string
  display_username?: string
  avatar_url?: string
  website_url?: string
  totalLast7Days: number
  contributionsByDay: Record<string, number>
}

interface StatsData {
  dates: string[]
  users: UserStats[]
}

export default function WeeklyStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  // État pour les dates de période
  const getDefaultDates = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const defaultStartDate = subDays(today, 7) // 7 jours avant aujourd'hui
    const defaultEndDate = subDays(today, 1) // Hier (excluant aujourd'hui)
    return {
      start: format(defaultStartDate, 'yyyy-MM-dd'),
      end: format(defaultEndDate, 'yyyy-MM-dd'),
    }
  }
  
  const defaultDates = getDefaultDates()
  const [startDate, setStartDate] = useState<string>(defaultDates.start)
  const [endDate, setEndDate] = useState<string>(defaultDates.end)

  useEffect(() => {
    fetchStats()
  }, [startDate, endDate])
  
  // Calculer automatiquement la date de fin (7 jours après la date de début)
  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate)
    const start = new Date(newStartDate)
    const end = addDays(start, 6) // 7 jours = 6 jours après
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const url = new URL('/api/stats', window.location.origin)
      url.searchParams.set('startDate', startDate)
      url.searchParams.set('endDate', endDate)
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Préparer les données pour le graphique personnalisé
  // Pour chaque jour, on calcule le top 3 de CE jour-là parmi TOUS les utilisateurs
  const dailyTop3Data = stats
    ? stats.dates.map((date) => {
        // Collecter TOUS les contributeurs de ce jour avec leurs contributions
        const dailyContributors: Array<{
          username: string
          avatar_url: string
          count: number
          user: UserStats
        }> = []
        
        stats.users.forEach((user) => {
          const username = user.display_username || user.github_username
          const contributions = user.contributionsByDay[date] || 0
          
          if (contributions > 0) {
            dailyContributors.push({
              username,
              avatar_url: user.avatar_url || '',
              count: contributions,
              user,
            })
          }
        })
        
        // Trier et prendre le top 3 pour ce jour (les 3 qui ont le plus contribué ce jour-là)
        const top3Contributors = dailyContributors
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
        
        return {
          date: format(new Date(date), 'EEE d MMM', { locale: fr }),
          dateKey: date,
          top3: top3Contributors,
          total: top3Contributors.reduce((sum, c) => sum + c.count, 0),
        }
      })
    : []
  
  // Calculer la valeur maximale pour l'échelle
  const maxValue = dailyTop3Data.length > 0
    ? Math.max(...dailyTop3Data.map(d => d.total))
    : 100
  
  // Calculer le top 10 des contributeurs sur toute la période (pour la liste de droite)
  const topContributorsForPeriod = stats
    ? stats.users
        .map((user) => {
          // Calculer le total de contributions pour la période
          const periodTotal = stats.dates.reduce((sum, date) => {
            return sum + (user.contributionsByDay[date] || 0)
          }, 0)
          
          return {
            ...user,
            periodTotal,
          }
        })
        .filter((user) => user.periodTotal > 0)
        .sort((a, b) => b.periodTotal - a.periodTotal)
        .slice(0, 10) // Limiter au top 10
    : []
  
  // Helper pour extraire les URLs d'un utilisateur
  const parseUserUrls = (user: UserStats): string[] => {
    const allUrls: string[] = []
    if (user.website_url) {
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
  }
  
  // Helper pour extraire le domaine d'une URL
  const getDomainFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return null
    }
  }

  // Nuances de gris pour les couleurs (plus foncé pour le 1er, plus clair pour le 3ème)
  const grayColors = [
    '#4b5563', // gray-600 (plus foncé)
    '#6b7280', // gray-500 (moyen)
    '#9ca3af', // gray-400 (plus clair)
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!stats || stats.users.length === 0) {
    return (
      <div className="text-center py-24 px-4">
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>No data available for this period.</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Weekly stats</h1>
            <p className="text-base-content/70">
              Top 3 contributors per day
            </p>
          </div>
          
          {/* Filtre de période */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-base-content" />
              <label className="text-sm font-medium text-base-content">
                Période :
              </label>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  id="start-date-input"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={format(subDays(new Date(), 1), 'yyyy-MM-dd')} // Pas après hier
                  className="input input-bordered input-sm bg-gh-tertiary border-base-300 text-base-content/70 cursor-pointer px-3 py-2 pr-10 min-w-[140px] hover:border-gh-pink focus:border-gh-pink focus:outline-none"
                  style={{
                    colorScheme: 'dark',
                  }}
                  onClick={(e) => {
                    // S'assurer que le date picker s'ouvre au clic
                    const input = e.target as HTMLInputElement
                    if (input.showPicker) {
                      input.showPicker()
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-4 h-4 text-base-content/70" />
                </div>
              </div>
              <span className="text-base-content/70 font-medium">→</span>
              <input
                type="date"
                value={endDate}
                readOnly
                className="input input-bordered input-sm bg-gh-tertiary border-base-300 text-base-content/50 cursor-not-allowed px-3 py-2 min-w-[140px]"
                title="Date de fin calculée automatiquement (7 jours après la date de début)"
                style={{
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Graphique - Prend 2 colonnes sur desktop */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-6">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[800px]" style={{ height: '450px' }}>
                  <svg width="100%" height="450" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" className="overflow-visible">
                  <defs>
                    <clipPath id="avatar-clip-circle">
                      <circle cx="12" cy="12" r="12" />
                    </clipPath>
                  </defs>
                    
                    {/* Filigrane en arrière-plan */}
                    <text
                      x="400"
                      y="165"
                      textAnchor="middle"
                      fontSize="70"
                      fill="currentColor"
                      opacity="0.05"
                      fontWeight="bold"
                      transform=""
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      olympicship.com
                    </text>
                    
                    {/* Grille de fond */}
                    <g className="opacity-20" stroke="currentColor" strokeDasharray="3 3">
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const y = 80 + (i * (280 / 5))
                        return (
                          <line
                            key={i}
                            x1="40"
                            y1={y}
                            x2="770"
                            y2={y}
                          />
                        )
                      })}
                    </g>
                    
                    {/* Dimensions du graphique */}
                    {(() => {
                      const chartWidth = 800
                      const chartHeight = 450
                      const topMargin = 80 // Augmenté pour laisser de la place aux avatars
                      const bottomMargin = 60
                      const leftMargin = 40
                      const rightMargin = 30
                      const plotWidth = chartWidth - leftMargin - rightMargin
                      const plotHeight = chartHeight - topMargin - bottomMargin
                      const dayWidth = plotWidth / (dailyTop3Data.length * 1.2) // Largeur pour chaque jour
                      const barWidth = (dayWidth / 4) * 0.8 // Largeur de chaque barre (3 barres + espace)
                      const barSpacing = barWidth * 0.2 // Espace entre les barres
                      const groupSpacing = dayWidth * 0.2 // Espace entre les groupes de jours
                      
                      return dailyTop3Data.map((dayData, dayIndex) => {
                        const dayX = leftMargin + dayIndex * (dayWidth + groupSpacing)
                        const dayCenterX = dayX + dayWidth / 2
                        
                        return (
                          <g key={dayData.dateKey}>
                            {/* Barres côte à côte pour chaque contributeur du top 3 */}
                            {dayData.top3.map((contributor, contributorIndex) => {
                              // Calculer la position X de cette barre (3 barres côte à côte)
                              const barX = dayX + (contributorIndex * (barWidth + barSpacing)) + (dayWidth - (3 * barWidth + 2 * barSpacing)) / 2
                              const barCenterX = barX + barWidth / 2
                              
                              // Calculer la hauteur de la barre
                              const barHeight = (contributor.count / maxValue) * plotHeight
                              const barY = topMargin + plotHeight - barHeight
                              
                              const isTopContributor = contributorIndex === 0
                              const fillColor = isTopContributor ? '#FF66C4' : grayColors[contributorIndex % grayColors.length]
                              
                              return (
                                <g
                                  key={contributor.username}
                                  onMouseMove={(e) => {
                                    const svg = e.currentTarget.ownerSVGElement
                                    if (svg) {
                                      const rect = svg.getBoundingClientRect()
                                      const xPos = e.clientX - rect.left
                                      const yPos = e.clientY - rect.top
                                      setTooltipPosition({ x: xPos, y: yPos })
                                    }
                                    setHoveredDay(dayData.dateKey)
                                  }}
                                  onMouseLeave={() => setHoveredDay(null)}
                                  className="cursor-pointer"
                                  style={{ pointerEvents: 'all' }}
                                >
                                  {/* Zone invisible pour capturer le hover sur toute la barre */}
                                  <rect
                                    x={barX}
                                    y={topMargin}
                                    width={barWidth}
                                    height={plotHeight}
                                    fill="transparent"
                                    style={{ pointerEvents: 'all' }}
                                  />
                                  
                                  {/* Barre */}
                                  <rect
                                    x={barX}
                                    y={barY}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={fillColor}
                                    rx={2}
                                    className="transition-all duration-200"
                                    style={{ pointerEvents: 'all' }}
                                  />
                                  
                                  {/* Avatar au-dessus de la barre */}
                                  <g transform={`translate(${barCenterX}, ${barY - 15})`}>
                                    <defs>
                                      <clipPath id={`avatar-clip-${dayData.dateKey}-${contributorIndex}`}>
                                        <circle cx="0" cy="0" r="12" />
                                      </clipPath>
                                    </defs>
                                    <image
                                      href={contributor.avatar_url}
                                      x={-12}
                                      y={-12}
                                      height={24}
                                      width={24}
                                      clipPath={`url(#avatar-clip-${dayData.dateKey}-${contributorIndex})`}
                                    />
                                  </g>
                                </g>
                              )
                            })}
                            
                            {/* Label de date */}
                            <text
                              x={dayCenterX}
                              y={topMargin + plotHeight + 20}
                              textAnchor="middle"
                              fill="currentColor"
                              fontSize={12}
                              transform={`rotate(-45 ${dayCenterX} ${topMargin + plotHeight + 20})`}
                            >
                              {dayData.date}
                            </text>
                          </g>
                        )
                      })
                    })()}
                    
                    {/* Tooltip au hover */}
                    {hoveredDay && (() => {
                      const dayData = dailyTop3Data.find(d => d.dateKey === hoveredDay)
                      if (!dayData) return null
                      
                      const tooltipWidth = 220
                      const tooltipHeight = 50 + dayData.top3.length * 45
                      const offsetX = 15
                      const offsetY = -tooltipHeight - 10
                      
                      // Ajuster la position si le tooltip sort de l'écran
                      let xPos = tooltipPosition.x + offsetX
                      let yPos = tooltipPosition.y + offsetY
                      
                      if (xPos + tooltipWidth > 800) {
                        xPos = tooltipPosition.x - tooltipWidth - offsetX
                      }
                      if (yPos < 0) {
                        yPos = tooltipPosition.y + 10
                      }
                      
                      return (
                        <g transform={`translate(${xPos}, ${yPos})`}>
                          {/* Fond du tooltip */}
                          <rect
                            x="0"
                            y="0"
                            width={tooltipWidth}
                            height={tooltipHeight}
                            fill="#020408"
                            rx="8"
                            stroke="#222825"
                            strokeWidth="1"
                            className="opacity-95"
                          />
                          
                          {/* Titre du tooltip */}
                          <text
                            x={tooltipWidth / 2}
                            y="20"
                            textAnchor="middle"
                            fill="#F0F6FC"
                            fontSize={14}
                            fontWeight="bold"
                          >
                            {dayData.date}
                          </text>
                          
                          {/* Liste des top 3 */}
                          {dayData.top3.map((contributor, index) => (
                            <g key={contributor.username} transform={`translate(10, ${35 + index * 45})`}>
                              {/* Avatar */}
                              <image
                                href={contributor.avatar_url}
                                x="0"
                                y="0"
                                height={32}
                                width={32}
                                clipPath="url(#avatar-clip-circle)"
                              />
                              
                              {/* Username */}
                              <text
                                x="40"
                                y="10"
                                fill="#F0F6FC"
                                fontSize={13}
                                alignmentBaseline="middle"
                              >
                                {contributor.username}
                              </text>
                              
                              {/* Nombre de commits */}
                              <text
                                x={tooltipWidth - 20}
                                y="10"
                                textAnchor="end"
                                fill="#FF66C4"
                                fontSize={13}
                                fontWeight="bold"
                                alignmentBaseline="middle"
                              >
                                {contributor.count} commit{contributor.count > 1 ? 's' : ''}
                              </text>
                            </g>
                          ))}
                        </g>
                      )
                    })()}
                    
                    {/* Axe Y */}
                    <g stroke="currentColor" fill="currentColor" fontSize={12}>
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const y = 80 + (i * (280 / 5))
                        const value = maxValue - (i * (maxValue / 5))
                        return (
                          <g key={i}>
                            <line
                              x1="40"
                              y1={y}
                              x2="45"
                              y2={y}
                            />
                            <text
                              x="35"
                              y={y + 4}
                              textAnchor="end"
                            >
                              {Math.round(value)}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Liste des contributeurs - 1 colonne sur desktop */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-6">
              <h2 className="text-xl font-bold mb-4">Top contributors</h2>
              <div className="overflow-y-auto max-h-[400px] pr-2">
                {topContributorsForPeriod.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <p>No contributions for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topContributorsForPeriod.map((user, index) => {
                      const username = user.display_username || user.github_username
                      const allUrls = parseUserUrls(user)
                      
                      return (
                        <div
                          key={user.github_username}
                          className="flex items-center gap-3 p-3 rounded-lg bg-base-100 hover:bg-base-300 transition-colors"
                        >
                          {/* Rang */}
                          <div className="shrink-0">
                            {index + 1 <= 3 ? (
                              <span className="text-2xl font-bold">
                                {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-base-content/60">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                          
                          {/* Avatar */}
                          <div className="shrink-0">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1 overflow-hidden">
                                <img
                                  src={user.avatar_url || '/default-avatar.png'}
                                  alt={username}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base-content truncate">
                              {username}
                            </div>
                            <div className="text-sm text-gh-pink font-bold">
                              {user.periodTotal} commit{user.periodTotal > 1 ? 's' : ''}
                            </div>
                            
                            {/* Favicons */}
                            {allUrls.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {allUrls.filter(url => url && url.trim()).map((url, idx) => {
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
                                        width={16}
                                        height={16}
                                        className="w-4 h-4 rounded object-contain"
                                        loading="lazy"
                                        style={{ imageRendering: 'crisp-edges' }}
                                      />
                                    </a>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors défilants en bas */}
      <div className="mt-8 w-full">
        <SponsorBanner />
      </div>
    </>
  )
}

