import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ githubId: string }> }
) {
  try {
    const { githubId } = await params
    const body = await request.json()
    const { display_username, website_url, other_urls } = body

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
    // Main website is stored in website_url (first URL in the list)
    // All URLs (main first) are stored in other_urls array
    const updateData: any = {}
    
    if (display_username !== undefined) {
      updateData.display_username = display_username
    }
    
    if (website_url !== undefined) {
      updateData.website_url = website_url || null
    }
    
    // Try to update with other_urls if provided
    // If other_urls column doesn't exist, we'll fall back to updating only website_url
    if (other_urls !== undefined) {
      // other_urls contains all URLs with main website as first element
      // Store as JSONB array (Supabase will handle the conversion)
      updateData.other_urls = other_urls || []
    }

    let { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('github_id', githubId)
      .eq('id', user.id) // S'assurer que c'est bien le profil de l'utilisateur
      .select()
      .single()

    // If error is related to column not existing (other_urls), retry without it
    if (error && other_urls !== undefined) {
      const errorMessage = String(error.message || error).toLowerCase()
      const errorCode = (error as any)?.code || ''
      
      // Check if error is about column not existing or unknown column
      const isColumnError = errorMessage.includes('column') && 
                           (errorMessage.includes('other_urls') || 
                            errorMessage.includes('does not exist') ||
                            errorMessage.includes('unknown') ||
                            errorCode === '42703') // PostgreSQL error code for undefined column
      
      if (isColumnError) {
        console.warn('other_urls column does not exist, storing all URLs in website_url as JSON:', errorMessage)
        // Store all URLs in website_url as JSON string as fallback
        const fallbackUpdateData: any = {}
        if (display_username !== undefined) {
          fallbackUpdateData.display_username = display_username
        }
        // Store all URLs (including main) as JSON string in website_url
        if (other_urls && Array.isArray(other_urls) && other_urls.length > 0) {
          // Store as JSON string in website_url
          fallbackUpdateData.website_url = JSON.stringify(other_urls)
        } else if (website_url !== undefined) {
          // If no other_urls array, just use website_url as is
          fallbackUpdateData.website_url = website_url || null
        }
        
        const retryResult = await supabase
          .from('profiles')
          .update(fallbackUpdateData)
          .eq('github_id', githubId)
          .eq('id', user.id)
          .select()
          .single()
        
        if (retryResult.error) {
          console.error('Supabase error on retry:', retryResult.error)
          throw retryResult.error
        }
        
        data = retryResult.data
        error = null
      } else {
        // Different error, throw it
        console.error('Supabase error:', error)
        throw error
      }
    } else if (error) {
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

