import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { text, voiceId } = req.body || {}
  if (!text || !voiceId) return res.status(400).json({ error: 'Missing required fields' })
  if (typeof text !== 'string' || text.length > 5000) return res.status(400).json({ error: 'Invalid text' })

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const elevenLabsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!elevenLabsRes.ok) {
    console.error('ElevenLabs TTS error:', await elevenLabsRes.text())
    return res.status(500).json({ error: 'Text-to-speech failed' })
  }

  const audioBuffer = await elevenLabsRes.arrayBuffer()
  const audioBase64 = Buffer.from(audioBuffer).toString('base64')

  return res.status(200).json({ audioBase64 })
}
