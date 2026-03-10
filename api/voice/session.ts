import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { personalityId, userId, voiceConfig } = req.body || {}
  if (!personalityId || !userId) return res.status(400).json({ error: 'Missing required fields' })

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  // Deduct initial 25 credits (1 minute)
  const { data: creditResult } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: 25,
    p_credit_type: 'universal',
    p_description: 'Voice call (1 min)',
  })
  if (!creditResult?.[0]?.success) return res.status(402).json({ error: 'Insufficient credits' })

  // Get personality for system prompt
  const { data: personality } = await supabase
    .from('personality_profiles')
    .select('name, relationship, system_prompt')
    .eq('id', personalityId)
    .eq('user_id', userId)
    .single()
  if (!personality) return res.status(404).json({ error: 'Profile not found' })

  // Determine voice
  let voice = 'alloy'
  if (voiceConfig?.type === 'cloned' && voiceConfig?.clonedVoiceId) {
    voice = voiceConfig.clonedVoiceId
  } else if (voiceConfig?.standardVoice) {
    voice = voiceConfig.standardVoice
  }

  // Create OpenAI Realtime session
  const openaiRes = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview',
      voice,
      instructions: personality.system_prompt || `You are ${personality.name}, the user's ${personality.relationship}. Be warm and authentic.`,
      input_audio_transcription: { model: 'whisper-1' },
    }),
  })

  if (!openaiRes.ok) {
    const errText = await openaiRes.text()
    console.error('OpenAI Realtime error:', errText)
    return res.status(500).json({ error: 'Failed to create voice session' })
  }

  const sessionData = await openaiRes.json()

  // Record voice session
  const { data: voiceSession } = await supabase.from('voice_sessions').insert({
    user_id: userId,
    personality_id: personalityId,
    openai_session_id: sessionData.id,
    credits_used: 25,
    status: 'active',
  }).select('id').single()

  return res.status(200).json({
    clientSecret: sessionData.client_secret?.value,
    sessionId: voiceSession?.id,
  })
}
