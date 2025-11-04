import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

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

export async function POST() {
  try {
    // Obtenir l'URL de base depuis les headers
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = process.env.NEXT_PUBLIC_URL || `${protocol}://${host}`

    // Créer une session de checkout Stripe pour un abonnement
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'TrustCode Sponsor',
              description: 'Monthly sponsorship - Get your product in front of top developers',
            },
            unit_amount: 39900, // $399 HT per month
            recurring: {
              interval: 'month',
            },
            tax_behavior: 'exclusive', // Le prix est HT, les taxes seront ajoutées
          },
          quantity: 1,
        },
      ],
      // Collecte obligatoire de l'adresse de facturation
      billing_address_collection: 'required',
      // Calcul automatique des taxes en fonction de l'adresse
      automatic_tax: {
        enabled: true,
      },
      // Collecte obligatoire de la TVA/NIF
      tax_id_collection: {
        enabled: true,
      },
      // Autoriser l'utilisation de codes promo
      allow_promotion_codes: true,
      success_url: `${baseUrl}/sponsor/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=true`,
    })

    // TEMPORAIRE: Créer l'entrée sponsor immédiatement pour le développement
    // En production, cela sera géré par le webhook checkout.session.completed
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    // On utilise un email temporaire qui sera mis à jour après le paiement
    const { error: insertError } = await supabase.from('sponsors').insert({
      email: `temp-${session.id}@pending.com`, // Email temporaire basé sur session ID
      stripe_subscription_id: `sub-pending-${session.id}`, // Temporaire, sera mis à jour
      status: 'pending',
      payment_date: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error('Error creating temporary sponsor entry:', insertError)
      // On continue quand même, ce n'est pas bloquant
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

