import type { Session } from '@supabase/supabase-js'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/database'

interface LayoutProps {
  profile: Profile
  session: Session
  refreshProfile: () => Promise<void>
}

export function Layout({ profile, session, refreshProfile }: LayoutProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="container">
      <header>
        <h1>ワールドカップ予想</h1>
        <p className="muted">
          {profile.display_name} さん
          {profile.role === 'admin' && '（管理者）'}
        </p>
      </header>
      <nav className="app-nav">
        <NavLink to="/" end>
          トップ
        </NavLink>
        <NavLink to="/champion">優勝国予想</NavLink>
        <NavLink to="/champion/list">優勝国一覧</NavLink>
        <NavLink to="/matches">日本戦予想</NavLink>
        <NavLink to="/matches/list">日本戦一覧</NavLink>
        <NavLink to="/ranking">ランキング</NavLink>
        <NavLink to="/profile">名前設定</NavLink>
        {profile.role === 'admin' && <NavLink to="/admin">管理</NavLink>}
        <button type="button" className="secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </nav>
      <Outlet context={{ profile, session, refreshProfile }} />
    </div>
  )
}
