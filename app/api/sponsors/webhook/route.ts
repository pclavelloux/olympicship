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

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Récupérer l'email depuis customer_details ou customer_email
        const email = session.customer_details?.email || session.customer_email

        if (!email) {
          console.error('No email found in checkout session')
          break
        }

        // Créer ou mettre à jour le sponsor dans la base de données
        const { data: existingSponsor } = await supabase
          .from('sponsors')
          .select('*')
          .eq('email', email)
          .single()

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        if (existingSponsor) {
          // Mettre à jour le sponsor existant
          await supabase
            .from('sponsors')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              status: 'pending', // En attente des informations du sponsor
              payment_date: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('email', email)
        } else {
          // Créer un nouveau sponsor
          await supabase.from('sponsors').insert({
            email,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'pending',
            payment_date: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          })
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        // invoice.subscription peut être string | Stripe.Subscription | null
        // Note: subscription n'est pas toujours typé directement dans Stripe.Invoice
        const subscription = (invoice as any).subscription as string | Stripe.Subscription | null | undefined
        const subscriptionId = typeof subscription === 'string' 
          ? subscription 
          : subscription?.id || null

        if (subscriptionId) {
          // Prolonger l'abonnement du sponsor
          const { data: sponsor } = await supabase
            .from('sponsors')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (sponsor) {
            const expiresAt = new Date(sponsor.expires_at || new Date())
            expiresAt.setMonth(expiresAt.getMonth() + 1)

            await supabase
              .from('sponsors')
              .update({
                expires_at: expiresAt.toISOString(),
                payment_date: new Date().toISOString(),
                status: sponsor.website_url ? 'active' : 'pending',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId)
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Marquer le sponsor comme cancelled
        await supabase
          .from('sponsors')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Si l'abonnement est annulé mais toujours actif jusqu'à la fin de la période
        if (subscription.cancel_at_period_end) {
          await supabase
            .from('sponsors')
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

