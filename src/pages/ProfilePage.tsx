import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonalityProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import SEOHead from '@/components/SEOHead'
import { ArrowLeft, Upload, FileText, Mic, Image, Save, Loader2, Plus, Trash2 } from 'lucide-react'

export default function ProfilePage() {
  const { profileId } = useParams<{ profileId: string }>()
  const { user, session } = useAuth()
  const { personality, profileData, loading, refetch } = usePersonalityProfile(profileId)
  const [activeTab, setActiveTab] = useState<'notes' | 'voice' | 'photos'>('notes')
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote() {
    if (!newNote.trim() || !user || !profileId) return
    setSaving(true)
    const currentNotes = profileData?.text_notes || []
    const updatedNotes = [...currentNotes, newNote.trim()]

    if (profileData) {
      await supabase
        .from('profile_data')
        .update({ text_notes: updatedNotes })
        .eq('id', profileData.id)
    } else {
      await supabase.from('profile_data').insert({
        user_id: user.id,
        personality_id: profileId,
        text_notes: updatedNotes,
      })
    }
    setNewNote('')
    await refetch()
    setSaving(false)
  }

  async function removeNote(index: number) {
    if (!profileData) return
    const updated = profileData.text_notes.filter((_, i) => i !== index)
    await supabase
      .from('profile_data')
      .update({ text_notes: updated })
      .eq('id', profileData.id)
    await refetch()
  }

  async function handleVoiceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user || !profileId || !session) return

    setSaving(true)
    const filePath = `${user.id}/${profileId}/voice/${Date.now()}-${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file)

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(filePath)
      const currentSamples = profileData?.voice_samples || []
      const updatedSamples = [...currentSamples, {
        url: publicUrl,
        filename: file.name,
        durationSeconds: 0,
        uploadedAt: new Date().toISOString(),
      }]

      if (profileData) {
        await supabase.from('profile_data').update({ voice_samples: updatedSamples }).eq('id', profileData.id)
      } else {
        await supabase.from('profile_data').insert({
          user_id: user.id,
          personality_id: profileId,
          voice_samples: updatedSamples,
        })
      }
      await refetch()
    }
    setSaving(false)
  }

  async function handleCloneVoice() {
    if (!profileData?.voice_samples?.length || !session?.access_token || !profileId) return
    setSaving(true)
    try {
      await fetch('/api/voice/clone-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          personalityId: profileId,
          userId: user!.id,
          voiceName: personality?.name || 'Voice Clone',
        }),
      })
      await refetch()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      </>
    )
  }

  const tabs = [
    { id: 'notes' as const, label: 'Text Notes', icon: FileText },
    { id: 'voice' as const, label: 'Voice Samples', icon: Mic },
    { id: 'photos' as const, label: 'Photos', icon: Image },
  ]

  return (
    <>
      <SEOHead title={`${personality?.name || 'Profile'} Settings`} description="Improve your AI personality profile." path={`/profile/${profileId}`} />
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900">{personality?.name}</h1>
              <p className="text-gray-500">{personality?.relationship} - Improve their AI profile</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Add memories, personality traits, and details to make conversations more authentic.</p>
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="E.g., Always called me 'sunshine', loved gardening, had a dry sense of humor..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={addNote}
                    disabled={saving || !newNote.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium disabled:opacity-40 hover:shadow-md transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Note
                  </button>
                  {profileData?.text_notes?.map((note, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                      <p className="flex-1 text-sm text-gray-700">{note}</p>
                      <button onClick={() => removeNote(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">Upload voice recordings to create a voice clone (costs 10 credits).</p>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-orange-300 transition-colors">
                    <Upload className="w-10 h-10 text-gray-400" />
                    <p className="mt-3 font-medium text-gray-700">Upload Voice Sample</p>
                    <p className="text-sm text-gray-400 mt-1">MP3, WAV, or M4A (min 30 seconds)</p>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleVoiceUpload} />
                  </label>
                  {profileData?.voice_samples?.map((sample, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <Mic className="w-5 h-5 text-gray-400" />
                      <span className="flex-1 text-sm text-gray-700">{sample.filename}</span>
                    </div>
                  ))}
                  {(profileData?.voice_samples?.length ?? 0) > 0 && (
                    <button
                      onClick={handleCloneVoice}
                      disabled={saving}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Clone Voice (10 credits)
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">Add photos to personalize the profile (optional, for your reference).</p>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-orange-300 transition-colors">
                    <Image className="w-10 h-10 text-gray-400" />
                    <p className="mt-3 font-medium text-gray-700">Upload Photo</p>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !user || !profileId) return
                      setSaving(true)
                      const filePath = `${user.id}/${profileId}/photos/${Date.now()}-${file.name}`
                      const { error: err } = await supabase.storage.from('user-uploads').upload(filePath, file)
                      if (!err) {
                        const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(filePath)
                        const currentPhotos = profileData?.photos || []
                        const updated = [...currentPhotos, { url: publicUrl, uploadedAt: new Date().toISOString() }]
                        if (profileData) {
                          await supabase.from('profile_data').update({ photos: updated }).eq('id', profileData.id)
                        } else {
                          await supabase.from('profile_data').insert({ user_id: user.id, personality_id: profileId, photos: updated })
                        }
                        await refetch()
                      }
                      setSaving(false)
                    }} />
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {profileData?.photos?.map((photo, i) => (
                      <img key={i} src={photo.url} alt="" className="w-full aspect-square object-cover rounded-xl" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
