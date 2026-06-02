import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    if (mode === 'signup' && !result.data.session) {
      setError('確認メールを送信しました。メールのリンクからログインしてください。')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: '2rem auto' }}>
        <h1>ログイン</h1>
        <p className="muted">身内メンバー専用のワールドカップ予想サイトです。</p>
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
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '処理中…' : mode === 'login' ? 'ログイン' : '新規登録'}
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="secondary"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? '初めての方は新規登録' : 'ログインに戻る'}
          </button>
        </p>
      </div>
    </div>
  )
}
