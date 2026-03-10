import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { audioBase64, mimeType } = req.body || {}
  if (!audioBase64) return res.status(400).json({ error: 'Missing audio data' })

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const audioBuffer = Buffer.from(audioBase64, 'base64')
  const ext = mimeType?.includes('wav') ? 'wav' : mimeType?.includes('webm') ? 'webm' : 'mp3'

  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer]), `audio.${ext}`)
  formData.append('model', 'whisper-1')

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!whisperRes.ok) {
    console.error('Whisper error:', await whisperRes.text())
    return res.status(500).json({ error: 'Transcription failed' })
  }

  const data = await whisperRes.json()
  return res.status(200).json({ text: data.text })
}
