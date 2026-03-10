import { Link } from 'react-router-dom'
import SEOHead from '@/components/SEOHead'
import Header from '@/components/Header'
import { MessageCircle, Phone, Shield, Heart, Star, ChevronRight, Upload, Sparkles } from 'lucide-react'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TalkToYouAI',
  url: 'https://talktoyouai.com',
  description: 'AI-powered conversations with loved ones who have passed away. Upload chat history and talk again through text or voice.',
  applicationCategory: 'CommunicationApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier with 50 credits',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does TalkToYouAI work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upload WhatsApp chat exports with your loved one. Our AI learns their writing style, vocabulary, and personality. Then you can have text conversations or voice calls that feel authentic and personal.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data private and secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All data is stored securely with row-level security. Only you can access your conversations and profiles. We never share your data with third parties.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I hear their voice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can upload voice samples to create a voice clone, then have real-time voice calls with an AI that sounds like your loved one.',
      },
    },
  ],
}

const testimonials = [
  { name: 'Sarah M.', text: 'Being able to text my mom again brought me so much peace. The AI really captured her warmth.', rating: 5 },
  { name: 'James K.', text: 'I was skeptical, but hearing my father\'s voice again... it helped me process grief I\'d been carrying for years.', rating: 5 },
  { name: 'Maria L.', text: 'The WhatsApp import feature is brilliant. It really does sound like my sister wrote those messages.', rating: 5 },
]

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="Talk to Your Loved Ones Again - AI-Powered Conversations"
        description="Reconnect with loved ones who have passed away through AI-powered text and voice conversations. Upload chat history and hear their voice again."
        path="/"
        jsonLd={jsonLd}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Talk to Your Loved Ones{' '}
                <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Again</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                AI-powered conversations that capture their unique voice, personality, and warmth.
                Upload chat history and reconnect through text or voice calls.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start for Free <ChevronRight className="w-5 h-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 rounded-xl bg-white text-gray-700 font-semibold text-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
                >
                  See How It Works
                </a>
              </div>
              <p className="mt-4 text-sm text-gray-500">50 free credits on signup. No credit card required.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">Reconnect in Meaningful Ways</h2>
            <p className="mt-4 text-gray-600 text-center max-w-2xl mx-auto">Our AI learns from real conversations to create authentic, personal interactions.</p>
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              {[
                { icon: MessageCircle, title: 'Text Conversations', desc: 'Chat naturally with an AI that mirrors their writing style, vocabulary, and personality from real messages.' },
                { icon: Phone, title: 'Voice Calls', desc: 'Have real-time voice conversations using advanced voice synthesis that captures their unique sound.' },
                { icon: Shield, title: 'Private & Secure', desc: 'Your memories are sacred. End-to-end security with row-level access control. Only you see your data.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="mt-3 text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">How It Works</h2>
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              {[
                { icon: Upload, step: '1', title: 'Upload Memories', desc: 'Export your WhatsApp chat history and upload it. Add photos, notes, and voice samples for a richer experience.' },
                { icon: Sparkles, step: '2', title: 'AI Learns Their Style', desc: 'Our AI analyzes their unique way of writing - their words, humor, warmth, and personality shine through.' },
                { icon: Heart, step: '3', title: 'Reconnect', desc: 'Start chatting or make a voice call. Experience conversations that feel genuinely like talking to them again.' },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="relative p-8 bg-white rounded-2xl shadow-md">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white font-bold">
                    {step}
                  </div>
                  <Icon className="w-8 h-8 text-orange-500 mt-2" />
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="mt-3 text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">What People Are Saying</h2>
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div key={t.name} className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 shadow-md">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">"{t.text}"</p>
                  <p className="mt-4 font-semibold text-gray-900">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <SEOHead title="FAQ" description="" jsonLd={faqJsonLd} />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">Frequently Asked Questions</h2>
            <div className="mt-12 space-y-6">
              {faqJsonLd.mainEntity.map((faq) => (
                <details key={faq.name} className="bg-white rounded-2xl shadow-sm p-6 group">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                    {faq.name}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-4 text-gray-600">{faq.acceptedAnswer.text}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-orange-500 to-rose-500">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Reconnect?</h2>
            <p className="mt-4 text-lg text-white/90">Start with 50 free credits. No credit card required.</p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-orange-600 font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Get Started Free <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="font-bold text-lg text-white">TalkToYouAI</span>
              </div>
              <p className="text-sm">Reconnect with loved ones through AI-powered conversations.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Get Started</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/contact" className="block hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-center">
            &copy; {new Date().getFullYear()} TalkToYouAI. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
