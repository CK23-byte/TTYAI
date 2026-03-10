import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 60
const RATE_WINDOW = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(userId)
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { personalityId, message, userId } = req.body || {}
  if (!personalityId || !message || !userId) return res.status(400).json({ error: 'Missing required fields' })
  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 5000) {
    return res.status(400).json({ error: 'Invalid message' })
  }

  if (!checkRateLimit(userId)) return res.status(429).json({ error: 'Rate limit exceeded' })

  // Verify user auth
  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  // Deduct credit
  const { data: creditResult } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: 1,
    p_credit_type: 'universal',
    p_description: 'Text message',
  })
  if (!creditResult?.[0]?.success) return res.status(402).json({ error: 'Insufficient credits' })

  // Get personality
  const { data: personality } = await supabase
    .from('personality_profiles')
    .select('*')
    .eq('id', personalityId)
    .eq('user_id', userId)
    .single()
  if (!personality) return res.status(404).json({ error: 'Profile not found' })

  // Get recent messages for context
  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('personality_id', personalityId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  const conversationHistory = (recentMessages || []).reverse().map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Call Claude API
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: personality.system_prompt || `You are ${personality.name}, the user's ${personality.relationship}. Be warm and authentic.`,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message.trim() },
      ],
    }),
  })

  if (!claudeRes.ok) {
    const errText = await claudeRes.text()
    console.error('Claude API error:', errText)
    return res.status(500).json({ error: 'AI service error' })
  }

  const claudeData = await claudeRes.json()
  const responseText = claudeData.content?.[0]?.text || 'I could not generate a response.'
  const tokensUsed = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)

  // Save both messages
  await supabase.from('chat_messages').insert([
    {
      user_id: userId,
      personality_id: personalityId,
      role: 'user',
      content: message.trim(),
      tokens_used: 0,
      credits_cost: 1,
    },
    {
      user_id: userId,
      personality_id: personalityId,
      role: 'assistant',
      content: responseText,
      tokens_used: tokensUsed,
      credits_cost: 0,
    },
  ])

  // Update personality message count
  await supabase
    .from('personality_profiles')
    .update({
      message_count: (personality.message_count || 0) + 2,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', personalityId)

  return res.status(200).json({
    response: responseText,
    tokensUsed,
    creditsRemaining: creditResult[0].remaining,
  })
}
