import { createServerClient } from '@supabase/ssr'
import { fetchGitHubContributions } from '@/lib/github'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const response = NextResponse.redirect(new URL(code ? '/?success=true' : '/?error=no_code', requestUrl.origin))

  console.log('TEST', code)
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Échanger le code contre une session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(sessionError.message)}`, requestUrl.origin)
      )
    }

    if (!session?.user) {
      console.error('No user in session')
      return NextResponse.redirect(
        new URL('/?error=no_user', requestUrl.origin)
      )
    }

    // Récupérer les informations GitHub depuis les metadata
    const githubUsername = session.user.user_metadata.user_name || 
                           session.user.user_metadata.preferred_username
    const githubId = session.user.user_metadata.provider_id || 
                     session.user.user_metadata.sub ||
                     session.user.id
    const avatarUrl = session.user.user_metadata.avatar_url || 
                     session.user.user_metadata.picture

    if (!githubUsername) {
      console.error('No GitHub username found in user metadata')
      return NextResponse.redirect(
        new URL('/?error=no_github_username', requestUrl.origin)
      )
    }

    // Vérifier si c'est une première connexion (profil existait déjà?)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('id', session.user.id)
      .single()

    const isFirstTime = !existingProfile || 
      (existingProfile && new Date(existingProfile.created_at).getTime() > Date.now() - 60000) // Créé il y a moins d'1 minute

    // Log pour debug
    console.log('Session data:', {
      hasProviderToken: !!session.provider_token,
      hasProviderRefreshToken: !!session.provider_refresh_token,
      userMetadata: session.user?.user_metadata,
      accessToken: session.access_token ? 'present' : 'missing',
    })

    // Essayer de récupérer les contributions si on a un provider_token
    let contributions: Record<string, number> = {}
    let totalContributions = 0
    let contributionsError: Error | null = null

    // Le provider_token peut être dans session.provider_token ou dans session.access_token
    // selon la version de Supabase
    const githubToken = session.provider_token || session.provider_refresh_token
    
    if (githubToken) {
      try {
        console.log('Fetching contributions for:', githubUsername)
        contributions = await fetchGitHubContributions(
          githubUsername,
          githubToken
        )
        totalContributions = Object.values(contributions).reduce(
          (sum, count) => sum + count,
          0
        )
        console.log('Contributions fetched successfully. Total:', totalContributions)
      } catch (error) {
        contributionsError = error instanceof Error ? error : new Error(String(error))
        console.error('Error fetching contributions:', error)
        // On continue quand même, on sauvegardera les contributions à 0
        contributions = {}
        totalContributions = 0
      }
    } else {
      console.warn('No provider_token in session. Trying to get token from GitHub...')
      
      // Essayer de récupérer un token directement depuis GitHub
      // en utilisant le code d'autorisation si disponible
      try {
        // Si on n'a pas le token, on essaie quand même de récupérer les contributions publiques
        // sans token (mais ça ne marchera probablement pas pour GraphQL)
        console.log('Attempting to fetch public contributions without token...')
        // Note: GraphQL nécessite un token, donc ça va échouer
        // Mais on va essayer pour voir l'erreur exacte
        contributions = await fetchGitHubContributions(
          githubUsername,
          '' // Pas de token
        )
        totalContributions = Object.values(contributions).reduce(
          (sum, count) => sum + count,
          0
        )
      } catch (error) {
        contributionsError = error instanceof Error ? error : new Error(String(error))
        console.error('Error fetching contributions without token:', error)
        contributions = {}
        totalContributions = 0
      }
    }

    // Créer ou mettre à jour le profil avec toutes les informations
    const profileData = {
      id: session.user.id,
      github_username: githubUsername,
      github_id: githubId,
      github_token: session.provider_token || session.provider_refresh_token || null,
      avatar_url: avatarUrl,
      contributions_data: contributions,
      total_contributions: totalContributions,
      last_updated: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('Error upserting profile:', upsertError)
      // Si l'upsert échoue, essayer un update
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent(updateError.message)}`, requestUrl.origin)
        )
      }
    }

    // Rediriger avec success=true pour forcer le rafraîchissement
    // Si c'est une première connexion, ajouter aussi firstTime=true
    const redirectParams = new URLSearchParams()
    redirectParams.set('success', 'true')
    if (isFirstTime) {
      redirectParams.set('firstTime', 'true')
    }
    if (contributionsError) {
      redirectParams.set('contributions_error', 'true')
    }
    const redirectUrl = new URL(`/?${redirectParams.toString()}`, requestUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
