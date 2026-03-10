import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { sessionId, transcript, durationSeconds } = req.body || {}
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' })

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Get session
  const { data: session } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()
  if (!session) return res.status(404).json({ error: 'Session not found' })

  // Calculate additional minutes beyond the first
  const totalMinutes = Math.ceil((durationSeconds || 0) / 60)
  const additionalMinutes = Math.max(0, totalMinutes - 1) // First minute already charged
  const additionalCredits = additionalMinutes * 25

  if (additionalCredits > 0) {
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: additionalCredits,
      p_credit_type: 'universal',
      p_description: `Voice call (${additionalMinutes} additional min)`,
    })
  }

  // Generate summary from transcript
  let summary = null
  if (transcript && transcript.length > 0) {
    const transcriptText = transcript
      .map((t: { role: string; content: string }) => `${t.role}: ${t.content}`)
      .join('\n')
    summary = `Call lasted ${totalMinutes} minute(s) with ${transcript.length} exchanges.`

    // Optionally summarize with Claude if transcript is long
    if (transcript.length > 5) {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: `Summarize this voice call transcript in 2-3 sentences:\n\n${transcriptText}`,
            }],
          }),
        })
        if (claudeRes.ok) {
          const data = await claudeRes.json()
          summary = data.content?.[0]?.text || summary
        }
      } catch {
        // Keep default summary
      }
    }
  }

  // Update session
  await supabase.from('voice_sessions').update({
    status: 'ended',
    duration_seconds: durationSeconds || 0,
    credits_used: 25 + additionalCredits,
    transcript: transcript || [],
    summary,
    ended_at: new Date().toISOString(),
  }).eq('id', sessionId)

  return res.status(200).json({ summary })
}
