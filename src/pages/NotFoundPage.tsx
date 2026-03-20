import { Link } from 'react-router-dom'
import SEOHead from '@/components/SEOHead'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <>
      <SEOHead title="Page Not Found" description="The page you're looking for doesn't exist." path="/404" />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center mb-6">
            <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">404</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="mt-3 text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-xl bg-white text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
