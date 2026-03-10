import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/contexts/CreditContext'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'
import type { CreditTransaction } from '@/types'
import { User, Coins, CreditCard, Clock, Loader2 } from 'lucide-react'

export default function AccountPage() {
  const { profile } = useAuth()
  const { credits, textCredits, voiceCredits, subscriptionPlan } = useCredits()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setTransactions(data as CreditTransaction[])
      setLoading(false)
    }
    load()
  }, [profile])

  return (
    <>
      <SEOHead title="Account" description="Manage your account settings, credits, and subscription." path="/account" />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

          {/* Profile Info */}
          <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{profile?.display_name}</h2>
                <p className="text-gray-500">{profile?.email}</p>
              </div>
            </div>
          </section>

          {/* Credits Overview */}
          <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-500" /> Credits
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-orange-600">{credits}</p>
                <p className="text-sm text-gray-500">Universal</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-600">{textCredits}</p>
                <p className="text-sm text-gray-500">Text</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{voiceCredits}</p>
                <p className="text-sm text-gray-500">Voice</p>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" /> Subscription
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 capitalize">{subscriptionPlan} Plan</p>
                {profile?.subscription_period_end && (
                  <p className="text-sm text-gray-500">
                    Renews {new Date(profile.subscription_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <a href="/pricing" className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium hover:shadow-md transition-all">
                {subscriptionPlan === 'free' ? 'Upgrade' : 'Change Plan'}
              </a>
            </div>
          </section>

          {/* Transaction History */}
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Transaction History
            </h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.description || t.type}</p>
                      <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-semibold text-sm ${t.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
