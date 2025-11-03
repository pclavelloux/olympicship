import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGitHubContributions } from '@/lib/github'

/**
 * Route cron pour rafraîchir automatiquement les contributions GitHub
 * Appelée toutes les 12 heures via Vercel Cron Jobs
 * 
 * Protection: Vérifie le secret CRON_SECRET dans les headers
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret pour protéger l'endpoint
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Créer un client Supabase avec service role pour accéder à tous les profils
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured')
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Récupérer tous les profils qui ont un github_token
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, github_username, github_token')
      .not('github_token', 'is', null)
      .neq('github_token', '')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profiles with GitHub tokens found',
        updated: 0,
        failed: 0,
      })
    }

    // Rafraîchir les contributions pour chaque profil
    let updated = 0
    let failed = 0
    const errors: Array<{ userId: string; error: string }> = []

    for (const profile of profiles) {
      try {
        if (!profile.github_token || !profile.github_username) {
          continue
        }

        // Récupérer les contributions avec le token stocké
        const contributions = await fetchGitHubContributions(
          profile.github_username,
          profile.github_token
        )

        const totalContributions = Object.values(contributions).reduce(
          (sum, count) => sum + count,
          0
        )

        // Mettre à jour le profil avec les nouvelles données
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            contributions_data: contributions,
            total_contributions: totalContributions,
            last_updated: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (updateError) {
          throw updateError
        }

        updated++
        console.log(`✅ Updated contributions for ${profile.github_username}`)
      } catch (error) {
        failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          userId: profile.id,
          error: errorMessage,
        })
        console.error(`❌ Failed to update contributions for ${profile.github_username}:`, errorMessage)
        // Continue avec les autres profils même si celui-ci échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Refreshed contributions for ${updated} profiles`,
      updated,
      failed,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to refresh contributions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

