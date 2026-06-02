import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { getProfile } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import { Layout } from './Layout'
import type { Profile } from '../types/database'

export function ProtectedRoute() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    getProfile(session.user.id)
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [session])

  if (session === undefined) {
    return (
      <div className="container">
        <p>読み込み中…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <div className="container">
        <p>プロフィールを読み込み中…</p>
      </div>
    )
  }

  return <Layout profile={profile} session={session} />
}
