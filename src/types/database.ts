export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  credits: number
  text_credits: number
  voice_credits: number
  profile_limit: number
  stripe_customer_id: string | null
  subscription_plan: 'free' | 'starter' | 'pro' | 'premium'
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  subscription_period_end: string | null
  created_at: string
  updated_at: string
}

export interface PersonalityProfile {
  id: string
  user_id: string
  name: string
  relationship: string
  system_prompt: string | null
  photo_url: string | null
  voice_config: VoiceConfig
  message_count: number
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface VoiceConfig {
  type: 'standard' | 'cloned'
  standardVoice?: string
  clonedVoiceId?: string
}

export interface ChatMessage {
  id: string
  user_id: string
  personality_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number
  credits_cost: number
  created_at: string
}

export interface VoiceSession {
  id: string
  user_id: string
  personality_id: string
  openai_session_id: string | null
  duration_seconds: number
  credits_used: number
  status: 'active' | 'ended' | 'failed'
  transcript: TranscriptEntry[]
  summary: string | null
  created_at: string
  ended_at: string | null
}

export interface TranscriptEntry {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface VoiceClone {
  id: string
  user_id: string
  personality_id: string
  elevenlabs_voice_id: string
  voice_name: string
  status: 'active' | 'processing' | 'failed' | 'deleted'
  created_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'subscription'
  credit_type: 'universal' | 'text' | 'voice'
  description: string | null
  stripe_payment_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface ProfileData {
  id: string
  user_id: string
  personality_id: string
  text_notes: string[]
  chat_archives: ChatArchive[]
  photos: PhotoEntry[]
  voice_samples: VoiceSample[]
  created_at: string
  updated_at: string
}

export interface ChatArchive {
  filename: string
  messageCount: number
  uploadedAt: string
  parsedData?: ParsedMessage[]
}

export interface ParsedMessage {
  timestamp: string
  sender: string
  content: string
}

export interface PhotoEntry {
  url: string
  caption?: string
  uploadedAt: string
}

export interface VoiceSample {
  url: string
  filename: string
  durationSeconds: number
  uploadedAt: string
}
