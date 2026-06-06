import { useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/auth'
import { buildRanking } from '../lib/ranking'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { Podium } from '../components/ui/Podium'
import { Alert } from '../components/ui/Alert'
import { useAppOutletContext } from '../hooks/useOutletContext'
import type { RankingEntry } from '../types/app'

export function RankingPage() {
  const { profile } = useAppOutletContext()
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

  if (loading) return <LoadingState />
  if (error) return <Alert variant="error">{error}</Alert>

  const top3 = ranking.slice(0, 3)

  return (
    <>
      <PageHeader
        title="ランキング"
        description="4イナム獲得するのは誰だ — 現在の順位表"
      />

      {ranking.length === 0 ? (
        <div className="card">
          <EmptyState title="まだランキングデータがありません" />
        </div>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="card card--hero">
              <h2>TOP 3</h2>
              <Podium
                entries={top3.map((r, i) => ({
                  rank: i + 1,
                  name: r.displayName,
                  points: r.totalPoints,
                  highlight: r.userId === profile.id,
                }))}
              />
            </div>
          )}

          <div className="card">
            <h2>全順位</h2>
            <div className="table-wrap">
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
                    <tr
                      key={r.userId}
                      className={r.userId === profile.id ? 'row--self' : undefined}
                    >
                      <td>{i + 1}</td>
                      <td>{r.displayName}</td>
                      <td>
                        <strong>{r.totalPoints}</strong>pt
                      </td>
                      <td>{r.championPredictionPoints}pt</td>
                      <td>{r.matchPredictionPoints}pt</td>
                      <td>{r.predictedChampionTeamName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
