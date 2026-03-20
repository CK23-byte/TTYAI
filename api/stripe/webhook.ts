import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const PLAN_CREDITS: Record<string, number> = {
  starter: 250,
  pro: 625,
  premium: 1250,
}

const PLAN_PROFILES: Record<string, number> = {
  starter: 3,
  pro: 10,
  premium: -1, // unlimited
}

export const config = { api: { bodyParser: false } }

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

// Idempotency: check if we already processed this event
async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('stripe_payment_id', eventId)
    .limit(1)
  return (data?.length ?? 0) > 0
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing signature' })

  let event: Stripe.Event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const creditAmount = session.metadata?.creditAmount
        const creditType = session.metadata?.creditType || 'universal'

        if (userId && creditAmount) {
          // Idempotency check
          if (await isEventProcessed(event.id)) break

          const amount = parseInt(creditAmount, 10)

          // Use RPC for atomic credit addition
          await supabase.rpc('deduct_credits', {
            p_user_id: userId,
            p_amount: -amount, // negative = add credits
            p_credit_type: creditType,
            p_description: `Purchased ${amount} credits`,
          })

          // Also record with stripe event ID for idempotency
          await supabase.from('credit_transactions').insert({
            user_id: userId,
            amount,
            type: 'purchase',
            credit_type: creditType,
            description: `Purchased ${amount} credits`,
            stripe_payment_id: event.id,
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const priceId = subscription.items.data[0]?.price?.id || ''
          const plan = Object.keys(PLAN_CREDITS).find((p) => priceId.includes(p)) || 'free'
          const periodEnd = (subscription as any).current_period_end

          await supabase.from('profiles').update({
            subscription_plan: plan,
            subscription_status: subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'trialing' : 'past_due',
            subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            profile_limit: PLAN_PROFILES[plan] || 3,
          }).eq('id', profile.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase.from('profiles').update({
            subscription_plan: 'free',
            subscription_status: 'cancelled',
            profile_limit: 3,
          }).eq('id', profile.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason === 'subscription_cycle') {
          // Idempotency check
          if (await isEventProcessed(event.id)) break

          const customerId = invoice.customer as string

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_plan')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile && profile.subscription_plan !== 'free') {
            const credits = PLAN_CREDITS[profile.subscription_plan] || 0
            if (credits > 0) {
              // Atomic credit addition via RPC
              await supabase.rpc('deduct_credits', {
                p_user_id: profile.id,
                p_amount: -credits, // negative = add
                p_credit_type: 'universal',
                p_description: `Monthly ${profile.subscription_plan} plan credits`,
              })

              await supabase.from('credit_transactions').insert({
                user_id: profile.id,
                amount: credits,
                type: 'subscription',
                credit_type: 'universal',
                description: `Monthly ${profile.subscription_plan} plan credits`,
                stripe_payment_id: event.id,
                stripe_subscription_id: (invoice as any).subscription as string,
              })
            }
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }

  return res.status(200).json({ received: true })
}
