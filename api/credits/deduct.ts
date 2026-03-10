import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const { userId, amount, creditType, description } = req.body || {}
  if (!userId || !amount || !creditType) return res.status(400).json({ error: 'Missing required fields' })
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  // Verify user
  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_credit_type: creditType,
    p_description: description || null,
  })

  if (error) return res.status(500).json({ error: 'Failed to deduct credits' })

  const result = data?.[0]
  return res.status(200).json({
    success: result?.success ?? false,
    remaining: result?.remaining ?? 0,
  })
}
