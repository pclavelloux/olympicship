import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ githubId: string }> }
) {
  try {
    const { githubId } = await params
    const response = NextResponse.next()
    
    // Client pour vérifier l'authentification (avec ANON_KEY)
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

    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Client avec service role pour la suppression (contourne RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Vérifier que c'est bien le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, github_id')
      .eq('github_id', githubId)
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found or unauthorized' },
        { status: 404 }
      )
    }

    // Supprimer le profil avec le client admin (contourne RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete profile' },
        { status: 500 }
      )
    }

    // Supprimer l'utilisateur auth (cela supprimera aussi le profil via CASCADE si pas déjà fait)
    try {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    } catch (userDeleteError) {
      console.error('Error deleting auth user:', userDeleteError)
      // On continue même si ça échoue, le profil est déjà supprimé
    }

    // Sign out
    await supabase.auth.signOut()

    // Return response with cookies cleared
    const successResponse = NextResponse.json({ success: true })
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, '', { expires: new Date(0) })
    })

    return successResponse
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
}

