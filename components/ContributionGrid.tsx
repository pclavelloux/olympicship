'use client'

import { useMemo } from 'react'
import { 
  eachDayOfInterval, 
  format, 
  getDay,
  subYears,
  startOfWeek,
  getMonth,
} from 'date-fns'

interface ContributionGridProps {
  contributionsData: Record<string, number>
  username: string
  compact?: boolean
}

export default function ContributionGrid({ contributionsData, username, compact = false }: ContributionGridProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const now = new Date()
    const yearAgo = subYears(now, 1)
    const startDate = startOfWeek(yearAgo, { weekStartsOn: 0 }) // Dimanche
    const endDate = now
    
    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    })

    // Group days by week (vertical columns)
    const weeksData: Array<Array<{ date: Date; count: number; level: number }>> = []
    let currentWeek: Array<{ date: Date; count: number; level: number }> = []
    
    // Get max contribution count for dynamic level calculation
    const maxCount = Math.max(...Object.values(contributionsData), 1)

    // Track months for labels
    const monthMap = new Map<number, { month: string; weekIndex: number }>()

    days.forEach((day, dayIndex) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const count = contributionsData[dateStr] || 0
      
      // Track month starts - show month label at first week containing that month
      const month = getMonth(day)
      const dayOfMonth = day.getDate()
      const weekIndex = Math.floor(weeksData.length)
      
      // Mark first appearance of each month (first few days)
      if (dayOfMonth <= 7 && !monthMap.has(month)) {
        monthMap.set(month, {
          month: format(day, 'MMM'),
          weekIndex: weekIndex + (currentWeek.length > 0 ? 1 : 0),
        })
      }
      
      // Calculate level (0-4) based on contribution count
      let level = 0
      if (count > 0) {
        if (maxCount === 0) {
          level = 1
        } else {
          const ratio = count / maxCount
          if (ratio <= 0.25) level = 1
          else if (ratio <= 0.5) level = 2
          else if (ratio <= 0.75) level = 3
          else level = 4
        }
      }

      currentWeek.push({ date: day, count, level })

      // Saturday = end of week
      if (getDay(day) === 6) {
        weeksData.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) {
      weeksData.push(currentWeek)
    }

    // Convert month map to array and sort by weekIndex
    const monthsArray = Array.from(monthMap.values()).sort((a, b) => a.weekIndex - b.weekIndex)

    return { weeks: weeksData, monthLabels: monthsArray }
  }, [contributionsData])

  // Pink gradient colors for contributions (darker and more muted, similar to GitHub green style)
  const getLevelClasses = (level: number) => {
    // Muted pink gradient from dark to light (similar intensity to GitHub green)
    const classes = {
      0: 'bg-[#21262d]', // No contributions - dark gray
      1: 'bg-[#5c2d4e]', // Level 1 - very dark muted pink
      2: 'bg-[#7d3a6b]', // Level 2 - dark muted pink
      3: 'bg-[#a85491]', // Level 3 - medium muted pink
      4: 'bg-[#c66fb4]', // Level 4 - light muted pink (most commits)
    }
    return classes[level as keyof typeof classes] || classes[0]
  }

  const totalContributions = Object.values(contributionsData).reduce((sum, count) => sum + count, 0)

  // Get positions for day labels (Mon, Wed, Fri)
  const firstWeek = weeks.length > 0 ? weeks[0] : []
  const dayLabelPositions: Array<{ label: string; position: number }> = []
  
  firstWeek.forEach((day, index) => {
    const dayOfWeek = getDay(day.date)
    if (dayOfWeek === 1) dayLabelPositions.push({ label: 'Mon', position: index })
    if (dayOfWeek === 3) dayLabelPositions.push({ label: 'Wed', position: index })
    if (dayOfWeek === 5) dayLabelPositions.push({ label: 'Fri', position: index })
  })

  if (compact) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto pb-2">
          <div className="inline-block">
            {/* Contribution grid only - no labels */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`w-[10px] h-[10px] rounded-sm ${getLevelClasses(day.level)} transition-all hover:ring-2 hover:ring-gh-pink cursor-pointer relative group`}
                      title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.count} commit{day.count !== 1 ? 's' : ''}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-gray-400">
        {totalContributions.toLocaleString()} contributions in the last year
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Month labels */}
          <div className="relative mb-1 ml-7 h-4 flex">
            {monthLabels.map(({ month, weekIndex }) => {
              // Each week column is 13px (11px square + 2px gap)
              const left = weekIndex * 13
              return (
                <span
                  key={`${month}-${weekIndex}`}
                  className="absolute text-xs text-gray-500 whitespace-nowrap"
                  style={{ left: `${left}px` }}
                >
                  {month}
                </span>
              )
            })}
          </div>

          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] pt-[3px] mr-2 relative">
              {dayLabelPositions.map(({ label, position }) => (
                <span
                  key={label}
                  className="text-xs text-gray-500 absolute"
                  style={{
                    top: `${position * 13}px`,
                    height: '11px',
                    lineHeight: '11px',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Contribution grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`w-[11px] h-[11px] rounded-[2px] ${getLevelClasses(day.level)} transition-all hover:ring-2 hover:ring-gh-pink cursor-pointer relative group`}
                      title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.count} commit{day.count !== 1 ? 's' : ''}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-[2px]">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-[11px] h-[11px] rounded-[2px] ${getLevelClasses(level)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
