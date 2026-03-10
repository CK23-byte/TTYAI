import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const CREDIT_PACK_MAP: Record<string, { credits: number; name: string }> = {
  credits_small: { credits: 100, name: 'Small Credit Pack' },
  credits_medium: { credits: 500, name: 'Medium Credit Pack' },
  credits_large: { credits: 1000, name: 'Large Credit Pack' },
  credits_xl: { credits: 2500, name: 'XL Credit Pack' },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body || {}
  if (!priceId || !userId || !successUrl || !cancelUrl) return res.status(400).json({ error: 'Missing required fields' })

  // Verify user
  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail || user.email,
      metadata: { userId },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
  }

  const isSubscription = priceId.includes('starter') || priceId.includes('pro') || priceId.includes('premium')
  const creditPack = CREDIT_PACK_MAP[priceId]

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    mode: isSubscription ? 'subscription' : 'payment',
    metadata: {
      userId,
      priceId,
      ...(creditPack && { creditAmount: String(creditPack.credits), creditType: 'universal' }),
    },
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionConfig)
    return res.status(200).json({ sessionUrl: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
