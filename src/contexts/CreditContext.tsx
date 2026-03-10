import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { CREDIT_COSTS } from '@/lib/stripe'

interface CreditContextType {
  credits: number
  textCredits: number
  voiceCredits: number
  totalCredits: number
  subscriptionPlan: string
  canSendMessage: boolean
  canMakeCall: (minutes: number) => boolean
  canCloneVoice: boolean
  deductCredits: (amount: number, creditType: string, description: string) => Promise<{ success: boolean; remaining: number }>
  refreshCredits: () => Promise<void>
}

const CreditContext = createContext<CreditContextType | undefined>(undefined)

export function CreditProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile, session } = useAuth()

  const credits = profile?.credits ?? 0
  const textCredits = profile?.text_credits ?? 0
  const voiceCredits = profile?.voice_credits ?? 0
  const totalCredits = credits + textCredits + voiceCredits
  const subscriptionPlan = profile?.subscription_plan ?? 'free'

  const canSendMessage = credits >= CREDIT_COSTS.textMessage || textCredits >= CREDIT_COSTS.textMessage
  const canCloneVoice = credits >= CREDIT_COSTS.voiceClone || voiceCredits >= CREDIT_COSTS.voiceClone

  function canMakeCall(minutes: number) {
    const cost = minutes * CREDIT_COSTS.voiceCallPerMinute
    return credits >= cost || voiceCredits >= cost
  }

  const deductCredits = useCallback(async (amount: number, creditType: string, description: string) => {
    if (!session?.access_token) return { success: false, remaining: 0 }

    const res = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId: profile?.id,
        amount,
        creditType,
        description,
      }),
    })

    const data = await res.json()
    if (data.success) await refreshProfile()
    return data
  }, [session, profile, refreshProfile])

  const refreshCredits = useCallback(async () => {
    await refreshProfile()
  }, [refreshProfile])

  return (
    <CreditContext.Provider value={{
      credits, textCredits, voiceCredits, totalCredits,
      subscriptionPlan, canSendMessage, canMakeCall, canCloneVoice,
      deductCredits, refreshCredits,
    }}>
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const ctx = useContext(CreditContext)
  if (!ctx) throw new Error('useCredits must be used within CreditProvider')
  return ctx
}
