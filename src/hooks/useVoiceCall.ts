import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { PersonalityProfile, TranscriptEntry } from '@/types'

interface UseVoiceCallOptions {
  personality: PersonalityProfile
  onTranscriptUpdate?: (entries: TranscriptEntry[]) => void
}

export function useVoiceCall({ personality, onTranscriptUpdate }: UseVoiceCallOptions) {
  const { session } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const transcriptRef = useRef<TranscriptEntry[]>([])
  const durationRef = useRef(0)

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          durationRef.current = d + 1
          return d + 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isConnected])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  const startCall = useCallback(async () => {
    if (!session?.access_token) {
      setError('Not authenticated')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          personalityId: personality.id,
          userId: session.user.id,
          voiceConfig: personality.voice_config,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create voice session')
      }

      const { clientSecret, sessionId } = await res.json()
      sessionIdRef.current = sessionId

      const pc = new RTCPeerConnection()
      peerConnectionRef.current = pc

      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioElRef.current = audioEl
      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0] }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      const dc = pc.createDataChannel('oai-events')
      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          if (event.type === 'response.audio_transcript.done') {
            const entry: TranscriptEntry = {
              role: 'assistant',
              content: event.transcript,
              timestamp: Date.now(),
            }
            setTranscript((prev) => {
              const updated = [...prev, entry]
              onTranscriptUpdate?.(updated)
              return updated
            })
          }
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
            const entry: TranscriptEntry = {
              role: 'user',
              content: event.transcript,
              timestamp: Date.now(),
            }
            setTranscript((prev) => {
              const updated = [...prev, entry]
              onTranscriptUpdate?.(updated)
              return updated
            })
          }
        } catch {
          // ignore non-JSON messages
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      )

      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      setIsConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call')
    } finally {
      setIsConnecting(false)
    }
  }, [session, personality, onTranscriptUpdate])

  const endCall = useCallback(async () => {
    // Stop all media tracks (release microphone)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    // Clean up audio element
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      audioElRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsConnected(false)

    if (sessionIdRef.current && session?.access_token) {
      try {
        await fetch('/api/voice/end-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            transcript: transcriptRef.current,
            durationSeconds: durationRef.current,
          }),
        })
      } catch {
        // session end is best-effort
      }
    }

    sessionIdRef.current = null
    durationRef.current = 0
    setDuration(0)
    setTranscript([])
  }, [session])

  return {
    isConnected,
    isConnecting,
    duration,
    error,
    transcript,
    startCall,
    endCall,
  }
}
