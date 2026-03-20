import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(ip)
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + 3600_000 }) // 1 hour window
    return true
  }
  if (entry.count >= 5) return false // max 5 submissions per hour
  entry.count++
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, subject, message } = req.body || {}

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.length > 200) {
    return res.status(400).json({ error: 'Invalid name' })
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  if (!subject || typeof subject !== 'string' || subject.length > 200) {
    return res.status(400).json({ error: 'Invalid subject' })
  }
  if (!message || typeof message !== 'string' || message.trim().length < 1 || message.length > 5000) {
    return res.status(400).json({ error: 'Invalid message' })
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' })
  }

  try {
    // Store in Supabase as a simple contact_submissions record
    // This table is optional - if it doesn't exist, we just log it
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        ip_address: ip,
      })

    if (dbError) {
      // Table may not exist yet - just log and continue
      console.log('Contact submission (no DB table):', { name: name.trim(), email: email.trim(), subject: subject.trim() })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return res.status(500).json({ error: 'Failed to submit' })
  }
}
