import { SITE_CATCHCOPY, SITE_TITLE } from '../constants/branding'

interface AuthShellProps {
  children: React.ReactNode
  subtitle?: string
}

export function AuthShell({ children, subtitle }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__hero">
        <p className="auth-shell__eyebrow">Members Only</p>
        <h1 className="auth-shell__title">{SITE_TITLE}</h1>
        <p className="auth-shell__catchcopy">{SITE_CATCHCOPY}</p>
        {subtitle && <p className="auth-shell__subtitle">{subtitle}</p>}
      </div>
      <div className="auth-shell__panel">{children}</div>
    </div>
  )
}
