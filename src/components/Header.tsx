import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/contexts/CreditContext'
import { Menu, X, Coins, User, LogOut, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const { totalCredits } = useCredits()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-xl text-gray-900">TalkToYouAI</span>
          </Link>

          {user ? (
            <>
              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
                <div className="flex items-center gap-1 text-orange-600 font-medium">
                  <Coins className="w-4 h-4" />
                  {totalCredits}
                </div>
                <Link to="/account" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link to="/login" className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all duration-300">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {menuOpen && user && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</Link>
            <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Pricing</Link>
            <Link to="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Account</Link>
            <div className="px-4 py-2 flex items-center gap-1 text-orange-600 font-medium">
              <Coins className="w-4 h-4" /> {totalCredits} credits
            </div>
            <button onClick={() => { handleSignOut(); setMenuOpen(false) }} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
              Sign Out
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}
