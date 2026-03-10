import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'

export default function TermsPage() {
  return (
    <>
      <SEOHead title="Terms of Service" description="Terms and conditions for using TalkToYouAI. Read about your rights and responsibilities." path="/terms" />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-16">
        <article className="max-w-3xl mx-auto px-4 bg-white rounded-2xl shadow-md p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using TalkToYouAI, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Service Description</h2>
              <p>TalkToYouAI provides AI-powered text and voice conversations based on uploaded chat history and user-provided data. The AI-generated content is not a real person and should not be treated as factual communication from the person it represents.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
              <p>You are responsible for the content you upload and must have the right to share any chat exports, voice recordings, or photos. You agree not to use the service for impersonation, fraud, or any illegal purpose.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Credits & Payments</h2>
              <p>Credits are non-refundable once used. Unused credits from purchases remain in your account indefinitely. Subscription credits are allocated monthly and do not roll over. All payments are processed securely through Stripe.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
              <p>You retain ownership of all content you upload. By using the service, you grant us a limited license to process your content solely for providing the service. We do not claim ownership of your data.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Disclaimer</h2>
              <p>TalkToYouAI is provided "as is" without warranties of any kind. AI-generated responses may not accurately reflect the personality or views of the person they represent. The service is intended as a tool for comfort and memory preservation, not as a replacement for professional grief counseling.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Limitation of Liability</h2>
              <p>TalkToYouAI shall not be liable for any indirect, incidental, or consequential damages arising from the use of the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
              <p>For questions about these terms, contact us at legal@talktoyouai.com.</p>
            </section>
          </div>
        </article>
      </main>
    </>
  )
}
