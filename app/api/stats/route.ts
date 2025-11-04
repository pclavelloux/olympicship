import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface UserStats {
  github_username: string
  display_username?: string
  avatar_url?: string
  website_url?: string
  totalLast7Days: number
  contributionsByDay: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Récupérer les paramètres de date depuis la query string
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    let dates: string[] = []
    let startDate: string
    let endDate: string
    
    if (startDateParam && endDateParam) {
      // Utiliser les dates fournies
      startDate = startDateParam
      endDate = endDateParam
      
      // Générer toutes les dates entre startDate et endDate
      const start = new Date(startDate)
      const end = new Date(endDate)
      const current = new Date(start)
      
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
    } else {
      // Par défaut : calculer les 7 derniers jours (excluant aujourd'hui)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 7; i >= 1; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0]) // Format YYYY-MM-DD
      }

      startDate = dates[0]
      endDate = dates[dates.length - 1]
    }

    // Requête optimisée : utiliser la table daily_contributions avec une agrégation SQL
    const { data: contributions, error: contributionsError } = await supabase
      .from('daily_contributions')
      .select(`
        user_id,
        date,
        count,
        profiles!inner (
          github_username,
          display_username,
          avatar_url,
          website_url
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (contributionsError) {
      throw contributionsError
    }

    if (!contributions || contributions.length === 0) {
      return NextResponse.json({
        dates,
        users: [],
      })
    }

    // Grouper les contributions par utilisateur
    const userContributionsMap = new Map<string, {
      github_username: string
      display_username?: string
      avatar_url?: string
      website_url?: string
      contributionsByDay: Record<string, number>
      totalLast7Days: number
    }>()

    contributions.forEach((contrib) => {
      const profile = contrib.profiles as any
      if (!profile) return

      const userId = contrib.user_id
      const date = contrib.date
      const count = contrib.count || 0

      if (!userContributionsMap.has(userId)) {
        userContributionsMap.set(userId, {
          github_username: profile.github_username,
          display_username: profile.display_username,
          avatar_url: profile.avatar_url,
          website_url: profile.website_url,
          contributionsByDay: {},
          totalLast7Days: 0,
        })
      }

      const userStats = userContributionsMap.get(userId)!
      userStats.contributionsByDay[date] = count
      userStats.totalLast7Days += count
    })

    // Convertir en tableau - on retourne TOUS les contributeurs qui ont au moins une contribution
    // (pas seulement le top 3 global, car on veut calculer le top 3 par jour)
    const userStats: UserStats[] = Array.from(userContributionsMap.values())
      .filter((stats) => stats.totalLast7Days > 0)
      .sort((a, b) => b.totalLast7Days - a.totalLast7Days)
      .map((stats) => ({
        github_username: stats.github_username,
        display_username: stats.display_username,
        avatar_url: stats.avatar_url,
        website_url: stats.website_url,
        totalLast7Days: stats.totalLast7Days,
        contributionsByDay: stats.contributionsByDay,
      }))

    return NextResponse.json({
      dates,
      users: userStats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

