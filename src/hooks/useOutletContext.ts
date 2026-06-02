import { useOutletContext as useRouterOutletContext } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

export interface AppOutletContext {
  profile: Profile
  session: Session
}

export function useAppOutletContext() {
  return useRouterOutletContext<AppOutletContext>()
}
