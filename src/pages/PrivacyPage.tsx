import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'

export default function PrivacyPage() {
  return (
    <>
      <SEOHead title="Privacy Policy" description="Learn how TalkToYouAI protects your privacy and handles your personal data. GDPR compliant." path="/privacy" />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-16">
        <article className="max-w-3xl mx-auto px-4 bg-white rounded-2xl shadow-md p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly: email address, display name, uploaded chat exports, voice recordings, and photos. We also collect usage data such as conversation metadata and credit usage.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>Your data is used exclusively to provide the TalkToYouAI service: creating AI personality profiles, generating conversational responses, voice synthesis, and account management. We never sell your personal data.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Data Storage & Security</h2>
              <p>All data is stored securely using Supabase with row-level security policies. Only you can access your profiles, messages, and uploaded content. API communications are encrypted via HTTPS.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Third-Party Services</h2>
              <p>We use the following third-party services to provide our features:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Supabase - Authentication and database</li>
                <li>Anthropic (Claude) - AI text generation</li>
                <li>OpenAI - Voice conversations and transcription</li>
                <li>ElevenLabs - Voice cloning and synthesis</li>
                <li>Stripe - Payment processing</li>
                <li>Vercel - Hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights (GDPR)</h2>
              <p>You have the right to access, correct, delete, or export your personal data. You can delete your account and all associated data at any time from your account settings. To exercise these rights, contact us at privacy@talktoyouai.com.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
              <p>We retain your data for as long as your account is active. When you delete your account, all personal data including chat messages, profiles, and uploaded files are permanently deleted within 30 days.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies</h2>
              <p>We use essential cookies only for authentication and session management. We do not use tracking cookies or third-party advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
              <p>For privacy-related inquiries, contact us at privacy@talktoyouai.com.</p>
            </section>
          </div>
        </article>
      </main>
    </>
  )
}
