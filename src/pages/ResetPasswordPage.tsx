import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/ui/Alert'
import { LoadingState } from '../components/ui/LoadingState'
import { supabase } from '../lib/supabaseClient'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const hash = window.location.hash
    const isRecoveryLink =
      hash.includes('type=recovery') || hash.includes('access_token')

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
        setInvalidLink(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session || isRecoveryLink) {
        setReady(true)
        return
      }

      window.setTimeout(() => {
        if (cancelled) return
        supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
          if (cancelled) return
          if (retrySession || isRecoveryLink) {
            setReady(true)
          } else {
            setInvalidLink(true)
          }
        })
      }, 2000)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください')
      return
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    window.history.replaceState(null, '', window.location.pathname)
    setTimeout(() => navigate('/', { replace: true }), 2000)
  }

  if (invalidLink) {
    return (
      <AuthShell subtitle="パスワード再設定">
        <div className="card">
          <h2>リンクが無効です</h2>
          <Alert variant="error">
            リンクが無効か期限切れです。もう一度パスワード再設定メールを送信してください。
          </Alert>
          <Link to="/login" className="btn link-arrow">
            ログイン画面へ
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (!ready) {
    return (
      <AuthShell subtitle="パスワード再設定">
        <LoadingState label="リンクを確認中…" />
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell subtitle="パスワード再設定">
        <div className="card card--submitted">
          <h2>パスワードを更新しました</h2>
          <p className="muted">トップページへ移動します…</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell subtitle="新しいパスワードを設定">
      <div className="card">
        <h2>新しいパスワード</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="new-password">新しいパスワード</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="form-row">
            <label htmlFor="confirm-password">新しいパスワード（確認）</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '保存中…' : 'パスワードを保存'}
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/login" className="link-arrow">
            ログイン画面へ
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
