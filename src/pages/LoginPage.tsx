import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/ui/Alert'
import { supabase } from '../lib/supabaseClient'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingRecovery, setSendingRecovery] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    navigate('/', { replace: true })
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('メールアドレスを入力してから「再設定メールを送る」を押してください')
      return
    }
    setSendingRecovery(true)
    setError(null)
    setRecoverySent(false)

    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` },
    )

    setSendingRecovery(false)

    if (recoveryError) {
      setError(recoveryError.message)
      return
    }

    setRecoverySent(true)
  }

  return (
    <AuthShell subtitle="メンバー専用の予想サイトです">
      <div className="card">
        <h2>ログイン</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '処理中…' : 'ログイン'}
          </button>
        </form>
        <div className="btn-group">
          <button
            type="button"
            className="secondary"
            disabled={sendingRecovery}
            onClick={handleForgotPassword}
          >
            {sendingRecovery ? '送信中…' : 'パスワード再設定メールを送る'}
          </button>
        </div>
        {recoverySent && (
          <Alert variant="success">
            再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。
          </Alert>
        )}
      </div>
    </AuthShell>
  )
}
