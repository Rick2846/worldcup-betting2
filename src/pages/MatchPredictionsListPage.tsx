import { useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import { RESULT_LABELS, STAGE_LABELS } from '../types/app'
import type { Match, MatchPrediction, Profile } from '../types/database'

interface ListRow {
  profile: Profile
  predictionText: string | null
}

export function MatchPredictionsListPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [rows, setRows] = useState<ListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMatches() {
      try {
        const tournament = await getActiveTournament()
        if (!tournament) {
          setError('有効な大会が見つかりません')
          return
        }
        const { data, error: err } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournament.id)
          .order('match_datetime')
        if (err) throw err
        const list = data as Match[]
        setMatches(list)
        if (list.length > 0) setSelectedMatchId(list[0].id)
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    loadMatches()
  }, [])

  useEffect(() => {
    if (!selectedMatchId) return

    async function loadRows() {
      const match = matches.find((m) => m.id === selectedMatchId)
      if (!match) return

      const [profilesRes, predsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('display_name'),
        supabase
          .from('match_predictions')
          .select('*')
          .eq('match_id', selectedMatchId),
      ])

      if (profilesRes.error || predsRes.error) {
        setError(profilesRes.error?.message ?? predsRes.error?.message ?? '')
        return
      }

      const profiles = profilesRes.data as Profile[]
      const preds = predsRes.data as MatchPrediction[]
      const predByUser = new Map(preds.map((p) => [p.user_id, p]))

      setRows(
        profiles.map((profile) => {
          const pred = predByUser.get(profile.id)
          if (!pred) {
            return { profile, predictionText: null }
          }
          let text = `日本 ${pred.japan_score_prediction} - ${pred.opponent_score_prediction} ${match.opponent_team_name} / ${RESULT_LABELS[pred.predicted_result]}`
          if (pred.predict_penalty && pred.penalty_winner) {
            const winner =
              pred.penalty_winner === 'japan'
                ? '日本'
                : match.opponent_team_name
            text += `（PK：${winner}）`
          }
          return { profile, predictionText: text }
        }),
      )
    }
    loadRows()
  }, [selectedMatchId, matches])

  const selectedMatch = matches.find((m) => m.id === selectedMatchId)

  if (loading) return <p>読み込み中…</p>
  if (error) return <p className="error">{error}</p>

  if (matches.length === 0) {
    return (
      <div className="card">
        <h2>日本戦予想一覧</h2>
        <p className="muted">まだ試合が登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>日本戦予想一覧</h2>
      <div className="form-row">
        <label htmlFor="match">試合</label>
        <select
          id="match"
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              日本 vs {m.opponent_team_name}（{STAGE_LABELS[m.stage] ?? m.stage}）
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <h3>
          日本 vs {selectedMatch.opponent_team_name}
        </h3>
      )}

      <table className="list-table">
        <thead>
          <tr>
            <th>名前</th>
            <th>予想</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ profile, predictionText }) => (
            <tr key={profile.id}>
              <td>{profile.display_name}</td>
              <td>{predictionText ?? '未提出'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
