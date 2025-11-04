import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ContributionData } from '@/types/user'

/**
 * Insère ou met à jour les contributions quotidiennes dans la table daily_contributions
 * @param userId - ID de l'utilisateur
 * @param contributions - Objet avec les dates (YYYY-MM-DD) comme clés et le nombre de contributions comme valeurs
 * @param supabase - Client Supabase (optionnel, créera un client admin si non fourni)
 */
export async function upsertDailyContributions(
  userId: string,
  contributions: ContributionData,
  supabase?: any
): Promise<void> {
  // Si aucun client n'est fourni, créer un client admin
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  // Préparer les données pour l'upsert
  const dailyContributions = Object.entries(contributions).map(([date, count]) => ({
    user_id: userId,
    date,
    count: count || 0,
  }))

  if (dailyContributions.length === 0) {
    console.warn(`No contributions to upsert for user ${userId}`)
    return
  }

  // Utiliser upsert pour insérer ou mettre à jour les contributions
  // On utilise ON CONFLICT pour gérer les doublons (via la contrainte UNIQUE)
  const { error } = await supabase
    .from('daily_contributions')
    .upsert(dailyContributions, {
      onConflict: 'user_id,date',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error(`Error upserting daily contributions for user ${userId}:`, error)
    throw error
  }

  console.log(
    `✅ Upserted ${dailyContributions.length} daily contributions for user ${userId}`
  )
}

