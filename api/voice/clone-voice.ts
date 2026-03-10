import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { personalityId, userId, voiceName } = req.body || {}
  if (!personalityId || !userId || !voiceName) return res.status(400).json({ error: 'Missing required fields' })

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  // Deduct 10 credits for voice cloning
  const { data: creditResult } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: 10,
    p_credit_type: 'universal',
    p_description: 'Voice cloning',
  })
  if (!creditResult?.[0]?.success) return res.status(402).json({ error: 'Insufficient credits' })

  // Get voice samples from profile_data
  const { data: profileData } = await supabase
    .from('profile_data')
    .select('voice_samples')
    .eq('personality_id', personalityId)
    .eq('user_id', userId)
    .single()

  if (!profileData?.voice_samples?.length) {
    return res.status(400).json({ error: 'No voice samples uploaded' })
  }

  // Download voice samples and send to ElevenLabs
  const formData = new FormData()
  formData.append('name', voiceName)

  for (const sample of profileData.voice_samples) {
    const audioRes = await fetch(sample.url)
    const blob = await audioRes.blob()
    formData.append('files', blob, sample.filename)
  }

  const elevenLabsRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: formData,
  })

  if (!elevenLabsRes.ok) {
    const errText = await elevenLabsRes.text()
    console.error('ElevenLabs error:', errText)
    return res.status(500).json({ error: 'Voice cloning failed' })
  }

  const elevenLabsData = await elevenLabsRes.json()
  const voiceId = elevenLabsData.voice_id

  // Save voice clone record
  await supabase.from('voice_clones').insert({
    user_id: userId,
    personality_id: personalityId,
    elevenlabs_voice_id: voiceId,
    voice_name: voiceName,
    status: 'active',
  })

  // Update personality voice config
  await supabase.from('personality_profiles').update({
    voice_config: { type: 'cloned', clonedVoiceId: voiceId },
  }).eq('id', personalityId)

  return res.status(200).json({ voiceId, voiceName })
}
