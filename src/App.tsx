import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '@/contexts/AuthContext'
import { CreditProvider } from '@/contexts/CreditContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CreateProfilePage from '@/pages/CreateProfilePage'
import ChatPage from '@/pages/ChatPage'
import VoiceCallPage from '@/pages/VoiceCallPage'
import ProfilePage from '@/pages/ProfilePage'
import AccountPage from '@/pages/AccountPage'
import PricingPage from '@/pages/PricingPage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import ContactPage from '@/pages/ContactPage'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CreditProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateProfilePage /></ProtectedRoute>} />
              <Route path="/chat/:profileId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/call/:profileId" element={<ProtectedRoute><VoiceCallPage /></ProtectedRoute>} />
              <Route path="/profile/:profileId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            </Routes>
          </CreditProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
