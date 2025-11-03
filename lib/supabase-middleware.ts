import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Rafraîchir la session si elle existe
  // Ignorer les erreurs de refresh token (elles peuvent survenir pendant l'authentification)
  try {
    await supabase.auth.getUser()
  } catch (error: any) {
    // Ignorer les erreurs de refresh token not found
    // Cela peut arriver pendant le processus d'authentification OAuth
    if (error?.code === 'refresh_token_not_found' || error?.status === 400) {
      // Log pour debug mais ne pas bloquer la requête
      console.debug('Refresh token not found (expected during OAuth flow):', error.message)
    } else {
      // Logger les autres erreurs mais continuer quand même
      console.error('Unexpected auth error in middleware:', error)
    }
  }

  return response
}

