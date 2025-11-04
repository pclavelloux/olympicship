import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { fetchGitHubContributions } from '@/lib/github'
import { upsertDailyContributions } from '@/lib/contributions'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_username')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Récupérer les contributions avec le token fourni
    const contributions = await fetchGitHubContributions(
      profile.github_username,
      token
    )

    const totalContributions = Object.values(contributions).reduce(
      (sum, count) => sum + count,
      0
    )

    // Mettre à jour le profil avec les nouvelles données
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        github_token: token, // Sauvegarder le token pour les futures mises à jour
        contributions_data: contributions,
        total_contributions: totalContributions,
        last_updated: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Insérer/mettre à jour les contributions quotidiennes dans daily_contributions
    try {
      await upsertDailyContributions(user.id, contributions, supabase)
    } catch (dailyContribError) {
      console.error('⚠️ Failed to upsert daily contributions:', dailyContribError)
      // Ne pas bloquer le processus si l'upsert échoue
    }

    return NextResponse.json({
      success: true,
      total_contributions: totalContributions,
      message: 'Contributions updated successfully',
    })
  } catch (error) {
    console.error('Error refreshing contributions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh contributions' },
      { status: 500 }
    )
  }
}

