import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PersonalityProfile, ProfileData } from '@/types'

export function usePersonalityProfiles() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<PersonalityProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('personality_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (data) setProfiles(data as PersonalityProfile[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchProfiles() }, [fetchProfiles])

  return { profiles, loading, refetch: fetchProfiles }
}

export function usePersonalityProfile(profileId: string | undefined) {
  const { user } = useAuth()
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user || !profileId) return
    setLoading(true)

    const [personalityRes, dataRes] = await Promise.all([
      supabase
        .from('personality_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('profile_data')
        .select('*')
        .eq('personality_id', profileId)
        .eq('user_id', user.id)
        .single(),
    ])

    if (personalityRes.data) setPersonality(personalityRes.data as PersonalityProfile)
    if (dataRes.data) setProfileData(dataRes.data as ProfileData)
    setLoading(false)
  }, [user, profileId])

  useEffect(() => { fetch() }, [fetch])

  return { personality, profileData, loading, refetch: fetch }
}
