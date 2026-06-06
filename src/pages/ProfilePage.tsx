import { useState } from 'react'
import { useAppOutletContext } from '../hooks/useOutletContext'
import { supabase } from '../lib/supabaseClient'
import { Alert } from '../components/ui/Alert'
import { PageHeader } from '../components/ui/PageHeader'

export function ProfilePage() {
  const { profile, refreshProfile } = useAppOutletContext()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('名前を入力してください')
      return
    }
    if (trimmed.length > 30) {
      setError('名前は30文字以内にしてください')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', profile.id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await refreshProfile()
    setMessage('名前を更新しました。ランキングなどにも反映されます。')
  }

  return (
    <>
      <PageHeader
        title="表示名の設定"
        description="ランキングや予想一覧に表示される名前です"
      />

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="display-name">表示名</label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              required
              placeholder="例: 太郎"
            />
          </div>
          <p className="muted">現在: {profile.display_name}</p>
          {error && <Alert variant="error">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <button type="submit" disabled={loading}>
            {loading ? '保存中…' : '保存する'}
          </button>
        </form>
      </div>
    </>
  )
}
