-- ============================================
-- TalkToYouAI - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  text_credits INTEGER NOT NULL DEFAULT 0,
  voice_credits INTEGER NOT NULL DEFAULT 0,
  profile_limit INTEGER DEFAULT 3,
  stripe_customer_id TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'premium')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  subscription_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 2. PERSONALITY PROFILES (AI personalities)
-- ============================================
CREATE TABLE public.personality_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  system_prompt TEXT,
  photo_url TEXT,
  voice_config JSONB DEFAULT '{"type": "standard", "standardVoice": "alloy"}'::jsonb,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER personality_profiles_updated_at
  BEFORE UPDATE ON public.personality_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own personalities"
  ON public.personality_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access personalities"
  ON public.personality_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_personality_profiles_user ON public.personality_profiles(user_id);

-- ============================================
-- 3. CHAT MESSAGES
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personality_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  credits_cost INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access messages"
  ON public.chat_messages FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_chat_messages_personality ON public.chat_messages(personality_id, created_at);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

-- ============================================
-- 4. VOICE SESSIONS
-- ============================================
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personality_profiles(id) ON DELETE CASCADE,
  openai_session_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'failed')),
  transcript JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own voice sessions"
  ON public.voice_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access voice_sessions"
  ON public.voice_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_voice_sessions_user ON public.voice_sessions(user_id);

-- ============================================
-- 5. VOICE CLONES
-- ============================================
CREATE TABLE public.voice_clones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personality_profiles(id) ON DELETE CASCADE,
  elevenlabs_voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'failed', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.voice_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own voice clones"
  ON public.voice_clones FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access voice_clones"
  ON public.voice_clones FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 6. CREDIT TRANSACTIONS
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'subscription')),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('universal', 'text', 'voice')),
  description TEXT,
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);

-- ============================================
-- 7. PROFILE DATA (text notes, chat archives, photos metadata)
-- ============================================
CREATE TABLE public.profile_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personality_profiles(id) ON DELETE CASCADE,
  text_notes TEXT[] DEFAULT '{}',
  chat_archives JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  voice_samples JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, personality_id)
);

CREATE TRIGGER profile_data_updated_at
  BEFORE UPDATE ON public.profile_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.profile_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own profile data"
  ON public.profile_data FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access profile_data"
  ON public.profile_data FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 8. CONTACT SUBMISSIONS (optional)
-- ============================================
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed - only service role writes to this
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access contact"
  ON public.contact_submissions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 9. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, credits, text_credits, voice_credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    50,  -- 50 universal signup bonus credits
    0,
    0
  );

  -- Log signup bonus
  INSERT INTO public.credit_transactions (user_id, amount, type, credit_type, description)
  VALUES (NEW.id, 50, 'bonus', 'universal', 'Welcome bonus - 50 free credits');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Deduct credits (called from serverless functions with service role)
-- Supports negative p_amount to ADD credits (used by webhook)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  v_current INTEGER;
  v_column TEXT;
  v_actual_deduct INTEGER;
BEGIN
  -- Determine which column to deduct from
  IF p_credit_type = 'text' THEN
    v_column := 'text_credits';
  ELSIF p_credit_type = 'voice' THEN
    v_column := 'voice_credits';
  ELSE
    v_column := 'credits';
  END IF;

  -- Get current balance (with row lock)
  EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1 FOR UPDATE', v_column)
    INTO v_current USING p_user_id;

  IF v_current IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- If p_amount is negative, we're adding credits
  IF p_amount < 0 THEN
    v_actual_deduct := p_amount; -- negative value = addition
  ELSE
    -- Check sufficient balance for deduction
    IF v_current < p_amount THEN
      RETURN QUERY SELECT false, v_current;
      RETURN;
    END IF;
    v_actual_deduct := p_amount;
  END IF;

  -- Update balance
  EXECUTE format('UPDATE public.profiles SET %I = %I - $1 WHERE id = $2', v_column, v_column)
    USING v_actual_deduct, p_user_id;

  -- Log transaction (only for deductions, additions are logged separately by webhook)
  IF p_amount > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, type, credit_type, description)
    VALUES (p_user_id, -p_amount, 'usage', p_credit_type, p_description);
  END IF;

  RETURN QUERY SELECT true, (v_current - v_actual_deduct);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. STORAGE BUCKETS (run in Supabase Dashboard)
-- ============================================
-- Create bucket: user-uploads (public: false)
-- Policies:
--   SELECT: auth.uid()::text = (storage.foldername(name))[1]
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: auth.uid()::text = (storage.foldername(name))[1]
