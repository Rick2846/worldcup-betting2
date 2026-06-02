import { useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/auth'
import { buildRanking } from '../lib/ranking'
import type { RankingEntry } from '../types/app'

export function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
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
        setRanking(await buildRanking(tournament.id))
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p>読み込み中…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="card">
      <h2>ランキング</h2>
      <table className="list-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>名前</th>
            <th>合計</th>
            <th>優勝国</th>
            <th>日本戦</th>
            <th>予想国</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.userId}>
              <td>{i + 1}</td>
              <td>{r.displayName}</td>
              <td>{r.totalPoints}pt</td>
              <td>{r.championPredictionPoints}pt</td>
              <td>{r.matchPredictionPoints}pt</td>
              <td>{r.predictedChampionTeamName ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
