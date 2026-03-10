import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCredits } from '@/contexts/CreditContext'
import { usePersonalityProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import SEOHead from '@/components/SEOHead'
import type { ChatMessage } from '@/types'
import { Send, ArrowLeft, Phone, Loader2, UserCircle, Coins } from 'lucide-react'

export default function ChatPage() {
  const { profileId } = useParams<{ profileId: string }>()
  const { user, session } = useAuth()
  const { canSendMessage, totalCredits } = useCredits()
  const { personality, loading: profileLoading } = usePersonalityProfile(profileId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileId || !user) return
    async function loadMessages() {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('personality_id', profileId)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
        .limit(100)
      if (data) setMessages(data as ChatMessage[])
      setLoadingMessages(false)
    }
    loadMessages()
  }, [profileId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !session?.access_token || !profileId || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user!.id,
      personality_id: profileId,
      role: 'user',
      content: userMessage,
      tokens_used: 0,
      credits_cost: 0,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          personalityId: profileId,
          message: userMessage,
          userId: user!.id,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to send message')
      }

      const data = await res.json()
      const assistantMsg: ChatMessage = {
        id: data.messageId || crypto.randomUUID(),
        user_id: user!.id,
        personality_id: profileId,
        role: 'assistant',
        content: data.response,
        tokens_used: data.tokensUsed || 0,
        credits_cost: 1,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user!.id,
        personality_id: profileId,
        role: 'system',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        tokens_used: 0,
        credits_cost: 0,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  if (profileLoading || loadingMessages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <SEOHead title={`Chat with ${personality?.name || 'Profile'}`} description="Have a conversation with your loved one." path={`/chat/${profileId}`} />
      <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {/* Chat Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            {personality?.photo_url ? (
              <img src={personality.photo_url} alt={personality.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900">{personality?.name}</h1>
              <p className="text-xs text-gray-500">{personality?.relationship}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Coins className="w-4 h-4 text-orange-500" />
            {totalCredits}
          </div>
          <Link to={`/call/${profileId}`} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
            <Phone className="w-5 h-5" />
          </Link>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center mb-4">
                <UserCircle className="w-10 h-10 text-orange-400" />
              </div>
              <p className="text-gray-500">Start a conversation with {personality?.name}</p>
              <p className="text-sm text-gray-400 mt-1">Say hello and reconnect.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                    : msg.role === 'system'
                    ? 'bg-red-50 text-red-600 text-sm'
                    : 'bg-white shadow-sm text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 bg-white/90 backdrop-blur-md px-4 py-3">
          {!canSendMessage ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">You're out of credits.</p>
              <Link to="/pricing" className="text-orange-600 font-medium text-sm hover:underline">Get more credits</Link>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${personality?.name}...`}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white disabled:opacity-40 hover:shadow-lg transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
