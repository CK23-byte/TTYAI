import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePersonalityProfile } from '@/hooks/useProfile'
import { useVoiceCall } from '@/hooks/useVoiceCall'
import { useCredits } from '@/contexts/CreditContext'
import SEOHead from '@/components/SEOHead'
import { Phone, PhoneOff, ArrowLeft, Loader2, UserCircle, Mic, MicOff, Coins } from 'lucide-react'
import { useState } from 'react'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function VoiceCallPage() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const { personality, loading } = usePersonalityProfile(profileId)
  const { totalCredits } = useCredits()
  const [muted, setMuted] = useState(false)

  const {
    isConnected,
    isConnecting,
    duration,
    error,
    transcript,
    startCall,
    endCall,
  } = useVoiceCall({
    personality: personality!,
    onTranscriptUpdate: () => {},
  })

  async function handleEndCall() {
    await endCall()
    navigate('/dashboard')
  }

  if (loading || !personality) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <SEOHead title={`Call ${personality.name}`} description={`Voice call with ${personality.name}`} path={`/call/${profileId}`} />
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Coins className="w-4 h-4 text-green-400" />
            {totalCredits} credits
          </div>
        </div>

        {/* Call Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${isConnected ? 'bg-green-500/20 ring-4 ring-green-400/30 animate-pulse' : 'bg-white/10'}`}>
            {personality.photo_url ? (
              <img src={personality.photo_url} alt={personality.name} className="w-28 h-28 rounded-full object-cover" />
            ) : (
              <UserCircle className="w-20 h-20 text-white/60" />
            )}
          </div>
          <h1 className="text-2xl font-bold">{personality.name}</h1>
          <p className="text-gray-400 mt-1">{personality.relationship}</p>

          {isConnected && (
            <p className="text-green-400 font-mono text-lg mt-4">{formatDuration(duration)}</p>
          )}
          {isConnecting && (
            <p className="text-gray-400 mt-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
            </p>
          )}
          {!isConnected && !isConnecting && (
            <p className="text-gray-500 mt-4">25 credits per minute</p>
          )}
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="mt-8 w-full max-w-md max-h-48 overflow-y-auto space-y-2 bg-white/5 rounded-2xl p-4">
              {transcript.map((entry, i) => (
                <p key={i} className={`text-sm ${entry.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                  <span className="font-medium">{entry.role === 'user' ? 'You' : personality.name}:</span> {entry.content}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-8 flex items-center justify-center gap-6">
          {isConnected ? (
            <>
              <button
                onClick={() => setMuted(!muted)}
                className={`p-4 rounded-full ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'} hover:bg-white/20 transition-colors`}
              >
                {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button
                onClick={handleEndCall}
                className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </>
          ) : (
            <button
              onClick={startCall}
              disabled={isConnecting}
              className="p-5 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 transition-all hover:scale-105"
            >
              <Phone className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
