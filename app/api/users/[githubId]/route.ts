import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ githubId: string }> }
) {
  try {
    const { githubId } = await params
    const body = await request.json()
    const { display_username, website_url, open_to_work, open_for_partner, languages } = body

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
            // Not needed for PATCH requests that don't update auth
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

    // Build update object
    const updateData: any = {}
    
    if (display_username !== undefined) {
      updateData.display_username = display_username
    }
    
    if (website_url !== undefined) {
      updateData.website_url = website_url || null
    }

    // Update open_to_work if provided
    if (open_to_work !== undefined) {
      updateData.open_to_work = open_to_work
    }

    // Update open_for_partner if provided
    if (open_for_partner !== undefined) {
      updateData.open_for_partner = open_for_partner
    }

    // Update languages if provided
    if (languages !== undefined) {
      updateData.languages = languages || []
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('github_id', githubId)
      .eq('id', user.id) // S'assurer que c'est bien le profil de l'utilisateur
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating profile:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Failed to update profile: ${errorMessage}` },
      { status: 500 }
    )
  }
}

