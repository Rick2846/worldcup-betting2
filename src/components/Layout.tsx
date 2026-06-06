import type { Session } from '@supabase/supabase-js'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { SITE_SHORT, SITE_TITLE } from '../constants/branding'
import { supabase } from '../lib/supabaseClient'
import { Badge } from './ui/Badge'
import type { Profile } from '../types/database'

interface LayoutProps {
  profile: Profile
  session: Session
  refreshProfile: () => Promise<void>
}

const NAV_ITEMS = [
  { to: '/', end: true, label: 'トップ', icon: '⌂' },
  { to: '/champion', label: '優勝国', icon: '★' },
  { to: '/matches', label: '日本戦', icon: '⚑' },
  { to: '/ranking', label: '順位', icon: '▲' },
  { to: '/profile', label: '設定', icon: '◎' },
] as const

export function Layout({ profile, session, refreshProfile }: LayoutProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__brand">
          <p className="site-header__eyebrow">G1 World Cup</p>
          <h1 className="site-header__title">
            <span className="site-header__title-full">{SITE_TITLE}</span>
            <span className="site-header__title-short">{SITE_SHORT}</span>
          </h1>
        </div>
        <div className="site-header__user">
          <span className="site-header__name">{profile.display_name} さん</span>
          {profile.role === 'admin' && <Badge variant="gold">管理者</Badge>}
        </div>
      </header>

      <nav className="mobile-sub-nav" aria-label="サブメニュー">
        <NavLink to="/champion/list">優勝国一覧</NavLink>
        <NavLink to="/matches/list">日本戦一覧</NavLink>
        {profile.role === 'admin' && <NavLink to="/admin">管理</NavLink>}
        <button type="button" className="mobile-sub-nav__logout" onClick={handleLogout}>
          ログアウト
        </button>
      </nav>

      <nav className="site-nav" aria-label="メインナビゲーション">
        {NAV_ITEMS.map(({ to, label, icon, ...rest }) => (
          <NavLink key={to} to={to} {...rest}>
            <span aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
        <NavLink to="/champion/list">優勝国一覧</NavLink>
        <NavLink to="/matches/list">日本戦一覧</NavLink>
        {profile.role === 'admin' && <NavLink to="/admin">管理</NavLink>}
        <button type="button" className="secondary site-nav__logout" onClick={handleLogout}>
          ログアウト
        </button>
      </nav>

      <main className="main-content">
        <Outlet context={{ profile, session, refreshProfile }} />
      </main>

      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {NAV_ITEMS.map(({ to, label, icon, ...rest }) => (
          <NavLink key={to} to={to} {...rest}>
            <span className="mobile-nav__icon" aria-hidden="true">
              {icon}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
