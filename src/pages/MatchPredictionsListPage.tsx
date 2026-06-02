import { useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/auth'
import { formatDateTime, getReceptionStatus } from '../lib/date'
import {
  formatMatchPredictionText,
  getResultStatus,
  isDeadlinePassed,
} from '../lib/matches'
import { supabase } from '../lib/supabaseClient'
import { useAppOutletContext } from '../hooks/useOutletContext'
import { STAGE_LABELS } from '../types/app'
import type { Match, MatchPrediction, MatchResult, Profile } from '../types/database'

interface ListRow {
  profile: Profile
  displayText: string
}

function buildRows(
  profiles: Profile[],
  preds: MatchPrediction[],
  match: Match,
  currentUserId: string,
): ListRow[] {
  const predByUser = new Map(preds.map((p) => [p.user_id, p]))
  const deadlinePassed = isDeadlinePassed(match.prediction_deadline)

  return profiles.map((profile) => {
    const pred = predByUser.get(profile.id)
    const isSelf = profile.id === currentUserId

    if (isSelf) {
      return {
        profile,
        displayText: pred
          ? formatMatchPredictionText(pred, match)
          : '未提出',
      }
    }

    if (!deadlinePassed) {
      return { profile, displayText: '締切後に公開' }
    }

    return {
      profile,
      displayText: pred ? formatMatchPredictionText(pred, match) : '未提出',
    }
  })
}

export function MatchPredictionsListPage() {
  const { profile } = useAppOutletContext()
  const [matches, setMatches] = useState<Match[]>([])
  const [resultMatchIds, setResultMatchIds] = useState<Set<string>>(new Set())
  const [rowsByMatch, setRowsByMatch] = useState<Record<string, ListRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const tournament = await getActiveTournament()
        if (!tournament) {
          setError('有効な大会が見つかりません')
          return
        }

        const [matchesRes, resultsRes, profilesRes] = await Promise.all([
          supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('match_datetime'),
          supabase.from('match_results').select('match_id'),
          supabase.from('profiles').select('*').order('display_name'),
        ])

        if (matchesRes.error) throw matchesRes.error
        if (resultsRes.error) throw resultsRes.error
        if (profilesRes.error) throw profilesRes.error

        const matchList = matchesRes.data as Match[]
        const profileList = profilesRes.data as Profile[]
        const resultIds = new Set(
          (resultsRes.data as Pick<MatchResult, 'match_id'>[]).map((r) => r.match_id),
        )

        setMatches(matchList)
        setResultMatchIds(resultIds)

        if (matchList.length === 0) return

        const matchIds = matchList.map((m) => m.id)
        const predsRes = await supabase
          .from('match_predictions')
          .select('*')
          .in('match_id', matchIds)

        if (predsRes.error) throw predsRes.error

        const allPreds = predsRes.data as MatchPrediction[]
        const byMatch: Record<string, ListRow[]> = {}

        for (const match of matchList) {
          const preds = allPreds.filter((p) => p.match_id === match.id)
          byMatch[match.id] = buildRows(profileList, preds, match, profile.id)
        }

        setRowsByMatch(byMatch)
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile.id])

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
    <>
      <h2>日本戦予想一覧</h2>
      {matches.map((match) => (
        <div key={match.id} className="card match-section">
          <h3>日本 vs {match.opponent_team_name}</h3>
          <ul className="match-meta-list">
            <li>ステージ: {STAGE_LABELS[match.stage] ?? match.stage}</li>
            <li>試合日時: {formatDateTime(match.match_datetime)}</li>
            <li>予想締切: {formatDateTime(match.prediction_deadline)}</li>
            <li>受付: {getReceptionStatus(match.prediction_deadline)}</li>
            <li>{getResultStatus(resultMatchIds.has(match.id))}</li>
          </ul>

          <table className="list-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>予想</th>
              </tr>
            </thead>
            <tbody>
              {(rowsByMatch[match.id] ?? []).map(({ profile: p, displayText }) => (
                <tr key={p.id}>
                  <td>{p.display_name}</td>
                  <td>{displayText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}
