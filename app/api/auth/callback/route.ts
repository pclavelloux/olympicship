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

    if (session?.provider_token && session?.user) {
      try {
        // Vérifier si c'est une première connexion (profil existait déjà?)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, created_at')
          .eq('id', session.user.id)
          .single()

        const isFirstTime = !existingProfile || 
          (existingProfile && new Date(existingProfile.created_at).getTime() > Date.now() - 60000) // Créé il y a moins d'1 minute

        // Récupérer les informations GitHub depuis les metadata
        const githubUsername = session.user.user_metadata.user_name || 
                               session.user.user_metadata.preferred_username
        const githubId = session.user.user_metadata.provider_id || 
                         session.user.user_metadata.sub ||
                         session.user.id
        const avatarUrl = session.user.user_metadata.avatar_url || 
                         session.user.user_metadata.picture
        
        if (githubUsername) {
          // Récupérer les contributions GitHub
          const contributions = await fetchGitHubContributions(
            githubUsername,
            session.provider_token
          )

          const totalContributions = Object.values(contributions).reduce(
            (sum, count) => sum + count,
            0
          )

          // Créer ou mettre à jour le profil avec toutes les informations
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              github_username: githubUsername,
              github_id: githubId,
              github_token: session.provider_token,
              avatar_url: avatarUrl,
              contributions_data: contributions,
              total_contributions: totalContributions,
              last_updated: new Date().toISOString(),
            }, {
              onConflict: 'id'
            })

          if (upsertError) {
            console.error('Error upserting profile:', upsertError)
            // Si l'upsert échoue, essayer un update
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                github_username: githubUsername,
                github_id: githubId,
                github_token: session.provider_token,
                avatar_url: avatarUrl,
                contributions_data: contributions,
                total_contributions: totalContributions,
                last_updated: new Date().toISOString(),
              })
              .eq('id', session.user.id)

            if (updateError) {
              console.error('Error updating profile:', updateError)
            }
          }

          // Rediriger avec success=true pour forcer le rafraîchissement
          // Si c'est une première connexion, ajouter aussi firstTime=true
          const redirectParams = new URLSearchParams()
          redirectParams.set('success', 'true')
          if (isFirstTime) {
            redirectParams.set('firstTime', 'true')
          }
          const redirectUrl = new URL(`/?${redirectParams.toString()}`, requestUrl.origin)
          return NextResponse.redirect(redirectUrl)
        }
      } catch (error) {
        console.error('Error fetching contributions:', error)
        // Continue même si la récupération des contributions échoue
        // Rediriger quand même avec success=true pour permettre le rafraîchissement
        const redirectUrl = new URL('/?success=true', requestUrl.origin)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return response
}
