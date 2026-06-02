import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      <div className="container">
        <div className="card" style={{ maxWidth: 400, margin: '2rem auto' }}>
          <h1>パスワード再設定</h1>
          <p className="error">
            リンクが無効か期限切れです。もう一度パスワード再設定メールを送信してください。
          </p>
          <p>
            <Link to="/login">ログイン画面へ</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="container">
        <p>リンクを確認中…</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: 400, margin: '2rem auto' }}>
          <h1>パスワードを更新しました</h1>
          <p className="muted">トップページへ移動します…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: '2rem auto' }}>
        <h1>新しいパスワード</h1>
        <p className="muted">新しいパスワードを入力して保存してください。</p>
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
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '保存中…' : 'パスワードを保存'}
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/login">ログイン画面へ</Link>
        </p>
      </div>
    </div>
  )
}
