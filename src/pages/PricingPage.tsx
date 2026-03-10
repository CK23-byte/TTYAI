import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from '@/lib/stripe'
import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'
import { Check, Loader2, Coins } from 'lucide-react'

export default function PricingPage() {
  const { session, user } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(planId: string) {
    if (!session?.access_token || !user) return
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: `${planId}_${billingPeriod}`,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })
      const data = await res.json()
      if (data.sessionUrl) window.location.href = data.sessionUrl
    } finally {
      setLoading(null)
    }
  }

  async function handleBuyCredits(packId: string) {
    if (!session?.access_token || !user) return
    setLoading(packId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: `credits_${packId}`,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })
      const data = await res.json()
      if (data.sessionUrl) window.location.href = data.sessionUrl
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <SEOHead
        title="Pricing"
        description="Choose a plan that fits your needs. Start free with 50 credits or upgrade for more conversations and voice calls."
        path="/pricing"
      />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
            <p className="mt-4 text-lg text-gray-600">Choose a plan or buy credits as you go.</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-white rounded-xl p-1 shadow-sm inline-flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white' : 'text-gray-600'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === 'yearly' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white' : 'text-gray-600'}`}
              >
                Yearly <span className="text-xs opacity-75">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-md p-8 relative ${plan.popular ? 'ring-2 ring-orange-400 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-gray-500">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`mt-8 w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-60`}
                >
                  {loading === plan.id ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Get {plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* Credit Packs */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Or Buy Credit Packs</h2>
            <p className="mt-2 text-gray-500 text-center">One-time purchases, no subscription required.</p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CREDIT_PACKS.map((pack) => (
                <div key={pack.id} className="bg-white rounded-2xl shadow-md p-6 text-center">
                  <Coins className="w-8 h-8 text-orange-500 mx-auto" />
                  <h3 className="mt-3 text-lg font-bold text-gray-900">{pack.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${pack.price}</p>
                  <p className="text-sm text-gray-500 mt-1">{pack.credits} credits</p>
                  <p className="text-xs text-green-600 font-medium mt-1">${pack.perCredit}/credit</p>
                  <button
                    onClick={() => handleBuyCredits(pack.id)}
                    disabled={loading === pack.id}
                    className="mt-4 w-full py-2 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading === pack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
