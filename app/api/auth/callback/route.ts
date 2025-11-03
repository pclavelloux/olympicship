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
      accessToken: session.access_token ? 'present' : 'missing',
      userMetadata: session.user?.user_metadata,
      // Logger les clés disponibles pour debug
      sessionKeys: Object.keys(session),
      // Logger toute la session pour voir ce qui est disponible
      fullSession: JSON.stringify(session, null, 2).substring(0, 500),
    })

    // Essayer de récupérer les contributions si on a un provider_token
    let contributions: Record<string, number> = {}
    let totalContributions = 0
    let contributionsError: Error | null = null

    // Le provider_token peut être dans session.provider_token
    // Note: Supabase stocke le token OAuth dans provider_token seulement si configuré correctement
    // On peut aussi essayer de récupérer le token depuis les identities de l'utilisateur
    let githubToken = session.provider_token
    
    // Si pas de provider_token, essayer de le récupérer depuis les identities de l'utilisateur
    if (!githubToken && session.user?.identities) {
      console.log('Trying to get token from user identities...')
      const githubIdentity = session.user.identities.find((identity: any) => identity.provider === 'github')
      if (githubIdentity?.identity_data?.access_token) {
        githubToken = githubIdentity.identity_data.access_token
        console.log('Found token in identity_data')
      }
    }
    
    // Si toujours pas de token, essayer de récupérer depuis la session via l'API Supabase
    if (!githubToken) {
      console.log('No provider_token found, trying to get from Supabase API...')
      try {
        // Récupérer la session complète depuis Supabase
        const { data: { session: fullSession }, error: sessionError } = await supabase.auth.getSession()
        if (!sessionError && fullSession?.provider_token) {
          githubToken = fullSession.provider_token
          console.log('Found token in getSession()')
        }
      } catch (error) {
        console.error('Error getting session:', error)
      }
    }
    
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
      console.warn('No provider_token in session. Cannot fetch contributions without token.')
      console.warn('The OAuth token may not be configured to be returned in Supabase.')
      console.warn('Contributions will be set to 0. User can add a Personal Access Token later.')
      contributionsError = new Error('No provider_token available. Please add a Personal Access Token in your profile.')
      contributions = {}
      totalContributions = 0
    }

    // Créer ou mettre à jour le profil avec toutes les informations
    const profileData = {
      id: session.user.id,
      github_username: githubUsername,
      github_id: githubId,
      // Utiliser le token qu'on a trouvé (peu importe d'où il vient)
      github_token: githubToken || session.provider_token || session.provider_refresh_token || null,
      avatar_url: avatarUrl,
      contributions_data: contributions,
      total_contributions: totalContributions,
      last_updated: new Date().toISOString(),
    }
    
    console.log('Saving profile with token:', githubToken ? 'present' : 'missing')

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
