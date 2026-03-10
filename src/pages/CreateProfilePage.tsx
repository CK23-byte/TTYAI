import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { parseWhatsAppExport, buildSystemPrompt } from '@/utils/whatsappParser'
import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'
import { Upload, ChevronRight, Loader2, FileText, UserCircle } from 'lucide-react'

export default function CreateProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [selectedPerson, setSelectedPerson] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setFileContent(text)
      const { participants: p } = parseWhatsAppExport(text)
      setParticipants(p)
      if (p.length > 0) setStep(2)
    }
    reader.readAsText(file)
  }

  async function handleCreate() {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const personName = selectedPerson || name
      const { messages } = parseWhatsAppExport(fileContent)
      const systemPrompt = buildSystemPrompt(personName, relationship, messages)

      const { data: personality, error: createErr } = await supabase
        .from('personality_profiles')
        .insert({
          user_id: user.id,
          name: personName,
          relationship,
          system_prompt: systemPrompt,
        })
        .select()
        .single()

      if (createErr) throw createErr

      if (fileContent) {
        await supabase.from('profile_data').insert({
          user_id: user.id,
          personality_id: personality.id,
          chat_archives: [{
            filename: 'WhatsApp Export',
            messageCount: messages.length,
            uploadedAt: new Date().toISOString(),
          }],
        })
      }

      navigate(`/chat/${personality.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEOHead title="Create Profile" description="Create a new AI personality profile from your chat history." path="/create" />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Create a Profile</h1>
          <p className="mt-2 text-gray-500 text-center">Upload a WhatsApp chat export to get started.</p>

          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
            {step === 1 && (
              <div className="space-y-6">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 cursor-pointer hover:border-orange-300 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <p className="mt-4 font-medium text-gray-700">Upload WhatsApp Export</p>
                  <p className="text-sm text-gray-400 mt-1">Select a .txt file exported from WhatsApp</p>
                  <input type="file" accept=".txt,.zip" className="hidden" onChange={handleFileUpload} />
                </label>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-gray-500">or create without chat data</span></div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Their name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                    >
                      <option value="">Select relationship</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Partner">Partner</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {name && relationship && (
                    <button
                      onClick={() => setStep(3)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                  <FileText className="w-6 h-6 text-green-600" />
                  <p className="text-green-700 font-medium">Chat file loaded successfully</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Who would you like to talk to?</label>
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setSelectedPerson(p); setName(p) }}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPerson === p ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <UserCircle className="w-8 h-8 text-gray-400" />
                        <span className="font-medium text-gray-900">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  >
                    <option value="">Select relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Partner">Partner</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {selectedPerson && relationship && (
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
                  <p className="text-gray-500">{relationship}</p>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Create Profile & Start Chatting
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
