import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

// GET - Récupérer les sponsors actifs (jusqu'à 10)
export async function GET() {
  try {
    const { data: sponsors, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching sponsors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sponsors' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sponsors: sponsors || [] })
  } catch (error) {
    console.error('Error in GET /api/sponsors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Mettre à jour les informations du sponsor après paiement
export async function POST(request: Request) {
  try {
    const { sessionId, websiteUrl, companyName, description } = await request.json()

    if (!sessionId || !websiteUrl || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Récupérer la session Stripe pour obtenir l'email
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Récupérer l'email depuis customer_details ou customer_email
    const email = session.customer_details?.email || session.customer_email

    if (!session || !email) {
      return NextResponse.json(
        { error: 'Invalid session or no email found' },
        { status: 400 }
      )
    }

    // Chercher le sponsor avec l'email temporaire basé sur le sessionId
    const tempEmail = `temp-${sessionId}@pending.com`
    
    // Mettre à jour le sponsor dans la base de données
    // On cherche par l'email temporaire ou par le vrai email
    const { data: existingSponsors } = await supabase
      .from('sponsors')
      .select('*')
      .or(`email.eq.${tempEmail},email.eq.${email}`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!existingSponsors || existingSponsors.length === 0) {
      console.error('No sponsor found for session:', sessionId)
      return NextResponse.json(
        { error: 'Sponsor not found. Please try the checkout process again.' },
        { status: 404 }
      )
    }

    const sponsor = existingSponsors[0]

    // Mettre à jour avec les vraies informations
    const { data, error } = await supabase
      .from('sponsors')
      .update({
        email: email, // Mettre à jour avec le vrai email
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        website_url: websiteUrl,
        company_name: companyName,
        description: description || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sponsor.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sponsor:', error)
      return NextResponse.json(
        { error: 'Failed to update sponsor information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, sponsor: data })
  } catch (error) {
    console.error('Error in POST /api/sponsors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

