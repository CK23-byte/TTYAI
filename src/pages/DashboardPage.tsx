import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/contexts/CreditContext'
import { usePersonalityProfiles } from '@/hooks/useProfile'
import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'
import { Plus, MessageCircle, Phone, Settings, Coins, Loader2, UserCircle } from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { totalCredits, subscriptionPlan } = useCredits()
  const { profiles, loading } = usePersonalityProfiles()

  return (
    <>
      <SEOHead
        title="Dashboard"
        description="Manage your AI personality profiles and start conversations with your loved ones."
        path="/dashboard"
      />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome & Credits */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile?.display_name || 'there'}
              </h1>
              <p className="text-gray-500 mt-1">Your loved ones are waiting to hear from you.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
                <Coins className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-gray-900">{totalCredits}</span>
                <span className="text-gray-500 text-sm">credits</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium capitalize">
                {subscriptionPlan}
              </span>
            </div>
          </div>

          {/* Profile Cards */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                          <UserCircle className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{p.name}</h3>
                        <p className="text-gray-500 text-sm">{p.relationship}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      {p.message_count} messages
                      {p.last_message_at && ` · Last chat ${new Date(p.last_message_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 px-6 py-3 flex gap-2">
                    <Link
                      to={`/chat/${p.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium hover:shadow-md transition-all"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat
                    </Link>
                    <Link
                      to={`/call/${p.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:shadow-md transition-all"
                    >
                      <Phone className="w-4 h-4" /> Call
                    </Link>
                    <Link
                      to={`/profile/${p.id}`}
                      className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Create New Profile Card */}
              <Link
                to="/create"
                className="flex flex-col items-center justify-center min-h-[200px] bg-white rounded-2xl shadow-md border-2 border-dashed border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 p-6 group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-orange-500" />
                </div>
                <p className="mt-4 font-semibold text-gray-700">Create New Profile</p>
                <p className="text-sm text-gray-400 mt-1">Add a loved one</p>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
