import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ContributionData } from '@/types/user'
import { upsertDailyContributions } from '@/lib/contributions'

/**
 * Script de migration pour remplir la table daily_contributions
 * avec les données existantes de contributions_data pour tous les utilisateurs
 * 
 * À exécuter UNE SEULE FOIS après avoir créé la table daily_contributions
 * 
 * Protection: Vérifie le secret MIGRATION_SECRET dans les headers
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret pour protéger l'endpoint
    const authHeader = request.headers.get('authorization')
    const migrationSecret = process.env.MIGRATION_SECRET || 'migration-secret-change-me'

    if (authHeader !== `Bearer ${migrationSecret}`) {
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

    // Récupérer tous les profils avec contributions_data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, github_username, contributions_data')
      .not('contributions_data', 'is', null)

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
        message: 'No profiles with contributions_data found',
        migrated: 0,
        failed: 0,
      })
    }

    console.log(`📊 Found ${profiles.length} profiles with contributions_data`)

    // Migrer les contributions pour chaque profil
    let migrated = 0
    let failed = 0
    const errors: Array<{ userId: string; username: string; error: string }> = []

    for (const profile of profiles) {
      try {
        const contributionsData = profile.contributions_data as ContributionData | null
        
        if (!contributionsData || Object.keys(contributionsData).length === 0) {
          console.log(`⏭️  Skipping ${profile.github_username} - no contributions data`)
          continue
        }

        // Insérer/mettre à jour les contributions quotidiennes
        await upsertDailyContributions(
          profile.id,
          contributionsData,
          supabase
        )

        migrated++
        console.log(`✅ Migrated ${Object.keys(contributionsData).length} days for ${profile.github_username}`)
      } catch (error) {
        failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          userId: profile.id,
          username: profile.github_username,
          error: errorMessage,
        })
        console.error(`❌ Failed to migrate contributions for ${profile.github_username}:`, errorMessage)
        // Continue avec les autres profils même si celui-ci échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed: ${migrated} profiles migrated, ${failed} failed`,
      migrated,
      failed,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in migration script:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to migrate contributions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

